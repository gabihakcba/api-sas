export type Cuenta = {
  id: number;
  user: string;
  password: string;
};

export type CuentaWithRole = Cuenta & {
  CuentaRole: Array<{
    id: number;
    createdAt: Date;
    id_cuenta: number;
    id_role: number;
    Role: {
      id: number;
      nombre: string;
      descripcion: string | null;
    };
    tipo_scope: 'GLOBAL' | 'RAMA' | 'OWN' | 'GRUPO';
    id_scope: number | null;
  }>;
};
