/**
 * Datos del evento destacado (Mary Jane Berlin).
 *
 * TODO (prompt 04 — datos de Saf): fecha real y enlace de la ficha del evento.
 * Mientras `date` sea `null`, la web muestra el estado "por confirmar" en los
 * ocho idiomas. Basta con poner la fecha en formato ISO (`'2027-05-20'`) para
 * que se formatee sola en cada idioma.
 */
export interface FoundationEvent {
  /** Fecha ISO (YYYY-MM-DD) o `null` si todavía no está confirmada. */
  date: string | null;
  /** Ciudad tal cual se muestra; los topónimos no se traducen. */
  city: string;
  /** Próximo o pasado: cambia la etiqueta de estado. */
  status: 'upcoming' | 'past';
  /** Enlace oficial del evento, si existe. */
  url: string | null;
}

export const featuredEvent: FoundationEvent = {
  date: null,
  city: 'Berlin',
  status: 'upcoming',
  url: null,
};
