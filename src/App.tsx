import { AuthProvider, useAuth } from './contexts/AuthContext';
import { Auth } from './components/Auth';
import { Dashboard } from './components/Dashboard';

function AppContent() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-white border-t-transparent"></div>
          <p className="mt-4 text-white">Loading...</p>
        </div>
      </div>
    );
  }

  return user ? <Dashboard /> : <Auth />;
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
