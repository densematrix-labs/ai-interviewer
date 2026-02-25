import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { CheckCircle, ArrowRight } from 'lucide-react';

export default function PaymentSuccessPage() {
  const { t } = useTranslation();

  return (
    <div className="py-20 px-4">
      <div className="max-w-md mx-auto text-center">
        <div className="w-20 h-20 bg-primary-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircle className="w-10 h-10 text-primary-400" />
        </div>
        
        <h1 className="text-3xl font-bold mb-4">Payment Successful!</h1>
        <p className="text-surface-300 mb-8">
          Thank you for your purchase. Your interviews have been added to your account.
        </p>

        <Link to="/create" className="btn-primary inline-flex">
          Create Interview <ArrowRight className="w-5 h-5" />
        </Link>
      </div>
    </div>
  );
}
