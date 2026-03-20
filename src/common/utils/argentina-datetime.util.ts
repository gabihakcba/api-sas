const ARGENTINA_TIME_ZONE = 'America/Argentina/Buenos_Aires';
const ARGENTINA_LOCALE = 'es-AR';

export const formatArgentinaDate = (value: Date): string =>
  new Intl.DateTimeFormat(ARGENTINA_LOCALE, {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    timeZone: ARGENTINA_TIME_ZONE,
  }).format(value);

export const formatArgentinaTime = (value: Date): string =>
  new Intl.DateTimeFormat(ARGENTINA_LOCALE, {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    timeZone: ARGENTINA_TIME_ZONE,
  }).format(value);

export const formatArgentinaDateTime = (value: Date): string =>
  `${formatArgentinaDate(value)} ${formatArgentinaTime(value)}`;

export const formatArgentinaTimeRange = (
  start: Date | null,
  end: Date | null,
): string => {
  if (!start && !end) {
    return '-';
  }

  const startLabel = start ? formatArgentinaTime(start) : '--:--';
  const endLabel = end ? formatArgentinaTime(end) : '--:--';

  return `${startLabel} - ${endLabel}`;
};
