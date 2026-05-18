'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { AlertCircle, X } from 'lucide-react';
import Navbar from '@/components/molecules/Navbar';
import Button from '@/components/atoms/Button';
import Loader from '@/components/atoms/Loader';
import { useAuth } from '@/context/AuthContext';
import { api } from '@/lib/api';
import type { TripGroup } from '@/types';
import toast from 'react-hot-toast';

export default function AcceptInvitePage() {
  const params = useParams<{ token: string }>();
  const token = params?.token;
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const [group, setGroup] = useState<TripGroup | null>(null);
  const [loading, setLoading] = useState(true);
  const [accepting, setAccepting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) return;
    api.getGroupInviteInfo(token)
      .then(({ group }) => setGroup(group))
      .catch((e: any) => setError(e?.error || 'Invitation invalide ou expirée'))
      .finally(() => setLoading(false));
  }, [token]);

  const handleAccept = async () => {
    if (!token) return;
    if (!user) {
      sessionStorage.setItem('postLoginRedirect', `/group-invite/${token}`);
      router.push('/login');
      return;
    }
    setAccepting(true);
    try {
      const { groupId } = await api.acceptGroupInvite(token);
      toast.success('Tu as rejoint le groupe !');
      router.replace(`/groups/${groupId}`);
    } catch (e: any) {
      setError(e?.error || 'Impossible de rejoindre');
      setAccepting(false);
    }
  };

  return (
    <div className="min-h-screen bg-sand-50">
      <Navbar />
      <main className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex justify-end mb-4">
          <button
            onClick={() => router.push('/')}
            className="p-2 rounded-xl text-gray-500 hover:text-gray-700 hover:bg-white transition-colors"
            aria-label="Fermer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-3xl border border-gray-100 shadow-xl shadow-gray-200/40 p-10 text-center"
        >
          {loading || authLoading ? (
            <div className="py-12"><Loader size="md" text="Vérification de l'invitation..." /></div>
          ) : error || !group ? (
            <>
              <AlertCircle className="h-14 w-14 text-red-500 mx-auto mb-4" />
              <h1 className="font-display text-2xl font-bold text-gray-900 mb-2">Invitation invalide</h1>
              <p className="text-gray-500 mb-6">{error || 'Cette invitation a expiré ou n\u2019existe plus.'}</p>
              <Button variant="outline" onClick={() => router.push('/')}>Retour à l&apos;accueil</Button>
            </>
          ) : (
            <>
              <div className="text-8xl mb-4">{group.emoji}</div>
              <h1 className="font-display text-3xl font-bold text-gray-900 mb-2">
                Rejoindre {group.name} ?
              </h1>
              <p className="text-gray-500 mb-8 leading-relaxed max-w-md mx-auto">
                Tu as été invité à rejoindre ce groupe de voyage sur Itinifly.{' '}
                Tu pourras voir l&apos;itinéraire, participer aux votes et discuter avec les autres membres.
              </p>

              <Button
                onClick={handleAccept}
                isLoading={accepting}
                size="lg"
                className="w-full max-w-sm mx-auto"
              >
                {user ? 'Rejoindre le groupe' : 'Me connecter pour rejoindre'}
              </Button>

              <button
                onClick={() => router.push('/')}
                className="mt-4 text-sm text-gray-400 hover:text-gray-600 transition-colors"
              >
                Plus tard
              </button>
            </>
          )}
        </motion.div>
      </main>
    </div>
  );
}
