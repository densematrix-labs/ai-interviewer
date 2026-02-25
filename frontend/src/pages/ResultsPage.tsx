import { useState, useEffect } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Loader2, AlertCircle, Users, ThumbsUp, HelpCircle, ThumbsDown, ChevronDown, ChevronUp } from 'lucide-react';
import { getResults } from '../lib/api';

interface Submission {
  id: string;
  candidate_name: string;
  candidate_email: string;
  overall_score: number;
  recommendation: string;
  ai_summary: string;
  scores: Array<{ question_id: number; score: number; comment: string }>;
  answers: Array<{ question_id: number; answer: string }>;
  submitted_at: string;
}

interface ResultsData {
  interview: {
    id: string;
    job_title: string;
    job_requirements: string;
    questions: Array<{ id: number; text: string; expected_focus: string }>;
    created_at: string;
  };
  submissions: Submission[];
  summary: {
    total: number;
    recommended: number;
    maybe: number;
    not_recommended: number;
  };
}

export default function ResultsPage() {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const code = searchParams.get('code') || '';
  const { t } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<ResultsData | null>(null);
  const [expandedCandidates, setExpandedCandidates] = useState<Set<string>>(new Set());

  useEffect(() => {
    const fetchResults = async () => {
      try {
        const data = await getResults(id!, code);
        setResults(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : t('results.accessDenied'));
      } finally {
        setLoading(false);
      }
    };
    fetchResults();
  }, [id, code, t]);

  const toggleCandidate = (candidateId: string) => {
    const newExpanded = new Set(expandedCandidates);
    if (newExpanded.has(candidateId)) {
      newExpanded.delete(candidateId);
    } else {
      newExpanded.add(candidateId);
    }
    setExpandedCandidates(newExpanded);
  };

  const getRecommendationBadge = (rec: string) => {
    switch (rec) {
      case 'recommend':
        return <span className="badge badge-recommend"><ThumbsUp className="w-4 h-4 mr-1" /> {t('results.recommended')}</span>;
      case 'maybe':
        return <span className="badge badge-maybe"><HelpCircle className="w-4 h-4 mr-1" /> {t('results.maybe')}</span>;
      case 'not_recommended':
        return <span className="badge badge-not-recommended"><ThumbsDown className="w-4 h-4 mr-1" /> {t('results.notRecommended')}</span>;
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className="py-20 flex justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="py-20 px-4">
        <div className="max-w-md mx-auto text-center">
          <AlertCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
          <h1 className="text-2xl font-bold mb-2">{t('results.accessDenied')}</h1>
          <p className="text-surface-300">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2">{t('results.title')}</h1>
          <p className="text-xl text-primary-400">{results?.interview.job_title}</p>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="card text-center">
            <Users className="w-8 h-8 text-surface-300 mx-auto mb-2" />
            <div className="text-2xl font-bold">{results?.summary.total}</div>
            <div className="text-sm text-surface-300">{t('results.totalCandidates')}</div>
          </div>
          <div className="card text-center">
            <ThumbsUp className="w-8 h-8 text-primary-400 mx-auto mb-2" />
            <div className="text-2xl font-bold text-primary-400">{results?.summary.recommended}</div>
            <div className="text-sm text-surface-300">{t('results.recommended')}</div>
          </div>
          <div className="card text-center">
            <HelpCircle className="w-8 h-8 text-yellow-400 mx-auto mb-2" />
            <div className="text-2xl font-bold text-yellow-400">{results?.summary.maybe}</div>
            <div className="text-sm text-surface-300">{t('results.maybe')}</div>
          </div>
          <div className="card text-center">
            <ThumbsDown className="w-8 h-8 text-red-400 mx-auto mb-2" />
            <div className="text-2xl font-bold text-red-400">{results?.summary.not_recommended}</div>
            <div className="text-sm text-surface-300">{t('results.notRecommended')}</div>
          </div>
        </div>

        {/* Candidates List */}
        {results?.submissions.length === 0 ? (
          <div className="card text-center py-12">
            <Users className="w-12 h-12 text-surface-300 mx-auto mb-4" />
            <p className="text-surface-300">{t('results.noCandidates')}</p>
          </div>
        ) : (
          <div className="space-y-4">
            {results?.submissions.map((submission, rank) => (
              <div key={submission.id} className="card">
                <div
                  className="flex items-center justify-between cursor-pointer"
                  onClick={() => toggleCandidate(submission.id)}
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-surface-800 rounded-full flex items-center justify-center font-bold">
                      #{rank + 1}
                    </div>
                    <div>
                      <h3 className="font-semibold">{submission.candidate_name}</h3>
                      <p className="text-sm text-surface-300">{submission.candidate_email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <div className="text-2xl font-bold">{submission.overall_score.toFixed(1)}</div>
                      <div className="text-xs text-surface-300">{t('results.score')}</div>
                    </div>
                    {getRecommendationBadge(submission.recommendation)}
                    {expandedCandidates.has(submission.id) ? (
                      <ChevronUp className="w-5 h-5 text-surface-300" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-surface-300" />
                    )}
                  </div>
                </div>

                {expandedCandidates.has(submission.id) && (
                  <div className="mt-6 pt-6 border-t border-surface-800">
                    {/* AI Summary */}
                    <div className="mb-6">
                      <h4 className="text-sm font-medium text-surface-300 mb-2">{t('results.aiSummary')}</h4>
                      <p className="p-4 bg-surface-800 rounded-lg">{submission.ai_summary}</p>
                    </div>

                    {/* Answers & Scores */}
                    <div>
                      <h4 className="text-sm font-medium text-surface-300 mb-3">{t('results.answers')}</h4>
                      <div className="space-y-4">
                        {results.interview.questions.map((q) => {
                          const answer = submission.answers.find(a => a.question_id === q.id);
                          const score = submission.scores.find(s => s.question_id === q.id);
                          return (
                            <div key={q.id} className="p-4 bg-surface-800 rounded-lg">
                              <div className="flex justify-between items-start mb-2">
                                <span className="text-sm text-primary-400 font-medium">Q{q.id}: {q.text}</span>
                                {score && (
                                  <span className="text-sm font-bold px-2 py-1 bg-surface-700 rounded">
                                    {score.score}/5
                                  </span>
                                )}
                              </div>
                              <p className="text-surface-200 mb-2">{answer?.answer || '-'}</p>
                              {score?.comment && (
                                <p className="text-sm text-surface-400 italic">AI: {score.comment}</p>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
