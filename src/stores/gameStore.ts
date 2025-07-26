// Modern Zustand Store for Game State Management
import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import type { GameData, FocusSession, Achievement, Buddy } from '@/types';

interface GameStore extends GameData {
  // Actions
  updateXP: (amount: number, reason?: string) => void;
  updateCoins: (amount: number, reason?: string) => void;
  startFocusSession: (targetDuration?: number) => void;
  endFocusSession: (completed?: boolean) => void;
  updateFocusSession: (updates: Partial<FocusSession>) => void;
  unlockAchievement: (achievement: Achievement) => void;
  updateStreak: (newStreak: number) => void;
  setBuddy: (buddy: Buddy | null) => void;
  levelUp: () => void;
  
  // Computed values
  getXPProgress: () => number;
  canAfford: (price: number) => boolean;
  isSessionActive: () => boolean;
  
  // Persistence
  loadFromStorage: () => Promise<void>;
  saveToStorage: () => Promise<void>;
}

const initialGameData: GameData = {
  level: 1,
  xp: 0,
  xpToNextLevel: 100,
  totalXP: 0,
  dopamineCoins: 50,
  streak: 0,
  longestStreak: 0,
  focusMultiplier: 1,
  prestigeLevel: 0,
  totalFocusHours: 0,
  kFactor: 0,
  referralCount: 0,
  achievements: [],
  dailyChallenge: null,
  buddy: null,
  buddyRequests: [],
  teamId: null,
  focusSession: {
    active: false,
    startTime: null,
    duration: 0,
    targetDuration: 1500, // 25 minutes default
    xpRate: 2,
    sessionCount: 0,
    bonusMultiplier: 1,
    epicDropChance: 0.1,
    lastEpicDrop: null,
    currentTask: '',
    url: '',
    title: '',
    distractionCount: 0,
    flowStateAchieved: false
  },
  stats: {
    totalFocusTime: 0,
    sessionsCompleted: 0,
    averageSessionLength: 0,
    bestDay: 0,
    coinsEarned: 0,
    coinsSpent: 0,
    socialShares: 0,
    buddyInteractions: 0,
    dailyFocusGoal: 120,
    weeklyFocusGoal: 840,
    distractionsResisted: 0,
    flowStatesAchieved: 0,
    epicDropsReceived: 0
  },
  social: {
    shares: 0,
    referrals: 0,
    buddyInteractions: 0,
    teamChallenges: 0,
    leaderboardRank: 0,
    flowStateMoments: [],
    socialFeed: []
  },
  preferences: {
    notifications: true,
    sounds: true,
    theme: 'dark',
    difficulty: 'medium',
    autoShare: false,
    buddyNotifications: true,
    epicDrops: true,
    variableRewards: true,
    focusMode: {
      blockDistractions: true,
      allowedSites: [],
      blockedSites: ['reddit.com', 'youtube.com', 'facebook.com', 'twitter.com', 'instagram.com'],
      breakInterval: 25,
      sessionLength: 25,
      strictMode: false
    },
    breakReminders: true,
    hyperfocusProtection: true
  },
  subscription: {
    tier: 'free',
    expiresAt: null,
    features: ['basic_xp', 'limited_coins', 'single_buddy'],
    dailyCoinLimit: 50,
    buddyLimit: 1,
    customChallenges: false,
    advancedAnalytics: false,
    prioritySupport: false
  }
};

export const useGameStore = create<GameStore>()(
  subscribeWithSelector((set, get) => ({
    ...initialGameData,

    updateXP: (amount: number, reason?: string) => {
      set((state) => {
        const newXP = state.xp + amount;
        const newTotalXP = state.totalXP + amount;
        let newLevel = state.level;
        let newXPToNext = state.xpToNextLevel;
        let leveledUp = false;

        // Check for level up
        if (newXP >= state.xpToNextLevel) {
          const excessXP = newXP - state.xpToNextLevel;
          newLevel = state.level + 1;
          newXPToNext = Math.floor(state.xpToNextLevel * 1.2);
          leveledUp = true;

          // Trigger level up effects
          setTimeout(() => get().levelUp(), 100);

          return {
            ...state,
            xp: excessXP,
            totalXP: newTotalXP,
            level: newLevel,
            xpToNextLevel: newXPToNext
          };
        }

        return {
          ...state,
          xp: newXP,
          totalXP: newTotalXP
        };
      });

      // Broadcast XP update
      if (typeof chrome !== 'undefined' && chrome.runtime) {
        chrome.runtime.sendMessage({
          type: 'xp:update',
          data: { amount, reason, newTotal: get().xp }
        }).catch(() => {});
      }
    },

    updateCoins: (amount: number, reason?: string) => {
      set((state) => ({
        ...state,
        dopamineCoins: Math.max(0, state.dopamineCoins + amount),
        stats: {
          ...state.stats,
          coinsEarned: amount > 0 ? state.stats.coinsEarned + amount : state.stats.coinsEarned,
          coinsSpent: amount < 0 ? state.stats.coinsSpent + Math.abs(amount) : state.stats.coinsSpent
        }
      }));

      // Broadcast coin update
      if (typeof chrome !== 'undefined' && chrome.runtime) {
        chrome.runtime.sendMessage({
          type: 'coins:update',
          data: { amount, reason, newTotal: get().dopamineCoins }
        }).catch(() => {});
      }
    },

    startFocusSession: (targetDuration = 1500) => {
      const now = Date.now();
      set((state) => ({
        ...state,
        focusSession: {
          ...state.focusSession,
          active: true,
          startTime: now,
          duration: 0,
          targetDuration,
          sessionCount: state.focusSession.sessionCount + 1,
          distractionCount: 0,
          flowStateAchieved: false
        }
      }));

      // Start focus timer
      if (typeof chrome !== 'undefined' && chrome.runtime) {
        chrome.runtime.sendMessage({
          type: 'focus:start',
          data: { targetDuration, startTime: now }
        }).catch(() => {});
      }
    },

    endFocusSession: (completed = false) => {
      const state = get();
      if (!state.focusSession.active) return;

      const sessionDuration = state.focusSession.duration;
      const sessionMinutes = Math.floor(sessionDuration / 60);
      
      // Calculate rewards
      const baseXP = sessionMinutes * state.focusSession.xpRate;
      const multipliedXP = Math.floor(baseXP * state.focusMultiplier);
      const coins = Math.floor(sessionMinutes / 2);

      if (completed && sessionMinutes >= 5) {
        get().updateXP(multipliedXP, 'Focus session completed');
        get().updateCoins(coins, 'Focus session reward');
      }

      // Update stats
      set((state) => ({
        ...state,
        focusSession: {
          ...state.focusSession,
          active: false,
          startTime: null,
          duration: 0
        },
        stats: {
          ...state.stats,
          totalFocusTime: state.stats.totalFocusTime + sessionMinutes,
          sessionsCompleted: completed ? state.stats.sessionsCompleted + 1 : state.stats.sessionsCompleted,
          averageSessionLength: completed 
            ? Math.floor((state.stats.averageSessionLength * state.stats.sessionsCompleted + sessionMinutes) / (state.stats.sessionsCompleted + 1))
            : state.stats.averageSessionLength
        },
        focusMultiplier: 1 // Reset multiplier
      }));

      // Broadcast session end
      if (typeof chrome !== 'undefined' && chrome.runtime) {
        chrome.runtime.sendMessage({
          type: 'focus:end',
          data: { duration: sessionDuration, xpEarned: multipliedXP, coinsEarned: coins, completed }
        }).catch(() => {});
      }
    },

    updateFocusSession: (updates: Partial<FocusSession>) => {
      set((state) => ({
        ...state,
        focusSession: {
          ...state.focusSession,
          ...updates
        }
      }));
    },

    unlockAchievement: (achievement: Achievement) => {
      set((state) => {
        // Check if already unlocked
        if (state.achievements.some(a => a.id === achievement.id)) {
          return state;
        }

        const unlockedAchievement = {
          ...achievement,
          unlockedAt: Date.now(),
          isNew: true
        };

        // Award rewards
        setTimeout(() => {
          if (achievement.xp > 0) get().updateXP(achievement.xp, 'Achievement unlocked');
          if (achievement.coins > 0) get().updateCoins(achievement.coins, 'Achievement reward');
        }, 100);

        return {
          ...state,
          achievements: [...state.achievements, unlockedAchievement]
        };
      });

      // Broadcast achievement unlock
      if (typeof chrome !== 'undefined' && chrome.runtime) {
        chrome.runtime.sendMessage({
          type: 'achievement:unlocked',
          data: achievement
        }).catch(() => {});
      }
    },

    updateStreak: (newStreak: number) => {
      set((state) => ({
        ...state,
        streak: newStreak,
        longestStreak: Math.max(state.longestStreak, newStreak)
      }));
    },

    setBuddy: (buddy: Buddy | null) => {
      set((state) => ({
        ...state,
        buddy
      }));
    },

    levelUp: () => {
      const state = get();
      const coinsReward = state.level * 5;
      
      get().updateCoins(coinsReward, `Level ${state.level} reward`);

      // Broadcast level up
      if (typeof chrome !== 'undefined' && chrome.runtime) {
        chrome.runtime.sendMessage({
          type: 'level:up',
          data: { newLevel: state.level, coinsReward }
        }).catch(() => {});
      }
    },

    // Computed values
    getXPProgress: () => {
      const state = get();
      return (state.xp / state.xpToNextLevel) * 100;
    },

    canAfford: (price: number) => {
      return get().dopamineCoins >= price;
    },

    isSessionActive: () => {
      return get().focusSession.active;
    },

    // Persistence
    loadFromStorage: async () => {
      try {
        if (typeof chrome !== 'undefined' && chrome.storage) {
          const result = await chrome.storage.local.get(['flowStateGame']);
          if (result.flowStateGame) {
            set((state) => ({
              ...state,
              ...result.flowStateGame
            }));
          }
        }
      } catch (error) {
        console.error('Failed to load game data:', error);
      }
    },

    saveToStorage: async () => {
      try {
        if (typeof chrome !== 'undefined' && chrome.storage) {
          const state = get();
          await chrome.storage.local.set({
            flowStateGame: {
              level: state.level,
              xp: state.xp,
              xpToNextLevel: state.xpToNextLevel,
              totalXP: state.totalXP,
              dopamineCoins: state.dopamineCoins,
              streak: state.streak,
              longestStreak: state.longestStreak,
              focusMultiplier: state.focusMultiplier,
              prestigeLevel: state.prestigeLevel,
              totalFocusHours: state.totalFocusHours,
              achievements: state.achievements,
              stats: state.stats,
              social: state.social,
              preferences: state.preferences,
              subscription: state.subscription
            }
          });
        }
      } catch (error) {
        console.error('Failed to save game data:', error);
      }
    }
  }))
);

// Auto-save on state changes
useGameStore.subscribe(
  (state) => state,
  () => {
    // Debounce saves
    const saveTimeout = setTimeout(() => {
      useGameStore.getState().saveToStorage();
    }, 1000);
    
    return () => clearTimeout(saveTimeout);
  }
);