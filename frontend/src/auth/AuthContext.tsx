import React, { createContext, useState, useContext, useEffect } from 'react';
import { useRouter } from 'next/router';
import { login, register, logout, getUserProfile } from "./authService"

const isBrowser = typeof window !== 'undefined';

interface User {
  id: string;
  email: string;
  name?: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const checkUserLoggedIn = async () => {
      try {
        if (isBrowser) {
          const token = localStorage.getItem('token');
          if (token) {
            const userData = await getUserProfile();
            setUser(userData as User);
          }
        }
      } catch (err) {
        if (isBrowser) {
          localStorage.removeItem('token');
        }
      } finally {
        setLoading(false);
      }
    };

    checkUserLoggedIn();
  }, []);

  const loginHandler = async (email: string, password: string) => {
    setLoading(true);
    setError(null);
    try {
      const { user, token } = await login(email, password) as { user: User; token: string };
      if (isBrowser) {
        localStorage.setItem('token', token);
      }
      setUser(user);
      router.push('/dashboard');
    } catch (err) {
      setError('Đăng nhập thất bại. Vui lòng kiểm tra lại email và mật khẩu.');
    } finally {
      setLoading(false);
    }
  };

  const registerHandler = async (email: string, password: string, name: string) => {
    setLoading(true);
    setError(null);
    try {
      const { user, token } = await register(email, password, name) as { user: User; token: string };
      if (isBrowser) {
        localStorage.setItem('token', token);
      }
      setUser(user);
      router.push('/dashboard');
    } catch (err) {
      setError('Đăng ký thất bại. Email có thể đã tồn tại.');
    } finally {
      setLoading(false);
    }
  };

  const logoutHandler = async () => {
    setLoading(true);
    try {
      await logout();
      if (isBrowser) {
        localStorage.removeItem('token');
      }
      setUser(null);
      router.push('/');
    } catch (err) {
      console.error('Đăng xuất thất bại', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        error,
        login: loginHandler,
        register: registerHandler,
        logout: logoutHandler,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};