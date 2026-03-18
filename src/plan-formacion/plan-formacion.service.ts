import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  Prisma,
  SCOPE,
  TIPO_COMPETENCIA_FORMACION,
} from '@prisma/client';
import { AuthenticatedUser } from '../auth/types/auth-request.types';
import { hasScopedRoleAccess } from '../auth/utils/unrestricted-access.util';
import { PrismaService } from '../prisma/prisma.service';
import { CreateAdjuntoFormacionDto } from './dto/create-adjunto-formacion.dto';
import { CreateAsignacionApfDto } from './dto/create-asignacion-apf.dto';
import { CreatePlanDesempenoDto } from './dto/create-plan-desempeno.dto';
import { CreateTemplateDto } from './dto/create-template.dto';
import { UpdatePlanDesempenoCompetenciaDto } from './dto/update-plan-desempeno-competencia.dto';
import { UpdateTemplateDto } from './dto/update-template.dto';

const planTemplateSelect = {
  id: true,
  nombre: true,
  descripcion: true,
  id_area: true,
  Area: {
    select: {
      id: true,
      nombre: true,
    },
  },
  Adjuntos: {
    where: {
      borrado: false,
    },
    orderBy: {
      createdAt: 'desc',
    },
    select: {
      id: true,
      titulo: true,
      descripcion: true,
      archivo_nombre: true,
      archivo_mime: true,
      createdAt: true,
    },
  },
  Niveles: {
    where: {
      borrado: false,
    },
    orderBy: {
      orden: 'asc',
    },
    select: {
      id: true,
      orden: true,
      nombre: true,
      descripcion: true,
      Competencias: {
        where: {
          borrado: false,
        },
        orderBy: {
          id: 'asc',
        },
        select: {
          id: true,
          nombre: true,
          descripcion: true,
          tipo: true,
          Comportamientos: {
            where: {
              borrado: false,
            },
            orderBy: {
              orden: 'asc',
            },
            select: {
              id: true,
              orden: true,
              descripcion: true,
            },
          },
          Aprendizajes: {
            where: {
              borrado: false,
            },
            orderBy: {
              orden: 'asc',
            },
            select: {
              id: true,
              orden: true,
              descripcion: true,
              obligatoria: true,
            },
          },
          ResultadosEsperados: {
            where: {
              borrado: false,
            },
            orderBy: {
              orden: 'asc',
            },
            select: {
              id: true,
              orden: true,
              descripcion: true,
            },
          },
        },
      },
    },
  },
} satisfies Prisma.PlanFormacionTemplateSelect;

const planDesempenoSelect = {
  id: true,
  anio: true,
  estado: true,
  fecha_inicio: true,
  fecha_cierre: true,
  observaciones_generales: true,
  Adulto: {
    select: {
      id: true,
      Miembro: {
        select: {
          id: true,
          nombre: true,
          apellidos: true,
        },
      },
    },
  },
  APF: {
    select: {
      id: true,
      Miembro: {
        select: {
          id: true,
          nombre: true,
          apellidos: true,
        },
      },
    },
  },
  PlanFormacionTemplate: {
    select: planTemplateSelect,
  },
  Competencias: {
    where: {
      borrado: false,
    },
    select: {
      id: true,
      validada: true,
      observacion_apf: true,
      fecha_validacion: true,
      id_competencia_template: true,
      id_apf_validador: true,
    },
  },
} satisfies Prisma.PlanDesempenoAdultoSelect;

type PlanDesempenoWithRelations = Prisma.PlanDesempenoAdultoGetPayload<{
  select: typeof planDesempenoSelect;
}>;

const DEFAULT_TEMPLATE_NIVELES = [
  {
    orden: 1,
    nombre: 'Nivel 1 - Etapa Basica',
    descripcion: 'Etapa basica del recorrido formativo.',
  },
  {
    orden: 2,
    nombre: 'Nivel 2 - Etapa Intermedia',
    descripcion: 'Etapa intermedia del recorrido formativo.',
  },
  {
    orden: 3,
    nombre: 'Nivel 3 - Etapa Avanzada',
    descripcion: 'Etapa avanzada del recorrido formativo.',
  },
] as const;

const DEFAULT_TEMPLATE_COMPETENCIAS: Record<
  number,
  Array<{
    nombre: string;
    tipo: TIPO_COMPETENCIA_FORMACION;
  }>
> = {
  1: [
    { nombre: 'Orientación al cambio', tipo: TIPO_COMPETENCIA_FORMACION.ESENCIAL },
    { nombre: 'Trabajo en equipo', tipo: TIPO_COMPETENCIA_FORMACION.ESENCIAL },
    { nombre: 'Cultura asociativa', tipo: TIPO_COMPETENCIA_FORMACION.ESENCIAL },
    { nombre: 'Relaciones interpersonales', tipo: TIPO_COMPETENCIA_FORMACION.ESENCIAL },
    { nombre: 'Cuidado integral de las personas', tipo: TIPO_COMPETENCIA_FORMACION.ESENCIAL },
    { nombre: 'Método scout', tipo: TIPO_COMPETENCIA_FORMACION.ESENCIAL },
    { nombre: 'Sistema de Equipos', tipo: TIPO_COMPETENCIA_FORMACION.ESPECIFICA },
    { nombre: 'Marco Simbólico', tipo: TIPO_COMPETENCIA_FORMACION.ESPECIFICA },
    { nombre: 'Progresión Personal', tipo: TIPO_COMPETENCIA_FORMACION.ESPECIFICA },
    { nombre: 'Involucramiento comunitario', tipo: TIPO_COMPETENCIA_FORMACION.ESPECIFICA },
    { nombre: 'Oportunidades de aprendizaje', tipo: TIPO_COMPETENCIA_FORMACION.ESPECIFICA },
    { nombre: 'Aire libre y responsabilidad ambiental', tipo: TIPO_COMPETENCIA_FORMACION.ESPECIFICA },
  ],
  2: [
    { nombre: 'Cuidado integral de las personas', tipo: TIPO_COMPETENCIA_FORMACION.ESENCIAL },
    { nombre: 'Método scout', tipo: TIPO_COMPETENCIA_FORMACION.ESENCIAL },
    { nombre: 'Sistema de Equipos', tipo: TIPO_COMPETENCIA_FORMACION.ESPECIFICA },
    { nombre: 'Marco Simbólico', tipo: TIPO_COMPETENCIA_FORMACION.ESPECIFICA },
    { nombre: 'Progresión Personal', tipo: TIPO_COMPETENCIA_FORMACION.ESPECIFICA },
    { nombre: 'Involucramiento comunitario', tipo: TIPO_COMPETENCIA_FORMACION.ESPECIFICA },
    { nombre: 'Oportunidades de aprendizaje', tipo: TIPO_COMPETENCIA_FORMACION.ESPECIFICA },
    { nombre: 'Aire libre y responsabilidad ambiental', tipo: TIPO_COMPETENCIA_FORMACION.ESPECIFICA },
  ],
  3: [
    { nombre: 'Cuidado integral de las personas', tipo: TIPO_COMPETENCIA_FORMACION.ESENCIAL },
    { nombre: 'Método scout', tipo: TIPO_COMPETENCIA_FORMACION.ESENCIAL },
    { nombre: 'Sistema de Equipos', tipo: TIPO_COMPETENCIA_FORMACION.ESPECIFICA },
    { nombre: 'Marco Simbólico', tipo: TIPO_COMPETENCIA_FORMACION.ESPECIFICA },
    { nombre: 'Progresión Personal', tipo: TIPO_COMPETENCIA_FORMACION.ESPECIFICA },
    { nombre: 'Involucramiento comunitario', tipo: TIPO_COMPETENCIA_FORMACION.ESPECIFICA },
    { nombre: 'Oportunidades de aprendizaje', tipo: TIPO_COMPETENCIA_FORMACION.ESPECIFICA },
    { nombre: 'Aire libre y responsabilidad ambiental', tipo: TIPO_COMPETENCIA_FORMACION.ESPECIFICA },
  ],
};

@Injectable()
export class PlanFormacionService {
  constructor(private readonly prisma: PrismaService) {}

  async getTemplates() {
    return this.prisma.planFormacionTemplate.findMany({
      where: {
        borrado: false,
        activo: true,
      },
      orderBy: {
        nombre: 'asc',
      },
      select: planTemplateSelect,
    });
  }

  async getTemplate(id: number) {
    const template = await this.prisma.planFormacionTemplate.findFirst({
      where: {
        id,
        borrado: false,
        activo: true,
      },
      select: planTemplateSelect,
    });

    if (!template) {
      throw new NotFoundException(
        'La plantilla de plan de formación indicada no existe.',
      );
    }

    return template;
  }

  async getOptions(user: AuthenticatedUser) {
    const adultoActual = await this.resolveAdultFromMemberId(user.memberId);

    const [templates, adultos] = await this.prisma.$transaction([
      this.prisma.planFormacionTemplate.findMany({
        where: {
          borrado: false,
          activo: true,
        },
        orderBy: {
          nombre: 'asc',
        },
        select: {
          id: true,
          nombre: true,
          descripcion: true,
        },
      }),
      this.prisma.adulto.findMany({
        where: {
          id: {
            in: await this.getActiveApfAdultIds(),
            not: adultoActual.id,
          },
          borrado: false,
          activo: true,
          Miembro: {
            borrado: false,
          },
        },
        orderBy: [
          {
            Miembro: {
              nombre: 'asc',
            },
          },
          {
            Miembro: {
              apellidos: 'asc',
            },
          },
        ],
        select: {
          id: true,
          Miembro: {
            select: {
              id: true,
              nombre: true,
              apellidos: true,
            },
          },
        },
      }),
    ]);

    return {
      currentYear: new Date().getFullYear(),
      templates,
      apfAdults: adultos,
    };
  }

  async getAdminWorkspace(user: AuthenticatedUser) {
    const currentAdult = await this.findCurrentAdult(user.memberId);
    const canEdit = currentAdult !== null;
    const canCreatePlan = currentAdult !== null;
    const canManageApf =
      currentAdult !== null &&
      (hasScopedRoleAccess(user, 'JEFATURA', [SCOPE.GRUPO, SCOPE.GLOBAL]) ||
        (await this.hasActiveApfAssignment(currentAdult.id)));

    const [templates, areas, apfs, adultos, consejos] = await this.prisma.$transaction([
      this.prisma.planFormacionTemplate.findMany({
        where: {
          borrado: false,
        },
        orderBy: {
          nombre: 'asc',
        },
        select: planTemplateSelect,
      }),
      this.prisma.area.findMany({
        where: {
          borrado: false,
        },
        orderBy: {
          nombre: 'asc',
        },
        select: {
          id: true,
          nombre: true,
        },
      }),
      this.prisma.asignacionAPF.findMany({
        where: {
          borrado: false,
          fecha_fin: null,
          Adulto: {
            borrado: false,
            activo: true,
            Miembro: {
              borrado: false,
            },
          },
          Consejo: {
            borrado: false,
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
        select: {
          id: true,
          fecha_inicio: true,
          observacion: true,
          Adulto: {
            select: {
              id: true,
              Miembro: {
                select: {
                  id: true,
                  nombre: true,
                  apellidos: true,
                },
              },
            },
          },
          Consejo: {
            select: {
              id: true,
              nombre: true,
              fecha: true,
            },
          },
        },
      }),
      this.prisma.adulto.findMany({
        where: {
          borrado: false,
          activo: true,
          Miembro: {
            borrado: false,
          },
        },
        orderBy: [
          {
            Miembro: {
              nombre: 'asc',
            },
          },
          {
            Miembro: {
              apellidos: 'asc',
            },
          },
        ],
        select: {
          id: true,
          Miembro: {
            select: {
              id: true,
              nombre: true,
              apellidos: true,
            },
          },
        },
      }),
      this.prisma.consejo.findMany({
        where: {
          borrado: false,
        },
        orderBy: {
          fecha: 'desc',
        },
        select: {
          id: true,
          nombre: true,
          fecha: true,
        },
      }),
    ]);

    return {
      canEdit,
      canCreatePlan,
      canManageApf,
      templates,
      areas,
      apfAssignments: canManageApf ? apfs : [],
      adults: canManageApf ? adultos : [],
      consejos: canManageApf ? consejos : [],
    };
  }

  async getMyPlanDesempeno(user: AuthenticatedUser) {
    if (!user.memberId) {
      throw new ForbiddenException('La cuenta no está vinculada a un miembro.');
    }

    return this.getPlanDesempenoByMember(user.memberId, user);
  }

  async getPlanDesempenoByMember(memberId: number, user: AuthenticatedUser) {
    const adulto = await this.prisma.adulto.findFirst({
      where: {
        borrado: false,
        Miembro: {
          id: memberId,
          borrado: false,
        },
      },
      select: {
        id: true,
        Miembro: {
          select: {
            id: true,
            nombre: true,
            apellidos: true,
          },
        },
      },
    });

    if (!adulto) {
      throw new NotFoundException(
        'El miembro indicado no tiene un perfil adulto activo.',
      );
    }

    const currentAdult = await this.findCurrentAdult(user.memberId);

    const planes = await this.prisma.planDesempenoAdulto.findMany({
      where: {
        borrado: false,
        id_adulto: adulto.id,
      },
      orderBy: [
        {
          anio: 'desc',
        },
        {
          createdAt: 'desc',
        },
      ],
      select: planDesempenoSelect,
    });

    const canCreatePlan = user.memberId === memberId && currentAdult !== null;
    const canAccessWorkspace =
      canCreatePlan ||
      planes.some((plan) => currentAdult?.id === plan.APF.id);
    const canManagePlan =
      currentAdult !== null &&
      planes.some((plan) => currentAdult.id === plan.APF.id);

    return {
      adult: adulto,
      canCreatePlan,
      canAccessWorkspace,
      canManagePlan,
      planes: planes.map((plan) =>
        this.mapPlanDesempenoResponse(plan, currentAdult?.id ?? null),
      ),
    };
  }

  async createPlanDesempeno(
    user: AuthenticatedUser,
    dto: CreatePlanDesempenoDto,
  ) {
    const adultoActual = await this.resolveAdultFromMemberId(user.memberId);

    if (adultoActual.id === dto.idApfAdulto) {
      throw new BadRequestException(
        'El APF debe ser una persona adulta distinta a quien inicia el plan.',
      );
    }

    const [template, apfAdult] = await this.prisma.$transaction([
      this.prisma.planFormacionTemplate.findFirst({
        where: {
          id: dto.idPlanFormacionTemplate,
          borrado: false,
          activo: true,
        },
        select: {
          id: true,
          Niveles: {
            where: {
              borrado: false,
            },
            select: {
              Competencias: {
                where: {
                  borrado: false,
                },
                select: {
                  id: true,
                },
              },
            },
          },
        },
      }),
      this.prisma.adulto.findFirst({
        where: {
          id: dto.idApfAdulto,
          borrado: false,
          activo: true,
          Miembro: {
            borrado: false,
          },
        },
        select: {
          id: true,
        },
      }),
    ]);

    if (!template) {
      throw new NotFoundException(
        'La plantilla de plan de formación indicada no existe.',
      );
    }

    if (!apfAdult) {
      throw new NotFoundException('El APF indicado no existe o no está activo.');
    }

    const existingPlan = await this.prisma.planDesempenoAdulto.findFirst({
      where: {
        borrado: false,
        id_adulto: adultoActual.id,
        anio: dto.anio,
        id_plan_formacion_template: template.id,
      },
      select: {
        id: true,
      },
    });

    if (existingPlan) {
      throw new BadRequestException(
        'Ya existe un plan de desempeño para ese año y esa plantilla.',
      );
    }

    const competenciasTemplate = template.Niveles.flatMap((nivel) =>
      nivel.Competencias.map((competencia) => competencia.id),
    );

    await this.prisma.$transaction(async (tx) => {
      const createdPlan = await tx.planDesempenoAdulto.create({
        data: {
          anio: dto.anio,
          observaciones_generales: dto.observacionesGenerales?.trim() || null,
          id_adulto: adultoActual.id,
          id_apf_adulto: apfAdult.id,
          id_plan_formacion_template: template.id,
          estado: 'EN_CURSO',
        },
        select: {
          id: true,
        },
      });

      if (competenciasTemplate.length > 0) {
        await tx.planDesempenoCompetencia.createMany({
          data: competenciasTemplate.map((competenciaId) => ({
            id_plan_desempeno: createdPlan.id,
            id_competencia_template: competenciaId,
          })),
          skipDuplicates: true,
        });
      }
    });

    return this.getMyPlanDesempeno(user);
  }

  async createTemplate(user: AuthenticatedUser, dto: CreateTemplateDto) {
    await this.ensureAdultUser(user);
    await this.ensureAreaExists(dto.idArea);

    const template = await this.prisma.planFormacionTemplate.create({
      data: {
        nombre: dto.nombre.trim(),
        descripcion: dto.descripcion?.trim() || null,
        id_area: dto.idArea,
        activo: dto.activo ?? true,
      },
      select: {
        id: true,
      },
    });

    await this.syncTemplateStructure(template.id, dto.niveles);

    return this.getTemplate(template.id);
  }

  async createTemplateWithDefaults(user: AuthenticatedUser, nombre: string) {
    return this.createTemplate(user, {
      nombre,
      descripcion: undefined,
      idArea: await this.resolveRamaAreaId(),
      activo: true,
      niveles: DEFAULT_TEMPLATE_NIVELES.map((nivel) => ({
        ...nivel,
        competencias: (DEFAULT_TEMPLATE_COMPETENCIAS[nivel.orden] ?? []).map(
          (competencia) => ({
            ...competencia,
            descripcion: undefined,
            comportamientos: [],
            aprendizajes: [],
            resultados: [],
          }),
        ),
      })),
    });
  }

  async updateTemplate(
    user: AuthenticatedUser,
    id: number,
    dto: UpdateTemplateDto,
  ) {
    await this.ensureAdultUser(user);

    const existing = await this.prisma.planFormacionTemplate.findFirst({
      where: {
        id,
        borrado: false,
      },
      select: {
        id: true,
      },
    });

    if (!existing) {
      throw new NotFoundException('La plantilla indicada no existe.');
    }

    if (dto.idArea) {
      await this.ensureAreaExists(dto.idArea);
    }

    await this.prisma.planFormacionTemplate.update({
      where: {
        id,
      },
      data: {
        ...(dto.nombre !== undefined ? { nombre: dto.nombre.trim() } : {}),
        ...(dto.descripcion !== undefined
          ? { descripcion: dto.descripcion?.trim() || null }
          : {}),
        ...(dto.idArea !== undefined ? { id_area: dto.idArea } : {}),
        ...(dto.activo !== undefined ? { activo: dto.activo } : {}),
        borrado: false,
      },
    });

    if (dto.niveles) {
      await this.syncTemplateStructure(id, dto.niveles);
    }

    return this.getTemplate(id);
  }

  async uploadAdjunto(
    user: AuthenticatedUser,
    templateId: number,
    dto: CreateAdjuntoFormacionDto,
  ) {
    await this.ensureAdultUser(user);
    await this.ensureTemplateExists(templateId);

    const archivo = Buffer.from(dto.archivoBase64, 'base64');

    await this.prisma.adjuntoFormacionTemplate.create({
      data: {
        id_plan_formacion_template: templateId,
        titulo: dto.titulo.trim(),
        descripcion: dto.descripcion?.trim() || null,
        archivo_nombre: dto.archivoNombre.trim(),
        archivo_mime: dto.archivoMime.trim(),
        archivo,
      },
    });

    return this.getTemplate(templateId);
  }

  async downloadAdjunto(id: number) {
    const adjunto = await this.prisma.adjuntoFormacionTemplate.findFirst({
      where: {
        id,
        borrado: false,
      },
      select: {
        id: true,
        titulo: true,
        descripcion: true,
        archivo_nombre: true,
        archivo_mime: true,
        archivo: true,
      },
    });

    if (!adjunto || !adjunto.archivo) {
      throw new NotFoundException('El adjunto indicado no existe.');
    }

    return {
      ...adjunto,
      archivoBase64: Buffer.from(adjunto.archivo).toString('base64'),
    };
  }

  async removeAdjunto(user: AuthenticatedUser, id: number) {
    await this.ensureAdultUser(user);

    const adjunto = await this.prisma.adjuntoFormacionTemplate.findFirst({
      where: {
        id,
        borrado: false,
      },
      select: {
        id: true,
        id_plan_formacion_template: true,
      },
    });

    if (!adjunto) {
      throw new NotFoundException('El adjunto indicado no existe.');
    }

    await this.prisma.adjuntoFormacionTemplate.update({
      where: {
        id,
      },
      data: {
        borrado: true,
      },
    });

    return this.getTemplate(adjunto.id_plan_formacion_template);
  }

  async createAsignacionApf(
    user: AuthenticatedUser,
    dto: CreateAsignacionApfDto,
  ) {
    await this.ensureCanManageApf(user);

    const [adulto, consejo, asignacionActual] = await this.prisma.$transaction([
      this.prisma.adulto.findFirst({
        where: {
          id: dto.idAdulto,
          borrado: false,
          activo: true,
          Miembro: {
            borrado: false,
          },
        },
        select: {
          id: true,
        },
      }),
      this.prisma.consejo.findFirst({
        where: {
          id: dto.idConsejo,
          borrado: false,
        },
        select: {
          id: true,
        },
      }),
      this.prisma.asignacionAPF.findFirst({
        where: {
          borrado: false,
          fecha_fin: null,
          id_adulto: dto.idAdulto,
        },
        select: {
          id: true,
        },
      }),
    ]);

    if (!adulto) {
      throw new NotFoundException('La persona adulta indicada no existe.');
    }

    if (!consejo) {
      throw new NotFoundException('El consejo indicado no existe.');
    }

    if (asignacionActual) {
      throw new BadRequestException(
        'La persona adulta indicada ya tiene una asignación APF activa.',
      );
    }

    await this.prisma.asignacionAPF.create({
      data: {
        id_adulto: dto.idAdulto,
        id_consejo: dto.idConsejo,
        observacion: dto.observacion?.trim() || null,
      },
    });

    return this.getAdminWorkspace(user);
  }

  async closeAsignacionApf(user: AuthenticatedUser, id: number) {
    await this.ensureCanManageApf(user);

    const asignacion = await this.prisma.asignacionAPF.findFirst({
      where: {
        id,
        borrado: false,
        fecha_fin: null,
      },
      select: {
        id: true,
      },
    });

    if (!asignacion) {
      throw new NotFoundException('La asignación APF indicada no existe.');
    }

    await this.prisma.asignacionAPF.update({
      where: {
        id,
      },
      data: {
        fecha_fin: new Date(),
      },
    });

    return this.getAdminWorkspace(user);
  }

  async updatePlanCompetencia(
    user: AuthenticatedUser,
    planId: number,
    competenciaTemplateId: number,
    dto: UpdatePlanDesempenoCompetenciaDto,
  ) {
    const adultoActual = await this.resolveAdultFromMemberId(user.memberId);

    const plan = await this.prisma.planDesempenoAdulto.findFirst({
      where: {
        id: planId,
        borrado: false,
      },
      select: {
        id: true,
        id_apf_adulto: true,
        Adulto: {
          select: {
            Miembro: {
              select: {
                id: true,
              },
            },
          },
        },
      },
    });

    if (!plan) {
      throw new NotFoundException('El plan de desempeño indicado no existe.');
    }

    if (plan.id_apf_adulto !== adultoActual.id) {
      throw new ForbiddenException(
        'Solo el APF asignado puede validar competencias del plan.',
      );
    }

    const planCompetencia = await this.prisma.planDesempenoCompetencia.findFirst({
      where: {
        borrado: false,
        id_plan_desempeno: planId,
        id_competencia_template: competenciaTemplateId,
      },
      select: {
        id: true,
      },
    });

    if (!planCompetencia) {
      throw new NotFoundException(
        'La competencia indicada no pertenece a ese plan de desempeño.',
      );
    }

    await this.prisma.planDesempenoCompetencia.update({
      where: {
        id: planCompetencia.id,
      },
      data: {
        validada: dto.validada,
        observacion_apf: dto.observacionApf?.trim() || null,
        fecha_validacion: dto.validada ? new Date() : null,
        id_apf_validador: dto.validada ? adultoActual.id : null,
      },
    });

    return this.getPlanDesempenoByMember(plan.Adulto.Miembro.id, user);
  }

  private mapPlanDesempenoResponse(
    plan: PlanDesempenoWithRelations,
    currentAdultId: number | null,
  ) {
    return {
      ...plan,
      canManage: currentAdultId !== null && currentAdultId === plan.APF.id,
    };
  }

  private async syncTemplateStructure(
    templateId: number,
    niveles: CreateTemplateDto['niveles'],
  ) {
    for (const nivel of niveles) {
      const existingNivel = await this.prisma.planFormacionNivelTemplate.findFirst({
        where: {
          id_plan_formacion_template: templateId,
          orden: nivel.orden,
        },
        select: {
          id: true,
        },
      });

      const persistedNivel = existingNivel
        ? await this.prisma.planFormacionNivelTemplate.update({
            where: { id: existingNivel.id },
            data: {
              nombre: nivel.nombre.trim(),
              descripcion: nivel.descripcion?.trim() || null,
              borrado: false,
            },
            select: { id: true },
          })
        : await this.prisma.planFormacionNivelTemplate.create({
            data: {
              id_plan_formacion_template: templateId,
              orden: nivel.orden,
              nombre: nivel.nombre.trim(),
              descripcion: nivel.descripcion?.trim() || null,
            },
            select: { id: true },
          });

      const competenciaIds: number[] = [];

      for (const [competenciaIndex, competencia] of nivel.competencias.entries()) {
        const existingCompetencia =
          await this.prisma.planFormacionCompetenciaTemplate.findFirst({
            where: {
              id_nivel_template: persistedNivel.id,
              nombre: competencia.nombre,
            },
            select: {
              id: true,
            },
          });

        const persistedCompetencia = existingCompetencia
          ? await this.prisma.planFormacionCompetenciaTemplate.update({
              where: { id: existingCompetencia.id },
              data: {
                nombre: competencia.nombre.trim(),
                descripcion: competencia.descripcion?.trim() || null,
                tipo: competencia.tipo,
                borrado: false,
              },
              select: { id: true },
            })
          : await this.prisma.planFormacionCompetenciaTemplate.create({
              data: {
                id_nivel_template: persistedNivel.id,
                nombre: competencia.nombre.trim(),
                descripcion: competencia.descripcion?.trim() || null,
                tipo: competencia.tipo,
              },
              select: { id: true },
            });

        competenciaIds.push(persistedCompetencia.id);

        await this.syncCompetenciaChildren(
          persistedCompetencia.id,
          competencia.comportamientos?.map((item) => item.descripcion) ?? [],
          competencia.aprendizajes ?? [],
          competencia.resultados?.map((item) => item.descripcion) ?? [],
        );
      }

      await this.prisma.planFormacionCompetenciaTemplate.updateMany({
        where: {
          id_nivel_template: persistedNivel.id,
          id: {
            notIn: competenciaIds.length > 0 ? competenciaIds : [-1],
          },
        },
        data: {
          borrado: true,
        },
      });
    }
  }

  private async syncCompetenciaChildren(
    competenciaId: number,
    comportamientos: string[],
    aprendizajes: Array<{ descripcion: string; obligatoria?: boolean }>,
    resultados: string[],
  ) {
    const idsComportamientos: number[] = [];
    for (const [index, descripcion] of comportamientos.entries()) {
      const orden = index + 1;
      const existing =
        await this.prisma.planFormacionComportamientoTemplate.findFirst({
          where: {
            id_competencia_template: competenciaId,
            orden,
          },
          select: { id: true },
        });

      const persisted = existing
        ? await this.prisma.planFormacionComportamientoTemplate.update({
            where: { id: existing.id },
            data: {
              descripcion: descripcion.trim(),
              borrado: false,
            },
            select: { id: true },
          })
        : await this.prisma.planFormacionComportamientoTemplate.create({
            data: {
              id_competencia_template: competenciaId,
              orden,
              descripcion: descripcion.trim(),
            },
            select: { id: true },
          });

      idsComportamientos.push(persisted.id);
    }

    await this.prisma.planFormacionComportamientoTemplate.updateMany({
      where: {
        id_competencia_template: competenciaId,
        id: {
          notIn: idsComportamientos.length > 0 ? idsComportamientos : [-1],
        },
      },
      data: {
        borrado: true,
      },
    });

    const idsAprendizajes: number[] = [];
    for (const [index, aprendizaje] of aprendizajes.entries()) {
      const orden = index + 1;
      const existing =
        await this.prisma.planFormacionAprendizajeTemplate.findFirst({
          where: {
            id_competencia_template: competenciaId,
            orden,
          },
          select: { id: true },
        });

      const persisted = existing
        ? await this.prisma.planFormacionAprendizajeTemplate.update({
            where: { id: existing.id },
            data: {
              descripcion: aprendizaje.descripcion.trim(),
              obligatoria: aprendizaje.obligatoria ?? true,
              borrado: false,
            },
            select: { id: true },
          })
        : await this.prisma.planFormacionAprendizajeTemplate.create({
            data: {
              id_competencia_template: competenciaId,
              orden,
              descripcion: aprendizaje.descripcion.trim(),
              obligatoria: aprendizaje.obligatoria ?? true,
            },
            select: { id: true },
          });

      idsAprendizajes.push(persisted.id);
    }

    await this.prisma.planFormacionAprendizajeTemplate.updateMany({
      where: {
        id_competencia_template: competenciaId,
        id: {
          notIn: idsAprendizajes.length > 0 ? idsAprendizajes : [-1],
        },
      },
      data: {
        borrado: true,
      },
    });

    const idsResultados: number[] = [];
    for (const [index, descripcion] of resultados.entries()) {
      const orden = index + 1;
      const existing = await this.prisma.planFormacionResultadoTemplate.findFirst({
        where: {
          id_competencia_template: competenciaId,
          orden,
        },
        select: { id: true },
      });

      const persisted = existing
        ? await this.prisma.planFormacionResultadoTemplate.update({
            where: { id: existing.id },
            data: {
              descripcion: descripcion.trim(),
              borrado: false,
            },
            select: { id: true },
          })
        : await this.prisma.planFormacionResultadoTemplate.create({
            data: {
              id_competencia_template: competenciaId,
              orden,
              descripcion: descripcion.trim(),
            },
            select: { id: true },
          });

      idsResultados.push(persisted.id);
    }

    await this.prisma.planFormacionResultadoTemplate.updateMany({
      where: {
        id_competencia_template: competenciaId,
        id: {
          notIn: idsResultados.length > 0 ? idsResultados : [-1],
        },
      },
      data: {
        borrado: true,
      },
    });
  }

  private async ensureTemplateExists(id: number) {
    const template = await this.prisma.planFormacionTemplate.findFirst({
      where: {
        id,
        borrado: false,
      },
      select: {
        id: true,
      },
    });

    if (!template) {
      throw new NotFoundException('La plantilla indicada no existe.');
    }
  }

  private async ensureAreaExists(id: number) {
    const area = await this.prisma.area.findFirst({
      where: {
        id,
        borrado: false,
      },
      select: {
        id: true,
      },
    });

    if (!area) {
      throw new NotFoundException('El área indicada no existe.');
    }
  }

  private async resolveRamaAreaId() {
    const area = await this.prisma.area.findFirst({
      where: {
        nombre: 'Rama',
        borrado: false,
      },
      select: {
        id: true,
      },
    });

    if (!area) {
      throw new NotFoundException('No se encontró el área Rama.');
    }

    return area.id;
  }

  private async getActiveApfAdultIds() {
    const rows = await this.prisma.asignacionAPF.findMany({
      where: {
        borrado: false,
        fecha_fin: null,
      },
      select: {
        id_adulto: true,
      },
    });

    return rows.map((row: { id_adulto: number }) => row.id_adulto);
  }

  private async ensureAdultUser(user: AuthenticatedUser) {
    await this.resolveAdultFromMemberId(user.memberId);
  }

  private async ensureCanManageApf(user: AuthenticatedUser) {
    const adultoActual = await this.resolveAdultFromMemberId(user.memberId);

    if (hasScopedRoleAccess(user, 'JEFATURA', [SCOPE.GRUPO, SCOPE.GLOBAL])) {
      return adultoActual;
    }

    const isActiveApf = await this.hasActiveApfAssignment(adultoActual.id);

    if (!isActiveApf) {
      throw new ForbiddenException(
        'Solo jefatura o APFs activos pueden gestionar habilitaciones APF.',
      );
    }

    return adultoActual;
  }

  private async resolveAdultFromMemberId(memberId: number | null) {
    const adulto = await this.findCurrentAdult(memberId);

    if (!adulto) {
      throw new ForbiddenException(
        'La cuenta actual no corresponde a una persona adulta activa.',
      );
    }

    return adulto;
  }

  private async findCurrentAdult(memberId: number | null) {
    if (!memberId) {
      return null;
    }

    return this.prisma.adulto.findFirst({
      where: {
        borrado: false,
        activo: true,
        Miembro: {
          id: memberId,
          borrado: false,
        },
      },
      select: {
        id: true,
        Miembro: {
          select: {
            id: true,
            nombre: true,
            apellidos: true,
          },
        },
      },
    });
  }

  private async hasActiveApfAssignment(adultoId: number) {
    const assignment = await this.prisma.asignacionAPF.findFirst({
      where: {
        id_adulto: adultoId,
        borrado: false,
        fecha_fin: null,
      },
      select: {
        id: true,
      },
    });

    return assignment !== null;
  }
}
