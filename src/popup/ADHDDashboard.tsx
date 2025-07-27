import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

import { 
  ClockIcon, 
  HeartIcon, 
  SunIcon, 
  MoonIcon,
  BoltIcon,
  CheckCircleIcon 
} from '@heroicons/react/24/outline';

import { FocusTimer } from '@/components/ui/FocusTimer';
import { XPBar } from '@/components/ui/XPBar';
import { CoinDisplay } from '@/components/ui/CoinDisplay';
import { SensoryBreak } from '@/components/ui/SensoryBreak';
import { TimeBlindnessHelper } from '@/components/ui/TimeBlindnessHelper';
import { EmotionalRegulation } from '@/components/ui/EmotionalRegulation';
import { ExecutiveFunctionHelper } from '@/components/ui/ExecutiveFunctionHelper';
import { useGameStore } from '@/stores/gameStore';

interface ADHDDashboardProps {
  initialTab?: number;
}

const TABS = [
  { 
    id: 'focus', 
    name: 'Focus', 
    icon: ClockIcon, 
    color: 'text-blue-600',
    description: 'Manage your focus sessions and track progress'
  },
  { 
    id: 'tasks', 
    name: 'Tasks', 
    icon: CheckCircleIcon, 
    color: 'text-green-600',
    description: 'Executive function support and task management'
  },
  { 
    id: 'wellness', 
    name: 'Wellness', 
    icon: HeartIcon, 
    color: 'text-red-600',
    description: 'Emotional regulation and sensory breaks'
  },
  { 
    id: 'time', 
    name: 'Time', 
    icon: BoltIcon, 
    color: 'text-yellow-600',
    description: 'Time awareness and blindness support'
  }
];

export const ADHDDashboard: React.FC<ADHDDashboardProps> = ({ 
  initialTab = 0 
}) => {
  const [selectedTab, setSelectedTab] = useState(initialTab);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [showWelcome, setShowWelcome] = useState(false);
  
  const { 
    level, 
    focusSession, 
    streak,
    updatePreferences 
  } = useGameStore();

  useEffect(() => {
    checkFirstTimeUser();
    loadNotifications();
    checkTimeBasedTriggers();
  }, []);

  const checkFirstTimeUser = async () => {
    try {
      const result = await chrome.storage.local.get(['hasSeenWelcome']);
      if (!result.hasSeenWelcome) {
        setShowWelcome(true);
        await chrome.storage.local.set({ hasSeenWelcome: true });
      }
    } catch (error) {
      console.error('Error checking first time user:', error);
    }
  };

  const loadNotifications = async () => {
    try {
      const result = await chrome.storage.local.get(['adhdNotifications']);
      setNotifications(result.adhdNotifications || []);
    } catch (error) {
      console.error('Error loading notifications:', error);
    }
  };

  const checkTimeBasedTriggers = () => {
    const now = new Date();
    const hour = now.getHours();
    
    // Suggest sensory breaks during typical overstimulation times
    if (hour === 14 || hour === 16) { // Post-lunch dip
      addNotification({
        id: Date.now().toString(),
        type: 'sensory',
        title: 'Energy Dip Detected',
        message: 'Consider taking a sensory break to re-energize',
        priority: 'medium',
        timestamp: Date.now()
      });
    }
    
    // Evening wind-down suggestions
    if (hour === 20) {
      addNotification({
        id: Date.now().toString(),
        type: 'emotional',
        title: 'Evening Check-in',
        message: 'How are you feeling? Time for an emotional check-in',
        priority: 'low',
        timestamp: Date.now()
      });
    }
  };

  const addNotification = (notification: any) => {
    setNotifications(prev => [notification, ...prev.slice(0, 4)]); // Keep only 5 notifications
  };

  const dismissNotification = (notificationId: string) => {
    setNotifications(prev => prev.filter(n => n.id !== notificationId));
  };

  const toggleDarkMode = () => {
    const newMode = !isDarkMode;
    setIsDarkMode(newMode);
    updatePreferences({ theme: newMode ? 'dark' : 'light' });
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return '🌅 Good morning';
    if (hour < 17) return '☀️ Good afternoon';
    if (hour < 21) return '🌅 Good evening';
    return '🌙 Good night';
  };

  const getMotivationalMessage = () => {
    const messages = [
      "Your ADHD brain is powerful - let's channel that energy! 💪",
      "Every small step counts. You're doing great! 🌟",
      "Remember: progress, not perfection. 🎯",
      "Your unique brain sees the world differently - that's a gift! 🧠",
      "Celebrate the wins, learn from the challenges. 🎉",
      "You have ADHD superpowers - time to use them! ⚡"
    ];
    return messages[Math.floor(Math.random() * messages.length)];
  };

  const getTabContent = (tabId: string) => {
    switch (tabId) {
      case 'focus':
        return (
          <div className="space-y-6">
            <FocusTimer />
            <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-4">
              <h4 className="font-semibold text-gray-800 mb-2">🎯 Focus Tips for ADHD</h4>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Start with just 15 minutes - build up gradually</li>
                <li>• Use body doubling - work "with" someone virtually</li>
                <li>• Change your environment if you're stuck</li>
                <li>• Remember: hyperfocus is also valid focus!</li>
              </ul>
            </div>
          </div>
        );
      
      case 'tasks':
        return (
          <div className="space-y-6">
            <ExecutiveFunctionHelper 
              onTaskCreated={(task) => addNotification({
                id: Date.now().toString(),
                type: 'success',
                title: 'Task Created!',
                message: `"${task.title}" added to your list`,
                priority: 'low',
                timestamp: Date.now()
              })}
                             onTaskCompleted={() => addNotification({
                id: Date.now().toString(),
                type: 'celebration',
                title: '🎉 Task Completed!',
                message: 'Great job! You earned XP and coins!',
                priority: 'medium',
                timestamp: Date.now()
              })}
            />
          </div>
        );
      
      case 'wellness':
        return (
          <div className="space-y-6">
            <EmotionalRegulation 
                             onMoodLogged={() => addNotification({
                id: Date.now().toString(),
                type: 'wellness',
                title: 'Mood Logged',
                message: `Thanks for checking in. You're being mindful! 🧠`,
                priority: 'low',
                timestamp: Date.now()
              })}
            />
            <SensoryBreak 
              onComplete={() => addNotification({
                id: Date.now().toString(),
                type: 'success',
                title: 'Sensory Break Complete!',
                message: 'Your nervous system thanks you! 🌟',
                priority: 'medium',
                timestamp: Date.now()
              })}
            />
          </div>
        );
      
      case 'time':
        return (
          <div className="space-y-6">
            <TimeBlindnessHelper 
              onTimeUpdate={(timeInfo) => {
                // Could trigger notifications based on time worked
                if (timeInfo.workTime >= 90) { // 1.5 hours
                  addNotification({
                    id: Date.now().toString(),
                    type: 'warning',
                    title: 'Long Work Session',
                    message: 'Consider taking a break soon!',
                    priority: 'medium',
                    timestamp: Date.now()
                  });
                }
              }}
            />
            <div className="bg-gradient-to-r from-yellow-50 to-orange-50 rounded-xl p-4">
              <h4 className="font-semibold text-gray-800 mb-2">⏰ Time Blindness Support</h4>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Set visual timers for important tasks</li>
                <li>• Use external time cues (alarms, notifications)</li>
                <li>• Build buffer time into your schedule</li>
                <li>• Track patterns in your energy and focus</li>
              </ul>
            </div>
          </div>
        );
      
      default:
        return <div>Tab content not found</div>;
    }
  };

  if (showWelcome) {
    return (
      <motion.div
        className="min-h-screen bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center p-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        <motion.div
          className="bg-white rounded-2xl p-8 max-w-md w-full text-center shadow-2xl"
          initial={{ scale: 0.9, y: 20 }}
          animate={{ scale: 1, y: 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
        >
          <div className="text-6xl mb-4">🧠⚡</div>
          <h1 className="text-2xl font-bold text-gray-800 mb-2">Welcome to FlowState!</h1>
          <p className="text-gray-600 mb-6">
            Your ADHD-friendly productivity companion is here to help you work 
            <em> with </em> your brain, not against it.
          </p>
          
          <div className="space-y-3 mb-6">
            <div className="text-left p-3 bg-blue-50 rounded-lg">
              <div className="font-medium text-blue-800">🎯 Focus Tools</div>
              <div className="text-sm text-blue-600">Timers, hyperfocus protection, momentum tracking</div>
            </div>
            <div className="text-left p-3 bg-green-50 rounded-lg">
              <div className="font-medium text-green-800">🧠 Executive Function</div>
              <div className="text-sm text-green-600">Task management, energy matching, planning help</div>
            </div>
            <div className="text-left p-3 bg-purple-50 rounded-lg">
              <div className="font-medium text-purple-800">💝 Wellness Support</div>
              <div className="text-sm text-purple-600">Emotional regulation, sensory breaks, RSD help</div>
            </div>
          </div>

          <motion.button
            onClick={() => setShowWelcome(false)}
            className="w-full bg-gradient-to-r from-blue-500 to-purple-600 text-white px-6 py-3 rounded-lg font-medium transition-colors"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            Let's Get Started! 🚀
          </motion.button>
        </motion.div>
      </motion.div>
    );
  }

  return (
    <div className={`min-h-screen ${isDarkMode ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-900'}`}>
      <div className="max-w-4xl mx-auto p-4">
        {/* Header */}
        <div className="mb-6">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h1 className="text-2xl font-bold">{getGreeting()}!</h1>
              <p className="text-sm opacity-75">{getMotivationalMessage()}</p>
            </div>
            <div className="flex items-center gap-4">
              <CoinDisplay size="sm" />
              <button
                onClick={toggleDarkMode}
                className="p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
              >
                {isDarkMode ? <SunIcon className="w-5 h-5" /> : <MoonIcon className="w-5 h-5" />}
              </button>
            </div>
          </div>

          {/* Progress Overview */}
          <div className="grid grid-cols-3 gap-4 mb-4">
            <div className="text-center p-3 bg-white dark:bg-gray-800 rounded-lg shadow">
              <div className="text-lg font-bold text-blue-600">Level {level}</div>
              <div className="text-xs opacity-75">Your Level</div>
            </div>
            <div className="text-center p-3 bg-white dark:bg-gray-800 rounded-lg shadow">
              <div className="text-lg font-bold text-green-600">{streak}</div>
              <div className="text-xs opacity-75">Day Streak</div>
            </div>
            <div className="text-center p-3 bg-white dark:bg-gray-800 rounded-lg shadow">
              <div className="text-lg font-bold text-purple-600">
                {focusSession.active ? '🎯 Focusing' : '💭 Ready'}
              </div>
              <div className="text-xs opacity-75">Status</div>
            </div>
          </div>

          <XPBar size="sm" />
        </div>

        {/* Notifications */}
        {notifications.length > 0 && (
          <div className="mb-6 space-y-2">
            {notifications.map(notification => (
              <motion.div
                key={notification.id}
                className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg p-3 flex justify-between items-start"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
              >
                <div>
                  <div className="font-medium text-blue-800 dark:text-blue-200">{notification.title}</div>
                  <div className="text-sm text-blue-600 dark:text-blue-300">{notification.message}</div>
                </div>
                <button
                  onClick={() => dismissNotification(notification.id)}
                  className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-200"
                >
                  ✕
                </button>
              </motion.div>
            ))}
          </div>
        )}

        {/* Main Tabs */}
        <div>
          <div className="flex space-x-1 rounded-xl bg-blue-900/20 p-1 mb-6">
            {TABS.map((tab, index) => (
              <button
                key={tab.id}
                onClick={() => setSelectedTab(index)}
                className={`w-full rounded-lg py-2.5 text-sm font-medium leading-5 transition-all
                   ${selectedTab === index
                     ? 'bg-white dark:bg-gray-800 text-blue-700 dark:text-blue-300 shadow' 
                     : 'text-blue-600 dark:text-blue-400 hover:bg-white/[0.12] hover:text-blue-800 dark:hover:text-blue-200'
                   }`
                }
              >
                <div className="flex items-center justify-center gap-2">
                  <tab.icon className="w-4 h-4" />
                  <span className="hidden sm:inline">{tab.name}</span>
                </div>
              </button>
            ))}
          </div>

          <AnimatePresence mode="wait">
            {TABS.map((tab, index) => (
              selectedTab === index && (
                <motion.div
                  key={tab.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                >
                  {getTabContent(tab.id)}
                </motion.div>
              )
            ))}
          </AnimatePresence>
        </div>

        {/* Quick Actions */}
        <div className="mt-8 p-4 bg-white dark:bg-gray-800 rounded-xl shadow">
          <h3 className="font-semibold mb-3">🚀 Quick Actions</h3>
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => setSelectedTab(0)}
              className="p-3 bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/30 rounded-lg text-left transition-colors"
            >
              <div className="font-medium text-blue-800 dark:text-blue-200">Start Focus Session</div>
              <div className="text-xs text-blue-600 dark:text-blue-300">Begin productive work time</div>
            </button>
            <button
              onClick={() => setSelectedTab(2)}
              className="p-3 bg-purple-50 dark:bg-purple-900/20 hover:bg-purple-100 dark:hover:bg-purple-900/30 rounded-lg text-left transition-colors"
            >
              <div className="font-medium text-purple-800 dark:text-purple-200">Emotional Check-in</div>
              <div className="text-xs text-purple-600 dark:text-purple-300">How are you feeling?</div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};