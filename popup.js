// popup.js - Main popup interface logic

class FlowStatePopup {
    constructor() {
        this.settings = {};
        this.stats = {};
        this.init();
    }

    async init() {
        await this.loadSettings();
        await this.loadStats();
        this.setupEventListeners();
        this.updateUI();
        this.startStatsUpdater();
    }

    async loadSettings() {
        const defaultSettings = {
            hyperfocusBreaker: true,
            momentumKeeper: true,
            dopamineQueue: true,
            thoughtParking: true,
            contextRestoration: true,
            hyperfocusThreshold: 45, // minutes
            breakReminder: 5, // minutes
            dopamineMinutes: 0,
            thoughtsParked: 0
        };

        const saved = await chrome.storage.sync.get(defaultSettings);
        this.settings = saved;
    }

    async loadStats() {
        const stats = await chrome.storage.local.get(['focusTime', 'dopamineMinutes', 'thoughtsParked']);
        this.stats = {
            focusTime: stats.focusTime || 0,
            dopamineMinutes: stats.dopamineMinutes || 0,
            thoughtsParked: stats.thoughtsParked || 0
        };
    }

    setupEventListeners() {
        // Feature toggles
        const toggles = ['hyperfocusBreaker', 'momentumKeeper', 'dopamineQueue', 'thoughtParking', 'contextRestoration'];
        
        toggles.forEach(feature => {
            const toggle = document.getElementById(feature);
            if (toggle) {
                toggle.checked = this.settings[feature];
                toggle.addEventListener('change', (e) => this.handleFeatureToggle(feature, e.target.checked));
            }
        });

        // Action buttons
        document.getElementById('saveWorkspace')?.addEventListener('click', () => this.saveWorkspace());
        document.getElementById('viewThoughts')?.addEventListener('click', () => this.toggleThoughtsDisplay());
        
        // Thought input
        document.getElementById('saveThought')?.addEventListener('click', () => this.saveThought());
        document.getElementById('cancelThought')?.addEventListener('click', () => this.hideThoughtInput());
        document.getElementById('closeThoughts')?.addEventListener('click', () => this.hideThoughtsDisplay());

        // Quick thought capture shortcut
        document.addEventListener('keydown', (e) => {
            if (e.ctrlKey && e.shiftKey && e.key === 'T') {
                this.showThoughtInput();
            }
        });
    }

    async handleFeatureToggle(feature, enabled) {
        this.settings[feature] = enabled;
        await chrome.storage.sync.set({ [feature]: enabled });
        
        // Send message to background script
        chrome.runtime.sendMessage({
            type: 'toggleFeature',
            feature: feature,
            enabled: enabled
        });

        this.updateStatusIndicator();
    }

    updateUI() {
        // Update stats display
        document.getElementById('focusTime').textContent = this.formatTime(this.stats.focusTime);
        document.getElementById('dopamineMinutes').textContent = this.stats.dopamineMinutes;
        document.getElementById('thoughtsParked').textContent = this.stats.thoughtsParked;

        this.updateStatusIndicator();
    }

    updateStatusIndicator() {
        const enabledFeatures = Object.values(this.settings).filter(Boolean).length;
        const statusText = document.getElementById('statusText');
        const statusDot = document.querySelector('.status-dot');

        if (enabledFeatures === 0) {
            statusText.textContent = 'Paused';
            statusDot.style.background = '#ff9800';
        } else if (enabledFeatures <= 2) {
            statusText.textContent = 'Minimal';
            statusDot.style.background = '#2196f3';
        } else {
            statusText.textContent = 'Active';
            statusDot.style.background = '#4caf50';
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

    async saveWorkspace() {
        try {
            const tabs = await chrome.tabs.query({ currentWindow: true });
            const workspace = {
                id: Date.now(),
                name: `Workspace ${new Date().toLocaleTimeString()}`,
                tabs: tabs.map(tab => ({
                    url: tab.url,
                    title: tab.title,
                    pinned: tab.pinned,
                    active: tab.active
                })),
                timestamp: Date.now()
            };

            const { workspaces = [] } = await chrome.storage.local.get(['workspaces']);
            workspaces.push(workspace);
            
            // Keep only last 10 workspaces
            if (workspaces.length > 10) {
                workspaces.splice(0, workspaces.length - 10);
            }

            await chrome.storage.local.set({ workspaces });
            
            this.showNotification('Workspace saved successfully!', 'success');
        } catch (error) {
            console.error('Error saving workspace:', error);
            this.showNotification('Failed to save workspace', 'error');
        }
    }

    showThoughtInput() {
        document.getElementById('thoughtInputSection').style.display = 'block';
        document.getElementById('thoughtInput').focus();
    }

    hideThoughtInput() {
        document.getElementById('thoughtInputSection').style.display = 'none';
        document.getElementById('thoughtInput').value = '';
    }

    async saveThought() {
        const thoughtText = document.getElementById('thoughtInput').value.trim();
        if (!thoughtText) return;

        const thought = {
            id: Date.now(),
            text: thoughtText,
            timestamp: Date.now(),
            url: await this.getCurrentTabUrl()
        };

        const { parkedThoughts = [] } = await chrome.storage.local.get(['parkedThoughts']);
        parkedThoughts.push(thought);
        await chrome.storage.local.set({ parkedThoughts });

        // Update stats
        this.stats.thoughtsParked = parkedThoughts.length;
        await chrome.storage.local.set({ thoughtsParked: this.stats.thoughtsParked });

        this.hideThoughtInput();
        this.updateUI();
        this.showNotification('Thought parked successfully!', 'success');
    }

    async getCurrentTabUrl() {
        try {
            const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
            return tab?.url || '';
        } catch {
            return '';
        }
    }

    async toggleThoughtsDisplay() {
        const display = document.getElementById('thoughtsDisplay');
        const isVisible = display.style.display !== 'none';
        
        if (isVisible) {
            this.hideThoughtsDisplay();
        } else {
            await this.showThoughtsDisplay();
        }
    }

    async showThoughtsDisplay() {
        const { parkedThoughts = [] } = await chrome.storage.local.get(['parkedThoughts']);
        const thoughtsList = document.getElementById('thoughtsList');
        
        thoughtsList.innerHTML = '';
        
        if (parkedThoughts.length === 0) {
            thoughtsList.innerHTML = '<div class="thought-item">No thoughts parked yet. Use Ctrl+Shift+T to quickly park a thought!</div>';
        } else {
            parkedThoughts.slice(-10).reverse().forEach(thought => {
                const thoughtElement = document.createElement('div');
                thoughtElement.className = 'thought-item';
                thoughtElement.innerHTML = `
                    <div>${this.escapeHtml(thought.text)}</div>
                    <div class="thought-timestamp">${new Date(thought.timestamp).toLocaleString()}</div>
                `;
                thoughtsList.appendChild(thoughtElement);
            });
        }
        
        document.getElementById('thoughtsDisplay').style.display = 'block';
    }

    hideThoughtsDisplay() {
        document.getElementById('thoughtsDisplay').style.display = 'none';
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    showNotification(message, type = 'info') {
        // Create temporary notification element
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed;
            top: 10px;
            right: 10px;
            padding: 8px 12px;
            background: ${type === 'success' ? '#4caf50' : type === 'error' ? '#f44336' : '#2196f3'};
            color: white;
            border-radius: 4px;
            font-size: 12px;
            z-index: 1000;
            animation: slideIn 0.3s ease;
        `;
        notification.textContent = message;
        document.body.appendChild(notification);

        setTimeout(() => {
            notification.remove();
        }, 3000);
    }

    startStatsUpdater() {
        // Update stats every 5 seconds
        setInterval(async () => {
            await this.loadStats();
            this.updateUI();
        }, 5000);
    }
}

// Initialize popup when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new FlowStatePopup();
});

// Add slideIn animation keyframes
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from { opacity: 0; transform: translateX(100%); }
        to { opacity: 1; transform: translateX(0); }
    }
`;
document.head.appendChild(style);
