export class SpeechRecognitionService {
  private recognition: any;
  private isSupported: boolean;
  private isRecording: boolean = false;
  private currentTranscript: string = '';
  private onResultCallback: ((transcript: string) => void) | null = null;
  private onErrorCallback: ((error: string) => void) | null = null;
  private autoRestartTimeout: number | null = null;
  private sessionStartTime: number = 0;
  private maxSessionDuration: number = 4 * 60 * 1000; // 4 minutes in milliseconds
  private restartAttempts: number = 0;
  private maxRestartAttempts: number = 10;
  private lastActivityTime: number = 0;

  constructor() {
    // Check if speech recognition is supported
    this.isSupported = 'webkitSpeechRecognition' in window || 'SpeechRecognition' in window;
    
    if (this.isSupported) {
      this.initializeRecognition();
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
      this.lastActivityTime = Date.now();
      
      // Reset restart attempts on successful recognition
      if (finalTranscript.trim()) {
        this.restartAttempts = 0;
      }
      
      // Call the result callback with current transcript + interim
      if (this.onResultCallback) {
        this.onResultCallback(this.currentTranscript + interimTranscript);
      }
    };

    // Handle recognition errors
    this.recognition.onerror = (event: any) => {
      const error = event.error || 'Unknown error occurred';
      console.log('Speech recognition error:', error);
      
      // Handle specific errors
      switch (error) {
        case 'no-speech':
          // No speech detected, restart after a short delay
          this.handleNoSpeech();
          break;
        case 'audio-capture':
          // Audio capture error, try to restart
          this.handleAudioError();
          break;
        case 'network':
          // Network error, try to restart
          this.handleNetworkError();
          break;
        case 'aborted':
          // Recognition was aborted, don't restart
          this.isRecording = false;
          break;
        default:
          // Other errors, notify user
          if (this.onErrorCallback) {
            this.onErrorCallback(error);
          }
          this.stopRecording();
      }
    };

    // Handle recognition end
    this.recognition.onend = () => {
      console.log('Speech recognition ended');
      
      // Check if we should auto-restart
      if (this.isRecording) {
        const currentTime = Date.now();
        const sessionDuration = currentTime - this.sessionStartTime;
        
        // If session hasn't exceeded max duration, restart
        if (sessionDuration < this.maxSessionDuration && this.restartAttempts < this.maxRestartAttempts) {
          this.autoRestart();
        } else {
          // Session exceeded max duration or too many restart attempts, stop recording
          this.isRecording = false;
          if (this.onResultCallback) {
            this.onResultCallback(this.currentTranscript);
          }
        }
      }
    };

    // Handle recognition start
    this.recognition.onstart = () => {
      console.log('Speech recognition started');
      this.lastActivityTime = Date.now();
    };
  }

  private handleNoSpeech() {
    // Restart recognition after 1 second if no speech detected
    if (this.isRecording && this.restartAttempts < this.maxRestartAttempts) {
      this.restartAttempts++;
      setTimeout(() => {
        if (this.isRecording) {
          this.recognition.start();
        }
      }, 1000);
    }
  }

  private handleAudioError() {
    // Try to restart after 2 seconds for audio errors
    if (this.isRecording && this.restartAttempts < this.maxRestartAttempts) {
      this.restartAttempts++;
      setTimeout(() => {
        if (this.isRecording) {
          this.recognition.start();
        }
      }, 2000);
    }
  }

  private handleNetworkError() {
    // Try to restart after 3 seconds for network errors
    if (this.isRecording && this.restartAttempts < this.maxRestartAttempts) {
      this.restartAttempts++;
      setTimeout(() => {
        if (this.isRecording) {
          this.recognition.start();
        }
      }, 3000);
    }
  }

  private autoRestart() {
    // Clear any existing timeout
    if (this.autoRestartTimeout) {
      clearTimeout(this.autoRestartTimeout);
    }

    // Restart recognition after a short delay
    this.autoRestartTimeout = window.setTimeout(() => {
      if (this.isRecording) {
        try {
          this.recognition.start();
        } catch (error) {
          console.log('Failed to restart recognition:', error);
          // If restart fails, try again after a longer delay
          setTimeout(() => {
            if (this.isRecording) {
              this.recognition.start();
            }
          }, 2000);
        }
      }
    }, 100);
  }

  startRecording(onResult: (transcript: string) => void, onError?: (error: string) => void): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.isSupported) {
        reject(new Error('Speech recognition is not supported in this browser'));
        return;
      }

      // Reset state
      this.currentTranscript = '';
      this.isRecording = true;
      this.sessionStartTime = Date.now();
      this.lastActivityTime = Date.now();
      this.restartAttempts = 0;
      this.onResultCallback = onResult;
      this.onErrorCallback = onError || null;

      try {
        this.recognition.start();
        resolve();
      } catch (error) {
        this.isRecording = false;
        reject(new Error('Failed to start speech recognition'));
      }
    });
  }

  stopRecording(): void {
    this.isRecording = false;
    
    // Clear any pending timeouts
    if (this.autoRestartTimeout) {
      clearTimeout(this.autoRestartTimeout);
      this.autoRestartTimeout = null;
    }

    if (this.recognition) {
      try {
        this.recognition.stop();
      } catch (error) {
        console.log('Error stopping recognition:', error);
      }
    }
  }

  pauseRecording(): void {
    if (this.recognition) {
      try {
        this.recognition.stop();
      } catch (error) {
        console.log('Error pausing recognition:', error);
      }
    }
  }

  resumeRecording(): void {
    if (this.isRecording && this.recognition) {
      try {
        this.recognition.start();
      } catch (error) {
        console.log('Error resuming recognition:', error);
      }
    }
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

  isCurrentlyRecording(): boolean {
    return this.isRecording;
  }

  getSessionDuration(): number {
    if (this.sessionStartTime === 0) return 0;
    return Date.now() - this.sessionStartTime;
  }

  getRestartAttempts(): number {
    return this.restartAttempts;
  }

  getLastActivityTime(): number {
    return this.lastActivityTime;
  }

  getTimeSinceLastActivity(): number {
    return Date.now() - this.lastActivityTime;
  }

  // Method to check if the session is still active
  isSessionActive(): boolean {
    const timeSinceActivity = this.getTimeSinceLastActivity();
    const sessionDuration = this.getSessionDuration();
    
    // Session is active if:
    // 1. We're still recording
    // 2. Session hasn't exceeded max duration
    // 3. We've had activity in the last 30 seconds OR session is less than 1 minute old
    return this.isRecording && 
           sessionDuration < this.maxSessionDuration &&
           (timeSinceActivity < 30000 || sessionDuration < 60000);
  }
} 