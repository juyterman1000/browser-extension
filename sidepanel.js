// sidepanel.js - AI-powered side panel for FlowState ADHD extension

class FlowStateAIPanel {
    constructor() {
        this.aiSession = null;
        this.aiAvailable = false;
        this.currentAnalysis = null;
        this.parkedThoughts = [];
        this.focusData = {
            score: 0,
            hyperfocusRisk: 0,
            energyLevel: 50
        };
        this.init();
    }

    async init() {
        await this.initializeAI();
        this.setupEventListeners();
        this.loadParkedThoughts();
        this.startPeriodicAnalysis();
        this.updateAIStatus();
    }

    async initializeAI() {
        try {
            // Check Chrome's built-in AI availability
            if ('ai' in window && 'languageModel' in window.ai) {
                const capabilities = await window.ai.languageModel.capabilities();
                console.log('AI Capabilities:', capabilities);
                
                if (capabilities.available === 'readily') {
                    this.aiSession = await window.ai.languageModel.create({
                        systemPrompt: `You are FlowState AI, a specialized ADHD assistant. Provide supportive, practical advice for people with ADHD. 
                        
                        Key principles:
                        - Be encouraging and understanding
                        - Celebrate ADHD strengths like creativity and hyperfocus
                        - Provide actionable, specific suggestions
                        - Keep responses concise but helpful
                        - Focus on brain-friendly strategies
                        - Avoid judgment about distractions or difficulties
                        
                        Context: You help with focus, productivity, content analysis, and thought organization for neurodivergent users.`
                    });
                    this.aiAvailable = true;
                    console.log('FlowState AI Panel initialized successfully');
                } else if (capabilities.available === 'after-download') {
                    this.showAIDownloadPrompt();
                } else {
                    this.showAIUnavailableMessage();
                }
            } else {
                this.showAIUnavailableMessage();
            }
        } catch (error) {
            console.error('AI initialization failed:', error);
            this.aiAvailable = false;
            this.showAIUnavailableMessage();
        }
    }

    setupEventListeners() {
        // AI Coach Actions
        document.getElementById('analyzeCurrentPage')?.addEventListener('click', () => this.analyzeCurrentPage());
        document.getElementById('requestBreak')?.addEventListener('click', () => this.requestBreakSuggestion());
        document.getElementById('focusMode')?.addEventListener('click', () => this.enterFocusMode());

        // Thought Parking
        document.getElementById('parkThought')?.addEventListener('click', () => this.parkThought());
        document.getElementById('clearThought')?.addEventListener('click', () => this.clearThoughtInput());

        // Context Management
        document.getElementById('saveContext')?.addEventListener('click', () => this.saveContext());
        document.getElementById('restoreContext')?.addEventListener('click', () => this.restoreContext());

        // AI Chat
        document.getElementById('sendChat')?.addEventListener('click', () => this.sendChatMessage());
        document.getElementById('chatInput')?.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.sendChatMessage();
        });

        // Listen for messages from background script
        chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
            this.handleBackgroundMessage(message, sender, sendResponse);
        });
    }

    updateAIStatus() {
        const statusText = document.getElementById('aiStatusText');
        const statusDot = document.querySelector('.status-dot');
        
        if (this.aiAvailable) {
            statusText.textContent = 'AI Ready';
            statusDot.style.background = '#10b981';
        } else {
            statusText.textContent = 'AI Unavailable';
            statusDot.style.background = '#ef4444';
        }
    }

    async analyzeCurrentPage() {
        try {
            // Get current tab info
            const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
            
            if (!this.aiAvailable) {
                this.showFallbackAnalysis(tab);
                return;
            }

            const analysisBtn = document.getElementById('analyzeCurrentPage');
            analysisBtn.textContent = '🔄 Analyzing...';
            analysisBtn.disabled = true;

            // Get page content from content script
            const response = await chrome.tabs.sendMessage(tab.id, { action: 'getPageContent' });
            const pageContent = response?.content || '';
            const title = tab.title || '';
            const url = tab.url || '';

            // AI analysis
            const analysisPrompt = `Analyze this webpage for ADHD-friendliness:

Title: ${title}
URL: ${url}
Content: ${pageContent.substring(0, 2000)}...

Provide:
1. Distraction level (0-100): How likely is this to distract an ADHD brain?
2. ADHD friendliness (0-100): How suitable is this content structure for ADHD users?
3. Brief suggestions for better focus on this page

Response format:
Distraction: [number]
ADHD-Friendly: [number]
Suggestions: [brief actionable tips]`;

            const analysis = await this.aiSession.prompt(analysisPrompt);
            this.displayAnalysisResult(analysis);

        } catch (error) {
            console.error('Page analysis failed:', error);
            this.showAnalysisError();
        } finally {
            const analysisBtn = document.getElementById('analyzeCurrentPage');
            analysisBtn.textContent = '📊 Analyze This Page';
            analysisBtn.disabled = false;
        }
    }

    displayAnalysisResult(analysis) {
        try {
            // Parse AI response
            const distractionMatch = analysis.match(/Distraction:\s*(\d+)/i);
            const adhdFriendlyMatch = analysis.match(/ADHD-Friendly:\s*(\d+)/i);
            const suggestionsMatch = analysis.match(/Suggestions:\s*(.+)/is);

            const distractionLevel = distractionMatch ? parseInt(distractionMatch[1]) : 50;
            const adhdFriendliness = adhdFriendlyMatch ? parseInt(adhdFriendlyMatch[1]) : 50;
            const suggestions = suggestionsMatch ? suggestionsMatch[1].trim() : 'Focus on one section at a time.';

            // Update progress bars
            document.getElementById('distractionLevel').style.width = `${distractionLevel}%`;
            document.getElementById('adhdFriendliness').style.width = `${adhdFriendliness}%`;

            // Color code based on levels
            const distractionBar = document.getElementById('distractionLevel');
            if (distractionLevel > 70) distractionBar.style.background = '#ef4444';
            else if (distractionLevel > 40) distractionBar.style.background = '#f59e0b';
            else distractionBar.style.background = '#10b981';

            const friendlinessBar = document.getElementById('adhdFriendliness');
            if (adhdFriendliness > 70) friendlinessBar.style.background = '#10b981';
            else if (adhdFriendliness > 40) friendlinessBar.style.background = '#f59e0b';
            else friendlinessBar.style.background = '#ef4444';

            // Update suggestions
            document.getElementById('contentSuggestions').textContent = suggestions;

        } catch (error) {
            console.error('Error displaying analysis:', error);
            this.showAnalysisError();
        }
    }

    showFallbackAnalysis(tab) {
        // Simple rule-based analysis when AI is not available
        const url = tab.url.toLowerCase();
        const title = tab.title.toLowerCase();
        
        let distractionLevel = 30;
        let adhdFriendliness = 70;
        let suggestions = 'Use reading mode or focus tools for better concentration.';

        // High distraction sites
        if (url.includes('youtube') || url.includes('tiktok') || url.includes('instagram') || 
            url.includes('twitter') || url.includes('reddit') || url.includes('facebook')) {
            distractionLevel = 90;
            adhdFriendliness = 20;
            suggestions = 'High distraction site detected. Consider using focus mode or time limits.';
        }
        // Work/productivity sites
        else if (url.includes('docs.google') || url.includes('notion') || url.includes('trello') ||
                 url.includes('github') || url.includes('stackoverflow')) {
            distractionLevel = 20;
            adhdFriendliness = 80;
            suggestions = 'Good for focused work. Break large tasks into smaller chunks.';
        }
        // News/reading sites
        else if (url.includes('news') || url.includes('article') || title.includes('blog')) {
            distractionLevel = 50;
            adhdFriendliness = 60;
            suggestions = 'Reading content detected. Use reader mode and take breaks every 10-15 minutes.';
        }

        this.displayManualAnalysis(distractionLevel, adhdFriendliness, suggestions);
    }

    displayManualAnalysis(distractionLevel, adhdFriendliness, suggestions) {
        document.getElementById('distractionLevel').style.width = `${distractionLevel}%`;
        document.getElementById('adhdFriendliness').style.width = `${adhdFriendliness}%`;
        document.getElementById('contentSuggestions').textContent = suggestions;
    }

    async requestBreakSuggestion() {
        if (!this.aiAvailable) {
            this.showGenericBreakSuggestion();
            return;
        }

        try {
            const breakPrompt = `As an ADHD coach, suggest a quick brain break activity. Consider:
            - Current time: ${new Date().toLocaleTimeString()}
            - User has been focused for a while
            - Need something refreshing but not overstimulating
            - 2-5 minute activity
            
            Provide a specific, actionable suggestion.`;

            const suggestion = await this.aiSession.prompt(breakPrompt);
            this.showCoachMessage(`🧠 Smart Break Suggestion:\n\n${suggestion}`);
        } catch (error) {
            console.error('Break suggestion failed:', error);
            this.showGenericBreakSuggestion();
        }
    }

    showGenericBreakSuggestion() {
        const suggestions = [
            "Take 5 deep breaths and stretch your arms above your head.",
            "Look at something 20 feet away for 20 seconds (20-20-20 rule).",
            "Do 10 jumping jacks or march in place for 30 seconds.",
            "Drink a glass of water mindfully, focusing on the temperature.",
            "Step outside or near a window and notice 3 things in nature."
        ];
        const randomSuggestion = suggestions[Math.floor(Math.random() * suggestions.length)];
        this.showCoachMessage(`🧠 Break Time:\n\n${randomSuggestion}`);
    }

    async parkThought() {
        const thoughtInput = document.getElementById('thoughtInput');
        const thought = thoughtInput.value.trim();
        
        if (!thought) return;

        if (this.aiAvailable) {
            try {
                const organizationPrompt = `Help organize this ADHD thought for parking:

"${thought}"

Provide:
1. A clear, concise summary
2. Suggested category/tag
3. Priority level (low/medium/high)
4. Quick next action if needed

Format as: Summary | Category | Priority | Action`;

                const organized = await this.aiSession.prompt(organizationPrompt);
                this.addParkedThought(thought, organized);
            } catch (error) {
                console.error('AI thought organization failed:', error);
                this.addParkedThought(thought, null);
            }
        } else {
            this.addParkedThought(thought, null);
        }

        thoughtInput.value = '';
    }

    addParkedThought(originalThought, aiOrganization) {
        const timestamp = new Date().toLocaleTimeString();
        const thoughtItem = {
            id: Date.now(),
            original: originalThought,
            organized: aiOrganization,
            timestamp: timestamp
        };

        this.parkedThoughts.unshift(thoughtItem);
        this.saveParkedThoughts();
        this.displayParkedThoughts();
        
        // Show confirmation
        this.showCoachMessage(`✅ Thought parked successfully! You can focus on your current task now.`);
    }

    loadParkedThoughts() {
        chrome.storage.local.get(['parkedThoughts'], (result) => {
            this.parkedThoughts = result.parkedThoughts || [];
            this.displayParkedThoughts();
        });
    }

    saveParkedThoughts() {
        chrome.storage.local.set({ parkedThoughts: this.parkedThoughts });
    }

    displayParkedThoughts() {
        const thoughtsList = document.getElementById('thoughtsList');
        thoughtsList.innerHTML = '';

        this.parkedThoughts.slice(0, 5).forEach(thought => {
            const thoughtDiv = document.createElement('div');
            thoughtDiv.className = 'thought-item';
            
            if (thought.organized) {
                thoughtDiv.innerHTML = `
                    <div style="font-weight: 500; margin-bottom: 4px;">${thought.organized}</div>
                    <div style="font-size: 0.8em; color: #64748b;">${thought.timestamp}</div>
                `;
            } else {
                thoughtDiv.innerHTML = `
                    <div>${thought.original}</div>
                    <div style="font-size: 0.8em; color: #64748b;">${thought.timestamp}</div>
                `;
            }
            
            thoughtsList.appendChild(thoughtDiv);
        });
    }

    async sendChatMessage() {
        const chatInput = document.getElementById('chatInput');
        const message = chatInput.value.trim();
        
        if (!message) return;

        this.addChatMessage(message, 'user');
        chatInput.value = '';

        if (!this.aiAvailable) {
            this.addChatMessage("AI is currently unavailable. Try enabling Chrome's built-in AI or check your settings.", 'ai');
            return;
        }

        try {
            const response = await this.aiSession.prompt(`User question: ${message}

            Respond as FlowState AI, an ADHD specialist. Provide helpful, encouraging advice specific to ADHD challenges and strengths.`);
            
            this.addChatMessage(response, 'ai');
        } catch (error) {
            console.error('Chat failed:', error);
            this.addChatMessage("I'm having trouble processing that right now. Try rephrasing your question.", 'ai');
        }
    }

    addChatMessage(message, sender) {
        const chatMessages = document.getElementById('chatMessages');
        const messageDiv = document.createElement('div');
        messageDiv.className = `chat-message ${sender}`;
        messageDiv.textContent = message;
        
        chatMessages.appendChild(messageDiv);
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    showCoachMessage(message) {
        const coachMessage = document.getElementById('coachMessage');
        coachMessage.innerHTML = `<p>${message}</p>`;
    }

    showAIDownloadPrompt() {
        this.showCoachMessage("🤖 Chrome's AI model needs to be downloaded for full functionality. Please visit chrome://flags and enable 'Prompt API for Gemini Nano', then restart Chrome.");
    }

    showAIUnavailableMessage() {
        this.showCoachMessage("💡 Running in compatibility mode. Some AI features are limited. For full functionality, ensure you're using Chrome 138+ with AI features enabled.");
    }

    showAnalysisError() {
        document.getElementById('contentSuggestions').textContent = 'Analysis temporarily unavailable. Focus on one task at a time for better ADHD management.';
    }

    clearThoughtInput() {
        document.getElementById('thoughtInput').value = '';
    }

    async enterFocusMode() {
        // Send message to background script to enable focus mode
        chrome.runtime.sendMessage({ action: 'enterFocusMode' });
        this.showCoachMessage("🎯 Focus mode activated! Distracting sites will be blocked, and you'll get gentle reminders to stay on track.");
    }

    async saveContext() {
        try {
            const tabs = await chrome.tabs.query({ currentWindow: true });
            const context = {
                tabs: tabs.map(tab => ({ url: tab.url, title: tab.title })),
                timestamp: new Date().toLocaleString(),
                activeTabIndex: tabs.findIndex(tab => tab.active)
            };

            // Save to storage
            const contexts = await chrome.storage.local.get(['savedContexts']);
            const savedContexts = contexts.savedContexts || [];
            savedContexts.unshift(context);
            
            // Keep only last 5 contexts
            if (savedContexts.length > 5) savedContexts.splice(5);
            
            await chrome.storage.local.set({ savedContexts });
            
            this.showCoachMessage(`💾 Context saved! ${tabs.length} tabs captured for easy restoration later.`);
            this.displaySavedContexts();
        } catch (error) {
            console.error('Context save failed:', error);
            this.showCoachMessage("❌ Failed to save context. Please try again.");
        }
    }

    async restoreContext() {
        try {
            const result = await chrome.storage.local.get(['savedContexts']);
            const savedContexts = result.savedContexts || [];
            
            if (savedContexts.length === 0) {
                this.showCoachMessage("📂 No saved contexts found. Save your current browser state first!");
                return;
            }

            const latestContext = savedContexts[0];
            
            // Open tabs from the saved context
            for (const tab of latestContext.tabs) {
                chrome.tabs.create({ url: tab.url, active: false });
            }
            
            this.showCoachMessage(`🔄 Context restored! Opened ${latestContext.tabs.length} tabs from ${latestContext.timestamp}.`);
        } catch (error) {
            console.error('Context restore failed:', error);
            this.showCoachMessage("❌ Failed to restore context. Please try again.");
        }
    }

    async displaySavedContexts() {
        const result = await chrome.storage.local.get(['savedContexts']);
        const savedContexts = result.savedContexts || [];
        const contextsContainer = document.getElementById('savedContexts');
        
        contextsContainer.innerHTML = '';
        
        savedContexts.forEach((context, index) => {
            const contextDiv = document.createElement('div');
            contextDiv.className = 'context-item';
            contextDiv.innerHTML = `
                <div style="font-weight: 500;">${context.tabs.length} tabs - ${context.timestamp}</div>
                <div style="font-size: 0.8em; color: #64748b;">${context.tabs.slice(0, 2).map(tab => tab.title.substring(0, 30)).join(', ')}...</div>
            `;
            contextDiv.addEventListener('click', () => this.restoreSpecificContext(context));
            contextsContainer.appendChild(contextDiv);
        });
    }

    async restoreSpecificContext(context) {
        for (const tab of context.tabs) {
            chrome.tabs.create({ url: tab.url, active: false });
        }
        this.showCoachMessage(`🔄 Restored context with ${context.tabs.length} tabs from ${context.timestamp}.`);
    }

    startPeriodicAnalysis() {
        // Update focus insights every 30 seconds
        setInterval(() => {
            this.updateFocusInsights();
        }, 30000);

        // Initial update
        this.updateFocusInsights();
    }

    updateFocusInsights() {
        // Mock focus data for now - in a real implementation, this would come from background script
        this.focusData.score = Math.floor(Math.random() * 100);
        this.focusData.hyperfocusRisk = Math.floor(Math.random() * 100);
        this.focusData.energyLevel = Math.floor(Math.random() * 100);

        document.getElementById('focusScore').textContent = this.focusData.score;
        document.getElementById('hyperfocusRisk').textContent = this.focusData.hyperfocusRisk + '%';
        document.getElementById('energyLevel').textContent = this.focusData.energyLevel + '%';

        // Generate AI recommendations based on focus data
        if (this.aiAvailable) {
            this.generateRecommendations();
        }
    }

    async generateRecommendations() {
        try {
            const recommendationsPrompt = `Based on these ADHD focus metrics, provide 2-3 brief recommendations:
            
            Focus Score: ${this.focusData.score}/100
            Hyperfocus Risk: ${this.focusData.hyperfocusRisk}%
            Energy Level: ${this.focusData.energyLevel}%
            
            Provide practical, encouraging suggestions for optimal ADHD productivity.`;

            const recommendations = await this.aiSession.prompt(recommendationsPrompt);
            this.displayRecommendations(recommendations);
        } catch (error) {
            console.error('Recommendations generation failed:', error);
        }
    }

    displayRecommendations(recommendations) {
        const recommendationsList = document.getElementById('recommendationsList');
        recommendationsList.innerHTML = '';

        // Split recommendations into individual items
        const items = recommendations.split('\n').filter(item => item.trim().length > 0);
        
        items.slice(0, 3).forEach(item => {
            const recommendationDiv = document.createElement('div');
            recommendationDiv.className = 'recommendation-item';
            recommendationDiv.textContent = item.replace(/^\d+\.\s*/, '').trim();
            recommendationsList.appendChild(recommendationDiv);
        });
    }

    handleBackgroundMessage(message, sender, sendResponse) {
        switch (message.action) {
            case 'updateFocusData':
                this.focusData = { ...this.focusData, ...message.data };
                this.updateFocusInsights();
                break;
            case 'hyperfocusAlert':
                this.showCoachMessage("⚠️ Hyperfocus detected! Time for a quick brain break to maintain your amazing productivity.");
                break;
            case 'thoughtParkingShortcut':
                document.getElementById('thoughtInput').focus();
                break;
        }
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new FlowStateAIPanel();
});