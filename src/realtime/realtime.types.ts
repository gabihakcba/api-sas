import { AuthenticatedUser } from '../auth/types/auth-request.types';

export interface ConsejoRealtimeSpeaker {
  memberId: number;
  fullName: string;
  description: string;
}

export interface ConsejoRealtimeHand {
  memberId: number;
  fullName: string;
  description: string;
}

export interface ConsejoRealtimeState {
  speakers: ConsejoRealtimeSpeaker[];
  raisedHands: ConsejoRealtimeHand[];
  moderatorMemberId: number | null;
}

export interface RealtimeSocketUser extends AuthenticatedUser {}
