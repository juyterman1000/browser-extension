import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGameStore } from '@/stores/gameStore';
import { XPBar } from '@/components/ui/XPBar';
import { CoinDisplay } from '@/components/ui/CoinDisplay';
import { FocusTimer } from '@/components/ui/FocusTimer';
import { 
  FireIcon, 
  BoltIcon, 
  ShoppingBagIcon, 
  TrophyIcon, 
  ChartBarIcon, 
  UserGroupIcon,
  SparklesIcon,
  CogIcon
} from '@heroicons/react/24/solid';

export const PopupApp: React.FC = () => {
  const gameStore = useGameStore();
  const [showLevelUp, setShowLevelUp] = useState(false);
  const [showAchievement, setShowAchievement] = useState(false);
  const [currentAchievement, setCurrentAchievement] = useState(null);

  useEffect(() => {
    // Load game data on mount
    gameStore.loadFromStorage();

    // Listen for background messages
    const messageListener = (message: any) => {
      switch (message.type) {
        case 'level:up':
          setShowLevelUp(true);
          setTimeout(() => setShowLevelUp(false), 5000);
          break;
        case 'achievement:unlocked':
          setCurrentAchievement(message.data);
          setShowAchievement(true);
          setTimeout(() => setShowAchievement(false), 4000);
          break;
      }
    };

    if (typeof chrome !== 'undefined' && chrome.runtime) {
      chrome.runtime.onMessage.addListener(messageListener);
      return () => chrome.runtime.onMessage.removeListener(messageListener);
    }
  }, []);

  const openPage = (page: string) => {
    chrome.tabs.create({ url: chrome.runtime.getURL(`${page}.html`) });
  };

  const quickActions = [
    {
      id: 'marketplace',
      icon: ShoppingBagIcon,
      label: 'Marketplace',
      badge: Math.floor(gameStore.dopamineCoins / 10),
      onClick: () => openPage('marketplace'),
      color: 'bg-purple-500 hover:bg-purple-600'
    },
    {
      id: 'achievements',
      icon: TrophyIcon,
      label: 'Achievements',
      badge: gameStore.achievements.filter(a => a.isNew).length,
      onClick: () => openPage('achievements'),
      color: 'bg-yellow-500 hover:bg-yellow-600'
    },
    {
      id: 'leaderboard',
      icon: ChartBarIcon,
      label: 'Leaderboard',
      onClick: () => openPage('leaderboard'),
      color: 'bg-blue-500 hover:bg-blue-600'
    },
    {
      id: 'social',
      icon: UserGroupIcon,
      label: 'Social',
      badge: 2, // Mock notification count
      onClick: () => openPage('social'),
      color: 'bg-green-500 hover:bg-green-600'
    }
  ];

  return (
    <div className="w-96 min-h-[600px] bg-gradient-to-br from-primary-500 to-secondary-500 text-white">
      {/* Header */}
      <div className="bg-black/20 backdrop-blur-sm p-6 border-b border-white/20">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
              <SparklesIcon className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold">FlowState</h1>
              <div className="bg-dopamine-400 text-black px-2 py-0.5 rounded-full text-xs font-semibold">
                Level {gameStore.level}
              </div>
            </div>
          </div>
          <button
            onClick={() => openPage('settings')}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
          >
            <CogIcon className="w-5 h-5" />
          </button>
        </div>
        
        <XPBar showLevel={false} animated={true} />
      </div>

      {/* Stats Dashboard */}
      <div className="p-6">
        <div className="grid grid-cols-3 gap-4 mb-6">
          <motion.div
            className="bg-white/10 backdrop-blur-sm rounded-xl p-4 text-center border border-white/20"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <FireIcon className="w-6 h-6 text-orange-400 mx-auto mb-2" />
            <div className="text-xl font-bold">{gameStore.streak}</div>
            <div className="text-xs opacity-80">Day Streak</div>
          </motion.div>

          <motion.div
            className="bg-white/10 backdrop-blur-sm rounded-xl p-4 text-center border border-white/20"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <div className="text-lg mb-2">🪙</div>
            <div className="text-xl font-bold text-dopamine-400">{gameStore.dopamineCoins}</div>
            <div className="text-xs opacity-80">Coins</div>
          </motion.div>

          <motion.div
            className="bg-white/10 backdrop-blur-sm rounded-xl p-4 text-center border border-white/20"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <BoltIcon className="w-6 h-6 text-yellow-400 mx-auto mb-2" />
            <div className="text-xl font-bold">{gameStore.focusMultiplier}x</div>
            <div className="text-xs opacity-80">Multiplier</div>
          </motion.div>
        </div>

        {/* Focus Timer */}
        <div className="mb-6">
          <FocusTimer />
        </div>

        {/* Daily Challenge */}
        {gameStore.dailyChallenge && (
          <motion.div
            className="bg-gradient-to-r from-dopamine-400/20 to-yellow-400/20 rounded-xl p-4 mb-6 border border-dopamine-400/30"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="flex justify-between items-center mb-2">
              <h3 className="font-semibold flex items-center gap-2">
                <TrophyIcon className="w-4 h-4" />
                Daily Challenge
              </h3>
              <div className="bg-dopamine-400 text-black px-2 py-1 rounded-full text-xs font-bold">
                +{gameStore.dailyChallenge.xp} XP
              </div>
            </div>
            <p className="text-sm opacity-90 mb-3">{gameStore.dailyChallenge.description}</p>
            <div className="flex items-center gap-2">
              <div className="flex-1 bg-white/20 rounded-full h-2">
                <div
                  className="bg-dopamine-400 h-2 rounded-full transition-all duration-300"
                  style={{
                    width: `${Math.min((gameStore.dailyChallenge.progress / gameStore.dailyChallenge.target) * 100, 100)}%`
                  }}
                />
              </div>
              <span className="text-xs font-medium">
                {gameStore.dailyChallenge.progress}/{gameStore.dailyChallenge.target}
              </span>
            </div>
          </motion.div>
        )}

        {/* ADHD Buddy */}
        <motion.div
          className="bg-white/10 backdrop-blur-sm rounded-xl p-4 mb-6 border border-white/20"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <h3 className="font-semibold mb-3 flex items-center gap-2">
            <UserGroupIcon className="w-4 h-4" />
            ADHD Buddy
          </h3>
          {gameStore.buddy ? (
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-primary-400 to-secondary-400 rounded-full flex items-center justify-center">
                👤
              </div>
              <div className="flex-1">
                <div className="font-medium">{gameStore.buddy.username}</div>
                <div className="text-xs opacity-80">{gameStore.buddy.status}</div>
              </div>
              <button className="text-xs bg-white/20 px-2 py-1 rounded-full hover:bg-white/30 transition-colors">
                💬
              </button>
            </div>
          ) : (
            <div className="text-center">
              <p className="text-sm opacity-80 mb-3">Find an accountability partner!</p>
              <button
                onClick={() => gameStore.setBuddy({
                  id: 'buddy_' + Date.now(),
                  username: 'Alex M.',
                  level: Math.floor(Math.random() * 20) + 1,
                  streak: Math.floor(Math.random() * 15) + 1,
                  status: 'focusing',
                  avatar: '👤',
                  matchedAt: Date.now(),
                  lastInteraction: Date.now(),
                  sharedChallenges: [],
                  compatibility: 85,
                  timezone: 'UTC'
                })}
                className="bg-primary-600 hover:bg-primary-700 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
              >
                Find Buddy
              </button>
            </div>
          )}
        </motion.div>

        {/* Quick Actions */}
        <div className="grid grid-cols-2 gap-3">
          {quickActions.map((action, index) => (
            <motion.button
              key={action.id}
              onClick={action.onClick}
              className={`${action.color} rounded-xl p-4 text-center relative transition-all duration-200`}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <action.icon className="w-6 h-6 mx-auto mb-2" />
              <div className="text-sm font-medium">{action.label}</div>
              {action.badge > 0 && (
                <div className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                  {action.badge}
                </div>
              )}
            </motion.button>
          ))}
        </div>
      </div>

      {/* Level Up Modal */}
      <AnimatePresence>
        {showLevelUp && (
          <motion.div
            className="fixed inset-0 bg-black/80 flex items-center justify-center z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="bg-gradient-to-br from-dopamine-400 to-yellow-400 text-black rounded-2xl p-8 text-center max-w-sm mx-4"
              initial={{ scale: 0.5, y: -50 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.5, y: -50 }}
              transition={{ type: "spring", damping: 15 }}
            >
              <motion.div
                className="text-6xl mb-4"
                animate={{ rotate: [0, 10, -10, 0] }}
                transition={{ duration: 0.5, repeat: 2 }}
              >
                🎉
              </motion.div>
              <h2 className="text-2xl font-bold mb-2">LEVEL UP!</h2>
              <p className="text-lg mb-4">You're now Level {gameStore.level}!</p>
              <div className="bg-black/20 rounded-lg p-3 mb-4">
                <div className="text-sm font-medium">Rewards:</div>
                <div className="text-sm">+{gameStore.level * 5} Dopamine Coins</div>
                <div className="text-sm">New Features Unlocked</div>
              </div>
              <button
                onClick={() => setShowLevelUp(false)}
                className="bg-black text-white px-6 py-2 rounded-lg font-medium hover:bg-gray-800 transition-colors"
              >
                Awesome! 🚀
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Achievement Modal */}
      <AnimatePresence>
        {showAchievement && currentAchievement && (
          <motion.div
            className="fixed inset-0 bg-black/80 flex items-center justify-center z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="bg-gradient-to-br from-primary-500 to-secondary-500 text-white rounded-2xl p-8 text-center max-w-sm mx-4"
              initial={{ scale: 0.5, y: -50 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.5, y: -50 }}
              transition={{ type: "spring", damping: 15 }}
            >
              <motion.div
                className="text-6xl mb-4"
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 0.5, repeat: 2 }}
              >
                🏆
              </motion.div>
              <h2 className="text-xl font-bold mb-2">Achievement Unlocked!</h2>
              <p className="text-lg mb-2">{currentAchievement.name}</p>
              <p className="text-sm opacity-90 mb-4">{currentAchievement.description}</p>
              <div className="bg-white/20 rounded-lg p-3 mb-4">
                <div className="text-sm">
                  +{currentAchievement.xp} XP • +{currentAchievement.coins} Coins
                </div>
              </div>
              <button
                onClick={() => setShowAchievement(false)}
                className="bg-white text-primary-600 px-6 py-2 rounded-lg font-medium hover:bg-gray-100 transition-colors"
              >
                Celebrate! 🎊
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};