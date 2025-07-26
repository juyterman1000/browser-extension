// Core Types for FlowState ADHD Extension

export interface User {
  id: string;
  email: string;
  username: string;
  level: number;
  xp: number;
  xpToNextLevel: number;
  totalXP: number;
  dopamineCoins: number;
  streak: number;
  longestStreak: number;
  prestigeLevel: number;
  totalFocusHours: number;
  subscription: SubscriptionTier;
  createdAt: Date;
  lastActiveAt: Date;
}

export interface GameData {
  level: number;
  xp: number;
  xpToNextLevel: number;
  totalXP: number;
  dopamineCoins: number;
  streak: number;
  longestStreak: number;
  focusMultiplier: number;
  prestigeLevel: number;
  totalFocusHours: number;
  kFactor: number;
  referralCount: number;
  achievements: Achievement[];
  dailyChallenge: DailyChallenge | null;
  buddy: Buddy | null;
  buddyRequests: BuddyRequest[];
  teamId: string | null;
  focusSession: FocusSession;
  stats: UserStats;
  social: SocialData;
  preferences: UserPreferences;
  subscription: Subscription;
}

export interface FocusSession {
  active: boolean;
  startTime: number | null;
  duration: number;
  targetDuration: number;
  xpRate: number;
  sessionCount: number;
  bonusMultiplier: number;
  epicDropChance: number;
  lastEpicDrop: number | null;
  currentTask: string;
  url: string;
  title: string;
  distractionCount: number;
  flowStateAchieved: boolean;
}

export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  xp: number;
  coins: number;
  category: AchievementCategory;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  unlockedAt?: number;
  isNew?: boolean;
  progress?: number;
  target?: number;
}

export type AchievementCategory = 
  | 'onboarding' 
  | 'focus' 
  | 'streak' 
  | 'level' 
  | 'social' 
  | 'prestige' 
  | 'special';

export interface DailyChallenge {
  id: string;
  type: ChallengeType;
  description: string;
  target: number;
  unit: string;
  progress: number;
  xp: number;
  coins: number;
  date: string;
  completed: boolean;
  difficulty: 'easy' | 'medium' | 'hard';
}

export type ChallengeType = 
  | 'focus_time' 
  | 'focus_sessions' 
  | 'streak_maintain' 
  | 'no_distractions' 
  | 'buddy_interaction'
  | 'social_share'
  | 'marketplace_purchase';

export interface Buddy {
  id: string;
  username: string;
  level: number;
  streak: number;
  status: BuddyStatus;
  avatar: string;
  matchedAt: number;
  lastInteraction: number;
  sharedChallenges: string[];
  compatibility: number;
  timezone: string;
}

export type BuddyStatus = 
  | 'online' 
  | 'focusing' 
  | 'break' 
  | 'offline' 
  | 'away';

export interface BuddyRequest {
  id: string;
  fromUserId: string;
  toUserId: string;
  message: string;
  status: 'pending' | 'accepted' | 'declined';
  createdAt: number;
}

export interface UserStats {
  totalFocusTime: number;
  sessionsCompleted: number;
  averageSessionLength: number;
  bestDay: number;
  coinsEarned: number;
  coinsSpent: number;
  socialShares: number;
  buddyInteractions: number;
  dailyFocusGoal: number;
  weeklyFocusGoal: number;
  distractionsResisted: number;
  flowStatesAchieved: number;
  epicDropsReceived: number;
}

export interface SocialData {
  shares: number;
  referrals: number;
  buddyInteractions: number;
  teamChallenges: number;
  leaderboardRank: number;
  flowStateMoments: FlowStateMoment[];
  socialFeed: SocialPost[];
}

export interface FlowStateMoment {
  id: string;
  sessionId: string;
  screenshot: string;
  duration: number;
  xpEarned: number;
  achievement?: string;
  sharedAt: number;
  likes: number;
  comments: Comment[];
}

export interface SocialPost {
  id: string;
  userId: string;
  username: string;
  type: 'achievement' | 'streak' | 'level_up' | 'challenge_complete';
  content: string;
  achievement?: Achievement;
  timestamp: number;
  likes: number;
  comments: number;
  isLiked: boolean;
}

export interface UserPreferences {
  notifications: boolean;
  sounds: boolean;
  theme: 'light' | 'dark' | 'auto';
  difficulty: 'easy' | 'medium' | 'hard';
  autoShare: boolean;
  buddyNotifications: boolean;
  epicDrops: boolean;
  variableRewards: boolean;
  focusMode: FocusModeSettings;
  breakReminders: boolean;
  hyperfocusProtection: boolean;
}

export interface FocusModeSettings {
  blockDistractions: boolean;
  allowedSites: string[];
  blockedSites: string[];
  breakInterval: number;
  sessionLength: number;
  strictMode: boolean;
}

export interface Subscription {
  tier: SubscriptionTier;
  expiresAt: number | null;
  features: string[];
  dailyCoinLimit: number;
  buddyLimit: number;
  customChallenges: boolean;
  advancedAnalytics: boolean;
  prioritySupport: boolean;
}

export type SubscriptionTier = 'free' | 'premium' | 'team';

export interface APIResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface WebSocketEvent {
  type: string;
  data: any;
  timestamp: number;
}

// Real-time Events
export interface RTEvents {
  'xp:update': { total: number; earned: number; multiplier: number };
  'buddy:status': { buddyId: string; status: BuddyStatus };
  'achievement:unlocked': { achievement: Achievement };
  'challenge:invite': { challenge: DailyChallenge };
  'focus:start': { sessionId: string };
  'focus:end': { sessionId: string; stats: SessionStats };
  'epic:drop': { reward: EpicReward };
  'streak:update': { streak: number; bonus: number };
  'level:up': { newLevel: number; rewards: LevelReward[] };
}

export interface SessionStats {
  duration: number;
  xpEarned: number;
  coinsEarned: number;
  distractions: number;
  flowStateAchieved: boolean;
  productivity: number;
}

export interface EpicReward {
  type: 'xp_boost' | 'coin_bonus' | 'rare_achievement' | 'premium_trial';
  value: number;
  duration?: number;
  message: string;
}

export interface LevelReward {
  type: 'coins' | 'feature_unlock' | 'cosmetic';
  value: number | string;
  name: string;
}

// Analytics Types
export interface AnalyticsEvent {
  event: string;
  properties: Record<string, any>;
  timestamp: number;
  userId: string;
  sessionId: string;
}

export interface FocusPattern {
  timeOfDay: number[];
  dayOfWeek: number[];
  sessionLength: number[];
  productivity: number[];
  distractionTriggers: string[];
}

export interface ADHDInsight {
  type: 'pattern' | 'recommendation' | 'warning' | 'celebration';
  title: string;
  description: string;
  actionable: boolean;
  priority: 'low' | 'medium' | 'high';
  data?: any;
}

// Marketplace Types
export interface MarketplaceItem {
  id: string;
  name: string;
  description: string;
  price: number;
  type: 'digital_reward' | 'power_up' | 'cosmetic' | 'feature';
  category: string;
  icon: string;
  duration?: number;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  requirements?: ItemRequirement[];
}

export interface ItemRequirement {
  type: 'level' | 'achievement' | 'streak' | 'subscription';
  value: string | number;
}

// Team Features
export interface Team {
  id: string;
  name: string;
  description: string;
  memberCount: number;
  totalXP: number;
  averageLevel: number;
  challenges: TeamChallenge[];
  leaderboard: TeamMember[];
  settings: TeamSettings;
}

export interface TeamChallenge {
  id: string;
  name: string;
  description: string;
  target: number;
  progress: number;
  reward: number;
  startDate: number;
  endDate: number;
  participants: string[];
}

export interface TeamMember {
  userId: string;
  username: string;
  level: number;
  xp: number;
  role: 'member' | 'admin' | 'owner';
  joinedAt: number;
}

export interface TeamSettings {
  isPublic: boolean;
  allowInvites: boolean;
  requireApproval: boolean;
  maxMembers: number;
}