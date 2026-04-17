'use client';

import { InputHTMLAttributes, forwardRef, useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  error?: string;
}

const Input = forwardRef<HTMLInputElement, InputProps>(({ error, className = '', type, ...props }, ref) => {
  const [visible, setVisible] = useState(false);
  const isPassword = type === 'password';
  const effectiveType = isPassword && visible ? 'text' : type;

  const baseClass = `
    w-full px-4 py-3 rounded-xl border bg-white text-gray-900
    placeholder:text-gray-400 transition-all duration-200
    focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent
    ${isPassword ? 'pr-11' : ''}
    ${error ? 'border-red-400 focus:ring-red-500' : 'border-gray-200 hover:border-gray-300'}
    ${className}
  `;

  if (!isPassword) {
    return <input ref={ref} type={type} className={baseClass} {...props} />;
  }

  return (
    <div className="relative">
      <input ref={ref} type={effectiveType} className={baseClass} {...props} />
      <button
        type="button"
        onClick={() => setVisible((v) => !v)}
        aria-label={visible ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
        tabIndex={-1}
        className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-700 transition-colors"
      >
        {visible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
      </button>
    </div>
  );
});

Input.displayName = 'Input';

export default Input;
