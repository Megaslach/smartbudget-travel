'use client';

import { Suspense, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import DashboardLayout from '@/components/templates/DashboardLayout';
import DashboardPanel from '@/components/organisms/DashboardPanel';
import Loader from '@/components/atoms/Loader';
import { useAuth } from '@/context/AuthContext';
import toast from 'react-hot-toast';

function DashboardContent() {
  const { user, isLoading, refreshUser } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (searchParams.get('upgraded') === 'true') {
      refreshUser();
      toast.success('Bienvenue dans le plan Premium !');
      router.replace('/dashboard');
    }
  }, [searchParams, refreshUser, router]);

  if (!isLoading && !user) {
    router.push('/login');
    return null;
  }

  return (
    <DashboardLayout title="Dashboard" description="Vue d'ensemble de vos simulations">
      <DashboardPanel />
    </DashboardLayout>
  );
}

export default function DashboardPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><Loader size="lg" text="Chargement..." /></div>}>
      <DashboardContent />
    </Suspense>
  );
}
