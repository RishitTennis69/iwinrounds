// OpenAI Whisper API service for better speech-to-text accuracy
const OPENAI_API_KEY = import.meta.env.VITE_OPENAI_API_KEY || '';

export class WhisperService {
  private isRecording: boolean = false;
  private mediaRecorder: MediaRecorder | null = null;
  private audioChunks: Blob[] = [];
  private onResultCallback: ((transcript: string) => void) | null = null;
  private onErrorCallback: ((error: string) => void) | null = null;
  private stream: MediaStream | null = null;

  constructor() {
    // Check if MediaRecorder is supported
    if (!window.MediaRecorder) {
      throw new Error('MediaRecorder is not supported in this browser');
    }
  }

  async startRecording(onResult: (transcript: string) => void, onError?: (error: string) => void): Promise<void> {
    if (!OPENAI_API_KEY) {
      throw new Error('OpenAI API key not configured. Please set VITE_OPENAI_API_KEY in your .env file.');
    }

    if (this.isRecording) {
      throw new Error('Recording is already in progress');
    }

    this.onResultCallback = onResult;
    this.onErrorCallback = onError || null;
    this.audioChunks = [];
    this.isRecording = true;

    try {
      // Get microphone access
      this.stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          sampleRate: 16000,
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        } 
      });

      // Create MediaRecorder
      this.mediaRecorder = new MediaRecorder(this.stream, {
        mimeType: 'audio/webm;codecs=opus'
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

      // Start recording
      this.mediaRecorder.start(1000); // Collect data every second

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
      // Create audio blob
      const audioBlob = new Blob(this.audioChunks, { type: 'audio/webm' });
      
      // Convert to FormData for OpenAI Whisper API
      const formData = new FormData();
      formData.append('file', audioBlob, 'recording.webm');
      formData.append('model', 'whisper-1');
      formData.append('language', 'en');

      // Call OpenAI Whisper API
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
        this.onResultCallback(transcript);
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