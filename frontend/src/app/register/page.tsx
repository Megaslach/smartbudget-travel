'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import AuthLayout from '@/components/templates/AuthLayout';
import FormField from '@/components/molecules/FormField';
import Button from '@/components/atoms/Button';
import { useAuth } from '@/context/AuthContext';
import toast from 'react-hot-toast';

export default function RegisterPage() {
  const router = useRouter();
  const { register } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      toast.error('Les mots de passe ne correspondent pas');
      return;
    }

    setIsLoading(true);
    try {
      await register(email, password);
      toast.success('Inscription réussie !');
      router.push('/dashboard');
    } catch (err: any) {
      toast.error(err?.error || 'Erreur lors de l\'inscription');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthLayout title="Créer un compte" subtitle="Rejoignez SmartBudget Travel">
      <form onSubmit={handleSubmit} className="space-y-5">
        <FormField
          label="Email"
          id="email"
          type="email"
          placeholder="votre@email.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <FormField
          label="Mot de passe"
          id="password"
          type="password"
          placeholder="Minimum 6 caractères"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        <FormField
          label="Confirmer le mot de passe"
          id="confirmPassword"
          type="password"
          placeholder="••••••••"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          required
        />
        <Button type="submit" size="lg" className="w-full" isLoading={isLoading}>
          Créer mon compte
        </Button>
      </form>
      <p className="text-center text-sm text-gray-500 mt-6">
        Déjà un compte ?{' '}
        <Link href="/login" className="text-primary-600 font-semibold hover:underline">
          Se connecter
        </Link>
      </p>
    </AuthLayout>
  );
}
