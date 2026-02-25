import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Loader2, Copy, Check, ExternalLink } from 'lucide-react';
import { createInterview } from '../lib/api';

interface InterviewResult {
  id: string;
  hr_access_code: string;
  interview_url: string;
  results_url: string;
  questions: Array<{ id: number; text: string }>;
}

export default function CreatePage() {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<InterviewResult | null>(null);
  const [copiedLink, setCopiedLink] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    jobTitle: '',
    requirements: '',
    skills: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const data = await createInterview({
        job_title: formData.jobTitle,
        job_requirements: formData.requirements,
        key_skills: formData.skills.split(',').map(s => s.trim()).filter(Boolean),
      });
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create interview');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = async (text: string, label: string) => {
    await navigator.clipboard.writeText(text);
    setCopiedLink(label);
    setTimeout(() => setCopiedLink(null), 2000);
  };

  if (result) {
    const baseUrl = window.location.origin;
    const candidateLink = `${baseUrl}/interview/${result.id}`;
    const resultsLink = `${baseUrl}/results/${result.id}?code=${result.hr_access_code}`;

    return (
      <div className="py-12 px-4">
        <div className="max-w-2xl mx-auto">
          <div className="card">
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <Check className="w-8 h-8 text-green-400" />
              </div>
              <h1 className="text-2xl font-bold">{t('create.success.title')}</h1>
            </div>

            <div className="space-y-6">
              {/* Candidate Link */}
              <div>
                <label className="block text-sm font-medium text-zinc-400 mb-2">
                  {t('create.success.candidateLink')}
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={candidateLink}
                    readOnly
                    className="input flex-1 font-mono text-sm"
                  />
                  <button
                    onClick={() => copyToClipboard(candidateLink, 'candidate')}
                    className="btn-secondary flex items-center gap-2 whitespace-nowrap"
                  >
                    {copiedLink === 'candidate' ? (
                      <><Check className="w-4 h-4" /> {t('create.success.copied')}</>
                    ) : (
                      <><Copy className="w-4 h-4" /> {t('create.success.copyLink')}</>
                    )}
                  </button>
                </div>
              </div>

              {/* Results Link */}
              <div>
                <label className="block text-sm font-medium text-zinc-400 mb-2">
                  {t('create.success.resultsLink')}
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={resultsLink}
                    readOnly
                    className="input flex-1 font-mono text-sm"
                  />
                  <button
                    onClick={() => copyToClipboard(resultsLink, 'results')}
                    className="btn-secondary flex items-center gap-2 whitespace-nowrap"
                  >
                    {copiedLink === 'results' ? (
                      <><Check className="w-4 h-4" /> {t('create.success.copied')}</>
                    ) : (
                      <><Copy className="w-4 h-4" /> {t('create.success.copyLink')}</>
                    )}
                  </button>
                </div>
              </div>

              {/* Generated Questions Preview */}
              <div>
                <h3 className="text-sm font-medium text-zinc-400 mb-3">Generated Questions:</h3>
                <div className="space-y-2">
                  {result.questions.map((q, i) => (
                    <div key={i} className="p-3 bg-zinc-800 rounded-lg text-sm">
                      <span className="text-green-400 font-medium">Q{q.id}:</span> {q.text}
                    </div>
                  ))}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-4 pt-4">
                <a
                  href={candidateLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-secondary flex-1 justify-center"
                >
                  Preview Interview <ExternalLink className="w-4 h-4" />
                </a>
                <button
                  onClick={() => {
                    setResult(null);
                    setFormData({ jobTitle: '', requirements: '', skills: '' });
                  }}
                  className="btn-primary flex-1"
                >
                  Create Another
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold mb-8 text-center">{t('create.title')}</h1>

        <form onSubmit={handleSubmit} className="card space-y-6">
          {error && (
            <div className="p-4 bg-red-500/20 border border-red-500/30 rounded-lg text-red-400">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium mb-2">{t('create.jobTitle')}</label>
            <input
              type="text"
              value={formData.jobTitle}
              onChange={(e) => setFormData({ ...formData, jobTitle: e.target.value })}
              placeholder={t('create.jobTitlePlaceholder')}
              className="input"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">{t('create.requirements')}</label>
            <textarea
              value={formData.requirements}
              onChange={(e) => setFormData({ ...formData, requirements: e.target.value })}
              placeholder={t('create.requirementsPlaceholder')}
              className="textarea h-32"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">{t('create.skills')}</label>
            <input
              type="text"
              value={formData.skills}
              onChange={(e) => setFormData({ ...formData, skills: e.target.value })}
              placeholder={t('create.skillsPlaceholder')}
              className="input"
            />
          </div>

          <button type="submit" disabled={loading} className="btn-primary w-full">
            {loading ? (
              <><Loader2 className="w-5 h-5 animate-spin" /> {t('create.generating')}</>
            ) : (
              t('create.submit')
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
