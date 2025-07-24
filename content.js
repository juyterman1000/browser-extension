// content.js - AI-powered content script for FlowState ADHD extension

class FlowStateAIContent {
    constructor() {
        this.overlays = new Map();
        this.thoughtCaptureEnabled = false;
        this.focusMode = false;
        this.pageAnalysis = null;
        this.distractingElements = [];
        this.aiAvailable = false;
        this.init();
    }

    init() {
        this.setupMessageListener();
        this.setupKeyboardShortcuts();
        this.checkThoughtCaptureMode();
        this.startPageAnalysis();
        this.setupFocusEnhancements();
    }

    setupMessageListener() {
        chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
            switch (request.action || request.type) {
                case 'getPageContent':
                    this.getPageContentForAnalysis().then(content => {
                        sendResponse({ content });
                    });
                    return true; // Keep message channel open
                case 'showMomentumKeeper':
                    this.showMomentumKeeperOverlay(request.previousActivity, request.currentTab);
                    break;
                case 'showHyperfocusBreaker':
                    this.showHyperfocusBreakerOverlay(request.sessionTime);
                    break;
                case 'showDopamineTimeUp':
                    this.showDopamineTimeUpOverlay();
                    break;
                case 'enableThoughtCapture':
                    this.thoughtCaptureEnabled = true;
                    break;
                case 'disableThoughtCapture':
                    this.thoughtCaptureEnabled = false;
                    break;
                case 'enterFocusMode':
                    this.enterFocusMode();
                    break;
                case 'exitFocusMode':
                    this.exitFocusMode();
                    break;
                case 'analyzeContent':
                    this.analyzePageContent();
                    break;
                case 'highlightDistractions':
                    this.highlightDistractions(request.elements);
                    break;
            }
            sendResponse({ success: true });
        });
    }

    setupKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            // Ctrl+Shift+T for quick thought capture
            if (e.ctrlKey && e.shiftKey && e.key === 'T' && this.thoughtCaptureEnabled) {
                e.preventDefault();
                this.showQuickThoughtCapture();
            }
            
            // Escape to close overlays
            if (e.key === 'Escape') {
                this.hideAllOverlays();
            }
        });
    }

    async checkThoughtCaptureMode() {
        try {
            const settings = await chrome.storage.sync.get(['thoughtParking']);
            this.thoughtCaptureEnabled = settings.thoughtParking !== false;
        } catch (error) {
            console.log('Could not check thought capture settings:', error);
        }
    }

    showMomentumKeeperOverlay(previousActivity, currentTab) {
        const overlayId = 'flowstate-momentum-keeper';
        
        // Remove existing overlay
        this.hideOverlay(overlayId);
        
        const overlay = document.createElement('div');
        overlay.id = overlayId;
        overlay.className = 'flowstate-overlay momentum-keeper';
        
        const timePassed = this.formatTimeSince(previousActivity.timestamp);
        
        overlay.innerHTML = `
            <div class="overlay-header">
                <div class="overlay-icon">🧠</div>
                <div class="overlay-title">Task Momentum Keeper</div>
                <button class="overlay-close" data-action="close">×</button>
            </div>
            <div class="overlay-content">
                <div class="previous-activity">
                    <div class="activity-label">You were working on:</div>
                    <div class="activity-title">${this.escapeHtml(previousActivity.title)}</div>
                    <div class="activity-time">${timePassed} ago</div>
                </div>
                <div class="overlay-actions">
                    <button class="btn-primary" data-action="return">
                        ← Return to Previous Task
                    </button>
                    <button class="btn-secondary" data-action="continue">
                        Continue Here
                    </button>
                </div>
            </div>
        `;
        
        // Add event listeners
        overlay.addEventListener('click', (e) => {
            const action = e.target.dataset.action;
            switch (action) {
                case 'close':
                case 'continue':
                    this.hideOverlay(overlayId);
                    break;
                case 'return':
                    window.location.href = previousActivity.url;
                    break;
            }
        });
        
        document.body.appendChild(overlay);
        this.overlays.set(overlayId, overlay);
        
        // Auto-hide after 10 seconds
        setTimeout(() => {
            this.hideOverlay(overlayId);
        }, 10000);
    }

    showHyperfocusBreakerOverlay(sessionTime) {
        const overlayId = 'flowstate-hyperfocus-breaker';
        
        this.hideOverlay(overlayId);
        
        const overlay = document.createElement('div');
        overlay.id = overlayId;
        overlay.className = 'flowstate-overlay hyperfocus-breaker';
        
        overlay.innerHTML = `
            <div class="overlay-header">
                <div class="overlay-icon">🌟</div>
                <div class="overlay-title">Hyperfocus Circuit Breaker</div>
                <button class="overlay-close" data-action="close">×</button>
            </div>
            <div class="overlay-content">
                <div class="focus-celebration">
                    <div class="focus-time">🎉 ${sessionTime} minutes of deep focus!</div>
                    <div class="focus-message">Your brain is amazing! Now let's take care of your body too.</div>
                </div>
                <div class="body-check-list">
                    <div class="check-item">
                        <input type="checkbox" id="posture-check">
                        <label for="posture-check">Adjust posture & stretch</label>
                    </div>
                    <div class="check-item">
                        <input type="checkbox" id="water-check">
                        <label for="water-check">Drink some water</label>
                    </div>
                    <div class="check-item">
                        <input type="checkbox" id="eyes-check">
                        <label for="eyes-check">Rest your eyes (20-20-20 rule)</label>
                    </div>
                    <div class="check-item">
                        <input type="checkbox" id="bathroom-check">
                        <label for="bathroom-check">Bathroom break if needed</label>
                    </div>
                </div>
                <div class="overlay-actions">
                    <button class="btn-primary" data-action="continue-focus">
                        ✨ Back to Flow State
                    </button>
                    <button class="btn-secondary" data-action="take-break">
                        🧘 Take a Real Break
                    </button>
                </div>
            </div>
        `;
        
        // Add event listeners
        overlay.addEventListener('click', (e) => {
            const action = e.target.dataset.action;
            switch (action) {
                case 'close':
                case 'continue-focus':
                case 'take-break':
                    this.hideOverlay(overlayId);
                    if (action === 'take-break') {
                        // Award some dopamine minutes for taking care of themselves
                        chrome.runtime.sendMessage({
                            type: 'completeTask',
                            points: 2
                        });
                    }
                    break;
            }
        });
        
        document.body.appendChild(overlay);
        this.overlays.set(overlayId, overlay);
        
        // Auto-hide after 30 seconds
        setTimeout(() => {
            this.hideOverlay(overlayId);
        }, 30000);
    }

    showDopamineTimeUpOverlay() {
        const overlayId = 'flowstate-dopamine-timeup';
        
        this.hideOverlay(overlayId);
        
        const overlay = document.createElement('div');
        overlay.id = overlayId;
        overlay.className = 'flowstate-overlay dopamine-timeup';
        
        overlay.innerHTML = `
            <div class="overlay-header">
                <div class="overlay-icon">⏰</div>
                <div class="overlay-title">Dopamine Time Complete!</div>
                <button class="overlay-close" data-action="close">×</button>
            </div>
            <div class="overlay-content">
                <div class="timeup-message">
                    <div class="message-text">Hope you enjoyed that! Ready to earn more dopamine minutes?</div>
                    <div class="motivation">You've got this! Every bit of focus counts. 💪</div>
                </div>
                <div class="overlay-actions">
                    <button class="btn-primary" data-action="back-to-work">
                        🎯 Back to Productive Work
                    </button>
                    <button class="btn-secondary" data-action="few-more-minutes">
                        Just 5 More Minutes
                    </button>
                </div>
            </div>
        `;
        
        overlay.addEventListener('click', (e) => {
            const action = e.target.dataset.action;
            switch (action) {
                case 'close':
                case 'back-to-work':
                    this.hideOverlay(overlayId);
                    // Could redirect to a productive site or close tab
                    break;
                case 'few-more-minutes':
                    this.hideOverlay(overlayId);
                    // Allow 5 more minutes but don't award any points
                    setTimeout(() => {
                        this.showDopamineTimeUpOverlay(); // Show again after 5 minutes
                    }, 5 * 60 * 1000);
                    break;
            }
        });
        
        document.body.appendChild(overlay);
        this.overlays.set(overlayId, overlay);
    }

    showQuickThoughtCapture() {
        const overlayId = 'flowstate-thought-capture';
        
        this.hideOverlay(overlayId);
        
        const overlay = document.createElement('div');
        overlay.id = overlayId;
        overlay.className = 'flowstate-overlay thought-capture';
        
        overlay.innerHTML = `
            <div class="overlay-header">
                <div class="overlay-icon">💭</div>
                <div class="overlay-title">Quick Thought Capture</div>
                <button class="overlay-close" data-action="close">×</button>
            </div>
            <div class="overlay-content">
                <textarea id="quick-thought-input" placeholder="What's on your mind? Park it here and stay focused..." autofocus></textarea>
                <div class="overlay-actions">
                    <button class="btn-primary" data-action="save">
                        💾 Park This Thought
                    </button>
                    <button class="btn-secondary" data-action="cancel">
                        Cancel
                    </button>
                </div>
            </div>
        `;
        
        overlay.addEventListener('click', (e) => {
            const action = e.target.dataset.action;
            switch (action) {
                case 'close':
                case 'cancel':
                    this.hideOverlay(overlayId);
                    break;
                case 'save':
                    this.saveQuickThought(overlayId);
                    break;
            }
        });
        
        // Save on Enter (but allow Shift+Enter for new lines)
        overlay.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                this.saveQuickThought(overlayId);
            }
        });
        
        document.body.appendChild(overlay);
        this.overlays.set(overlayId, overlay);
    }

    async saveQuickThought(overlayId) {
        const textarea = document.getElementById('quick-thought-input');
        const thoughtText = textarea?.value.trim();
        
        if (!thoughtText) {
            this.hideOverlay(overlayId);
            return;
        }
        
        try {
            await chrome.runtime.sendMessage({
                type: 'parkThought',
                thought: thoughtText
            });
            
            // Show brief success message
            const overlay = this.overlays.get(overlayId);
            if (overlay) {
                overlay.innerHTML = `
                    <div class="overlay-header">
                        <div class="overlay-icon">✅</div>
                        <div class="overlay-title">Thought Parked!</div>
                    </div>
                    <div class="overlay-content">
                        <div class="success-message">Your thought has been safely parked. Back to your flow state! 🌊</div>
                    </div>
                `;
                
                setTimeout(() => {
                    this.hideOverlay(overlayId);
                }, 2000);
            }
        } catch (error) {
            console.error('Error saving thought:', error);
            this.hideOverlay(overlayId);
        }
    }

    hideOverlay(overlayId) {
        const overlay = this.overlays.get(overlayId);
        if (overlay && overlay.parentNode) {
            overlay.parentNode.removeChild(overlay);
            this.overlays.delete(overlayId);
        }
    }

    hideAllOverlays() {
        this.overlays.forEach((overlay, id) => {
            this.hideOverlay(id);
        });
    }

    formatTimeSince(timestamp) {
        const now = Date.now();
        const diff = now - timestamp;
        const minutes = Math.floor(diff / 1000 / 60);
        
        if (minutes < 1) return 'Just now';
        if (minutes === 1) return '1 minute';
        if (minutes < 60) return `${minutes} minutes`;
        
        const hours = Math.floor(minutes / 60);
        if (hours === 1) return '1 hour';
        return `${hours} hours`;
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

// Initialize content script
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => new FlowStateContent());
} else {
    new FlowStateContent();
}
