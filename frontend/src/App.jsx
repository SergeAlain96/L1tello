import { lazy, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';
import PrivateRoute from './components/PrivateRoute';
import Layout from './components/Layout';

const LoginPage = lazy(() => import('./pages/auth/LoginPage'));
const RegisterPage = lazy(() => import('./pages/auth/RegisterPage'));
const DashboardPage = lazy(() => import('./pages/DashboardPage'));
const LeconsPage = lazy(() => import('./pages/lecons/LeconsPage'));
const LecteurPage = lazy(() => import('./pages/lecons/LecteurPage'));
const UploadLeconPage = lazy(() => import('./pages/lecons/UploadLeconPage'));
const QuizPage = lazy(() => import('./pages/quiz/QuizPage'));
const RevisionPage = lazy(() => import('./pages/revision/RevisionPage'));

function PageLoader() {
  return (
    <div className="flex items-center justify-center h-64">
      <div className="w-10 h-10 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
    </div>
  );
}

function App() {
  const { user } = useAuth();

  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        {/* Routes publiques */}
        <Route
          path="/login"
          element={user ? <Navigate to="/dashboard" replace /> : <LoginPage />}
        />
        <Route
          path="/register"
          element={user ? <Navigate to="/dashboard" replace /> : <RegisterPage />}
        />

        {/* Routes protégées */}
        <Route element={<PrivateRoute />}>
          <Route element={<Layout />}>
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/lecons" element={<LeconsPage />} />
            <Route path="/lecons/:id" element={<LecteurPage />} />
            <Route path="/upload" element={<UploadLeconPage />} />
            <Route path="/quiz" element={<QuizPage />} />
            <Route path="/revision" element={<RevisionPage />} />
          </Route>
        </Route>

        {/* Redirection par défaut */}
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </Suspense>
  );
}

export default App;
