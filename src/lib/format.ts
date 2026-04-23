/**
 * Formatadores compartilhados (PT-BR).
 * Use sempre estes helpers em vez de strings inline para garantir consistência.
 */

export function formatSexo(s: string | null | undefined): string {
  if (!s) return 'Não informado';
  const v = s.toString().trim().toUpperCase();
  if (v === 'F' || v === 'FEMININO') return 'Feminino';
  if (v === 'M' || v === 'MASCULINO') return 'Masculino';
  if (v === 'O' || v === 'OUTRO' || v === 'OUTROS') return 'Outro';
  return 'Não informado';
}

function toDate(d: string | Date | null | undefined): Date | null {
  if (!d) return null;
  if (d instanceof Date) return isNaN(d.getTime()) ? null : d;
  // Aceita 'YYYY-MM-DD' e ISO completos. Para 'YYYY-MM-DD' evita timezone shift.
  if (/^\d{4}-\d{2}-\d{2}$/.test(d)) {
    const [y, m, day] = d.split('-').map(Number);
    return new Date(y, m - 1, day);
  }
  const parsed = new Date(d);
  return isNaN(parsed.getTime()) ? null : parsed;
}

const pad = (n: number) => n.toString().padStart(2, '0');

export function formatDateBR(d: string | Date | null | undefined): string {
  const date = toDate(d);
  if (!date) return '—';
  return `${pad(date.getDate())}/${pad(date.getMonth() + 1)}/${date.getFullYear()}`;
}

export function formatDateTimeBR(d: string | Date | null | undefined): string {
  const date = toDate(d);
  if (!date) return '—';
  return `${formatDateBR(date)} ${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export function getInitials(name: string | null | undefined, max = 2): string {
  if (!name) return '?';
  return name
    .split(/\s+/)
    .map(w => w[0])
    .filter(Boolean)
    .slice(0, max)
    .join('')
    .toUpperCase();
}

const MONTHS_PT = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
];

/** Ex: "2026-04-15" → "Abril 2026". Útil para agrupar timeline por mês. */
export function formatMonthYearBR(d: string | Date | null | undefined): string {
  const date = toDate(d);
  if (!date) return '—';
  return `${MONTHS_PT[date.getMonth()]} ${date.getFullYear()}`;
}

/** Chave estável para agrupamento por mês: "YYYY-MM". */
export function monthKey(d: string | Date | null | undefined): string {
  const date = toDate(d);
  if (!date) return '0000-00';
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}`;
}
