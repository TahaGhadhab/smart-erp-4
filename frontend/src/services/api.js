import axios from 'axios';

const API = axios.create({
  baseURL: 'http://localhost:5000/api',
});

// Ajoute automatiquement le token à chaque requête
API.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Redirige vers login si token expiré
API.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export const authAPI = {
  login: (data) => API.post('/auth/login', data),
  me:    ()     => API.get('/auth/me'),
};

export const clientsAPI = {
  getAll:  ()       => API.get('/clients'),
  getOne:  (id)     => API.get(`/clients/${id}`),
  create:  (data)   => API.post('/clients', data),
  update:  (id, data) => API.put(`/clients/${id}`, data),
  delete:  (id)     => API.delete(`/clients/${id}`),
};

export const vehiculesAPI = {
  getAll:  ()         => API.get('/vehicules'),
  getOne:  (id)       => API.get(`/vehicules/${id}`),
  create:  (data)     => API.post('/vehicules', data),
  update:  (id, data) => API.put(`/vehicules/${id}`, data),
};

export const dashboardAPI = {
  getKPIs: () => API.get('/dashboard/kpis'),
};

export default API;