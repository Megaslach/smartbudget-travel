'use client';

import { motion } from 'framer-motion';
import { Check } from 'lucide-react';
import Button from '@/components/atoms/Button';
import Badge from '@/components/atoms/Badge';

interface PricingCardProps {
  title: string;
  price: string;
  period?: string;
  subtitle?: string;
  badge?: string;
  features: string[];
  isPremium?: boolean;
  ctaLabel: string;
  onCtaClick: () => void;
  isLoading?: boolean;
  disabled?: boolean;
}

export default function PricingCard({
  title,
  price,
  period,
  subtitle,
  badge,
  features,
  isPremium = false,
  ctaLabel,
  onCtaClick,
  isLoading,
  disabled,
}: PricingCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -8 }}
      className={`
        relative rounded-3xl p-8 border-2 transition-all
        ${isPremium
          ? 'border-primary-600 bg-white shadow-2xl shadow-primary-600/10'
          : 'border-gray-200 bg-white hover:border-gray-300'
        }
      `}
    >
      {badge && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
          <Badge variant="premium">{badge}</Badge>
        </div>
      )}

      <div className="text-center mb-8">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">{title}</h3>
        <div className="flex items-baseline justify-center gap-1">
          <span className="text-5xl font-extrabold text-gray-900">{price}</span>
          {period && <span className="text-gray-500 text-sm">/{period}</span>}
        </div>
        {subtitle && (
          <p className="text-xs text-gray-500 mt-2">{subtitle}</p>
        )}
      </div>

      <ul className="space-y-3 mb-8">
        {features.map((feature, i) => (
          <li key={i} className="flex items-start gap-3">
            <Check className="h-5 w-5 text-primary-500 mt-0.5 flex-shrink-0" />
            <span className="text-sm text-gray-600">{feature}</span>
          </li>
        ))}
      </ul>

      <Button
        variant={isPremium ? 'primary' : 'outline'}
        size="lg"
        className="w-full"
        onClick={onCtaClick}
        isLoading={isLoading}
        disabled={disabled}
      >
        {ctaLabel}
      </Button>
    </motion.div>
  );
}
