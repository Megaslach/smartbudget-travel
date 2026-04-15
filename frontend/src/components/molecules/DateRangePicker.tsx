'use client';

import { useEffect, useRef, useState } from 'react';
import { DayPicker, DateRange } from 'react-day-picker';
import { fr } from 'date-fns/locale';
import { format } from 'date-fns';
import { AnimatePresence, motion } from 'framer-motion';
import { Calendar, ArrowRight, X } from 'lucide-react';
import 'react-day-picker/style.css';

interface DateRangePickerProps {
  startDate: string;
  endDate: string;
  onChange: (startDate: string, endDate: string) => void;
  error?: string;
}

export default function DateRangePicker({ startDate, endDate, onChange, error }: DateRangePickerProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const range: DateRange | undefined = startDate
    ? { from: new Date(startDate), to: endDate ? new Date(endDate) : undefined }
    : undefined;

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleSelect = (r: DateRange | undefined) => {
    if (!r) {
      onChange('', '');
      return;
    }
    const iso = (d?: Date) => d ? d.toISOString().split('T')[0] : '';
    onChange(iso(r.from), iso(r.to));
    if (r.from && r.to) {
      setTimeout(() => setOpen(false), 200);
    }
  };

  const clear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange('', '');
  };

  const display = () => {
    if (!startDate) return 'Sélectionner vos dates';
    const start = format(new Date(startDate), 'd MMM', { locale: fr });
    if (!endDate) return `${start} → ?`;
    const end = format(new Date(endDate), 'd MMM yyyy', { locale: fr });
    return `${start} → ${end}`;
  };

  const nights = startDate && endDate
    ? Math.max(1, Math.ceil((new Date(endDate).getTime() - new Date(startDate).getTime()) / (1000 * 60 * 60 * 24)))
    : 0;

  return (
    <div ref={ref} className="relative">
      <label className="block text-sm font-medium text-gray-700 mb-1.5">
        <Calendar className="inline h-4 w-4 mr-1 text-gray-400" />Dates du voyage
      </label>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className={`w-full flex items-center justify-between px-4 py-3 rounded-xl border ${error ? 'border-red-400' : open ? 'border-primary-500 ring-2 ring-primary-500/20' : 'border-gray-200'} bg-sand-50 transition-all text-left`}
      >
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div className={`p-1.5 rounded-lg ${startDate ? 'bg-primary-100 text-primary-600' : 'bg-gray-100 text-gray-400'}`}>
            <Calendar className="h-4 w-4" />
          </div>
          <div className="flex-1 min-w-0">
            <span className={`text-sm font-medium truncate block ${startDate ? 'text-gray-900' : 'text-gray-400'}`}>{display()}</span>
            {nights > 0 && <span className="text-xs text-primary-600 font-medium">{nights} nuit{nights > 1 ? 's' : ''}</span>}
          </div>
        </div>
        {startDate && (
          <button type="button" onClick={clear} className="p-1 rounded-full hover:bg-gray-200 text-gray-400">
            <X className="h-3.5 w-3.5" />
          </button>
        )}
        <ArrowRight className={`h-4 w-4 text-gray-400 transition-transform ${open ? 'rotate-90' : ''}`} />
      </button>
      {error && <p className="text-red-500 text-xs mt-1">{error}</p>}

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -4, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.98 }}
            className="absolute z-50 top-full mt-2 left-0 bg-white rounded-2xl border border-gray-100 shadow-2xl p-4 sm:p-5"
          >
            <DayPicker
              mode="range"
              numberOfMonths={2}
              selected={range}
              onSelect={handleSelect}
              locale={fr}
              disabled={{ before: new Date() }}
              weekStartsOn={1}
              classNames={{
                root: 'rdp-custom',
                months: 'flex gap-6 flex-col sm:flex-row',
                month_caption: 'font-display text-base font-bold text-gray-900 mb-3',
                weekday: 'text-xs font-semibold text-gray-400 uppercase',
                day: 'rounded-lg hover:bg-primary-50 transition-colors text-sm',
                day_button: 'h-9 w-9 flex items-center justify-center font-medium',
                selected: '!bg-primary-600 !text-white hover:!bg-primary-700',
                range_start: '!bg-primary-600 !text-white rounded-l-full',
                range_end: '!bg-primary-600 !text-white rounded-r-full',
                range_middle: '!bg-primary-100 !text-primary-900 rounded-none',
                today: 'font-bold text-primary-600',
                disabled: 'text-gray-300 cursor-not-allowed hover:!bg-transparent',
                chevron: 'fill-primary-600',
              }}
            />
            {nights > 0 && (
              <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between">
                <div className="text-sm">
                  <span className="text-gray-500">Séjour :</span>{' '}
                  <span className="font-bold text-primary-600">{nights} nuit{nights > 1 ? 's' : ''}</span>
                </div>
                <button type="button" onClick={() => setOpen(false)} className="text-sm px-4 py-1.5 rounded-lg bg-primary-600 text-white font-medium hover:bg-primary-700">
                  Valider
                </button>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
