import { api } from '../lib/api-client';

export interface Mission {
  mission_id: string;
  title: string;
  description: string;
  xp_reward: number;
  frequency: 'daily' | 'weekly' | 'one-time';
  difficulty: 'easy' | 'medium' | 'hard';
  status: 'in_progress' | 'pending_verification' | 'completed';
  progress: any;
  time_remaining_ms: number;
}

export const missionsService = {
  getAvailableMissions: () => {
    return api.get<Mission[]>('/missions');
  },
  
  verifyMission: (missionId: string, requirementType: string, payload: any = {}) => {
    return api.post<{ verified: boolean, message?: string }>('/missions', {
      missionId,
      requirementType,
      payload
    });
  }
};
