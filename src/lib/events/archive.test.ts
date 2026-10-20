import { describe, expect, it } from 'vitest';

import { archiveEvents, todayInUTC, type ArchiveableEvent } from './archive';

const event = (overrides: Partial<ArchiveableEvent> = {}): ArchiveableEvent => ({
  title: 'Mary Jane Berlin',
  date: null,
  city: 'Berlin',
  url: null,
  draft: false,
  ...overrides,
});

const titles = (events: ArchiveableEvent[]) => events.map((item) => item.title);

describe('todayInUTC', () => {
  it('devuelve la fecha civil en formato ISO (YYYY-MM-DD)', () => {
    expect(todayInUTC(new Date('2026-10-20T23:30:00Z'))).toBe('2026-10-20');
    expect(todayInUTC(new Date('2026-01-02T00:00:00Z'))).toBe('2026-01-02');
  });
});

describe('archiveEvents', () => {
  const today = '2026-10-20';

  it('separa próximos y pasados según la fecha de build', () => {
    const { upcoming, past } = archiveEvents(
      [
        event({ title: 'Futuro', date: '2027-05-20' }),
        event({ title: 'Pasado', date: '2026-05-20' }),
        event({ title: 'Hoy', date: '2026-10-20' }),
      ],
      today,
    );

    expect(titles(upcoming)).toEqual(['Hoy', 'Futuro']);
    // El evento de hoy todavía no es pasado.
    expect(titles(past)).toEqual(['Pasado']);
  });

  it('ordena los próximos por fecha ascendente y deja al final los que no tienen fecha', () => {
    const { upcoming } = archiveEvents(
      [
        event({ title: 'Sin fecha', date: null }),
        event({ title: 'Mayo', date: '2027-05-20' }),
        event({ title: 'Enero', date: '2027-01-09' }),
      ],
      today,
    );

    expect(titles(upcoming)).toEqual(['Enero', 'Mayo', 'Sin fecha']);
  });

  it('ordena los pasados del más reciente al más antiguo', () => {
    const { past } = archiveEvents(
      [
        event({ title: 'Antiguo', date: '2024-03-01' }),
        event({ title: 'Reciente', date: '2026-09-30' }),
      ],
      today,
    );

    expect(titles(past)).toEqual(['Reciente', 'Antiguo']);
  });

  it('nunca publica borradores, ni siquiera en el archivo', () => {
    const { upcoming, past } = archiveEvents(
      [
        event({ title: 'Borrador futuro', date: '2027-05-20', draft: true }),
        event({ title: 'Borrador pasado', date: '2025-05-20', draft: true }),
      ],
      today,
    );

    expect(upcoming).toEqual([]);
    expect(past).toEqual([]);
  });

  it('devuelve listas vacías cuando no hay eventos', () => {
    expect(archiveEvents([], today)).toEqual({ upcoming: [], past: [] });
  });
});
