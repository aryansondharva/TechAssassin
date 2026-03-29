
export interface MurfSynthesizeRequest {
  text: string;
  voiceId: string;
  locale?: string;
  style?: string;
  rate?: number;
  pitch?: number;
  sampleRate?: number;
  format?: 'MP3' | 'WAV' | 'ALAW' | 'ULAW';
  channel?: 'MONO' | 'STEREO';
}

export interface MurfSynthesizeResponse {
  audioFile: string;
  encodedAsBase64?: boolean;
  consumedCharacterCount?: number;
  remainingCharacterCount?: number;
}

export interface MurfVoice {
  voiceId: string;
  displayName: string;
  language: string;
  locale: string;
  gender: string;
  description: string;
  sampleUrl: string;
  styles: string[];
}

export class MurfService {
  private static readonly API_BASE_URL = 'https://api.murf.ai/v1';
  private static readonly API_KEY = process.env.MURF_API_KEY;

  private static getHeaders() {
    if (!this.API_KEY) {
      throw new Error('MURF_API_KEY is not defined in environment variables');
    }
    return {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'api-key': this.API_KEY,
    };
  }

  static async synthesize(request: MurfSynthesizeRequest): Promise<MurfSynthesizeResponse> {
    const response = await fetch(`${this.API_BASE_URL}/speech/generate`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(`Murf AI synthesis failed: ${errorData.message || response.statusText}`);
    }

    return response.json();
  }

  static async listVoices(): Promise<MurfVoice[]> {
    const response = await fetch(`${this.API_BASE_URL}/speech/voices`, {
      method: 'GET',
      headers: this.getHeaders(),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(`Failed to fetch Murf AI voices: ${errorData.message || response.statusText}`);
    }

    return response.json();
  }
}
