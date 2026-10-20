/**
 * Archivado de eventos por fecha de build.
 *
 * Módulo puro (sin `astro:content`) para poder probarlo con Vitest: la colección
 * `events` le pasa sus entradas ya validadas. Un evento sin fecha sigue siendo
 * "próximo" (estado "por confirmar") y los borradores nunca se publican.
 */
export interface ArchiveableEvent {
  title: string;
  /** Fecha civil ISO (`YYYY-MM-DD`) o `null` si está por confirmar. */
  date: string | null;
  city: string;
  url: string | null;
  draft: boolean;
}

/** Fecha de hoy en UTC, en el mismo formato que las fechas de los eventos. */
export function todayInUTC(now: Date = new Date()): string {
  return now.toISOString().slice(0, 10);
}

function byDateAscending(a: ArchiveableEvent, b: ArchiveableEvent): number {
  // Los eventos "por confirmar" no se pueden ordenar: van al final.
  if (a.date === null || b.date === null) {
    return (a.date === null ? 1 : 0) - (b.date === null ? 1 : 0);
  }
  return a.date.localeCompare(b.date);
}

function byDateDescending(a: ArchiveableEvent, b: ArchiveableEvent): number {
  return (b.date ?? '').localeCompare(a.date ?? '');
}

/**
 * Reparte los eventos en próximos y pasados respecto a `today` (la fecha del
 * build). Un evento que ocurre hoy todavía es próximo; los que están sin fecha
 * van al final de los próximos, porque aún no se pueden ordenar.
 */
export function archiveEvents<T extends ArchiveableEvent>(
  events: T[],
  today: string,
): { upcoming: T[]; past: T[] } {
  const published = events.filter((event) => !event.draft);
  const isPast = (event: ArchiveableEvent) => event.date !== null && event.date < today;

  return {
    upcoming: published.filter((event) => !isPast(event)).sort(byDateAscending),
    past: published.filter(isPast).sort(byDateDescending),
  };
}
