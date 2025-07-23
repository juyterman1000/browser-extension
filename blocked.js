// blocked.js - Logic for the dopamine queue blocked page

class FlowStateBlocked {
    constructor() {
        this.originalUrl = '';
        this.blockedSite = '';
        this.timer = null;
        this.timeRemaining = 600; // 10 minutes in seconds
        this.isTimerRunning = false;
        
        this.init();
    }

    async init() {
        this.parseUrlParams();
        await this.loadStats();
        this.setupEventListeners();
        this.updateDisplay();
        this.setupTaskOptions();
    }

    parseUrlParams() {
        const params = new URLSearchParams(window.location.search);
        this.blockedSite = params.get('site') || 'this site';
        this.originalUrl = params.get('original') || '';
        
        document.getElementById('blockedSite').textContent = this.blockedSite;
    }

    async loadStats() {
        try {
            const stats = await chrome.storage.local.get(['dopamineMinutes', 'focusTime', 'tasksCompleted']);
            this.stats = {
                dopamineMinutes: stats.dopamineMinutes || 0,
                focusTime: stats.focusTime || 0,
                tasksCompleted: stats.tasksCompleted || 0
            };
        } catch (error) {
            console.error('Error loading stats:', error);
            this.stats = { dopamineMinutes: 0, focusTime: 0, tasksCompleted: 0 };
        }
    }

    updateDisplay() {
        document.getElementById('earnedMinutes').textContent = this.stats.dopamineMinutes;
        document.getElementById('focusTime').textContent = this.formatTime(this.stats.focusTime);
        document.getElementById('tasksCompleted').textContent = this.stats.tasksCompleted;
    }

    setupEventListeners() {
        // Quick action buttons
        document.getElementById('startTimer').addEventListener('click', () => this.showTimerModal());
        document.getElementById('openProductiveSite').addEventListener('click', () => this.suggestProductiveSite());
        document.getElementById('parkThought').addEventListener('click', () => this.showThoughtModal());

        // Timer modal
        document.getElementById('closeTimer').addEventListener('click', () => this.hideTimerModal());
        document.getElementById('startBtn').addEventListener('click', () => this.startTimer());
        document.getElementById('pauseBtn').addEventListener('click', () => this.pauseTimer());
        document.getElementById('resetBtn').addEventListener('click', () => this.resetTimer());

        // Thought modal
        document.getElementById('closeThought').addEventListener('click', () => this.hideThoughtModal());
        document.getElementById('saveThought').addEventListener('click', () => this.saveThought());
        document.getElementById('cancelThought').addEventListener('click', () => this.hideThoughtModal());

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.hideAllModals();
            }
        });
    }

    setupTaskOptions() {
        const taskOptions = document.querySelectorAll('.task-option');
        taskOptions.forEach(option => {
            option.addEventListener('click', () => {
                const task = option.dataset.task;
                const points = parseInt(option.dataset.points);
                this.selectTask(task, points, option);
            });
        });
    }

    selectTask(task, points, element) {
        // Add visual feedback
        document.querySelectorAll('.task-option').forEach(opt => opt.classList.remove('selected'));
        element.classList.add('selected');

        // Handle different task types
        switch (task) {
            case 'focus':
                this.showTimerModal();
                break;
            case 'deep-work':
                this.showTimerModal(30); // 30 minutes
                break;
            case 'task-complete':
                this.completeTask(points);
                break;
            case 'learning':
                this.openLearningResource(points);
                break;
        }
    }

    showTimerModal(minutes = 10) {
        this.timeRemaining = minutes * 60;
        this.updateTimerDisplay();
        document.getElementById('timerModal').style.display = 'flex';
    }

    hideTimerModal() {
        document.getElementById('timerModal').style.display = 'none';
        if (this.isTimerRunning) {
            this.pauseTimer();
        }
    }

    startTimer() {
        this.isTimerRunning = true;
        document.getElementById('startBtn').style.display = 'none';
        document.getElementById('pauseBtn').style.display = 'inline-block';
        
        this.timer = setInterval(() => {
            this.timeRemaining--;
            this.updateTimerDisplay();
            
            if (this.timeRemaining <= 0) {
                this.completeTimer();
            }
        }, 1000);
    }

    pauseTimer() {
        this.isTimerRunning = false;
        document.getElementById('startBtn').style.display = 'inline-block';
        document.getElementById('pauseBtn').style.display = 'none';
        
        if (this.timer) {
            clearInterval(this.timer);
            this.timer = null;
        }
    }

    resetTimer() {
        this.pauseTimer();
        this.timeRemaining = 600; // Reset to 10 minutes
        this.updateTimerDisplay();
    }

    updateTimerDisplay() {
        const minutes = Math.floor(this.timeRemaining / 60);
        const seconds = this.timeRemaining % 60;
        const display = `${minutes}:${seconds.toString().padStart(2, '0')}`;
        document.getElementById('timerDisplay').textContent = display;
    }

    async completeTimer() {
        this.pauseTimer();
        const focusMinutes = (600 - this.timeRemaining) / 60;
        const points = Math.floor(focusMinutes / 10); // 1 point per 10 minutes
        
        await this.awardPoints(points, 'Focus session completed!');
        
        // Show completion message
        document.getElementById('timerDisplay').textContent = '🎉 Done!';
        setTimeout(() => {
            this.hideTimerModal();
            this.resetTimer();
        }, 2000);
    }

    async completeTask(points) {
        await this.awardPoints(points, 'Task completed! Great job!');
        
        // Update tasks completed stat
        this.stats.tasksCompleted++;
        await chrome.storage.local.set({ tasksCompleted: this.stats.tasksCompleted });
        this.updateDisplay();
    }

    async openLearningResource(points) {
        const learningUrls = [
            'https://www.khanacademy.org',
            'https://www.coursera.org',
            'https://www.edx.org',
            'https://www.duolingo.com',
            'https://www.codecademy.com',
            'https://developer.mozilla.org',
            'https://www.wikipedia.org'
        ];
        
        const randomUrl = learningUrls[Math.floor(Math.random() * learningUrls.length)];
        window.location.href = randomUrl;
        
        // Award points for choosing to learn
        setTimeout(async () => {
            await this.awardPoints(points, 'Started learning session!');
        }, 1000);
    }

    suggestProductiveSite() {
        const productiveUrls = [
            'https://www.todoist.com',
            'https://notion.so',
            'https://docs.google.com',
            'https://calendar.google.com',
            'https://trello.com',
            'https://github.com',
            'https://stackoverflow.com'
        ];
        
        const randomUrl = productiveUrls[Math.floor(Math.random() * productiveUrls.length)];
        window.location.href = randomUrl;
    }

    showThoughtModal() {
        document.getElementById('thoughtModal').style.display = 'flex';
        document.getElementById('thoughtText').focus();
    }

    hideThoughtModal() {
        document.getElementById('thoughtModal').style.display = 'none';
        document.getElementById('thoughtText').value = '';
    }

    async saveThought() {
        const thoughtText = document.getElementById('thoughtText').value.trim();
        if (!thoughtText) {
            this.hideThoughtModal();
            return;
        }

        try {
            // Save thought using Chrome storage
            const { parkedThoughts = [] } = await chrome.storage.local.get(['parkedThoughts']);
            parkedThoughts.push({
                id: Date.now(),
                text: thoughtText,
                timestamp: Date.now(),
                url: this.originalUrl,
                context: 'dopamine_queue'
            });
            
            await chrome.storage.local.set({ parkedThoughts });
            await chrome.storage.local.set({ thoughtsParked: parkedThoughts.length });

            // Award a point for parking the thought instead of getting distracted
            await this.awardPoints(1, 'Thought parked! Good impulse control!');
            
            this.hideThoughtModal();
            this.showNotification('Thought parked successfully! Back to productive work.', 'success');
        } catch (error) {
            console.error('Error saving thought:', error);
            this.showNotification('Error saving thought. Please try again.', 'error');
        }
    }

    async awardPoints(points, message) {
        if (points <= 0) return;
        
        this.stats.dopamineMinutes += points;
        await chrome.storage.local.set({ dopamineMinutes: this.stats.dopamineMinutes });
        this.updateDisplay();
        
        this.showNotification(`+${points} dopamine minutes! ${message}`, 'success');
        
        // If user has earned enough minutes, offer to visit the original site
        if (this.stats.dopamineMinutes >= 5) {
            setTimeout(() => {
                this.showAccessModal();
            }, 2000);
        }
    }

    showAccessModal() {
        const modal = document.createElement('div');
        modal.className = 'access-modal';
        modal.innerHTML = `
            <div class="access-content">
                <div class="access-header">
                    <h3>🎉 Access Granted!</h3>
                </div>
                <div class="access-body">
                    <p>You've earned enough dopamine minutes! Ready to visit <strong>${this.blockedSite}</strong>?</p>
                    <div class="access-actions">
                        <button class="action-btn primary" onclick="this.visitSite()">
                            Visit ${this.blockedSite}
                        </button>
                        <button class="action-btn secondary" onclick="this.continueWork()">
                            Keep Working (Earn More!)
                        </button>
                    </div>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // Add event listeners
        modal.querySelector('.action-btn.primary').addEventListener('click', () => this.visitSite());
        modal.querySelector('.action-btn.secondary').addEventListener('click', () => this.continueWork(modal));
    }

    visitSite() {
        if (this.originalUrl) {
            window.location.href = this.originalUrl;
        } else {
            window.location.href = `https://${this.blockedSite}`;
        }
    }

    continueWork(modal) {
        if (modal) {
            modal.remove();
        }
        this.showNotification('Great choice! Keep building those dopamine minutes!', 'success');
    }

    hideAllModals() {
        this.hideTimerModal();
        this.hideThoughtModal();
        
        const accessModal = document.querySelector('.access-modal');
        if (accessModal) {
            accessModal.remove();
        }
    }

    formatTime(minutes) {
        if (minutes < 60) {
            return `${minutes}m`;
        }
        const hours = Math.floor(minutes / 60);
        const remainingMinutes = minutes % 60;
        return `${hours}h ${remainingMinutes}m`;
    }

    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.textContent = message;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.classList.add('show');
        }, 100);
        
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => {
                notification.remove();
            }, 300);
        }, 3000);
    }
}

// Initialize when DOM loads
document.addEventListener('DOMContentLoaded', () => {
    new FlowStateBlocked();
});
