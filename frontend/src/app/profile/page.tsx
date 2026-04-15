'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { User, Mail, Lock, Crown, Calendar, Shield, Trash2, Save, LogOut, Sparkles, MapPin, CheckCircle2, AlertTriangle } from 'lucide-react';
import { api } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import DashboardLayout from '@/components/templates/DashboardLayout';
import Card from '@/components/atoms/Card';
import Badge from '@/components/atoms/Badge';
import Loader from '@/components/atoms/Loader';
import Button from '@/components/atoms/Button';
import Input from '@/components/atoms/Input';
import Label from '@/components/atoms/Label';
import toast from 'react-hot-toast';

export default function ProfilePage() {
  const { user, isLoading: authLoading, logout, refreshUser } = useAuth();
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [simCount, setSimCount] = useState(0);

  useEffect(() => {
    if (!authLoading && !user) { router.push('/login'); return; }
    if (user) {
      setEmail(user.email);
      api.getUserSimulations().then(d => setSimCount(d.simulations.length)).catch(() => {});
    }
  }, [user, authLoading, router]);

  const handleSaveEmail = async () => {
    if (!email || email === user?.email) {
      toast.error('Aucun changement à enregistrer');
      return;
    }
    setIsSaving(true);
    try {
      await api.updateProfile({ email });
      await refreshUser();
      toast.success('Email mis à jour !');
    } catch (err: any) {
      toast.error(err.error || 'Erreur');
    } finally {
      setIsSaving(false);
    }
  };

  const handleChangePassword = async () => {
    if (!currentPassword || !newPassword) {
      toast.error('Remplis tous les champs');
      return;
    }
    if (newPassword.length < 6) {
      toast.error('Le mot de passe doit faire 6 caractères minimum');
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error('Les mots de passe ne correspondent pas');
      return;
    }
    setIsSaving(true);
    try {
      await api.updateProfile({ currentPassword, newPassword });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      toast.success('Mot de passe mis à jour !');
    } catch (err: any) {
      toast.error(err.error || 'Erreur');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteAccount = async () => {
    setIsDeleting(true);
    try {
      await api.deleteAccount();
      toast.success('Compte supprimé');
      logout();
      router.push('/');
    } catch (err: any) {
      toast.error(err.error || 'Erreur');
      setIsDeleting(false);
    }
  };

  const handleUpgrade = async () => {
    try {
      const { url } = await api.createCheckoutSession();
      window.location.href = url;
    } catch {
      toast.error('Erreur checkout');
    }
  };

  if (authLoading || !user) {
    return <div className="min-h-screen flex items-center justify-center"><Loader size="lg" text="Chargement..." /></div>;
  }

  const memberSince = user.createdAt ? new Date(user.createdAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }) : '—';
  const initials = user.email.slice(0, 2).toUpperCase();

  return (
    <DashboardLayout title="Mon Profil" description="Gérez vos informations personnelles et votre compte">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column: Identity card */}
        <div className="lg:col-span-1 space-y-6">
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
            <Card>
              <div className="text-center">
                <div className="relative inline-block mb-4">
                  <div className={`h-24 w-24 rounded-full flex items-center justify-center text-3xl font-bold text-white shadow-lg ${user.isPremium ? 'bg-gradient-to-br from-amber-400 to-orange-500' : 'bg-gradient-to-br from-primary-500 to-primary-700'}`}>
                    {initials}
                  </div>
                  {user.isPremium && (
                    <div className="absolute -top-1 -right-1 bg-amber-400 rounded-full p-1.5 shadow-md">
                      <Crown className="h-4 w-4 text-white" />
                    </div>
                  )}
                </div>
                <h3 className="font-bold text-lg text-gray-900 truncate">{user.email}</h3>
                <Badge variant={user.isPremium ? 'premium' : 'default'} className="mt-2">
                  {user.isPremium ? '✨ Premium' : 'Compte Gratuit'}
                </Badge>
              </div>

              <div className="mt-6 space-y-3 pt-6 border-t border-gray-100">
                <div className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-2 text-gray-500"><Calendar className="h-4 w-4" /> Membre depuis</span>
                  <span className="font-medium text-gray-900">{memberSince}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-2 text-gray-500"><MapPin className="h-4 w-4" /> Simulations</span>
                  <span className="font-medium text-gray-900">{simCount}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-2 text-gray-500"><Shield className="h-4 w-4" /> Compte</span>
                  <span className="font-medium text-emerald-600 flex items-center gap-1"><CheckCircle2 className="h-3.5 w-3.5" />Actif</span>
                </div>
              </div>
            </Card>
          </motion.div>

          {!user.isPremium && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
              <Card className="bg-gradient-to-br from-amber-50 to-orange-50 border-amber-200">
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-xl bg-amber-100 text-amber-700"><Crown className="h-5 w-5" /></div>
                  <div className="flex-1">
                    <h4 className="font-bold text-gray-900">Passez Premium</h4>
                    <p className="text-sm text-gray-600 mt-1">Itinéraire IA, filtres avancés, dates flexibles, suivi des prix.</p>
                    <Button variant="primary" size="sm" className="mt-3 w-full" onClick={handleUpgrade}>
                      <Sparkles className="h-4 w-4" /> Découvrir Premium
                    </Button>
                  </div>
                </div>
              </Card>
            </motion.div>
          )}

          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
            <Card>
              <Button variant="outline" className="w-full" onClick={logout}>
                <LogOut className="h-4 w-4" /> Se déconnecter
              </Button>
            </Card>
          </motion.div>
        </div>

        {/* Right column: Forms */}
        <div className="lg:col-span-2 space-y-6">
          {/* Email */}
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
            <Card>
              <div className="flex items-center gap-3 mb-5">
                <div className="p-2 rounded-xl bg-primary-50 text-primary-600"><Mail className="h-5 w-5" /></div>
                <div>
                  <h3 className="font-bold text-gray-900">Adresse email</h3>
                  <p className="text-xs text-gray-500">Utilisée pour la connexion et les notifications</p>
                </div>
              </div>
              <div className="space-y-3">
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="ton@email.com" />
                </div>
                <Button variant="primary" size="sm" onClick={handleSaveEmail} disabled={isSaving || email === user.email}>
                  <Save className="h-4 w-4" /> Enregistrer
                </Button>
              </div>
            </Card>
          </motion.div>

          {/* Password */}
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
            <Card>
              <div className="flex items-center gap-3 mb-5">
                <div className="p-2 rounded-xl bg-violet-50 text-violet-600"><Lock className="h-5 w-5" /></div>
                <div>
                  <h3 className="font-bold text-gray-900">Mot de passe</h3>
                  <p className="text-xs text-gray-500">Minimum 6 caractères</p>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="sm:col-span-2">
                  <Label htmlFor="current">Mot de passe actuel</Label>
                  <Input id="current" type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} placeholder="••••••••" />
                </div>
                <div>
                  <Label htmlFor="new">Nouveau mot de passe</Label>
                  <Input id="new" type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="••••••••" />
                </div>
                <div>
                  <Label htmlFor="confirm">Confirmer</Label>
                  <Input id="confirm" type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="••••••••" />
                </div>
              </div>
              <Button variant="primary" size="sm" className="mt-4" onClick={handleChangePassword} disabled={isSaving || !currentPassword || !newPassword}>
                <Save className="h-4 w-4" /> Changer le mot de passe
              </Button>
            </Card>
          </motion.div>

          {/* Subscription */}
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <Card>
              <div className="flex items-center gap-3 mb-5">
                <div className={`p-2 rounded-xl ${user.isPremium ? 'bg-amber-50 text-amber-600' : 'bg-gray-50 text-gray-500'}`}>
                  <Crown className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900">Abonnement</h3>
                  <p className="text-xs text-gray-500">Gestion de votre plan</p>
                </div>
              </div>
              {user.isPremium ? (
                <div className="p-4 rounded-xl bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-100">
                  <div className="flex items-center gap-2 mb-2">
                    <Crown className="h-5 w-5 text-amber-600" />
                    <span className="font-bold text-gray-900">Plan Premium actif</span>
                  </div>
                  <p className="text-sm text-gray-600">Tu bénéficies de toutes les fonctionnalités avancées : IA illimitée, itinéraires détaillés, filtres premium, suivi des prix, export PDF.</p>
                </div>
              ) : (
                <div className="p-4 rounded-xl bg-gray-50 border border-gray-200">
                  <p className="font-bold text-gray-900 mb-1">Plan Gratuit</p>
                  <p className="text-sm text-gray-600 mb-3">Passe Premium pour débloquer tout le potentiel de SmartBudget.</p>
                  <Button variant="primary" size="sm" onClick={handleUpgrade}>
                    <Sparkles className="h-4 w-4" /> Upgrader maintenant
                  </Button>
                </div>
              )}
            </Card>
          </motion.div>

          {/* Danger zone */}
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
            <Card className="border-red-100">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 rounded-xl bg-red-50 text-red-600"><AlertTriangle className="h-5 w-5" /></div>
                <div>
                  <h3 className="font-bold text-gray-900">Zone dangereuse</h3>
                  <p className="text-xs text-gray-500">Ces actions sont irréversibles</p>
                </div>
              </div>
              {!showDeleteConfirm ? (
                <Button variant="outline" size="sm" onClick={() => setShowDeleteConfirm(true)} className="border-red-200 text-red-600 hover:bg-red-50">
                  <Trash2 className="h-4 w-4" /> Supprimer mon compte
                </Button>
              ) : (
                <div className="p-4 rounded-xl bg-red-50 border border-red-200">
                  <p className="font-medium text-red-900 mb-1">Êtes-vous sûr ?</p>
                  <p className="text-sm text-red-700 mb-3">Toutes vos simulations et données seront supprimées définitivement.</p>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => setShowDeleteConfirm(false)}>Annuler</Button>
                    <Button variant="primary" size="sm" onClick={handleDeleteAccount} disabled={isDeleting} className="!bg-red-600 hover:!bg-red-700">
                      {isDeleting ? 'Suppression...' : 'Confirmer la suppression'}
                    </Button>
                  </div>
                </div>
              )}
            </Card>
          </motion.div>
        </div>
      </div>
    </DashboardLayout>
  );
}
