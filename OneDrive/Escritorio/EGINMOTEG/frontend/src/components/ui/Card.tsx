import { type ReactNode } from 'react';
import { cn } from '@/lib/utils';

export interface CardProps {
  children: ReactNode;
  header?: ReactNode;
  footer?: ReactNode;
  padding?: 'none' | 'sm' | 'md' | 'lg';
  className?: string;
}

const paddingStyles = {
  none: '',
  sm: 'p-3',
  md: 'p-5',
  lg: 'p-8',
} as const;

export default function Card({
  children,
  header,
  footer,
  padding = 'md',
  className,
}: CardProps) {
  return (
    <div
      className={cn(
        'overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm',
        className
      )}
    >
      {header && (
        <div className="border-b border-gray-200 px-5 py-4">{header}</div>
      )}
      <div className={paddingStyles[padding]}>{children}</div>
      {footer && (
        <div className="border-t border-gray-200 px-5 py-4">{footer}</div>
      )}
    </div>
  );
}
