'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { MapPin, Clock, Users } from 'lucide-react';
import Button from '@/components/atoms/Button';
import FormField from '@/components/molecules/FormField';

interface SimulationFormProps {
  onSubmit: (data: { destination: string; duration: number; people: number }) => Promise<void>;
  isLoading: boolean;
}

export default function SimulationForm({ onSubmit, isLoading }: SimulationFormProps) {
  const [destination, setDestination] = useState('');
  const [duration, setDuration] = useState('');
  const [people, setPeople] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!destination.trim()) newErrors.destination = 'Destination requise';
    if (!duration || parseInt(duration) < 1) newErrors.duration = 'Durée minimum 1 jour';
    if (parseInt(duration) > 30) newErrors.duration = 'Durée maximum 30 jours';
    if (!people || parseInt(people) < 1) newErrors.people = 'Minimum 1 personne';
    if (parseInt(people) > 20) newErrors.people = 'Maximum 20 personnes';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    await onSubmit({
      destination: destination.trim(),
      duration: parseInt(duration),
      people: parseInt(people),
    });
  };

  return (
    <motion.form
      onSubmit={handleSubmit}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <div className="relative">
        <MapPin className="absolute left-4 top-[42px] h-5 w-5 text-gray-400 z-10" />
        <FormField
          label="Destination"
          id="destination"
          placeholder="Ex: Paris, Tokyo, Bali..."
          value={destination}
          onChange={(e) => setDestination(e.target.value)}
          error={errors.destination}
          required
          className="pl-12"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="relative">
          <Clock className="absolute left-4 top-[42px] h-5 w-5 text-gray-400 z-10" />
          <FormField
            label="Durée (jours)"
            id="duration"
            type="number"
            min="1"
            max="30"
            placeholder="7"
            value={duration}
            onChange={(e) => setDuration(e.target.value)}
            error={errors.duration}
            required
            className="pl-12"
          />
        </div>

        <div className="relative">
          <Users className="absolute left-4 top-[42px] h-5 w-5 text-gray-400 z-10" />
          <FormField
            label="Voyageurs"
            id="people"
            type="number"
            min="1"
            max="20"
            placeholder="2"
            value={people}
            onChange={(e) => setPeople(e.target.value)}
            error={errors.people}
            required
            className="pl-12"
          />
        </div>
      </div>

      <Button type="submit" size="lg" className="w-full" isLoading={isLoading}>
        Estimer mon budget
      </Button>
    </motion.form>
  );
}
