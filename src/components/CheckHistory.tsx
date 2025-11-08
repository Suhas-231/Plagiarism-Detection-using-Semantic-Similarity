import { useState, useEffect } from 'react';
import { supabase, type PlagiarismCheck, type Document, type SimilarityResult } from '../lib/supabase';
import { Calendar, TrendingUp } from 'lucide-react';

type Props = {
  checks: PlagiarismCheck[];
  documents: Document[];
};

type CheckWithResults = PlagiarismCheck & {
  results: SimilarityResult[];
};

export function CheckHistory({ checks, documents }: Props) {
  const [selectedCheck, setSelectedCheck] = useState<CheckWithResults | null>(null);
  const [loading, setLoading] = useState(false);

  const loadCheckResults = async (check: PlagiarismCheck) => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('similarity_results')
        .select('*')
        .eq('check_id', check.id)
        .order('similarity_score', { ascending: false });

      if (error) throw error;

      setSelectedCheck({
        ...check,
        results: data || []
      });
    } catch (error) {
      console.error('Error loading results:', error);
    } finally {
      setLoading(false);
    }
  };

  const getSeverityColor = (score: number) => {
    if (score >= 70) return 'text-red-600';
    if (score >= 40) return 'text-orange-600';
    return 'text-green-600';
  };

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-slate-900 mb-2">Check History</h2>
        <p className="text-slate-600">
          View your past plagiarism checks and results
        </p>
      </div>

      {checks.length === 0 ? (
        <div className="text-center py-12 bg-slate-50 rounded-lg border-2 border-dashed border-slate-300">
          <p className="text-slate-600">No checks yet. Run your first plagiarism check to see results here.</p>
        </div>
      ) : (
        <div className="grid lg:grid-cols-2 gap-6">
          <div className="space-y-3">
            <h3 className="font-semibold text-slate-900 mb-3">All Checks</h3>
            {checks.map((check) => (
              <div
                key={check.id}
                onClick={() => loadCheckResults(check)}
                className={`p-4 border rounded-lg cursor-pointer transition ${
                  selectedCheck?.id === check.id
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-slate-200 hover:border-slate-300 bg-white'
                }`}
              >
                <div className="flex justify-between items-start mb-2">
                  <div className="flex items-center space-x-2 text-xs text-slate-500">
                    <Calendar className="w-4 h-4" />
                    <span>{new Date(check.created_at).toLocaleString()}</span>
                  </div>
                  {check.status === 'completed' && (
                    <div className="flex items-center space-x-1">
                      <TrendingUp className="w-4 h-4" />
                      <span className={`font-bold ${getSeverityColor(check.overall_similarity_score)}`}>
                        {check.overall_similarity_score.toFixed(1)}%
                      </span>
                    </div>
                  )}
                </div>
                <p className="text-sm text-slate-700 line-clamp-2">
                  {check.checked_content.substring(0, 150)}...
                </p>
                <div className="mt-2">
                  <span className={`text-xs px-2 py-1 rounded ${
                    check.status === 'completed'
                      ? 'bg-green-100 text-green-700'
                      : check.status === 'processing'
                      ? 'bg-blue-100 text-blue-700'
                      : 'bg-red-100 text-red-700'
                  }`}>
                    {check.status}
                  </span>
                </div>
              </div>
            ))}
          </div>

          <div>
            <h3 className="font-semibold text-slate-900 mb-3">Details</h3>
            {loading ? (
              <div className="text-center py-12">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-blue-600 border-t-transparent"></div>
              </div>
            ) : selectedCheck ? (
              <div className="bg-white border border-slate-200 rounded-lg p-6">
                <div className="mb-4">
                  <h4 className="text-sm font-medium text-slate-700 mb-2">Checked Content</h4>
                  <p className="text-sm text-slate-600 bg-slate-50 p-3 rounded max-h-40 overflow-y-auto">
                    {selectedCheck.checked_content}
                  </p>
                </div>

                <div className="mb-4">
                  <h4 className="text-sm font-medium text-slate-700 mb-2">Overall Score</h4>
                  <div className={`text-3xl font-bold ${getSeverityColor(selectedCheck.overall_similarity_score)}`}>
                    {selectedCheck.overall_similarity_score.toFixed(1)}%
                  </div>
                </div>

                {selectedCheck.results.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium text-slate-700 mb-3">
                      Matches ({selectedCheck.results.length})
                    </h4>
                    <div className="space-y-3">
                      {selectedCheck.results.map((result) => {
                        const doc = documents.find(d => d.id === result.compared_document_id);
                        if (!doc) return null;

                        return (
                          <div key={result.id} className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                            <div className="flex justify-between items-start mb-2">
                              <p className="font-medium text-sm">{doc.title}</p>
                              <span className={`font-bold ${getSeverityColor(result.similarity_score)}`}>
                                {result.similarity_score.toFixed(1)}%
                              </span>
                            </div>
                            {result.matching_segments && Array.isArray(result.matching_segments) && result.matching_segments.length > 0 && (
                              <p className="text-xs text-slate-600">
                                {result.matching_segments.length} matching segment(s) found
                              </p>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="bg-slate-50 border-2 border-dashed border-slate-300 rounded-lg p-12 text-center">
                <p className="text-slate-600">Select a check to view details</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
