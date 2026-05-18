'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Plus, Users, ChevronRight } from 'lucide-react';
import DashboardLayout from '@/components/templates/DashboardLayout';
import Button from '@/components/atoms/Button';
import Loader from '@/components/atoms/Loader';
import { useAuth } from '@/context/AuthContext';
import { api } from '@/lib/api';
import type { TripGroup } from '@/types';

type GroupWithMeta = TripGroup & { memberCount: number; myRole: string };

export default function GroupsPage() {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const [groups, setGroups] = useState<GroupWithMeta[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
      return;
    }
    if (user) {
      api.listGroups()
        .then(({ groups }) => setGroups(groups as GroupWithMeta[]))
        .catch(() => {})
        .finally(() => setLoading(false));
    }
  }, [user, authLoading, router]);

  if (authLoading || !user) {
    return <div className="min-h-screen flex items-center justify-center"><Loader size="lg" text="Chargement..." /></div>;
  }

  return (
    <DashboardLayout title="Mes groupes" description="Organisez vos voyages à plusieurs">
      <div className="max-w-3xl mx-auto">
        <div className="flex justify-end mb-6">
          <Link href="/groups/create">
            <Button variant="primary" size="md">
              <Plus className="h-4 w-4" />Nouveau groupe
            </Button>
          </Link>
        </div>

        {loading ? (
          <div className="flex justify-center py-20"><Loader size="md" /></div>
        ) : groups.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-3xl border border-gray-100 shadow-xl shadow-gray-200/40 p-12 text-center"
          >
            <div className="inline-flex p-4 rounded-2xl bg-primary-50 text-primary-700 mb-4">
              <Users className="h-10 w-10" />
            </div>
            <h2 className="font-display text-2xl font-bold text-gray-900 mb-2">Aucun groupe pour l&apos;instant</h2>
            <p className="text-gray-500 mb-6 max-w-md mx-auto">
              Crée un groupe pour organiser un voyage à plusieurs. Tu pourras inviter tes amis et tout décider ensemble.
            </p>
            <Link href="/groups/create">
              <Button variant="primary" size="lg">
                <Plus className="h-4 w-4" />Créer mon premier groupe
              </Button>
            </Link>
          </motion.div>
        ) : (
          <div className="space-y-3">
            {groups.map((g, i) => (
              <motion.div
                key={g.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
              >
                <Link
                  href={`/groups/${g.id}`}
                  className="flex items-center gap-4 bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md hover:border-primary-200 transition-all p-5"
                >
                  <span className="text-4xl">{g.emoji}</span>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-900 truncate">{g.name}</p>
                    <p className="text-sm text-gray-400">
                      {g.memberCount} membre{g.memberCount > 1 ? 's' : ''}
                      {g.myRole === 'owner' && <span className="ml-1">· Propriétaire</span>}
                    </p>
                  </div>
                  <ChevronRight className="h-5 w-5 text-gray-300" />
                </Link>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
