'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Users, Calendar, MapPin, Sparkles } from 'lucide-react';
import LandingLayout from '@/components/templates/LandingLayout';
import Card from '@/components/atoms/Card';
import Button from '@/components/atoms/Button';
import Loader from '@/components/atoms/Loader';
import { api } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { InviteInfo } from '@/types';
import toast from 'react-hot-toast';

export default function InviteAcceptPage() {
  const params = useParams();
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();
  const token = params?.token as string;
  const [info, setInfo] = useState<InviteInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAccepting, setIsAccepting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) return;
    (async () => {
      try {
        const data = await api.getInviteInfo(token);
        setInfo(data);
      } catch (e: unknown) {
        const err = e as { error?: string };
        setError(err.error || 'Invitation invalide');
      } finally {
        setIsLoading(false);
      }
    })();
  }, [token]);

  const handleAccept = async () => {
    if (!user) {
      router.push(`/login?redirect=/invite/${token}`);
      return;
    }
    setIsAccepting(true);
    try {
      await api.acceptInvite(token);
      toast.success('Invitation acceptée !');
      router.push('/dashboard');
    } catch (e: unknown) {
      const err = e as { error?: string };
      toast.error(err.error || 'Erreur acceptation');
    } finally {
      setIsAccepting(false);
    }
  };

  if (isLoading || authLoading) {
    return (
      <LandingLayout>
        <div className="min-h-[60vh] flex items-center justify-center">
          <Loader size="lg" text="Chargement de l'invitation..." />
        </div>
      </LandingLayout>
    );
  }

  if (error || !info) {
    return (
      <LandingLayout>
        <div className="min-h-[60vh] flex items-center justify-center">
          <Card className="text-center max-w-md">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Invitation invalide</h2>
            <p className="text-gray-500 mb-6">{error || 'Cette invitation est expirée ou n\'existe plus.'}</p>
            <Button variant="primary" onClick={() => router.push('/')}>Retour à l&apos;accueil</Button>
          </Card>
        </div>
      </LandingLayout>
    );
  }

  return (
    <LandingLayout>
      <div className="min-h-[60vh] flex items-center justify-center px-4 py-10">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="max-w-md w-full">
          <Card className="text-center">
            <div className="inline-flex p-3 rounded-2xl bg-gradient-to-br from-primary-500 to-primary-700 text-white mb-4">
              <Users className="h-8 w-8" />
            </div>
            <h2 className="font-display text-2xl font-bold text-gray-900 mb-2">
              {info.invitedBy} t&apos;invite à collaborer
            </h2>
            <p className="text-gray-500 mb-6">sur un voyage à <strong className="text-primary-600">{info.simulation.destination}</strong></p>

            <div className="space-y-2 text-left p-4 rounded-xl bg-gray-50 mb-6">
              <div className="flex items-center gap-2 text-sm text-gray-700">
                <MapPin className="h-4 w-4 text-primary-600" /> {info.simulation.destination}
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-700">
                <Calendar className="h-4 w-4 text-primary-600" /> {info.simulation.startDate} → {info.simulation.endDate}
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-700">
                <Users className="h-4 w-4 text-primary-600" /> {info.simulation.people} voyageur{info.simulation.people > 1 ? 's' : ''}
              </div>
            </div>

            <p className="text-xs text-gray-400 mb-4">
              En acceptant, tu pourras consulter le budget, l&apos;itinéraire et laisser des commentaires.
            </p>

            {user ? (
              <Button variant="primary" size="lg" onClick={handleAccept} disabled={isAccepting} className="w-full">
                {isAccepting ? 'Acceptation...' : <><Sparkles className="h-4 w-4" /> Accepter l&apos;invitation</>}
              </Button>
            ) : (
              <div className="space-y-2">
                <Button variant="primary" size="lg" onClick={() => router.push(`/login?redirect=/invite/${token}`)} className="w-full">
                  Se connecter pour accepter
                </Button>
                <Button variant="outline" onClick={() => router.push(`/register?redirect=/invite/${token}`)} className="w-full">
                  Créer un compte
                </Button>
              </div>
            )}
          </Card>
        </motion.div>
      </div>
    </LandingLayout>
  );
}
