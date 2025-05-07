// Types liên quan đến phần Admin

// Interface dữ liệu User cơ bản
export interface User {
  id: number | string;
  name: string;
  email: string;
  role: 'Admin' | 'Moderator' | 'User';
  status: 'Active' | 'Inactive' | 'Pending';
  joined: string; // Thời gian user đăng ký, dạng ISO string
  lastLogin?: string; // Thời gian đăng nhập cuối cùng, có thể null
  avatar?: string; // URL avatar, có thể null
}

// Interface dữ liệu cần thiết để tạo User mới
export interface UserCreateInput {
  name: string;
  email: string;
  password: string;
  role?: 'Admin' | 'Moderator' | 'User';
}

// Interface dữ liệu cần thiết để cập nhật User
export interface UserUpdateInput {
  name?: string;
  email?: string;
  password?: string; // Có thể null nếu không muốn đổi password
  role?: 'Admin' | 'Moderator' | 'User';
  status?: 'Active' | 'Inactive' | 'Pending';
}

// Interface cho dữ liệu phân trang
export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    currentPage: number;
    lastPage: number;
    perPage: number;
    total: number;
  };
}

// Interface cho API error
export interface ApiError {
  message: string;
  errors?: Record<string, string[]>;
  statusCode?: number;
}