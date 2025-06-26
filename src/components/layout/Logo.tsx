import React from 'react';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg';
}

const sizes = {
  sm: {
    container: 'h-8',
    logo: 'h-8 w-auto',
  },
  md: {
    container: 'h-12',
    logo: 'h-12 w-auto',
  },
  lg: {
    container: 'h-16',
    logo: 'h-16 w-auto',
  },
};

export function Logo({ size = 'md' }: LogoProps) {
  const { container, logo } = sizes[size];

  return (
    <div className={container}>
      <img 
        src="/budg-ai-logo.png" 
        alt="budg.AI Logo" 
        className={`${logo} object-contain`}
      />
    </div>
  );
}