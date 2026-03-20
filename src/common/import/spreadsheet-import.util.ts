import { BadRequestException } from '@nestjs/common';
import * as XLSX from 'xlsx';

export interface ImportedSpreadsheetFile {
  originalname: string;
  mimetype: string;
  buffer: Buffer;
  size: number;
}

export interface SpreadsheetImportRow {
  rowNumber: number;
  values: Record<string, unknown>;
}

const SUPPORTED_EXTENSIONS = new Set(['.xlsx', '.csv', '.tsv']);

const normalizeHeader = (value: string) =>
  value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '');

const excelSerialToDate = (value: number): Date | null => {
  const parsed = XLSX.SSF.parse_date_code(value);

  if (!parsed) {
    return null;
  }

  return new Date(
    Date.UTC(parsed.y, parsed.m - 1, parsed.d, parsed.H, parsed.M, parsed.S),
  );
};

const parseDateString = (value: string): Date | null => {
  const trimmed = value.trim();

  if (!trimmed) {
    return null;
  }

  const isoCandidate = new Date(trimmed);
  if (!Number.isNaN(isoCandidate.getTime())) {
    return isoCandidate;
  }

  const match = trimmed.match(
    /^(\d{1,2})[/-](\d{1,2})[/-](\d{2,4})(?:\s+(\d{1,2}):(\d{2}))?$/,
  );

  if (!match) {
    return null;
  }

  const [, day, month, year, hour = '0', minute = '0'] = match;
  const normalizedYear = year.length === 2 ? `20${year}` : year;
  const parsed = new Date(
    Date.UTC(
      Number(normalizedYear),
      Number(month) - 1,
      Number(day),
      Number(hour),
      Number(minute),
    ),
  );

  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

const normalizeRowValues = (row: Record<string, unknown>) =>
  Object.entries(row).reduce<Record<string, unknown>>((acc, [key, value]) => {
    const normalizedKey = normalizeHeader(key);

    if (normalizedKey) {
      acc[normalizedKey] = value;
    }

    return acc;
  }, {});

export const parseSpreadsheetImportFile = (
  file: ImportedSpreadsheetFile | undefined,
): SpreadsheetImportRow[] => {
  if (!file?.buffer?.length) {
    throw new BadRequestException('Debes adjuntar una planilla válida.');
  }

  const lowerName = file.originalname.toLowerCase();
  const extension = lowerName.slice(lowerName.lastIndexOf('.'));

  if (!SUPPORTED_EXTENSIONS.has(extension)) {
    throw new BadRequestException(
      'Formato no soportado. Usa un archivo .xlsx, .csv o .tsv.',
    );
  }

  const workbook = XLSX.read(file.buffer, {
    type: 'buffer',
    raw: true,
    cellDates: true,
  });
  const firstSheetName = workbook.SheetNames[0];

  if (!firstSheetName) {
    throw new BadRequestException('La planilla no contiene hojas para importar.');
  }

  const firstSheet = workbook.Sheets[firstSheetName];
  const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(firstSheet, {
    defval: '',
    raw: true,
  });

  if (rows.length === 0) {
    throw new BadRequestException('La planilla no contiene filas de datos.');
  }

  return rows.map((row, index) => ({
    rowNumber: index + 2,
    values: normalizeRowValues(row),
  }));
};

export const getSpreadsheetCell = (
  values: Record<string, unknown>,
  aliases: string[],
): unknown => {
  for (const alias of aliases) {
    const normalizedAlias = normalizeHeader(alias);
    const value = values[normalizedAlias];

    if (
      value !== undefined &&
      value !== null &&
      !(typeof value === 'string' && value.trim() === '')
    ) {
      return value;
    }
  }

  return undefined;
};

export const getSpreadsheetString = (
  values: Record<string, unknown>,
  aliases: string[],
): string | undefined => {
  const value = getSpreadsheetCell(values, aliases);

  if (value === undefined) {
    return undefined;
  }

  return String(value).trim();
};

export const getSpreadsheetRequiredString = (
  values: Record<string, unknown>,
  aliases: string[],
  label: string,
): string => {
  const value = getSpreadsheetString(values, aliases);

  if (!value) {
    throw new BadRequestException(`Falta el campo obligatorio "${label}".`);
  }

  return value;
};

export const getSpreadsheetBoolean = (
  values: Record<string, unknown>,
  aliases: string[],
): boolean | undefined => {
  const value = getSpreadsheetCell(values, aliases);

  if (value === undefined) {
    return undefined;
  }

  if (typeof value === 'boolean') {
    return value;
  }

  if (typeof value === 'number') {
    return value !== 0;
  }

  const normalized = String(value).trim().toLowerCase();

  if (['1', 'true', 'si', 'sí', 'yes', 'activo', 'becado'].includes(normalized)) {
    return true;
  }

  if (['0', 'false', 'no', 'inactive', 'inactivo'].includes(normalized)) {
    return false;
  }

  throw new BadRequestException(`No se pudo interpretar el booleano "${value}".`);
};

export const getSpreadsheetDate = (
  values: Record<string, unknown>,
  aliases: string[],
): Date | undefined => {
  const value = getSpreadsheetCell(values, aliases);

  if (value === undefined) {
    return undefined;
  }

  if (value instanceof Date) {
    return value;
  }

  if (typeof value === 'number') {
    const parsedExcelDate = excelSerialToDate(value);

    if (parsedExcelDate) {
      return parsedExcelDate;
    }
  }

  if (typeof value === 'string') {
    const parsedStringDate = parseDateString(value);

    if (parsedStringDate) {
      return parsedStringDate;
    }
  }

  throw new BadRequestException(`No se pudo interpretar la fecha "${value}".`);
};

export const getSpreadsheetNumber = (
  values: Record<string, unknown>,
  aliases: string[],
): number | undefined => {
  const value = getSpreadsheetCell(values, aliases);

  if (value === undefined) {
    return undefined;
  }

  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }

  const normalized = Number(String(value).trim());

  if (!Number.isFinite(normalized)) {
    throw new BadRequestException(`No se pudo interpretar el número "${value}".`);
  }

  return normalized;
};
