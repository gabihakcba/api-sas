import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { JwtService } from '@nestjs/jwt';
import { Server, Socket } from 'socket.io';
import { ConsejoRealtimeService } from './consejo-realtime.service';
import { RealtimeSocketUser } from './realtime.types';

type SocketWithAuth = Socket & {
  data: {
    user?: RealtimeSocketUser;
    consejoId?: number;
  };
};

@WebSocketGateway({
  namespace: '/consejos',
  cors: {
    origin: true,
    credentials: true,
  },
})
export class ConsejoRealtimeGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server!: Server;

  constructor(
    private readonly consejoRealtimeService: ConsejoRealtimeService,
    private readonly jwtService: JwtService,
  ) {}

  async handleConnection(client: SocketWithAuth) {
    try {
      const token = this.extractToken(client);
      const consejoId = Number(client.handshake.auth?.consejoId);

      if (!token || Number.isNaN(consejoId) || consejoId <= 0) {
        client.disconnect();
        return;
      }

      const payload = this.jwtService.verify(token, {
        secret: process.env.JWT_SECRET || 'secretKey',
      });

      client.data.user = {
        userId: payload.sub,
        username: payload.username,
        memberId: payload.memberId ?? null,
        roles: payload.roles,
        permissions: payload.permissions,
        scopes: payload.scopes,
      };
      client.data.consejoId = consejoId;

      await client.join(this.roomName(consejoId));
      await this.emitState(consejoId);
    } catch {
      client.disconnect();
    }
  }

  async handleDisconnect(client: SocketWithAuth) {
    const consejoId = client.data.consejoId;
    if (consejoId) {
      const roomName = this.roomName(consejoId);
      await client.leave(roomName);
      const socketsInRoom = await this.server.in(roomName).fetchSockets();

      if (socketsInRoom.length === 0) {
        this.consejoRealtimeService.clearState(consejoId);
      }
    }
  }

  @SubscribeMessage('consejo:state:get')
  async handleGetState(@ConnectedSocket() client: SocketWithAuth) {
    const consejoId = client.data.consejoId!;
    const state = await this.consejoRealtimeService.getState(consejoId);
    client.emit('consejo:state', state);
  }

  @SubscribeMessage('consejo:hand:raise')
  async handleRaiseHand(@ConnectedSocket() client: SocketWithAuth) {
    const consejoId = client.data.consejoId!;
    await this.consejoRealtimeService.raiseHand(
      consejoId,
      client.data.user?.memberId ?? null,
    );
    await this.emitState(consejoId);
  }

  @SubscribeMessage('consejo:hand:cancel')
  async handleCancelRaiseHand(@ConnectedSocket() client: SocketWithAuth) {
    const consejoId = client.data.consejoId!;
    await this.consejoRealtimeService.cancelRaiseHand(
      consejoId,
      client.data.user?.memberId ?? null,
    );
    await this.emitState(consejoId);
  }

  @SubscribeMessage('consejo:speaker:add')
  async handleAddSpeaker(
    @ConnectedSocket() client: SocketWithAuth,
    @MessageBody() body: { memberId: number },
  ) {
    const consejoId = client.data.consejoId!;
    await this.consejoRealtimeService.addSpeaker(
      consejoId,
      client.data.user?.memberId ?? null,
      body.memberId,
    );
    await this.emitState(consejoId);
  }

  @SubscribeMessage('consejo:speaker:remove')
  async handleRemoveSpeaker(
    @ConnectedSocket() client: SocketWithAuth,
    @MessageBody() body: { memberId: number },
  ) {
    const consejoId = client.data.consejoId!;
    await this.consejoRealtimeService.removeSpeaker(
      consejoId,
      client.data.user?.memberId ?? null,
      body.memberId,
    );
    await this.emitState(consejoId);
  }

  @SubscribeMessage('consejo:speakers:reorder')
  async handleReorderSpeakers(
    @ConnectedSocket() client: SocketWithAuth,
    @MessageBody() body: { memberIds: number[] },
  ) {
    const consejoId = client.data.consejoId!;
    await this.consejoRealtimeService.reorderSpeakers(
      consejoId,
      client.data.user?.memberId ?? null,
      body.memberIds,
    );
    await this.emitState(consejoId);
  }

  @SubscribeMessage('consejo:temario:sync')
  async handleSyncTemario(
    @ConnectedSocket() client: SocketWithAuth,
    @MessageBody()
    body: {
      temarioId: number;
      debate: string;
      acuerdo: string;
      estado: string;
    },
  ) {
    const consejoId = client.data.consejoId!;
    const updatedTemario = await this.consejoRealtimeService.syncTemario(
      consejoId,
      client.data.user?.memberId ?? null,
      body,
    );
    // Evita que el emisor reciba su propio eco y se sobreescriba mientras escribe.
    client.broadcast
      .to(this.roomName(consejoId))
      .emit('consejo:temario:updated', updatedTemario);
  }

  async emitState(consejoId: number) {
    const state = await this.consejoRealtimeService.getState(consejoId);
    this.server.to(this.roomName(consejoId)).emit('consejo:state', state);
  }

  private roomName(idConsejo: number) {
    return `consejo:${idConsejo}`;
  }

  private extractToken(client: Socket) {
    const authToken = client.handshake.auth?.token;
    if (typeof authToken === 'string' && authToken.length > 0) {
      return authToken;
    }

    const header = client.handshake.headers.authorization;
    if (typeof header === 'string' && header.startsWith('Bearer ')) {
      return header.slice(7);
    }

    return null;
  }
}
