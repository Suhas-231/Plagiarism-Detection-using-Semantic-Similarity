import { useState } from 'react';
import { supabase, type Document } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { Search, AlertCircle } from 'lucide-react';

type Props = {
  documents: Document[];
  onCheckComplete: () => void;
};

type CheckResult = {
  document_id: string;
  similarity_score: number;
  matching_segments: any[];
};

export function PlagiarismChecker({ documents, onCheckComplete }: Props) {
  const { user } = useAuth();
  const [textToCheck, setTextToCheck] = useState('');
  const [checking, setChecking] = useState(false);
  const [results, setResults] = useState<CheckResult[]>([]);
  const [overallScore, setOverallScore] = useState<number | null>(null);

  const handleCheck = async () => {
    if (!user || !textToCheck.trim()) return;

    setChecking(true);
    setResults([]);
    setOverallScore(null);

    try {
      const { data: checkData, error: checkError } = await supabase
        .from('plagiarism_checks')
        .insert({
          user_id: user.id,
          checked_content: textToCheck,
          status: 'processing'
        })
        .select()
        .single();

      if (checkError) throw checkError;

      const response = await fetch('http://localhost:5000/api/compare', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          source: textToCheck,
          documents: documents.map(doc => ({
            id: doc.id,
            content: doc.content
          }))
        })
      });

      if (!response.ok) {
        throw new Error('Failed to check plagiarism');
      }

      const data = await response.json();
      setResults(data.results);
      setOverallScore(data.overall_similarity_score);

      await supabase
        .from('plagiarism_checks')
        .update({
          overall_similarity_score: data.overall_similarity_score,
          status: 'completed'
        })
        .eq('id', checkData.id);

      const similarityInserts = data.results
        .filter((r: CheckResult) => r.similarity_score > 0)
        .map((r: CheckResult) => ({
          check_id: checkData.id,
          compared_document_id: r.document_id,
          similarity_score: r.similarity_score,
          matching_segments: r.matching_segments
        }));

      if (similarityInserts.length > 0) {
        await supabase.from('similarity_results').insert(similarityInserts);
      }

      onCheckComplete();
    } catch (error) {
      console.error('Error checking plagiarism:', error);
      alert('Failed to check plagiarism. Make sure the Flask backend is running on http://localhost:5000');
    } finally {
      setChecking(false);
    }
  };

  const getSeverityColor = (score: number) => {
    if (score >= 70) return 'text-red-600 bg-red-50 border-red-200';
    if (score >= 40) return 'text-orange-600 bg-orange-50 border-orange-200';
    return 'text-green-600 bg-green-50 border-green-200';
  };

  const getSeverityLabel = (score: number) => {
    if (score >= 70) return 'High Similarity';
    if (score >= 40) return 'Moderate Similarity';
    return 'Low Similarity';
  };

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-slate-900 mb-2">Check for Plagiarism</h2>
        <p className="text-slate-600">
          Enter text to check against your document library
        </p>
      </div>

      <div className="space-y-6">
        <div>
          <label htmlFor="textToCheck" className="block text-sm font-medium text-slate-700 mb-2">
            Text to Check
          </label>
          <textarea
            id="textToCheck"
            value={textToCheck}
            onChange={(e) => setTextToCheck(e.target.value)}
            rows={8}
            className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none resize-none"
            placeholder="Paste the text you want to check for plagiarism..."
          />
        </div>

        <button
          onClick={handleCheck}
          disabled={checking || !textToCheck.trim() || documents.length === 0}
          className="flex items-center space-x-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Search className="w-5 h-5" />
          <span>{checking ? 'Checking...' : 'Check Plagiarism'}</span>
        </button>

        {documents.length === 0 && (
          <div className="flex items-start space-x-3 p-4 bg-amber-50 border border-amber-200 rounded-lg">
            <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5" />
            <div className="text-sm text-amber-800">
              <p className="font-medium">No documents available</p>
              <p>Add documents to your library first to check for plagiarism.</p>
            </div>
          </div>
        )}

        {overallScore !== null && (
          <div className="mt-8">
            <div className={`p-6 rounded-lg border-2 ${getSeverityColor(overallScore)}`}>
              <h3 className="text-lg font-bold mb-2">Overall Similarity Score</h3>
              <div className="flex items-baseline space-x-2">
                <span className="text-4xl font-bold">{overallScore.toFixed(1)}%</span>
                <span className="text-sm font-medium">{getSeverityLabel(overallScore)}</span>
              </div>
            </div>

            <div className="mt-6">
              <h3 className="text-lg font-bold text-slate-900 mb-4">
                Detailed Results ({results.length} documents checked)
              </h3>
              <div className="space-y-3">
                {results.map((result) => {
                  const doc = documents.find(d => d.id === result.document_id);
                  if (!doc) return null;

                  return (
                    <div
                      key={result.document_id}
                      className={`p-4 rounded-lg border ${getSeverityColor(result.similarity_score)}`}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="font-semibold">{doc.title}</h4>
                        <span className="text-lg font-bold">{result.similarity_score.toFixed(1)}%</span>
                      </div>
                      {result.matching_segments.length > 0 && (
                        <div className="mt-3">
                          <p className="text-xs font-medium mb-2">
                            Found {result.matching_segments.length} matching segment(s)
                          </p>
                          <div className="space-y-2">
                            {result.matching_segments.slice(0, 3).map((segment, idx) => (
                              <div key={idx} className="text-xs bg-white bg-opacity-50 p-2 rounded">
                                <p className="font-medium">Match: {(segment.similarity * 100).toFixed(0)}%</p>
                                <p className="italic mt-1">"{segment.source_segment}"</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
