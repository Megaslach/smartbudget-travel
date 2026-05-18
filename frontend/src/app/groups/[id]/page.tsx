'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { ArrowLeft, Share2, LogOut, CheckCircle2, Image as ImageIcon, Copy } from 'lucide-react';
import DashboardLayout from '@/components/templates/DashboardLayout';
import Button from '@/components/atoms/Button';
import Loader from '@/components/atoms/Loader';
import { useAuth } from '@/context/AuthContext';
import { api } from '@/lib/api';
import type { TripGroup, TripGroupMember } from '@/types';
import toast from 'react-hot-toast';

type GroupDetail = TripGroup & { myRole: string; members: TripGroupMember[] };

export default function GroupDetailPage() {
  const params = useParams<{ id: string }>();
  const id = params?.id;
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const [group, setGroup] = useState<GroupDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [inviting, setInviting] = useState(false);
  const [leaving, setLeaving] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
      return;
    }
    if (user && id) {
      api.getGroup(id)
        .then(({ group }) => setGroup(group as GroupDetail))
        .catch(() => {})
        .finally(() => setLoading(false));
    }
  }, [user, authLoading, id, router]);

  const handleInvite = async () => {
    if (!group) return;
    setInviting(true);
    try {
      const { token } = await api.createGroupInvite(group.id);
      const inviteUrl = `${window.location.origin}/group-invite/${token}`;
      if (navigator.share) {
        await navigator.share({
          title: `Rejoins ${group.name} sur Itinifly`,
          text: `Rejoins mon groupe de voyage "${group.name}" ${group.emoji} sur Itinifly`,
          url: inviteUrl,
        }).catch(() => {});
      } else {
        await navigator.clipboard.writeText(inviteUrl);
        toast.success('Lien d\u2019invitation copié !');
      }
    } catch (e: any) {
      toast.error(e?.error || 'Impossible de créer l\u2019invitation');
    } finally {
      setInviting(false);
    }
  };

  const handleCopyLink = async () => {
    if (!group) return;
    try {
      const { token } = await api.createGroupInvite(group.id);
      const inviteUrl = `${window.location.origin}/group-invite/${token}`;
      await navigator.clipboard.writeText(inviteUrl);
      toast.success('Lien d\u2019invitation copié !');
    } catch (e: any) {
      toast.error(e?.error || 'Impossible');
    }
  };

  const handleLeave = async () => {
    if (!group) return;
    const isOwner = group.myRole === 'owner';
    const confirmMsg = isOwner
      ? 'Supprimer le groupe ? Cette action est définitive et tous les membres seront retirés.'
      : 'Quitter le groupe ? Tu pourras être réinvité plus tard.';
    if (!window.confirm(confirmMsg)) return;

    setLeaving(true);
    try {
      await api.leaveGroup(group.id);
      toast.success(isOwner ? 'Groupe supprimé' : 'Groupe quitté');
      router.replace('/groups');
    } catch (e: any) {
      toast.error(e?.error || 'Impossible');
      setLeaving(false);
    }
  };

  if (authLoading || loading) {
    return <div className="min-h-screen flex items-center justify-center"><Loader size="lg" text="Chargement..." /></div>;
  }

  if (!group) {
    return (
      <DashboardLayout title="Groupe introuvable">
        <div className="max-w-2xl mx-auto text-center py-20">
          <p className="text-gray-500 mb-4">Ce groupe n&apos;existe plus ou tu n&apos;y as plus accès.</p>
          <Button variant="outline" onClick={() => router.push('/groups')}>Retour aux groupes</Button>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title={`${group.emoji} ${group.name}`} description={`${group.members.length} membre${group.members.length > 1 ? 's' : ''}`}>
      <div className="max-w-3xl mx-auto">
        <button
          onClick={() => router.push('/groups')}
          className="flex items-center gap-2 text-gray-500 hover:text-gray-700 mb-4 text-sm"
        >
          <ArrowLeft className="h-4 w-4" />Mes groupes
        </button>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-3xl border border-gray-100 shadow-xl shadow-gray-200/40 p-8 mb-6 text-center"
        >
          <div className="text-7xl mb-3">{group.emoji}</div>
          <h1 className="font-display text-3xl font-bold text-gray-900">{group.name}</h1>
          <p className="text-gray-400 mt-1">
            {group.members.length} membre{group.members.length > 1 ? 's' : ''}
            {group.myRole === 'owner' && ' · tu es le propriétaire'}
          </p>

          {group.myRole === 'owner' && (
            <div className="flex gap-3 justify-center mt-6 flex-wrap">
              <Button variant="primary" size="md" onClick={handleInvite} isLoading={inviting}>
                <Share2 className="h-4 w-4" />Inviter quelqu&apos;un
              </Button>
              <Button variant="outline" size="md" onClick={handleCopyLink}>
                <Copy className="h-4 w-4" />Copier le lien
              </Button>
            </div>
          )}
        </motion.div>

        <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3 px-1">Membres</h2>
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 mb-6 space-y-2">
          {group.members.map((m) => (
            <div key={m.id} className="flex items-center gap-3 py-2">
              <div className="w-10 h-10 rounded-full bg-primary-700 text-white flex items-center justify-center font-bold">
                {(m.user.email || '?')[0].toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {m.user.email}
                  {m.userId === user?.id && <span className="text-gray-400 font-normal"> (toi)</span>}
                </p>
                <p className="text-xs text-gray-400">{m.role === 'owner' ? '👑 Propriétaire' : 'Membre'}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="grid md:grid-cols-2 gap-4 mb-6">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 text-center">
            <CheckCircle2 className="h-8 w-8 text-primary-500 mx-auto mb-2" />
            <p className="font-semibold text-gray-900 text-sm">Votes & propositions</p>
            <p className="text-xs text-gray-400 mt-1 leading-relaxed">
              Bientôt : proposez des hôtels, activités et dates dans le groupe, puis votez ensemble.
            </p>
          </div>
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 text-center">
            <ImageIcon className="h-8 w-8 text-primary-500 mx-auto mb-2" />
            <p className="font-semibold text-gray-900 text-sm">Souvenirs partagés</p>
            <p className="text-xs text-gray-400 mt-1 leading-relaxed">
              Bientôt : un album commun où chaque membre dépose ses photos du voyage.
            </p>
          </div>
        </div>

        <button
          onClick={handleLeave}
          disabled={leaving}
          className="w-full flex items-center justify-center gap-2 text-red-500 hover:text-red-600 hover:bg-red-50 transition-colors py-3 rounded-xl font-semibold disabled:opacity-50"
        >
          <LogOut className="h-4 w-4" />
          {group.myRole === 'owner' ? 'Supprimer le groupe' : 'Quitter le groupe'}
        </button>
      </div>
    </DashboardLayout>
  );
}
