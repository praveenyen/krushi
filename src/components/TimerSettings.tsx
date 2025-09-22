import React, { useState } from 'react';
import { useTimerStore } from '../stores/timerStore';

interface TimerSettingsProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function TimerSettings({ isOpen, onClose }: TimerSettingsProps) {
    const { config, updateConfig } = useTimerStore();
    const [duration, setDuration] = useState(config.defaultDuration);

    if (!isOpen) return null;

    const handleSave = () => {
        updateConfig({ defaultDuration: duration });
        onClose();
    };

    const presetDurations = [5, 10, 15, 25, 30, 45, 60];

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 p-6 max-w-md w-full">
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">
                        Timer Settings
                    </h2>
                    <button
                        onClick={onClose}
                        className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Default Timer Duration (minutes)
                        </label>

                        {/* Preset buttons */}
                        <div className="grid grid-cols-4 gap-2 mb-4">
                            {presetDurations.map((preset) => (
                                <button
                                    key={preset}
                                    onClick={() => setDuration(preset)}
                                    className={`p-2 text-sm font-medium rounded-lg border transition-colors
                    ${duration === preset
                                            ? 'bg-blue-500 text-white border-blue-500'
                                            : 'bg-gray-50 dark:bg-gray-700 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-600'
                                        }`}
                                >
                                    {preset}m
                                </button>
                            ))}
                        </div>

                        {/* Custom input */}
                        <div className="flex items-center gap-2">
                            <input
                                type="number"
                                min="1"
                                max="120"
                                value={duration}
                                onChange={(e) => setDuration(Math.max(1, Math.min(120, parseInt(e.target.value) || 1)))}
                                className="flex-1 px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg
                  bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100
                  focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                            <span className="text-sm text-gray-500 dark:text-gray-400">minutes</span>
                        </div>
                    </div>

                    <div className="flex gap-3 pt-4">
                        <button
                            onClick={onClose}
                            className="flex-1 px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 
                hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg font-medium transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleSave}
                            className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
                        >
                            Save
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}