// OpenAI Whisper API service for better speech-to-text accuracy
const OPENAI_API_KEY = import.meta.env.VITE_OPENAI_API_KEY || '';

export class WhisperService {
  private isRecording: boolean = false;
  private mediaRecorder: MediaRecorder | null = null;
  private audioChunks: Blob[] = [];
  private onResultCallback: ((transcript: string) => void) | null = null;
  private onErrorCallback: ((error: string) => void) | null = null;
  private onProgressCallback: ((status: string) => void) | null = null;
  private stream: MediaStream | null = null;

  constructor() {
    // Check if MediaRecorder is supported
    if (!window.MediaRecorder) {
      throw new Error('MediaRecorder is not supported in this browser');
    }
  }

  async startRecording(
    onResult: (transcript: string) => void, 
    onError?: (error: string) => void,
    onProgress?: (status: string) => void
  ): Promise<void> {
    if (!OPENAI_API_KEY) {
      throw new Error('OpenAI API key not configured. Please set VITE_OPENAI_API_KEY in your .env file.');
    }

    if (this.isRecording) {
      throw new Error('Recording is already in progress');
    }

    this.onResultCallback = onResult;
    this.onErrorCallback = onError || null;
    this.onProgressCallback = onProgress || null;
    this.audioChunks = [];
    this.isRecording = true;

    try {
      // Get microphone access with optimized settings for faster processing
      this.stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          sampleRate: 16000, // Whisper's preferred sample rate
          channelCount: 1,   // Mono for faster processing
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        } 
      });

      // Create MediaRecorder with optimized settings
      this.mediaRecorder = new MediaRecorder(this.stream, {
        mimeType: 'audio/webm;codecs=opus',
        audioBitsPerSecond: 16000 // Lower bitrate for faster processing
      });

      this.mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          this.audioChunks.push(event.data);
        }
      };

      this.mediaRecorder.onstop = async () => {
        if (this.audioChunks.length > 0) {
          await this.processAudio();
        }
      };

      this.mediaRecorder.onerror = (event) => {
        const error = event.error || 'Unknown recording error';
        console.error('MediaRecorder error:', error);
        if (this.onErrorCallback) {
          this.onErrorCallback(error);
        }
      };

      // Start recording with smaller chunks for faster processing
      this.mediaRecorder.start(500); // Collect data every 500ms instead of 1000ms

    } catch (error) {
      this.isRecording = false;
      console.error('Failed to start recording:', error);
      throw new Error('Failed to access microphone. Please check permissions.');
    }
  }

  stopRecording(): void {
    if (!this.isRecording || !this.mediaRecorder) {
      return;
    }

    this.isRecording = false;
    this.mediaRecorder.stop();
    
    // Stop all tracks
    if (this.stream) {
      this.stream.getTracks().forEach(track => track.stop());
      this.stream = null;
    }
  }

  pauseRecording(): void {
    if (this.mediaRecorder && this.isRecording) {
      this.mediaRecorder.pause();
    }
  }

  resumeRecording(): void {
    if (this.mediaRecorder && this.isRecording) {
      this.mediaRecorder.resume();
    }
  }

  private async processAudio(): Promise<void> {
    try {
      // Notify user that processing has started
      if (this.onProgressCallback) {
        this.onProgressCallback('Processing audio...');
      }

      // Create audio blob
      const audioBlob = new Blob(this.audioChunks, { type: 'audio/webm' });
      
      // Check if audio is too short (less than 0.5 seconds)
      if (audioBlob.size < 1000) {
        // Silently handle short audio without showing error message
        console.log('Audio too short, skipping processing');
        return;
      }

      // Convert to FormData for OpenAI Whisper API
      const formData = new FormData();
      formData.append('file', audioBlob, 'recording.webm');
      formData.append('model', 'whisper-1');
      formData.append('language', 'en');
      formData.append('response_format', 'json'); // Request JSON for faster parsing

      // Call OpenAI Whisper API with timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 second timeout

      try {
        const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${OPENAI_API_KEY}`
          },
          body: formData,
          signal: controller.signal
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          const errorText = await response.text();
          console.error('Whisper API error:', response.status, errorText);
          
          if (response.status === 401) {
            throw new Error('API authentication error. Please check your API key.');
          } else if (response.status === 429) {
            throw new Error('Rate limit exceeded. Please try again later.');
          } else {
            throw new Error(`Whisper API error: ${response.status} ${response.statusText}`);
          }
        }

        const data = await response.json();
        const transcript = data.text || '';

        if (this.onResultCallback && transcript.trim()) {
          if (this.onProgressCallback) {
            this.onProgressCallback('Transcript ready!');
          }
          this.onResultCallback(transcript);
        } else {
          // Silently handle no speech detected without showing error message
          console.log('No speech detected in audio');
        }

      } catch (error) {
        clearTimeout(timeoutId);
        if (error instanceof Error && error.name === 'AbortError') {
          throw new Error('Processing timed out. Please try again.');
        }
        throw error;
      }

    } catch (error) {
      console.error('Error processing audio:', error);
      if (this.onErrorCallback) {
        this.onErrorCallback(error instanceof Error ? error.message : 'Failed to process audio');
      }
    } finally {
      // Clear audio chunks for next recording
      this.audioChunks = [];
    }
  }

  isCurrentlyRecording(): boolean {
    return this.isRecording;
  }

  // Method to transcribe an existing audio file (for batch processing)
  static async transcribeFile(audioFile: File): Promise<string> {
    if (!OPENAI_API_KEY) {
      throw new Error('OpenAI API key not configured. Please set VITE_OPENAI_API_KEY in your .env file.');
    }

    const formData = new FormData();
    formData.append('file', audioFile);
    formData.append('model', 'whisper-1');
    formData.append('language', 'en');
    formData.append('response_format', 'json');

    const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`
      },
      body: formData
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Whisper API error:', response.status, errorText);
      throw new Error(`Whisper API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    return data.text || '';
  }
} 