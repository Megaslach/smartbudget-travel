'use client';

import { InputHTMLAttributes, forwardRef } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  error?: string;
}

const Input = forwardRef<HTMLInputElement, InputProps>(({ error, className = '', ...props }, ref) => {
  return (
    <input
      ref={ref}
      className={`
        w-full px-4 py-3 rounded-xl border bg-white text-gray-900
        placeholder:text-gray-400 transition-all duration-200
        focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent
        ${error ? 'border-red-400 focus:ring-red-500' : 'border-gray-200 hover:border-gray-300'}
        ${className}
      `}
      {...props}
    />
  );
});

Input.displayName = 'Input';

export default Input;
