import api from './api';
import { User, UserCreateInput, UserUpdateInput, PaginatedResponse } from '@/types/admin';

// Interface cho tham số lọc và phân trang
interface UserFilters {
  search?: string;
  role?: string;
  status?: string;
  page?: number;
  perPage?: number;
}

// Interface cho dữ liệu thống kê dashboard
export interface DashboardStats {
  totalUsers: { value: string; change: string };
  activeSubscriptions: { value: string; change: string };
  revenue: { value: string; change: string };
  systemLoad: { value: string; change: string };
}

// Interface cho hoạt động người dùng
export interface UserActivity {
  user: string;
  action: string;
  time: string;
}

// Service quản lý người dùng (admin)
const adminService = {
  // Dashboard endpoints
  getDashboardStats: async (): Promise<DashboardStats> => {
    return api.get<DashboardStats>('/admin/dashboard/stats');
  },

  getRecentActivities: async (limit: number = 5): Promise<UserActivity[]> => {
    return api.get<UserActivity[]>('/admin/dashboard/activities', { params: { limit } });
  },

  // Lấy danh sách người dùng có phân trang và lọc
  getUsers: async (filters: UserFilters = {}): Promise<PaginatedResponse<User>> => {
    const { search, role, status, page = 1, perPage = 10 } = filters;
    
    // Xây dựng query parameters
    const params: Record<string, string | number> = {
      page,
      per_page: perPage
    };
    
    if (search) params.search = search;
    if (role && role !== 'all') params.role = role;
    if (status && status !== 'all') params.status = status;
    
    return api.get<PaginatedResponse<User>>('/admin/users', { params });
  },
  
  // Lấy thông tin chi tiết về một người dùng
  getUserById: async (userId: number | string): Promise<User> => {
    return api.get<User>(`/admin/users/${userId}`);
  },
  
  // Tạo người dùng mới
  createUser: async (userData: UserCreateInput): Promise<User> => {
    return api.post<User>('/admin/users', userData);
  },
  
  // Cập nhật thông tin người dùng
  updateUser: async (userId: number | string, userData: UserUpdateInput): Promise<User> => {
    return api.put<User>(`/admin/users/${userId}`, userData);
  },
  
  // Thay đổi trạng thái người dùng (kích hoạt/vô hiệu hóa)
  changeUserStatus: async (userId: number | string, status: string): Promise<User> => {
    return api.patch<User>(`/admin/users/${userId}/status`, { status });
  },
  
  // Xóa người dùng
  deleteUser: async (userId: number | string): Promise<void> => {
    return api.delete<void>(`/admin/users/${userId}`);
  }
};

export default adminService;