// background.js - Core service worker for FlowState

class FlowStateBackground {
    constructor() {
        this.activeTabInfo = {
            tabId: null,
            url: null,
            title: null,
            startTime: null,
            lastActivity: null,
            domain: null
        };

        this.features = {
            hyperfocusBreaker: true,
            momentumKeeper: true,
            dopamineQueue: true,
            thoughtParking: true,
            contextRestoration: true
        };

        this.settings = {
            hyperfocusThreshold: 45, // minutes
            breakReminder: 5, // minutes
        };

        this.dopamineQueueData = {
            blockedSites: ['reddit.com', 'youtube.com', 'twitter.com', 'instagram.com', 'facebook.com', 'tiktok.com'],
            earnedMinutes: 0
        };

        this.tabSwitchHistory = [];
        this.hyperfocusTimer = null;

        this.init();
    }

    async init() {
        await this.loadSettings();
        this.setupEventListeners();
        this.startActivityMonitoring();
    }

    async loadSettings() {
        const saved = await chrome.storage.sync.get({
            hyperfocusBreaker: true,
            momentumKeeper: true,
            dopamineQueue: true,
            thoughtParking: true,
            contextRestoration: true,
            hyperfocusThreshold: 45,
            breakReminder: 5
        });

        this.features = {
            hyperfocusBreaker: saved.hyperfocusBreaker,
            momentumKeeper: saved.momentumKeeper,
            dopamineQueue: saved.dopamineQueue,
            thoughtParking: saved.thoughtParking,
            contextRestoration: saved.contextRestoration
        };

        this.settings = {
            hyperfocusThreshold: saved.hyperfocusThreshold,
            breakReminder: saved.breakReminder
        };

        // Load dopamine queue data
        const dopamineData = await chrome.storage.local.get(['dopamineMinutes', 'blockedSites']);
        this.dopamineQueueData.earnedMinutes = dopamineData.dopamineMinutes || 0;
        if (dopamineData.blockedSites) {
            this.dopamineQueueData.blockedSites = dopamineData.blockedSites;
        }
    }

    setupEventListeners() {
        // Tab events
        chrome.tabs.onActivated.addListener((activeInfo) => this.handleTabActivated(activeInfo));
        chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => this.handleTabUpdated(tabId, changeInfo, tab));
        chrome.tabs.onRemoved.addListener((tabId) => this.handleTabRemoved(tabId));

        // Runtime messages
        chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
            this.handleMessage(request, sender, sendResponse);
            return true; // Keep message channel open for async response
        });

        // Web navigation for dopamine queue
        chrome.webNavigation.onBeforeNavigate.addListener((details) => {
            if (details.frameId === 0) { // Main frame only
                this.handleNavigation(details);
            }
        });

        // Alarms for hyperfocus reminders
        chrome.alarms.onAlarm.addListener((alarm) => this.handleAlarm(alarm));
    }

    async handleTabActivated(activeInfo) {
        await this.saveCurrentTabActivity();
        
        const tab = await chrome.tabs.get(activeInfo.tabId);
        await this.setActiveTab(tab);
        
        if (this.features.momentumKeeper) {
            await this.showMomentumKeeper(tab);
        }
    }

    async handleTabUpdated(tabId, changeInfo, tab) {
        if (changeInfo.status === 'complete' && tab.active) {
            await this.setActiveTab(tab);
        }
    }

    async handleTabRemoved(tabId) {
        if (this.activeTabInfo.tabId === tabId) {
            await this.saveCurrentTabActivity();
            this.clearActiveTab();
        }
    }

    async setActiveTab(tab) {
        if (!tab || !tab.url || tab.url.startsWith('chrome://')) return;

        const now = Date.now();
        const domain = this.extractDomain(tab.url);

        this.activeTabInfo = {
            tabId: tab.id,
            url: tab.url,
            title: tab.title,
            domain: domain,
            startTime: now,
            lastActivity: now
        };

        if (this.features.hyperfocusBreaker) {
            this.startHyperfocusMonitoring();
        }

        // Track tab switch for momentum keeper
        this.tabSwitchHistory.push({
            tabId: tab.id,
            url: tab.url,
            title: tab.title,
            timestamp: now
        });

        // Keep only last 10 switches
        if (this.tabSwitchHistory.length > 10) {
            this.tabSwitchHistory.shift();
        }
    }

    async saveCurrentTabActivity() {
        if (!this.activeTabInfo.tabId || !this.activeTabInfo.startTime) return;

        const sessionTime = Math.floor((Date.now() - this.activeTabInfo.startTime) / 1000 / 60); // minutes
        if (sessionTime < 1) return; // Ignore very short sessions

        // Update total focus time
        const { focusTime = 0 } = await chrome.storage.local.get(['focusTime']);
        await chrome.storage.local.set({ focusTime: focusTime + sessionTime });

        // Award dopamine minutes for productive time
        if (sessionTime >= 10 && !this.isDistractionSite(this.activeTabInfo.domain)) {
            const earnedPoints = Math.floor(sessionTime / 10); // 1 point per 10 minutes
            await this.awardDopamineMinutes(earnedPoints);
        }
    }

    clearActiveTab() {
        this.activeTabInfo = {
            tabId: null,
            url: null,
            title: null,
            startTime: null,
            lastActivity: null,
            domain: null
        };
        
        if (this.hyperfocusTimer) {
            clearTimeout(this.hyperfocusTimer);
            this.hyperfocusTimer = null;
        }
    }

    startHyperfocusMonitoring() {
        if (this.hyperfocusTimer) {
            clearTimeout(this.hyperfocusTimer);
        }

        const threshold = this.settings.hyperfocusThreshold * 60 * 1000; // Convert to milliseconds
        
        this.hyperfocusTimer = setTimeout(() => {
            this.triggerHyperfocusBreaker();
        }, threshold);
    }

    async triggerHyperfocusBreaker() {
        if (!this.features.hyperfocusBreaker) return;

        const sessionTime = Math.floor((Date.now() - this.activeTabInfo.startTime) / 1000 / 60);
        
        // Send notification
        chrome.notifications.create({
            type: 'basic',
            iconUrl: 'icon.svg',
            title: '🧠 Hyperfocus Circuit Breaker',
            message: `You've been focused for ${sessionTime} minutes! Time for a quick body check: stretch, hydrate, breathe.`
        });

        // Send message to content script for overlay
        try {
            await chrome.tabs.sendMessage(this.activeTabInfo.tabId, {
                type: 'showHyperfocusBreaker',
                sessionTime: sessionTime
            });
        } catch (error) {
            console.log('Could not send message to content script:', error);
        }

        // Schedule next reminder
        this.scheduleBreakReminder();
    }

    scheduleBreakReminder() {
        const reminderTime = this.settings.breakReminder * 60 * 1000;
        
        setTimeout(() => {
            if (this.activeTabInfo.tabId) {
                chrome.notifications.create({
                    type: 'basic',
                    iconUrl: 'icon.svg',
                    title: '⏰ Gentle Reminder',
                    message: 'Still in deep focus? Remember to take care of your body too! 💙'
                });
            }
        }, reminderTime);
    }

    async showMomentumKeeper(tab) {
        // Find previous activity on this domain or similar content
        const recentHistory = this.tabSwitchHistory.slice(-5);
        const relevantHistory = recentHistory.find(entry => 
            entry.url !== tab.url && 
            (this.extractDomain(entry.url) === this.extractDomain(tab.url) || 
             this.calculateContentSimilarity(entry.title, tab.title) > 0.3)
        );

        if (relevantHistory) {
            try {
                await chrome.tabs.sendMessage(tab.id, {
                    type: 'showMomentumKeeper',
                    previousActivity: relevantHistory,
                    currentTab: {
                        url: tab.url,
                        title: tab.title
                    }
                });
            } catch (error) {
                console.log('Could not send momentum keeper message:', error);
            }
        }
    }

    async handleNavigation(details) {
        if (!this.features.dopamineQueue) return;
        
        const url = details.url;
        const domain = this.extractDomain(url);
        
        if (this.dopamineQueueData.blockedSites.includes(domain)) {
            // Check if user has earned minutes
            if (this.dopamineQueueData.earnedMinutes <= 0) {
                // Redirect to blocked page
                chrome.tabs.update(details.tabId, {
                    url: chrome.runtime.getURL('blocked.html') + `?site=${encodeURIComponent(domain)}&original=${encodeURIComponent(url)}`
                });
            } else {
                // Allow access and start timer
                this.startDopamineReward(details.tabId, domain);
            }
        }
    }

    async startDopamineReward(tabId, domain) {
        const minutes = Math.min(this.dopamineQueueData.earnedMinutes, 10); // Max 10 minutes at a time
        this.dopamineQueueData.earnedMinutes -= minutes;
        
        await chrome.storage.local.set({ dopamineMinutes: this.dopamineQueueData.earnedMinutes });
        
        // Set alarm to remind user when time is up
        chrome.alarms.create(`dopamine_${tabId}`, { delayInMinutes: minutes });
        
        // Notify user
        chrome.notifications.create({
            type: 'basic',
            iconUrl: 'icon.svg',
            title: '🎉 Dopamine Time!',
            message: `Enjoy ${minutes} minutes on ${domain}. You earned it!`
        });
    }

    async awardDopamineMinutes(points) {
        this.dopamineQueueData.earnedMinutes += points;
        await chrome.storage.local.set({ dopamineMinutes: this.dopamineQueueData.earnedMinutes });
        
        if (points > 0) {
            chrome.notifications.create({
                type: 'basic',
                iconUrl: 'icon.svg',
                title: '⭐ Minutes Earned!',
                message: `Great focus! You earned ${points} dopamine minutes.`
            });
        }
    }

    async handleMessage(request, sender, sendResponse) {
        switch (request.type) {
            case 'toggleFeature':
                this.features[request.feature] = request.enabled;
                await chrome.storage.sync.set({ [request.feature]: request.enabled });
                sendResponse({ success: true });
                break;

            case 'parkThought':
                await this.parkThought(request.thought, sender.tab);
                sendResponse({ success: true });
                break;

            case 'getTabHistory':
                sendResponse({ history: this.tabSwitchHistory });
                break;

            case 'completeTask':
                await this.awardDopamineMinutes(request.points || 2);
                sendResponse({ success: true });
                break;

            default:
                sendResponse({ success: false, error: 'Unknown message type' });
        }
    }

    async parkThought(thoughtText, tab) {
        const thought = {
            id: Date.now(),
            text: thoughtText,
            timestamp: Date.now(),
            url: tab?.url || '',
            title: tab?.title || ''
        };

        const { parkedThoughts = [] } = await chrome.storage.local.get(['parkedThoughts']);
        parkedThoughts.push(thought);
        await chrome.storage.local.set({ parkedThoughts });

        // Update stats
        await chrome.storage.local.set({ thoughtsParked: parkedThoughts.length });
    }

    async handleAlarm(alarm) {
        if (alarm.name.startsWith('dopamine_')) {
            const tabId = parseInt(alarm.name.split('_')[1]);
            
            chrome.notifications.create({
                type: 'basic',
                iconUrl: 'icon.svg',
                title: '⏰ Dopamine Time Up!',
                message: 'Ready to get back to productive work? You got this! 💪'
            });

            // Optional: Show gentle overlay on the tab
            try {
                await chrome.tabs.sendMessage(tabId, {
                    type: 'showDopamineTimeUp'
                });
            } catch (error) {
                console.log('Could not send time up message:', error);
            }
        }
    }

    startActivityMonitoring() {
        // Update activity timestamp every minute for active tab
        setInterval(() => {
            if (this.activeTabInfo.tabId) {
                this.activeTabInfo.lastActivity = Date.now();
            }
        }, 60000);
    }

    extractDomain(url) {
        try {
            const urlObj = new URL(url);
            return urlObj.hostname.replace('www.', '');
        } catch {
            return '';
        }
    }

    isDistractionSite(domain) {
        return this.dopamineQueueData.blockedSites.includes(domain);
    }

    calculateContentSimilarity(title1, title2) {
        if (!title1 || !title2) return 0;
        
        const words1 = title1.toLowerCase().split(/\s+/);
        const words2 = title2.toLowerCase().split(/\s+/);
        
        const commonWords = words1.filter(word => words2.includes(word) && word.length > 2);
        return commonWords.length / Math.max(words1.length, words2.length);
    }
}

// Initialize background service
new FlowStateBackground();
