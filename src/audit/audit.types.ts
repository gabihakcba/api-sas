export interface AuditRequestContext {
  logId?: number;
}

export interface AuditActionPayload {
  logId?: number;
  tabla: string;
  preRegistro: unknown;
  postRegistro?: unknown;
}
