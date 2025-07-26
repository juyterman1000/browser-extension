// background.js - Advanced FlowState Game Engine for ADHD Users

class FlowStateGameEngine {
    constructor() {
        this.gameData = {
            // Core progression system
            level: 1,
            xp: 0,
            xpToNextLevel: 100,
            totalXP: 0,
            prestigeLevel: 0,
            
            // Currency & rewards
            dopamineCoins: 50,
            totalCoinsEarned: 0,
            totalCoinsSpent: 0,
            
            // Streak & engagement
            streak: 0,
            longestStreak: 0,
            lastActiveDate: null,
            
            // Focus mechanics
            focusMultiplier: 1,
            totalFocusHours: 0,
            hyperfocusWarnings: 0,
            
            // Social & viral
            referralCount: 0,
            kFactor: 0,
            buddies: [],
            teamId: null,
            
            // Session tracking
            focusSession: {
                active: false,
                startTime: null,
                duration: 0,
                xpRate: 2,
                sessionCount: 0,
                bonusMultiplier: 1,
                epicDropChance: 0.1,
                lastEpicDrop: null,
                currentUrl: null,
                currentTitle: null,
                distractionCount: 0
            },
            
            // Comprehensive stats
            stats: {
                totalFocusTime: 0,
                sessionsCompleted: 0,
                averageSessionLength: 0,
                bestDay: 0,
                bestWeek: 0,
                coinsEarned: 0,
                coinsSpent: 0,
                socialShares: 0,
                buddyInteractions: 0,
                dailyFocusGoal: 120, // 2 hours
                weeklyFocusGoal: 840, // 14 hours
                thoughtsParked: 0,
                contextsRestored: 0,
                hyperfocusBreaks: 0
            },
            
            // Social features
            social: {
                shares: 0,
                referrals: 0,
                buddyInteractions: 0,
                teamChallenges: 0,
                leaderboardRank: 0,
                flowStateMoments: [],
                lastShareTime: null
            },
            
            // User preferences
            preferences: {
                notifications: true,
                sounds: true,
                theme: 'dark', // ADHD-friendly default
                difficulty: 'medium',
                autoShare: false,
                buddyNotifications: true,
                epicDrops: true,
                variableRewards: true,
                hyperfocusAlerts: true,
                breakReminders: true,
                thoughtParkingShortcut: true
            },
            
            // Subscription & monetization
            subscription: {
                tier: 'free', // free, premium, team
                expiresAt: null,
                features: ['basic_xp', 'limited_coins', 'single_buddy'],
                dailyCoinLimit: 50,
                buddyLimit: 1,
                customChallenges: false,
                advancedAnalytics: false,
                prioritySupport: false
            },
            
            // Achievements & challenges
            achievements: [],
            dailyChallenge: null,
            weeklyChallenge: null,
            
            // ADHD-specific features
            adhdFeatures: {
                thoughtParking: {
                    enabled: true,
                    thoughts: [],
                    categories: ['work', 'personal', 'ideas', 'reminders']
                },
                contextRestoration: {
                    enabled: true,
                    savedContexts: [],
                    autoSave: true
                },
                hyperfocusProtection: {
                    enabled: true,
                    maxSessionTime: 120, // 2 hours
                    warningTime: 90, // 1.5 hours
                    breakReminders: true
                },
                distractionBlocking: {
                    enabled: true,
                    blockedSites: ['reddit.com', 'youtube.com', 'facebook.com', 'twitter.com', 'instagram.com', 'tiktok.com'],
                    allowedTime: 0,
                    earnedTime: 0
                }
            }
        };

        // Advanced achievement system with psychological hooks
        this.achievements = [
            // Onboarding achievements (quick wins)
            { 
                id: 'first_focus', 
                name: 'First Steps', 
                description: 'Complete your first focus session', 
                xp: 25, 
                coins: 5, 
                icon: '🎯', 
                category: 'onboarding',
                rarity: 'common',
                celebrationLevel: 'medium'
            },
            { 
                id: 'first_share', 
                name: 'Show Off', 
                description: 'Share your first achievement', 
                xp: 30, 
                coins: 10, 
                icon: '📱', 
                category: 'social',
                rarity: 'common',
                celebrationLevel: 'high'
            },
            { 
                id: 'first_buddy', 
                name: 'Dynamic Duo', 
                description: 'Connect with your first ADHD buddy', 
                xp: 40, 
                coins: 15, 
                icon: '🤝', 
                category: 'social',
                rarity: 'common',
                celebrationLevel: 'high'
            },
            
            // Streak achievements (loss aversion)
            { 
                id: 'streak_3', 
                name: 'Getting Started', 
                description: '3-day focus streak', 
                xp: 50, 
                coins: 10, 
                icon: '🔥', 
                category: 'streak',
                rarity: 'common',
                celebrationLevel: 'medium'
            },
            { 
                id: 'streak_7', 
                name: 'Week Warrior', 
                description: '7-day focus streak', 
                xp: 100, 
                coins: 25, 
                icon: '⚡', 
                category: 'streak',
                rarity: 'uncommon',
                celebrationLevel: 'high'
            },
            { 
                id: 'streak_30', 
                name: 'Month Master', 
                description: '30-day focus streak', 
                xp: 500, 
                coins: 100, 
                icon: '👑', 
                category: 'streak',
                rarity: 'rare',
                celebrationLevel: 'epic'
            },
            { 
                id: 'streak_100', 
                name: 'Legendary Streak', 
                description: '100-day focus streak', 
                xp: 2000, 
                coins: 500, 
                icon: '🏆', 
                category: 'streak',
                rarity: 'legendary',
                celebrationLevel: 'legendary'
            },
            
            // Level achievements (progress investment)
            { 
                id: 'level_5', 
                name: 'Rising Star', 
                description: 'Reach level 5', 
                xp: 0, 
                coins: 25, 
                icon: '⭐', 
                category: 'level',
                rarity: 'common',
                celebrationLevel: 'medium'
            },
            { 
                id: 'level_10', 
                name: 'Focus Veteran', 
                description: 'Reach level 10', 
                xp: 0, 
                coins: 50, 
                icon: '🏆', 
                category: 'level',
                rarity: 'uncommon',
                celebrationLevel: 'high'
            },
            { 
                id: 'level_25', 
                name: 'ADHD Champion', 
                description: 'Reach level 25', 
                xp: 0, 
                coins: 100, 
                icon: '🎖️', 
                category: 'level',
                rarity: 'rare',
                celebrationLevel: 'epic'
            },
            { 
                id: 'level_50', 
                name: 'FlowState Master', 
                description: 'Reach level 50', 
                xp: 0, 
                coins: 250, 
                icon: '👑', 
                category: 'level',
                rarity: 'epic',
                celebrationLevel: 'legendary'
            },
            { 
                id: 'prestige_1', 
                name: 'Prestige Warrior', 
                description: 'Reach your first prestige level', 
                xp: 0, 
                coins: 1000, 
                icon: '💎', 
                category: 'prestige',
                rarity: 'legendary',
                celebrationLevel: 'legendary'
            },
            
            // Focus achievements
            { 
                id: 'focus_25', 
                name: 'Pomodoro Master', 
                description: 'Focus for 25 minutes straight', 
                xp: 50, 
                coins: 10, 
                icon: '🍅', 
                category: 'focus',
                rarity: 'common',
                celebrationLevel: 'medium'
            },
            { 
                id: 'focus_60', 
                name: 'Deep Diver', 
                description: 'Focus for 60 minutes straight', 
                xp: 100, 
                coins: 20, 
                icon: '🧠', 
                category: 'focus',
                rarity: 'uncommon',
                celebrationLevel: 'high'
            },
            { 
                id: 'focus_120', 
                name: 'Hyperfocus Hero', 
                description: 'Focus for 2 hours straight', 
                xp: 200, 
                coins: 50, 
                icon: '🚀', 
                category: 'focus',
                rarity: 'rare',
                celebrationLevel: 'epic'
            },
            { 
                id: 'focus_240', 
                name: 'Flow State Legend', 
                description: 'Focus for 4 hours straight', 
                xp: 500, 
                coins: 150, 
                icon: '🌊', 
                category: 'focus',
                rarity: 'legendary',
                celebrationLevel: 'legendary'
            },
            
            // Social achievements (viral mechanics)
            { 
                id: 'referral_1', 
                name: 'Spreader of Focus', 
                description: 'Refer your first friend', 
                xp: 100, 
                coins: 25, 
                icon: '🌟', 
                category: 'social',
                rarity: 'uncommon',
                celebrationLevel: 'high'
            },
            { 
                id: 'referral_5', 
                name: 'Viral Champion', 
                description: 'Refer 5 friends to FlowState', 
                xp: 500, 
                coins: 100, 
                icon: '🚀', 
                category: 'social',
                rarity: 'rare',
                celebrationLevel: 'epic'
            },
            { 
                id: 'buddy_week', 
                name: 'Accountability Partner', 
                description: 'Check in with buddy for 7 days straight', 
                xp: 150, 
                coins: 30, 
                icon: '🤝', 
                category: 'social',
                rarity: 'uncommon',
                celebrationLevel: 'high'
            },
            
            // ADHD-specific achievements
            { 
                id: 'thought_parker', 
                name: 'Thought Organizer', 
                description: 'Park 50 thoughts successfully', 
                xp: 100, 
                coins: 25, 
                icon: '🧠', 
                category: 'adhd',
                rarity: 'uncommon',
                celebrationLevel: 'medium'
            },
            { 
                id: 'context_master', 
                name: 'Context Switcher', 
                description: 'Save and restore 10 contexts', 
                xp: 75, 
                coins: 20, 
                icon: '🔄', 
                category: 'adhd',
                rarity: 'uncommon',
                celebrationLevel: 'medium'
            },
            { 
                id: 'hyperfocus_guardian', 
                name: 'Self-Care Champion', 
                description: 'Take 20 hyperfocus breaks', 
                xp: 200, 
                coins: 40, 
                icon: '🛡️', 
                category: 'adhd',
                rarity: 'rare',
                celebrationLevel: 'high'
            }
        ];

        // Daily challenges with ADHD-friendly variety
        this.dailyChallenges = [
            { 
                type: 'focus_time', 
                description: 'Focus for 25 minutes total today', 
                target: 25, 
                unit: 'minutes', 
                xp: 50, 
                coins: 15,
                difficulty: 'easy'
            },
            { 
                type: 'focus_sessions', 
                description: 'Complete 3 focus sessions today', 
                target: 3, 
                unit: 'sessions', 
                xp: 75, 
                coins: 20,
                difficulty: 'medium'
            },
            { 
                type: 'streak_maintain', 
                description: 'Maintain your focus streak', 
                target: 1, 
                unit: 'day', 
                xp: 40, 
                coins: 10,
                difficulty: 'easy'
            },
            { 
                type: 'no_distractions', 
                description: 'Avoid distraction sites for 2 hours', 
                target: 120, 
                unit: 'minutes', 
                xp: 60, 
                coins: 18,
                difficulty: 'medium'
            },
            { 
                type: 'buddy_interaction', 
                description: 'Check in with your ADHD buddy', 
                target: 1, 
                unit: 'interaction', 
                xp: 30, 
                coins: 8,
                difficulty: 'easy'
            },
            { 
                type: 'thought_parking', 
                description: 'Park 5 thoughts instead of getting distracted', 
                target: 5, 
                unit: 'thoughts', 
                xp: 45, 
                coins: 12,
                difficulty: 'medium'
            },
            { 
                type: 'deep_focus', 
                description: 'Complete one 60+ minute focus session', 
                target: 60, 
                unit: 'minutes', 
                xp: 100, 
                coins: 25,
                difficulty: 'hard'
            }
        ];

        // Performance tracking
        this.performanceMetrics = {
            apiCalls: 0,
            cacheHits: 0,
            cacheMisses: 0,
            averageResponseTime: 0,
            errorCount: 0,
            lastSync: null
        };

        // Real-time features
        this.realTimeFeatures = {
            buddyPresence: new Map(),
            activeChallenge: null,
            liveLeaderboard: [],
            epicDropActive: false
        };

        this.focusTimer = null;
        this.hyperfocusTimer = null;
        this.streakTimer = null;
        this.syncTimer = null;
        
        this.init();
    }

    async init() {
        console.log('🚀 FlowState Game Engine initializing...');
        
        try {
            await this.loadGameData();
            this.setupEventListeners();
            this.startDailyTracking();
            this.checkDailyChallenge();
            this.setupContextMenus();
            this.startPeriodicUpdates();
            this.initializeRealTimeFeatures();
            
            console.log('✅ FlowState Game Engine initialized successfully');
            
            // Track initialization for analytics
            this.trackEvent('engine_initialized', {
                level: this.gameData.level,
                streak: this.gameData.streak,
                subscription: this.gameData.subscription.tier
            });
            
        } catch (error) {
            console.error('❌ FlowState initialization failed:', error);
            this.handleError('initialization_failed', error);
        }
    }

    async loadGameData() {
        try {
            const saved = await chrome.storage.local.get(['flowStateGame']);
            if (saved.flowStateGame) {
                // Merge saved data with defaults to handle new features
                this.gameData = this.mergeGameData(this.gameData, saved.flowStateGame);
            }
            
            // Load additional data
            const additionalData = await chrome.storage.local.get([
                'dopamineQueue', 
                'parkedThoughts', 
                'savedContexts',
                'buddyData',
                'performanceMetrics'
            ]);
            
            if (additionalData.dopamineQueue) {
                this.gameData.adhdFeatures.distractionBlocking = {
                    ...this.gameData.adhdFeatures.distractionBlocking,
                    ...additionalData.dopamineQueue
                };
            }
            
            if (additionalData.parkedThoughts) {
                this.gameData.adhdFeatures.thoughtParking.thoughts = additionalData.parkedThoughts;
            }
            
            if (additionalData.savedContexts) {
                this.gameData.adhdFeatures.contextRestoration.savedContexts = additionalData.savedContexts;
            }
            
            if (additionalData.performanceMetrics) {
                this.performanceMetrics = { ...this.performanceMetrics, ...additionalData.performanceMetrics };
            }
            
        } catch (error) {
            console.error('Error loading game data:', error);
            this.handleError('data_load_failed', error);
        }
    }

    mergeGameData(defaultData, savedData) {
        // Deep merge function to handle new features gracefully
        const merged = JSON.parse(JSON.stringify(defaultData));
        
        for (const key in savedData) {
            if (savedData.hasOwnProperty(key)) {
                if (typeof savedData[key] === 'object' && savedData[key] !== null && !Array.isArray(savedData[key])) {
                    merged[key] = { ...merged[key], ...savedData[key] };
                } else {
                    merged[key] = savedData[key];
                }
            }
        }
        
        return merged;
    }

    async saveGameData() {
        try {
            const dataToSave = {
                flowStateGame: this.gameData,
                dopamineQueue: this.gameData.adhdFeatures.distractionBlocking,
                parkedThoughts: this.gameData.adhdFeatures.thoughtParking.thoughts,
                savedContexts: this.gameData.adhdFeatures.contextRestoration.savedContexts,
                performanceMetrics: this.performanceMetrics,
                lastSaved: Date.now()
            };
            
            await chrome.storage.local.set(dataToSave);
            
            // Sync to cloud if premium user
            if (this.gameData.subscription.tier !== 'free') {
                this.syncToCloud();
            }
            
        } catch (error) {
            console.error('Error saving game data:', error);
            this.handleError('data_save_failed', error);
        }
    }

    setupEventListeners() {
        // Tab events for advanced focus tracking
        chrome.tabs.onActivated.addListener((activeInfo) => this.handleTabActivated(activeInfo));
        chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => this.handleTabUpdated(tabId, changeInfo, tab));
        chrome.tabs.onRemoved.addListener((tabId) => this.handleTabClosed(tabId));
        
        // Web navigation for intelligent distraction blocking
        chrome.webNavigation.onBeforeNavigate.addListener((details) => {
            if (details.frameId === 0) {
                this.handleNavigation(details);
            }
        });

        // Runtime messages with comprehensive handling
        chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
            this.handleMessage(request, sender, sendResponse);
            return true; // Keep message channel open for async responses
        });

        // Alarms for various timers and reminders
        chrome.alarms.onAlarm.addListener((alarm) => this.handleAlarm(alarm));

        // Installation and update events
        chrome.runtime.onInstalled.addListener((details) => {
            if (details.reason === 'install') {
                this.handleFirstInstall();
            } else if (details.reason === 'update') {
                this.handleUpdate(details.previousVersion);
            }
        });

        // Startup event
        chrome.runtime.onStartup.addListener(() => {
            this.handleStartup();
        });
    }

    setupContextMenus() {
        // Enhanced context menus for ADHD workflow
        chrome.contextMenus.removeAll(() => {
            chrome.contextMenus.create({
                id: 'start-focus-session',
                title: '🎯 Start Focus Session',
                contexts: ['page']
            });

            chrome.contextMenus.create({
                id: 'park-thought',
                title: '🚗 Park This Thought',
                contexts: ['selection']
            });

            chrome.contextMenus.create({
                id: 'save-context',
                title: '💾 Save Current Context',
                contexts: ['page']
            });

            chrome.contextMenus.create({
                id: 'share-achievement',
                title: '📱 Share FlowState Win',
                contexts: ['page']
            });

            chrome.contextMenus.create({
                id: 'quick-break',
                title: '⏰ Take Smart Break',
                contexts: ['page']
            });
        });

        chrome.contextMenus.onClicked.addListener((info, tab) => {
            switch (info.menuItemId) {
                case 'start-focus-session':
                    this.startFocusSession();
                    break;
                case 'park-thought':
                    this.parkThought(info.selectionText, tab);
                    break;
                case 'save-context':
                    this.saveCurrentContext();
                    break;
                case 'share-achievement':
                    this.shareLatestAchievement();
                    break;
                case 'quick-break':
                    this.suggestSmartBreak();
                    break;
            }
        });
    }

    async startFocusSession(duration = 25, customGoal = null) {
        if (this.gameData.focusSession.active) {
            this.sendNotification('Focus session already active! 🎯', 'info');
            return { success: false, reason: 'session_already_active' };
        }

        // Initialize session with enhanced tracking
        this.gameData.focusSession = {
            active: true,
            startTime: Date.now(),
            duration: 0,
            targetDuration: duration * 60,
            xpRate: this.calculateXPRate(),
            sessionCount: this.gameData.focusSession.sessionCount + 1,
            bonusMultiplier: 1,
            epicDropChance: this.calculateEpicDropChance(),
            lastEpicDrop: null,
            currentUrl: null,
            currentTitle: null,
            distractionCount: 0,
            customGoal: customGoal
        };

        await this.saveGameData();

        // Start the advanced focus timer
        this.focusTimer = setInterval(() => {
            this.updateFocusSession();
        }, 1000);

        // Set up hyperfocus protection
        if (this.gameData.adhdFeatures.hyperfocusProtection.enabled) {
            this.setupHyperfocusProtection(duration);
        }

        // Set completion alarm
        chrome.alarms.create('focus_session_complete', { delayInMinutes: duration });
        
        // Track session start
        this.trackEvent('focus_session_started', {
            duration: duration,
            sessionCount: this.gameData.focusSession.sessionCount,
            level: this.gameData.level
        });

        this.sendNotification(`🎯 Focus session started! ${duration} minutes to go!`, 'success');
        
        // Notify all contexts
        this.broadcastMessage({ 
            type: 'focusSessionStarted', 
            data: this.gameData.focusSession 
        });

        return { success: true, sessionData: this.gameData.focusSession };
    }

    updateFocusSession() {
        if (!this.gameData.focusSession.active) return;

        this.gameData.focusSession.duration++;
        
        // Award XP every minute with variable rewards
        if (this.gameData.focusSession.duration % 60 === 0) {
            const minutes = this.gameData.focusSession.duration / 60;
            let xpGained = Math.floor(this.gameData.focusSession.xpRate * this.gameData.focusMultiplier);
            
            // Variable reward system (psychological hook)
            if (this.gameData.preferences.variableRewards) {
                const randomBonus = Math.random();
                if (randomBonus < 0.1) { // 10% chance for epic drop
                    xpGained *= 3;
                    this.triggerEpicDrop('xp_bonus', xpGained);
                } else if (randomBonus < 0.3) { // 20% chance for bonus
                    xpGained = Math.floor(xpGained * 1.5);
                }
            }
            
            this.awardXP(xpGained, `Focus minute ${minutes} completed!`);
            
            // Increase multiplier every 5 minutes (up to 10x)
            if (minutes % 5 === 0 && this.gameData.focusMultiplier < 10) {
                this.gameData.focusMultiplier += 0.5;
                this.sendNotification(`🔥 Focus multiplier increased to ${this.gameData.focusMultiplier}x!`, 'success');
            }

            // Award dopamine coins
            if (minutes % 10 === 0) {
                const coinsEarned = Math.floor(minutes / 10) * 2;
                this.awardDopamineCoins(coinsEarned, 'Focus milestone reward!');
            }

            // Update daily challenge
            this.updateDailyChallengeProgress('focus_time', 1);
            
            // Check for focus achievements
            this.checkFocusAchievements(minutes);
        }
        
        // Save progress every 30 seconds
        if (this.gameData.focusSession.duration % 30 === 0) {
            this.saveGameData();
        }

        // Broadcast real-time updates
        this.broadcastMessage({ 
            type: 'sessionUpdate', 
            data: {
                duration: this.gameData.focusSession.duration,
                xpRate: this.gameData.focusSession.xpRate,
                multiplier: this.gameData.focusMultiplier
            }
        });
    }

    setupHyperfocusProtection(sessionDuration) {
        const warningTime = this.gameData.adhdFeatures.hyperfocusProtection.warningTime;
        const maxTime = this.gameData.adhdFeatures.hyperfocusProtection.maxSessionTime;
        
        // Set warning alarm
        if (sessionDuration > warningTime) {
            chrome.alarms.create('hyperfocus_warning', { delayInMinutes: warningTime });
        }
        
        // Set maximum session alarm
        if (sessionDuration > maxTime) {
            chrome.alarms.create('hyperfocus_break', { delayInMinutes: maxTime });
        }
    }

    async endFocusSession(completed = false, reason = 'user_ended') {
        if (!this.gameData.focusSession.active) return { success: false, reason: 'no_active_session' };

        const sessionMinutes = Math.floor(this.gameData.focusSession.duration / 60);
        const sessionData = { ...this.gameData.focusSession };
        
        // Clear timers
        if (this.focusTimer) {
            clearInterval(this.focusTimer);
            this.focusTimer = null;
        }

        // Clear alarms
        chrome.alarms.clear('focus_session_complete');
        chrome.alarms.clear('hyperfocus_warning');
        chrome.alarms.clear('hyperfocus_break');

        if (completed && sessionMinutes >= 5) {
            // Award completion bonuses
            const completionBonus = Math.floor(sessionMinutes * 1.5);
            const coinsEarned = Math.floor(sessionMinutes / 2);
            
            await this.awardXP(completionBonus, 'Focus session completed!');
            await this.awardDopamineCoins(coinsEarned, 'Focus reward!');
            
            // Update comprehensive stats
            this.gameData.stats.sessionsCompleted++;
            this.gameData.stats.totalFocusTime += sessionMinutes;
            this.gameData.stats.averageSessionLength = Math.floor(
                (this.gameData.stats.averageSessionLength * (this.gameData.stats.sessionsCompleted - 1) + sessionMinutes) / 
                this.gameData.stats.sessionsCompleted
            );

            // Update daily/weekly goals
            this.updateFocusGoals(sessionMinutes);
            
            // Check achievements
            this.checkFocusAchievements(sessionMinutes);
            
            // Update daily challenge
            this.updateDailyChallengeProgress('focus_sessions', 1);
            
            // Create FlowState Moment for sharing
            if (sessionMinutes >= 25) {
                this.createFlowStateMoment(sessionData, completionBonus, coinsEarned);
            }
            
            this.sendNotification(`🎉 Session complete! +${completionBonus} XP, +${coinsEarned} coins!`, 'success');
        }

        // Reset session
        this.gameData.focusSession = {
            active: false,
            startTime: null,
            duration: 0,
            xpRate: 2,
            sessionCount: this.gameData.focusSession.sessionCount,
            bonusMultiplier: 1,
            epicDropChance: 0.1,
            lastEpicDrop: null,
            currentUrl: null,
            currentTitle: null,
            distractionCount: 0
        };

        this.gameData.focusMultiplier = 1;
        
        // Track session end
        this.trackEvent('focus_session_ended', {
            duration: sessionMinutes,
            completed: completed,
            reason: reason,
            xpEarned: completed ? Math.floor(sessionMinutes * 1.5) : 0
        });

        await this.saveGameData();
        
        this.broadcastMessage({ 
            type: 'focusSessionEnded', 
            data: { completed, sessionMinutes, reason }
        });

        return { 
            success: true, 
            sessionData: sessionData,
            rewards: completed ? { xp: Math.floor(sessionMinutes * 1.5), coins: Math.floor(sessionMinutes / 2) } : null
        };
    }

    calculateXPRate() {
        // Dynamic XP rate based on user level and subscription
        let baseRate = 2;
        
        // Level bonus
        baseRate += Math.floor(this.gameData.level / 10);
        
        // Subscription bonus
        if (this.gameData.subscription.tier === 'premium') {
            baseRate *= 1.5;
        } else if (this.gameData.subscription.tier === 'team') {
            baseRate *= 2;
        }
        
        // Streak bonus
        if (this.gameData.streak >= 7) {
            baseRate *= 1.2;
        }
        if (this.gameData.streak >= 30) {
            baseRate *= 1.5;
        }
        
        return Math.floor(baseRate);
    }

    calculateEpicDropChance() {
        let baseChance = 0.1; // 10% base chance
        
        // Increase chance based on streak
        baseChance += (this.gameData.streak * 0.01);
        
        // Premium users get better chances
        if (this.gameData.subscription.tier !== 'free') {
            baseChance *= 1.5;
        }
        
        return Math.min(baseChance, 0.3); // Cap at 30%
    }

    triggerEpicDrop(type, value) {
        if (!this.gameData.preferences.epicDrops) return;
        
        const epicDrop = {
            type: type,
            value: value,
            timestamp: Date.now(),
            rarity: this.determineRarity(value)
        };
        
        this.gameData.focusSession.lastEpicDrop = epicDrop;
        
        // Show epic celebration
        this.broadcastMessage({
            type: 'epicDrop',
            data: epicDrop
        });
        
        // Track for analytics
        this.trackEvent('epic_drop_triggered', {
            type: type,
            value: value,
            rarity: epicDrop.rarity
        });
    }

    determineRarity(value) {
        if (value >= 100) return 'legendary';
        if (value >= 50) return 'epic';
        if (value >= 25) return 'rare';
        if (value >= 10) return 'uncommon';
        return 'common';
    }

    async parkThought(thought, tab = null, category = 'general') {
        if (!thought || !thought.trim()) return { success: false, reason: 'empty_thought' };

        const parkedThought = {
            id: Date.now(),
            text: thought.trim(),
            category: category,
            timestamp: Date.now(),
            url: tab?.url || '',
            title: tab?.title || '',
            processed: false,
            priority: 'medium'
        };

        this.gameData.adhdFeatures.thoughtParking.thoughts.unshift(parkedThought);
        
        // Keep only last 100 thoughts
        if (this.gameData.adhdFeatures.thoughtParking.thoughts.length > 100) {
            this.gameData.adhdFeatures.thoughtParking.thoughts = 
                this.gameData.adhdFeatures.thoughtParking.thoughts.slice(0, 100);
        }

        // Update stats
        this.gameData.stats.thoughtsParked++;
        
        // Award XP for good ADHD management
        await this.awardXP(5, 'Thought parked successfully!');
        
        // Check thought parking achievements
        this.checkThoughtParkingAchievements();
        
        await this.saveGameData();
        
        this.sendNotification('💭 Thought parked! Back to your flow state 🌊', 'success');
        
        // Track for analytics
        this.trackEvent('thought_parked', {
            category: category,
            hasUrl: !!tab?.url,
            totalThoughts: this.gameData.stats.thoughtsParked
        });

        return { success: true, thought: parkedThought };
    }

    async saveCurrentContext(name = null) {
        try {
            const tabs = await chrome.tabs.query({ currentWindow: true });
            const activeTab = tabs.find(tab => tab.active);
            
            const context = {
                id: Date.now(),
                name: name || `Context ${new Date().toLocaleString()}`,
                tabs: tabs.map(tab => ({
                    url: tab.url,
                    title: tab.title,
                    active: tab.active,
                    pinned: tab.pinned
                })),
                timestamp: Date.now(),
                activeTabIndex: tabs.findIndex(tab => tab.active),
                windowId: tabs[0]?.windowId
            };

            this.gameData.adhdFeatures.contextRestoration.savedContexts.unshift(context);
            
            // Keep only last 10 contexts
            if (this.gameData.adhdFeatures.contextRestoration.savedContexts.length > 10) {
                this.gameData.adhdFeatures.contextRestoration.savedContexts = 
                    this.gameData.adhdFeatures.contextRestoration.savedContexts.slice(0, 10);
            }

            // Update stats
            this.gameData.stats.contextsRestored++;
            
            // Award XP
            await this.awardXP(10, 'Context saved!');
            
            await this.saveGameData();
            
            this.sendNotification(`💾 Context saved! ${tabs.length} tabs captured.`, 'success');
            
            // Track for analytics
            this.trackEvent('context_saved', {
                tabCount: tabs.length,
                totalContexts: this.gameData.adhdFeatures.contextRestoration.savedContexts.length
            });

            return { success: true, context: context };
            
        } catch (error) {
            console.error('Error saving context:', error);
            this.handleError('context_save_failed', error);
            return { success: false, error: error.message };
        }
    }

    async restoreContext(contextId) {
        try {
            const context = this.gameData.adhdFeatures.contextRestoration.savedContexts
                .find(c => c.id === contextId);
            
            if (!context) {
                return { success: false, reason: 'context_not_found' };
            }

            // Close current tabs (except pinned ones)
            const currentTabs = await chrome.tabs.query({ currentWindow: true });
            for (const tab of currentTabs) {
                if (!tab.pinned && tab.url !== 'chrome://newtab/') {
                    chrome.tabs.remove(tab.id);
                }
            }

            // Open saved tabs
            let activeTabId = null;
            for (let i = 0; i < context.tabs.length; i++) {
                const tabData = context.tabs[i];
                const newTab = await chrome.tabs.create({
                    url: tabData.url,
                    active: false,
                    pinned: tabData.pinned
                });
                
                if (i === context.activeTabIndex) {
                    activeTabId = newTab.id;
                }
            }

            // Activate the originally active tab
            if (activeTabId) {
                chrome.tabs.update(activeTabId, { active: true });
            }

            // Award XP
            await this.awardXP(15, 'Context restored!');
            
            this.sendNotification(`🔄 Context restored! ${context.tabs.length} tabs opened.`, 'success');
            
            // Track for analytics
            this.trackEvent('context_restored', {
                tabCount: context.tabs.length,
                contextAge: Date.now() - context.timestamp
            });

            return { success: true, context: context };
            
        } catch (error) {
            console.error('Error restoring context:', error);
            this.handleError('context_restore_failed', error);
            return { success: false, error: error.message };
        }
    }

    createFlowStateMoment(sessionData, xpEarned, coinsEarned) {
        const moment = {
            id: Date.now(),
            type: 'focus_session',
            duration: Math.floor(sessionData.duration / 60),
            xpEarned: xpEarned,
            coinsEarned: coinsEarned,
            level: this.gameData.level,
            streak: this.gameData.streak,
            timestamp: Date.now(),
            shared: false,
            achievements: [] // Any achievements unlocked during session
        };

        this.gameData.social.flowStateMoments.unshift(moment);
        
        // Keep only last 20 moments
        if (this.gameData.social.flowStateMoments.length > 20) {
            this.gameData.social.flowStateMoments = 
                this.gameData.social.flowStateMoments.slice(0, 20);
        }

        // Suggest sharing if it's a good session
        if (sessionData.duration >= 1800) { // 30+ minutes
            this.suggestSharing(moment);
        }

        return moment;
    }

    suggestSharing(moment) {
        // Don't spam sharing suggestions
        const lastShare = this.gameData.social.lastShareTime;
        if (lastShare && Date.now() - lastShare < 24 * 60 * 60 * 1000) { // 24 hours
            return;
        }

        this.broadcastMessage({
            type: 'sharingSuggestion',
            data: {
                moment: moment,
                message: `🎉 Amazing ${moment.duration}-minute focus session! Share your FlowState moment?`
            }
        });
    }

    async shareAchievement(achievementId, platform = 'twitter') {
        try {
            const achievement = this.gameData.achievements.find(a => a.id === achievementId);
            if (!achievement) {
                return { success: false, reason: 'achievement_not_found' };
            }

            // Generate sharing content
            const shareContent = this.generateShareContent(achievement, platform);
            
            // Open sharing URL
            const shareUrl = this.buildShareUrl(platform, shareContent);
            chrome.tabs.create({ url: shareUrl });

            // Award sharing bonus
            await this.awardXP(10, 'Social sharing bonus!');
            await this.awardDopamineCoins(5, 'Sharing reward!');
            
            // Update stats
            this.gameData.stats.socialShares++;
            this.gameData.social.shares++;
            this.gameData.social.lastShareTime = Date.now();
            
            // Mark achievement as shared
            achievement.shared = true;
            achievement.shareCount = (achievement.shareCount || 0) + 1;
            
            // Check social achievements
            this.checkSocialAchievements();
            
            await this.saveGameData();
            
            this.sendNotification('📱 Achievement shared! +10 XP bonus!', 'success');
            
            // Track for analytics
            this.trackEvent('achievement_shared', {
                achievementId: achievementId,
                platform: platform,
                totalShares: this.gameData.stats.socialShares
            });

            return { success: true, shareUrl: shareUrl };
            
        } catch (error) {
            console.error('Error sharing achievement:', error);
            this.handleError('share_failed', error);
            return { success: false, error: error.message };
        }
    }

    generateShareContent(achievement, platform) {
        const templates = {
            twitter: `🎉 Just unlocked "${achievement.name}" in @FlowStateApp! ${achievement.icon} 

${achievement.description}

Turning my ADHD into a superpower, one focus session at a time! 🧠⚡

#ADHD #Productivity #FlowState #ADHDSuperpowers`,

            linkedin: `🎯 Productivity Milestone Unlocked!

Just achieved "${achievement.name}" using FlowState - a game-changing browser extension designed specifically for ADHD minds.

${achievement.description}

It's amazing how gamification can transform focus challenges into achievements. The ADHD brain is incredibly powerful when we work WITH it instead of against it.

#ADHD #Productivity #Neurodiversity #FlowState`,

            instagram: `🎉 FlowState Achievement Unlocked! 

"${achievement.name}" ${achievement.icon}

${achievement.description}

Turning ADHD traits into superpowers! 🧠⚡

#ADHD #Productivity #FlowState #ADHDSuperpowers #Neurodiversity #FocusWin`
        };

        return templates[platform] || templates.twitter;
    }

    buildShareUrl(platform, content) {
        const urls = {
            twitter: `https://twitter.com/intent/tweet?text=${encodeURIComponent(content)}`,
            linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent('https://flowstate.app')}&summary=${encodeURIComponent(content)}`,
            instagram: `https://www.instagram.com/` // Instagram doesn't support direct sharing
        };

        return urls[platform] || urls.twitter;
    }

    // Advanced achievement checking with psychological hooks
    checkFocusAchievements(minutes) {
        const achievements = [
            { id: 'focus_25', condition: () => minutes >= 25 },
            { id: 'focus_60', condition: () => minutes >= 60 },
            { id: 'focus_120', condition: () => minutes >= 120 },
            { id: 'focus_240', condition: () => minutes >= 240 }
        ];
        
        achievements.forEach(achievement => {
            if (!this.hasAchievement(achievement.id) && achievement.condition()) {
                this.unlockAchievement(achievement.id);
            }
        });
        
        // First focus session
        if (this.gameData.stats.sessionsCompleted === 1) {
            this.unlockAchievement('first_focus');
        }
    }

    checkStreakAchievements() {
        const streakAchievements = [
            { id: 'streak_3', condition: () => this.gameData.streak >= 3 },
            { id: 'streak_7', condition: () => this.gameData.streak >= 7 },
            { id: 'streak_30', condition: () => this.gameData.streak >= 30 },
            { id: 'streak_100', condition: () => this.gameData.streak >= 100 }
        ];
        
        streakAchievements.forEach(achievement => {
            if (!this.hasAchievement(achievement.id) && achievement.condition()) {
                this.unlockAchievement(achievement.id);
            }
        });
    }

    checkLevelAchievements() {
        const levelAchievements = [
            { id: 'level_5', condition: () => this.gameData.level >= 5 },
            { id: 'level_10', condition: () => this.gameData.level >= 10 },
            { id: 'level_25', condition: () => this.gameData.level >= 25 },
            { id: 'level_50', condition: () => this.gameData.level >= 50 }
        ];
        
        levelAchievements.forEach(achievement => {
            if (!this.hasAchievement(achievement.id) && achievement.condition()) {
                this.unlockAchievement(achievement.id);
            }
        });

        // Check for prestige
        if (this.gameData.level >= 100 && this.gameData.prestigeLevel === 0) {
            this.unlockAchievement('prestige_1');
        }
    }

    checkSocialAchievements() {
        if (this.gameData.stats.socialShares >= 1) {
            this.unlockAchievement('first_share');
        }
        
        if (this.gameData.referralCount >= 1) {
            this.unlockAchievement('referral_1');
        }
        
        if (this.gameData.referralCount >= 5) {
            this.unlockAchievement('referral_5');
        }
    }

    checkThoughtParkingAchievements() {
        if (this.gameData.stats.thoughtsParked >= 50) {
            this.unlockAchievement('thought_parker');
        }
    }

    // Enhanced error handling and analytics
    handleError(errorType, error) {
        console.error(`FlowState Error [${errorType}]:`, error);
        
        this.performanceMetrics.errorCount++;
        
        // Track error for analytics
        this.trackEvent('error_occurred', {
            errorType: errorType,
            errorMessage: error.message || 'Unknown error',
            timestamp: Date.now(),
            userLevel: this.gameData.level,
            sessionActive: this.gameData.focusSession.active
        });
        
        // Show user-friendly error message
        const userMessages = {
            'initialization_failed': 'FlowState had trouble starting. Please refresh and try again.',
            'data_save_failed': 'Your progress couldn\'t be saved. Please check your storage permissions.',
            'data_load_failed': 'Couldn\'t load your progress. Starting fresh.',
            'context_save_failed': 'Couldn\'t save your browser context. Please try again.',
            'context_restore_failed': 'Couldn\'t restore your browser context. Please try again.',
            'share_failed': 'Couldn\'t share your achievement. Please try again.'
        };
        
        const userMessage = userMessages[errorType] || 'Something went wrong. Please try again.';
        this.sendNotification(userMessage, 'error');
    }

    // Analytics and tracking
    trackEvent(eventName, properties = {}) {
        // Enhanced event tracking for analytics
        const eventData = {
            event: eventName,
            properties: {
                ...properties,
                timestamp: Date.now(),
                userId: this.gameData.userId || 'anonymous',
                level: this.gameData.level,
                streak: this.gameData.streak,
                subscription: this.gameData.subscription.tier,
                version: chrome.runtime.getManifest().version
            }
        };
        
        // Store locally for batch sending
        this.queueAnalyticsEvent(eventData);
        
        // Send to analytics service (if premium)
        if (this.gameData.subscription.tier !== 'free') {
            this.sendToAnalytics(eventData);
        }
    }

    queueAnalyticsEvent(eventData) {
        // Queue events for batch processing
        if (!this.analyticsQueue) {
            this.analyticsQueue = [];
        }
        
        this.analyticsQueue.push(eventData);
        
        // Send batch when queue reaches 10 events
        if (this.analyticsQueue.length >= 10) {
            this.flushAnalyticsQueue();
        }
    }

    async flushAnalyticsQueue() {
        if (!this.analyticsQueue || this.analyticsQueue.length === 0) return;
        
        try {
            // In a real implementation, this would send to your analytics service
            console.log('Analytics batch:', this.analyticsQueue);
            
            // Clear queue
            this.analyticsQueue = [];
            
        } catch (error) {
            console.error('Analytics flush failed:', error);
        }
    }

    // Real-time features initialization
    initializeRealTimeFeatures() {
        // Initialize WebSocket connection for real-time features
        // This would connect to your backend WebSocket server
        
        // Mock real-time leaderboard updates
        setInterval(() => {
            this.updateRealTimeLeaderboard();
        }, 30000); // Update every 30 seconds
        
        // Mock buddy presence updates
        setInterval(() => {
            this.updateBuddyPresence();
        }, 10000); // Update every 10 seconds
    }

    updateRealTimeLeaderboard() {
        // Mock leaderboard data - in production, this would come from your backend
        this.realTimeFeatures.liveLeaderboard = [
            { id: 'user1', name: 'FocusMaster2024', level: 47, xp: 15420, streak: 89 },
            { id: 'user2', name: 'HyperfocusHero', level: 43, xp: 14890, streak: 76 },
            { id: 'user3', name: 'ProductivityPro', level: 39, xp: 13245, streak: 68 },
            // ... more users
        ];
        
        // Broadcast update
        this.broadcastMessage({
            type: 'leaderboardUpdate',
            data: this.realTimeFeatures.liveLeaderboard
        });
    }

    updateBuddyPresence() {
        // Mock buddy presence - in production, this would come from WebSocket
        this.gameData.buddies.forEach(buddy => {
            const presence = {
                id: buddy.id,
                status: Math.random() > 0.5 ? 'online' : 'focusing',
                lastSeen: Date.now() - Math.random() * 3600000 // Random last seen within 1 hour
            };
            
            this.realTimeFeatures.buddyPresence.set(buddy.id, presence);
        });
        
        // Broadcast update
        this.broadcastMessage({
            type: 'buddyPresenceUpdate',
            data: Array.from(this.realTimeFeatures.buddyPresence.values())
        });
    }

    // Performance monitoring
    startPeriodicUpdates() {
        // Update performance metrics
        setInterval(() => {
            this.updatePerformanceMetrics();
        }, 60000); // Every minute
        
        // Sync data periodically
        setInterval(() => {
            this.saveGameData();
        }, 300000); // Every 5 minutes
        
        // Flush analytics queue
        setInterval(() => {
            this.flushAnalyticsQueue();
        }, 120000); // Every 2 minutes
    }

    updatePerformanceMetrics() {
        this.performanceMetrics.lastSync = Date.now();
        
        // Monitor memory usage
        if (performance.memory) {
            this.performanceMetrics.memoryUsage = {
                used: performance.memory.usedJSHeapSize,
                total: performance.memory.totalJSHeapSize,
                limit: performance.memory.jsHeapSizeLimit
            };
        }
        
        // Save metrics
        chrome.storage.local.set({ performanceMetrics: this.performanceMetrics });
    }

    // Message handling with comprehensive routing
    async handleMessage(request, sender, sendResponse) {
        const startTime = performance.now();
        
        try {
            let response = { success: false };
            
            switch (request.type) {
                case 'startFocusSession':
                    response = await this.startFocusSession(request.duration, request.customGoal);
                    break;
                    
                case 'endFocusSession':
                    response = await this.endFocusSession(request.completed, request.reason);
                    break;
                    
                case 'getGameData':
                    response = { success: true, data: this.gameData };
                    break;
                    
                case 'parkThought':
                    response = await this.parkThought(request.thought, sender.tab, request.category);
                    break;
                    
                case 'saveContext':
                    response = await this.saveCurrentContext(request.name);
                    break;
                    
                case 'restoreContext':
                    response = await this.restoreContext(request.contextId);
                    break;
                    
                case 'shareAchievement':
                    response = await this.shareAchievement(request.achievementId, request.platform);
                    break;
                    
                case 'purchaseReward':
                    response = await this.handleRewardPurchase(request.item, request.price);
                    break;
                    
                case 'findBuddy':
                    response = await this.findBuddy(request.preferences);
                    break;
                    
                case 'updateSettings':
                    response = await this.updateSettings(request.settings);
                    break;
                    
                case 'getAnalytics':
                    response = await this.getAnalytics(request.timeRange);
                    break;
                    
                default:
                    response = { success: false, error: 'Unknown message type' };
            }
            
            // Track API performance
            const responseTime = performance.now() - startTime;
            this.performanceMetrics.apiCalls++;
            this.performanceMetrics.averageResponseTime = 
                (this.performanceMetrics.averageResponseTime + responseTime) / 2;
            
            sendResponse(response);
            
        } catch (error) {
            console.error('Message handling error:', error);
            this.handleError('message_handling_failed', error);
            sendResponse({ success: false, error: error.message });
        }
    }

    // Utility methods
    sendNotification(message, type = 'info', priority = 'normal') {
        if (!this.gameData.preferences.notifications) return;
        
        const icons = {
            success: '🎉',
            warning: '⚠️',
            error: '❌',
            info: 'ℹ️'
        };
        
        const notificationOptions = {
            type: 'basic',
            iconUrl: 'icon.svg',
            title: 'FlowState',
            message: `${icons[type]} ${message}`,
            priority: priority === 'high' ? 2 : 0
        };
        
        chrome.notifications.create(notificationOptions);
    }

    broadcastMessage(message) {
        // Send to all extension contexts
        chrome.runtime.sendMessage(message).catch(() => {
            // Ignore errors if no listeners
        });
        
        // Send to all tabs with content scripts
        chrome.tabs.query({}, (tabs) => {
            tabs.forEach(tab => {
                chrome.tabs.sendMessage(tab.id, message).catch(() => {
                    // Ignore errors if content script not loaded
                });
            });
        });
    }

    hasAchievement(achievementId) {
        return this.gameData.achievements.some(a => a.id === achievementId);
    }

    async unlockAchievement(achievementId) {
        if (this.hasAchievement(achievementId)) return;

        const achievementTemplate = this.achievements.find(a => a.id === achievementId);
        if (!achievementTemplate) return;

        const unlockedAchievement = {
            ...achievementTemplate,
            unlockedAt: Date.now(),
            isNew: true
        };

        this.gameData.achievements.push(unlockedAchievement);
        
        // Award rewards
        if (achievementTemplate.xp > 0) {
            await this.awardXP(achievementTemplate.xp, 'Achievement unlocked!');
        }
        if (achievementTemplate.coins > 0) {
            await this.awardDopamineCoins(achievementTemplate.coins, 'Achievement reward!');
        }
        
        // Show celebration based on rarity
        this.showAchievementCelebration(unlockedAchievement);
        
        this.sendNotification(`🏆 Achievement Unlocked: ${achievementTemplate.name}!`, 'success', 'high');
        
        this.broadcastMessage({ 
            type: 'achievementUnlocked', 
            data: unlockedAchievement 
        });
        
        // Track for analytics
        this.trackEvent('achievement_unlocked', {
            achievementId: achievementId,
            category: achievementTemplate.category,
            rarity: achievementTemplate.rarity,
            xpAwarded: achievementTemplate.xp,
            coinsAwarded: achievementTemplate.coins
        });
        
        await this.saveGameData();
    }

    showAchievementCelebration(achievement) {
        // Different celebration levels based on rarity
        const celebrations = {
            common: 'medium',
            uncommon: 'high',
            rare: 'epic',
            epic: 'legendary',
            legendary: 'legendary'
        };
        
        const celebrationLevel = celebrations[achievement.rarity] || 'medium';
        
        this.broadcastMessage({
            type: 'achievementCelebration',
            data: {
                achievement: achievement,
                celebrationLevel: celebrationLevel
            }
        });
    }

    async awardXP(amount, reason = '') {
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
        
        if (reason) {
            this.broadcastMessage({ 
                type: 'xpAwarded', 
                data: { amount, reason, newXP: this.gameData.xp, level: this.gameData.level }
            });
        }
    }

    async awardDopamineCoins(amount, reason = '') {
        // Check daily limit for free users
        if (this.gameData.subscription.tier === 'free') {
            const dailyEarned = this.getDailyCoinsEarned();
            if (dailyEarned + amount > this.gameData.subscription.dailyCoinLimit) {
                amount = Math.max(0, this.gameData.subscription.dailyCoinLimit - dailyEarned);
                if (amount === 0) {
                    this.sendNotification('Daily coin limit reached! Upgrade to Premium for unlimited coins.', 'warning');
                    return;
                }
            }
        }
        
        this.gameData.dopamineCoins += amount;
        this.gameData.stats.coinsEarned += amount;
        this.gameData.totalCoinsEarned += amount;
        
        // Award earned time for distraction sites
        this.gameData.adhdFeatures.distractionBlocking.earnedTime += Math.floor(amount / 2);
        
        await this.saveGameData();
        
        if (reason) {
            this.broadcastMessage({ 
                type: 'coinsAwarded', 
                data: { amount, reason, newTotal: this.gameData.dopamineCoins }
            });
        }
    }

    getDailyCoinsEarned() {
        // Calculate coins earned today
        const today = new Date().toDateString();
        // This would need to be tracked in daily stats
        return 0; // Simplified for now
    }

    async levelUp() {
        const coinsReward = this.gameData.level * 5;
        this.gameData.dopamineCoins += coinsReward;
        
        this.sendNotification(`🎉 LEVEL UP! You're now level ${this.gameData.level}! +${coinsReward} coins!`, 'success', 'high');
        
        // Check level achievements
        this.checkLevelAchievements();
        
        // Check for prestige eligibility
        if (this.gameData.level >= 100) {
            this.offerPrestige();
        }
        
        this.broadcastMessage({ 
            type: 'levelUp', 
            data: { newLevel: this.gameData.level, coinsReward }
        });
        
        // Track for analytics
        this.trackEvent('level_up', {
            newLevel: this.gameData.level,
            totalXP: this.gameData.totalXP,
            coinsRewarded: coinsReward
        });
    }

    offerPrestige() {
        this.broadcastMessage({
            type: 'prestigeOffered',
            data: {
                currentLevel: this.gameData.level,
                benefits: [
                    'Prestige badge and title',
                    '1000 bonus dopamine coins',
                    'Exclusive prestige achievements',
                    'Higher XP multipliers',
                    'Special prestige themes'
                ]
            }
        });
    }

    // Additional utility methods would go here...
    // (Continuing with other methods like handleAlarm, generateDailyChallenge, etc.)
}

// Initialize the game engine
new FlowStateGameEngine();