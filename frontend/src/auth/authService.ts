import api from '../services/api';

// Kiểm tra xem có đang chạy ở môi trường client hay không
const isBrowser = typeof window !== 'undefined';

// Hàm đăng nhập
export const login = async (email: string, password: string) => {
  try {
    return await api.post('/auth/login', { email, password });
  } catch (error) {
    throw new Error('Đăng nhập thất bại');
  }
};

// Hàm đăng ký
export const register = async (email: string, password: string, name: string) => {
  try {
    return await api.post('/auth/register', { email, password, name });
  } catch (error) {
    throw new Error('Đăng ký thất bại');
  }
};

// Hàm đăng xuất
export const logout = async () => {
  try {
    await api.post('/auth/logout');
    return true;
  } catch (error) {
    console.error('Đăng xuất thất bại', error);
    return false;
  }
};

// Lấy thông tin người dùng
export const getUserProfile = async () => {
  try {
    return await api.get('/auth/me');
  } catch (error) {
    throw new Error('Không thể lấy thông tin người dùng');
  }
};