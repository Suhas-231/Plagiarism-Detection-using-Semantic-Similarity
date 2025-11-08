import { useState, useEffect } from 'react';
import { supabase, type Document, type PlagiarismCheck } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { DocumentManager } from './DocumentManager';
import { PlagiarismChecker } from './PlagiarismChecker';
import { CheckHistory } from './CheckHistory';
import { LogOut, FileText, Search, History } from 'lucide-react';

type Tab = 'documents' | 'check' | 'history';

export function Dashboard() {
  const { user, signOut } = useAuth();
  const [activeTab, setActiveTab] = useState<Tab>('documents');
  const [documents, setDocuments] = useState<Document[]>([]);
  const [checks, setChecks] = useState<PlagiarismCheck[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [user]);

  const loadData = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const [docsResponse, checksResponse] = await Promise.all([
        supabase
          .from('documents')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false }),
        supabase
          .from('plagiarism_checks')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
      ]);

      if (docsResponse.data) setDocuments(docsResponse.data);
      if (checksResponse.data) setChecks(checksResponse.data);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const tabs = [
    { id: 'documents' as Tab, label: 'My Documents', icon: FileText },
    { id: 'check' as Tab, label: 'Check Plagiarism', icon: Search },
    { id: 'history' as Tab, label: 'Check History', icon: History },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <nav className="bg-white border-b border-slate-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <Search className="w-8 h-8 text-blue-600" />
              <h1 className="text-2xl font-bold text-slate-900">Plagiarism Detector</h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-slate-600">{user?.email}</span>
              <button
                onClick={signOut}
                className="flex items-center space-x-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition"
              >
                <LogOut className="w-4 h-4" />
                <span>Sign Out</span>
              </button>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          <div className="border-b border-slate-200">
            <div className="flex space-x-1 p-2">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center space-x-2 px-6 py-3 rounded-lg font-medium transition ${
                      activeTab === tab.id
                        ? 'bg-blue-50 text-blue-700'
                        : 'text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="p-6">
            {loading ? (
              <div className="text-center py-12">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-blue-600 border-t-transparent"></div>
                <p className="mt-4 text-slate-600">Loading...</p>
              </div>
            ) : (
              <>
                {activeTab === 'documents' && (
                  <DocumentManager documents={documents} onUpdate={loadData} />
                )}
                {activeTab === 'check' && (
                  <PlagiarismChecker documents={documents} onCheckComplete={loadData} />
                )}
                {activeTab === 'history' && (
                  <CheckHistory checks={checks} documents={documents} />
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
