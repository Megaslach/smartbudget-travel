'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { ArrowLeft } from 'lucide-react';
import DashboardLayout from '@/components/templates/DashboardLayout';
import Button from '@/components/atoms/Button';
import Loader from '@/components/atoms/Loader';
import { useAuth } from '@/context/AuthContext';
import { api } from '@/lib/api';
import toast from 'react-hot-toast';

const EMOJIS = ['🌍', '✈️', '🏖️', '🗼', '🏛️', '🏔️', '🌃', '🌴', '🍷', '🎉'];

export default function CreateGroupPage() {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const [name, setName] = useState('');
  const [emoji, setEmoji] = useState('🌍');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !user) router.push('/login');
  }, [user, authLoading, router]);

  const handleSubmit = async (ev: React.FormEvent) => {
    ev.preventDefault();
    setError(null);
    if (name.trim().length < 2) {
      setError('Nom du groupe requis (2 caractères min)');
      return;
    }
    setLoading(true);
    try {
      const { group } = await api.createGroup({ name: name.trim(), emoji });
      toast.success('Groupe créé !');
      router.replace(`/groups/${group.id}`);
    } catch (e: any) {
      setError(e?.error || 'Erreur lors de la création');
    } finally {
      setLoading(false);
    }
  };

  if (authLoading || !user) {
    return <div className="min-h-screen flex items-center justify-center"><Loader size="lg" text="Chargement..." /></div>;
  }

  return (
    <DashboardLayout title="Nouveau groupe" description="Crée un groupe et invite tes voyageurs">
      <div className="max-w-2xl mx-auto">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-gray-500 hover:text-gray-700 mb-4 text-sm"
        >
          <ArrowLeft className="h-4 w-4" />Retour
        </button>

        <motion.form
          onSubmit={handleSubmit}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-3xl border border-gray-100 shadow-xl shadow-gray-200/40 p-8 space-y-6"
        >
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Emoji du groupe</label>
            <div className="flex flex-wrap gap-2">
              {EMOJIS.map((e) => (
                <button
                  key={e}
                  type="button"
                  onClick={() => setEmoji(e)}
                  className={`w-14 h-14 rounded-full text-2xl flex items-center justify-center transition-all ${
                    emoji === e
                      ? 'bg-primary-100 border-2 border-primary-500'
                      : 'bg-sand-50 border border-gray-200 hover:border-gray-300'
                  }`}
                >
                  {e}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Nom du groupe</label>
            <input
              type="text"
              autoFocus
              placeholder="ex: Barcelone 2027, Road trip USA, Famille…"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className={`w-full px-4 py-3 rounded-xl border ${error ? 'border-red-400' : 'border-gray-200'} focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 outline-none transition-all bg-sand-50`}
            />
            {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
          </div>

          <Button type="submit" size="lg" className="w-full" isLoading={loading}>
            Créer le groupe
          </Button>

          <p className="text-center text-xs text-gray-400">
            Tu seras le propriétaire. Tu pourras inviter d&apos;autres personnes ensuite.
          </p>
        </motion.form>
      </div>
    </DashboardLayout>
  );
}
