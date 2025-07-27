// ADHD-Focused FlowState Popup JavaScript
// Simple, functional implementation that actually works

class ADHDFlowState {
    constructor() {
        this.state = {
            level: 1,
            xp: 0,
            coins: 50,
            streak: 0,
            currentSession: null,
            workStartTime: null,
            emotionHistory: [],
            stats: {
                focusMinutes: 0,
                emotionCheckins: 0,
                sensoryBreaks: 0,
                remindersSet: 0
            }
        };
        
        this.focusTimer = null;
        this.reminderTimer = null;
        this.currentTab = 'focus';
        
        this.init();
    }

    async init() {
        await this.loadState();
        this.updateUI();
        this.updateTime();
        this.setupPeriodicUpdates();
        this.checkTimeBasedNotifications();
    }

    // State Management
    async loadState() {
        try {
            if (typeof chrome !== 'undefined' && chrome.storage) {
                const result = await chrome.storage.local.get(['adhdFlowState']);
                if (result.adhdFlowState) {
                    this.state = { ...this.state, ...result.adhdFlowState };
                }
            } else {
                // Fallback to localStorage for testing
                const stored = localStorage.getItem('adhdFlowState');
                if (stored) {
                    this.state = { ...this.state, ...JSON.parse(stored) };
                }
            }
        } catch (error) {
            console.error('Error loading state:', error);
        }
    }

    async saveState() {
        try {
            if (typeof chrome !== 'undefined' && chrome.storage) {
                await chrome.storage.local.set({ adhdFlowState: this.state });
            } else {
                // Fallback to localStorage for testing
                localStorage.setItem('adhdFlowState', JSON.stringify(this.state));
            }
        } catch (error) {
            console.error('Error saving state:', error);
        }
    }

    // UI Updates
    updateUI() {
        // Update stats
        document.getElementById('level').textContent = this.state.level;
        document.getElementById('streak').textContent = this.state.streak;
        document.getElementById('coins').textContent = this.state.coins;

        // Update greeting and motivational message
        this.updateGreeting();
        this.updateMotivationalMessage();

        // Update time display
        this.updateTime();
    }

    updateGreeting() {
        const hour = new Date().getHours();
        let greeting = '🌅 Good morning!';
        
        if (hour >= 12 && hour < 17) greeting = '☀️ Good afternoon!';
        else if (hour >= 17 && hour < 21) greeting = '🌅 Good evening!';
        else if (hour >= 21 || hour < 6) greeting = '🌙 Good night!';
        
        document.getElementById('greeting').textContent = greeting;
    }

    updateMotivationalMessage() {
        const messages = [
            "Your ADHD brain is powerful! 💪",
            "Every small step counts! 🌟",
            "Progress, not perfection! 🎯",
            "Your unique brain is a gift! 🧠",
            "Celebrate the wins! 🎉",
            "ADHD superpowers activated! ⚡"
        ];
        
        const message = messages[Math.floor(Math.random() * messages.length)];
        document.getElementById('motivational').textContent = message;
    }

    updateTime() {
        const now = new Date();
        const timeString = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        
        document.getElementById('currentTime').textContent = timeString;
        
        const hour = now.getHours();
        let period = 'Morning';
        if (hour >= 12 && hour < 17) period = 'Afternoon';
        else if (hour >= 17 && hour < 21) period = 'Evening';
        else if (hour >= 21 || hour < 6) period = 'Night';
        
        document.getElementById('timePeriod').textContent = period;

        // Update work time if session is active
        if (this.state.workStartTime) {
            const workMinutes = Math.floor((now.getTime() - this.state.workStartTime) / (1000 * 60));
            const hours = Math.floor(workMinutes / 60);
            const mins = workMinutes % 60;
            
            document.getElementById('workTime').textContent = 
                hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
        } else {
            document.getElementById('workTime').textContent = '--';
        }
    }

    setupPeriodicUpdates() {
        // Update time every minute
        setInterval(() => this.updateTime(), 60000);
        
        // Save state every 30 seconds
        setInterval(() => this.saveState(), 30000);
        
        // Check for time-based notifications every 5 minutes
        setInterval(() => this.checkTimeBasedNotifications(), 5 * 60 * 1000);
    }

    checkTimeBasedNotifications() {
        const hour = new Date().getHours();
        
        // Post-lunch energy dip suggestion
        if (hour === 14 && !this.hasShownNotificationToday('energyDip')) {
            this.showNotification('Energy dip time! 😴 Consider a sensory break to re-energize.');
            this.markNotificationShown('energyDip');
        }
        
        // Evening check-in
        if (hour === 20 && !this.hasShownNotificationToday('eveningCheckin')) {
            this.showNotification('Evening check-in time! 💝 How are you feeling?');
            this.markNotificationShown('eveningCheckin');
        }
    }

    hasShownNotificationToday(type) {
        const today = new Date().toDateString();
        return this.state.notificationsShown && 
               this.state.notificationsShown[type] === today;
    }

    markNotificationShown(type) {
        if (!this.state.notificationsShown) {
            this.state.notificationsShown = {};
        }
        this.state.notificationsShown[type] = new Date().toDateString();
    }

    // Focus Timer Functions
    startFocus() {
        const duration = 25 * 60; // 25 minutes in seconds
        this.state.currentSession = {
            startTime: Date.now(),
            duration: duration,
            remaining: duration
        };
        
        if (!this.state.workStartTime) {
            this.state.workStartTime = Date.now();
        }

        this.focusTimer = setInterval(() => {
            this.state.currentSession.remaining--;
            this.updateTimerDisplay();
            
            if (this.state.currentSession.remaining <= 0) {
                this.completeFocusSession();
            }
        }, 1000);

        this.updateFocusControls('running');
        this.showNotification('Focus session started! 🎯 You got this!');
        this.saveState();
    }

    pauseFocus() {
        if (this.focusTimer) {
            clearInterval(this.focusTimer);
            this.focusTimer = null;
        }
        this.updateFocusControls('paused');
        this.showNotification('Focus session paused. Take your time! ⏸️');
    }

    stopFocus() {
        if (this.focusTimer) {
            clearInterval(this.focusTimer);
            this.focusTimer = null;
        }
        
        // Award partial credit if focused for at least 5 minutes
        if (this.state.currentSession) {
            const focusedMinutes = Math.floor((this.state.currentSession.duration - this.state.currentSession.remaining) / 60);
            if (focusedMinutes >= 5) {
                this.awardXP(focusedMinutes, 'Focus session (partial)');
                this.state.stats.focusMinutes += focusedMinutes;
            }
        }

        this.state.currentSession = null;
        this.updateFocusControls('ready');
        this.updateTimerDisplay();
        this.showNotification('Focus session ended. Every minute counts! 💙');
        this.saveState();
    }

    completeFocusSession() {
        clearInterval(this.focusTimer);
        this.focusTimer = null;
        
        const focusedMinutes = 25;
        this.awardXP(focusedMinutes * 2, 'Complete focus session!');
        this.awardCoins(5, 'Focus session reward!');
        this.state.stats.focusMinutes += focusedMinutes;
        
        this.state.currentSession = null;
        this.updateFocusControls('ready');
        this.updateTimerDisplay();
        this.showNotification('🎉 Focus session completed! You earned XP and coins!');
        this.saveState();
    }

    updateTimerDisplay() {
        const display = document.getElementById('timerDisplay');
        const status = document.getElementById('timerStatus');
        
        if (this.state.currentSession) {
            const minutes = Math.floor(this.state.currentSession.remaining / 60);
            const seconds = this.state.currentSession.remaining % 60;
            display.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
            status.textContent = this.focusTimer ? 'Focusing...' : 'Paused';
        } else {
            display.textContent = '25:00';
            status.textContent = 'Ready to focus';
        }
    }

    updateFocusControls(state) {
        const startBtn = document.getElementById('startBtn');
        const pauseBtn = document.getElementById('pauseBtn');
        const stopBtn = document.getElementById('stopBtn');

        switch (state) {
            case 'ready':
                startBtn.style.display = 'inline-block';
                pauseBtn.style.display = 'none';
                stopBtn.style.display = 'none';
                startBtn.textContent = 'Start';
                break;
            case 'running':
                startBtn.style.display = 'none';
                pauseBtn.style.display = 'inline-block';
                stopBtn.style.display = 'inline-block';
                break;
            case 'paused':
                startBtn.style.display = 'inline-block';
                pauseBtn.style.display = 'none';
                stopBtn.style.display = 'inline-block';
                startBtn.textContent = 'Resume';
                break;
        }
    }

    // Emotion and Wellness Functions
    selectEmotion(emotion) {
        const emotionData = {
            emotion: emotion,
            timestamp: Date.now(),
            date: new Date().toDateString()
        };
        
        this.state.emotionHistory.unshift(emotionData);
        // Keep only last 30 entries
        this.state.emotionHistory = this.state.emotionHistory.slice(0, 30);
        this.state.stats.emotionCheckins++;
        
        this.awardXP(3, 'Emotional check-in!');
        this.showEmotionStrategy(emotion);
        this.saveState();
    }

    showEmotionStrategy(emotion) {
        const strategies = {
            overwhelmed: 'Take 3 deep breaths. List 3 things you can control right now. 🫁',
            frustrated: 'Step away for 2 minutes. Move your body or write down what\'s bothering you. ✍️',
            anxious: 'Try 4-7-8 breathing: in for 4, hold for 7, out for 8. Repeat 4 times. 🌊',
            restless: 'Do 10 jumping jacks or fidget with something. Movement helps! 🏃‍♀️',
            hyperfocused: 'Set a timer for breaks. Drink water. Check in with your body. ⏰',
            calm: 'Great state! Use this energy for important tasks. 😌',
            excited: 'Channel this energy! What important thing can you tackle right now? 🤩',
            unmotivated: 'Start tiny. Just 2 minutes on anything. Momentum builds momentum. 🐌'
        };
        
        const strategy = strategies[emotion] || 'Thank you for checking in! Self-awareness is powerful. 💙';
        this.showNotification(`Feeling ${emotion}? ${strategy}`);
    }

    startBreak(breakType) {
        const breaks = {
            breathing: {
                name: '4-7-8 Breathing',
                duration: 2,
                instructions: 'Breathe in for 4 counts, hold for 7, exhale for 8. Repeat 4 times.'
            },
            movement: {
                name: 'Quick Movement',
                duration: 3,
                instructions: 'Do jumping jacks, stretch, or walk around for 3 minutes.'
            },
            grounding: {
                name: '5-4-3-2-1 Grounding',
                duration: 2,
                instructions: 'Name 5 things you see, 4 you hear, 3 you touch, 2 you smell, 1 you taste.'
            }
        };
        
        const breakInfo = breaks[breakType];
        this.awardXP(5, `${breakInfo.name} break!`);
        this.state.stats.sensoryBreaks++;
        
        this.showNotification(`🌿 Starting ${breakInfo.name}: ${breakInfo.instructions}`);
        
        // Set completion timer
        setTimeout(() => {
            this.showNotification(`✅ ${breakInfo.name} completed! Your nervous system thanks you!`);
            this.awardCoins(2, 'Self-care reward!');
            this.saveState();
        }, breakInfo.duration * 60 * 1000);
        
        this.saveState();
    }

    // Time and Reminder Functions
    setReminder(minutes) {
        if (this.reminderTimer) {
            clearTimeout(this.reminderTimer);
        }
        
        this.reminderTimer = setTimeout(() => {
            this.showNotification(`⏰ Reminder: ${minutes} minutes have passed!`);
            this.playNotificationSound();
        }, minutes * 60 * 1000);
        
        const nextBreakTime = new Date(Date.now() + minutes * 60 * 1000);
        document.getElementById('nextBreak').textContent = 
            nextBreakTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        
        this.state.stats.remindersSet++;
        this.showNotification(`⏰ Reminder set for ${minutes} minutes!`);
        this.saveState();
    }

    // Gamification Functions
    awardXP(amount, reason) {
        this.state.xp += amount;
        
        // Check for level up
        const xpNeeded = this.state.level * 100;
        if (this.state.xp >= xpNeeded) {
            this.state.level++;
            this.state.xp -= xpNeeded;
            this.awardCoins(this.state.level * 5, `Level ${this.state.level} reward!`);
            this.showNotification(`🎉 Level up! You're now level ${this.state.level}!`);
        }
        
        this.updateUI();
        if (reason) {
            this.showNotification(`+${amount} XP: ${reason}`);
        }
    }

    awardCoins(amount, reason) {
        this.state.coins += amount;
        this.updateUI();
        if (reason) {
            this.showNotification(`+${amount} 🪙: ${reason}`);
        }
    }

    // Notification System
    showNotification(message) {
        const container = document.getElementById('notifications');
        const notification = document.createElement('div');
        notification.className = 'notification';
        notification.textContent = message;
        
        container.appendChild(notification);
        
        // Auto-remove after 5 seconds
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 5000);
        
        // Keep only latest 3 notifications
        while (container.children.length > 3) {
            container.removeChild(container.firstChild);
        }
    }

    playNotificationSound() {
        // Simple notification sound for accessibility
        try {
            const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC8d2PQQsUXrPo66hVFApGnt3wvmAcBR1+1/LNciUGHnHC