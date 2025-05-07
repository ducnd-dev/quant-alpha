import axios, { AxiosRequestConfig, AxiosResponse, AxiosError } from 'axios';

const isBrowser = typeof window !== 'undefined';

// Sửa lại URL cơ sở cho đúng cổng 8000
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';

const axiosInstance = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
});

axiosInstance.interceptors.request.use(
  (config) => {
    if (isBrowser) {
      const token = localStorage.getItem('token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

axiosInstance.interceptors.response.use(
  (response: AxiosResponse) => response,
  (error: AxiosError) => {
    if (error.response) {
      const status = error.response.status;
      
      // Xử lý lỗi xác thực
      if (status === 401 && isBrowser) {
        localStorage.removeItem('token');
        if (window.location.pathname !== '/login') {
          window.location.href = '/login';
        }
      }
      
      if (status === 403) {
        console.error('Không có quyền truy cập vào tài nguyên này');
      }
      
      if (status >= 500) {
        console.error('Lỗi máy chủ, vui lòng thử lại sau');
      }
    } else if (error.request) {
      console.error('Không thể kết nối đến máy chủ');
    } else {
      console.error('Lỗi trong quá trình thiết lập yêu cầu:', error.message);
    }
    
    return Promise.reject(error);
  }
);

export const api = {
  get: <T>(url: string, config?: AxiosRequestConfig) => 
    axiosInstance.get<T>(url, config).then(response => response.data),
  
  post: <T>(url: string, data?: any, config?: AxiosRequestConfig) => 
    axiosInstance.post<T>(url, data, config).then(response => response.data),
  
  put: <T>(url: string, data?: any, config?: AxiosRequestConfig) => 
    axiosInstance.put<T>(url, data, config).then(response => response.data),
  
  delete: <T>(url: string, config?: AxiosRequestConfig) => 
    axiosInstance.delete<T>(url, config).then(response => response.data),
  
  patch: <T>(url: string, data?: any, config?: AxiosRequestConfig) => 
    axiosInstance.patch<T>(url, data, config).then(response => response.data),
  
  // Phương thức lấy instance axios nguyên bản nếu cần
  getInstance: () => axiosInstance
};

export default api;