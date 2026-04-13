'use client';

import { ReactNode } from 'react';
import Navbar from '@/components/molecules/Navbar';

interface DashboardLayoutProps {
  children: ReactNode;
  title: string;
  description?: string;
}

export default function DashboardLayout({ children, title, description }: DashboardLayoutProps) {
  return (
    <div className="min-h-screen bg-sand-50">
      <Navbar />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="mb-10">
          <h1 className="font-display text-3xl font-bold text-gray-900">{title}</h1>
          {description && <p className="text-gray-400 mt-1">{description}</p>}
        </div>
        {children}
      </main>
    </div>
  );
}
