'use client';

import { motion } from 'framer-motion';
import { Plane } from 'lucide-react';

interface LoaderProps {
  size?: 'sm' | 'md' | 'lg';
  text?: string;
  variant?: 'spinner' | 'plane';
}

const sizeMap = { sm: 'h-6 w-6', md: 'h-10 w-10', lg: 'h-16 w-16' };

export default function Loader({ size = 'md', text, variant }: LoaderProps) {
  // Default to the plane variant for large loaders (on-brand for a travel app),
  // spinner for smaller inline uses.
  const resolvedVariant = variant ?? (size === 'lg' ? 'plane' : 'spinner');

  return (
    <div className="flex flex-col items-center justify-center gap-4">
      {resolvedVariant === 'plane' ? <PlaneLoader /> : <Spinner size={size} />}

      {text && (
        <motion.p
          key={text}
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-sm text-gray-600 font-medium text-center max-w-xs"
        >
          {text}
        </motion.p>
      )}
    </div>
  );
}

function Spinner({ size }: { size: 'sm' | 'md' | 'lg' }) {
  return (
    <div className="relative">
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
        className={`${sizeMap[size]} rounded-full border-[3px] border-gray-100 border-t-primary-600 border-r-primary-600/40`}
      />
      <motion.div
        animate={{ rotate: -360 }}
        transition={{ duration: 1.6, repeat: Infinity, ease: 'linear' }}
        className={`absolute inset-1 rounded-full border-2 border-transparent border-t-accent-500/70`}
      />
    </div>
  );
}

function PlaneLoader() {
  // A plane traces a gentle arc, leaving a dashed trail behind.
  // Two dots (origin / destination) pulse softly at each end.
  return (
    <div className="relative w-56 h-24">
      <svg viewBox="0 0 220 90" className="absolute inset-0 w-full h-full">
        <defs>
          <linearGradient id="arc-grad" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="var(--color-primary-400, #4ca3d1)" stopOpacity="0.1" />
            <stop offset="50%" stopColor="var(--color-primary-600, #2a6f97)" stopOpacity="0.7" />
            <stop offset="100%" stopColor="var(--color-accent-500, #e8b863)" stopOpacity="0.9" />
          </linearGradient>
        </defs>

        {/* Dashed arc — animates drawing itself */}
        <motion.path
          d="M 20 70 Q 110 0 200 70"
          fill="none"
          stroke="url(#arc-grad)"
          strokeWidth="2"
          strokeDasharray="4 5"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: [0, 1, 1] }}
          transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut', times: [0, 0.6, 1] }}
        />

        {/* Origin pin */}
        <motion.circle
          cx="20" cy="70" r="4"
          className="fill-primary-600"
          animate={{ scale: [1, 1.4, 1] }}
          transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut' }}
        />
        <circle cx="20" cy="70" r="10" className="fill-primary-400/20" />

        {/* Destination pin */}
        <motion.circle
          cx="200" cy="70" r="4"
          className="fill-accent-500"
          animate={{ scale: [1, 1.4, 1] }}
          transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut', delay: 0.8 }}
        />
        <circle cx="200" cy="70" r="10" className="fill-accent-400/20" />
      </svg>

      {/* Plane riding the arc — approximates the Q curve using two motion axes */}
      <motion.div
        className="absolute"
        style={{ top: 0, left: 0 }}
        animate={{
          x: [20 - 10, 110 - 10, 200 - 10],
          y: [70 - 10, 15 - 10, 70 - 10],
          rotate: [35, 0, -35],
        }}
        transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut' }}
      >
        <div className="relative">
          <div className="absolute inset-0 rounded-full bg-primary-400/50 blur-md" />
          <div className="relative p-1.5 rounded-full bg-gradient-to-br from-primary-500 to-primary-700 text-white shadow-lg">
            <Plane className="h-4 w-4 -rotate-45" />
          </div>
        </div>
      </motion.div>

      {/* Three soft clouds drifting across */}
      {[0, 1, 2].map((i) => (
        <motion.div
          key={i}
          className="absolute top-2 text-gray-200 text-xl select-none"
          initial={{ x: -20, opacity: 0 }}
          animate={{ x: 240, opacity: [0, 0.6, 0] }}
          transition={{
            duration: 6,
            repeat: Infinity,
            delay: i * 2,
            ease: 'linear',
          }}
          style={{ top: 4 + i * 14 }}
        >
          ☁
        </motion.div>
      ))}
    </div>
  );
}
