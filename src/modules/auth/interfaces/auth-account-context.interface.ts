export interface DependentAccessContext {
  cuentaId: number;
  miembroId: number;
  protagonistaId?: number;
}

export interface AuthAccountContext {
  cuentaId: number;
  miembroId?: number;
  protagonistaId?: number;
  responsableId?: number;
  dependents: DependentAccessContext[];
}
