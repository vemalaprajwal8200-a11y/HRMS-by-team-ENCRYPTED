'use client';

import React, { useRef, useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, PartyPopper } from 'lucide-react';

interface DodgeButtonProps {
  className?: string;
  triggerDistance?: number; // Distance in pixels before button dodges
}

const DODGE_TAUNTS = [
  'Too slow! 💨',
  'Almost! 🎯',
  'Nice try! 😉',
  'Nope! 🏃‍♂️',
  'Missed me! ⚡',
  'Not today! 🚀',
  '404: Click Not Found 🤖',
];

export function DodgeButton({
  className = '',
  triggerDistance = 85,
}: DodgeButtonProps) {
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [position, setPosition] = useState({ x: 0, y: 0, rotate: 0, scale: 1 });
  const [labelIndex, setLabelIndex] = useState(-1);
  const [isCaught, setIsCaught] = useState(false);
  const [isPointerFine, setIsPointerFine] = useState(false);
  const [dodgeCount, setDodgeCount] = useState(0);

  // Check if device supports fine pointer (mouse / trackpad)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const media = window.matchMedia('(pointer: fine)');
      setIsPointerFine(media.matches);

      const handler = (e: MediaQueryListEvent) => setIsPointerFine(e.matches);
      media.addEventListener('change', handler);
      return () => media.removeEventListener('change', handler);
    }
  }, []);

  // Dodge calculation when cursor gets too close
  const handleGlobalMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!isPointerFine || isCaught || !buttonRef.current) return;

      const rect = buttonRef.current.getBoundingClientRect();
      const btnCenterX = rect.left + rect.width / 2;
      const btnCenterY = rect.top + rect.height / 2;

      const deltaX = e.clientX - btnCenterX;
      const deltaY = e.clientY - btnCenterY;
      const distance = Math.hypot(deltaX, deltaY);

      if (distance < triggerDistance) {
        // Calculate dodge direction away from the approaching cursor
        const angle = Math.atan2(deltaY, deltaX);
        // Push in the opposite direction plus random angle variation
        const randomSpread = (Math.random() - 0.5) * 1.2;
        const pushAngle = angle + Math.PI + randomSpread;
        const pushDist = 60 + Math.random() * 50;

        let newX = position.x + Math.cos(pushAngle) * pushDist;
        let newY = position.y + Math.sin(pushAngle) * pushDist;

        // Keep strictly within safe boundaries so it doesn't fly off or overlap forms
        const MAX_X = 130;
        const MIN_X = -130;
        const MAX_Y = 28;
        const MIN_Y = -28;

        if (newX > MAX_X) newX = MIN_X + Math.random() * 40;
        if (newX < MIN_X) newX = MAX_X - Math.random() * 40;
        if (newY > MAX_Y) newY = MIN_Y + Math.random() * 15;
        if (newY < MIN_Y) newY = MAX_Y - Math.random() * 15;

        const randomRotate = (Math.random() - 0.5) * 18;

        setPosition({
          x: newX,
          y: newY,
          rotate: randomRotate,
          scale: 1.05,
        });

        setDodgeCount((prev) => prev + 1);
        setLabelIndex((prev) => (prev + 1) % DODGE_TAUNTS.length);
      }
    },
    [isPointerFine, isCaught, position.x, position.y, triggerDistance]
  );

  useEffect(() => {
    if (!isPointerFine) return;

    window.addEventListener('mousemove', handleGlobalMouseMove);
    return () => window.removeEventListener('mousemove', handleGlobalMouseMove);
  }, [isPointerFine, handleGlobalMouseMove]);

  const handleCatch = () => {
    setIsCaught(true);
    setTimeout(() => {
      setIsCaught(false);
      setPosition({ x: 0, y: 0, rotate: 0, scale: 1 });
      setLabelIndex(-1);
    }, 2800);
  };

  // On touch/mobile, render hidden so it doesn't clutter small screens
  if (!isPointerFine) {
    return null;
  }

  const currentLabel = isCaught
    ? '🎉 You caught it! +1000 XP'
    : labelIndex === -1
    ? 'Secret HR Perk ✨'
    : DODGE_TAUNTS[labelIndex];

  return (
    <div className="relative inline-flex items-center justify-center p-2 select-none">
      <motion.button
        ref={buttonRef}
        type="button"
        tabIndex={-1}
        aria-hidden="true"
        onClick={handleCatch}
        animate={{
          x: position.x,
          y: position.y,
          rotate: position.rotate,
          scale: isCaught ? 1.1 : 1,
        }}
        transition={{
          type: 'spring',
          stiffness: 380,
          damping: 24,
          mass: 0.5,
        }}
        whileHover={{ scale: 1.08 }}
        whileTap={{ scale: 0.95 }}
        className={`group relative inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold backdrop-blur-md transition-colors cursor-pointer ${
          isCaught
            ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-lg shadow-emerald-500/25 ring-2 ring-emerald-300'
            : 'bg-white/70 hover:bg-white/90 text-slate-600 hover:text-brand-700 border border-white/80 shadow-sm shadow-indigo-500/10 ring-1 ring-black/[0.04]'
        } ${className}`}
      >
        <AnimatePresence mode="wait">
          <motion.span
            key={currentLabel}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.15 }}
            className="inline-flex items-center gap-1.5 tracking-tight whitespace-nowrap"
          >
            {isCaught ? (
              <PartyPopper className="w-3.5 h-3.5 text-yellow-200 animate-bounce" />
            ) : (
              <Sparkles className="w-3 h-3 text-brand-500 group-hover:rotate-12 transition-transform" />
            )}
            <span>{currentLabel}</span>
          </motion.span>
        </AnimatePresence>

        {dodgeCount > 0 && !isCaught && (
          <span className="ml-0.5 px-1.5 py-0.2 rounded-full bg-brand-100 text-brand-700 font-mono text-[10px] font-bold">
            {dodgeCount}
          </span>
        )}
      </motion.button>
    </div>
  );
}
