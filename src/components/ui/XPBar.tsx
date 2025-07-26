import React from 'react';
import { motion } from 'framer-motion';
import { useGameStore } from '@/stores/gameStore';

interface XPBarProps {
  showLevel?: boolean;
  size?: 'sm' | 'md' | 'lg';
  animated?: boolean;
}

export const XPBar: React.FC<XPBarProps> = ({ 
  showLevel = true, 
  size = 'md',
  animated = true 
}) => {
  const { level, xp, xpToNextLevel, getXPProgress } = useGameStore();
  const progress = getXPProgress();

  const sizeClasses = {
    sm: 'h-2',
    md: 'h-3',
    lg: 'h-4'
  };

  const textSizeClasses = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base'
  };

  return (
    <div className="w-full">
      {showLevel && (
        <div className="flex justify-between items-center mb-2">
          <span className={`font-bold text-primary-500 ${textSizeClasses[size]}`}>
            Level {level}
          </span>
          <span className={`text-gray-400 ${textSizeClasses[size]}`}>
            {xp} / {xpToNextLevel} XP
          </span>
        </div>
      )}
      
      <div className={`w-full bg-gray-200 rounded-full overflow-hidden ${sizeClasses[size]}`}>
        <motion.div
          className="h-full bg-gradient-to-r from-primary-500 to-primary-600 rounded-full"
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ 
            duration: animated ? 0.5 : 0,
            ease: "easeOut" 
          }}
        />
      </div>
      
      {animated && (
        <motion.div
          className="text-center mt-1"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          <span className={`text-primary-600 font-medium ${textSizeClasses[size]}`}>
            {progress.toFixed(1)}% to next level
          </span>
        </motion.div>
      )}
    </div>
  );
};