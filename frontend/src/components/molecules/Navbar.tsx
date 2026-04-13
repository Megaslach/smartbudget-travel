'use client';

import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import Button from '@/components/atoms/Button';
import Badge from '@/components/atoms/Badge';
import { Palmtree, LogOut, LayoutDashboard, CreditCard } from 'lucide-react';

export default function Navbar() {
  const { user, logout } = useAuth();

  return (
    <nav className="sticky top-0 z-50 bg-sand-50/80 backdrop-blur-xl border-b border-sand-200/60">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="p-2 rounded-xl bg-primary-700 text-white group-hover:bg-primary-800 transition-colors">
              <Palmtree className="h-5 w-5" />
            </div>
            <span className="text-xl font-bold text-gray-900 tracking-tight">
              Smart<span className="text-primary-700">Budget</span>
            </span>
          </Link>

          <div className="flex items-center gap-2">
            {user ? (
              <>
                {user.isPremium && <Badge variant="premium">Premium</Badge>}
                <Link href="/dashboard">
                  <Button variant="ghost" size="sm">
                    <LayoutDashboard className="h-4 w-4" />
                    Dashboard
                  </Button>
                </Link>
                <Link href="/simulation">
                  <Button variant="primary" size="sm">Simuler</Button>
                </Link>
                {!user.isPremium && (
                  <Link href="/pricing">
                    <Button variant="ghost" size="sm">
                      <CreditCard className="h-4 w-4" />
                      Premium
                    </Button>
                  </Link>
                )}
                <Button variant="ghost" size="sm" onClick={logout}>
                  <LogOut className="h-4 w-4" />
                </Button>
              </>
            ) : (
              <>
                <Link href="/login">
                  <Button variant="ghost" size="sm">Connexion</Button>
                </Link>
                <Link href="/register">
                  <Button variant="primary" size="sm">S&apos;inscrire</Button>
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
