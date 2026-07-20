import axios from 'axios';

// Base URL points to the ASP.NET Core API Backend
const baseURL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5076/api';

const apiClient = axios.create({
  baseURL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 25000, // 25 seconds timeout (standard for AI integrations)
});

// Request Interceptor: Automatically attach the JWT access token if available
apiClient.interceptors.request.use(
  (config) => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response Interceptor: Handle centralized error states (e.g. 401 Unauthorized, 403 Forbidden)
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      const { status } = error.response;
      if (status === 401) {
        // Handle token expiration or unauthorized access in client side
        console.warn('Unauthorized request - User may need to log in again.');
        if (typeof window !== 'undefined') {
          localStorage.removeItem('token');
          // Optional: redirect to login page
          // window.location.href = '/login';
        }
      } else if (status === 403) {
        console.error('Forbidden request - You do not have permissions to access this resource.');
      }
    }
    return Promise.reject(error);
  }
);

export default apiClient;
