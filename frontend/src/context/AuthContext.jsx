import { createContext, useContext, useState, useEffect } from 'react';
import { authAPI } from '../services/api';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [utilisateur, setUtilisateur] = useState(null);
  const [chargement, setChargement]   = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      authAPI.me()
        .then(res => setUtilisateur(res.data))
        .catch(() => {
          localStorage.removeItem('token');
        })
        .finally(() => {
          setChargement(false);
        });
    } else {
      // Pas de token — on arrête le chargement immédiatement
      setChargement(false);
    }
  }, []);

  const login = async (email, mot_de_passe) => {
    const res = await authAPI.login({ email, mot_de_passe });
    localStorage.setItem('token', res.data.token);
    setUtilisateur(res.data.utilisateur);
    return res.data;
  };

  const logout = () => {
    localStorage.removeItem('token');
    setUtilisateur(null);
  };

  return (
    <AuthContext.Provider value={{ utilisateur, login, logout, chargement }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);