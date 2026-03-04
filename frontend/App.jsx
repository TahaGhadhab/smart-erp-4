import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Layout from './components/Layout/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';

// Protection des routes — redirige vers login si non connecté
const RouteProtegee = ({ children }) => {
  const { utilisateur, chargement } = useAuth();
  if (chargement) return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
    </div>
  );
  return utilisateur ? <Layout>{children}</Layout> : <Navigate to="/login" />;
};

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={
            <RouteProtegee><Dashboard /></RouteProtegee>
          } />
          {/* Les autres pages seront ajoutées ici */}
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}