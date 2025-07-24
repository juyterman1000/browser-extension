// popup.js - Gamified FlowState popup with XP, achievements, and social features

class FlowStateGamePopup {
    constructor() {
        this.gameData = {
            level: 1,
            xp: 0,
            xpToNextLevel: 100,
            dopamineCoins: 0,
            streak: 0,
            focusMultiplier: 1,
            achievements: [],
            dailyChallenge: null,
            buddy: null,
            focusSession: {
                active: false,
                startTime: null,
                duration: 0,
                xpRate: 2
            }
        };
        
        this.focusTimer = null;
        this.xpAnimationQueue = [];
        
        this.init();
    }

    async init() {
        await this.loadGameData();
        this.setupEventListeners();
        this.updateUI();
        this.checkDailyChallenge();
        this.checkNewAchievements();
        this.startPeriodicUpdates();
    }

    async loadGameData() {
        try {
            const saved = await chrome.storage.local.get([
                'gameData', 'focusSession', 'dailyChallenge', 'achievements'
            ]);
            
            if (saved.gameData) {
                this.gameData = { ...this.gameData, ...saved.gameData };
            }
            
            if (saved.focusSession) {
                this.gameData.focusSession = { ...this.gameData.focusSession, ...saved.focusSession };
            }
            
            if (saved.dailyChallenge) {
                this.gameData.dailyChallenge = saved.dailyChallenge;
            }
            
            if (saved.achievements) {
                this.gameData.achievements = saved.achievements;
            }
        } catch (error) {
            console.error('Error loading game data:', error);
        }
    }

    async saveGameData() {
        try {
            await chrome.storage.local.set({
                gameData: this.gameData,
                focusSession: this.gameData.focusSession,
                dailyChallenge: this.gameData.dailyChallenge,
                achievements: this.gameData.achievements
            });
        } catch (error) {
            console.error('Error saving game data:', error);
        }
    }

    setupEventListeners() {
        // Focus session controls
        document.getElementById('startFocus')?.addEventListener('click', () => this.startFocusSession());
        document.getElementById('pauseFocus')?.addEventListener('click', () => this.pauseFocusSession());
        document.getElementById('endFocus')?.addEventListener('click', () => this.endFocusSession());

        // Quick actions
        document.getElementById('openMarketplace')?.addEventListener('click', () => this.openMarketplace());
        document.getElementById('openAchievements')?.addEventListener('click', () => this.openAchievements());
        document.getElementById('openLeaderboard')?.addEventListener('click', () => this.openLeaderboard());
        document.getElementById('openSocial')?.addEventListener('click', () => this.openSocial());

        // Buddy system
        document.getElementById('findBuddy')?.addEventListener('click', () => this.findBuddy());
        document.getElementById('matchBuddy')?.addEventListener('click', () => this.findBuddy());

        // Popup controls
        document.getElementById('claimRewards')?.addEventListener('click', () => this.claimLevelUpRewards());

        // Listen for background messages
        chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
            this.handleBackgroundMessage(message);
        });
    }

    updateUI() {
        // Update level and XP
        document.getElementById('userLevel').textContent = this.gameData.level;
        document.getElementById('currentXP').textContent = this.gameData.xp;
        document.getElementById('nextLevelXP').textContent = this.gameData.xpToNextLevel;
        
        const xpProgress = (this.gameData.xp / this.gameData.xpToNextLevel) * 100;
        document.getElementById('xpProgress').style.width = `${Math.min(xpProgress, 100)}%`;

        // Update stats
        document.getElementById('currentStreak').textContent = this.gameData.streak;
        document.getElementById('dopamineCoins').textContent = this.gameData.dopamineCoins;
        document.getElementById('focusMultiplier').textContent = `${this.gameData.focusMultiplier}x`;

        // Update focus session
        this.updateFocusSessionUI();
        
        // Update daily challenge
        this.updateDailyChallengeUI();
        
        // Update buddy section
        this.updateBuddyUI();
        
        // Update action badges
        this.updateActionBadges();
    }

    updateFocusSessionUI() {
        const session = this.gameData.focusSession;
        const sessionElement = document.getElementById('focusSession');
        
        if (session.active) {
            document.getElementById('startFocus').style.display = 'none';
            document.getElementById('pauseFocus').style.display = 'inline-block';
            document.getElementById('endFocus').style.display = 'inline-block';
            
            // Update XP rate based on multiplier
            const currentRate = Math.floor(session.xpRate * this.gameData.focusMultiplier);
            document.getElementById('currentXPRate').textContent = currentRate;
            
            sessionElement.classList.add('active');
        } else {
            document.getElementById('startFocus').style.display = 'inline-block';
            document.getElementById('pauseFocus').style.display = 'none';
            document.getElementById('endFocus').style.display = 'none';
            
            sessionElement.classList.remove('active');
        }
        
        // Update timer display
        const minutes = Math.floor(session.duration / 60);
        const seconds = session.duration % 60;
        document.getElementById('sessionTimer').textContent = 
            `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }

    updateDailyChallengeUI() {
        const challenge = this.gameData.dailyChallenge;
        if (!challenge) return;
        
        document.getElementById('challengeText').textContent = challenge.description;
        
        const progress = Math.min((challenge.progress / challenge.target) * 100, 100);
        document.getElementById('challengeProgress').style.width = `${progress}%`;
        document.getElementById('challengeStatus').textContent = `${challenge.progress}/${challenge.target} ${challenge.unit}`;
    }

    updateBuddyUI() {
        const buddyContent = document.getElementById('buddyContent');
        
        if (this.gameData.buddy) {
            buddyContent.innerHTML = `
                <div class="buddy-info">
                    <div class="buddy-avatar">👤</div>
                    <div class="buddy-details">
                        <div class="buddy-name">${this.gameData.buddy.name}</div>
                        <div class="buddy-status">${this.gameData.buddy.status}</div>
                    </div>
                    <button class="btn-link" id="chatBuddy">💬</button>
                </div>
                <div class="buddy-progress">
                    <div class="progress-item">
                        <span>Your streak: ${this.gameData.streak} days</span>
                        <span>Their streak: ${this.gameData.buddy.streak} days</span>
                    </div>
                </div>
            `;
            
            document.getElementById('chatBuddy')?.addEventListener('click', () => this.openBuddyChat());
        }
    }

    updateActionBadges() {
        // Marketplace badge (available items)
        document.getElementById('marketplaceBadge').textContent = Math.floor(this.gameData.dopamineCoins / 10);
        
        // Achievements badge (new achievements)
        const newAchievements = this.gameData.achievements.filter(a => a.isNew).length;
        const achievementsBadge = document.getElementById('achievementsBadge');
        if (newAchievements > 0) {
            achievementsBadge.textContent = newAchievements;
            achievementsBadge.style.display = 'flex';
        } else {
            achievementsBadge.style.display = 'none';
        }
        
        // Social badge (notifications)
        document.getElementById('socialBadge').textContent = '2'; // Mock data
    }

    async startFocusSession() {
        this.gameData.focusSession = {
            active: true,
            startTime: Date.now(),
            duration: 0,
            xpRate: 2
        };
        
        await this.saveGameData();
        this.updateUI();
        
        // Start the focus timer
        this.focusTimer = setInterval(() => {
            this.gameData.focusSession.duration++;
            this.updateFocusSessionUI();
            
            // Award XP every minute
            if (this.gameData.focusSession.duration % 60 === 0) {
                const xpGained = Math.floor(this.gameData.focusSession.xpRate * this.gameData.focusMultiplier);
                this.awardXP(xpGained, 'Focus minute completed!');
                
                // Increase multiplier every 5 minutes
                if (this.gameData.focusSession.duration % 300 === 0) {
                    this.gameData.focusMultiplier = Math.min(this.gameData.focusMultiplier + 0.5, 10);
                    this.showNotification(`Focus multiplier increased to ${this.gameData.focusMultiplier}x!`, 'success');
                }
                
                // Update daily challenge
                this.updateDailyChallengeProgress('focus_time', 1);
            }
            
            this.saveGameData();
        }, 1000);
        
        // Notify background script
        chrome.runtime.sendMessage({
            type: 'focusSessionStarted',
            sessionData: this.gameData.focusSession
        });
        
        this.showNotification('Focus session started! 🎯', 'success');
    }

    pauseFocusSession() {
        if (this.focusTimer) {
            clearInterval(this.focusTimer);
            this.focusTimer = null;
        }
        
        this.gameData.focusSession.active = false;
        this.saveGameData();
        this.updateUI();
        
        this.showNotification('Focus session paused ⏸️', 'info');
    }

    async endFocusSession() {
        if (this.focusTimer) {
            clearInterval(this.focusTimer);
            this.focusTimer = null;
        }
        
        const sessionDuration = this.gameData.focusSession.duration;
        const sessionMinutes = Math.floor(sessionDuration / 60);
        
        // Award completion bonus
        const completionBonus = Math.floor(sessionMinutes * 0.5);
        if (completionBonus > 0) {
            this.awardXP(completionBonus, 'Session completion bonus!');
        }
        
        // Award dopamine coins
        const coinsEarned = Math.floor(sessionMinutes / 5); // 1 coin per 5 minutes
        if (coinsEarned > 0) {
            this.awardDopamineCoins(coinsEarned, 'Focus session reward!');
        }
        
        // Check for achievements
        this.checkFocusAchievements(sessionMinutes);
        
        // Reset session
        this.gameData.focusSession = {
            active: false,
            startTime: null,
            duration: 0,
            xpRate: 2
        };
        
        this.gameData.focusMultiplier = 1; // Reset multiplier
        
        await this.saveGameData();
        this.updateUI();
        
        // Show completion celebration
        this.showSessionCompletionCelebration(sessionMinutes, completionBonus, coinsEarned);
        
        // Notify background script
        chrome.runtime.sendMessage({
            type: 'focusSessionCompleted',
            duration: sessionDuration,
            xpGained: completionBonus,
            coinsEarned: coinsEarned
        });
    }

    async awardXP(amount, reason = '') {
        this.gameData.xp += amount;
        
        // Check for level up
        while (this.gameData.xp >= this.gameData.xpToNextLevel) {
            this.gameData.xp -= this.gameData.xpToNextLevel;
            this.gameData.level++;
            this.gameData.xpToNextLevel = Math.floor(this.gameData.xpToNextLevel * 1.2); // Increase XP requirement
            
            await this.levelUp();
        }
        
        // Show XP gain animation
        this.showXPGainAnimation(amount);
        
        await this.saveGameData();
        this.updateUI();
        
        if (reason) {
            this.showNotification(`+${amount} XP: ${reason}`, 'success');
        }
    }

    async awardDopamineCoins(amount, reason = '') {
        this.gameData.dopamineCoins += amount;
        await this.saveGameData();
        this.updateUI();
        
        if (reason) {
            this.showNotification(`+${amount} 🪙: ${reason}`, 'success');
        }
    }

    async levelUp() {
        // Award level up rewards
        const coinsReward = this.gameData.level * 5;
        this.gameData.dopamineCoins += coinsReward;
        
        // Show level up celebration
        this.showLevelUpCelebration();
        
        // Check for level-based achievements
        this.checkLevelAchievements();
        
        await this.saveGameData();
    }

    showLevelUpCelebration() {
        const popup = document.getElementById('levelUpPopup');
        document.getElementById('newLevel').textContent = this.gameData.level;
        popup.style.display = 'flex';
        
        // Auto-hide after 5 seconds
        setTimeout(() => {
            popup.style.display = 'none';
        }, 5000);
    }

    claimLevelUpRewards() {
        document.getElementById('levelUpPopup').style.display = 'none';
        this.showNotification('Level up rewards claimed! 🎁', 'success');
    }

    showXPGainAnimation(amount) {
        const container = document.querySelector('.container');
        const animation = document.createElement('div');
        animation.className = 'xp-gain-animation';
        animation.textContent = `+${amount} XP`;
        animation.style.left = '50%';
        animation.style.top = '200px';
        animation.style.transform = 'translateX(-50%)';
        
        container.appendChild(animation);
        
        setTimeout(() => {
            animation.remove();
        }, 1000);
    }

    showSessionCompletionCelebration(minutes, xpBonus, coins) {
        const popup = document.getElementById('achievementPopup');
        document.getElementById('achievementName').textContent = `${minutes} Minute Focus Session`;
        popup.querySelector('.achievement-reward').textContent = `+${xpBonus} XP • +${coins} Coins`;
        popup.style.display = 'flex';
        
        setTimeout(() => {
            popup.style.display = 'none';
        }, 3000);
    }

    checkDailyChallenge() {
        const today = new Date().toDateString();
        
        if (!this.gameData.dailyChallenge || this.gameData.dailyChallenge.date !== today) {
            // Generate new daily challenge
            const challenges = [
                { description: 'Focus for 25 minutes without distractions', target: 25, unit: 'min', type: 'focus_time', reward: 50 },
                { description: 'Complete 3 focus sessions today', target: 3, unit: 'sessions', type: 'focus_sessions', reward: 75 },
                { description: 'Maintain focus for 45 minutes total', target: 45, unit: 'min', type: 'focus_time', reward: 100 },
                { description: 'Use the extension for 5 different tasks', target: 5, unit: 'tasks', type: 'task_switches', reward: 60 }
            ];
            
            const randomChallenge = challenges[Math.floor(Math.random() * challenges.length)];
            
            this.gameData.dailyChallenge = {
                ...randomChallenge,
                date: today,
                progress: 0,
                completed: false
            };
            
            this.saveGameData();
        }
    }

    updateDailyChallengeProgress(type, amount) {
        const challenge = this.gameData.dailyChallenge;
        if (!challenge || challenge.completed || challenge.type !== type) return;
        
        challenge.progress = Math.min(challenge.progress + amount, challenge.target);
        
        if (challenge.progress >= challenge.target && !challenge.completed) {
            challenge.completed = true;
            this.awardXP(challenge.reward, 'Daily challenge completed!');
            this.awardDopamineCoins(10, 'Daily challenge bonus!');
            this.showNotification('🏆 Daily challenge completed!', 'success');
        }
        
        this.saveGameData();
        this.updateUI();
    }

    checkFocusAchievements(minutes) {
        const achievements = [
            { id: 'first_focus', name: 'First Steps', description: 'Complete your first focus session', condition: () => true, reward: { xp: 25, coins: 5 } },
            { id: 'focus_25', name: 'Pomodoro Master', description: 'Focus for 25 minutes straight', condition: () => minutes >= 25, reward: { xp: 50, coins: 10 } },
            { id: 'focus_60', name: 'Deep Diver', description: 'Focus for 1 hour straight', condition: () => minutes >= 60, reward: { xp: 100, coins: 20 } },
            { id: 'focus_120', name: 'Hyperfocus Hero', description: 'Focus for 2 hours straight', condition: () => minutes >= 120, reward: { xp: 200, coins: 50 } }
        ];
        
        achievements.forEach(achievement => {
            if (!this.hasAchievement(achievement.id) && achievement.condition()) {
                this.unlockAchievement(achievement);
            }
        });
    }

    checkLevelAchievements() {
        const levelAchievements = [
            { id: 'level_5', name: 'Rising Star', description: 'Reach level 5', condition: () => this.gameData.level >= 5, reward: { xp: 0, coins: 25 } },
            { id: 'level_10', name: 'Focus Veteran', description: 'Reach level 10', condition: () => this.gameData.level >= 10, reward: { xp: 0, coins: 50 } },
            { id: 'level_25', name: 'ADHD Champion', description: 'Reach level 25', condition: () => this.gameData.level >= 25, reward: { xp: 0, coins: 100 } }
        ];
        
        levelAchievements.forEach(achievement => {
            if (!this.hasAchievement(achievement.id) && achievement.condition()) {
                this.unlockAchievement(achievement);
            }
        });
    }

    hasAchievement(id) {
        return this.gameData.achievements.some(a => a.id === id);
    }

    unlockAchievement(achievement) {
        const newAchievement = {
            ...achievement,
            unlockedAt: Date.now(),
            isNew: true
        };
        
        this.gameData.achievements.push(newAchievement);
        
        // Award rewards
        if (achievement.reward.xp > 0) {
            this.awardXP(achievement.reward.xp, 'Achievement unlocked!');
        }
        if (achievement.reward.coins > 0) {
            this.awardDopamineCoins(achievement.reward.coins, 'Achievement reward!');
        }
        
        // Show achievement popup
        this.showAchievementPopup(achievement);
        
        this.saveGameData();
    }

    showAchievementPopup(achievement) {
        const popup = document.getElementById('achievementPopup');
        document.getElementById('achievementName').textContent = achievement.name;
        popup.querySelector('.achievement-reward').textContent = 
            `+${achievement.reward.xp} XP • +${achievement.reward.coins} Coins`;
        popup.style.display = 'flex';
        
        setTimeout(() => {
            popup.style.display = 'none';
        }, 4000);
    }

    checkNewAchievements() {
        const newAchievements = this.gameData.achievements.filter(a => a.isNew);
        if (newAchievements.length > 0) {
            // Show the first new achievement
            setTimeout(() => {
                this.showAchievementPopup(newAchievements[0]);
                newAchievements[0].isNew = false;
                this.saveGameData();
            }, 1000);
        }
    }

    // Quick action handlers
    openMarketplace() {
        chrome.tabs.create({ url: chrome.runtime.getURL('marketplace.html') });
    }

    openAchievements() {
        chrome.tabs.create({ url: chrome.runtime.getURL('achievements.html') });
    }

    openLeaderboard() {
        chrome.tabs.create({ url: chrome.runtime.getURL('leaderboard.html') });
    }

    openSocial() {
        chrome.tabs.create({ url: chrome.runtime.getURL('social.html') });
    }

    findBuddy() {
        // Mock buddy matching
        this.gameData.buddy = {
            id: 'buddy_' + Date.now(),
            name: 'Alex M.',
            status: 'Currently focusing 🎯',
            streak: Math.floor(Math.random() * 20) + 1,
            level: Math.floor(Math.random() * 15) + 1
        };
        
        this.saveGameData();
        this.updateUI();
        this.showNotification('🤝 Buddy matched! Say hello!', 'success');
    }

    openBuddyChat() {
        this.showNotification('💬 Buddy chat coming soon!', 'info');
    }

    handleBackgroundMessage(message) {
        switch (message.type) {
            case 'awardXP':
                this.awardXP(message.amount, message.reason);
                break;
            case 'awardCoins':
                this.awardDopamineCoins(message.amount, message.reason);
                break;
            case 'updateStreak':
                this.gameData.streak = message.streak;
                this.saveGameData();
                this.updateUI();
                break;
        }
    }

    showNotification(message, type = 'info') {
        // Create temporary notification
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 12px 16px;
            background: ${type === 'success' ? '#10b981' : type === 'error' ? '#ef4444' : '#3b82f6'};
            color: white;
            border-radius: 8px;
            font-size: 12px;
            font-weight: 600;
            z-index: 2000;
            animation: slideIn 0.3s ease;
            max-width: 250px;
        `;
        notification.textContent = message;
        document.body.appendChild(notification);

        setTimeout(() => {
            notification.remove();
        }, 3000);
    }

    startPeriodicUpdates() {
        // Update UI every 5 seconds
        setInterval(() => {
            this.updateUI();
        }, 5000);
    }
}

// Initialize popup when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new FlowStateGamePopup();
});

// Add slideIn animation
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from { opacity: 0; transform: translateX(100%); }
        to { opacity: 1; transform: translateX(0); }
    }
`;
document.head.appendChild(style);