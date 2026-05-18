'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { motion } from 'framer-motion';
import Link from 'next/link';
import {
  ArrowLeft, Share2, LogOut, Image as ImageIcon, Copy,
  Plus, ThumbsUp, ThumbsDown, MapPin, Calendar, Users as UsersIcon, UserX, Trash2, X,
  Crown, NotebookPen, MessageCircle, Save,
} from 'lucide-react';
import DashboardLayout from '@/components/templates/DashboardLayout';
import Button from '@/components/atoms/Button';
import Loader from '@/components/atoms/Loader';
import { useAuth } from '@/context/AuthContext';
import { api } from '@/lib/api';
import type { TripGroup, TripGroupMember, GroupSimulationProposal, Simulation } from '@/types';
import toast from 'react-hot-toast';

type GroupDetail = TripGroup & {
  myRole: string;
  members: TripGroupMember[];
  simulations: GroupSimulationProposal[];
};

export default function GroupDetailPage() {
  const params = useParams<{ id: string }>();
  const id = params?.id;
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const [group, setGroup] = useState<GroupDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [inviting, setInviting] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const [showProposeModal, setShowProposeModal] = useState(false);
  const [mySimulations, setMySimulations] = useState<Simulation[]>([]);
  const [notesDraft, setNotesDraft] = useState('');
  const [savingNotes, setSavingNotes] = useState(false);
  const [voteCommentFor, setVoteCommentFor] = useState<{ proposalId: string; vote: 'up' | 'down' } | null>(null);
  const [voteCommentText, setVoteCommentText] = useState('');

  const reload = async () => {
    if (!id) return;
    try {
      const { group } = await api.getGroup(id);
      setGroup(group as GroupDetail);
      setNotesDraft((group as GroupDetail).notes || '');
    } catch {}
  };

  const handleSaveNotes = async () => {
    if (!group) return;
    if (notesDraft === (group.notes || '')) return;
    setSavingNotes(true);
    try {
      await api.updateGroup(group.id, { notes: notesDraft });
      toast.success('Notes enregistrées');
      await reload();
    } catch (e: any) {
      toast.error(e?.error || 'Erreur');
    } finally {
      setSavingNotes(false);
    }
  };

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
      return;
    }
    if (user && id) {
      reload().finally(() => setLoading(false));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, authLoading, id, router]);

  const openProposeModal = async () => {
    try {
      const { simulations } = await api.getUserSimulations();
      setMySimulations(simulations);
      setShowProposeModal(true);
    } catch {
      toast.error('Impossible de charger tes simulations');
    }
  };

  const handlePropose = async (simulationId: string) => {
    if (!group) return;
    try {
      await api.proposeGroupSimulation(group.id, simulationId);
      toast.success('Proposition ajoutée au groupe');
      setShowProposeModal(false);
      await reload();
    } catch (e: any) {
      toast.error(e?.error || 'Erreur');
    }
  };

  const handleRemoveProposal = async (proposalId: string) => {
    if (!group || !window.confirm('Retirer cette proposition du groupe ?')) return;
    try {
      await api.removeGroupSimulation(group.id, proposalId);
      toast.success('Proposition retirée');
      await reload();
    } catch (e: any) {
      toast.error(e?.error || 'Erreur');
    }
  };

  const handleVote = async (proposalId: string, vote: 'up' | 'down', currentVote?: 'up' | 'down') => {
    if (!group) return;
    try {
      if (currentVote === vote) {
        await api.removeVoteOnGroupSimulation(group.id, proposalId);
      } else {
        await api.voteOnGroupSimulation(group.id, proposalId, vote);
      }
      await reload();
    } catch (e: any) {
      toast.error(e?.error || 'Erreur');
    }
  };

  const handleVoteWithComment = async () => {
    if (!group || !voteCommentFor) return;
    try {
      await api.voteOnGroupSimulation(group.id, voteCommentFor.proposalId, voteCommentFor.vote, voteCommentText.trim() || undefined);
      setVoteCommentFor(null);
      setVoteCommentText('');
      await reload();
    } catch (e: any) {
      toast.error(e?.error || 'Erreur');
    }
  };

  const handleKick = async (userId: string, email: string) => {
    if (!group) return;
    if (!window.confirm(`Retirer ${email} du groupe ?`)) return;
    try {
      await api.kickGroupMember(group.id, userId);
      toast.success('Membre retiré');
      await reload();
    } catch (e: any) {
      toast.error(e?.error || 'Erreur');
    }
  };

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

  const proposals = group.simulations || [];
  const isOwner = group.myRole === 'owner';
  // Winning proposal = highest (up - down) score, requires at least 1 up vote
  const scored = proposals
    .map((p) => ({
      id: p.id,
      score: p.votes.filter((v) => v.vote === 'up').length - p.votes.filter((v) => v.vote === 'down').length,
      upCount: p.votes.filter((v) => v.vote === 'up').length,
    }))
    .filter((p) => p.upCount > 0)
    .sort((a, b) => b.score - a.score);
  const winnerId = scored.length > 0 && scored[0].score > 0 ? scored[0].id : null;

  return (
    <DashboardLayout title={`${group.emoji} ${group.name}`} description={`${group.members.length} membre${group.members.length > 1 ? 's' : ''} · ${proposals.length} proposition${proposals.length > 1 ? 's' : ''}`}>
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
            {isOwner && ' · tu es le propriétaire'}
          </p>

          <div className="flex gap-3 justify-center mt-6 flex-wrap">
            {isOwner && (
              <>
                <Button variant="primary" size="md" onClick={handleInvite} isLoading={inviting}>
                  <Share2 className="h-4 w-4" />Inviter
                </Button>
                <Button variant="outline" size="md" onClick={handleCopyLink}>
                  <Copy className="h-4 w-4" />Copier le lien
                </Button>
              </>
            )}
            <Button variant="secondary" size="md" onClick={openProposeModal}>
              <Plus className="h-4 w-4" />Proposer un voyage
            </Button>
          </div>
        </motion.div>

        {/* Propositions */}
        <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3 px-1">
          Propositions de voyage {proposals.length > 0 && `(${proposals.length})`}
        </h2>

        {proposals.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 text-center mb-6">
            <MapPin className="h-10 w-10 text-gray-300 mx-auto mb-3" />
            <p className="font-medium text-gray-700">Aucune proposition pour l&apos;instant</p>
            <p className="text-sm text-gray-400 mt-1 mb-4">
              Propose une de tes simulations pour que tout le monde puisse voter et discuter.
            </p>
            <Button variant="primary" size="sm" onClick={openProposeModal}>
              <Plus className="h-4 w-4" />Proposer un voyage
            </Button>
          </div>
        ) : (
          <div className="space-y-3 mb-6">
            {proposals.map((p) => {
              const myVote = p.votes.find((v) => v.userId === user?.id)?.vote as 'up' | 'down' | undefined;
              const upCount = p.votes.filter((v) => v.vote === 'up').length;
              const downCount = p.votes.filter((v) => v.vote === 'down').length;
              const comments = p.votes.filter((v) => v.comment && v.comment.length > 0);
              const canRemove = isOwner || p.proposedBy === user?.id;
              const isWinner = winnerId === p.id;
              return (
                <motion.div
                  key={p.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`bg-white rounded-2xl shadow-sm overflow-hidden ${
                    isWinner ? 'border-2 border-amber-300 ring-4 ring-amber-100' : 'border border-gray-100'
                  }`}
                >
                  {isWinner && (
                    <div className="bg-gradient-to-r from-amber-400 to-yellow-400 text-white px-5 py-2 flex items-center gap-2">
                      <Crown className="h-4 w-4" />
                      <p className="text-sm font-bold">Voyage gagnant — choix du groupe</p>
                    </div>
                  )}
                  <Link href={`/simulation?id=${p.simulationId}`} className="block p-5 hover:bg-sand-50 transition-colors">
                    <div className="flex items-start gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <MapPin className="h-4 w-4 text-primary-500" />
                          <p className="font-bold text-gray-900">{p.simulation.destination}</p>
                          <span className="text-xs text-gray-400">depuis {p.simulation.departureCity}</span>
                        </div>
                        <div className="flex items-center gap-3 text-xs text-gray-500 flex-wrap">
                          <span className="flex items-center gap-1"><Calendar className="h-3 w-3" />{p.simulation.startDate} → {p.simulation.endDate}</span>
                          <span>·</span>
                          <span>{p.simulation.duration}j</span>
                          <span>·</span>
                          <span className="flex items-center gap-1"><UsersIcon className="h-3 w-3" />{p.simulation.people} pers</span>
                        </div>
                        <p className="text-xs text-gray-400 mt-2">Proposé par {p.proposer.email}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-primary-700 text-lg">{Math.round(p.simulation.budget)}€</p>
                        <p className="text-[10px] text-gray-400">total estimé</p>
                      </div>
                    </div>
                  </Link>

                  {comments.length > 0 && (
                    <div className="px-5 py-3 border-t border-gray-50 bg-sand-50/50 space-y-2">
                      {comments.map((c) => (
                        <div key={c.id} className="flex items-start gap-2 text-xs">
                          {c.vote === 'up' ? (
                            <ThumbsUp className="h-3 w-3 text-emerald-500 mt-0.5 flex-shrink-0" />
                          ) : (
                            <ThumbsDown className="h-3 w-3 text-red-500 mt-0.5 flex-shrink-0" />
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-gray-700">{c.user.email}</p>
                            <p className="text-gray-600 mt-0.5">{c.comment}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="px-5 pb-4 pt-3 flex items-center gap-2 border-t border-gray-50">
                    <button
                      onClick={() => handleVote(p.id, 'up', myVote)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-semibold transition-colors ${
                        myVote === 'up'
                          ? 'bg-emerald-500 text-white'
                          : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                      }`}
                    >
                      <ThumbsUp className="h-3.5 w-3.5" />{upCount}
                    </button>
                    <button
                      onClick={() => handleVote(p.id, 'down', myVote)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-semibold transition-colors ${
                        myVote === 'down'
                          ? 'bg-red-500 text-white'
                          : 'bg-red-50 text-red-600 hover:bg-red-100'
                      }`}
                    >
                      <ThumbsDown className="h-3.5 w-3.5" />{downCount}
                    </button>
                    <button
                      onClick={() => { setVoteCommentFor({ proposalId: p.id, vote: myVote || 'up' }); setVoteCommentText(''); }}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-semibold bg-sand-100 text-gray-600 hover:bg-sand-200 transition-colors"
                      title="Voter avec un commentaire"
                    >
                      <MessageCircle className="h-3.5 w-3.5" />
                    </button>
                    <div className="flex-1" />
                    {canRemove && (
                      <button
                        onClick={() => handleRemoveProposal(p.id)}
                        className="text-gray-400 hover:text-red-500 transition-colors p-1.5 rounded-lg hover:bg-red-50"
                        aria-label="Retirer la proposition"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}

        {/* Shared notes */}
        <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3 px-1 flex items-center gap-2">
          <NotebookPen className="h-3 w-3" />Notes partagées
        </h2>
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 mb-6">
          <textarea
            value={notesDraft}
            onChange={(e) => setNotesDraft(e.target.value)}
            onBlur={handleSaveNotes}
            placeholder="Ajoute des notes pour le groupe — choses à voir, bagages, idées d'activités, contacts utiles…"
            rows={3}
            className="w-full px-3 py-2 rounded-xl border border-gray-200 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 outline-none transition-all bg-sand-50 text-sm resize-none"
          />
          <div className="flex justify-between items-center mt-2">
            <p className="text-[11px] text-gray-400">Visible par tous les membres · enregistré quand tu quittes le champ</p>
            {savingNotes && <span className="text-[11px] text-primary-600 flex items-center gap-1"><Save className="h-3 w-3" />Enregistrement…</span>}
          </div>
        </div>

        {/* Members */}
        <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3 px-1">Membres</h2>
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 mb-6 space-y-1">
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
              {isOwner && m.userId !== user?.id && (
                <button
                  onClick={() => handleKick(m.userId, m.user.email)}
                  className="text-gray-400 hover:text-red-500 transition-colors p-2 rounded-lg hover:bg-red-50"
                  title="Retirer du groupe"
                >
                  <UserX className="h-4 w-4" />
                </button>
              )}
            </div>
          ))}
        </div>

        <button
          onClick={handleLeave}
          disabled={leaving}
          className="w-full flex items-center justify-center gap-2 text-red-500 hover:text-red-600 hover:bg-red-50 transition-colors py-3 rounded-xl font-semibold disabled:opacity-50"
        >
          <LogOut className="h-4 w-4" />
          {isOwner ? 'Supprimer le groupe' : 'Quitter le groupe'}
        </button>
      </div>

      {/* Vote with comment modal */}
      {voteCommentFor && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4" onClick={() => setVoteCommentFor(null)}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-3xl shadow-2xl max-w-md w-full overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6">
              <h3 className="font-display text-lg font-bold text-gray-900 mb-4">Voter avec un commentaire</h3>
              <div className="flex gap-2 mb-4">
                <button
                  onClick={() => setVoteCommentFor((v) => v ? { ...v, vote: 'up' } : null)}
                  className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-semibold transition-colors ${
                    voteCommentFor.vote === 'up' ? 'bg-emerald-500 text-white' : 'bg-emerald-50 text-emerald-700'
                  }`}
                >
                  <ThumbsUp className="h-4 w-4" />Pour
                </button>
                <button
                  onClick={() => setVoteCommentFor((v) => v ? { ...v, vote: 'down' } : null)}
                  className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-semibold transition-colors ${
                    voteCommentFor.vote === 'down' ? 'bg-red-500 text-white' : 'bg-red-50 text-red-600'
                  }`}
                >
                  <ThumbsDown className="h-4 w-4" />Contre
                </button>
              </div>
              <textarea
                value={voteCommentText}
                onChange={(e) => setVoteCommentText(e.target.value)}
                placeholder={voteCommentFor.vote === 'up' ? 'Pourquoi ce voyage te plaît ?' : 'Pourquoi pas celui-là ?'}
                rows={3}
                maxLength={500}
                autoFocus
                className="w-full px-3 py-2 rounded-xl border border-gray-200 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 outline-none transition-all bg-sand-50 text-sm resize-none"
              />
              <p className="text-[11px] text-gray-400 mt-1">{voteCommentText.length}/500</p>
              <div className="flex gap-2 mt-4">
                <Button variant="outline" size="md" className="flex-1" onClick={() => setVoteCommentFor(null)}>Annuler</Button>
                <Button variant="primary" size="md" className="flex-1" onClick={handleVoteWithComment}>Voter</Button>
              </div>
            </div>
          </motion.div>
        </div>
      )}

      {/* Propose modal */}
      {showProposeModal && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4" onClick={() => setShowProposeModal(false)}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-3xl shadow-2xl max-w-lg w-full max-h-[80vh] overflow-hidden flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <h3 className="font-display text-xl font-bold text-gray-900">Proposer un voyage</h3>
              <button onClick={() => setShowProposeModal(false)} className="p-2 hover:bg-gray-100 rounded-xl">
                <X className="h-5 w-5 text-gray-500" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-6">
              {mySimulations.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-500 mb-4">Tu n&apos;as pas encore de simulation à proposer.</p>
                  <Link href="/simulation">
                    <Button variant="primary" size="md">Créer une simulation</Button>
                  </Link>
                </div>
              ) : (
                <div className="space-y-2">
                  {mySimulations.map((sim) => {
                    const alreadyProposed = proposals.some((p) => p.simulationId === sim.id);
                    return (
                      <button
                        key={sim.id}
                        onClick={() => !alreadyProposed && handlePropose(sim.id)}
                        disabled={alreadyProposed}
                        className={`w-full text-left p-4 rounded-xl border transition-colors ${
                          alreadyProposed
                            ? 'border-gray-100 bg-gray-50 opacity-60 cursor-not-allowed'
                            : 'border-gray-200 hover:border-primary-300 hover:bg-primary-50'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-gray-900">{sim.destination}</p>
                            <p className="text-xs text-gray-500 mt-0.5">
                              {sim.startDate} → {sim.endDate} · {sim.duration}j · {sim.people} pers
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="font-bold text-primary-700">{Math.round(typeof sim.budget === 'number' ? sim.budget : (sim.budget?.total ?? 0))}€</p>
                            {alreadyProposed && <p className="text-[10px] text-gray-400">Déjà proposé</p>}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </DashboardLayout>
  );
}
