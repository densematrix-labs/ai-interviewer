from fastapi import APIRouter, Depends, HTTPException, Header, Request
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from pydantic import BaseModel
import httpx
import hmac
import hashlib
import json
from app.database import get_db
from app.config import get_settings
from app.models.interview import TokenBalance, PaymentTransaction
from app.metrics import payment_success, payment_revenue_cents, tokens_consumed

router = APIRouter(prefix="/payment", tags=["payment"])
settings = get_settings()

# Product configurations
PRODUCTS = {
    "starter": {"interviews": 10, "price_cents": 499},
    "pro": {"interviews": 50, "price_cents": 999},
    "unlimited": {"interviews": 999, "price_cents": 1999}  # Monthly subscription
}

class CheckoutRequest(BaseModel):
    product_id: str
    success_url: str
    cancel_url: str

class TokenBalanceResponse(BaseModel):
    balance: int
    free_trials_remaining: int

@router.post("/checkout")
async def create_checkout(
    request: CheckoutRequest,
    x_device_id: str = Header(...),
    db: AsyncSession = Depends(get_db)
):
    """Create a Creem checkout session."""
    if not settings.CREEM_API_KEY:
        raise HTTPException(status_code=503, detail="Payment service not configured")
    
    product_ids = json.loads(settings.CREEM_PRODUCT_IDS) if settings.CREEM_PRODUCT_IDS else {}
    creem_product_id = product_ids.get(request.product_id)
    
    if not creem_product_id:
        raise HTTPException(status_code=400, detail="Invalid product")
    
    async with httpx.AsyncClient() as client:
        response = await client.post(
            "https://api.creem.io/v1/checkouts",
            headers={
                "Authorization": f"Bearer {settings.CREEM_API_KEY}",
                "Content-Type": "application/json"
            },
            json={
                "product_id": creem_product_id,
                "success_url": request.success_url,
                "cancel_url": request.cancel_url,
                "metadata": {
                    "device_id": x_device_id,
                    "product_key": request.product_id
                }
            }
        )
        
        if response.status_code != 200:
            raise HTTPException(status_code=500, detail="Failed to create checkout")
        
        data = response.json()
        
        # Record transaction
        transaction = PaymentTransaction(
            device_id=x_device_id,
            checkout_id=data.get("id"),
            product_id=request.product_id,
            amount_cents=PRODUCTS.get(request.product_id, {}).get("price_cents", 0),
            status="pending"
        )
        db.add(transaction)
        await db.commit()
        
        return {"checkout_url": data.get("checkout_url")}

@router.post("/webhook")
async def handle_webhook(request: Request, db: AsyncSession = Depends(get_db)):
    """Handle Creem webhook events."""
    body = await request.body()
    signature = request.headers.get("creem-signature", "")
    
    # Verify signature
    if settings.CREEM_WEBHOOK_SECRET:
        expected = hmac.new(
            settings.CREEM_WEBHOOK_SECRET.encode(),
            body,
            hashlib.sha256
        ).hexdigest()
        if not hmac.compare_digest(signature, expected):
            raise HTTPException(status_code=401, detail="Invalid signature")
    
    data = json.loads(body)
    event_type = data.get("type")
    
    if event_type == "checkout.completed":
        checkout = data.get("data", {})
        checkout_id = checkout.get("id")
        metadata = checkout.get("metadata", {})
        device_id = metadata.get("device_id")
        product_key = metadata.get("product_key")
        
        if not device_id or not product_key:
            return {"status": "ignored", "reason": "missing metadata"}
        
        # Update transaction
        tx_result = await db.execute(
            select(PaymentTransaction).where(PaymentTransaction.checkout_id == checkout_id)
        )
        transaction = tx_result.scalar_one_or_none()
        if transaction:
            transaction.status = "completed"
        
        # Add tokens
        product = PRODUCTS.get(product_key, {})
        interviews_to_add = product.get("interviews", 0)
        
        result = await db.execute(
            select(TokenBalance).where(TokenBalance.device_id == device_id)
        )
        balance = result.scalar_one_or_none()
        
        if not balance:
            balance = TokenBalance(device_id=device_id, balance=interviews_to_add)
            db.add(balance)
        else:
            balance.balance += interviews_to_add
        
        await db.commit()
        
        # Record metrics
        payment_success.labels(tool="ai-interviewer", product_sku=product_key).inc()
        payment_revenue_cents.labels(tool="ai-interviewer").inc(product.get("price_cents", 0))
        
        return {"status": "success", "interviews_added": interviews_to_add}
    
    return {"status": "ignored", "event": event_type}

@router.get("/tokens", response_model=TokenBalanceResponse)
async def get_token_balance(
    x_device_id: str = Header(...),
    db: AsyncSession = Depends(get_db)
):
    """Get current token balance for a device."""
    result = await db.execute(
        select(TokenBalance).where(TokenBalance.device_id == device_id)
    )
    balance = result.scalar_one_or_none()
    
    if not balance:
        return TokenBalanceResponse(balance=0, free_trials_remaining=1)
    
    free_remaining = max(0, 1 - balance.free_trial_used)
    return TokenBalanceResponse(balance=balance.balance, free_trials_remaining=free_remaining)
