import axios from 'axios';

const axiosInstance = axios.create({
  // The '/api' prefix will be handled by the Vite proxy in development
  baseURL: '/api',
});

// Request Interceptor: Add the JWT token to every outgoing request
axiosInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default axiosInstance;