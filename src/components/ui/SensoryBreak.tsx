import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useGameStore } from '@/stores/gameStore';

interface SensoryBreakProps {
  triggerType?: 'overstimulation' | 'understimulation' | 'transition' | 'manual';
  onComplete?: () => void;
}

const SENSORY_BREAKS = {
  overstimulation: [
    {
      id: 'deep_breathing',
      name: '4-7-8 Breathing',
      description: 'Calm your nervous system',
      duration: '2 min',
      icon: '🫁',
      instructions: 'Breathe in for 4, hold for 7, out for 8. Repeat 4 times.',
      benefits: ['Reduces stress', 'Calms mind', 'Grounds you']
    },
    {
      id: 'dark_room',
      name: 'Dim Light Break',
      description: 'Rest your visual system',
      duration: '3 min',
      icon: '🌙',
      instructions: 'Dim your screen and room lights. Close eyes or look at something dark.',
      benefits: ['Reduces eye strain', 'Calms nervous system', 'Resets focus']
    },
    {
      id: 'noise_reduction',
      name: 'Quiet Time',
      description: 'Reduce auditory input',
      duration: '5 min',
      icon: '🔇',
      instructions: 'Use noise-cancelling headphones or find a quiet space.',
      benefits: ['Reduces overwhelm', 'Improves concentration', 'Restores energy']
    }
  ],
  understimulation: [
    {
      id: 'movement_break',
      name: 'Quick Movement',
      description: 'Get your body moving',
      duration: '3 min',
      icon: '🏃‍♀️',
      instructions: 'Do jumping jacks, stretch, or walk around for 3 minutes.',
      benefits: ['Increases alertness', 'Boosts dopamine', 'Improves focus']
    },
    {
      id: 'fidget_time',
      name: 'Fidget Break',
      description: 'Engage your hands',
      duration: '2 min',
      icon: '✋',
      instructions: 'Use a fidget toy, squeeze a stress ball, or doodle.',
      benefits: ['Increases focus', 'Calms anxiety', 'Provides stimulation']
    },
    {
      id: 'cold_water',
      name: 'Cold Sensation',
      description: 'Activate your system',
      duration: '1 min',
      icon: '❄️',
      instructions: 'Splash cold water on face/wrists or hold an ice cube.',
      benefits: ['Increases alertness', 'Grounds you', 'Quick energy boost']
    }
  ],
  transition: [
    {
      id: 'brain_dump',
      name: 'Quick Brain Dump',
      description: 'Clear your mental clutter',
      duration: '3 min',
      icon: '🧠',
      instructions: 'Write down everything on your mind for 3 minutes. Don\'t edit.',
      benefits: ['Clears mental space', 'Reduces anxiety', 'Improves focus']
    },
    {
      id: 'grounding_54321',
      name: '5-4-3-2-1 Grounding',
      description: 'Connect with your environment',
      duration: '2 min',
      icon: '🌍',
      instructions: 'Name 5 things you see, 4 you hear, 3 you touch, 2 you smell, 1 you taste.',
      benefits: ['Grounds you', 'Reduces anxiety', 'Improves awareness']
    }
  ]
};

export const SensoryBreak: React.FC<SensoryBreakProps> = ({ 
  triggerType = 'manual',
  onComplete 
}) => {
  const [selectedBreak, setSelectedBreak] = useState<any>(null);
  const [isActive, setIsActive] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(0);
  const { awardXP, updateStats } = useGameStore();

  const breaks = SENSORY_BREAKS[triggerType as keyof typeof SENSORY_BREAKS] || SENSORY_BREAKS.overstimulation;

  const startBreak = (breakItem: any) => {
    setSelectedBreak(breakItem);
    setIsActive(true);
    const duration = parseInt(breakItem.duration) * 60; // Convert minutes to seconds
    setTimeRemaining(duration);

    // Start timer
    const timer = setInterval(() => {
      setTimeRemaining(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          completeBreak();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const completeBreak = () => {
    setIsActive(false);
    setSelectedBreak(null);
    
    // Award XP for self-care
    awardXP(5, 'Sensory break completed! 🌟');
    
    // Update stats
    updateStats({
      sensoryBreaksTaken: (prev: number) => prev + 1,
      lastSensoryBreak: Date.now()
    });

    onComplete?.();
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (isActive && selectedBreak) {
    return (
      <motion.div
        className="fixed inset-0 bg-gradient-to-br from-purple-900/90 to-blue-900/90 backdrop-blur-sm z-50 flex items-center justify-center p-4"
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
          <div className="text-6xl mb-4">{selectedBreak.icon}</div>
          <h3 className="text-2xl font-bold text-gray-800 mb-2">{selectedBreak.name}</h3>
          
          <div className="text-4xl font-bold text-purple-600 mb-4">
            {formatTime(timeRemaining)}
          </div>

          <div className="bg-purple-50 rounded-lg p-4 mb-6">
            <p className="text-gray-700 leading-relaxed">
              {selectedBreak.instructions}
            </p>
          </div>

          <div className="flex gap-2 justify-center">
            {selectedBreak.benefits.map((benefit: string, index: number) => (
              <span 
                key={index}
                className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded-full"
              >
                {benefit}
              </span>
            ))}
          </div>

          <motion.button
            onClick={completeBreak}
            className="mt-6 bg-purple-500 hover:bg-purple-600 text-white px-6 py-3 rounded-lg font-medium transition-colors"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            Complete Break
          </motion.button>
        </motion.div>
      </motion.div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-lg p-6">
      <div className="text-center mb-6">
        <h3 className="text-xl font-bold text-gray-800 mb-2">
          🌿 Sensory Reset
        </h3>
        <p className="text-gray-600 text-sm">
          Take a quick break to regulate your nervous system
        </p>
      </div>

      <div className="space-y-3">
        {breaks.map((breakItem) => (
          <motion.button
            key={breakItem.id}
            onClick={() => startBreak(breakItem)}
            className="w-full p-4 bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg border border-purple-100 hover:border-purple-300 transition-all text-left"
            whileHover={{ scale: 1.02, translateY: -2 }}
            whileTap={{ scale: 0.98 }}
          >
            <div className="flex items-start gap-3">
              <span className="text-2xl">{breakItem.icon}</span>
              <div className="flex-1">
                <div className="flex justify-between items-start mb-1">
                  <h4 className="font-semibold text-gray-800">{breakItem.name}</h4>
                  <span className="text-xs bg-purple-200 text-purple-700 px-2 py-1 rounded-full">
                    {breakItem.duration}
                  </span>
                </div>
                <p className="text-sm text-gray-600 mb-2">{breakItem.description}</p>
                <div className="flex gap-1 flex-wrap">
                  {breakItem.benefits.slice(0, 2).map((benefit: string, index: number) => (
                    <span 
                      key={index}
                      className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full"
                    >
                      {benefit}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </motion.button>
        ))}
      </div>
    </div>
  );
};