'use client';

import { ReactNode } from 'react';
import Navbar from '@/components/molecules/Navbar';

interface LandingLayoutProps {
  children: ReactNode;
}

export default function LandingLayout({ children }: LandingLayoutProps) {
  return (
    <div className="min-h-screen bg-sand-50">
      <Navbar />
      <main>{children}</main>
      <footer className="border-t border-sand-200 mt-20 py-12 bg-primary-950">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <p className="text-primary-300 font-medium">SmartBudget Travel</p>
          <p className="text-primary-500/60 text-sm mt-2">&copy; {new Date().getFullYear()} — Voyagez malin, pas cher.</p>
        </div>
      </footer>
    </div>
  );
}
