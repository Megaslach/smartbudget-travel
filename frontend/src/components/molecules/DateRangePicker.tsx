'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Plane, PlaneLanding, ArrowRight, ChevronDown, X,
  ChevronLeft, ChevronRight,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

interface DateRangePickerProps {
  startDate: string;
  endDate: string;
  onChange: (startDate: string, endDate: string) => void;
  error?: string;
}

type OpenField = null | 'start' | 'end';

// Format a Date as 'YYYY-MM-DD' in LOCAL time (no UTC shift — fixes off-by-one bug).
const toLocalIso = (d: Date) => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};

// Parse 'YYYY-MM-DD' as a LOCAL date (midnight local time).
const fromLocalIso = (iso: string): Date | null => {
  if (!iso) return null;
  const [y, m, d] = iso.split('-').map(Number);
  if (!y || !m || !d) return null;
  return new Date(y, m - 1, d);
};

const sameDay = (a: Date, b: Date) =>
  a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();

const stripTime = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate());

export default function DateRangePicker({ startDate, endDate, onChange, error }: DateRangePickerProps) {
  const [open, setOpen] = useState<OpenField>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) setOpen(null);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const nights = useMemo(() => {
    if (!startDate || !endDate) return 0;
    const s = fromLocalIso(startDate);
    const e = fromLocalIso(endDate);
    if (!s || !e) return 0;
    return Math.max(0, Math.round((e.getTime() - s.getTime()) / 86400000));
  }, [startDate, endDate]);

  const pretty = (iso: string) => {
    const d = fromLocalIso(iso);
    return d ? format(d, 'EEE d MMM', { locale: fr }) : '';
  };

  const handleStart = (d: Date) => {
    const newStart = toLocalIso(d);
    let nextEnd = endDate;
    const endDateObj = fromLocalIso(endDate);
    if (endDateObj && d >= endDateObj) nextEnd = '';
    onChange(newStart, nextEnd);
    setOpen('end');
  };

  const handleEnd = (d: Date) => {
    onChange(startDate, toLocalIso(d));
    setOpen(null);
  };

  const clear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange('', '');
    setOpen(null);
  };

  const startDateObj = fromLocalIso(startDate);
  const endDateObj = fromLocalIso(endDate);
  const today = stripTime(new Date());

  return (
    <div ref={wrapperRef} className="space-y-1.5 relative">
      <div className={`relative grid grid-cols-[1fr_auto_1fr] items-stretch rounded-2xl border-2 ${
        error ? 'border-red-400' : open ? 'border-primary-500 shadow-lg shadow-primary-500/10' : 'border-gray-200 hover:border-primary-300'
      } bg-white overflow-hidden transition-all`}>
        <DateField
          icon={<Plane className="h-4 w-4" />}
          label="Départ"
          value={startDate}
          pretty={pretty}
          isOpen={open === 'start'}
          onToggle={() => setOpen(open === 'start' ? null : 'start')}
          accent="from-primary-500 to-primary-700"
        />

        <div className="flex items-center justify-center px-1 text-gray-300 pointer-events-none">
          <motion.div
            animate={{ x: [0, 4, 0] }}
            transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
          >
            <ArrowRight className="h-4 w-4" />
          </motion.div>
        </div>

        <DateField
          icon={<PlaneLanding className="h-4 w-4" />}
          label="Retour"
          value={endDate}
          pretty={pretty}
          disabled={!startDate}
          isOpen={open === 'end'}
          onToggle={() => setOpen(open === 'end' ? null : 'end')}
          accent="from-accent-500 to-accent-700"
          align="right"
        />
      </div>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -6, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.98 }}
            transition={{ duration: 0.18 }}
            className="absolute z-50 top-full mt-2 left-0 right-0 flex justify-center"
          >
            <div className="bg-white rounded-2xl border border-gray-100 shadow-2xl shadow-primary-900/10 p-4 w-[320px]">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className={`p-1.5 rounded-lg bg-gradient-to-br ${open === 'start' ? 'from-primary-500 to-primary-700' : 'from-accent-500 to-accent-700'} text-white`}>
                    {open === 'start' ? <Plane className="h-3.5 w-3.5" /> : <PlaneLanding className="h-3.5 w-3.5" />}
                  </div>
                  <span className="text-sm font-bold text-gray-900">
                    {open === 'start' ? 'Date de départ' : 'Date de retour'}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setOpen(null)}
                  className="p-1 rounded-lg hover:bg-gray-100 text-gray-400"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {open === 'start' ? (
                <MonthCalendar
                  value={startDateObj}
                  minDate={today}
                  onSelect={handleStart}
                  accent="primary"
                />
              ) : (
                <MonthCalendar
                  value={endDateObj}
                  minDate={startDateObj && startDateObj > today ? new Date(startDateObj.getTime() + 86400000) : today}
                  onSelect={handleEnd}
                  accent="accent"
                />
              )}

              {(startDate || endDate) && (
                <div className="mt-3 pt-3 border-t border-gray-100 flex items-center justify-between">
                  <button type="button" onClick={clear} className="text-xs text-gray-500 hover:text-red-600 font-medium flex items-center gap-1">
                    <X className="h-3 w-3" /> Effacer
                  </button>
                  {startDate && endDate && (
                    <span className="text-xs font-bold text-primary-600">{nights} nuit{nights > 1 ? 's' : ''}</span>
                  )}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {nights > 0 && !open && (
        <motion.p
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-xs text-primary-600 font-semibold pl-1"
        >
          {nights} nuit{nights > 1 ? 's' : ''} · {pretty(startDate)} → {pretty(endDate)}
        </motion.p>
      )}
      {error && <p className="text-red-500 text-xs pl-1">{error}</p>}
    </div>
  );
}

interface DateFieldProps {
  icon: React.ReactNode;
  label: string;
  value: string;
  disabled?: boolean;
  pretty: (iso: string) => string;
  onToggle: () => void;
  isOpen: boolean;
  accent: string;
  align?: 'left' | 'right';
}

function DateField({ icon, label, value, disabled, pretty, onToggle, isOpen, accent, align = 'left' }: DateFieldProps) {
  return (
    <button
      type="button"
      onClick={onToggle}
      disabled={disabled}
      className={`relative block w-full px-4 py-3 transition-colors text-left ${
        disabled ? 'opacity-50 cursor-not-allowed bg-gray-50' : isOpen ? 'bg-primary-50/50' : 'hover:bg-sand-50 cursor-pointer'
      } ${align === 'right' ? 'text-right' : 'text-left'}`}
    >
      <div className={`flex items-center gap-2 ${align === 'right' ? 'justify-end' : ''}`}>
        <div className={`p-1.5 rounded-lg bg-gradient-to-br ${accent} text-white shadow-sm`}>
          {icon}
        </div>
        <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">{label}</span>
        <ChevronDown className={`h-3 w-3 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </div>
      <div className="mt-1.5">
        {value ? (
          <motion.p
            key={value}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            className="font-display text-base font-bold text-gray-900 leading-tight"
          >
            {pretty(value)}
          </motion.p>
        ) : (
          <p className="font-display text-base font-medium text-gray-400 leading-tight">
            {disabled ? 'Choisir un départ' : 'Sélectionner'}
          </p>
        )}
        <p className="text-[11px] text-gray-400 mt-0.5">
          {value ? fromLocalIso(value)?.getFullYear() ?? '' : 'jj / mm / aaaa'}
        </p>
      </div>
    </button>
  );
}

// --- Custom month grid ---

const WEEKDAYS = ['L', 'M', 'M', 'J', 'V', 'S', 'D'];

interface MonthCalendarProps {
  value: Date | null;
  minDate?: Date;
  onSelect: (d: Date) => void;
  accent: 'primary' | 'accent';
}

function MonthCalendar({ value, minDate, onSelect, accent }: MonthCalendarProps) {
  const [cursor, setCursor] = useState(() => {
    const d = value ?? minDate ?? new Date();
    return new Date(d.getFullYear(), d.getMonth(), 1);
  });

  const year = cursor.getFullYear();
  const month = cursor.getMonth();

  const firstOfMonth = new Date(year, month, 1);
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  // JS Sunday=0 → shift so Monday=0
  const leadingBlanks = (firstOfMonth.getDay() + 6) % 7;

  const today = stripTime(new Date());
  const floorMin = minDate ? stripTime(minDate) : null;

  const cells: (Date | null)[] = [];
  for (let i = 0; i < leadingBlanks; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(new Date(year, month, d));
  // Pad to 42 for fixed height grid (6 rows)
  while (cells.length < 42) cells.push(null);

  const accentGradient = accent === 'primary'
    ? 'from-primary-500 to-primary-700 shadow-primary-500/30'
    : 'from-accent-500 to-accent-700 shadow-accent-500/30';

  const accentHover = accent === 'primary' ? 'hover:bg-primary-50 hover:text-primary-700' : 'hover:bg-accent-50 hover:text-accent-700';

  return (
    <div>
      {/* Month/year header */}
      <div className="flex items-center justify-between mb-3 px-1">
        <button
          type="button"
          onClick={() => setCursor(new Date(year, month - 1, 1))}
          className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 hover:text-gray-900 transition-colors"
          aria-label="Mois précédent"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        <motion.span
          key={`${year}-${month}`}
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          className="font-display text-sm font-bold text-gray-900 capitalize"
        >
          {format(firstOfMonth, 'MMMM yyyy', { locale: fr })}
        </motion.span>
        <button
          type="button"
          onClick={() => setCursor(new Date(year, month + 1, 1))}
          className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 hover:text-gray-900 transition-colors"
          aria-label="Mois suivant"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>

      {/* Weekdays */}
      <div className="grid grid-cols-7 gap-1 mb-1">
        {WEEKDAYS.map((w, i) => (
          <div key={i} className="h-7 flex items-center justify-center text-[10px] font-bold text-gray-400 uppercase tracking-wider">
            {w}
          </div>
        ))}
      </div>

      {/* Day grid */}
      <motion.div
        key={`${year}-${month}`}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.18 }}
        className="grid grid-cols-7 gap-1"
      >
        {cells.map((d, i) => {
          if (!d) return <div key={i} className="h-9" />;
          const disabled = floorMin ? d < floorMin : false;
          const selected = value ? sameDay(d, value) : false;
          const isToday = sameDay(d, today);

          return (
            <button
              key={i}
              type="button"
              disabled={disabled}
              onClick={() => onSelect(d)}
              className={`h-9 w-9 mx-auto rounded-full text-sm font-medium transition-all flex items-center justify-center
                ${selected
                  ? `bg-gradient-to-br ${accentGradient} text-white font-bold shadow-md`
                  : disabled
                    ? 'text-gray-300 cursor-not-allowed'
                    : isToday
                      ? 'text-primary-700 font-bold ring-1 ring-primary-300'
                      : `text-gray-700 ${accentHover}`
                }`}
            >
              {d.getDate()}
            </button>
          );
        })}
      </motion.div>
    </div>
  );
}
