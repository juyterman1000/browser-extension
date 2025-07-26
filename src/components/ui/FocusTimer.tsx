import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { PlayIcon, PauseIcon, StopIcon } from '@heroicons/react/24/solid';
import { useGameStore } from '@/stores/gameStore';

export const FocusTimer: React.FC = () => {
  const { 
    focusSession, 
    startFocusSession, 
    endFocusSession, 
    updateFocusSession 
  } = useGameStore();
  
  const [timeLeft, setTimeLeft] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    if (!focusSession.active) return;

    const interval = setInterval(() => {
      if (!isPaused) {
        const elapsed = Math.floor((Date.now() - (focusSession.startTime || 0)) / 1000);
        const remaining = Math.max(0, focusSession.targetDuration - elapsed);
        
        setTimeLeft(remaining);
        updateFocusSession({ duration: elapsed });

        // Auto-complete when time is up
        if (remaining === 0) {
          endFocusSession(true);
        }
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [focusSession.active, focusSession.startTime, isPaused]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const progress = focusSession.targetDuration > 0 
    ? ((focusSession.targetDuration - timeLeft) / focusSession.targetDuration) * 100 
    : 0;

  const handleStart = () => {
    if (!focusSession.active) {
      startFocusSession(1500); // 25 minutes default
    } else {
      setIsPaused(false);
    }
  };

  const handlePause = () => {
    setIsPaused(true);
  };

  const handleStop = () => {
    endFocusSession(false);
    setTimeLeft(0);
    setIsPaused(false);
  };

  return (
    <div className="bg-white rounded-xl shadow-lg p-6 max-w-sm mx-auto">
      <div className="text-center mb-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-2">Focus Session</h3>
        
        {/* Circular Progress */}
        <div className="relative w-32 h-32 mx-auto mb-4">
          <svg className="w-32 h-32 transform -rotate-90" viewBox="0 0 100 100">
            <circle
              cx="50"
              cy="50"
              r="45"
              stroke="#e5e7eb"
              strokeWidth="8"
              fill="none"
            />
            <motion.circle
              cx="50"
              cy="50"
              r="45"
              stroke="url(#gradient)"
              strokeWidth="8"
              fill="none"
              strokeLinecap="round"
              strokeDasharray={`${2 * Math.PI * 45}`}
              strokeDashoffset={`${2 * Math.PI * 45 * (1 - progress / 100)}`}
              initial={{ strokeDashoffset: 2 * Math.PI * 45 }}
              animate={{ strokeDashoffset: 2 * Math.PI * 45 * (1 - progress / 100) }}
              transition={{ duration: 0.5, ease: "easeOut" }}
            />
            <defs>
              <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#667eea" />
                <stop offset="100%" stopColor="#764ba2" />
              </linearGradient>
            </defs>
          </svg>
          
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-800">
                {formatTime(timeLeft)}
              </div>
              <div className="text-xs text-gray-500">
                {focusSession.active ? (isPaused ? 'Paused' : 'Focusing') : 'Ready'}
              </div>
            </div>
          </div>
        </div>

        {/* XP Rate Display */}
        {focusSession.active && (
          <motion.div
            className="bg-primary-50 rounded-lg p-2 mb-4"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="text-sm text-primary-600">
              Earning <span className="font-bold">{focusSession.xpRate}x XP</span> per minute
            </div>
          </motion.div>
        )}
      </div>

      {/* Controls */}
      <div className="flex justify-center gap-3">
        {!focusSession.active || isPaused ? (
          <motion.button
            onClick={handleStart}
            className="flex items-center gap-2 bg-primary-500 hover:bg-primary-600 text-white px-6 py-2 rounded-lg font-medium transition-colors"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <PlayIcon className="w-4 h-4" />
            {focusSession.active ? 'Resume' : 'Start'}
          </motion.button>
        ) : (
          <motion.button
            onClick={handlePause}
            className="flex items-center gap-2 bg-warning hover:bg-yellow-600 text-white px-6 py-2 rounded-lg font-medium transition-colors"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <PauseIcon className="w-4 h-4" />
            Pause
          </motion.button>
        )}

        {focusSession.active && (
          <motion.button
            onClick={handleStop}
            className="flex items-center gap-2 bg-danger hover:bg-red-600 text-white px-6 py-2 rounded-lg font-medium transition-colors"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <StopIcon className="w-4 h-4" />
            Stop
          </motion.button>
        )}
      </div>

      {/* Session Stats */}
      {focusSession.active && (
        <motion.div
          className="mt-4 grid grid-cols-2 gap-4 text-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          <div className="bg-gray-50 rounded-lg p-2">
            <div className="text-lg font-bold text-primary-500">
              {focusSession.sessionCount}
            </div>
            <div className="text-xs text-gray-500">Sessions Today</div>
          </div>
          <div className="bg-gray-50 rounded-lg p-2">
            <div className="text-lg font-bold text-success">
              {focusSession.distractionCount}
            </div>
            <div className="text-xs text-gray-500">Distractions</div>
          </div>
        </motion.div>
      )}
    </div>
  );
};