// background.js - Gamified FlowState with social features and AI

class FlowStateGameEngine {
    constructor() {
        this.gameData = {
            level: 1,
            xp: 0,
            xpToNextLevel: 100,
            totalXP: 0,
            dopamineCoins: 50, // Start with some coins
            streak: 0,
            longestStreak: 0,
            focusMultiplier: 1,
            achievements: [],
            dailyChallenge: null,
            buddy: null,
            focusSession: {
                active: false,
                startTime: null,
                duration: 0,
                xpRate: 2,
                sessionCount: 0
            },
            stats: {
                totalFocusTime: 0,
                sessionsCompleted: 0,
                averageSessionLength: 0,
                bestDay: 0,
                coinsEarned: 0,
                coinsSpent: 0
            },
            social: {
                shares: 0,
                referrals: 0,
                buddyInteractions: 0
            },
            preferences: {
                notifications: true,
                sounds: true,
                theme: 'default',
                difficulty: 'medium'
            }
        };

        this.activeTabInfo = {
            tabId: null,
            url: null,
            title: null,
            startTime: null,
            domain: null,
            isProductive: false
        };

        this.dopamineQueue = {
            blockedSites: ['reddit.com', 'youtube.com', 'facebook.com', 'twitter.com', 'instagram.com', 'tiktok.com'],
            earnedMinutes: 0,
            activeRewards: []
        };

        this.achievements = [
            { id: 'first_focus', name: 'First Steps', description: 'Complete your first focus session', xp: 25, coins: 5, icon: '🎯' },
            { id: 'streak_3', name: 'Getting Started', description: '3-day focus streak', xp: 50, coins: 10, icon: '🔥' },
            { id: 'streak_7', name: 'Week Warrior', description: '7-day focus streak', xp: 100, coins: 25, icon: '⚡' },
            { id: 'streak_30', name: 'Month Master', description: '30-day focus streak', xp: 500, coins: 100, icon: '👑' },
            { id: 'level_5', name: 'Rising Star', description: 'Reach level 5', xp: 0, coins: 25, icon: '⭐' },
            { id: 'level_10', name: 'Focus Veteran', description: 'Reach level 10', xp: 0, coins: 50, icon: '🏆' },
            { id: 'level_25', name: 'ADHD Champion', description: 'Reach level 25', xp: 0, coins: 100, icon: '🎖️' },
            { id: 'focus_60', name: 'Deep Diver', description: 'Focus for 60 minutes straight', xp: 100, coins: 20, icon: '🧠' },
            { id: 'focus_120', name: 'Hyperfocus Hero', description: 'Focus for 2 hours straight', xp: 200, coins: 50, icon: '🚀' },
            { id: 'social_share', name: 'Show Off', description: 'Share your first achievement', xp: 30, coins: 10, icon: '📱' },
            { id: 'buddy_matched', name: 'Dynamic Duo', description: 'Get matched with an ADHD buddy', xp: 40, coins: 15, icon: '🤝' },
            { id: 'marketplace_purchase', name: 'Reward Yourself', description: 'Make your first marketplace purchase', xp: 20, coins: 0, icon: '🛒' }
        ];

        this.dailyChallenges = [
            { type: 'focus_time', description: 'Focus for 25 minutes total today', target: 25, unit: 'minutes', xp: 50, coins: 15 },
            { type: 'focus_sessions', description: 'Complete 3 focus sessions today', target: 3, unit: 'sessions', xp: 75, coins: 20 },
            { type: 'streak_maintain', description: 'Maintain your focus streak', target: 1, unit: 'day', xp: 40, coins: 10 },
            { type: 'no_distractions', description: 'Avoid distraction sites for 2 hours', target: 120, unit: 'minutes', xp: 60, coins: 18 },
            { type: 'buddy_interaction', description: 'Check in with your ADHD buddy', target: 1, unit: 'interaction', xp: 30, coins: 8 }
        ];

        this.focusTimer = null;
        this.streakTimer = null;
        this.init();
    }

    async init() {
        await this.loadGameData();
        this.setupEventListeners();
        this.startDailyTracking();
        this.checkDailyChallenge();
        this.setupContextMenus();
        this.startPeriodicUpdates();
        console.log('FlowState Game Engine initialized');
    }

    async loadGameData() {
        try {
            const saved = await chrome.storage.local.get(['flowStateGame']);
            if (saved.flowStateGame) {
                this.gameData = { ...this.gameData, ...saved.flowStateGame };
            }
            
            // Load dopamine queue data
            const queueData = await chrome.storage.local.get(['dopamineQueue']);
            if (queueData.dopamineQueue) {
                this.dopamineQueue = { ...this.dopamineQueue, ...queueData.dopamineQueue };
            }
        } catch (error) {
            console.error('Error loading game data:', error);
        }
    }

    async saveGameData() {
        try {
            await chrome.storage.local.set({ 
                flowStateGame: this.gameData,
                dopamineQueue: this.dopamineQueue
            });
        } catch (error) {
            console.error('Error saving game data:', error);
        }
    }

    setupEventListeners() {
        // Tab events for focus tracking
        chrome.tabs.onActivated.addListener((activeInfo) => this.handleTabActivated(activeInfo));
        chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => this.handleTabUpdated(tabId, changeInfo, tab));
        
        // Web navigation for dopamine queue
        chrome.webNavigation.onBeforeNavigate.addListener((details) => {
            if (details.frameId === 0) {
                this.handleNavigation(details);
            }
        });

        // Runtime messages
        chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
            this.handleMessage(request, sender, sendResponse);
            return true;
        });

        // Alarms for various timers
        chrome.alarms.onAlarm.addListener((alarm) => this.handleAlarm(alarm));

        // Installation and update events
        chrome.runtime.onInstalled.addListener((details) => {
            if (details.reason === 'install') {
                this.handleFirstInstall();
            }
        });
    }

    setupContextMenus() {
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
            id: 'share-achievement',
            title: '📱 Share FlowState Win',
            contexts: ['page']
        });

        chrome.contextMenus.onClicked.addListener((info, tab) => {
            switch (info.menuItemId) {
                case 'start-focus-session':
                    this.startFocusSession();
                    break;
                case 'park-thought':
                    this.parkThought(info.selectionText, tab);
                    break;
                case 'share-achievement':
                    this.shareAchievement(tab);
                    break;
            }
        });
    }

    async handleFirstInstall() {
        // Award welcome bonus
        this.gameData.dopamineCoins = 50;
        this.gameData.xp = 25;
        
        // Create first daily challenge
        this.generateDailyChallenge();
        
        // Show onboarding
        chrome.tabs.create({ url: chrome.runtime.getURL('onboarding.html') });
        
        // Set up first achievement
        setTimeout(() => {
            this.checkAchievement('first_install');
        }, 2000);
        
        await this.saveGameData();
    }

    async handleTabActivated(activeInfo) {
        await this.saveCurrentTabActivity();
        const tab = await chrome.tabs.get(activeInfo.tabId);
        await this.setActiveTab(tab);
    }

    async handleTabUpdated(tabId, changeInfo, tab) {
        if (changeInfo.status === 'complete' && tab.active) {
            await this.setActiveTab(tab);
        }
    }

    async setActiveTab(tab) {
        if (!tab || !tab.url || tab.url.startsWith('chrome://')) return;

        const domain = this.extractDomain(tab.url);
        const isProductive = this.isProductiveSite(domain);

        this.activeTabInfo = {
            tabId: tab.id,
            url: tab.url,
            title: tab.title,
            domain: domain,
            startTime: Date.now(),
            isProductive: isProductive
        };

        // If focus session is active and user switches to non-productive site
        if (this.gameData.focusSession.active && !isProductive) {
            this.handleFocusDistraction(domain);
        }
    }

    async saveCurrentTabActivity() {
        if (!this.activeTabInfo.tabId || !this.activeTabInfo.startTime) return;

        const sessionTime = Math.floor((Date.now() - this.activeTabInfo.startTime) / 1000 / 60);
        if (sessionTime < 1) return;

        // Award XP for productive time
        if (this.activeTabInfo.isProductive && sessionTime >= 5) {
            const xpGained = Math.floor(sessionTime * 0.5);
            await this.awardXP(xpGained, 'Productive browsing bonus!');
        }

        // Update stats
        this.gameData.stats.totalFocusTime += sessionTime;
        await this.saveGameData();
    }

    async handleNavigation(details) {
        const domain = this.extractDomain(details.url);
        
        if (this.dopamineQueue.blockedSites.includes(domain)) {
            // Check if user has earned access
            if (this.dopamineQueue.earnedMinutes <= 0) {
                // Redirect to marketplace
                chrome.tabs.update(details.tabId, {
                    url: chrome.runtime.getURL('marketplace.html') + `?blocked=${encodeURIComponent(domain)}&original=${encodeURIComponent(details.url)}`
                });
            } else {
                // Allow access and start timer
                this.startDopamineReward(details.tabId, domain);
            }
        }
    }

    async startFocusSession(duration = 25) {
        if (this.gameData.focusSession.active) {
            this.sendNotification('Focus session already active!', 'info');
            return;
        }

        this.gameData.focusSession = {
            active: true,
            startTime: Date.now(),
            duration: 0,
            targetDuration: duration * 60, // Convert to seconds
            xpRate: 2,
            sessionCount: this.gameData.focusSession.sessionCount + 1
        };

        await this.saveGameData();

        // Start the focus timer
        this.focusTimer = setInterval(() => {
            this.gameData.focusSession.duration++;
            
            // Award XP every minute
            if (this.gameData.focusSession.duration % 60 === 0) {
                const minutes = this.gameData.focusSession.duration / 60;
                const xpGained = Math.floor(this.gameData.focusSession.xpRate * this.gameData.focusMultiplier);
                this.awardXP(xpGained, `Focus minute ${minutes} completed!`);
                
                // Increase multiplier every 5 minutes
                if (minutes % 5 === 0 && this.gameData.focusMultiplier < 10) {
                    this.gameData.focusMultiplier += 0.5;
                    this.sendNotification(`Focus multiplier increased to ${this.gameData.focusMultiplier}x!`, 'success');
                }

                // Update daily challenge
                this.updateDailyChallengeProgress('focus_time', 1);
            }
            
            this.saveGameData();
        }, 1000);

        // Set completion alarm
        chrome.alarms.create('focus_session_complete', { delayInMinutes: duration });
        
        this.sendNotification(`🎯 Focus session started! ${duration} minutes to go!`, 'success');
        
        // Notify popup
        this.broadcastMessage({ type: 'focusSessionStarted', data: this.gameData.focusSession });
    }

    async endFocusSession(completed = false) {
        if (!this.gameData.focusSession.active) return;

        const sessionMinutes = Math.floor(this.gameData.focusSession.duration / 60);
        
        if (this.focusTimer) {
            clearInterval(this.focusTimer);
            this.focusTimer = null;
        }

        chrome.alarms.clear('focus_session_complete');

        if (completed && sessionMinutes >= 5) {
            // Award completion bonus
            const completionBonus = Math.floor(sessionMinutes * 1.5);
            const coinsEarned = Math.floor(sessionMinutes / 2);
            
            await this.awardXP(completionBonus, 'Focus session completed!');
            await this.awardDopamineCoins(coinsEarned, 'Focus reward!');
            
            // Update stats
            this.gameData.stats.sessionsCompleted++;
            this.gameData.stats.averageSessionLength = Math.floor(
                (this.gameData.stats.averageSessionLength * (this.gameData.stats.sessionsCompleted - 1) + sessionMinutes) / 
                this.gameData.stats.sessionsCompleted
            );

            // Check achievements
            this.checkFocusAchievements(sessionMinutes);
            
            // Update daily challenge
            this.updateDailyChallengeProgress('focus_sessions', 1);
            
            this.sendNotification(`🎉 Session complete! +${completionBonus} XP, +${coinsEarned} coins!`, 'success');
        }

        // Reset session
        this.gameData.focusSession = {
            active: false,
            startTime: null,
            duration: 0,
            xpRate: 2,
            sessionCount: this.gameData.focusSession.sessionCount
        };

        this.gameData.focusMultiplier = 1;
        await this.saveGameData();
        
        this.broadcastMessage({ type: 'focusSessionEnded', completed });
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
        this.gameData.dopamineCoins += amount;
        this.gameData.stats.coinsEarned += amount;
        this.dopamineQueue.earnedMinutes += Math.floor(amount / 2); // 1 minute per 2 coins
        
        await this.saveGameData();
        
        if (reason) {
            this.broadcastMessage({ 
                type: 'coinsAwarded', 
                data: { amount, reason, newTotal: this.gameData.dopamineCoins }
            });
        }
    }

    async levelUp() {
        const coinsReward = this.gameData.level * 5;
        this.gameData.dopamineCoins += coinsReward;
        
        this.sendNotification(`🎉 LEVEL UP! You're now level ${this.gameData.level}! +${coinsReward} coins!`, 'success');
        
        // Check level achievements
        this.checkLevelAchievements();
        
        this.broadcastMessage({ 
            type: 'levelUp', 
            data: { newLevel: this.gameData.level, coinsReward }
        });
    }

    checkFocusAchievements(minutes) {
        if (minutes >= 25) this.checkAchievement('focus_25');
        if (minutes >= 60) this.checkAchievement('focus_60');
        if (minutes >= 120) this.checkAchievement('focus_120');
        
        // First focus session
        if (this.gameData.stats.sessionsCompleted === 1) {
            this.checkAchievement('first_focus');
        }
    }

    checkLevelAchievements() {
        if (this.gameData.level >= 5) this.checkAchievement('level_5');
        if (this.gameData.level >= 10) this.checkAchievement('level_10');
        if (this.gameData.level >= 25) this.checkAchievement('level_25');
    }

    checkStreakAchievements() {
        if (this.gameData.streak >= 3) this.checkAchievement('streak_3');
        if (this.gameData.streak >= 7) this.checkAchievement('streak_7');
        if (this.gameData.streak >= 30) this.checkAchievement('streak_30');
    }

    async checkAchievement(achievementId) {
        // Check if already unlocked
        if (this.gameData.achievements.some(a => a.id === achievementId)) return;

        const achievement = this.achievements.find(a => a.id === achievementId);
        if (!achievement) return;

        // Unlock achievement
        const unlockedAchievement = {
            ...achievement,
            unlockedAt: Date.now(),
            isNew: true
        };

        this.gameData.achievements.push(unlockedAchievement);
        
        // Award rewards
        if (achievement.xp > 0) await this.awardXP(achievement.xp, 'Achievement unlocked!');
        if (achievement.coins > 0) await this.awardDopamineCoins(achievement.coins, 'Achievement reward!');
        
        this.sendNotification(`🏆 Achievement Unlocked: ${achievement.name}!`, 'success');
        
        this.broadcastMessage({ 
            type: 'achievementUnlocked', 
            data: unlockedAchievement 
        });
        
        await this.saveGameData();
    }

    generateDailyChallenge() {
        const today = new Date().toDateString();
        
        if (this.gameData.dailyChallenge && this.gameData.dailyChallenge.date === today) {
            return; // Already have today's challenge
        }

        const randomChallenge = this.dailyChallenges[Math.floor(Math.random() * this.dailyChallenges.length)];
        
        this.gameData.dailyChallenge = {
            ...randomChallenge,
            date: today,
            progress: 0,
            completed: false
        };
        
        this.saveGameData();
    }

    updateDailyChallengeProgress(type, amount) {
        const challenge = this.gameData.dailyChallenge;
        if (!challenge || challenge.completed || challenge.type !== type) return;
        
        challenge.progress = Math.min(challenge.progress + amount, challenge.target);
        
        if (challenge.progress >= challenge.target) {
            challenge.completed = true;
            this.awardXP(challenge.xp, 'Daily challenge completed!');
            this.awardDopamineCoins(challenge.coins, 'Daily challenge bonus!');
            this.sendNotification('🏆 Daily challenge completed!', 'success');
        }
        
        this.saveGameData();
    }

    startDailyTracking() {
        // Check streak at midnight
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
    }

    async checkDailyStreak() {
        const today = new Date().toDateString();
        const lastActive = this.gameData.lastActiveDate;
        
        if (lastActive === today) {
            return; // Already checked today
        }
        
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        
        if (lastActive === yesterday.toDateString()) {
            // Maintain streak
            this.gameData.streak++;
            if (this.gameData.streak > this.gameData.longestStreak) {
                this.gameData.longestStreak = this.gameData.streak;
            }
            this.checkStreakAchievements();
        } else if (lastActive && lastActive !== today) {
            // Streak broken
            if (this.gameData.streak > 0) {
                this.sendNotification(`💔 Streak broken! You had ${this.gameData.streak} days. Start fresh today!`, 'warning');
            }
            this.gameData.streak = 0;
        }
        
        this.gameData.lastActiveDate = today;
        await this.saveGameData();
    }

    async handleMessage(request, sender, sendResponse) {
        switch (request.type) {
            case 'startFocusSession':
                await this.startFocusSession(request.duration);
                sendResponse({ success: true });
                break;
                
            case 'endFocusSession':
                await this.endFocusSession(request.completed);
                sendResponse({ success: true });
                break;
                
            case 'getGameData':
                sendResponse({ data: this.gameData });
                break;
                
            case 'purchaseReward':
                await this.handleRewardPurchase(request.item, request.price);
                sendResponse({ success: true });
                break;
                
            case 'shareAchievement':
                await this.shareAchievement(request.achievement);
                sendResponse({ success: true });
                break;
                
            case 'findBuddy':
                await this.findBuddy();
                sendResponse({ success: true });
                break;
                
            case 'parkThought':
                await this.parkThought(request.thought, sender.tab);
                sendResponse({ success: true });
                break;
                
            default:
                sendResponse({ success: false, error: 'Unknown message type' });
        }
    }

    async handleRewardPurchase(item, price) {
        if (this.gameData.dopamineCoins < price) {
            this.sendNotification('Not enough coins!', 'error');
            return;
        }
        
        this.gameData.dopamineCoins -= price;
        this.gameData.stats.coinsSpent += price;
        
        // Handle different reward types
        switch (item) {
            case 'social_5':
                this.dopamineQueue.earnedMinutes += 5;
                this.sendNotification('🎉 5 minutes of social media unlocked!', 'success');
                break;
            case 'youtube_15':
                this.dopamineQueue.earnedMinutes += 15;
                this.sendNotification('🎬 15 minutes of YouTube unlocked!', 'success');
                break;
            case 'xp_boost':
                this.gameData.focusMultiplier = Math.min(this.gameData.focusMultiplier + 1, 10);
                this.sendNotification('⚡ XP boost activated!', 'success');
                break;
        }
        
        // Check marketplace achievement
        if (this.gameData.stats.coinsSpent >= 10) {
            this.checkAchievement('marketplace_purchase');
        }
        
        await this.saveGameData();
    }

    async shareAchievement(achievement) {
        // Simulate social sharing
        this.gameData.social.shares++;
        await this.awardXP(10, 'Social sharing bonus!');
        this.checkAchievement('social_share');
        
        this.sendNotification('🎉 Achievement shared! +10 XP bonus!', 'success');
        await this.saveGameData();
    }

    async findBuddy() {
        // Simulate buddy matching
        const buddyNames = ['Alex M.', 'Sam K.', 'Jordan P.', 'Casey L.', 'Riley T.'];
        const randomName = buddyNames[Math.floor(Math.random() * buddyNames.length)];
        
        this.gameData.buddy = {
            id: 'buddy_' + Date.now(),
            name: randomName,
            level: Math.floor(Math.random() * 20) + 1,
            streak: Math.floor(Math.random() * 15) + 1,
            status: 'Currently focusing 🎯',
            matchedAt: Date.now()
        };
        
        await this.awardXP(25, 'Buddy matched!');
        this.checkAchievement('buddy_matched');
        
        this.sendNotification(`🤝 Matched with ${randomName}! Say hello!`, 'success');
        await this.saveGameData();
    }

    async parkThought(thought, tab) {
        const parkedThought = {
            id: Date.now(),
            text: thought,
            timestamp: Date.now(),
            url: tab?.url || '',
            title: tab?.title || ''
        };

        const { parkedThoughts = [] } = await chrome.storage.local.get(['parkedThoughts']);
        parkedThoughts.push(parkedThought);
        await chrome.storage.local.set({ parkedThoughts });

        await this.awardXP(5, 'Thought parked!');
        this.sendNotification('💭 Thought parked successfully!', 'success');
    }

    handleAlarm(alarm) {
        switch (alarm.name) {
            case 'focus_session_complete':
                this.endFocusSession(true);
                break;
            case 'dopamine_reward_end':
                this.endDopamineReward();
                break;
        }
    }

    startDopamineReward(tabId, domain) {
        const minutes = Math.min(this.dopamineQueue.earnedMinutes, 15);
        this.dopamineQueue.earnedMinutes -= minutes;
        
        chrome.alarms.create('dopamine_reward_end', { delayInMinutes: minutes });
        
        this.sendNotification(`🎉 Enjoy ${minutes} minutes on ${domain}!`, 'success');
        this.saveGameData();
    }

    endDopamineReward() {
        this.sendNotification('⏰ Reward time is up! Ready to get back to productive work?', 'info');
    }

    handleFocusDistraction(domain) {
        if (this.dopamineQueue.blockedSites.includes(domain)) {
            this.sendNotification('🎯 Stay focused! You can earn access to that site by completing your session.', 'warning');
        }
    }

    broadcastMessage(message) {
        // Send to all extension contexts
        chrome.runtime.sendMessage(message).catch(() => {
            // Ignore errors if no listeners
        });
    }

    sendNotification(message, type = 'info') {
        if (!this.gameData.preferences.notifications) return;
        
        const icons = {
            success: '🎉',
            warning: '⚠️',
            error: '❌',
            info: 'ℹ️'
        };
        
        chrome.notifications.create({
            type: 'basic',
            iconUrl: 'icon.svg',
            title: 'FlowState',
            message: `${icons[type]} ${message}`
        });
    }

    startPeriodicUpdates() {
        // Update active session every 30 seconds
        setInterval(() => {
            if (this.gameData.focusSession.active) {
                this.broadcastMessage({ 
                    type: 'sessionUpdate', 
                    data: this.gameData.focusSession 
                });
            }
        }, 30000);
    }

    extractDomain(url) {
        try {
            return new URL(url).hostname.replace('www.', '');
        } catch {
            return '';
        }
    }

    isProductiveSite(domain) {
        const productiveSites = [
            'docs.google.com', 'notion.so', 'trello.com', 'asana.com',
            'github.com', 'stackoverflow.com', 'developer.mozilla.org',
            'coursera.org', 'khanacademy.org', 'edx.org'
        ];
        return productiveSites.includes(domain);
    }

    checkDailyChallenge() {
        this.generateDailyChallenge();
    }
}

// Initialize the game engine
new FlowStateGameEngine();