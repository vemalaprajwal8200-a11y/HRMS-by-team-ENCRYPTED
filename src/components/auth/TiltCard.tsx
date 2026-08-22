'use client';

import React from 'react';

interface TiltCardProps {
  children: React.ReactNode;
  className?: string;
  disableTilt?: boolean;
}

export function TiltCard({ children, className = '' }: TiltCardProps) {
  return (
    <div className={`w-full flex justify-center ${className}`}>
      <div className="relative w-full rounded-3xl">
        {children}
      </div>
    </div>
  );
}
