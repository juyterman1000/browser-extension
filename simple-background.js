// Simple Background Service Worker for ADHD FlowState Extension

class ADHDBackgroundService {
    constructor() {
        this.init();
    }

    init() {
        // Handle extension installation
        chrome.runtime.onInstalled.addListener((details) => {
            if (details.reason === 'install') {
                this.onFirstInstall();
            }
        });

        // Handle alarms for reminders
        chrome.alarms.onAlarm.addListener((alarm) => {
            this.handleAlarm(alarm);
        });

        // Handle messages from popup
        chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
            this.handleMessage(message, sender, sendResponse);
            return true; // Required for async response
        });
    }

    onFirstInstall() {
        // Set up default ADHD-friendly settings
        chrome.storage.local.set({
            adhdFlowState: {
                level: 1,
                xp: 0,
                coins: 50,
                streak: 0,
                firstTime: true,
                preferences: {
                    gentleReminders: true,
                    breakFrequency: 25, // minutes
                    enableSounds: true,
                    darkMode: false
                }
            }
        });

        // Show welcome notification
        chrome.notifications.create({
            type: 'basic',
            iconUrl: 'icons/icon48.png',
            title: 'FlowState ADHD Helper Installed! 🧠⚡',
            message: 'Your ADHD-friendly focus companion is ready to help!'
        });
    }

    handleAlarm(alarm) {
        switch (alarm.name) {
            case 'focusReminder':
                this.showFocusReminder();
                break;
            case 'breakReminder':
                this.showBreakReminder();
                break;
            case 'wellnessCheckIn':
                this.showWellnessCheckIn();
                break;
            default:
                console.log('Unknown alarm:', alarm.name);
        }
    }

    handleMessage(message, sender, sendResponse) {
        switch (message.type) {
            case 'setReminder':
                this.setReminder(message.minutes, message.title);
                sendResponse({ success: true });
                break;
            
            case 'startFocus':
                this.startFocusSession(message.duration);
                sendResponse({ success: true });
                break;
            
            case 'showNotification':
                this.showNotification(message.title, message.message);
                sendResponse({ success: true });
                break;

            default:
                sendResponse({ success: false, error: 'Unknown message type' });
        }
    }

    setReminder(minutes, title = 'Reminder') {
        const alarmName = `reminder_${Date.now()}`;
        
        chrome.alarms.create(alarmName, {
            delayInMinutes: minutes
        });

        // Store reminder details
        chrome.storage.local.get(['reminders'], (result) => {
            const reminders = result.reminders || [];
            reminders.push({
                name: alarmName,
                title: title,
                createdAt: Date.now(),
                triggersAt: Date.now() + (minutes * 60 * 1000)
            });
            
            chrome.storage.local.set({ reminders });
        });
    }

    startFocusSession(duration = 25) {
        // Set break reminder
        chrome.alarms.create('breakReminder', {
            delayInMinutes: duration
        });

        this.showNotification(
            'Focus Session Started! 🎯',
            `Great! You're focusing for ${duration} minutes. I'll remind you when to take a break.`
        );
    }

    showFocusReminder() {
        this.showNotification(
            'Time to Focus! 🎯',
            'Ready to start a productive session? Your ADHD brain is powerful!'
        );
    }

    showBreakReminder() {
        this.showNotification(
            'Break Time! 🌿',
            'Great job focusing! Time for a sensory break to recharge your ADHD brain.'
        );
    }

    showWellnessCheckIn() {
        this.showNotification(
            'Wellness Check-in 💝',
            'How are you feeling? Taking a moment to check in with yourself is important.'
        );
    }

    showNotification(title, message, options = {}) {
        const notificationOptions = {
            type: 'basic',
            iconUrl: 'icons/icon48.png',
            title: title,
            message: message,
            ...options
        };

        chrome.notifications.create(notificationOptions);
    }

    // Set up regular wellness check-ins
    setupWellnessCheckIns() {
        // Clear existing alarms
        chrome.alarms.clearAll();
        
        // Set periodic wellness check-ins (every 2 hours during work hours)
        chrome.alarms.create('wellnessCheckIn', {
            delayInMinutes: 120,
            periodInMinutes: 120
        });
    }
}

// Initialize the background service
new ADHDBackgroundService();