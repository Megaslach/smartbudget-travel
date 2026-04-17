import type { Metadata } from 'next';
import Script from 'next/script';
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
      <head>
        <Script
          id="travelpayouts-pixel"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `(function(){var s=document.createElement("script");s.async=1;s.src="https://tp-em.com/NTE5Njcw.js?t=519670";document.head.appendChild(s);})();`,
          }}
        />
      </head>
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
