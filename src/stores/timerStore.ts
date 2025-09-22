import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface TimerConfig {
  defaultDuration: number; // in minutes
}

interface TimerState {
  config: TimerConfig;
  activeTimer: string | null;
  showTimerOverlay: boolean;
  completedTimerTodo: { id: string; text: string } | null;
  showTimerSettings: boolean;
  
  // Actions
  updateConfig: (config: Partial<TimerConfig>) => void;
  setActiveTimer: (todoId: string | null) => void;
  setShowTimerOverlay: (show: boolean) => void;
  setCompletedTimerTodo: (todo: { id: string; text: string } | null) => void;
  setShowTimerSettings: (show: boolean) => void;
  
  // Timer actions
  startTimer: (todoId: string) => void;
  stopTimer: () => void;
  completeTimer: (todoId: string, todoText: string) => void;
  closeTimerOverlay: () => void;
}

const DEFAULT_CONFIG: TimerConfig = {
  defaultDuration: 0.1, // 0.1 minutes (6 seconds) for testing
};

export const useTimerStore = create<TimerState>()(
  persist(
    (set) => ({
      config: DEFAULT_CONFIG,
      activeTimer: null,
      showTimerOverlay: false,
      completedTimerTodo: null,
      showTimerSettings: false,
      
      updateConfig: (newConfig) => {
        set((state) => ({
          config: { ...state.config, ...newConfig },
        }));
      },
      
      setActiveTimer: (todoId) => set({ activeTimer: todoId }),
      
      setShowTimerOverlay: (show) => set({ showTimerOverlay: show }),
      
      setCompletedTimerTodo: (todo) => set({ completedTimerTodo: todo }),
      
      setShowTimerSettings: (show) => set({ showTimerSettings: show }),
      
      startTimer: (todoId) => {
        set({ activeTimer: todoId });
      },
      
      stopTimer: () => {
        set({ activeTimer: null });
      },
      
      completeTimer: (todoId, todoText) => {
        console.log(`Timer store completeTimer called with: ${todoText}`);
        set({
          activeTimer: null,
          completedTimerTodo: { id: todoId, text: todoText },
          showTimerOverlay: true,
        });
        console.log('Timer store state updated - showTimerOverlay should be true');
      },
      
      closeTimerOverlay: () => {
        set({
          showTimerOverlay: false,
          completedTimerTodo: null,
        });
      },
    }),
    {
      name: 'timer-storage',
      partialize: (state) => ({ 
        config: state.config 
      }),
    }
  )
);