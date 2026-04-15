import type { Simulation } from '@/types';

const PRIMARY: [number, number, number] = [16, 94, 84];
const PRIMARY_LIGHT: [number, number, number] = [230, 243, 241];
const ACCENT: [number, number, number] = [233, 116, 81];
const TEXT: [number, number, number] = [31, 41, 55];
const MUTED: [number, number, number] = [107, 114, 128];
const BORDER: [number, number, number] = [229, 231, 235];
const BG_SOFT: [number, number, number] = [249, 250, 251];

const prettyDate = (iso: string) => {
  try {
    const [y, m, d] = iso.split('-').map(Number);
    if (!y || !m || !d) return iso;
    return new Date(y, m - 1, d).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
  } catch {
    return iso;
  }
};

const eur = (n: number) => `${Math.round(n).toLocaleString('fr-FR')} €`;

export async function exportSimulationPdf(sim: Simulation): Promise<void> {
  const { default: jsPDF } = await import('jspdf');
  const pdf = new jsPDF({ orientation: 'p', unit: 'mm', format: 'a4' });

  const budget = sim.budgetData ?? (typeof sim.budget === 'object' ? sim.budget : null);
  if (!budget) throw new Error('Aucune donnée de budget disponible');

  const pageW = pdf.internal.pageSize.getWidth();
  const pageH = pdf.internal.pageSize.getHeight();
  const margin = 15;
  const contentW = pageW - margin * 2;
  let y = margin;

  // ---------- HEADER / COVER ----------
  pdf.setFillColor(...PRIMARY);
  pdf.rect(0, 0, pageW, 72, 'F');

  // Subtle accent stripe
  pdf.setFillColor(...ACCENT);
  pdf.rect(0, 68, pageW, 4, 'F');

  // Brand
  pdf.setTextColor(255, 255, 255);
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(10);
  pdf.text('SMARTBUDGET TRAVEL', margin, 14);
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(8);
  pdf.text('Budget voyage intelligent', margin, 19);

  // Destination + dates
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(26);
  pdf.text(sim.destination, margin, 40);

  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(11);
  pdf.setTextColor(230, 243, 241);
  const periodText = `${prettyDate(sim.startDate)} → ${prettyDate(sim.endDate)}`;
  pdf.text(periodText, margin, 48);

  // Trip meta chips
  pdf.setFontSize(9);
  pdf.setTextColor(255, 255, 255);
  const chips = [
    `${sim.duration} jour${sim.duration > 1 ? 's' : ''}`,
    `${sim.people} voyageur${sim.people > 1 ? 's' : ''}`,
    sim.departureCity ? `Depuis ${sim.departureCity}` : null,
  ].filter(Boolean) as string[];
  let cx = margin;
  const chipY = 56;
  chips.forEach((chip) => {
    const w = pdf.getTextWidth(chip) + 6;
    pdf.setFillColor(255, 255, 255);
    pdf.setDrawColor(255, 255, 255);
    pdf.roundedRect(cx, chipY - 4, w, 7, 2, 2, 'S');
    pdf.text(chip, cx + 3, chipY + 1);
    cx += w + 4;
  });

  y = 82;

  // ---------- BUDGET HIGHLIGHT ----------
  pdf.setFillColor(...PRIMARY_LIGHT);
  pdf.roundedRect(margin, y, contentW, 32, 4, 4, 'F');

  pdf.setTextColor(...MUTED);
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(9);
  pdf.text('BUDGET ESTIMÉ (GROUPE)', margin + 6, y + 9);

  pdf.setTextColor(...PRIMARY);
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(28);
  pdf.text(eur(budget.total), margin + 6, y + 22);

  if (sim.people > 1) {
    const perPers = Math.round(budget.total / sim.people);
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(10);
    pdf.setTextColor(...TEXT);
    pdf.text(`${eur(perPers)} / personne`, margin + 6, y + 29);
  }

  const confLabel = budget.confidence === 'high' ? 'Fiabilité haute'
    : budget.confidence === 'medium' ? 'Fiabilité moyenne' : 'Estimation approximative';
  const confColor: [number, number, number] = budget.confidence === 'high' ? [16, 185, 129]
    : budget.confidence === 'medium' ? [245, 158, 11] : [239, 68, 68];
  pdf.setFillColor(...confColor);
  const confW = pdf.getTextWidth(confLabel) + 6;
  pdf.roundedRect(margin + contentW - confW - 6, y + 6, confW, 7, 2, 2, 'F');
  pdf.setTextColor(255, 255, 255);
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(8);
  pdf.text(confLabel, margin + contentW - confW - 3, y + 11);

  y += 40;

  // ---------- SUMMARY ----------
  if (budget.summary) {
    y = ensureSpace(pdf, y, 30, margin);
    pdf.setTextColor(...TEXT);
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(9);
    const summary = pdf.splitTextToSize(budget.summary, contentW);
    pdf.text(summary, margin, y);
    y += summary.length * 4.5 + 6;
  }

  // ---------- BREAKDOWN TABLE ----------
  y = ensureSpace(pdf, y, 60, margin);
  sectionHeader(pdf, 'Répartition du budget', margin, y, contentW);
  y += 10;

  const activitiesTotal = typeof budget.activities === 'object' ? budget.activities.total : budget.activities;
  const flightsTotal = budget.flights.avgPrice * sim.people;
  const rows: Array<[string, number, string]> = [
    ['Vols (A/R)', flightsTotal, `${eur(budget.flights.avgPrice)} × ${sim.people} pers.`],
    ['Hébergement', budget.accommodation.total, `${eur(budget.accommodation.avgPerNight)}/nuit × ${sim.duration} nuit${sim.duration > 1 ? 's' : ''}`],
    ['Restauration', budget.food, `Groupe entier`],
    ['Transport sur place', budget.transport, 'Métro, taxis, transferts'],
    ['Activités', activitiesTotal, `${sim.people} pers.`],
  ];

  const colX = [margin, margin + 70, margin + 130, margin + contentW];
  // Header row
  pdf.setFillColor(...BG_SOFT);
  pdf.rect(margin, y, contentW, 8, 'F');
  pdf.setTextColor(...MUTED);
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(8);
  pdf.text('CATÉGORIE', colX[0] + 2, y + 5.5);
  pdf.text('DÉTAIL', colX[1] + 2, y + 5.5);
  pdf.text('%', colX[2] - 8, y + 5.5);
  pdf.text('MONTANT', colX[3] - 2, y + 5.5, { align: 'right' });
  y += 8;

  pdf.setTextColor(...TEXT);
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(9);
  rows.forEach(([label, amount, hint], i) => {
    y = ensureSpace(pdf, y, 10, margin);
    if (i % 2 === 1) {
      pdf.setFillColor(...BG_SOFT);
      pdf.rect(margin, y, contentW, 9, 'F');
    }
    pdf.setDrawColor(...BORDER);
    pdf.setLineWidth(0.1);
    pdf.line(margin, y + 9, margin + contentW, y + 9);

    pdf.setFont('helvetica', 'bold');
    pdf.text(label, colX[0] + 2, y + 6);
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(...MUTED);
    pdf.text(hint, colX[1] + 2, y + 6);
    const pct = Math.round((amount / budget.total) * 100);
    pdf.setTextColor(...TEXT);
    pdf.text(`${pct}%`, colX[2] - 8, y + 6);
    pdf.setFont('helvetica', 'bold');
    pdf.text(eur(amount), colX[3] - 2, y + 6, { align: 'right' });
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(...TEXT);
    y += 9;
  });

  // Total row
  pdf.setFillColor(...PRIMARY);
  pdf.rect(margin, y, contentW, 10, 'F');
  pdf.setTextColor(255, 255, 255);
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(10);
  pdf.text('TOTAL', colX[0] + 2, y + 6.5);
  pdf.text(eur(budget.total), colX[3] - 2, y + 6.5, { align: 'right' });
  y += 16;

  // ---------- FLIGHTS ----------
  if (budget.flights.options && budget.flights.options.length > 0) {
    y = ensureSpace(pdf, y, 40, margin);
    sectionHeader(pdf, `Vols — ${budget.flights.isRealData ? 'Prix réels' : 'Prix indicatifs'}`, margin, y, contentW);
    y += 10;

    budget.flights.options.slice(0, 5).forEach((f) => {
      y = ensureSpace(pdf, y, 14, margin);
      pdf.setDrawColor(...BORDER);
      pdf.roundedRect(margin, y, contentW, 12, 2, 2, 'S');
      pdf.setTextColor(...TEXT);
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(9);
      pdf.text(f.airline.substring(0, 40), margin + 4, y + 5);
      pdf.setFont('helvetica', 'normal');
      pdf.setTextColor(...MUTED);
      pdf.setFontSize(8);
      const sub = [f.type, f.duration || ''].filter(Boolean).join(' · ');
      pdf.text(sub, margin + 4, y + 9.5);
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(...PRIMARY);
      pdf.setFontSize(10);
      pdf.text(`${eur(f.price)}/pers`, margin + contentW - 4, y + 7, { align: 'right' });
      y += 14;
    });
    y += 4;
  }

  // ---------- HOTELS ----------
  if (budget.accommodation.options && budget.accommodation.options.length > 0) {
    y = ensureSpace(pdf, y, 40, margin);
    sectionHeader(pdf, `Hébergement — ${budget.accommodation.isRealData ? 'Prix réels' : 'Prix indicatifs'}`, margin, y, contentW);
    y += 10;

    budget.accommodation.options.slice(0, 5).forEach((h) => {
      y = ensureSpace(pdf, y, 14, margin);
      pdf.setDrawColor(...BORDER);
      pdf.roundedRect(margin, y, contentW, 12, 2, 2, 'S');
      pdf.setTextColor(...TEXT);
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(9);
      pdf.text(h.name.substring(0, 48), margin + 4, y + 5);
      pdf.setFont('helvetica', 'normal');
      pdf.setTextColor(...MUTED);
      pdf.setFontSize(8);
      const sub = [h.type, h.rating ? `${h.rating}★` : ''].filter(Boolean).join(' · ');
      pdf.text(sub, margin + 4, y + 9.5);
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(...PRIMARY);
      pdf.setFontSize(10);
      pdf.text(`${eur(h.pricePerNight)}/nuit`, margin + contentW - 4, y + 7, { align: 'right' });
      y += 14;
    });
    y += 4;
  }

  // ---------- LOCAL TRANSPORT ----------
  if (budget.localTransport && (budget.localTransport.carRentals.options.length > 0 || budget.localTransport.publicTransport.options.length > 0)) {
    y = ensureSpace(pdf, y, 40, margin);
    sectionHeader(pdf, 'Transport sur place', margin, y, contentW);
    y += 10;

    if (budget.localTransport.recommendation) {
      pdf.setTextColor(...MUTED);
      pdf.setFont('helvetica', 'italic');
      pdf.setFontSize(8);
      const wrapped = pdf.splitTextToSize(budget.localTransport.recommendation, contentW);
      pdf.text(wrapped, margin, y);
      y += wrapped.length * 4 + 3;
    }

    if (budget.localTransport.carRentals.options.length > 0) {
      y = ensureSpace(pdf, y, 20, margin);
      pdf.setTextColor(...TEXT);
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(9);
      pdf.text('Location de voiture', margin, y + 4);
      y += 7;

      budget.localTransport.carRentals.options.slice(0, 6).forEach((c) => {
        y = ensureSpace(pdf, y, 14, margin);
        pdf.setDrawColor(...BORDER);
        pdf.roundedRect(margin, y, contentW, 12, 2, 2, 'S');
        pdf.setTextColor(...TEXT);
        pdf.setFont('helvetica', 'bold');
        pdf.setFontSize(9);
        pdf.text(`${c.provider} — ${c.category}`.substring(0, 48), margin + 4, y + 5);
        pdf.setFont('helvetica', 'normal');
        pdf.setTextColor(...MUTED);
        pdf.setFontSize(8);
        const sub = [c.location, c.features.slice(0, 2).join(' · ')].filter(Boolean).join(' · ');
        pdf.text(sub.substring(0, 70), margin + 4, y + 9.5);
        pdf.setFont('helvetica', 'bold');
        pdf.setTextColor(...PRIMARY);
        pdf.setFontSize(10);
        pdf.text(`${eur(c.pricePerDay)}/jour`, margin + contentW - 4, y + 7, { align: 'right' });
        y += 14;
      });
      y += 2;
    }

    if (budget.localTransport.publicTransport.options.length > 0) {
      y = ensureSpace(pdf, y, 20, margin);
      pdf.setTextColor(...TEXT);
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(9);
      pdf.text('Transports & taxi', margin, y + 4);
      y += 7;

      budget.localTransport.publicTransport.options.forEach((t) => {
        y = ensureSpace(pdf, y, 10, margin);
        pdf.setDrawColor(...BORDER);
        pdf.roundedRect(margin, y, contentW, 8, 2, 2, 'S');
        pdf.setTextColor(...TEXT);
        pdf.setFont('helvetica', 'bold');
        pdf.setFontSize(8);
        pdf.text(t.name.substring(0, 36), margin + 3, y + 3.5);
        pdf.setFont('helvetica', 'normal');
        pdf.setTextColor(...MUTED);
        pdf.setFontSize(7);
        pdf.text(t.description.substring(0, 60), margin + 3, y + 6.5);
        pdf.setFont('helvetica', 'bold');
        pdf.setTextColor(...PRIMARY);
        pdf.setFontSize(9);
        pdf.text(eur(t.price), margin + contentW - 3, y + 5, { align: 'right' });
        y += 10;
      });
      y += 4;
    }
  }

  // ---------- ACTIVITIES ----------
  if (typeof budget.activities === 'object' && budget.activities.options?.length) {
    y = ensureSpace(pdf, y, 40, margin);
    sectionHeader(pdf, 'Activités incontournables', margin, y, contentW);
    y += 10;

    budget.activities.options.slice(0, 6).forEach((a) => {
      y = ensureSpace(pdf, y, 12, margin);
      pdf.setDrawColor(...BORDER);
      pdf.roundedRect(margin, y, contentW, 10, 2, 2, 'S');
      pdf.setTextColor(...TEXT);
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(9);
      pdf.text(a.name.substring(0, 48), margin + 4, y + 4.5);
      pdf.setFont('helvetica', 'normal');
      pdf.setTextColor(...MUTED);
      pdf.setFontSize(8);
      pdf.text(a.duration || '', margin + 4, y + 8);
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(...PRIMARY);
      pdf.setFontSize(10);
      pdf.text(`${eur(a.price)}/pers`, margin + contentW - 4, y + 6, { align: 'right' });
      y += 12;
    });
    y += 4;
  }

  // ---------- ITINERARY ----------
  if (sim.itinerary?.days?.length) {
    pdf.addPage();
    y = margin;
    sectionHeader(pdf, `Itinéraire — ${sim.itinerary.days.length} jour${sim.itinerary.days.length > 1 ? 's' : ''}`, margin, y, contentW);
    y += 10;

    sim.itinerary.days.forEach((day) => {
      y = ensureSpace(pdf, y, 30, margin);

      // Day header
      pdf.setFillColor(...PRIMARY);
      pdf.roundedRect(margin, y, contentW, 9, 2, 2, 'F');
      pdf.setTextColor(255, 255, 255);
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(9);
      pdf.text(`Jour ${day.day} · ${prettyDate(day.date)}`, margin + 4, y + 6);
      if (day.title) {
        pdf.setFont('helvetica', 'normal');
        pdf.text(day.title.substring(0, 50), margin + contentW - 4, y + 6, { align: 'right' });
      }
      y += 11;

      if (day.summary) {
        pdf.setTextColor(...MUTED);
        pdf.setFont('helvetica', 'italic');
        pdf.setFontSize(8);
        const wrapped = pdf.splitTextToSize(day.summary, contentW);
        pdf.text(wrapped, margin, y);
        y += wrapped.length * 3.8 + 3;
      }

      day.activities.forEach((act) => {
        y = ensureSpace(pdf, y, 16, margin);
        const slotLabel = act.time === 'morning' ? 'MATIN' : act.time === 'afternoon' ? 'A-M' : 'SOIR';
        pdf.setFillColor(...PRIMARY_LIGHT);
        pdf.roundedRect(margin, y, 14, 6, 1, 1, 'F');
        pdf.setTextColor(...PRIMARY);
        pdf.setFont('helvetica', 'bold');
        pdf.setFontSize(7);
        pdf.text(slotLabel, margin + 2, y + 4);

        pdf.setTextColor(...TEXT);
        pdf.setFont('helvetica', 'bold');
        pdf.setFontSize(9);
        pdf.text(act.title.substring(0, 55), margin + 18, y + 4);

        if (act.estimatedCost && act.estimatedCost > 0) {
          pdf.setTextColor(...ACCENT);
          pdf.setFont('helvetica', 'bold');
          pdf.setFontSize(8);
          pdf.text(eur(act.estimatedCost), margin + contentW - 2, y + 4, { align: 'right' });
        }
        y += 6;

        pdf.setTextColor(...MUTED);
        pdf.setFont('helvetica', 'normal');
        pdf.setFontSize(8);
        const desc = pdf.splitTextToSize(act.description, contentW - 20);
        pdf.text(desc.slice(0, 3), margin + 18, y + 3);
        y += Math.min(desc.length, 3) * 3.5 + 2;

        if (act.location) {
          pdf.setTextColor(...MUTED);
          pdf.setFontSize(7);
          pdf.text(`• ${act.location}  ${act.duration ? `· ${act.duration}` : ''}`.substring(0, 90), margin + 18, y);
          y += 4;
        }
        y += 1;
      });

      y += 4;
    });
  }

  // ---------- AI TIPS ----------
  if (sim.aiTips?.tips?.length) {
    y = ensureSpace(pdf, y, 50, margin);
    if (y > margin + 10) {
      pdf.addPage();
      y = margin;
    }
    sectionHeader(pdf, 'Conseils IA pour économiser', margin, y, contentW);
    y += 10;

    sim.aiTips.tips.slice(0, 8).forEach((tip) => {
      y = ensureSpace(pdf, y, 20, margin);
      pdf.setDrawColor(...BORDER);
      pdf.setFillColor(255, 255, 255);
      pdf.roundedRect(margin, y, contentW, 18, 2, 2, 'S');

      pdf.setTextColor(...PRIMARY);
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(10);
      pdf.text(tip.title.substring(0, 60), margin + 4, y + 6);

      if (tip.potentialSaving) {
        pdf.setTextColor(...ACCENT);
        pdf.setFont('helvetica', 'bold');
        pdf.setFontSize(9);
        pdf.text(`-${eur(tip.potentialSaving)}`, margin + contentW - 4, y + 6, { align: 'right' });
      }

      pdf.setTextColor(...TEXT);
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(8);
      const desc = pdf.splitTextToSize(tip.description, contentW - 8);
      pdf.text(desc.slice(0, 2), margin + 4, y + 11);
      y += 20;
    });

    if (sim.aiTips.bestBookingWindow || sim.aiTips.priceOutlookNote) {
      y = ensureSpace(pdf, y, 20, margin);
      pdf.setFillColor(...PRIMARY_LIGHT);
      pdf.roundedRect(margin, y, contentW, 16, 2, 2, 'F');
      pdf.setTextColor(...PRIMARY);
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(9);
      pdf.text('Fenêtre de réservation idéale', margin + 4, y + 5);
      pdf.setTextColor(...TEXT);
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(8);
      const note = `${sim.aiTips.bestBookingWindow || ''} ${sim.aiTips.priceOutlookNote || ''}`.trim();
      const wrapped = pdf.splitTextToSize(note, contentW - 8);
      pdf.text(wrapped.slice(0, 2), margin + 4, y + 10);
      y += 18;
    }
  }

  // ---------- FOOTER on all pages ----------
  const pageCount = pdf.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    pdf.setPage(i);
    pdf.setDrawColor(...BORDER);
    pdf.setLineWidth(0.2);
    pdf.line(margin, pageH - 10, pageW - margin, pageH - 10);
    pdf.setTextColor(...MUTED);
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(7);
    pdf.text('SmartBudget Travel — Estimations indicatives, vérifiez les prix avant de réserver.', margin, pageH - 6);
    pdf.text(`${i} / ${pageCount}`, pageW - margin, pageH - 6, { align: 'right' });
    pdf.text(new Date().toLocaleDateString('fr-FR'), pageW / 2, pageH - 6, { align: 'center' });
  }

  const safeName = sim.destination.replace(/[^a-z0-9]+/gi, '-').toLowerCase();
  pdf.save(`smartbudget-${safeName}-${sim.startDate}.pdf`);
}

function sectionHeader(pdf: any, title: string, x: number, y: number, w: number) {
  pdf.setFillColor(...PRIMARY);
  pdf.rect(x, y, 3, 8, 'F');
  pdf.setTextColor(...TEXT);
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(12);
  pdf.text(title, x + 6, y + 6);
  pdf.setDrawColor(...BORDER);
  pdf.setLineWidth(0.3);
  pdf.line(x, y + 9, x + w, y + 9);
}

function ensureSpace(pdf: any, y: number, needed: number, margin: number): number {
  const pageH = pdf.internal.pageSize.getHeight();
  if (y + needed > pageH - 15) {
    pdf.addPage();
    return margin;
  }
  return y;
}
