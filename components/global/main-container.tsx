import React from 'react';
import { cn } from '@/lib/utils';

interface MainContainerProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl' | '5xl' | '6xl' | '7xl';
}

export function MainContainer({ 
  children, 
  className,
  maxWidth = '5xl',
  ...props 
}: MainContainerProps) {
  const maxWidthClasses = {
    sm: 'max-w-[30rem]', // ~480px (scaled from 384px)
    md: 'max-w-[35rem]', // ~560px (scaled from 448px)
    lg: 'max-w-[40rem]', // ~640px (scaled from 512px)
    xl: 'max-w-[45rem]', // ~720px (scaled from 576px)
    '2xl': 'max-w-[53rem]', // ~848px (scaled from 672px)
    '3xl': 'max-w-[60rem]', // ~960px (scaled from 768px)
    '4xl': 'max-w-[70rem]', // ~1120px (scaled from 896px)
    '5xl': 'max-w-5xl', // ~1024px (default)
    '6xl': 'max-w-[72rem]', // ~1152px (scaled from 1152px)
    '7xl': 'max-w-[80rem]', // ~1280px (scaled from 1280px)
  };

  return (
    <div 
      className={cn(
        'container mx-auto px-4 sm:px-6 lg:px-8',
        maxWidthClasses[maxWidth],
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}