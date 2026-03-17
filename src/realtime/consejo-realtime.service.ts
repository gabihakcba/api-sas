import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  ConsejoRealtimeHand,
  ConsejoRealtimeSpeaker,
  ConsejoRealtimeState,
  ConsejoRealtimeTemarioUpdate,
} from './realtime.types';

type ConsejoRealtimeMemoryState = {
  speakers: ConsejoRealtimeSpeaker[];
  raisedHands: ConsejoRealtimeHand[];
};

type ConsejoRealtimeContext = {
  id_moderador: number | null;
  fecha: Date;
  hora_fin: Date | null;
  AsistenciaConsejo: Array<{
    descripcion: string;
    Miembro: {
      id: number;
      nombre: string;
      apellidos: string;
    };
  }>;
};

@Injectable()
export class ConsejoRealtimeService {
  private readonly states = new Map<number, ConsejoRealtimeMemoryState>();

  constructor(private readonly prisma: PrismaService) {}

  async getState(idConsejo: number): Promise<ConsejoRealtimeState> {
    const consejo = await this.getConsejoContext(idConsejo);
    const state = this.getOrCreateState(idConsejo, consejo);

    return {
      speakers: state.speakers,
      raisedHands: state.raisedHands,
      moderatorMemberId: consejo.id_moderador ?? null,
    };
  }

  async raiseHand(idConsejo: number, memberId: number | null) {
    const consejo = await this.getConsejoContext(idConsejo);

    if (!memberId) {
      throw new ForbiddenException('Tu cuenta no tiene un miembro vinculado.');
    }

    const attendance = consejo.AsistenciaConsejo.find(
      (item) => item.Miembro.id === memberId,
    );

    if (!attendance) {
      throw new ForbiddenException(
        'Solo los asistentes del consejo pueden levantar la mano.',
      );
    }

    const state = this.getOrCreateState(idConsejo, consejo);

    if (
      !state.raisedHands.some((item) => item.memberId === memberId) &&
      !state.speakers.some((item) => item.memberId === memberId)
    ) {
      state.raisedHands.unshift({
        memberId,
        fullName: `${attendance.Miembro.apellidos}, ${attendance.Miembro.nombre}`,
        description: attendance.descripcion,
      });
    }

    return this.buildStateFromContext(consejo, state);
  }

  async cancelRaiseHand(idConsejo: number, memberId: number | null) {
    const consejo = await this.getConsejoContext(idConsejo);
    const state = this.getOrCreateState(idConsejo, consejo);

    if (memberId) {
      state.raisedHands = state.raisedHands.filter(
        (item) => item.memberId !== memberId,
      );
    }

    return this.buildStateFromContext(consejo, state);
  }

  async addSpeaker(
    idConsejo: number,
    actorMemberId: number | null,
    memberId: number,
  ) {
    const consejo = await this.getConsejoContext(idConsejo);
    this.ensureModerator(consejo.id_moderador, actorMemberId);

    const attendance = consejo.AsistenciaConsejo.find(
      (item) => item.Miembro.id === memberId,
    );

    if (!attendance) {
      throw new ForbiddenException(
        'Solo asistentes del consejo pueden agregarse a oradores.',
      );
    }

    const state = this.getOrCreateState(idConsejo, consejo);
    state.raisedHands = state.raisedHands.filter((item) => item.memberId !== memberId);
    state.speakers = state.speakers.filter((item) => item.memberId !== memberId);
    state.speakers.unshift({
      memberId,
      fullName: `${attendance.Miembro.apellidos}, ${attendance.Miembro.nombre}`,
      description: attendance.descripcion,
    });

    return this.buildStateFromContext(consejo, state);
  }

  async removeSpeaker(
    idConsejo: number,
    actorMemberId: number | null,
    memberId: number,
  ) {
    const consejo = await this.getConsejoContext(idConsejo);
    this.ensureModerator(consejo.id_moderador, actorMemberId);
    const state = this.getOrCreateState(idConsejo, consejo);
    state.speakers = state.speakers.filter((item) => item.memberId !== memberId);
    return this.buildStateFromContext(consejo, state);
  }

  async reorderSpeakers(
    idConsejo: number,
    actorMemberId: number | null,
    memberIds: number[],
  ) {
    const consejo = await this.getConsejoContext(idConsejo);
    this.ensureModerator(consejo.id_moderador, actorMemberId);

    const state = this.getOrCreateState(idConsejo, consejo);
    const currentSpeakerIds = state.speakers.map((item) => item.memberId);

    if (
      memberIds.length !== currentSpeakerIds.length ||
      currentSpeakerIds.some((memberId) => !memberIds.includes(memberId))
    ) {
      throw new ForbiddenException(
        'El reordenamiento de oradores no coincide con la lista actual.',
      );
    }

    const speakersById = new Map(
      state.speakers.map((speaker) => [speaker.memberId, speaker]),
    );

    state.speakers = memberIds
      .map((memberId) => speakersById.get(memberId))
      .filter((speaker): speaker is ConsejoRealtimeSpeaker => !!speaker);

    return this.buildStateFromContext(consejo, state);
  }

  async syncTemario(
    idConsejo: number,
    actorMemberId: number | null,
    payload: {
      temarioId: number;
      debate: string;
      acuerdo: string;
      estado: string;
    },
  ): Promise<ConsejoRealtimeTemarioUpdate> {
    if (!actorMemberId) {
      throw new ForbiddenException('Tu cuenta no tiene un miembro vinculado.');
    }

    const temario = await this.prisma.temarioConsejo.findFirst({
      where: {
        id: payload.temarioId,
        id_consejo: idConsejo,
        borrado: false,
      },
      select: {
        id: true,
        debate: true,
        acuerdo: true,
      },
    });

    if (!temario) {
      throw new NotFoundException('El tema indicado no existe en este consejo.');
    }

    const adultMember = await this.prisma.miembro.findFirst({
      where: {
        id: actorMemberId,
        borrado: false,
        Adulto: {
          is: {
            borrado: false,
            activo: true,
          },
        },
      },
      select: {
        id: true,
      },
    });

    if (!adultMember) {
      throw new ForbiddenException(
        'Solo adultos pueden editar el temario del consejo.',
      );
    }

    const consejo = await this.prisma.consejo.findFirst({
      where: {
        id: idConsejo,
        borrado: false,
      },
      select: {
        id_secretario: true,
        id_prosecretario: true,
      },
    });

    if (!consejo) {
      throw new NotFoundException('El consejo indicado no existe.');
    }

    const canEditActa =
      consejo.id_secretario === actorMemberId ||
      consejo.id_prosecretario === actorMemberId;

    if (
      !canEditActa &&
      ((payload.debate ?? '') !== (temario.debate ?? '') ||
        (payload.acuerdo ?? '') !== (temario.acuerdo ?? ''))
    ) {
      throw new ForbiddenException(
        'Solo el secretario o prosecretario pueden editar debate y acuerdo.',
      );
    }

    const updated = await this.prisma.temarioConsejo.update({
      where: {
        id: temario.id,
      },
      data: {
        debate: payload.debate,
        acuerdo: payload.acuerdo,
        estado: payload.estado as never,
      },
      select: {
        id: true,
        titulo: true,
        descripcion: true,
        debate: true,
        acuerdo: true,
        sin_mp: true,
        estado: true,
      },
    });

    return {
      ...updated,
      estado: String(updated.estado),
    };
  }

  clearState(idConsejo: number) {
    this.states.delete(idConsejo);
  }

  private async getConsejoContext(
    idConsejo: number,
  ): Promise<ConsejoRealtimeContext> {
    const consejo = await this.prisma.consejo.findFirst({
      where: {
        id: idConsejo,
        borrado: false,
      },
      select: {
        id: true,
        id_moderador: true,
        fecha: true,
        hora_fin: true,
        AsistenciaConsejo: {
          where: {
            borrado: false,
          },
          select: {
            descripcion: true,
            Miembro: {
              select: {
                id: true,
                nombre: true,
                apellidos: true,
              },
            },
          },
        },
      },
    });

    if (!consejo) {
      throw new NotFoundException('El consejo indicado no existe.');
    }

    return consejo;
  }

  private ensureModerator(
    moderatorMemberId: number | null,
    actorMemberId: number | null,
  ) {
    if (!moderatorMemberId || !actorMemberId || moderatorMemberId !== actorMemberId) {
      throw new ForbiddenException(
        'Solo el moderador del consejo puede gestionar oradores.',
      );
    }
  }

  private shouldPersistState(consejo: ConsejoRealtimeContext): boolean {
    if (!consejo.hora_fin) {
      return true;
    }

    return consejo.hora_fin.getTime() >= Date.now();
  }

  private createEmptyState(): ConsejoRealtimeMemoryState {
    return {
      speakers: [],
      raisedHands: [],
    };
  }

  private getOrCreateState(
    idConsejo: number,
    consejo: ConsejoRealtimeContext,
  ): ConsejoRealtimeMemoryState {
    if (!this.shouldPersistState(consejo)) {
      this.clearState(idConsejo);
      return this.createEmptyState();
    }

    const existing = this.states.get(idConsejo);
    if (existing) {
      return existing;
    }

    const created = this.createEmptyState();
    this.states.set(idConsejo, created);
    return created;
  }

  private buildStateFromContext(
    consejo: { id_moderador: number | null },
    state: ConsejoRealtimeMemoryState,
  ): ConsejoRealtimeState {
    return {
      speakers: state.speakers,
      raisedHands: state.raisedHands,
      moderatorMemberId: consejo.id_moderador ?? null,
    };
  }
}
