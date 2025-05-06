import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// Định nghĩa kiểu dữ liệu cho UI state
interface UIState {
  // Theme settings
  theme: 'light' | 'dark' | 'system';
  // Sidebar states
  sidebarCollapsed: boolean;
  // Modal states
  activeModal: string | null;
  // Actions
  setTheme: (theme: 'light' | 'dark' | 'system') => void;
  toggleSidebar: () => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
  openModal: (modalId: string) => void;
  closeModal: () => void;
}

// Tạo store UI với khả năng lưu trữ trong localStorage
export const useUIStore = create<UIState>()(
  persist(
    (set) => ({
      // Initial states
      theme: 'system',
      sidebarCollapsed: false,
      activeModal: null,

      // Actions
      setTheme: (theme) => set({ theme }),
      toggleSidebar: () => set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),
      setSidebarCollapsed: (collapsed) => set({ sidebarCollapsed: collapsed }),
      openModal: (modalId) => set({ activeModal: modalId }),
      closeModal: () => set({ activeModal: null }),
    }),
    {
      name: 'alpha-quant-ui-storage',
      // Chỉ lưu một số state nhất định
      partialize: (state) => ({
        theme: state.theme,
        sidebarCollapsed: state.sidebarCollapsed,
      }),
    }
  )
);