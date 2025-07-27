// Simple Content Script for ADHD FlowState Extension
// Provides subtle, non-intrusive ADHD support on web pages

class ADHDContentHelper {
    constructor() {
        this.isEnabled = true;
        this.focusMode = false;
        this.readingMode = false;
        
        this.init();
    }

    async init() {
        // Only run on actual web pages, not extension pages
        if (window.location.protocol === 'chrome-extension:') {
            return;
        }

        try {
            await this.loadSettings();
            this.setupADHDSupport();
            this.setupMessageListener();
        } catch (error) {
            console.log('ADHD Helper: Could not initialize on this page');
        }
    }

    async loadSettings() {
        return new Promise((resolve) => {
            if (typeof chrome !== 'undefined' && chrome.storage) {
                chrome.storage.local.get(['adhdFlowState'], (result) => {
                    if (result.adhdFlowState) {
                        this.settings = result.adhdFlowState.preferences || {};
                    }
                    resolve();
                });
            } else {
                resolve();
            }
        });
    }

    setupADHDSupport() {
        // Add ADHD-friendly features
        this.addFocusModeToggle();
        this.addReadingSupport();
        this.addKeyboardShortcuts();
        this.addTimeAwareness();
    }

    setupMessageListener() {
        if (typeof chrome !== 'undefined' && chrome.runtime) {
            chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
                switch (message.type) {
                    case 'toggleFocusMode':
                        this.toggleFocusMode();
                        sendResponse({ success: true });
                        break;
                    case 'toggleReadingMode':
                        this.toggleReadingMode();
                        sendResponse({ success: true });
                        break;
                    default:
                        sendResponse({ success: false });
                }
            });
        }
    }

    addFocusModeToggle() {
        // Create floating focus mode button
        const focusButton = document.createElement('div');
        focusButton.id = 'adhd-focus-toggle';
        focusButton.innerHTML = '🎯';
        focusButton.title = 'Toggle ADHD Focus Mode';
        focusButton.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            width: 40px;
            height: 40px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            z-index: 10000;
            font-size: 18px;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
            transition: all 0.3s ease;
            opacity: 0.8;
        `;

        focusButton.addEventListener('mouseenter', () => {
            focusButton.style.opacity = '1';
            focusButton.style.transform = 'scale(1.1)';
        });

        focusButton.addEventListener('mouseleave', () => {
            focusButton.style.opacity = '0.8';
            focusButton.style.transform = 'scale(1)';
        });

        focusButton.addEventListener('click', () => {
            this.toggleFocusMode();
        });

        document.body.appendChild(focusButton);
    }

    toggleFocusMode() {
        this.focusMode = !this.focusMode;
        
        if (this.focusMode) {
            this.enableFocusMode();
        } else {
            this.disableFocusMode();
        }
    }

    enableFocusMode() {
        // Create focus overlay
        const overlay = document.createElement('div');
        overlay.id = 'adhd-focus-overlay';
        overlay.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.7);
            z-index: 9999;
            pointer-events: none;
        `;

        // Add focus message
        const message = document.createElement('div');
        message.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: rgba(255, 255, 255, 0.95);
            padding: 20px;
            border-radius: 12px;
            text-align: center;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
            color: #333;
            z-index: 10001;
            max-width: 300px;
        `;
        message.innerHTML = `
            <div style="font-size: 2em; margin-bottom: 10px;">🎯</div>
            <h3 style="margin: 0 0 10px 0;">Focus Mode Active</h3>
            <p style="margin: 0; font-size: 0.9em;">Minimize distractions. You got this!</p>
            <button id="adhd-exit-focus" style="
                margin-top: 15px;
                padding: 8px 16px;
                background: #667eea;
                color: white;
                border: none;
                border-radius: 6px;
                cursor: pointer;
                font-size: 0.9em;
            ">Exit Focus Mode</button>
        `;

        overlay.appendChild(message);
        document.body.appendChild(overlay);

        // Handle exit button
        document.getElementById('adhd-exit-focus').addEventListener('click', () => {
            this.disableFocusMode();
        });

        // Remove after 3 seconds
        setTimeout(() => {
            if (overlay.parentNode && this.focusMode) {
                overlay.remove();
            }
        }, 3000);

        // Update button
        const button = document.getElementById('adhd-focus-toggle');
        if (button) {
            button.style.background = '#ff6b6b';
            button.innerHTML = '❌';
        }
    }

    disableFocusMode() {
        this.focusMode = false;
        
        // Remove overlay if still present
        const overlay = document.getElementById('adhd-focus-overlay');
        if (overlay) {
            overlay.remove();
        }

        // Reset button
        const button = document.getElementById('adhd-focus-toggle');
        if (button) {
            button.style.background = 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
            button.innerHTML = '🎯';
        }
    }

    addReadingSupport() {
        // Add reading mode styles
        const style = document.createElement('style');
        style.id = 'adhd-reading-styles';
        style.textContent = `
            .adhd-reading-mode {
                line-height: 1.6 !important;
                font-size: 1.1em !important;
                max-width: 700px !important;
                margin: 0 auto !important;
                padding: 20px !important;
                background: #fafafa !important;
                border-radius: 8px !important;
            }
            
            .adhd-reading-mode p {
                margin-bottom: 1em !important;
            }
            
            .adhd-reading-mode h1,
            .adhd-reading-mode h2,
            .adhd-reading-mode h3 {
                color: #333 !important;
                margin: 1.5em 0 0.5em 0 !important;
            }
        `;
        document.head.appendChild(style);
    }

    toggleReadingMode() {
        this.readingMode = !this.readingMode;
        
        const mainContent = this.findMainContent();
        if (mainContent) {
            if (this.readingMode) {
                mainContent.classList.add('adhd-reading-mode');
                this.showMessage('Reading mode enabled! 📖', 'Easier on ADHD eyes');
            } else {
                mainContent.classList.remove('adhd-reading-mode');
                this.showMessage('Reading mode disabled', '');
            }
        }
    }

    findMainContent() {
        // Try to find main content area
        const selectors = ['main', 'article', '.content', '#content', '.post', '.entry'];
        
        for (const selector of selectors) {
            const element = document.querySelector(selector);
            if (element) {
                return element;
            }
        }
        
        // Fallback to body
        return document.body;
    }

    addKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            // Alt + F for focus mode
            if (e.altKey && e.key === 'f') {
                e.preventDefault();
                this.toggleFocusMode();
            }
            
            // Alt + R for reading mode
            if (e.altKey && e.key === 'r') {
                e.preventDefault();
                this.toggleReadingMode();
            }
        });
    }

    addTimeAwareness() {
        // Show subtle time indicator
        if (this.settings?.timeAwareness !== false) {
            const timeIndicator = document.createElement('div');
            timeIndicator.id = 'adhd-time-indicator';
            timeIndicator.style.cssText = `
                position: fixed;
                bottom: 20px;
                right: 20px;
                background: rgba(0, 0, 0, 0.8);
                color: white;
                padding: 8px 12px;
                border-radius: 6px;
                font-size: 0.8em;
                font-family: monospace;
                z-index: 10000;
                opacity: 0.7;
            `;
            
            const updateTime = () => {
                const now = new Date();
                timeIndicator.textContent = now.toLocaleTimeString([], { 
                    hour: '2-digit', 
                    minute: '2-digit' 
                });
            };
            
            updateTime();
            setInterval(updateTime, 60000); // Update every minute
            
            document.body.appendChild(timeIndicator);
        }
    }

    showMessage(title, subtitle = '') {
        const message = document.createElement('div');
        message.style.cssText = `
            position: fixed;
            top: 20px;
            left: 50%;
            transform: translateX(-50%);
            background: rgba(16, 185, 129, 0.9);
            color: white;
            padding: 12px 20px;
            border-radius: 8px;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
            z-index: 10001;
            text-align: center;
            animation: fadeInOut 3s ease;
        `;
        
        message.innerHTML = `
            <div style="font-weight: 600;">${title}</div>
            ${subtitle ? `<div style="font-size: 0.8em; opacity: 0.9;">${subtitle}</div>` : ''}
        `;
        
        // Add animation
        const style = document.createElement('style');
        style.textContent = `
            @keyframes fadeInOut {
                0% { opacity: 0; transform: translateX(-50%) translateY(-10px); }
                15% { opacity: 1; transform: translateX(-50%) translateY(0); }
                85% { opacity: 1; transform: translateX(-50%) translateY(0); }
                100% { opacity: 0; transform: translateX(-50%) translateY(-10px); }
            }
        `;
        document.head.appendChild(style);
        
        document.body.appendChild(message);
        
        setTimeout(() => {
            if (message.parentNode) {
                message.remove();
            }
            if (style.parentNode) {
                style.remove();
            }
        }, 3000);
    }
}

// Initialize the content helper
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        new ADHDContentHelper();
    });
} else {
    new ADHDContentHelper();
}