'use client';

import React, { useRef, useState, useEffect } from 'react';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';

interface TiltCardProps {
  children: React.ReactNode;
  className?: string;
  maxTilt?: number; // degrees, default 7
}

export function TiltCard({ children, className = '', maxTilt = 7 }: TiltCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [isPointerFine, setIsPointerFine] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  // Raw mouse coordinates relative to card center (-0.5 to 0.5)
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  // Spring physics for buttery smooth motion without instant snapping
  const springConfig = { stiffness: 150, damping: 15, mass: 0.8 };
  const smoothMouseX = useSpring(mouseX, springConfig);
  const smoothMouseY = useSpring(mouseY, springConfig);

  // 3D rotation transforms
  // Moving mouse up (negative Y) tilts top forward (positive rotateX)
  // Moving mouse right (positive X) tilts right side toward user (positive rotateY)
  const rotateX = useTransform(smoothMouseY, [-0.5, 0.5], [maxTilt, -maxTilt]);
  const rotateY = useTransform(smoothMouseX, [-0.5, 0.5], [-maxTilt, maxTilt]);

  // Glare effect coordinates
  const glareX = useTransform(smoothMouseX, [-0.5, 0.5], ['-20%', '20%']);
  const glareY = useTransform(smoothMouseY, [-0.5, 0.5], ['-20%', '20%']);

  useEffect(() => {
    // Only enable tilt on devices with a fine pointer (mouse / trackpad)
    if (typeof window !== 'undefined') {
      const media = window.matchMedia('(pointer: fine)');
      setIsPointerFine(media.matches);

      const handler = (e: MediaQueryListEvent) => setIsPointerFine(e.matches);
      media.addEventListener('change', handler);
      return () => media.removeEventListener('change', handler);
    }
  }, []);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isPointerFine || !cardRef.current) return;

    const rect = cardRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;

    mouseX.set(x);
    mouseY.set(y);
  };

  const handleMouseEnter = () => {
    if (!isPointerFine) return;
    setIsHovered(true);
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    mouseX.set(0);
    mouseY.set(0);
  };

  return (
    <div
      style={{ perspective: 1200 }}
      className="w-full flex justify-center"
    >
      <motion.div
        ref={cardRef}
        onMouseMove={handleMouseMove}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        style={{
          rotateX: isPointerFine ? rotateX : 0,
          rotateY: isPointerFine ? rotateY : 0,
          transformStyle: 'preserve-3d',
        }}
        className={`relative w-full rounded-3xl transition-shadow duration-300 ${className}`}
      >
        {/* Subtle glass glare overlay shifting with mouse */}
        {isPointerFine && (
          <motion.div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 z-30 rounded-[inherit] overflow-hidden opacity-0 transition-opacity duration-300"
            animate={{ opacity: isHovered ? 1 : 0 }}
          >
            <motion.div
              className="absolute w-[160%] h-[160%] -left-[30%] -top-[30%] rounded-full bg-gradient-to-br from-white/25 via-white/5 to-transparent blur-xl pointer-events-none"
              style={{
                x: glareX,
                y: glareY,
              }}
            />
          </motion.div>
        )}

        {/* Card Content */}
        <div className="relative z-10 w-full">
          {children}
        </div>
      </motion.div>
    </div>
  );
}
