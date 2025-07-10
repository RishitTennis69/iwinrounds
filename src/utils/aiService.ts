import { DebatePoint } from '../types';

// OpenAI API configuration - Uses environment variable
const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions';
const OPENAI_API_KEY = import.meta.env.VITE_OPENAI_API_KEY || '';

// Check if API key is configured
export const isAPIKeyConfigured = () => {
  return OPENAI_API_KEY.length > 0 && OPENAI_API_KEY !== 'put-your-openai-api-key-here';
};

// OpenAI API service for real speech analysis
export class AIService {
  static async summarizeSpeech(transcript: string): Promise<{
    mainPoints: string[];
    counterPoints: string[];
    counterCounterPoints: string[];
    impactWeighing: string;
  }> {
    if (!isAPIKeyConfigured()) {
      throw new Error('OpenAI API key not configured. Please set VITE_OPENAI_API_KEY in your .env file.');
    }

    const prompt = `You are an expert debate analyst. Analyze the following debate speech and extract:

1. Main Points: 2-3 key arguments or contentions made by the speaker
2. Counter Points: Any counter-arguments or rebuttals to previous speakers
3. Counter-Counter Points: Responses to counter-arguments from opponents
4. Impact Weighing: Analysis of the significance and weight of the arguments

Speech Transcript:
"${transcript}"

Please respond in this exact JSON format:
{
  "mainPoints": ["point 1", "point 2", "point 3"],
  "counterPoints": ["counter point 1", "counter point 2"],
  "counterCounterPoints": ["response to counter 1"],
  "impactWeighing": "Analysis of argument significance and weight"
}

Keep each point concise but informative. If a category doesn't apply, use an empty array or brief description.`;

    try {
      const response = await fetch(OPENAI_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${OPENAI_API_KEY}`
        },
        body: JSON.stringify({
          model: 'gpt-4o',
          messages: [
            {
              role: 'user',
              content: prompt
            }
          ],
          max_tokens: 1000,
          temperature: 0.3
        })
      });

      console.log('API Response Status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('API Response:', response.status, errorText);
        
        // Handle specific error cases
        if (response.status === 401) {
          throw new Error('API authentication error. Please check your API key.');
        } else if (response.status === 403) {
          throw new Error('API access denied. Please check your account status.');
        } else if (response.status === 429) {
          throw new Error('Rate limit exceeded. Please try again later.');
        } else {
          throw new Error(`API error: ${response.status} ${response.statusText}`);
        }
      }

      const data = await response.json();
      
      if (!data.choices || !data.choices[0] || !data.choices[0].message || !data.choices[0].message.content) {
        throw new Error('Invalid response format from API');
      }
      
      const content = data.choices[0].message.content;
      
      // Parse the JSON response
      try {
        let jsonContent = content;
        
        // Handle responses wrapped in markdown code blocks
        if (content.includes('```json')) {
          const jsonMatch = content.match(/```json\s*([\s\S]*?)\s*```/);
          if (jsonMatch) {
            jsonContent = jsonMatch[1];
          }
        } else if (content.includes('```')) {
          // Handle responses wrapped in generic code blocks
          const codeMatch = content.match(/```\s*([\s\S]*?)\s*```/);
          if (codeMatch) {
            jsonContent = codeMatch[1];
          }
        }
        
        const analysis = JSON.parse(jsonContent);
        return {
          mainPoints: analysis.mainPoints || [],
          counterPoints: analysis.counterPoints || [],
          counterCounterPoints: analysis.counterCounterPoints || [],
          impactWeighing: analysis.impactWeighing || 'No impact weighing provided'
        };
      } catch (parseError) {
        console.error('Failed to parse API response:', parseError);
        console.error('Raw content:', content);
        throw new Error('Invalid response format from API');
      }
    } catch (error) {
      console.error('API error:', error);
      throw error;
    }
  }
  
  static async analyzeWinner(session: any): Promise<{
    winner: 'affirmative' | 'negative';
    reasoning: string;
    speakerPoints: { [key: string]: number };
    summary: string;
  }> {
    if (!isAPIKeyConfigured()) {
      throw new Error('OpenAI API key not configured. Please set VITE_OPENAI_API_KEY in your .env file.');
    }

    const debateSummary = session.points.map((point: any) => 
      `Speech ${point.speechNumber} (${point.team} - ${point.speakerName}): ${point.transcript}`
    ).join('\n\n');

    const prompt = `You are an expert debate judge. Analyze the following debate and determine the winner.

Debate Topic: ${session.topic}

Debate Summary:
${debateSummary}

Please determine:
1. Which team won (affirmative or negative)
2. Detailed reasoning for the decision
3. Individual speaker scores (0-100 scale)
4. Overall debate summary

Respond in this exact JSON format:
{
  "winner": "affirmative or negative",
  "reasoning": "Detailed explanation of why this team won",
  "speakerPoints": {
    "speaker1": 85,
    "speaker2": 78,
    "speaker3": 82,
    "speaker4": 79
  },
  "summary": "Overall summary of the debate"
}`;

    try {
      const response = await fetch(OPENAI_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${OPENAI_API_KEY}`
        },
        body: JSON.stringify({
          model: 'gpt-4o',
          messages: [
            {
              role: 'user',
              content: prompt
            }
          ],
          max_tokens: 1500,
          temperature: 0.3
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('API Response:', response.status, errorText);
        throw new Error(`API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      const content = data.choices[0].message.content;
      
      try {
        let jsonContent = content;
        
        // Handle responses wrapped in markdown code blocks
        if (content.includes('```json')) {
          const jsonMatch = content.match(/```json\s*([\s\S]*?)\s*```/);
          if (jsonMatch) {
            jsonContent = jsonMatch[1];
          }
        } else if (content.includes('```')) {
          // Handle responses wrapped in generic code blocks
          const codeMatch = content.match(/```\s*([\s\S]*?)\s*```/);
          if (codeMatch) {
            jsonContent = codeMatch[1];
          }
        }
        
        const analysis = JSON.parse(jsonContent);
        return {
          winner: analysis.winner || 'affirmative',
          reasoning: analysis.reasoning || 'No reasoning provided',
          speakerPoints: analysis.speakerPoints || {},
          summary: analysis.summary || 'No summary provided'
        };
      } catch (parseError) {
        console.error('Failed to parse API response:', parseError);
        throw new Error('Invalid response format from API');
      }
    } catch (error) {
      console.error('API error:', error);
      throw error;
    }
  }
} 