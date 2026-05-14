import React from 'react';
import { cn } from '../../lib/utils';
import { motion } from 'motion/react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  animate?: boolean;
}

export function Card({ children, className, animate = true }: CardProps) {
  const Component = animate ? motion.div : 'div';
  
  return (
    <Component
      initial={animate ? { opacity: 0, y: 10 } : undefined}
      animate={animate ? { opacity: 1, y: 0 } : undefined}
      className={cn(
        'bg-white border border-neutral-100/50 shadow-[0_1px_3px_rgba(0,0,0,0.02)] rounded-sm overflow-hidden',
        className
      )}
    >
      {children}
    </Component>
  );
}
