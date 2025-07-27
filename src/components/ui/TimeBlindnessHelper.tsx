import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ClockIcon, BellIcon } from '@heroicons/react/24/outline';
import { useGameStore } from '@/stores/gameStore';

interface TimeBlindnessHelperProps {
  workDuration?: number; // in minutes
  onTimeUpdate?: (timeInfo: any) => void;
}

export const TimeBlindnessHelper: React.FC<TimeBlindnessHelperProps> = ({
  workDuration = 120, // 2 hours default
  onTimeUpdate
}) => {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [workStartTime, setWorkStartTime] = useState<Date | null>(null);
  const [showTimeAlert, setShowTimeAlert] = useState(false);
  const [nextBreakTime, setNextBreakTime] = useState<Date | null>(null);
  const { focusSession } = useGameStore();

  // Update current time every minute
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);

    return () => clearInterval(timer);
  }, []);

  // Set work start time when focus session begins
  useEffect(() => {
    if (focusSession.active && !workStartTime) {
      setWorkStartTime(new Date());
      const breakTime = new Date();
      breakTime.setMinutes(breakTime.getMinutes() + 25); // Pomodoro-style
      setNextBreakTime(breakTime);
    } else if (!focusSession.active) {
      setWorkStartTime(null);
      setNextBreakTime(null);
    }
  }, [focusSession.active]);

  // Check for time awareness alerts
  useEffect(() => {
    if (!workStartTime) return;

    const now = new Date();
    const workTime = (now.getTime() - workStartTime.getTime()) / (1000 * 60); // minutes

    // Show time alerts at key intervals
    const alertIntervals = [30, 60, 90, 120]; // minutes
    const shouldAlert = alertIntervals.some(interval => 
      Math.abs(workTime - interval) < 0.5 && workTime >= interval
    );

    if (shouldAlert && !showTimeAlert) {
      setShowTimeAlert(true);
      setTimeout(() => setShowTimeAlert(false), 5000);
    }

    onTimeUpdate?.({
      currentTime: now,
      workTime,
      workStartTime,
      nextBreakTime
    });
  }, [currentTime, workStartTime]);

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const getTimeOfDay = () => {
    const hour = currentTime.getHours();
    if (hour < 6) return { period: 'Late Night', color: 'text-purple-600', bg: 'bg-purple-50' };
    if (hour < 12) return { period: 'Morning', color: 'text-yellow-600', bg: 'bg-yellow-50' };
    if (hour < 17) return { period: 'Afternoon', color: 'text-blue-600', bg: 'bg-blue-50' };
    if (hour < 21) return { period: 'Evening', color: 'text-orange-600', bg: 'bg-orange-50' };
    return { period: 'Night', color: 'text-indigo-600', bg: 'bg-indigo-50' };
  };

  const getWorkTimeDisplay = () => {
    if (!workStartTime) return null;
    
    const now = new Date();
    const workMinutes = Math.floor((now.getTime() - workStartTime.getTime()) / (1000 * 60));
    const hours = Math.floor(workMinutes / 60);
    const minutes = workMinutes % 60;
    
    return hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
  };

  const getTimeUntilBreak = () => {
    if (!nextBreakTime) return null;
    
    const now = new Date();
    const diffMinutes = Math.floor((nextBreakTime.getTime() - now.getTime()) / (1000 * 60));
    
    if (diffMinutes <= 0) return 'Break time!';
    return `${diffMinutes}m until break`;
  };

  const timeOfDay = getTimeOfDay();

  return (
    <div className="bg-white rounded-xl shadow-lg p-6 space-y-4">
      {/* Current Time & Period */}
      <div className="text-center">
        <div className="text-3xl font-bold text-gray-800 mb-2">
          {formatTime(currentTime)}
        </div>
        <div className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${timeOfDay.color} ${timeOfDay.bg}`}>
          {timeOfDay.period}
        </div>
      </div>

      {/* Visual Time Awareness */}
      <div className="grid grid-cols-3 gap-4">
        {/* Work Session Time */}
        <div className="text-center p-3 bg-green-50 rounded-lg">
          <ClockIcon className="w-5 h-5 mx-auto text-green-600 mb-1" />
          <div className="text-sm font-medium text-green-800">
            Work Time
          </div>
          <div className="text-lg font-bold text-green-600">
            {getWorkTimeDisplay() || '--'}
          </div>
        </div>

        {/* Next Break */}
        <div className="text-center p-3 bg-blue-50 rounded-lg">
          <BellIcon className="w-5 h-5 mx-auto text-blue-600 mb-1" />
          <div className="text-sm font-medium text-blue-800">
            Next Break
          </div>
          <div className="text-lg font-bold text-blue-600">
            {nextBreakTime ? formatTime(nextBreakTime) : '--:--'}
          </div>
        </div>

        {/* Time Until Break */}
        <div className="text-center p-3 bg-purple-50 rounded-lg">
          <div className="text-sm font-medium text-purple-800">
            Break In
          </div>
          <div className="text-lg font-bold text-purple-600">
            {getTimeUntilBreak() || '--'}
          </div>
        </div>
      </div>

      {/* Time Awareness Progress Bar */}
      {workStartTime && (
        <div className="space-y-2">
          <div className="flex justify-between text-sm text-gray-600">
            <span>Work Session Progress</span>
            <span>{getWorkTimeDisplay()}</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <motion.div
              className="bg-gradient-to-r from-green-400 to-blue-500 h-2 rounded-full"
              initial={{ width: 0 }}
              animate={{ 
                width: `${Math.min((new Date().getTime() - workStartTime.getTime()) / (1000 * 60 * workDuration) * 100, 100)}%` 
              }}
              transition={{ duration: 0.5 }}
            />
          </div>
        </div>
      )}

      {/* Time Alert Overlay */}
      {showTimeAlert && (
        <motion.div
          className="absolute inset-0 bg-yellow-400/90 rounded-xl flex items-center justify-center"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
        >
          <div className="text-center text-white">
            <div className="text-4xl mb-2">⏰</div>
            <div className="text-xl font-bold">Time Check!</div>
            <div className="text-sm">You've been working for {getWorkTimeDisplay()}</div>
          </div>
        </motion.div>
      )}

      {/* Quick Actions */}
      <div className="flex gap-2">
        <button 
          onClick={() => setNextBreakTime(new Date(Date.now() + 5 * 60 * 1000))}
          className="flex-1 py-2 px-3 bg-blue-100 hover:bg-blue-200 text-blue-700 rounded-lg text-sm font-medium transition-colors"
        >
          5min reminder
        </button>
        <button 
          onClick={() => setNextBreakTime(new Date(Date.now() + 10 * 60 * 1000))}
          className="flex-1 py-2 px-3 bg-green-100 hover:bg-green-200 text-green-700 rounded-lg text-sm font-medium transition-colors"
        >
          10min reminder
        </button>
        <button 
          onClick={() => setNextBreakTime(new Date(Date.now() + 25 * 60 * 1000))}
          className="flex-1 py-2 px-3 bg-purple-100 hover:bg-purple-200 text-purple-700 rounded-lg text-sm font-medium transition-colors"
        >
          Pomodoro
        </button>
      </div>
    </div>
  );
};