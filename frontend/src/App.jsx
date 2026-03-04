import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Layout from './components/Layout/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Clients from './pages/Clients';
import Vehicules from './pages/Vehicules';
import Reservations from './pages/Reservations';
import Maintenances from './pages/Maintenances';
import Predictions from './pages/Predictions';

const RouteProtegee = ({ children }) => {
  const { utilisateur, chargement } = useAuth();
  if (chargement) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
      <div>Chargement...</div>
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
          <Route path="/" element={<RouteProtegee><Dashboard /></RouteProtegee>} />
          <Route path="/clients" element={<RouteProtegee><Clients /></RouteProtegee>} />
          <Route path="/vehicules" element={<RouteProtegee><Vehicules /></RouteProtegee>} />
          <Route path="/reservations" element={<RouteProtegee><Reservations /></RouteProtegee>} />
          <Route path="/maintenances" element={<RouteProtegee><Maintenances /></RouteProtegee>} />
          <Route path="/predictions" element={<RouteProtegee><Predictions /></RouteProtegee>} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}