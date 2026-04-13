import type { Metadata } from 'next';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from '@/context/AuthContext';
import './globals.css';

export const metadata: Metadata = {
  title: 'SmartBudget Travel — Simulez votre budget voyage',
  description: 'Simulez votre budget de voyage et générez un itinéraire personnalisé avec l\'IA.',
  icons: { icon: '/favicon.svg' },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <body>
        <AuthProvider>
          {children}
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 4000,
              style: { borderRadius: '12px', background: '#333', color: '#fff' },
            }}
          />
        </AuthProvider>
      </body>
    </html>
  );
}
