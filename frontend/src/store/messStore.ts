import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Mess, MemberRole } from '../types';

interface MessState {
  currentMess: Mess | null;
  messes: Mess[];
  isLoading: boolean;
  
  // Actions
  setCurrentMess: (mess: Mess | null) => void;
  setMesses: (messes: Mess[]) => void;
  addMess: (mess: Mess) => void;
  updateMess: (messId: string, updates: Partial<Mess>) => void;
  removeMess: (messId: string) => void;
  setLoading: (loading: boolean) => void;
  clearMessData: () => void;
  
  // Computed
  getCurrentUserRole: (userId: string) => MemberRole | null;
}

export const useMessStore = create<MessState>()(
  persist(
    (set, get) => ({
      currentMess: null,
      messes: [],
      isLoading: false,

      setCurrentMess: (mess) =>
        set({
          currentMess: mess,
        }),

      setMesses: (messes) =>
        set({
          messes,
        }),

      addMess: (mess) =>
        set((state) => ({
          messes: [...state.messes, mess],
        })),

      updateMess: (messId, updates) =>
        set((state) => ({
          messes: state.messes.map((mess) =>
            mess.id === messId ? { ...mess, ...updates } : mess
          ),
          currentMess:
            state.currentMess?.id === messId
              ? { ...state.currentMess, ...updates }
              : state.currentMess,
        })),

      removeMess: (messId) =>
        set((state) => ({
          messes: state.messes.filter((mess) => mess.id !== messId),
          currentMess:
            state.currentMess?.id === messId ? null : state.currentMess,
        })),

      setLoading: (loading) =>
        set({
          isLoading: loading,
        }),

      clearMessData: () =>
        set({
          currentMess: null,
          messes: [],
        }),

      getCurrentUserRole: (userId) => {
        const { currentMess } = get();
        if (!currentMess) return null;
        
        const member = currentMess.members.find((m) => m.userId === userId);
        return member?.role || null;
      },
    }),
    {
      name: 'mess-storage',
      partialize: (state) => ({
        currentMess: state.currentMess,
        messes: state.messes,
      }),
    }
  )
);
