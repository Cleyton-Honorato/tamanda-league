import { format, isToday, isTomorrow, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';

function toDate(value: string | Date): Date {
  return typeof value === 'string' ? parseISO(value) : value;
}

/** Chave de agrupamento por dia (`2026-10-04`). */
export function dayKey(value: string | Date): string {
  return format(toDate(value), 'yyyy-MM-dd');
}

/** Cabeçalho de lista, no estilo dos pôsteres: `SÁB · 04 OUT`. */
export function formatDayHeader(value: string | Date): string {
  const date = toDate(value);
  if (isToday(date)) return 'HOJE';
  if (isTomorrow(date)) return 'AMANHÃ';
  return format(date, "EEE '·' dd MMM", { locale: ptBR }).toUpperCase();
}

/** `04/10/2026` */
export function formatDate(value: string | Date): string {
  return format(toDate(value), 'dd/MM/yyyy');
}

/** `19:30` */
export function formatTime(value: string | Date): string {
  return format(toDate(value), 'HH:mm');
}

/** `04/10 · 19:30` — usado nos chips dos cards de jogo. */
export function formatDateTimeShort(value: string | Date): string {
  return format(toDate(value), "dd/MM '·' HH:mm");
}

/** Valor para `<input type="datetime-local">`. */
export function toDateTimeLocal(value: string | Date): string {
  return format(toDate(value), "yyyy-MM-dd'T'HH:mm");
}
