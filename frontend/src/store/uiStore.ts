import { create } from 'zustand';
import type { Toast, ToastType, Modal } from '../types';

interface UIState {
  toasts: Toast[];
  modals: Record<string, Modal>;
  isLoading: boolean;
  
  // Toast Actions
  addToast: (message: string, type?: ToastType, duration?: number) => void;
  removeToast: (id: string) => void;
  clearToasts: () => void;
  
  // Modal Actions
  openModal: (id: string, data?: any) => void;
  closeModal: (id: string) => void;
  isModalOpen: (id: string) => boolean;
  getModalData: (id: string) => any;
  
  // Loading Actions
  setLoading: (loading: boolean) => void;
}

let toastIdCounter = 0;

export const useUIStore = create<UIState>((set, get) => ({
  toasts: [],
  modals: {},
  isLoading: false,

  addToast: (message, type = 'info', duration = 5000) => {
    const id = `toast-${++toastIdCounter}`;
    const toast: Toast = {
      id,
      message,
      type,
      duration,
    };

    set((state) => ({
      toasts: [...state.toasts, toast],
    }));

    // Auto-remove toast after duration
    if (duration > 0) {
      setTimeout(() => {
        get().removeToast(id);
      }, duration);
    }
  },

  removeToast: (id) =>
    set((state) => ({
      toasts: state.toasts.filter((toast) => toast.id !== id),
    })),

  clearToasts: () =>
    set({
      toasts: [],
    }),

  openModal: (id, data) =>
    set((state) => ({
      modals: {
        ...state.modals,
        [id]: {
          id,
          isOpen: true,
          data,
        },
      },
    })),

  closeModal: (id) =>
    set((state) => ({
      modals: {
        ...state.modals,
        [id]: {
          ...state.modals[id],
          isOpen: false,
        },
      },
    })),

  isModalOpen: (id) => {
    const { modals } = get();
    return modals[id]?.isOpen || false;
  },

  getModalData: (id) => {
    const { modals } = get();
    return modals[id]?.data;
  },

  setLoading: (loading) =>
    set({
      isLoading: loading,
    }),
}));
