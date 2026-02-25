import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import { getInterview, submitAnswers } from '../lib/api';

interface Question {
  id: number;
  text: string;
}

interface InterviewData {
  id: string;
  job_title: string;
  questions: Question[];
}

export default function InterviewPage() {
  const { id } = useParams<{ id: string }>();
  const { t } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [interview, setInterview] = useState<InterviewData | null>(null);
  const [submitted, setSubmitted] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    answers: {} as Record<number, string>,
  });

  useEffect(() => {
    const fetchInterview = async () => {
      try {
        const data = await getInterview(id!);
        setInterview(data);
        // Initialize answers
        const initialAnswers: Record<number, string> = {};
        data.questions.forEach((q: Question) => {
          initialAnswers[q.id] = '';
        });
        setFormData(prev => ({ ...prev, answers: initialAnswers }));
      } catch (err) {
        setError(err instanceof Error ? err.message : t('interview.error.notFound'));
      } finally {
        setLoading(false);
      }
    };
    fetchInterview();
  }, [id, t]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const answers = Object.entries(formData.answers).map(([qId, answer]) => ({
        question_id: parseInt(qId),
        answer,
      }));

      await submitAnswers(id!, {
        candidate_name: formData.name,
        candidate_email: formData.email,
        answers,
      });

      setSubmitted(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Submission failed');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="py-20 flex justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-green-500" />
      </div>
    );
  }

  if (error && !interview) {
    return (
      <div className="py-20 px-4">
        <div className="max-w-md mx-auto text-center">
          <AlertCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
          <h1 className="text-2xl font-bold mb-2">{t('interview.error.notFound')}</h1>
          <p className="text-zinc-400">{error}</p>
        </div>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="py-20 px-4">
        <div className="max-w-md mx-auto text-center">
          <CheckCircle className="w-16 h-16 text-green-400 mx-auto mb-4" />
          <h1 className="text-2xl font-bold mb-2">{t('interview.success.title')}</h1>
          <p className="text-zinc-400">{t('interview.success.message')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="py-12 px-4">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2">{t('interview.title')}</h1>
          <p className="text-xl text-green-400">
            {t('interview.for')}: {interview?.job_title}
          </p>
          <p className="text-zinc-400 mt-4">{t('interview.instructions')}</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="p-4 bg-red-500/20 border border-red-500/30 rounded-lg text-red-400">
              {error}
            </div>
          )}

          {/* Candidate Info */}
          <div className="card">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">{t('interview.yourName')}</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="input"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">{t('interview.yourEmail')}</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="input"
                  required
                />
              </div>
            </div>
          </div>

          {/* Questions */}
          {interview?.questions.map((question, index) => (
            <div key={question.id} className="card">
              <label className="block mb-3">
                <span className="text-green-400 font-semibold">{t('interview.question')} {index + 1}</span>
                <p className="text-lg mt-1">{question.text}</p>
              </label>
              <textarea
                value={formData.answers[question.id] || ''}
                onChange={(e) => setFormData({
                  ...formData,
                  answers: { ...formData.answers, [question.id]: e.target.value }
                })}
                placeholder={t('interview.answerPlaceholder')}
                className="textarea h-32"
                required
              />
            </div>
          ))}

          <button type="submit" disabled={submitting} className="btn-primary w-full">
            {submitting ? (
              <><Loader2 className="w-5 h-5 animate-spin" /> {t('interview.submitting')}</>
            ) : (
              t('interview.submit')
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
