export class SpeechRecognitionService {
  private recognition: any;
  private isSupported: boolean;

  constructor() {
    // Check if speech recognition is supported
    this.isSupported = 'webkitSpeechRecognition' in window || 'SpeechRecognition' in window;
    
    if (this.isSupported) {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      this.recognition = new SpeechRecognition();
      this.setupRecognition();
    }
  }

  private setupRecognition() {
    this.recognition.continuous = true;
    this.recognition.interimResults = true;
    this.recognition.lang = 'en-US';
  }

  startRecording(onResult: (transcript: string) => void, onError?: (error: string) => void): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.isSupported) {
        reject(new Error('Speech recognition is not supported in this browser'));
        return;
      }

      let finalTranscript = '';

      this.recognition.onresult = (event: any) => {
        let interimTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalTranscript += transcript + ' ';
          } else {
            interimTranscript += transcript;
          }
        }

        onResult(finalTranscript + interimTranscript);
      };

      this.recognition.onerror = (event: any) => {
        const error = event.error || 'Unknown error occurred';
        if (onError) onError(error);
        reject(new Error(error));
      };

      this.recognition.onend = () => {
        resolve();
      };

      this.recognition.start();
    });
  }

  stopRecording(): void {
    if (this.recognition) {
      this.recognition.stop();
    }
  }

  checkSupport(): boolean {
    return this.isSupported;
  }
} 