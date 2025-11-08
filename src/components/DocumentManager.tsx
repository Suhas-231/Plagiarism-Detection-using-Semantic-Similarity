import { useState } from 'react';
import { supabase, type Document } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { Plus, Trash2, Calendar } from 'lucide-react';

type Props = {
  documents: Document[];
  onUpdate: () => void;
};

export function DocumentManager({ documents, onUpdate }: Props) {
  const { user } = useAuth();
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from('documents')
        .insert({ user_id: user.id, title, content });

      if (error) throw error;

      setTitle('');
      setContent('');
      setShowForm(false);
      onUpdate();
    } catch (error) {
      console.error('Error creating document:', error);
      alert('Failed to create document');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this document?')) return;

    try {
      const { error } = await supabase.from('documents').delete().eq('id', id);
      if (error) throw error;
      onUpdate();
    } catch (error) {
      console.error('Error deleting document:', error);
      alert('Failed to delete document');
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">My Documents</h2>
          <p className="text-slate-600 mt-1">
            Manage your document library for plagiarism checking
          </p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition"
        >
          <Plus className="w-5 h-5" />
          <span>Add Document</span>
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="mb-6 bg-slate-50 p-6 rounded-lg border border-slate-200">
          <div className="space-y-4">
            <div>
              <label htmlFor="title" className="block text-sm font-medium text-slate-700 mb-1">
                Document Title
              </label>
              <input
                id="title"
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                placeholder="Enter document title"
              />
            </div>
            <div>
              <label htmlFor="content" className="block text-sm font-medium text-slate-700 mb-1">
                Content
              </label>
              <textarea
                id="content"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                required
                rows={6}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none resize-none"
                placeholder="Paste or type document content here"
              />
            </div>
            <div className="flex space-x-3">
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition disabled:opacity-50"
              >
                {loading ? 'Saving...' : 'Save Document'}
              </button>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="px-6 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg transition"
              >
                Cancel
              </button>
            </div>
          </div>
        </form>
      )}

      {documents.length === 0 ? (
        <div className="text-center py-12 bg-slate-50 rounded-lg border-2 border-dashed border-slate-300">
          <p className="text-slate-600">No documents yet. Add your first document to get started.</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {documents.map((doc) => (
            <div
              key={doc.id}
              className="bg-white border border-slate-200 rounded-lg p-4 hover:shadow-md transition"
            >
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-slate-900 mb-2">{doc.title}</h3>
                  <p className="text-slate-600 text-sm line-clamp-2 mb-3">
                    {doc.content.substring(0, 200)}
                    {doc.content.length > 200 ? '...' : ''}
                  </p>
                  <div className="flex items-center space-x-2 text-xs text-slate-500">
                    <Calendar className="w-4 h-4" />
                    <span>{new Date(doc.created_at).toLocaleDateString()}</span>
                  </div>
                </div>
                <button
                  onClick={() => handleDelete(doc.id)}
                  className="ml-4 p-2 text-red-600 hover:bg-red-50 rounded-lg transition"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
