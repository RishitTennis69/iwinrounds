// OpenAI TTS (Text-to-Speech) API service
const OPENAI_API_KEY = import.meta.env.VITE_OPENAI_API_KEY || '';

export interface TTSOptions {
  voice?: 'alloy' | 'echo' | 'fable' | 'onyx' | 'nova' | 'shimmer';
  speed?: number; // 0.25 to 4.0
  format?: 'mp3' | 'opus' | 'aac' | 'flac';
}

export class TTSService {
  private currentAudio: HTMLAudioElement | null = null;
  public onAudioReady: (() => void) | null = null;
  public onAudioStarted: (() => void) | null = null;
  public onAudioEnded: (() => void) | null = null;
  public onAudioError: ((error: any) => void) | null = null;

  constructor() {
    // Constructor can be empty for now
  }

  async speak(text: string, options: TTSOptions = {}): Promise<void> {
    if (!OPENAI_API_KEY) {
      throw new Error('OpenAI API key not configured. Please set VITE_OPENAI_API_KEY in your .env file.');
    }

    if (!text.trim()) {
      throw new Error('Text cannot be empty');
    }

    // Stop any currently playing audio
    this.stop();

    try {
      const requestBody = {
        model: 'tts-1',
        input: text,
        voice: options.voice || 'alloy',
        speed: options.speed || 1.0,
        response_format: options.format || 'mp3'
      };
      
      const response = await fetch('https://api.openai.com/v1/audio/speech', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${OPENAI_API_KEY}`
        },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('TTS API error:', response.status, errorText);
        
        if (response.status === 401) {
          throw new Error('API authentication error. Please check your API key.');
        } else if (response.status === 429) {
          throw new Error('Rate limit exceeded. Please try again later.');
        } else {
          throw new Error(`TTS API error: ${response.status} ${response.statusText}`);
        }
      }

      // Get audio blob
      const audioBlob = await response.blob();
      
      if (audioBlob.size === 0) {
        throw new Error('Received empty audio blob from TTS API');
      }
      
      const audioUrl = URL.createObjectURL(audioBlob);

      // Create and play audio
      this.currentAudio = new Audio(audioUrl);
      
      // Set up event listeners
      this.currentAudio.onloadstart = () => {
        // Audio is loading, but not yet playing
      };
      
      this.currentAudio.oncanplay = () => {
        // Audio can start playing - this is when we should show controls
        if (this.onAudioReady) {
          this.onAudioReady();
        }
      };
      
      this.currentAudio.onplay = () => {
        // Audio has actually started playing
        if (this.onAudioStarted) {
          this.onAudioStarted();
        }
      };
      
      this.currentAudio.onended = () => {
        this.cleanup();
        if (this.onAudioEnded) {
          this.onAudioEnded();
        }
      };

      this.currentAudio.onerror = (error) => {
        console.error('🎵 TTS: Audio playback error:', error);
        console.error('🎵 TTS: Audio error details:', {
          error: error,
          currentSrc: this.currentAudio?.currentSrc,
          readyState: this.currentAudio?.readyState,
          networkState: this.currentAudio?.networkState
        });
        this.cleanup();
        if (this.onAudioError) {
          this.onAudioError(error);
        }
      };

      // Add more event listeners for debugging
      this.currentAudio.onload = () => {
        // Audio loaded successfully
      };
      
      this.currentAudio.oncanplaythrough = () => {
        // Audio can play through without buffering
      };
      
      this.currentAudio.onstalled = () => {
        console.warn('🎵 TTS: Audio stalled');
      };
      
      this.currentAudio.onwaiting = () => {
        console.warn('🎵 TTS: Audio waiting for data');
      };

      // Play the audio
      await this.currentAudio.play();
      
      // Check if audio is actually playing
      setTimeout(() => {
        if (this.currentAudio) {
          // If audio ended immediately, it might be an issue
          if (this.currentAudio.ended || this.currentAudio.currentTime === 0) {
            console.warn('🎵 TTS: Audio ended immediately or didn\'t start properly');
          }
        }
      }, 1000); // Check after 1 second

    } catch (error) {
      console.error('TTS error:', error);
      throw error;
    }
  }

  async speakWithQueue(texts: string[], options: TTSOptions = {}): Promise<void> {
    for (const text of texts) {
      await this.speak(text, options);
      // Wait for audio to finish before playing next
      while (this.currentAudio && !this.currentAudio.ended) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }
  }

  stop(): void {
    if (this.currentAudio) {
      this.currentAudio.pause();
      this.currentAudio.currentTime = 0;
      this.cleanup();
    }
  }

  pause(): void {
    if (this.currentAudio) {
      this.currentAudio.pause();
    }
  }

  resume(): void {
    if (this.currentAudio) {
      this.currentAudio.play();
    }
  }

  isPlaying(): boolean {
    return this.currentAudio ? !this.currentAudio.paused && !this.currentAudio.ended : false;
  }

  private cleanup(): void {
    if (this.currentAudio) {
      URL.revokeObjectURL(this.currentAudio.src);
      this.currentAudio = null;
    }
  }

  // Get available voices
  static getAvailableVoices(): { value: string; label: string }[] {
    return [
      { value: 'alloy', label: 'Alloy (Neutral)' },
      { value: 'echo', label: 'Echo (Male)' },
      { value: 'fable', label: 'Fable (Male)' },
      { value: 'onyx', label: 'Onyx (Male)' },
      { value: 'nova', label: 'Nova (Female)' },
      { value: 'shimmer', label: 'Shimmer (Female)' }
    ];
  }

  // Method to get audio blob without playing (for download or other uses)
  static async getAudioBlob(text: string, options: TTSOptions = {}): Promise<Blob> {
    if (!OPENAI_API_KEY) {
      throw new Error('OpenAI API key not configured. Please set VITE_OPENAI_API_KEY in your .env file.');
    }

    const response = await fetch('https://api.openai.com/v1/audio/speech', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: 'tts-1',
        input: text,
        voice: options.voice || 'alloy',
        speed: options.speed || 1.0,
        response_format: options.format || 'mp3'
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('TTS API error:', response.status, errorText);
      throw new Error(`TTS API error: ${response.status} ${response.statusText}`);
    }

    return await response.blob();
  }

  // Method to download audio file
  static async downloadAudio(text: string, filename: string, options: TTSOptions = {}): Promise<void> {
    const blob = await this.getAudioBlob(text, options);
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }
} 