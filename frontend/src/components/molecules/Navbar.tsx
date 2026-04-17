'use client';

import Link from 'next/link';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/context/AuthContext';
import Button from '@/components/atoms/Button';
import Badge from '@/components/atoms/Badge';
import { Palmtree, LogOut, LayoutDashboard, CreditCard, UserCircle, Scale, Menu, X } from 'lucide-react';

export default function Navbar() {
  const { user, logout } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);

  const close = () => setMobileOpen(false);

  return (
    <nav className="sticky top-0 z-50 bg-sand-50/80 backdrop-blur-xl border-b border-sand-200/60">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <Link href="/" className="flex items-center gap-2.5 group min-w-0" onClick={close}>
            <motion.div
              whileHover={{ rotate: [0, -8, 6, -4, 0], scale: 1.05 }}
              transition={{ duration: 0.6 }}
              className="p-2 rounded-xl bg-primary-700 text-white group-hover:bg-primary-800 transition-colors shrink-0"
            >
              <Palmtree className="h-5 w-5" />
            </motion.div>
            <span className="text-lg sm:text-xl font-bold text-gray-900 tracking-tight truncate">
              Smart<span className="text-primary-700">Budget</span>
            </span>
          </Link>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-2">
            {user ? (
              <>
                {user.isPremium && <Badge variant="premium">Premium</Badge>}
                <Link href="/dashboard">
                  <Button variant="ghost" size="sm">
                    <LayoutDashboard className="h-4 w-4" />
                    Dashboard
                  </Button>
                </Link>
                <Link href="/profile">
                  <Button variant="ghost" size="sm">
                    <UserCircle className="h-4 w-4" />
                    Profil
                  </Button>
                </Link>
                <Link href="/compare">
                  <Button variant="ghost" size="sm">
                    <Scale className="h-4 w-4" />
                    Comparer
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

          {/* Mobile hamburger */}
          <div className="flex md:hidden items-center gap-2">
            {user?.isPremium && <Badge variant="premium">Premium</Badge>}
            <button
              onClick={() => setMobileOpen((v) => !v)}
              aria-label={mobileOpen ? 'Fermer le menu' : 'Ouvrir le menu'}
              className="p-2 rounded-xl text-gray-700 hover:bg-sand-100 transition-colors"
            >
              {mobileOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile dropdown menu */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="md:hidden overflow-hidden border-t border-sand-200/60 bg-sand-50/95 backdrop-blur-xl"
          >
            <div className="max-w-7xl mx-auto px-4 py-3 flex flex-col gap-1">
              {user ? (
                <>
                  <Link href="/dashboard" onClick={close} className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-gray-700 hover:bg-white/80">
                    <LayoutDashboard className="h-5 w-5" /> Dashboard
                  </Link>
                  <Link href="/profile" onClick={close} className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-gray-700 hover:bg-white/80">
                    <UserCircle className="h-5 w-5" /> Profil
                  </Link>
                  <Link href="/compare" onClick={close} className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-gray-700 hover:bg-white/80">
                    <Scale className="h-5 w-5" /> Comparer
                  </Link>
                  <Link href="/simulation" onClick={close} className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-primary-700 text-white hover:bg-primary-800">
                    Simuler un voyage
                  </Link>
                  {!user.isPremium && (
                    <Link href="/pricing" onClick={close} className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-gray-700 hover:bg-white/80">
                      <CreditCard className="h-5 w-5" /> Premium
                    </Link>
                  )}
                  <button
                    onClick={() => { close(); logout(); }}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-left text-gray-700 hover:bg-white/80"
                  >
                    <LogOut className="h-5 w-5" /> Se déconnecter
                  </button>
                </>
              ) : (
                <>
                  <Link href="/login" onClick={close} className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-gray-700 hover:bg-white/80">
                    Connexion
                  </Link>
                  <Link href="/register" onClick={close} className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-primary-700 text-white hover:bg-primary-800">
                    S&apos;inscrire
                  </Link>
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}
