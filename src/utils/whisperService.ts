// OpenAI Whisper API service for better speech-to-text accuracy with chunked processing
const OPENAI_API_KEY = import.meta.env.VITE_OPENAI_API_KEY || '';

export class WhisperService {
  private isRecording: boolean = false;
  private mediaRecorder: MediaRecorder | null = null;
  private audioChunks: Blob[] = [];
  private onResultCallback: ((transcript: string) => void) | null = null;
  private onErrorCallback: ((error: string) => void) | null = null;
  private onProgressCallback: ((status: string) => void) | null = null;
  private stream: MediaStream | null = null;
  private currentTranscript: string = '';
  private chunkProcessingInterval: number | null = null;
  private readonly minChunkDurationMs: number = 5000; // Process chunks every 5 seconds for more responsive transcription
  private isProcessingChunk: boolean = false;

  // Add properties to match SimpleSpeechService interface
  public recognition: any = null; // Not used in WhisperService but required for interface compatibility
  public isSupported: boolean = true; // MediaRecorder is widely supported
  public initializeRecognition: () => void = () => {}; // Not needed for WhisperService
  public setupRecognition: () => void = () => {}; // Not needed for WhisperService
  public checkSupport: () => boolean = () => true; // MediaRecorder is supported

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
    this.currentTranscript = '';
    this.isRecording = true;
    this.isProcessingChunk = false;

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
        // Clear the interval when recording stops
        if (this.chunkProcessingInterval) {
          clearInterval(this.chunkProcessingInterval);
          this.chunkProcessingInterval = null;
        }
        
        // Process any remaining chunks
        if (this.audioChunks.length > 0) {
          await this.sendAccumulatedChunksToWhisper();
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
      this.mediaRecorder.start(1000); // Collect data every 1000ms

      // Set up interval to process chunks periodically
      this.chunkProcessingInterval = window.setInterval(() => {
        if (this.isRecording && !this.isProcessingChunk && this.audioChunks.length > 0) {
          console.log(`Processing audio chunk: ${this.audioChunks.length} chunks accumulated`);
          this.sendAccumulatedChunksToWhisper();
        }
      }, this.minChunkDurationMs);

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
    
    // Clear the processing interval
    if (this.chunkProcessingInterval) {
      clearInterval(this.chunkProcessingInterval);
      this.chunkProcessingInterval = null;
    }
    
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

  private async sendAccumulatedChunksToWhisper(): Promise<void> {
    // Prevent concurrent processing
    if (this.isProcessingChunk || this.audioChunks.length === 0) {
      return;
    }

    this.isProcessingChunk = true;
    console.log(`Starting to process ${this.audioChunks.length} audio chunks`);

    try {
      // Notify user that processing has started
      if (this.onProgressCallback) {
        this.onProgressCallback('Processing audio chunk...');
      }

      // Create audio blob from current chunks
      const audioBlob = new Blob(this.audioChunks, { type: 'audio/webm' });
      console.log(`Created audio blob of size: ${audioBlob.size} bytes`);
      
      // Check if audio chunk is too short (less than 1 second of data)
      if (audioBlob.size < 2000) {
        console.log('Audio chunk too short, skipping processing');
        this.isProcessingChunk = false;
        return;
      }

      // Convert to FormData for OpenAI Whisper API
      const formData = new FormData();
      formData.append('file', audioBlob, 'chunk.webm');
      formData.append('model', 'whisper-1');
      formData.append('language', 'en');
      formData.append('response_format', 'json');

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
        const chunkTranscript = data.text || '';

        if (chunkTranscript.trim()) {
          // Append the new transcript to the current transcript
          this.currentTranscript += (this.currentTranscript ? ' ' : '') + chunkTranscript;
          
          if (this.onResultCallback) {
            if (this.onProgressCallback) {
              this.onProgressCallback('Transcript updated!');
            }
            this.onResultCallback(this.currentTranscript);
          }
        } else {
          console.log('No speech detected in audio chunk');
        }

      } catch (error) {
        clearTimeout(timeoutId);
        if (error instanceof Error && error.name === 'AbortError') {
          console.error('Processing timed out for audio chunk');
          // Don't throw error for individual chunk timeouts, just log it
        } else {
          console.error('Error processing audio chunk:', error);
          // Don't throw error for individual chunk failures to avoid stopping the recording
        }
      }

    } catch (error) {
      console.error('Error in chunk processing:', error);
      // Don't propagate errors from individual chunks to avoid stopping the recording
    } finally {
      // Clear the chunks array after processing to prevent memory buildup
      console.log(`Clearing ${this.audioChunks.length} processed chunks`);
      this.audioChunks = [];
      this.isProcessingChunk = false;
    }
  }

  isCurrentlyRecording(): boolean {
    return this.isRecording;
  }

  getCurrentTranscript(): string {
    return this.currentTranscript;
  }

  clearTranscript(): void {
    this.currentTranscript = '';
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