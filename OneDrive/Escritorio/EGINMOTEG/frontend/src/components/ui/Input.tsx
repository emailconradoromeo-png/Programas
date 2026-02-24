'use client';

import { forwardRef, type InputHTMLAttributes, type TextareaHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

interface BaseInputProps {
  label?: string;
  error?: string;
  helperText?: string;
}

export interface InputProps
  extends BaseInputProps,
    InputHTMLAttributes<HTMLInputElement> {
  multiline?: false;
}

export interface TextareaProps
  extends BaseInputProps,
    TextareaHTMLAttributes<HTMLTextAreaElement> {
  multiline: true;
}

type CombinedProps = InputProps | TextareaProps;

const Input = forwardRef<HTMLInputElement | HTMLTextAreaElement, CombinedProps>(
  (props, ref) => {
    const { label, error, helperText, className, multiline, ...rest } = props;
    const inputId = rest.id || rest.name;

    const baseStyles = cn(
      'block w-full rounded-md border px-3 py-2 text-sm shadow-sm transition-colors placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-offset-0',
      error
        ? 'border-red-300 text-red-900 focus:border-red-500 focus:ring-red-500'
        : 'border-gray-300 text-gray-900 focus:border-blue-500 focus:ring-blue-500',
      rest.disabled && 'cursor-not-allowed bg-gray-50 text-gray-500',
      className
    );

    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={inputId}
            className="mb-1 block text-sm font-medium text-gray-700"
          >
            {label}
          </label>
        )}
        {multiline ? (
          <textarea
            ref={ref as React.Ref<HTMLTextAreaElement>}
            id={inputId}
            className={cn(baseStyles, 'min-h-[80px] resize-y')}
            {...(rest as TextareaHTMLAttributes<HTMLTextAreaElement>)}
          />
        ) : (
          <input
            ref={ref as React.Ref<HTMLInputElement>}
            id={inputId}
            className={baseStyles}
            {...(rest as InputHTMLAttributes<HTMLInputElement>)}
          />
        )}
        {error && (
          <p className="mt-1 text-sm text-red-600">{error}</p>
        )}
        {helperText && !error && (
          <p className="mt-1 text-sm text-gray-500">{helperText}</p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';

export default Input;
