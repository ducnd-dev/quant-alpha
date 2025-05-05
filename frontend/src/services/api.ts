import axios, { AxiosRequestConfig, AxiosResponse, AxiosError } from 'axios';

// Kiểm tra xem có đang chạy ở môi trường client hay không
const isBrowser = typeof window !== 'undefined';

// Cấu hình cơ bản
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost/api';

// Tạo instance axios với cấu hình chung
const axiosInstance = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000, // Timeout 10 giây
});

// Thêm interceptor để tự động thêm token vào header
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

// Interceptor xử lý response
axiosInstance.interceptors.response.use(
  (response: AxiosResponse) => response,
  (error: AxiosError) => {
    // Xử lý các trường hợp lỗi cụ thể
    if (error.response) {
      // Lỗi từ server (status code ngoài phạm vi 2xx)
      const status = error.response.status;
      
      // Xử lý lỗi xác thực
      if (status === 401 && isBrowser) {
        // Token hết hạn hoặc không hợp lệ
        localStorage.removeItem('token');
        // Chuyển hướng đến trang đăng nhập nếu cần
        if (window.location.pathname !== '/login') {
          window.location.href = '/login';
        }
      }
      
      // Xử lý lỗi quyền truy cập
      if (status === 403) {
        console.error('Không có quyền truy cập vào tài nguyên này');
      }
      
      // Xử lý lỗi máy chủ
      if (status >= 500) {
        console.error('Lỗi máy chủ, vui lòng thử lại sau');
      }
    } else if (error.request) {
      // Yêu cầu đã được gửi nhưng không nhận được phản hồi
      console.error('Không thể kết nối đến máy chủ');
    } else {
      // Lỗi khi thiết lập request
      console.error('Lỗi trong quá trình thiết lập yêu cầu:', error.message);
    }
    
    return Promise.reject(error);
  }
);

// Các hàm wrapper cho các phương thức HTTP
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