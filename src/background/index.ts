// Modern Background Service Worker with Real-time Features
import type { GameData, FocusSession, Achievement, WebSocketEvent } from '@/types';

class FlowStateBackgroundService {
  private gameData: GameData | null = null;
  private focusTimer: NodeJS.Timeout | null = null;
  private websocket: WebSocket | null = null;
  private apiBaseUrl = 'https://api.flowstate.app/v1';
  private wsUrl = 'wss://ws.flowstate.app';

  constructor() {
    this.init();
  }

  private async init() {
    console.log('FlowState Background Service initializing...');
    
    // Load game data
    await this.loadGameData();
    
    // Setup event listeners
    this.setupEventListeners();
    
    // Connect to WebSocket for real-time features
    this.connectWebSocket();
    
    // Setup periodic tasks
    this.setupPeriodicTasks();
    
    console.log('FlowState Background Service initialized');
  }

  private async loadGameData() {
    try {
      const result = await chrome.storage.local.get(['flowStateGame']);
      if (result.flowStateGame) {
        this.gameData = result.flowStateGame;
      } else {
        // Initialize with default data
        this.gameData = this.getDefaultGameData();
        await this.saveGameData();
      }
    } catch (error) {
      console.error('Failed to load game data:', error);
      this.gameData = this.getDefaultGameData();
    }
  }

  private async saveGameData() {
    if (!this.gameData) return;
    
    try {
      await chrome.storage.local.set({ flowStateGame: this.gameData });
      
      // Sync to cloud if user is authenticated
      this.syncToCloud();
    } catch (error) {
      console.error('Failed to save game data:', error);
    }
  }

  private setupEventListeners() {
    // Runtime messages
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
      this.handleMessage(request, sender, sendResponse);
      return true; // Keep message channel open for async responses
    });

    // Tab events for focus tracking
    chrome.tabs.onActivated.addListener((activeInfo) => {
      this.handleTabActivated(activeInfo);
    });

    chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
      this.handleTabUpdated(tabId, changeInfo, tab);
    });

    // Web navigation for distraction detection
    chrome.webNavigation.onBeforeNavigate.addListener((details) => {
      if (details.frameId === 0) {
        this.handleNavigation(details);
      }
    });

    // Alarms for timers and reminders
    chrome.alarms.onAlarm.addListener((alarm) => {
      this.handleAlarm(alarm);
    });

    // Installation events
    chrome.runtime.onInstalled.addListener((details) => {
      if (details.reason === 'install') {
        this.handleFirstInstall();
      }
    });
  }

  private connectWebSocket() {
    if (!this.gameData?.subscription || this.gameData.subscription.tier === 'free') {
      return; // WebSocket features for premium users only
    }

    try {
      this.websocket = new WebSocket(this.wsUrl);
      
      this.websocket.onopen = () => {
        console.log('WebSocket connected');
        this.authenticateWebSocket();
      };

      this.websocket.onmessage = (event) => {
        const data: WebSocketEvent = JSON.parse(event.data);
        this.handleWebSocketMessage(data);
      };

      this.websocket.onclose = () => {
        console.log('WebSocket disconnected, attempting reconnect...');
        setTimeout(() => this.connectWebSocket(), 5000);
      };

      this.websocket.onerror = (error) => {
        console.error('WebSocket error:', error);
      };
    } catch (error) {
      console.error('Failed to connect WebSocket:', error);
    }
  }

  private async handleMessage(request: any, sender: chrome.runtime.MessageSender, sendResponse: (response: any) => void) {
    try {
      switch (request.type) {
        case 'focus:start':
          await this.startFocusSession(request.data);
          sendResponse({ success: true });
          break;

        case 'focus:end':
          await this.endFocusSession(request.data);
          sendResponse({ success: true });
          break;

        case 'xp:award':
          await this.awardXP(request.data.amount, request.data.reason);
          sendResponse({ success: true });
          break;

        case 'achievement:check':
          await this.checkAchievements(request.data);
          sendResponse({ success: true });
          break;

        case 'buddy:find':
          const buddy = await this.findBuddy();
          sendResponse({ success: true, data: buddy });
          break;

        case 'analytics:track':
          await this.trackEvent(request.data);
          sendResponse({ success: true });
          break;

        case 'game:sync':
          await this.syncToCloud();
          sendResponse({ success: true });
          break;

        default:
          sendResponse({ success: false, error: 'Unknown message type' });
      }
    } catch (error) {
      console.error('Message handling error:', error);
      sendResponse({ success: false, error: error.message });
    }
  }

  private async startFocusSession(data: { targetDuration: number; startTime: number }) {
    if (!this.gameData) return;

    this.gameData.focusSession = {
      ...this.gameData.focusSession,
      active: true,
      startTime: data.startTime,
      targetDuration: data.targetDuration,
      duration: 0,
      sessionCount: this.gameData.focusSession.sessionCount + 1,
      distractionCount: 0,
      flowStateAchieved: false
    };

    await this.saveGameData();

    // Start focus timer
    this.focusTimer = setInterval(() => {
      this.updateFocusSession();
    }, 1000);

    // Set completion alarm
    chrome.alarms.create('focus_session_complete', { 
      delayInMinutes: data.targetDuration / 60 
    });

    // Update badge
    this.updateBadge('🎯', '#667eea');

    // Notify all extension contexts
    this.broadcastMessage({
      type: 'focus:started',
      data: this.gameData.focusSession
    });

    // Track analytics
    this.trackEvent({
      event: 'focus_session_started',
      properties: {
        target_duration: data.targetDuration,
        session_count: this.gameData.focusSession.sessionCount
      }
    });
  }

  private async endFocusSession(data: { completed: boolean }) {
    if (!this.gameData || !this.gameData.focusSession.active) return;

    const sessionDuration = this.gameData.focusSession.duration;
    const sessionMinutes = Math.floor(sessionDuration / 60);
    
    // Clear timer and alarm
    if (this.focusTimer) {
      clearInterval(this.focusTimer);
      this.focusTimer = null;
    }
    chrome.alarms.clear('focus_session_complete');

    // Calculate rewards
    if (data.completed && sessionMinutes >= 5) {
      const baseXP = sessionMinutes * this.gameData.focusSession.xpRate;
      const multipliedXP = Math.floor(baseXP * this.gameData.focusMultiplier);
      const coins = Math.floor(sessionMinutes / 2);

      await this.awardXP(multipliedXP, 'Focus session completed');
      await this.awardCoins(coins, 'Focus session reward');

      // Check for epic drops
      if (Math.random() < this.gameData.focusSession.epicDropChance) {
        await this.triggerEpicDrop();
      }

      // Check achievements
      await this.checkFocusAchievements(sessionMinutes);
    }

    // Update stats
    this.gameData.stats.totalFocusTime += sessionMinutes;
    if (data.completed) {
      this.gameData.stats.sessionsCompleted++;
      this.gameData.stats.averageSessionLength = Math.floor(
        (this.gameData.stats.averageSessionLength * (this.gameData.stats.sessionsCompleted - 1) + sessionMinutes) / 
        this.gameData.stats.sessionsCompleted
      );
    }

    // Reset session
    this.gameData.focusSession = {
      ...this.gameData.focusSession,
      active: false,
      startTime: null,
      duration: 0
    };

    this.gameData.focusMultiplier = 1; // Reset multiplier

    await this.saveGameData();

    // Update badge
    this.updateBadge('', '');

    // Broadcast session end
    this.broadcastMessage({
      type: 'focus:ended',
      data: { 
        duration: sessionDuration, 
        completed: data.completed,
        xpEarned: data.completed ? Math.floor(sessionMinutes * this.gameData.focusSession.xpRate * this.gameData.focusMultiplier) : 0
      }
    });

    // Track analytics
    this.trackEvent({
      event: 'focus_session_ended',
      properties: {
        duration: sessionDuration,
        completed: data.completed,
        distractions: this.gameData.focusSession.distractionCount
      }
    });
  }

  private updateFocusSession() {
    if (!this.gameData?.focusSession.active) return;

    const elapsed = Math.floor((Date.now() - (this.gameData.focusSession.startTime || 0)) / 1000);
    this.gameData.focusSession.duration = elapsed;

    // Award XP every minute
    if (elapsed % 60 === 0 && elapsed > 0) {
      const minutes = elapsed / 60;
      const xpGained = Math.floor(this.gameData.focusSession.xpRate * this.gameData.focusMultiplier);
      
      this.awardXP(xpGained, `Focus minute ${minutes} completed`);

      // Increase multiplier every 5 minutes
      if (minutes % 5 === 0 && this.gameData.focusMultiplier < 10) {
        this.gameData.focusMultiplier += 0.5;
        this.showNotification(`Focus multiplier increased to ${this.gameData.focusMultiplier}x!`, 'success');
      }

      // Check for flow state (20+ minutes of uninterrupted focus)
      if (minutes >= 20 && this.gameData.focusSession.distractionCount === 0) {
        this.gameData.focusSession.flowStateAchieved = true;
        this.gameData.stats.flowStatesAchieved++;
        this.showNotification('🌊 Flow state achieved! Bonus XP incoming!', 'success');
      }
    }

    this.saveGameData();
  }

  private async awardXP(amount: number, reason: string) {
    if (!this.gameData) return;

    this.gameData.xp += amount;
    this.gameData.totalXP += amount;

    // Check for level up
    while (this.gameData.xp >= this.gameData.xpToNextLevel) {
      this.gameData.xp -= this.gameData.xpToNextLevel;
      this.gameData.level++;
      this.gameData.xpToNextLevel = Math.floor(this.gameData.xpToNextLevel * 1.2);
      
      await this.levelUp();
    }

    await this.saveGameData();

    // Broadcast XP update
    this.broadcastMessage({
      type: 'xp:updated',
      data: { amount, reason, newTotal: this.gameData.xp, level: this.gameData.level }
    });
  }

  private async awardCoins(amount: number, reason: string) {
    if (!this.gameData) return;

    this.gameData.dopamineCoins += amount;
    this.gameData.stats.coinsEarned += amount;

    await this.saveGameData();

    // Broadcast coin update
    this.broadcastMessage({
      type: 'coins:updated',
      data: { amount, reason, newTotal: this.gameData.dopamineCoins }
    });
  }

  private async levelUp() {
    if (!this.gameData) return;

    const coinsReward = this.gameData.level * 5;
    this.gameData.dopamineCoins += coinsReward;

    // Show celebration
    this.showNotification(`🎉 LEVEL UP! You're now level ${this.gameData.level}! +${coinsReward} coins!`, 'success');

    // Check level achievements
    await this.checkLevelAchievements();

    // Broadcast level up
    this.broadcastMessage({
      type: 'level:up',
      data: { newLevel: this.gameData.level, coinsReward }
    });

    // Track analytics
    this.trackEvent({
      event: 'level_up',
      properties: {
        new_level: this.gameData.level,
        coins_reward: coinsReward
      }
    });
  }

  private async triggerEpicDrop() {
    if (!this.gameData) return;

    const epicRewards = [
      { type: 'xp_boost', value: 100, message: '💫 Epic XP Boost! +100 bonus XP!' },
      { type: 'coin_bonus', value: 50, message: '🪙 Epic Coin Drop! +50 dopamine coins!' },
      { type: 'multiplier_boost', value: 2, message: '⚡ Epic Multiplier! 2x XP for next session!' }
    ];

    const reward = epicRewards[Math.floor(Math.random() * epicRewards.length)];
    
    switch (reward.type) {
      case 'xp_boost':
        await this.awardXP(reward.value, 'Epic drop bonus');
        break;
      case 'coin_bonus':
        await this.awardCoins(reward.value, 'Epic drop bonus');
        break;
      case 'multiplier_boost':
        this.gameData.focusMultiplier = Math.min(this.gameData.focusMultiplier + reward.value, 10);
        break;
    }

    this.gameData.stats.epicDropsReceived++;
    this.gameData.focusSession.lastEpicDrop = Date.now();

    this.showNotification(reward.message, 'epic');

    // Broadcast epic drop
    this.broadcastMessage({
      type: 'epic:drop',
      data: reward
    });
  }

  private setupPeriodicTasks() {
    // Daily streak check at midnight
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);
    
    const msUntilMidnight = tomorrow.getTime() - now.getTime();
    
    setTimeout(() => {
      this.checkDailyStreak();
      this.generateDailyChallenge();
      
      // Set up daily recurring check
      setInterval(() => {
        this.checkDailyStreak();
        this.generateDailyChallenge();
      }, 24 * 60 * 60 * 1000);
    }, msUntilMidnight);

    // Periodic sync every 5 minutes
    setInterval(() => {
      this.syncToCloud();
    }, 5 * 60 * 1000);

    // Hyperfocus protection check every 30 minutes
    setInterval(() => {
      this.checkHyperfocusProtection();
    }, 30 * 60 * 1000);
  }

  private async checkHyperfocusProtection() {
    if (!this.gameData?.focusSession.active) return;
    if (!this.gameData.preferences.hyperfocusProtection) return;

    const sessionMinutes = Math.floor(this.gameData.focusSession.duration / 60);
    
    if (sessionMinutes >= 90) { // 1.5 hours
      this.showNotification(
        '🧠 Hyperfocus detected! Time for a wellness break - stretch, hydrate, and rest your eyes.',
        'warning'
      );

      // Send to content script for overlay
      this.broadcastMessage({
        type: 'hyperfocus:warning',
        data: { sessionMinutes }
      });
    }
  }

  private updateBadge(text: string, color: string) {
    chrome.action.setBadgeText({ text });
    chrome.action.setBadgeBackgroundColor({ color });
  }

  private showNotification(message: string, type: 'success' | 'warning' | 'error' | 'epic' = 'success') {
    if (!this.gameData?.preferences.notifications) return;

    const icons = {
      success: '🎉',
      warning: '⚠️',
      error: '❌',
      epic: '💫'
    };

    chrome.notifications.create({
      type: 'basic',
      iconUrl: 'icon.svg',
      title: 'FlowState',
      message: `${icons[type]} ${message}`
    });
  }

  private broadcastMessage(message: any) {
    // Send to all extension contexts
    chrome.runtime.sendMessage(message).catch(() => {
      // Ignore errors if no listeners
    });

    // Send via WebSocket if connected
    if (this.websocket?.readyState === WebSocket.OPEN) {
      this.websocket.send(JSON.stringify(message));
    }
  }

  private async syncToCloud() {
    if (!this.gameData) return;

    try {
      // Only sync if user has premium subscription
      if (this.gameData.subscription.tier === 'free') return;

      const response = await fetch(`${this.apiBaseUrl}/sync`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${await this.getAuthToken()}`
        },
        body: JSON.stringify({
          gameData: this.gameData,
          timestamp: Date.now()
        })
      });

      if (!response.ok) {
        throw new Error(`Sync failed: ${response.statusText}`);
      }

      console.log('Game data synced to cloud');
    } catch (error) {
      console.error('Cloud sync failed:', error);
    }
  }

  private async trackEvent(event: { event: string; properties: any }) {
    try {
      // Track to analytics service
      await fetch(`${this.apiBaseUrl}/analytics/track`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${await this.getAuthToken()}`
        },
        body: JSON.stringify({
          ...event,
          timestamp: Date.now(),
          userId: this.gameData?.subscription ? 'user_id' : 'anonymous'
        })
      });
    } catch (error) {
      console.error('Analytics tracking failed:', error);
    }
  }

  private async getAuthToken(): Promise<string> {
    // Implementation would get JWT token from storage
    return 'mock_token';
  }

  private getDefaultGameData(): GameData {
    // Return default game data structure
    return {
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
        targetDuration: 1500,
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
  }

  // Additional methods would be implemented here...
  private async handleTabActivated(activeInfo: chrome.tabs.TabActiveInfo) {
    // Implementation for tab tracking
  }

  private async handleTabUpdated(tabId: number, changeInfo: chrome.tabs.TabChangeInfo, tab: chrome.tabs.Tab) {
    // Implementation for tab updates
  }

  private async handleNavigation(details: chrome.webNavigation.WebNavigationParentedCallbackDetails) {
    // Implementation for navigation tracking
  }

  private async handleAlarm(alarm: chrome.alarms.Alarm) {
    // Implementation for alarm handling
  }

  private async handleFirstInstall() {
    // Implementation for first install
    chrome.tabs.create({ url: chrome.runtime.getURL('onboarding.html') });
  }

  private async checkDailyStreak() {
    // Implementation for daily streak checking
  }

  private async generateDailyChallenge() {
    // Implementation for daily challenge generation
  }

  private async checkFocusAchievements(minutes: number) {
    // Implementation for focus achievement checking
  }

  private async checkLevelAchievements() {
    // Implementation for level achievement checking
  }

  private async checkAchievements(data: any) {
    // Implementation for general achievement checking
  }

  private async findBuddy() {
    // Implementation for buddy matching
    return null;
  }

  private authenticateWebSocket() {
    // Implementation for WebSocket authentication
  }

  private handleWebSocketMessage(data: WebSocketEvent) {
    // Implementation for WebSocket message handling
  }
}

// Initialize the background service
new FlowStateBackgroundService();