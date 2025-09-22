"use client";

import React, { createContext, useContext, useState, useEffect } from 'react';

interface TimerConfig {
  defaultDuration: number; // in minutes
}

interface TimerContextType {
  config: TimerConfig;
  updateConfig: (config: Partial<TimerConfig>) => void;
  activeTimer: string | null;
  setActiveTimer: (todoId: string | null) => void;
}

const TimerContext = createContext<TimerContextType | undefined>(undefined);

const DEFAULT_CONFIG: TimerConfig = {
  defaultDuration: 5, // 5 minutes default
};

export function TimerProvider({ children }: { children: React.ReactNode }) {
  const [config, setConfig] = useState<TimerConfig>(DEFAULT_CONFIG);
  const [activeTimer, setActiveTimer] = useState<string | null>(null);

  // Load config from localStorage on mount
  useEffect(() => {
    const savedConfig = localStorage.getItem('pomodoro-config');
    if (savedConfig) {
      try {
        const parsed = JSON.parse(savedConfig);
        setConfig({ ...DEFAULT_CONFIG, ...parsed });
      } catch {
        console.warn('Failed to parse timer config from localStorage');
      }
    }
  }, []);

  const updateConfig = (newConfig: Partial<TimerConfig>) => {
    const updatedConfig = { ...config, ...newConfig };
    setConfig(updatedConfig);
    localStorage.setItem('pomodoro-config', JSON.stringify(updatedConfig));
  };

  return (
    <TimerContext.Provider value={{
      config,
      updateConfig,
      activeTimer,
      setActiveTimer,
    }}>
      {children}
    </TimerContext.Provider>
  );
}

export function useTimer() {
  const context = useContext(TimerContext);
  if (context === undefined) {
    throw new Error('useTimer must be used within a TimerProvider');
  }
  return context;
}