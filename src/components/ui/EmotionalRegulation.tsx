import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useGameStore } from '@/stores/gameStore';

interface EmotionalRegulationProps {
  onMoodLogged?: (mood: any) => void;
}

const EMOTIONS = {
  overwhelmed: {
    name: 'Overwhelmed',
    color: 'bg-red-500',
    icon: '😰',
    strategies: [
      { action: 'Take 3 deep breaths', duration: '1 min' },
      { action: 'List 3 things you can control', duration: '2 min' },
      { action: 'Break task into smaller steps', duration: '3 min' }
    ]
  },
  frustrated: {
    name: 'Frustrated',
    color: 'bg-orange-500',
    icon: '😤',
    strategies: [
      { action: 'Physical movement (walk/stretch)', duration: '5 min' },
      { action: 'Write down what\'s bothering you', duration: '3 min' },
      { action: 'Try a different approach', duration: '2 min' }
    ]
  },
  anxious: {
    name: 'Anxious',
    color: 'bg-yellow-500',
    icon: '😟',
    strategies: [
      { action: '4-7-8 breathing technique', duration: '3 min' },
      { action: 'Name 5 things you can see', duration: '2 min' },
      { action: 'Listen to calming music', duration: '5 min' }
    ]
  },
  restless: {
    name: 'Restless',
    color: 'bg-purple-500',
    icon: '😣',
    strategies: [
      { action: 'Do jumping jacks', duration: '2 min' },
      { action: 'Fidget with something', duration: 'ongoing' },
      { action: 'Change your environment', duration: '1 min' }
    ]
  },
  hyperfocused: {
    name: 'Hyperfocused',
    color: 'bg-blue-500',
    icon: '🎯',
    strategies: [
      { action: 'Set a timer for breaks', duration: '1 min' },
      { action: 'Drink water and stretch', duration: '2 min' },
      { action: 'Check in with your body', duration: '1 min' }
    ]
  },
  calm: {
    name: 'Calm',
    color: 'bg-green-500',
    icon: '😌',
    strategies: [
      { action: 'Maintain this state with music', duration: 'ongoing' },
      { action: 'Plan your next focused work', duration: '5 min' },
      { action: 'Practice gratitude', duration: '2 min' }
    ]
  },
  excited: {
    name: 'Excited',
    color: 'bg-pink-500',
    icon: '🤩',
    strategies: [
      { action: 'Channel energy into current task', duration: '10 min' },
      { action: 'Make a plan to use this energy', duration: '3 min' },
      { action: 'Share your excitement productively', duration: '2 min' }
    ]
  },
  unmotivated: {
    name: 'Unmotivated',
    color: 'bg-gray-500',
    icon: '😑',
    strategies: [
      { action: 'Start with smallest possible task', duration: '2 min' },
      { action: 'Change your physical position', duration: '1 min' },
      { action: 'Listen to energizing music', duration: '5 min' }
    ]
  }
};

const REJECTION_SENSITIVITY_CHECKS = [
  "Are you reading too much into this situation?",
  "What would you tell a friend in this situation?",
  "Is this reaction proportional to what actually happened?",
  "What evidence do you have for your interpretation?",
  "Could there be another explanation?"
];

export const EmotionalRegulation: React.FC<EmotionalRegulationProps> = ({
  onMoodLogged
}) => {
  const [selectedEmotion, setSelectedEmotion] = useState<string | null>(null);
  const [showStrategies, setShowStrategies] = useState(false);
  const [showRSDHelper, setShowRSDHelper] = useState(false);
  const [moodHistory, setMoodHistory] = useState<any[]>([]);
  const [currentStrategy, setCurrentStrategy] = useState<any>(null);
  const { awardXP, updateStats } = useGameStore();

  useEffect(() => {
    loadMoodHistory();
  }, []);

  const loadMoodHistory = async () => {
    try {
      const result = await chrome.storage.local.get(['moodHistory']);
      setMoodHistory(result.moodHistory || []);
    } catch (error) {
      console.error('Error loading mood history:', error);
    }
  };

  const logMood = async (emotionKey: string, intensity: number) => {
    const moodEntry = {
      emotion: emotionKey,
      intensity,
      timestamp: Date.now(),
      id: Date.now().toString()
    };

    const updatedHistory = [moodEntry, ...moodHistory.slice(0, 29)]; // Keep last 30
    setMoodHistory(updatedHistory);

    try {
      await chrome.storage.local.set({ moodHistory: updatedHistory });
    } catch (error) {
      console.error('Error saving mood:', error);
    }

    // Award XP for emotional awareness
    awardXP(3, 'Emotional check-in! 🧠');
    
    updateStats({
      moodCheckins: (prev: number) => prev + 1,
      lastMoodCheckin: Date.now()
    });

    onMoodLogged?.(moodEntry);
    setSelectedEmotion(emotionKey);
    setShowStrategies(true);
  };

  const useStrategy = (strategy: any) => {
    setCurrentStrategy(strategy);
    
    // Award bonus XP for using coping strategies
    awardXP(5, 'Using coping strategy! 🌟');
    
    updateStats({
      copingStrategiesUsed: (prev: number) => prev + 1
    });

    // Auto-hide after strategy duration (if not ongoing)
    if (strategy.duration !== 'ongoing') {
      const minutes = parseInt(strategy.duration) || 5;
      setTimeout(() => {
        setCurrentStrategy(null);
        setShowStrategies(false);
        setSelectedEmotion(null);
      }, minutes * 60 * 1000);
    }
  };

  const getEmotionIntensityColor = (intensity: number) => {
    if (intensity <= 2) return 'bg-green-100 text-green-800';
    if (intensity <= 4) return 'bg-yellow-100 text-yellow-800';
    if (intensity <= 6) return 'bg-orange-100 text-orange-800';
    return 'bg-red-100 text-red-800';
  };

  const getRecentEmotionTrend = () => {
    const recent = moodHistory.slice(0, 5);
    if (recent.length < 2) return null;
    
    const avgIntensity = recent.reduce((sum, entry) => sum + entry.intensity, 0) / recent.length;
    const trend = avgIntensity > 5 ? 'high' : avgIntensity > 3 ? 'medium' : 'low';
    
    return { trend, avgIntensity: avgIntensity.toFixed(1) };
  };

  const emotionTrend = getRecentEmotionTrend();

  if (currentStrategy) {
    return (
      <motion.div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <motion.div
          className="bg-white rounded-2xl p-8 max-w-md w-full text-center shadow-2xl"
          initial={{ scale: 0.9, y: 20 }}
          animate={{ scale: 1, y: 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
        >
          <div className="text-6xl mb-4">🧘‍♀️</div>
          <h3 className="text-2xl font-bold text-gray-800 mb-2">Coping Strategy</h3>
          
          <div className="bg-blue-50 rounded-lg p-4 mb-6">
            <p className="text-lg text-gray-700 font-medium mb-2">
              {currentStrategy.action}
            </p>
            <p className="text-sm text-gray-600">
              Duration: {currentStrategy.duration}
            </p>
          </div>

          <div className="space-y-3">
            <motion.button
              onClick={() => {
                setCurrentStrategy(null);
                setShowStrategies(false);
                setSelectedEmotion(null);
              }}
              className="w-full bg-green-500 hover:bg-green-600 text-white px-6 py-3 rounded-lg font-medium transition-colors"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              ✅ Completed
            </motion.button>
            
            <button
              onClick={() => setCurrentStrategy(null)}
              className="w-full bg-gray-200 hover:bg-gray-300 text-gray-700 px-6 py-3 rounded-lg font-medium transition-colors"
            >
              Back to Strategies
            </button>
          </div>
        </motion.div>
      </motion.div>
    );
  }

  if (showStrategies && selectedEmotion) {
    const emotion = EMOTIONS[selectedEmotion as keyof typeof EMOTIONS];
    
    return (
      <motion.div
        className="bg-white rounded-xl shadow-lg p-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="text-center mb-6">
          <div className="text-4xl mb-2">{emotion.icon}</div>
          <h3 className="text-xl font-bold text-gray-800 mb-2">
            Feeling {emotion.name}
          </h3>
          <p className="text-gray-600 text-sm">
            Here are some strategies that might help:
          </p>
        </div>

        <div className="space-y-3 mb-6">
          {emotion.strategies.map((strategy, index) => (
            <motion.button
              key={index}
              onClick={() => useStrategy(strategy)}
              className="w-full p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border border-blue-100 hover:border-blue-300 transition-all text-left"
              whileHover={{ scale: 1.02, translateY: -2 }}
              whileTap={{ scale: 0.98 }}
            >
              <div className="flex justify-between items-center">
                <span className="font-medium text-gray-800">{strategy.action}</span>
                <span className="text-xs bg-blue-200 text-blue-700 px-2 py-1 rounded-full">
                  {strategy.duration}
                </span>
              </div>
            </motion.button>
          ))}
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => setShowRSDHelper(true)}
            className="flex-1 py-2 px-3 bg-yellow-100 hover:bg-yellow-200 text-yellow-700 rounded-lg text-sm font-medium transition-colors"
          >
            🛡️ RSD Helper
          </button>
          <button
            onClick={() => {
              setShowStrategies(false);
              setSelectedEmotion(null);
            }}
            className="flex-1 py-2 px-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm font-medium transition-colors"
          >
            Close
          </button>
        </div>
      </motion.div>
    );
  }

  if (showRSDHelper) {
    return (
      <motion.div
        className="bg-white rounded-xl shadow-lg p-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="text-center mb-6">
          <div className="text-4xl mb-2">🛡️</div>
          <h3 className="text-xl font-bold text-gray-800 mb-2">
            RSD Reality Check
          </h3>
          <p className="text-gray-600 text-sm">
            Rejection Sensitive Dysphoria can make situations feel worse than they are
          </p>
        </div>

        <div className="space-y-4 mb-6">
          {REJECTION_SENSITIVITY_CHECKS.map((question, index) => (
            <div key={index} className="p-3 bg-yellow-50 rounded-lg border-l-4 border-yellow-400">
              <p className="text-gray-700 text-sm">{question}</p>
            </div>
          ))}
        </div>

        <button
          onClick={() => setShowRSDHelper(false)}
          className="w-full bg-yellow-500 hover:bg-yellow-600 text-white px-6 py-3 rounded-lg font-medium transition-colors"
        >
          Back to Strategies
        </button>
      </motion.div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-lg p-6">
      <div className="text-center mb-6">
        <h3 className="text-xl font-bold text-gray-800 mb-2">
          💝 Emotional Check-in
        </h3>
        <p className="text-gray-600 text-sm">
          How are you feeling right now?
        </p>
        
        {emotionTrend && (
          <div className={`inline-block mt-2 px-3 py-1 rounded-full text-xs font-medium ${getEmotionIntensityColor(parseFloat(emotionTrend.avgIntensity))}`}>
            Recent trend: {emotionTrend.trend} intensity ({emotionTrend.avgIntensity}/10)
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3 mb-6">
        {Object.entries(EMOTIONS).map(([key, emotion]) => (
          <motion.button
            key={key}
            onClick={() => logMood(key, 5)} // Default intensity
            className="p-3 bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg border border-gray-200 hover:border-gray-300 transition-all text-center"
            whileHover={{ scale: 1.05, translateY: -2 }}
            whileTap={{ scale: 0.95 }}
          >
            <div className="text-2xl mb-1">{emotion.icon}</div>
            <div className="text-xs font-medium text-gray-700">{emotion.name}</div>
          </motion.button>
        ))}
      </div>

      {moodHistory.length > 0 && (
        <div className="border-t pt-4">
          <h4 className="text-sm font-semibold text-gray-700 mb-2">Recent Check-ins</h4>
          <div className="flex gap-2 flex-wrap">
            {moodHistory.slice(0, 5).map((entry) => {
              const emotion = EMOTIONS[entry.emotion as keyof typeof EMOTIONS];
              return (
                <div
                  key={entry.id}
                  className="flex items-center gap-1 text-xs bg-gray-100 rounded-full px-2 py-1"
                >
                  <span>{emotion.icon}</span>
                  <span className="text-gray-600">
                    {new Date(entry.timestamp).toLocaleDateString()}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};