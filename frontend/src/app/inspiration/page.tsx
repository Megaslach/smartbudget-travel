'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import DashboardLayout from '@/components/templates/DashboardLayout';
import { getDestinationImage } from '@/lib/images';

const COLLECTIONS: { title: string; destinations: string[] }[] = [
  { title: '✨ Capitales européennes', destinations: ['Paris', 'Rome', 'Lisbonne', 'Berlin'] },
  { title: '🏝 Évasions tropicales',    destinations: ['Bali', 'Maldives', 'Phuket', 'Zanzibar'] },
  { title: '🗾 Asie incontournable',    destinations: ['Tokyo', 'Kyoto', 'Séoul', 'Bangkok'] },
  { title: '🌵 Aventure & nature',      destinations: ['Marrakech', 'Reykjavik', 'Cape Town', 'Cusco'] },
];

export default function InspirationPage() {
  return (
    <DashboardLayout title="Inspiration" description="Des idées triées sur le volet pour votre prochain voyage">
      <div className="space-y-10">
        {COLLECTIONS.map((c) => (
          <section key={c.title}>
            <h2 className="text-xl font-bold text-gray-900 mb-4">{c.title}</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {c.destinations.map((d) => (
                <DestinationCard key={d} name={d} />
              ))}
            </div>
          </section>
        ))}
      </div>
    </DashboardLayout>
  );
}

function DestinationCard({ name }: { name: string }) {
  const [image, setImage] = useState<string | null>(null);

  useEffect(() => {
    getDestinationImage(name).then(setImage).catch(() => {});
  }, [name]);

  return (
    <motion.div whileHover={{ y: -4 }} transition={{ duration: 0.2 }}>
      <Link
        href={`/simulation?destination=${encodeURIComponent(name)}`}
        className="block relative h-56 rounded-2xl overflow-hidden bg-sand-100 shadow-md hover:shadow-xl transition-shadow"
      >
        {image && (
          <img
            src={image}
            alt={name}
            className="absolute inset-0 w-full h-full object-cover"
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 p-4">
          <p className="text-white font-bold text-lg drop-shadow">{name}</p>
        </div>
      </Link>
    </motion.div>
  );
}
