'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Users, UserPlus, MessageSquare, Send, Trash2, Check, Copy } from 'lucide-react';
import Card from '@/components/atoms/Card';
import Button from '@/components/atoms/Button';
import Loader from '@/components/atoms/Loader';
import { api } from '@/lib/api';
import { Collaborator, Comment } from '@/types';
import toast from 'react-hot-toast';

interface CollabPanelProps {
  simulationId: string;
  isOwner: boolean;
  currentUserId?: string;
}

export default function CollabPanel({ simulationId, isOwner, currentUserId }: CollabPanelProps) {
  const [owner, setOwner] = useState<{ id: string; name: string } | null>(null);
  const [collabs, setCollabs] = useState<Collaborator[]>([]);
  const [comments, setComments] = useState<Comment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [newComment, setNewComment] = useState('');
  const [isPosting, setIsPosting] = useState(false);
  const [inviteUrl, setInviteUrl] = useState<string | null>(null);
  const [inviteCopied, setInviteCopied] = useState(false);
  const [isGeneratingInvite, setIsGeneratingInvite] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const [c, cm] = await Promise.all([
          api.listCollaborators(simulationId),
          api.listComments(simulationId),
        ]);
        setOwner(c.owner);
        setCollabs(c.collaborators);
        setComments(cm.comments);
      } catch {
        toast.error('Erreur chargement collaboration');
      } finally {
        setIsLoading(false);
      }
    })();
  }, [simulationId]);

  const handleInvite = async () => {
    setIsGeneratingInvite(true);
    try {
      const { token } = await api.createInvite(simulationId);
      const url = `${window.location.origin}/invite/${token}`;
      setInviteUrl(url);
    } catch {
      toast.error('Erreur génération invitation');
    } finally {
      setIsGeneratingInvite(false);
    }
  };

  const handleCopyInvite = async () => {
    if (!inviteUrl) return;
    try {
      await navigator.clipboard.writeText(inviteUrl);
      setInviteCopied(true);
      toast.success('Lien copié !');
      setTimeout(() => setInviteCopied(false), 2000);
    } catch {
      toast.error('Impossible de copier');
    }
  };

  const handlePostComment = async () => {
    if (!newComment.trim()) return;
    setIsPosting(true);
    try {
      const { comment } = await api.createComment(simulationId, { text: newComment.trim() });
      setComments((prev) => [...prev, comment]);
      setNewComment('');
    } catch {
      toast.error('Erreur envoi commentaire');
    } finally {
      setIsPosting(false);
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    if (!window.confirm('Supprimer ce commentaire ?')) return;
    try {
      await api.deleteComment(commentId);
      setComments((prev) => prev.filter((c) => c.id !== commentId));
    } catch {
      toast.error('Erreur suppression');
    }
  };

  const handleRemoveCollab = async (userId: string) => {
    if (!window.confirm('Retirer ce collaborateur ?')) return;
    try {
      await api.removeCollaborator(simulationId, userId);
      setCollabs((prev) => prev.filter((c) => c.id !== userId));
      toast.success('Collaborateur retiré');
    } catch {
      toast.error('Erreur');
    }
  };

  if (isLoading) {
    return <Card><div className="py-4 flex justify-center"><Loader size="sm" /></div></Card>;
  }

  const avatarClass = 'w-9 h-9 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 text-white flex items-center justify-center font-bold text-sm';

  return (
    <Card>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-lg bg-gradient-to-br from-primary-500 to-primary-700 text-white">
            <Users className="h-4 w-4" />
          </div>
          <div>
            <h4 className="font-bold text-gray-900">Collaboration</h4>
            <p className="text-xs text-gray-500">{collabs.length + 1} participant{collabs.length > 0 ? 's' : ''}</p>
          </div>
        </div>
        {isOwner && (
          <Button variant="outline" size="sm" onClick={handleInvite} disabled={isGeneratingInvite}>
            <UserPlus className="h-4 w-4" /> {isGeneratingInvite ? 'Génération...' : 'Inviter'}
          </Button>
        )}
      </div>

      {inviteUrl && (
        <div className="mb-4 p-3 rounded-xl bg-primary-50 border border-primary-100">
          <p className="text-xs font-semibold text-primary-700 mb-2">Lien d&apos;invitation (valide 14 jours)</p>
          <div className="flex gap-2">
            <input
              readOnly
              value={inviteUrl}
              className="flex-1 text-xs bg-white border border-primary-200 rounded-lg px-2 py-1.5 font-mono"
            />
            <button
              onClick={handleCopyInvite}
              className="px-3 py-1.5 rounded-lg bg-primary-600 text-white hover:bg-primary-700 transition-colors"
            >
              {inviteCopied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
            </button>
          </div>
        </div>
      )}

      {/* Avatars */}
      <div className="flex flex-wrap items-center gap-2 mb-5">
        {owner && (
          <div className="flex items-center gap-2 pr-2 py-1 rounded-full bg-amber-50 border border-amber-200">
            <div className={avatarClass}>{owner.name[0]?.toUpperCase()}</div>
            <span className="text-xs font-medium text-gray-700 pr-2">{owner.name} <span className="text-amber-600">(owner)</span></span>
          </div>
        )}
        {collabs.map((c) => (
          <div key={c.id} className="flex items-center gap-2 pr-2 py-1 rounded-full bg-gray-50 border border-gray-200 group">
            <div className={avatarClass}>{c.name[0]?.toUpperCase()}</div>
            <span className="text-xs font-medium text-gray-700">{c.name}</span>
            {isOwner && (
              <button
                onClick={() => handleRemoveCollab(c.id)}
                className="text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity pr-1"
                title="Retirer"
              >
                <Trash2 className="h-3 w-3" />
              </button>
            )}
          </div>
        ))}
      </div>

      {/* Comments */}
      <div className="border-t border-gray-100 pt-4">
        <div className="flex items-center gap-2 mb-3">
          <MessageSquare className="h-4 w-4 text-gray-400" />
          <h5 className="text-sm font-semibold text-gray-700">Commentaires ({comments.length})</h5>
        </div>

        <div className="space-y-3 max-h-72 overflow-y-auto mb-3">
          {comments.length === 0 && (
            <p className="text-xs text-gray-400 italic py-4 text-center">Aucun commentaire pour le moment. Lance la discussion !</p>
          )}
          {comments.map((c) => (
            <motion.div
              key={c.id}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex gap-2 group"
            >
              <div className={avatarClass + ' flex-shrink-0 w-8 h-8 text-xs'}>{c.author.name[0]?.toUpperCase()}</div>
              <div className="flex-1 bg-gray-50 rounded-xl px-3 py-2">
                <div className="flex items-center justify-between mb-0.5">
                  <span className="text-xs font-semibold text-gray-900">{c.author.name}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-gray-400">{new Date(c.createdAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</span>
                    {(c.author.id === currentUserId || isOwner) && (
                      <button
                        onClick={() => handleDeleteComment(c.id)}
                        className="opacity-0 group-hover:opacity-100 text-gray-300 hover:text-red-500 transition"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    )}
                  </div>
                </div>
                <p className="text-sm text-gray-700 whitespace-pre-wrap">{c.text}</p>
              </div>
            </motion.div>
          ))}
        </div>

        <div className="flex gap-2">
          <input
            type="text"
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handlePostComment(); } }}
            placeholder="Écrire un commentaire..."
            className="flex-1 px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
          <Button variant="primary" size="sm" onClick={handlePostComment} disabled={isPosting || !newComment.trim()}>
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </Card>
  );
}
