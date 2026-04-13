'use client';

import { InputHTMLAttributes } from 'react';
import Label from '@/components/atoms/Label';
import Input from '@/components/atoms/Input';

interface FormFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  required?: boolean;
}

export default function FormField({ label, error, required, id, ...inputProps }: FormFieldProps) {
  return (
    <div className="space-y-1">
      <Label htmlFor={id} required={required}>{label}</Label>
      <Input id={id} error={error} {...inputProps} />
      {error && <p className="text-sm text-red-500 mt-1">{error}</p>}
    </div>
  );
}
