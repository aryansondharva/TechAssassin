/**
 * Murf AI Service
 * 
 * Handles interaction with Murf AI endpoints for text-to-speech synthesis.
 */

import { api } from '@/lib/api-client';
import type {
  MurfSynthesizeRequest,
  MurfSynthesizeResponse,
  MurfVoice,
} from '@/types/api';

export const murfService = {
  /**
   * Synthesize speech from text
   */
  synthesize: async (data: MurfSynthesizeRequest): Promise<MurfSynthesizeResponse> => {
    return await api.post<MurfSynthesizeResponse>('/murf', data);
  },

  /**
   * Fetch list of available Murf AI voices
   */
  listVoices: async (): Promise<MurfVoice[]> => {
    return await api.get<MurfVoice[]>('/murf/voices');
  },
};
