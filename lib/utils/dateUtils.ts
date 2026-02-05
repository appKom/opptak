import { isBefore, isAfter, isEqual } from 'date-fns';
import { formatInTimeZone } from 'date-fns-tz';
import { nb } from 'date-fns/locale';

export const timezone = 'Europe/Oslo'; // Norwegian Time Zone

export const formatDate = (inputDate: undefined | Date) => {
  if (!inputDate) return "";
  
  return formatInTimeZone(inputDate, timezone, 'dd.MM.yyyy'); // - HH:mm
};

export const formatDateHours = (start: Date, end: Date): string => {

  const dateStr = formatInTimeZone(start, timezone, 'd. MMMM yyyy', { locale: nb });
  const startTime = formatInTimeZone(start, timezone, 'HH:mm');
  const endTime = formatInTimeZone(end, timezone, 'HH:mm');
  
  return `${dateStr}, ${startTime} til ${endTime}`;
};

export const formatDateNorwegian = (inputDate: Date): string => {
  if (!inputDate) return "";
  
  return formatInTimeZone(inputDate, timezone, 'd. MMM', { locale: nb });
};

export const isBeforeOrEqual = (date: Date, dateToCompare: Date) => 
  isBefore(date, dateToCompare) || isEqual(date, dateToCompare);

export const isAfterOrEqual = (date: Date, dateToCompare: Date) => 
  isAfter(date, dateToCompare) || isEqual(date, dateToCompare);