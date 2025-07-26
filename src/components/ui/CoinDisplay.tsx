import React from 'react';
import { motion } from 'framer-motion';
import { useGameStore } from '@/stores/gameStore';

interface CoinDisplayProps {
  size?: 'sm' | 'md' | 'lg';
  showIcon?: boolean;
  animated?: boolean;
}

export const CoinDisplay: React.FC<CoinDisplayProps> = ({ 
  size = 'md',
  showIcon = true,
  animated = true 
}) => {
  const { dopamineCoins } = useGameStore();

  const sizeClasses = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg'
  };

  const iconSizeClasses = {
    sm: 'text-base',
    md: 'text-lg',
    lg: 'text-xl'
  };

  return (
    <motion.div
      className="flex items-center gap-2"
      animate={animated ? { scale: [1, 1.1, 1] } : {}}
      transition={{ duration: 0.3 }}
    >
      {showIcon && (
        <span className={`${iconSizeClasses[size]}`}>🪙</span>
      )}
      <motion.span
        className={`font-bold text-dopamine-400 ${sizeClasses[size]}`}
        key={dopamineCoins}
        initial={animated ? { scale: 1.2, color: '#ffd700' } : {}}
        animate={animated ? { scale: 1, color: '#ffed4e' } : {}}
        transition={{ duration: 0.2 }}
      >
        {dopamineCoins.toLocaleString()}
      </motion.span>
    </motion.div>
  );
};