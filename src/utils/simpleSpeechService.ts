// Simple Speech Recognition Service using browser's built-in API
// This provides real-time transcription without complex chunking

export class SimpleSpeechService {
  private recognition: any;
  private isSupported: boolean;
  private isRecording: boolean = false;
  private currentTranscript: string = '';
  private onResultCallback: ((transcript: string) => void) | null = null;
  private onErrorCallback: ((error: string) => void) | null = null;
  private onProgressCallback: ((status: string) => void) | null = null;

  constructor() {
    // Check if speech recognition is supported
    this.isSupported = 'webkitSpeechRecognition' in window || 'SpeechRecognition' in window;
    
    if (this.isSupported) {
      this.initializeRecognition();
    } else {
      console.warn('Speech recognition not supported in this browser');
    }
  }

  private initializeRecognition() {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    this.recognition = new SpeechRecognition();
    this.setupRecognition();
  }

  private setupRecognition() {
    this.recognition.continuous = true;
    this.recognition.interimResults = true;
    this.recognition.lang = 'en-US';
    this.recognition.maxAlternatives = 1;

    // Handle recognition results
    this.recognition.onresult = (event: any) => {
      let interimTranscript = '';
      let finalTranscript = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalTranscript += transcript + ' ';
        } else {
          interimTranscript += transcript;
        }
      }

      // Update current transcript
      this.currentTranscript += finalTranscript;
      
      // Call the result callback with current transcript + interim
      if (this.onResultCallback) {
        const fullTranscript = this.currentTranscript + interimTranscript;
        this.onResultCallback(fullTranscript);
        
        // Update progress
        if (this.onProgressCallback) {
          this.onProgressCallback('Listening...');
        }
      }
    };

    // Handle recognition errors
    this.recognition.onerror = (event: any) => {
      const error = event.error || 'Unknown error occurred';
      console.log('Speech recognition error:', error);
      
      if (this.onErrorCallback) {
        this.onErrorCallback(error);
      }
      
      // Auto-restart for certain errors
      if (error === 'no-speech' || error === 'audio-capture') {
        setTimeout(() => {
          if (this.isRecording) {
            this.recognition.start();
          }
        }, 1000);
      }
    };

    // Handle recognition end
    this.recognition.onend = () => {
      console.log('Speech recognition ended');
      
      // Auto-restart if still recording
      if (this.isRecording) {
        setTimeout(() => {
          if (this.isRecording) {
            this.recognition.start();
          }
        }, 100);
      }
    };

    // Handle recognition start
    this.recognition.onstart = () => {
      console.log('Speech recognition started');
      if (this.onProgressCallback) {
        this.onProgressCallback('Listening...');
      }
    };
  }

  async startRecording(
    onResult: (transcript: string) => void, 
    onError?: (error: string) => void,
    onProgress?: (status: string) => void
  ): Promise<void> {
    if (!this.isSupported) {
      throw new Error('Speech recognition is not supported in this browser');
    }

    if (this.isRecording) {
      throw new Error('Recording is already in progress');
    }

    this.onResultCallback = onResult;
    this.onErrorCallback = onError || null;
    this.onProgressCallback = onProgress || null;
    this.currentTranscript = '';
    this.isRecording = true;

    try {
      this.recognition.start();
    } catch (error) {
      this.isRecording = false;
      throw error;
    }
  }

  stopRecording(): void {
    if (!this.isRecording) return;
    
    this.isRecording = false;
    this.recognition.stop();
    
    if (this.onProgressCallback) {
      this.onProgressCallback('Recording stopped');
    }
  }

  pauseRecording(): void {
    if (this.isRecording) {
      this.recognition.stop();
    }
  }

  resumeRecording(): void {
    if (this.isRecording) {
      this.recognition.start();
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

  checkSupport(): boolean {
    return this.isSupported;
  }
} 