const API_BASE = '/api/v1';

export async function getDeviceId(): Promise<string> {
  const stored = localStorage.getItem('device_id');
  if (stored) return stored;
  
  const { default: FingerprintJS } = await import('@fingerprintjs/fingerprintjs');
  const fp = await FingerprintJS.load();
  const result = await fp.get();
  localStorage.setItem('device_id', result.visitorId);
  return result.visitorId;
}

async function handleResponse(response: Response) {
  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    const errorMessage = typeof data.detail === 'string' 
      ? data.detail 
      : data.detail?.error || data.detail?.message || 'Request failed';
    throw new Error(errorMessage);
  }
  return response.json();
}

export async function createInterview(data: {
  job_title: string;
  job_requirements: string;
  key_skills: string[];
}) {
  const deviceId = await getDeviceId();
  const response = await fetch(`${API_BASE}/interviews`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Device-Id': deviceId,
    },
    body: JSON.stringify(data),
  });
  return handleResponse(response);
}

export async function getInterview(id: string) {
  const response = await fetch(`${API_BASE}/interviews/${id}`);
  return handleResponse(response);
}

export async function submitAnswers(interviewId: string, data: {
  candidate_name: string;
  candidate_email: string;
  answers: Array<{ question_id: number; answer: string }>;
}) {
  const response = await fetch(`${API_BASE}/interviews/${interviewId}/submit`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });
  return handleResponse(response);
}

export async function getResults(interviewId: string, code: string) {
  const response = await fetch(`${API_BASE}/interviews/${interviewId}/results?code=${code}`);
  return handleResponse(response);
}

export async function createCheckout(productId: string) {
  const deviceId = await getDeviceId();
  const response = await fetch(`${API_BASE}/payment/checkout`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Device-Id': deviceId,
    },
    body: JSON.stringify({
      product_id: productId,
      success_url: `${window.location.origin}/payment/success`,
      cancel_url: `${window.location.origin}/pricing`,
    }),
  });
  return handleResponse(response);
}
