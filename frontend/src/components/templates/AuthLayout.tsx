'use client';

import { ReactNode } from 'react';
import Link from 'next/link';
import { Plane } from 'lucide-react';

interface AuthLayoutProps {
  children: ReactNode;
  title: string;
  subtitle: string;
}

export default function AuthLayout({ children, title, subtitle }: AuthLayoutProps) {
  return (
    <div className="min-h-screen bg-sand-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2.5 mb-6">
            <div className="p-2 rounded-xl bg-primary-700 text-white">
              <Plane className="h-6 w-6" />
            </div>
            <span className="text-2xl font-bold text-gray-900 tracking-tight">
              Smart<span className="text-primary-700">Budget</span>
            </span>
          </Link>
          <h1 className="font-display text-3xl font-bold text-gray-900">{title}</h1>
          <p className="text-gray-400 mt-2">{subtitle}</p>
        </div>
        <div className="bg-white rounded-3xl shadow-xl shadow-gray-200/50 border border-gray-100/80 p-8">
          {children}
        </div>
      </div>
    </div>
  );
}
