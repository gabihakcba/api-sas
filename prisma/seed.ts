import {
  ACTION,
  Prisma,
  PrismaClient,
  RESOURCE,
  SCOPE,
  TIPO_COMPETENCIA_FORMACION,
} from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import * as bcrypt from 'bcrypt';
import * as dotenv from 'dotenv';

dotenv.config();

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool as any);
const prisma = new PrismaClient({ adapter });

const CRUD_ACTIONS = [
  ACTION.CREATE,
  ACTION.READ,
  ACTION.UPDATE,
  ACTION.DELETE,
] as const;
const ALL_RESOURCES = Object.values(RESOURCE);

const SECRETARIA_TESORERIA_RESOURCES = [
  RESOURCE.CUENTA,
  RESOURCE.MIEMBRO,
  RESOURCE.PROTAGONISTA,
  RESOURCE.ADULTO,
  RESOURCE.RESPONSABLE,
  RESOURCE.RELACION,
  RESOURCE.PAGO,
  RESOURCE.CONCEPTO_PAGO,
  RESOURCE.METODO_PAGO,
  RESOURCE.CUENTA_DINERO,
  RESOURCE.PRESUPUESTO,
  RESOURCE.EVENTO,
  RESOURCE.INSCRIPCION,
  RESOURCE.TIPO_EVENTO,
] as const;

const ADULTO_READONLY_RESOURCES = [RESOURCE.ADULTO] as const;

const INTENDENCIA_READONLY_RESOURCES = [
  RESOURCE.MIEMBRO,
  RESOURCE.ADULTO,
] as const;

const RAMA_FULL_ACCESS_RESOURCES = [
  RESOURCE.MIEMBRO,
  RESOURCE.PROTAGONISTA,
  RESOURCE.ADULTO,
  RESOURCE.RELACION,
  RESOURCE.EVENTO,
  RESOURCE.INSCRIPCION,
  RESOURCE.ASISTENCIA,
  RESOURCE.COMISION,
  RESOURCE.PARTICIPANTE_COMISION,
  RESOURCE.CUENTA_DINERO,
  RESOURCE.PAGO,
] as const;

const RAMA_READONLY_RESOURCES = [
  RESOURCE.RESPONSABLE,
  RESOURCE.PLAN_FORMACION,
  RESOURCE.PLAN_DESEMPENO,
] as const;

const AREA_DEFINITIONS = [
  {
    nombre: 'Jefatura',
    descripcion:
      'Compuesta por jefe o jefa y subjefe o subjefa del grupo. Representa al grupo ante otros grupos scout y consejos de zona y distrito.',
  },
  {
    nombre: 'Secretaria y Tesoreria',
    descripcion:
      'Gestiona la inscripcion de miembros, cuotas y afiliaciones a la organizacion scout.',
  },
  {
    nombre: 'Intendencia',
    descripcion:
      'Administra y mantiene materiales, insumos y mejoras edilicias, brindando apoyo material al resto de las areas.',
  },
  {
    nombre: 'Rama',
    descripcion:
      'Area contenedora de las ramas educativas y de sus equipos de educadores adultos.',
  },
] as const;

const RAMA_DEFINITIONS = [
  {
    nombre: 'Castores',
    descripcion: 'Rama para protagonistas de 4 a 6 anos.',
    edad_minima_protagonistas: 4,
    edad_maxima_protagonistas: 6,
    edad_minima_adulto: 22,
  },
  {
    nombre: 'Manada',
    descripcion: 'Rama para protagonistas de 7 a 9 anos.',
    edad_minima_protagonistas: 7,
    edad_maxima_protagonistas: 9,
    edad_minima_adulto: 22,
  },
  {
    nombre: 'Unidad',
    descripcion: 'Rama para protagonistas de 10 a 13 anos.',
    edad_minima_protagonistas: 10,
    edad_maxima_protagonistas: 13,
    edad_minima_adulto: 22,
  },
  {
    nombre: 'Caminantes',
    descripcion: 'Rama para protagonistas de 14 a 17 anos.',
    edad_minima_protagonistas: 14,
    edad_maxima_protagonistas: 17,
    edad_minima_adulto: 25,
  },
  {
    nombre: 'Rovers',
    descripcion: 'Rama para protagonistas de 18 a 22 anos.',
    edad_minima_protagonistas: 18,
    edad_maxima_protagonistas: 22,
    edad_minima_adulto: 25,
  },
] as const;

const POSICION_AREA_DEFINITIONS = [
  {
    nombre: 'Jefe',
    descripcion: 'Responsable principal del area o rama.',
  },
  {
    nombre: 'Subjefe',
    descripcion:
      'Acompana la conduccion del area o rama y reemplaza al jefe cuando sea necesario.',
  },
  {
    nombre: 'Secretario',
    descripcion: 'Gestiona tareas administrativas, registros y documentacion.',
  },
  {
    nombre: 'Tesorero',
    descripcion: 'Administra cuotas, pagos y control economico del area.',
  },
  {
    nombre: 'Ayudante',
    descripcion:
      'Colabora con el equipo educativo o de gestion segun las necesidades del area.',
  },
] as const;

const CONCEPTO_PAGO_DEFINITIONS = [
  {
    nombre: 'Evento',
    descripcion: 'Cobros vinculados a actividades, campamentos y eventos.',
  },
  {
    nombre: 'Cuota',
    descripcion: 'Cobros periodicos correspondientes a la cuota del grupo.',
  },
  {
    nombre: 'Afiliacion',
    descripcion: 'Cobros asociados al proceso de afiliacion institucional.',
  },
] as const;

const METODO_PAGO_DEFINITIONS = [
  {
    nombre: 'Transferencia',
    descripcion: 'Pago realizado mediante transferencia bancaria.',
  },
  {
    nombre: 'Efectivo',
    descripcion: 'Pago realizado en efectivo.',
  },
  {
    nombre: 'Debito',
    descripcion: 'Pago realizado con tarjeta de debito.',
  },
  {
    nombre: 'Cheque',
    descripcion: 'Pago documentado mediante cheque.',
  },
] as const;

const TIPO_EVENTO_DEFINITIONS = [
  {
    nombre: 'Campamento',
    descripcion: 'Actividad de campamento con pernocte y logistica extendida.',
  },
  {
    nombre: 'Salida Cercana',
    descripcion: 'Actividad de salida breve y de cercania.',
  },
  {
    nombre: 'RAID',
    descripcion: 'Actividad de recorrido, desafio y progresion en territorio.',
  },
  {
    nombre: 'Rally',
    descripcion: 'Actividad ludica y competitiva por postas o estaciones.',
  },
  {
    nombre: 'Acantonamiento',
    descripcion: 'Actividad con pernocte en espacio cubierto o sede.',
  },
  {
    nombre: 'Descubierta',
    descripcion: 'Actividad de exploracion y reconocimiento del entorno.',
  },
] as const;

const RELACION_DEFINITIONS = [
  { tipo: 'Madre', descripcion: 'Responsable con vínculo materno.' },
  { tipo: 'Padre', descripcion: 'Responsable con vínculo paterno.' },
  { tipo: 'Tio', descripcion: 'Responsable con vínculo de tío.' },
  { tipo: 'Tia', descripcion: 'Responsable con vínculo de tía.' },
  { tipo: 'Abuelo', descripcion: 'Responsable con vínculo de abuelo.' },
  { tipo: 'Abuela', descripcion: 'Responsable con vínculo de abuela.' },
  { tipo: 'Hermano', descripcion: 'Responsable con vínculo de hermano.' },
  { tipo: 'Hermana', descripcion: 'Responsable con vínculo de hermana.' },
] as const;

const PLAN_FORMACION_TEMPLATE_DEFINITIONS = [
  {
    nombre: 'Rutas de aprendizaje - Lobatos y Lobeznas',
    descripcion:
      'Plantilla base de formacion para educadoras y educadores de la rama Lobatos y Lobeznas.',
    areaNombre: 'Rama',
  },
  {
    nombre: 'Rutas de aprendizaje - Scouts',
    descripcion:
      'Plantilla base de formacion para educadoras y educadores de la rama Scouts.',
    areaNombre: 'Rama',
  },
  {
    nombre: 'Rutas de aprendizaje - Caminantes',
    descripcion:
      'Plantilla base de formacion para educadoras y educadores de la rama Caminantes.',
    areaNombre: 'Rama',
  },
  {
    nombre: 'Rutas de aprendizaje - Rovers',
    descripcion:
      'Plantilla base de formacion para educadoras y educadores de la rama Rovers.',
    areaNombre: 'Rama',
  },
] as const;

const PLAN_FORMACION_NIVELES = [
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

type PlanCompetenciaSeed = {
  nombre: string;
  tipo: TIPO_COMPETENCIA_FORMACION;
  descripcion?: string;
  comportamientos?: string[];
  aprendizajes?: Array<{
    descripcion: string;
    obligatoria?: boolean;
  }>;
  resultados?: string[];
};

const PLAN_FORMACION_COMPETENCIAS_POR_NIVEL: Record<
  number,
  PlanCompetenciaSeed[]
> = {
  1: [
    {
      nombre: 'Orientación al cambio',
      tipo: TIPO_COMPETENCIA_FORMACION.ESENCIAL,
    },
    {
      nombre: 'Trabajo en equipo',
      tipo: TIPO_COMPETENCIA_FORMACION.ESENCIAL,
    },
    {
      nombre: 'Cultura asociativa',
      tipo: TIPO_COMPETENCIA_FORMACION.ESENCIAL,
    },
    {
      nombre: 'Relaciones interpersonales',
      tipo: TIPO_COMPETENCIA_FORMACION.ESENCIAL,
    },
    {
      nombre: 'Cuidado integral de las personas',
      tipo: TIPO_COMPETENCIA_FORMACION.ESENCIAL,
    },
    {
      nombre: 'Método scout',
      tipo: TIPO_COMPETENCIA_FORMACION.ESENCIAL,
    },
    {
      nombre: 'Sistema de Equipos',
      tipo: TIPO_COMPETENCIA_FORMACION.ESPECIFICA,
    },
    {
      nombre: 'Marco Simbólico',
      tipo: TIPO_COMPETENCIA_FORMACION.ESPECIFICA,
    },
    {
      nombre: 'Progresión Personal',
      tipo: TIPO_COMPETENCIA_FORMACION.ESPECIFICA,
    },
    {
      nombre: 'Involucramiento comunitario',
      tipo: TIPO_COMPETENCIA_FORMACION.ESPECIFICA,
    },
    {
      nombre: 'Oportunidades de aprendizaje',
      tipo: TIPO_COMPETENCIA_FORMACION.ESPECIFICA,
    },
    {
      nombre: 'Aire libre y responsabilidad ambiental',
      tipo: TIPO_COMPETENCIA_FORMACION.ESPECIFICA,
    },
  ],
  2: [
    {
      nombre: 'Cuidado integral de las personas',
      tipo: TIPO_COMPETENCIA_FORMACION.ESENCIAL,
    },
    {
      nombre: 'Método scout',
      tipo: TIPO_COMPETENCIA_FORMACION.ESENCIAL,
    },
    {
      nombre: 'Sistema de Equipos',
      tipo: TIPO_COMPETENCIA_FORMACION.ESPECIFICA,
    },
    {
      nombre: 'Marco Simbólico',
      tipo: TIPO_COMPETENCIA_FORMACION.ESPECIFICA,
    },
    {
      nombre: 'Progresión Personal',
      tipo: TIPO_COMPETENCIA_FORMACION.ESPECIFICA,
    },
    {
      nombre: 'Involucramiento comunitario',
      tipo: TIPO_COMPETENCIA_FORMACION.ESPECIFICA,
    },
    {
      nombre: 'Oportunidades de aprendizaje',
      tipo: TIPO_COMPETENCIA_FORMACION.ESPECIFICA,
    },
    {
      nombre: 'Aire libre y responsabilidad ambiental',
      tipo: TIPO_COMPETENCIA_FORMACION.ESPECIFICA,
    },
  ],
  3: [
    {
      nombre: 'Cuidado integral de las personas',
      tipo: TIPO_COMPETENCIA_FORMACION.ESENCIAL,
    },
    {
      nombre: 'Método scout',
      tipo: TIPO_COMPETENCIA_FORMACION.ESENCIAL,
    },
    {
      nombre: 'Sistema de Equipos',
      tipo: TIPO_COMPETENCIA_FORMACION.ESPECIFICA,
    },
    {
      nombre: 'Marco Simbólico',
      tipo: TIPO_COMPETENCIA_FORMACION.ESPECIFICA,
    },
    {
      nombre: 'Progresión Personal',
      tipo: TIPO_COMPETENCIA_FORMACION.ESPECIFICA,
    },
    {
      nombre: 'Involucramiento comunitario',
      tipo: TIPO_COMPETENCIA_FORMACION.ESPECIFICA,
    },
    {
      nombre: 'Oportunidades de aprendizaje',
      tipo: TIPO_COMPETENCIA_FORMACION.ESPECIFICA,
    },
    {
      nombre: 'Aire libre y responsabilidad ambiental',
      tipo: TIPO_COMPETENCIA_FORMACION.ESPECIFICA,
    },
  ],
};

const CAMINANTES_COMPETENCIAS_DETALLE: Record<
  number,
  Record<string, PlanCompetenciaSeed>
> = {
  1: {
    'Orientación al cambio': {
      nombre: 'Orientación al cambio',
      tipo: TIPO_COMPETENCIA_FORMACION.ESENCIAL,
      descripcion: 'Reconoce y comprende el cambio como oportunidad de mejora.',
      comportamientos: [
        'Acepta otras formas de hacer las cosas.',
        'Mantiene una actitud positiva cuando debe cambiar tareas, conceptos o funciones.',
      ],
      aprendizajes: [
        {
          descripcion:
            'Analiza el video sobre resistencia al cambio y reflexiona con su APF sobre su aplicabilidad en la tarea educativa.',
        },
      ],
      resultados: [
        'Las y los voluntarios reciben asertivamente los cambios de la organización.',
      ],
    },
    'Trabajo en equipo': {
      nombre: 'Trabajo en equipo',
      tipo: TIPO_COMPETENCIA_FORMACION.ESENCIAL,
      descripcion: 'Identifica la importancia del trabajo en equipo.',
      comportamientos: [
        'Conoce las responsabilidades y tareas relacionadas con su función.',
      ],
      aprendizajes: [
        {
          descripcion:
            'Lee la ruta de aprendizaje, consulta dudas y construye su plan de formación junto a su APF.',
        },
        {
          descripcion:
            'Participa de reuniones del equipo de educadoras y educadores de la rama.',
        },
      ],
      resultados: [
        'Las y los voluntarios participan activa y regularmente en el equipo donde se desempeñan.',
      ],
    },
    'Cultura asociativa': {
      nombre: 'Cultura asociativa',
      tipo: TIPO_COMPETENCIA_FORMACION.ESENCIAL,
      descripcion:
        'Identifica las estructuras de la organización y el funcionamiento del nivel en el que se desempeña.',
      comportamientos: [
        'Conoce la misión y las características esenciales del Movimiento Scout.',
        'Conoce la estructura de la organización en el nivel local e intermedio.',
      ],
      aprendizajes: [
        {
          descripcion:
            'Participa de la experiencia introductoria de formación de nivel básico.',
        },
        {
          descripcion:
            'Lee y analiza Características esenciales del Movimiento Scout, Reglamento General y Estatuto con su APF.',
        },
      ],
      resultados: [
        'Las y los voluntarios conocen la estructura del nivel en el que actúan y sus competencias.',
      ],
    },
    'Relaciones interpersonales': {
      nombre: 'Relaciones interpersonales',
      tipo: TIPO_COMPETENCIA_FORMACION.ESENCIAL,
      descripcion:
        'Establece vínculos respetuosos y positivos con otras personas.',
      comportamientos: [
        'Acepta las diferencias de las demás personas.',
        'Se refiere positivamente a otras personas y a su trabajo.',
      ],
      aprendizajes: [
        {
          descripcion:
            'Analiza materiales sobre motivación, tolerancia y actitud positiva junto a su APF.',
        },
      ],
      resultados: [
        'Genera un clima respetuoso y positivo dentro del equipo.',
      ],
    },
    'Cuidado integral de las personas': {
      nombre: 'Cuidado integral de las personas',
      tipo: TIPO_COMPETENCIA_FORMACION.ESENCIAL,
      descripcion:
        'Reconoce a niñas, niños, adolescentes, jóvenes y personas adultas como sujetos de derecho.',
      comportamientos: [
        'Reconoce a NNAJ y personas adultas como sujetos de derechos.',
        'Conoce normas, procedimientos y niveles básicos de seguridad.',
      ],
      aprendizajes: [
        {
          descripcion:
            'Estudia materiales del equipo de educadores, curso A Salvo del Peligro, seguro asociativo y herramientas de seguridad.',
        },
      ],
      resultados: [
        'Promueve y garantiza derechos, previene vulneraciones y conoce estándares de seguridad.',
      ],
    },
    'Método scout': {
      nombre: 'Método scout',
      tipo: TIPO_COMPETENCIA_FORMACION.ESENCIAL,
      descripcion:
        'Conoce los elementos del Método Scout y los comprende como sistema.',
      comportamientos: [
        'Identifica los elementos del Método Scout en las actividades de la rama.',
      ],
      aprendizajes: [
        {
          descripcion:
            'Participa de la experiencia introductoria y analiza materiales sobre los elementos del Método Scout.',
        },
      ],
      resultados: [
        'Las y los voluntarios conocen los elementos del Método Scout y los observan en la actividad de la rama.',
      ],
    },
    'Sistema de Equipos': {
      nombre: 'Sistema de Equipos',
      tipo: TIPO_COMPETENCIA_FORMACION.ESPECIFICA,
      descripcion:
        'Conoce el funcionamiento y la organización de la estructura de la rama.',
      comportamientos: [
        'Comprende la organización general de la Comunidad Caminante, su carta y órganos de gobierno.',
      ],
      aprendizajes: [
        {
          descripcion:
            'Lee el capítulo específico de la guía de rama y realiza actividades de apoyo en Rumbo Sur.',
        },
        {
          descripcion:
            'Participa de un Consejo de Marcha y de una Asamblea de Comunidad.',
        },
      ],
      resultados: [
        'Los espacios de gobierno funcionan como ámbitos democráticos con adecuada intervención educativa.',
      ],
    },
    'Marco Simbólico': {
      nombre: 'Marco Simbólico',
      tipo: TIPO_COMPETENCIA_FORMACION.ESPECIFICA,
      descripcion:
        'Reconoce los símbolos y acciones relevantes del marco simbólico de la rama.',
      comportamientos: [
        'Identifica símbolos y acciones importantes del marco simbólico.',
      ],
      aprendizajes: [
        {
          descripcion:
            'Lee el capítulo correspondiente y colabora en celebraciones y entregas de insignias.',
        },
      ],
      resultados: [
        'La vida de la comunidad se inspira en el marco simbólico de la rama.',
      ],
    },
    'Progresión Personal': {
      nombre: 'Progresión Personal',
      tipo: TIPO_COMPETENCIA_FORMACION.ESPECIFICA,
      descripcion:
        'Conoce las características de la progresión personal de las y los jóvenes.',
      comportamientos: [
        'Conoce las características de las juventudes en el país.',
        'Conoce etapas, momentos y herramientas de la progresión personal de la rama.',
      ],
      aprendizajes: [
        {
          descripcion:
            'Lee capítulos sobre adolescencias, método y progresión personal, y explora las herramientas vinculadas.',
        },
      ],
      resultados: [
        'Las y los jóvenes utilizan el Diario de Marcha como instrumento de progresión en la rama.',
      ],
    },
    'Involucramiento comunitario': {
      nombre: 'Involucramiento comunitario',
      tipo: TIPO_COMPETENCIA_FORMACION.ESPECIFICA,
      descripcion:
        'Identifica el sentido y las etapas de la descubierta como forma de compromiso comunitario.',
      comportamientos: [
        'Identifica las etapas y el sentido educativo de la descubierta.',
      ],
      aprendizajes: [
        {
          descripcion:
            'Lee el apartado de descubierta y participa en una descubierta con jóvenes.',
        },
      ],
      resultados: [
        'Las y los jóvenes realizan descubiertas en su entorno.',
      ],
    },
    'Oportunidades de aprendizaje': {
      nombre: 'Oportunidades de aprendizaje',
      tipo: TIPO_COMPETENCIA_FORMACION.ESPECIFICA,
      descripcion:
        'Conoce las oportunidades de aprendizaje adecuadas al grupo etario donde se desempeña.',
      comportamientos: [
        'Identifica cuáles son las oportunidades de aprendizaje y cómo se expresan en su rama.',
      ],
      aprendizajes: [
        {
          descripcion:
            'Lee el capítulo correspondiente, observa otra comunidad y selecciona técnicas de animación apropiadas.',
        },
      ],
      resultados: [
        'Colabora en la elaboración y animación de actividades de la Comunidad Caminante.',
      ],
    },
    'Aire libre y responsabilidad ambiental': {
      nombre: 'Aire libre y responsabilidad ambiental',
      tipo: TIPO_COMPETENCIA_FORMACION.ESPECIFICA,
      descripcion:
        'Acompaña y motiva la participación en actividades al aire libre y de responsabilidad ambiental.',
      comportamientos: [
        'Acompaña y motiva la participación en excursiones, campamentos, salidas y rally.',
      ],
      aprendizajes: [
        {
          descripcion:
            'Releva saberes necesarios con su APF, adquiere técnicas de vida al aire libre y participa en actividades de campamento.',
        },
      ],
      resultados: [
        'La comunidad valora y realiza actividades al aire libre con la frecuencia sugerida.',
      ],
    },
  },
  2: {
    'Cuidado integral de las personas': {
      nombre: 'Cuidado integral de las personas',
      tipo: TIPO_COMPETENCIA_FORMACION.ESENCIAL,
      descripcion:
        'Desarrolla estrategias educativas para promover y garantizar derechos.',
      comportamientos: [
        'Promueve la participación juvenil y garantiza su ejercicio en la práctica cotidiana.',
      ],
      aprendizajes: [
        {
          descripcion:
            'Lee materiales sobre participación juvenil y lineamientos de foros con acompañamiento de su APF.',
        },
      ],
      resultados: [
        'Garantiza la participación juvenil en todos sus niveles.',
      ],
    },
    'Método scout': {
      nombre: 'Método scout',
      tipo: TIPO_COMPETENCIA_FORMACION.ESENCIAL,
      descripcion:
        'Adapta el método al grupo etario y garantiza la presencia equilibrada de todos sus elementos.',
      comportamientos: [
        'Aplica el Método Scout de manera integral y adecuada al contexto de la rama.',
      ],
      aprendizajes: [
        {
          descripcion:
            'Lee el capítulo del método y utiliza la herramienta Grados de Implementación del Método Scout.',
        },
      ],
      resultados: [
        'Se evidencia una correcta aplicación del Método Scout en proyectos y actividades.',
      ],
    },
    'Sistema de Equipos': {
      nombre: 'Sistema de Equipos',
      tipo: TIPO_COMPETENCIA_FORMACION.ESPECIFICA,
      descripcion:
        'Promueve la participación juvenil en los órganos de gobierno y acompaña el funcionamiento de la rama.',
      comportamientos: [
        'Evalúa la organización de la comunidad y facilita el diseño o actualización de la Carta de Comunidad.',
      ],
      aprendizajes: [
        {
          descripcion:
            'Participa en experiencias intermedias, acompaña consejos y asambleas y usa herramientas de Propuesta Caminante.',
        },
      ],
      resultados: [
        'Las y los jóvenes asumen responsabilidades en decisiones y la Carta de Comunidad se mantiene actualizada.',
      ],
    },
    'Marco Simbólico': {
      nombre: 'Marco Simbólico',
      tipo: TIPO_COMPETENCIA_FORMACION.ESPECIFICA,
      descripcion:
        'Reconoce el sentido educativo del marco simbólico y anima sus celebraciones y acciones propias.',
      comportamientos: [
        'Anima celebraciones, pases, compromisos y actividades propias del marco simbólico.',
      ],
      aprendizajes: [
        {
          descripcion:
            'Participa en experiencias intermedias de marco simbólico y organiza celebraciones y raid con herramientas de apoyo.',
        },
      ],
      resultados: [
        'Los símbolos y acciones se usan adecuadamente según la propuesta educativa vigente.',
      ],
    },
    'Progresión Personal': {
      nombre: 'Progresión Personal',
      tipo: TIPO_COMPETENCIA_FORMACION.ESPECIFICA,
      descripcion:
        'Orienta el uso del Diario de Marcha y acompaña el seguimiento cercano de la progresión personal.',
      comportamientos: [
        'Evalúa avances, logros y estrategias de progresión personal.',
      ],
      aprendizajes: [
        {
          descripcion:
            'Participa en experiencias intermedias, presenta fichas, acompaña su uso y emplea herramientas de seguimiento.',
        },
      ],
      resultados: [
        'Las y los jóvenes desarrollan y evalúan su progresión personal con las herramientas previstas por la asociación.',
      ],
    },
    'Involucramiento comunitario': {
      nombre: 'Involucramiento comunitario',
      tipo: TIPO_COMPETENCIA_FORMACION.ESPECIFICA,
      descripcion:
        'Favorece la sensibilidad social, acompaña proyectos y gestiona vínculos con actores comunitarios.',
      comportamientos: [
        'Facilita herramientas para la mirada crítica y la acción comunitaria.',
      ],
      aprendizajes: [
        {
          descripcion:
            'Desarrolla actividades de debate, rally de solidaridad, gestión de proyectos y relevamiento de organizaciones.',
        },
      ],
      resultados: [
        'Las y los jóvenes planifican y desarrollan proyectos comunitarios e iniciativas regionales o globales.',
      ],
    },
    'Oportunidades de aprendizaje': {
      nombre: 'Oportunidades de aprendizaje',
      tipo: TIPO_COMPETENCIA_FORMACION.ESPECIFICA,
      descripcion:
        'Promueve la correcta aplicación del ciclo de programa y diseña oportunidades de aprendizaje equilibradas.',
      comportamientos: [
        'Facilita experiencias vinculadas a la Promesa, la Ley y el ciclo de programa.',
      ],
      aprendizajes: [
        {
          descripcion:
            'Organiza un ciclo de programa, participa en actividades variadas y diseña actividades de reflexión en valores.',
        },
      ],
      resultados: [
        'La comunidad desarrolla oportunidades variadas, equilibradas y alineadas con intereses y valores scouts.',
      ],
    },
    'Aire libre y responsabilidad ambiental': {
      nombre: 'Aire libre y responsabilidad ambiental',
      tipo: TIPO_COMPETENCIA_FORMACION.ESPECIFICA,
      descripcion:
        'Fomenta técnicas de vida al aire libre, campismo y proyectos ambientales.',
      comportamientos: [
        'Planifica actividades seguras que fortalecen la salud física, mental y el compromiso ambiental.',
      ],
      aprendizajes: [
        {
          descripcion:
            'Participa en experiencias intermedias, aplica campismo de bajo impacto y promueve proyectos ambientales.',
        },
      ],
      resultados: [
        'La comunidad protagoniza actividades al aire libre y desarrolla proyectos o descubiertas ambientales.',
      ],
    },
  },
  3: {
    'Cuidado integral de las personas': {
      nombre: 'Cuidado integral de las personas',
      tipo: TIPO_COMPETENCIA_FORMACION.ESENCIAL,
      descripcion:
        'Evalúa prácticas respecto de la seguridad integral biopsicosocial e interviene adecuadamente.',
      comportamientos: [
        'Evalúa necesidades emergentes y fortalece estrategias de cuidado integral.',
      ],
      aprendizajes: [
        {
          descripcion:
            'Se forma en primeros auxilios emocionales, emergencias y respuesta ante eventos no deseados.',
        },
      ],
      resultados: [
        'Adquiere herramientas para garantizar y promover la seguridad integral.',
      ],
    },
    'Método scout': {
      nombre: 'Método scout',
      tipo: TIPO_COMPETENCIA_FORMACION.ESENCIAL,
      descripcion:
        'Analiza el contexto, adecua el método y evalúa el clima educativo para introducir mejoras.',
      comportamientos: [
        'Evalúa el clima educativo e introduce ajustes pertinentes en la aplicación del método.',
      ],
      aprendizajes: [
        {
          descripcion:
            'Participa en propuestas sobre análisis de contexto, adecuación del método y evaluación del clima educativo.',
        },
      ],
      resultados: [
        'La comunidad responde a necesidades e intereses de las y los jóvenes de su contexto.',
      ],
    },
    'Sistema de Equipos': {
      nombre: 'Sistema de Equipos',
      tipo: TIPO_COMPETENCIA_FORMACION.ESPECIFICA,
      descripcion:
        'Evalúa prácticas, propone mejoras y fortalece el clima educativo y la resolución de conflictos.',
      comportamientos: [
        'Diseña herramientas para mejorar la participación y el funcionamiento del sistema de equipos.',
      ],
      aprendizajes: [
        {
          descripcion:
            'Participa en experiencias avanzadas de liderazgo y resolución de conflictos y usa herramientas de evaluación del sistema.',
        },
      ],
      resultados: [
        'Se sostiene una mejora continua del sistema de equipos y de la Carta de Comunidad.',
      ],
    },
    'Marco Simbólico': {
      nombre: 'Marco Simbólico',
      tipo: TIPO_COMPETENCIA_FORMACION.ESPECIFICA,
      descripcion:
        'Identifica prácticas inadecuadas del marco simbólico y orienta a otros educadores en su aplicación.',
      comportamientos: [
        'Promueve el uso educativo del marco simbólico como transmisor de valores.',
      ],
      aprendizajes: [
        {
          descripcion:
            'Utiliza indicadores de marco simbólico, evaluación de clima y materiales sobre problemas frecuentes de aplicación.',
        },
      ],
      resultados: [
        'La comunidad utiliza el marco simbólico como medio para transmitir valores.',
      ],
    },
    'Progresión Personal': {
      nombre: 'Progresión Personal',
      tipo: TIPO_COMPETENCIA_FORMACION.ESPECIFICA,
      descripcion:
        'Acompaña la elección de nuevas competencias y diseña oportunidades de aprendizaje al servicio de la progresión.',
      comportamientos: [
        'Fortalece el reconocimiento de avances y motiva nuevas acciones de progresión.',
      ],
      aprendizajes: [
        {
          descripcion:
            'Acompaña elecciones con fichas y Diario de Marcha, orienta a tutores y explora nuevas ideas para la progresión.',
        },
      ],
      resultados: [
        'Las y los jóvenes son reconocidos en la etapa y momento adecuados de su progresión personal.',
      ],
    },
    'Involucramiento comunitario': {
      nombre: 'Involucramiento comunitario',
      tipo: TIPO_COMPETENCIA_FORMACION.ESPECIFICA,
      descripcion:
        'Evalúa descubiertas y proyectos y promueve reflexión ética y posicionamiento ciudadano.',
      comportamientos: [
        'Facilita la reflexión sobre discriminación, conflictos, prejuicios y compromiso social.',
      ],
      aprendizajes: [
        {
          descripcion:
            'Usa herramientas de evaluación y selecciona actividades sobre problemáticas sociales contemporáneas.',
        },
      ],
      resultados: [
        'Las y los jóvenes son reconocidos por la comunidad local como protagonistas de proyectos comunitarios.',
      ],
    },
    'Oportunidades de aprendizaje': {
      nombre: 'Oportunidades de aprendizaje',
      tipo: TIPO_COMPETENCIA_FORMACION.ESPECIFICA,
      descripcion:
        'Evalúa prácticas y diseña estrategias de mejora e innovación en las propuestas educativas.',
      comportamientos: [
        'Promueve oportunidades más creativas, innovadoras y desafiantes.',
      ],
      aprendizajes: [
        {
          descripcion:
            'Participa en experiencias avanzadas, usa indicadores de implementación del método y explora ideas innovadoras.',
        },
      ],
      resultados: [
        'La comunidad accede a oportunidades de aprendizaje creativas, innovadoras y desafiantes.',
      ],
    },
    'Aire libre y responsabilidad ambiental': {
      nombre: 'Aire libre y responsabilidad ambiental',
      tipo: TIPO_COMPETENCIA_FORMACION.ESPECIFICA,
      descripcion:
        'Promueve la reflexión ambiental, reduce la huella de las actividades y revaloriza la vida al aire libre.',
      comportamientos: [
        'Diseña estrategias para potenciar actividades innovadoras vinculadas al ambiente.',
      ],
      aprendizajes: [
        {
          descripcion:
            'Realiza descubiertas ambientales, evalúa impactos, contacta expertos y organiza iniciativas innovadoras.',
        },
      ],
      resultados: [
        'La comunidad es consciente de su impacto ambiental y desarrolla aprendizajes innovadores al aire libre.',
      ],
    },
  },
};

type RoleDefinition = {
  nombre: string;
  descripcion: string;
  permissions: Array<{
    actions: readonly ACTION[];
    resources: readonly RESOURCE[];
  }>;
};

const PROTAGONISTA_READONLY_RESOURCES = [
  RESOURCE.CUENTA_DINERO,
  RESOURCE.COMISION,
  RESOURCE.PARTICIPANTE_COMISION,
  RESOURCE.PLAN_FORMACION,
  RESOURCE.PLAN_DESEMPENO,
] as const;

const RAMA_ROLE_PERMISSIONS: RoleDefinition['permissions'] = [
  {
    actions: CRUD_ACTIONS,
    resources: RAMA_FULL_ACCESS_RESOURCES,
  },
  {
    actions: [ACTION.READ],
    resources: RAMA_READONLY_RESOURCES,
  },
];

const ADULT_CONCEPTO_PAGO_PERMISSIONS: RoleDefinition['permissions'][number] = {
  actions: CRUD_ACTIONS,
  resources: [RESOURCE.CONCEPTO_PAGO],
};

const ADULT_METODO_PAGO_PERMISSIONS: RoleDefinition['permissions'][number] = {
  actions: CRUD_ACTIONS,
  resources: [RESOURCE.METODO_PAGO],
};

const ADULT_CUENTA_DINERO_PERMISSIONS: RoleDefinition['permissions'][number] = {
  actions: CRUD_ACTIONS,
  resources: [RESOURCE.CUENTA_DINERO],
};

const ADULT_CONSEJO_PERMISSIONS: RoleDefinition['permissions'][number] = {
  actions: CRUD_ACTIONS,
  resources: [RESOURCE.CONSEJO],
};

const ADULT_EVENTO_PERMISSIONS: RoleDefinition['permissions'][number] = {
  actions: CRUD_ACTIONS,
  resources: [RESOURCE.EVENTO, RESOURCE.INSCRIPCION],
};

const ADULT_COMISION_PERMISSIONS: RoleDefinition['permissions'][number] = {
  actions: CRUD_ACTIONS,
  resources: [RESOURCE.COMISION, RESOURCE.PARTICIPANTE_COMISION],
};

const ADULT_TIPO_EVENTO_PERMISSIONS: RoleDefinition['permissions'][number] = {
  actions: CRUD_ACTIONS,
  resources: [RESOURCE.TIPO_EVENTO],
};

const ADULT_RESPONSABLE_PERMISSIONS: RoleDefinition['permissions'][number] = {
  actions: CRUD_ACTIONS,
  resources: [RESOURCE.RESPONSABLE],
};

const ADULT_RELACION_PERMISSIONS: RoleDefinition['permissions'][number] = {
  actions: CRUD_ACTIONS,
  resources: [RESOURCE.RELACION],
};

const ADULT_PLAN_FORMACION_PERMISSIONS: RoleDefinition['permissions'][number] = {
  actions: CRUD_ACTIONS,
  resources: [RESOURCE.PLAN_FORMACION, RESOURCE.ADJUNTO_FORMACION],
};

const ADULT_PLAN_DESEMPENO_PERMISSIONS: RoleDefinition['permissions'][number] = {
  actions: CRUD_ACTIONS,
  resources: [RESOURCE.PLAN_DESEMPENO],
};

const RESPONSABLE_READ_PERMISSIONS: RoleDefinition['permissions'][number] = {
  actions: [ACTION.READ],
  resources: ALL_RESOURCES.filter(
    (resource) => resource !== RESOURCE.RELACION,
  ),
};

const ROLE_DEFINITIONS: RoleDefinition[] = [
  {
    nombre: 'ADM',
    descripcion:
      'Superusuario tecnico con acceso total a todos los recursos del sistema.',
    permissions: [
      {
        actions: [ACTION.MANAGE],
        resources: ALL_RESOURCES,
      },
    ],
  },
  {
    nombre: 'DEV',
    descripcion:
      'Perfil tecnico de desarrollo con acceso total para diagnostico, auditoria y mantenimiento del sistema.',
    permissions: [
      {
        actions: [ACTION.MANAGE],
        resources: ALL_RESOURCES,
      },
    ],
  },
  {
    nombre: 'PROTAGONISTA',
    descripcion:
      'Acceso personal a su caja y a la caja de la rama segun las reglas de filtrado del backend.',
    permissions: [
      {
        actions: [ACTION.READ],
        resources: PROTAGONISTA_READONLY_RESOURCES,
      },
    ],
  },
  {
    nombre: 'RESPONSABLE',
    descripcion:
      'Acceso de lectura general sobre las secciones habilitadas para consulta, con restricciones aplicadas por el backend segun sus vinculos.',
    permissions: [
      RESPONSABLE_READ_PERMISSIONS,
    ],
  },
  {
    nombre: 'JEFATURA',
    descripcion:
      'Acceso total a las herramientas del sistema con capacidad de realizar modificaciones.',
    permissions: [
      {
        actions: [ACTION.MANAGE],
        resources: ALL_RESOURCES,
      },
      ADULT_CONCEPTO_PAGO_PERMISSIONS,
      ADULT_METODO_PAGO_PERMISSIONS,
      ADULT_CUENTA_DINERO_PERMISSIONS,
      ADULT_CONSEJO_PERMISSIONS,
      ADULT_EVENTO_PERMISSIONS,
      ADULT_COMISION_PERMISSIONS,
      ADULT_TIPO_EVENTO_PERMISSIONS,
      ADULT_PLAN_FORMACION_PERMISSIONS,
      ADULT_PLAN_DESEMPENO_PERMISSIONS,
    ],
  },
  {
    nombre: 'AYUDANTE',
    descripcion:
      'Acceso total de grupo para adultos comodin que colaboran transversalmente entre jefatura y ramas segun necesidad operativa.',
    permissions: [
      {
        actions: [ACTION.MANAGE],
        resources: ALL_RESOURCES,
      },
      ADULT_CONCEPTO_PAGO_PERMISSIONS,
      ADULT_METODO_PAGO_PERMISSIONS,
      ADULT_CUENTA_DINERO_PERMISSIONS,
      ADULT_CONSEJO_PERMISSIONS,
      ADULT_EVENTO_PERMISSIONS,
      ADULT_COMISION_PERMISSIONS,
      ADULT_TIPO_EVENTO_PERMISSIONS,
      ADULT_PLAN_FORMACION_PERMISSIONS,
      ADULT_PLAN_DESEMPENO_PERMISSIONS,
    ],
  },
  {
    nombre: 'SECRETARIA_TESORERIA',
    descripcion:
      'Acceso completo al area de pagos, eventos, inscripciones y gestion de miembros.',
    permissions: [
      {
        actions: CRUD_ACTIONS,
        resources: SECRETARIA_TESORERIA_RESOURCES,
      },
      ADULT_COMISION_PERMISSIONS,
      {
        actions: [ACTION.READ],
        resources: ADULTO_READONLY_RESOURCES,
      },
      ADULT_CONCEPTO_PAGO_PERMISSIONS,
      ADULT_METODO_PAGO_PERMISSIONS,
      ADULT_CUENTA_DINERO_PERMISSIONS,
      ADULT_EVENTO_PERMISSIONS,
      ADULT_COMISION_PERMISSIONS,
      ADULT_TIPO_EVENTO_PERMISSIONS,
      ADULT_PLAN_FORMACION_PERMISSIONS,
      ADULT_PLAN_DESEMPENO_PERMISSIONS,
    ],
  },
  {
    nombre: 'JEFATURA_RAMA',
    descripcion:
      'Acceso total a protagonistas, adultos y demas gestion correspondiente a su rama.',
    permissions: [
      ...RAMA_ROLE_PERMISSIONS,
      ADULT_RESPONSABLE_PERMISSIONS,
      ADULT_CONCEPTO_PAGO_PERMISSIONS,
      ADULT_METODO_PAGO_PERMISSIONS,
      ADULT_CUENTA_DINERO_PERMISSIONS,
      ADULT_CONSEJO_PERMISSIONS,
      ADULT_TIPO_EVENTO_PERMISSIONS,
      ADULT_PLAN_FORMACION_PERMISSIONS,
      ADULT_PLAN_DESEMPENO_PERMISSIONS,
    ],
  },
  {
    nombre: 'AYUDANTE_RAMA',
    descripcion:
      'Mismos permisos exactos que Jefatura de Rama para mantener la gestion horizontal dentro de su rama.',
    permissions: [
      ...RAMA_ROLE_PERMISSIONS,
      ADULT_RESPONSABLE_PERMISSIONS,
      ADULT_CONCEPTO_PAGO_PERMISSIONS,
      ADULT_METODO_PAGO_PERMISSIONS,
      ADULT_CUENTA_DINERO_PERMISSIONS,
      ADULT_CONSEJO_PERMISSIONS,
      ADULT_TIPO_EVENTO_PERMISSIONS,
      ADULT_PLAN_FORMACION_PERMISSIONS,
      ADULT_PLAN_DESEMPENO_PERMISSIONS,
    ],
  },
  {
    nombre: 'INTENDENCIA',
    descripcion:
      'Acceso de lectura al padron adulto para coordinacion operativa del area.',
    permissions: [
      {
        actions: [ACTION.READ],
        resources: INTENDENCIA_READONLY_RESOURCES,
      },
      ADULT_EVENTO_PERMISSIONS,
      ADULT_COMISION_PERMISSIONS,
      ADULT_RESPONSABLE_PERMISSIONS,
      ADULT_RELACION_PERMISSIONS,
      ADULT_CONCEPTO_PAGO_PERMISSIONS,
      ADULT_METODO_PAGO_PERMISSIONS,
      ADULT_CUENTA_DINERO_PERMISSIONS,
      ADULT_CONSEJO_PERMISSIONS,
      ADULT_PLAN_FORMACION_PERMISSIONS,
      ADULT_PLAN_DESEMPENO_PERMISSIONS,
    ],
  },
];

const ADMIN_DNI = '00000000';

function getRequiredEnv(name: string): string {
  const value = process.env[name]?.trim();

  if (!value) {
    throw new Error(
      `Falta la variable de entorno ${name} para ejecutar el seed del usuario admin.`,
    );
  }

  return value;
}

function buildPermissionKey(action: ACTION, resource: RESOURCE): string {
  return `${action}:${resource}`;
}

async function seedRolesAndPermissions(
  tx: Prisma.TransactionClient,
): Promise<Map<string, number>> {
  console.log('Creando roles y permisos base...');

  for (const role of ROLE_DEFINITIONS) {
    await tx.role.upsert({
      where: { nombre: role.nombre },
      update: { descripcion: role.descripcion },
      create: {
        nombre: role.nombre,
        descripcion: role.descripcion,
      },
    });
  }

  const permissionMap = new Map<
    string,
    { action: ACTION; resource: RESOURCE }
  >();

  for (const role of ROLE_DEFINITIONS) {
    for (const permissionGroup of role.permissions) {
      for (const action of permissionGroup.actions) {
        for (const resource of permissionGroup.resources) {
          permissionMap.set(buildPermissionKey(action, resource), {
            action,
            resource,
          });
        }
      }
    }
  }

  const permissionsToCreate = Array.from(permissionMap.values());

  if (permissionsToCreate.length > 0) {
    await tx.permission.createMany({
      data: permissionsToCreate,
      skipDuplicates: true,
    });
  }

  const roles = await tx.role.findMany({
    where: {
      nombre: {
        in: ROLE_DEFINITIONS.map((role) => role.nombre),
      },
    },
  });

  const roleIdByName = new Map(roles.map((role) => [role.nombre, role.id]));

  const permissions = await tx.permission.findMany({
    where: {
      OR: permissionsToCreate.map((permission) => ({
        action: permission.action,
        resource: permission.resource,
      })),
    },
  });

  const permissionIdByKey = new Map(
    permissions.map((permission) => [
      buildPermissionKey(permission.action, permission.resource),
      permission.id,
    ]),
  );

  await tx.rolePermission.deleteMany({
    where: {
      id_role: {
        in: Array.from(roleIdByName.values()),
      },
    },
  });

  const rolePermissionsToCreate = ROLE_DEFINITIONS.flatMap((role) => {
    const roleId = roleIdByName.get(role.nombre);

    if (!roleId) {
      throw new Error(
        `No se pudo resolver el rol ${role.nombre} durante el seed.`,
      );
    }

    return role.permissions.flatMap((permissionGroup) =>
      permissionGroup.actions.flatMap((action) =>
        permissionGroup.resources.map((resource) => {
          const permissionId = permissionIdByKey.get(
            buildPermissionKey(action, resource),
          );

          if (!permissionId) {
            throw new Error(
              `No se pudo resolver el permiso ${buildPermissionKey(action, resource)} durante el seed.`,
            );
          }

          return {
            id_role: roleId,
            id_permission: permissionId,
          };
        }),
      ),
    );
  });

  if (rolePermissionsToCreate.length > 0) {
    await tx.rolePermission.createMany({
      data: rolePermissionsToCreate,
      skipDuplicates: true,
    });
  }

  return roleIdByName;
}

async function seedAreasAndRamas(tx: Prisma.TransactionClient): Promise<void> {
  console.log('Creando areas y ramas base...');

  for (const area of AREA_DEFINITIONS) {
    await tx.area.upsert({
      where: { nombre: area.nombre },
      update: { descripcion: area.descripcion },
      create: {
        nombre: area.nombre,
        descripcion: area.descripcion,
      },
    });
  }

  const areaRama = await tx.area.findUnique({
    where: { nombre: 'Rama' },
  });

  if (!areaRama) {
    throw new Error('No se pudo resolver el area Rama durante el seed.');
  }

  for (const rama of RAMA_DEFINITIONS) {
    await tx.rama.upsert({
      where: { nombre: rama.nombre },
      update: {
        descripcion: rama.descripcion,
        edad_minima_protagonistas: rama.edad_minima_protagonistas,
        edad_maxima_protagonistas: rama.edad_maxima_protagonistas,
        edad_minima_adulto: rama.edad_minima_adulto,
        id_area: areaRama.id,
      },
      create: {
        nombre: rama.nombre,
        descripcion: rama.descripcion,
        edad_minima_protagonistas: rama.edad_minima_protagonistas,
        edad_maxima_protagonistas: rama.edad_maxima_protagonistas,
        edad_minima_adulto: rama.edad_minima_adulto,
        id_area: areaRama.id,
      },
    });
  }
}

async function seedPosicionesArea(tx: Prisma.TransactionClient): Promise<void> {
  console.log('Creando posiciones de area base...');

  for (const posicion of POSICION_AREA_DEFINITIONS) {
    await tx.posicionArea.upsert({
      where: { nombre: posicion.nombre },
      update: { descripcion: posicion.descripcion },
      create: {
        nombre: posicion.nombre,
        descripcion: posicion.descripcion,
      },
    });
  }
}

async function seedConceptosPago(tx: Prisma.TransactionClient): Promise<void> {
  console.log('Creando conceptos de pago base...');

  for (const conceptoPago of CONCEPTO_PAGO_DEFINITIONS) {
    const existing = await tx.conceptoPago.findFirst({
      where: {
        nombre: conceptoPago.nombre,
      },
      select: {
        id: true,
      },
    });

    if (existing) {
      await tx.conceptoPago.update({
        where: { id: existing.id },
        data: {
          descripcion: conceptoPago.descripcion,
          borrado: false,
        },
      });

      continue;
    }

    await tx.conceptoPago.create({
      data: {
        nombre: conceptoPago.nombre,
        descripcion: conceptoPago.descripcion,
      },
    });
  }
}

async function seedMetodosPago(tx: Prisma.TransactionClient): Promise<void> {
  console.log('Creando metodos de pago base...');

  for (const metodoPago of METODO_PAGO_DEFINITIONS) {
    const existing = await tx.metodoPago.findFirst({
      where: {
        nombre: metodoPago.nombre,
      },
      select: {
        id: true,
      },
    });

    if (existing) {
      await tx.metodoPago.update({
        where: { id: existing.id },
        data: {
          descripcion: metodoPago.descripcion,
          borrado: false,
        },
      });

      continue;
    }

    await tx.metodoPago.create({
      data: {
        nombre: metodoPago.nombre,
        descripcion: metodoPago.descripcion,
      },
    });
  }
}

async function seedTiposEvento(tx: Prisma.TransactionClient): Promise<void> {
  console.log('Creando tipos de evento base...');

  for (const tipoEvento of TIPO_EVENTO_DEFINITIONS) {
    const existing = await tx.tipoEvento.findFirst({
      where: {
        nombre: tipoEvento.nombre,
      },
      select: {
        id: true,
      },
    });

    if (existing) {
      await tx.tipoEvento.update({
        where: { id: existing.id },
        data: {
          descripcion: tipoEvento.descripcion,
          borrado: false,
        },
      });

      continue;
    }

    await tx.tipoEvento.create({
      data: {
        nombre: tipoEvento.nombre,
        descripcion: tipoEvento.descripcion,
      },
    });
  }
}

async function seedRelaciones(tx: Prisma.TransactionClient): Promise<void> {
  for (const relacion of RELACION_DEFINITIONS) {
    const existing = await tx.relacion.findFirst({
      where: {
        tipo: relacion.tipo,
      },
      select: {
        id: true,
      },
    });

    if (existing) {
      await tx.relacion.update({
        where: { id: existing.id },
        data: {
          tipo: relacion.tipo,
          descripcion: relacion.descripcion,
        },
      });
      continue;
    }

    await tx.relacion.create({
      data: {
        tipo: relacion.tipo,
        descripcion: relacion.descripcion,
      },
    });
  }
}

async function seedPlanesFormacionTemplate(
  tx: Prisma.TransactionClient,
): Promise<void> {
  console.log('Creando plantillas base de formacion...');

  for (const definition of PLAN_FORMACION_TEMPLATE_DEFINITIONS) {
    const area = await tx.area.findFirst({
      where: {
        nombre: definition.areaNombre,
        borrado: false,
      },
      select: {
        id: true,
      },
    });

    if (!area) {
      throw new Error(
        `No se encontro el area ${definition.areaNombre} para planes de formacion.`,
      );
    }

    const existingTemplate = await tx.planFormacionTemplate.findFirst({
      where: {
        nombre: definition.nombre,
      },
      select: {
        id: true,
      },
    });

    const template = existingTemplate
      ? await tx.planFormacionTemplate.update({
          where: { id: existingTemplate.id },
          data: {
            descripcion: definition.descripcion,
            id_area: area.id,
            activo: true,
            borrado: false,
          },
          select: {
            id: true,
          },
        })
      : await tx.planFormacionTemplate.create({
          data: {
            nombre: definition.nombre,
            descripcion: definition.descripcion,
            id_area: area.id,
            activo: true,
          },
          select: {
            id: true,
          },
        });

    const nivelesByOrden = new Map<
      number,
      {
        id: number;
        nombre: string;
      }
    >();

    for (const nivel of PLAN_FORMACION_NIVELES) {
      const existingNivel = await tx.planFormacionNivelTemplate.findFirst({
        where: {
          id_plan_formacion_template: template.id,
          orden: nivel.orden,
        },
        select: {
          id: true,
        },
      });

      const persistedNivel = existingNivel
        ? await tx.planFormacionNivelTemplate.update({
          where: { id: existingNivel.id },
          data: {
            nombre: nivel.nombre,
            descripcion: nivel.descripcion,
            borrado: false,
          },
          select: {
            id: true,
            nombre: true,
          },
        })
        : await tx.planFormacionNivelTemplate.create({
          data: {
            id_plan_formacion_template: template.id,
            orden: nivel.orden,
            nombre: nivel.nombre,
            descripcion: nivel.descripcion,
          },
          select: {
            id: true,
            nombre: true,
          },
        });

      nivelesByOrden.set(nivel.orden, persistedNivel);
    }

    for (const [ordenNivel, persistedNivel] of nivelesByOrden.entries()) {
      const competenciasBase =
        PLAN_FORMACION_COMPETENCIAS_POR_NIVEL[ordenNivel] ?? [];
      const competenciasDetalle =
        definition.nombre === 'Rutas de aprendizaje - Caminantes'
          ? CAMINANTES_COMPETENCIAS_DETALLE[ordenNivel] ?? {}
          : {};
      const competencias = competenciasBase.map((competenciaBase) => {
        const detalle = competenciasDetalle[competenciaBase.nombre];

        if (!detalle) {
          return competenciaBase;
        }

        return {
          ...competenciaBase,
          ...detalle,
        };
      });

      for (const competencia of competencias) {
        const existingCompetencia =
          await tx.planFormacionCompetenciaTemplate.findFirst({
            where: {
              id_nivel_template: persistedNivel.id,
              nombre: competencia.nombre,
            },
            select: {
              id: true,
            },
          });

        const competenciaPersistida = existingCompetencia
          ? await tx.planFormacionCompetenciaTemplate.update({
              where: { id: existingCompetencia.id },
              data: {
                nombre: competencia.nombre,
                descripcion: competencia.descripcion,
                tipo: competencia.tipo,
                borrado: false,
              },
              select: {
                id: true,
              },
            })
          : await tx.planFormacionCompetenciaTemplate.create({
              data: {
                id_nivel_template: persistedNivel.id,
                nombre: competencia.nombre,
                descripcion: competencia.descripcion,
                tipo: competencia.tipo,
              },
              select: {
                id: true,
              },
            });

        if (competencia.comportamientos) {
          for (const [index, descripcion] of competencia.comportamientos.entries()) {
            const orden = index + 1;
            const existingComportamiento =
              await tx.planFormacionComportamientoTemplate.findFirst({
                where: {
                  id_competencia_template: competenciaPersistida.id,
                  orden,
                },
                select: {
                  id: true,
                },
              });

            if (existingComportamiento) {
              await tx.planFormacionComportamientoTemplate.update({
                where: { id: existingComportamiento.id },
                data: {
                  descripcion,
                  borrado: false,
                },
              });
            } else {
              await tx.planFormacionComportamientoTemplate.create({
                data: {
                  id_competencia_template: competenciaPersistida.id,
                  orden,
                  descripcion,
                },
              });
            }
          }
        }

        if (competencia.aprendizajes) {
          for (const [index, aprendizaje] of competencia.aprendizajes.entries()) {
            const orden = index + 1;
            const existingAprendizaje =
              await tx.planFormacionAprendizajeTemplate.findFirst({
                where: {
                  id_competencia_template: competenciaPersistida.id,
                  orden,
                },
                select: {
                  id: true,
                },
              });

            if (existingAprendizaje) {
              await tx.planFormacionAprendizajeTemplate.update({
                where: { id: existingAprendizaje.id },
                data: {
                  descripcion: aprendizaje.descripcion,
                  obligatoria: aprendizaje.obligatoria ?? true,
                  borrado: false,
                },
              });
            } else {
              await tx.planFormacionAprendizajeTemplate.create({
                data: {
                  id_competencia_template: competenciaPersistida.id,
                  orden,
                  descripcion: aprendizaje.descripcion,
                  obligatoria: aprendizaje.obligatoria ?? true,
                },
              });
            }
          }
        }

        if (competencia.resultados) {
          for (const [index, descripcion] of competencia.resultados.entries()) {
            const orden = index + 1;
            const existingResultado =
              await tx.planFormacionResultadoTemplate.findFirst({
                where: {
                  id_competencia_template: competenciaPersistida.id,
                  orden,
                },
                select: {
                  id: true,
                },
              });

            if (existingResultado) {
              await tx.planFormacionResultadoTemplate.update({
                where: { id: existingResultado.id },
                data: {
                  descripcion,
                  borrado: false,
                },
              });
            } else {
              await tx.planFormacionResultadoTemplate.create({
                data: {
                  id_competencia_template: competenciaPersistida.id,
                  orden,
                  descripcion,
                },
              });
            }
          }
        }
      }

      const nombresCompetencias = competencias.map(({ nombre }) => nombre);

      await tx.planFormacionCompetenciaTemplate.updateMany({
        where: {
          id_nivel_template: persistedNivel.id,
          nombre: {
            notIn: nombresCompetencias,
          },
        },
        data: {
          borrado: true,
        },
      });
    }
  }
}

async function seedCuentasDineroBase(
  tx: Prisma.TransactionClient,
): Promise<void> {
  console.log('Creando cuentas de dinero base...');

  const areaJefatura = await tx.area.findFirst({
    where: {
      nombre: 'Jefatura',
      borrado: false,
    },
    select: {
      id: true,
      nombre: true,
    },
  });

  if (!areaJefatura) {
    throw new Error('No se pudo resolver el area Jefatura durante el seed.');
  }

  const areaRama = await tx.area.findFirst({
    where: {
      nombre: 'Rama',
      borrado: false,
    },
    select: {
      id: true,
    },
  });

  if (!areaRama) {
    throw new Error('No se pudo resolver el area Rama durante el seed.');
  }

  const ramas = await tx.rama.findMany({
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
  });

  const cuentaGeneral = await tx.cuentaDinero.findFirst({
    where: {
      nombre: 'Caja General Grupo',
    },
    select: {
      id: true,
    },
  });

  if (cuentaGeneral) {
    await tx.cuentaDinero.update({
      where: { id: cuentaGeneral.id },
      data: {
        descripcion: 'Cuenta general del grupo administrada por Jefatura.',
        id_area: areaJefatura.id,
        id_rama: null,
        id_miembro: null,
        borrado: false,
      },
    });
  } else {
    await tx.cuentaDinero.create({
      data: {
        nombre: 'Caja General Grupo',
        descripcion: 'Cuenta general del grupo administrada por Jefatura.',
        id_area: areaJefatura.id,
      },
    });
  }

  for (const rama of ramas) {
    const existing = await tx.cuentaDinero.findFirst({
      where: {
        id_rama: rama.id,
        id_miembro: null,
      },
      select: {
        id: true,
      },
    });

    const data = {
      nombre: `Caja ${rama.nombre}`,
      descripcion: `Cuenta de dinero asociada a la rama ${rama.nombre}.`,
      id_area: areaRama.id,
      id_rama: rama.id,
      id_miembro: null,
      borrado: false,
    };

    if (existing) {
      await tx.cuentaDinero.update({
        where: { id: existing.id },
        data,
      });
      continue;
    }

    await tx.cuentaDinero.create({ data });
  }
}

async function seedAdminAccount(
  tx: Prisma.TransactionClient,
  roleIdByName: Map<string, number>,
): Promise<void> {
  console.log('Creando usuario admin...');

  const adminUser = getRequiredEnv('SEED_ADMIN_USER');
  const adminEmail = getRequiredEnv('SEED_ADMIN_EMAIL');
  const adminPassword = getRequiredEnv('SEED_ADMIN_PASSWORD');

  const jefaturaRoleId = roleIdByName.get('JEFATURA');
  const admRoleId = roleIdByName.get('ADM');

  if (!jefaturaRoleId || !admRoleId) {
    throw new Error(
      'Los roles JEFATURA y ADM son obligatorios para crear el usuario admin.',
    );
  }

  const hashedPassword = await bcrypt.hash(adminPassword, 10);

  const cuentaByUser = await tx.cuenta.findUnique({
    where: { user: adminUser },
  });

  const miembro = await tx.miembro.findUnique({
    where: { dni: ADMIN_DNI },
  });

  if (miembro && cuentaByUser && miembro.id_cuenta !== cuentaByUser.id) {
    throw new Error(
      `El usuario admin ${adminUser} ya existe en otra cuenta distinta a la vinculada al DNI ${ADMIN_DNI}. Regulariza ese conflicto antes de reintentar el seed.`,
    );
  }

  let cuenta = cuentaByUser;

  if (!cuenta && miembro) {
    cuenta = await tx.cuenta.findUnique({
      where: { id: miembro.id_cuenta },
    });
  }

  if (!cuenta) {
    cuenta = await tx.cuenta.create({
      data: {
        user: adminUser,
        password: hashedPassword,
      },
    });
  } else {
    cuenta = await tx.cuenta.update({
      where: { id: cuenta.id },
      data: {
        user: adminUser,
        password: hashedPassword,
        borrado: false,
      },
    });
  }

  if (!miembro) {
    await tx.miembro.create({
      data: {
        nombre: 'Super',
        apellidos: 'Admin',
        dni: ADMIN_DNI,
        fecha_nacimiento: new Date('1990-01-01'),
        direccion: 'Calle Falsa 123',
        email: adminEmail,
        telefono_emergencia: '911',
        id_cuenta: cuenta.id,
      },
    });
  } else {
    await tx.miembro.update({
      where: { id: miembro.id },
      data: {
        email: adminEmail,
        borrado: false,
      },
    });
  }

  const adminRoleAssignment = await tx.cuentaRole.findFirst({
    where: {
      id_cuenta: cuenta.id,
      id_role: jefaturaRoleId,
      tipo_scope: SCOPE.GRUPO,
      id_scope: null,
    },
  });

  if (!adminRoleAssignment) {
    await tx.cuentaRole.create({
      data: {
        id_cuenta: cuenta.id,
        id_role: jefaturaRoleId,
        tipo_scope: SCOPE.GRUPO,
      },
    });
  }

  const admRoleAssignment = await tx.cuentaRole.findFirst({
    where: {
      id_cuenta: cuenta.id,
      id_role: admRoleId,
      tipo_scope: SCOPE.GRUPO,
      id_scope: null,
    },
  });

  if (!admRoleAssignment) {
    await tx.cuentaRole.create({
      data: {
        id_cuenta: cuenta.id,
        id_role: admRoleId,
        tipo_scope: SCOPE.GRUPO,
      },
    });
  }
}

async function main() {
  console.log('Iniciando seed...');

  await prisma.$transaction(async (tx) => {
    const roleIdByName = await seedRolesAndPermissions(tx);
    await seedAreasAndRamas(tx);
    await seedPosicionesArea(tx);
    await seedConceptosPago(tx);
    await seedMetodosPago(tx);
    await seedTiposEvento(tx);
    await seedRelaciones(tx);
    await seedPlanesFormacionTemplate(tx);
    await seedCuentasDineroBase(tx);
    await seedAdminAccount(tx, roleIdByName);
  });

  console.log('Seed completado con exito.');
}

main()
  .catch((error) => {
    console.error('Error en el seed:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
