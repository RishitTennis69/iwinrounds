# ReasynAI - Your Personal AI Coach That Fits in Your Pocket

An intelligent debate tracking and analysis application that records speeches, converts them to text, and uses AI to analyze debate points, counter-points, and determine winners.

## Features

- 🎤 **Voice Recording**: Real-time speech recording with live transcription
- 🤖 **AI Analysis**: Automatic extraction of main points, counter-points, and impact weighing
- 📊 **Debate Flow Table**: Visual tracking of all debate arguments in a structured format
- 🏆 **Winner Analysis**: AI-powered determination of debate winners with reasoning
- 📈 **Speaker Scoring**: Individual speaker performance tracking
- 📝 **Comprehensive Summary**: Complete debate overview and statistics

## How It Works

1. **Setup**: Enter debate topic and configure 4 speakers (2 per team)
2. **Recording**: Record each speaker's speech with live transcription
3. **Analysis**: AI automatically analyzes each speech for:
   - Main arguments and points
   - Counter-arguments
   - Counter-counter arguments
   - Impact weighing and significance
4. **Tracking**: All points are displayed in a comprehensive table format
5. **Results**: After 8 speeches, get final analysis including:
   - Winner determination
   - Individual speaker scores
   - Complete debate summary

## Technology Stack

- **Frontend**: React 18 with TypeScript
- **Styling**: Tailwind CSS
- **Build Tool**: Vite
- **Speech Recognition**: Web Speech API
- **Icons**: Lucide React
- **AI Analysis**: Mock service (easily replaceable with OpenAI, Claude, etc.)

## Getting Started

### Prerequisites

- Node.js 16+ 
- Modern browser with Web Speech API support (Chrome, Edge, Safari)

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd reasynai
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

4. Open your browser and navigate to `http://localhost:3000`

### Building for Production

```bash
npm run build
```

## Usage

1. **Setup Phase**:
   - Enter the debate topic
   - Add speaker names and assign teams (Affirmative/Negative)
   - Click "Start Debate Session"

2. **Recording Phase**:
   - Click "Start Recording" when each speaker begins
   - Watch live transcription appear
   - Click "Stop Recording" when speech ends
   - Click "Complete Speech & Analyze" to process

3. **Analysis Phase**:
   - View AI-generated analysis in the debate flow table
   - Track main points, counter-points, and impact weighing
   - Continue through all 8 speeches

4. **Results Phase**:
   - Review final analysis with winner determination
   - See individual speaker scores
   - Read complete debate summary

## Customization

### AI Service Integration

To use a real AI service instead of the mock service, modify `src/utils/aiService.ts`:

```typescript
// Replace mock implementation with OpenAI, Claude, or other AI service
static async summarizeSpeech(transcript: string) {
  const response = await fetch('/api/analyze-speech', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ transcript })
  });
  return response.json();
}
```

### Speech Recognition

The application uses the Web Speech API. For better accuracy, consider integrating with:
- Google Cloud Speech-to-Text
- Azure Speech Services
- Amazon Transcribe

## Browser Compatibility

- ✅ Chrome 66+
- ✅ Edge 79+
- ✅ Safari 14.1+
- ❌ Firefox (limited Web Speech API support)

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

MIT License - see LICENSE file for details

## Support

For issues and questions, please open an issue on GitHub.

---
