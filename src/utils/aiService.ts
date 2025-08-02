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
    evidence: string[];
  }> {
    if (!isAPIKeyConfigured()) {
      throw new Error('OpenAI API key not configured. Please set VITE_OPENAI_API_KEY in your .env file.');
    }

    const prompt = `You are an expert debate analyst. Analyze the following debate speech and extract:

1. Main Points: 2-3 key arguments or contentions made by the speaker
2. Counter Points: Any counter-arguments or rebuttals to previous speakers
3. Counter-Counter Points: Responses to counter-arguments from opponents
4. Impact Weighing: Analysis of the significance and weight of the arguments
5. Evidence: Any facts, statistics, expert quotes, studies, or sources mentioned to support arguments

Speech Transcript:
"${transcript}"

Please respond in this exact JSON format:
{
  "mainPoints": ["point 1", "point 2", "point 3"],
  "counterPoints": ["counter point 1", "counter point 2"],
  "counterCounterPoints": ["response to counter 1"],
  "impactWeighing": "Analysis of argument significance and weight",
  "evidence": ["fact/statistic/quote with source", "another piece of evidence"]
}

Keep each point concise but informative. If a category doesn't apply, use an empty array or brief description. For evidence, include both the fact/statistic/quote and its source when mentioned.`;

    try {
      const response = await fetch(OPENAI_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${OPENAI_API_KEY}`
        },
        body: JSON.stringify({
          model: 'gpt-4.1-nano',
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
          impactWeighing: analysis.impactWeighing || 'No impact weighing provided',
          evidence: analysis.evidence || []
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
    keyArguments: string;
    clash: string;
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

Please provide a detailed analysis in this exact JSON format:
{
  "winner": "affirmative or negative",
  "keyArguments": "Which specific arguments won the debate? For example: 'The affirmative's climate change contention had high impact, while the negative's structural violence contention lacked proper link.' Focus on the most persuasive arguments and why they were effective.",
  "clash": "Which rebuttals worked well or didn't work? For example: 'The negative's rebuttal against climate change that China has most emissions, so US action is ineffective, was persuasive and well-linked.' Analyze the quality of rebuttals and their effectiveness.",
  "speakerPoints": {
    "speaker1": 28,
    "speaker2": 26,
    "speaker3": 27,
    "speaker4": 25
  },
  "summary": "Overall summary of the debate"
}

IMPORTANT SCORING RULES:
- Use a 25-30 point scale (25 = horrible, 30 = amazing)
- The winning team MUST have higher scores than the losing team
- For close debates, use scores like 28-27, 27-26, etc.
- For decisive wins, use larger gaps like 30-26, 29-25, etc.
- Base scores on actual performance quality, not just win/loss
- All scores must be between 25-30 inclusive

For keyArguments and clash sections, be specific about which arguments and rebuttals were most effective and why.`;

    try {
      const response = await fetch(OPENAI_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${OPENAI_API_KEY}`
        },
        body: JSON.stringify({
          model: 'gpt-4.1-nano',
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
        
        // Validate that winning team has higher scores and all scores are in 25-30 range
        const winningTeam = analysis.winner;
        const winningTeamSpeakers = session.speakers.filter((s: any) => s.team === winningTeam);
        const losingTeamSpeakers = session.speakers.filter((s: any) => s.team !== winningTeam);
        
        // Ensure all scores are within 25-30 range
        session.speakers.forEach((s: any) => {
          if (analysis.speakerPoints[s.id]) {
            analysis.speakerPoints[s.id] = Math.max(25, Math.min(30, analysis.speakerPoints[s.id]));
          } else {
            analysis.speakerPoints[s.id] = 27; // Default score
          }
        });
        
        // Ensure winning team has higher scores than losing team
        const winningScores = winningTeamSpeakers.map((s: any) => analysis.speakerPoints[s.id] || 27);
        const losingScores = losingTeamSpeakers.map((s: any) => analysis.speakerPoints[s.id] || 27);
        
        const maxWinningScore = Math.max(...winningScores);
        const maxLosingScore = Math.max(...losingScores);
        const minWinningScore = Math.min(...winningScores);
        const minLosingScore = Math.min(...losingScores);
        
        // If winning team doesn't have higher scores, adjust them
        if (maxWinningScore <= maxLosingScore || minWinningScore <= minLosingScore) {
          // Calculate the minimum gap needed
          const gap = Math.max(1, maxLosingScore - maxWinningScore + 1);
          
          // Adjust winning team scores up
          winningTeamSpeakers.forEach((s: any) => {
            const currentScore = analysis.speakerPoints[s.id] || 27;
            const newScore = Math.min(30, currentScore + gap);
            analysis.speakerPoints[s.id] = newScore;
          });
          
          // Adjust losing team scores down if needed
          losingTeamSpeakers.forEach((s: any) => {
            const currentScore = analysis.speakerPoints[s.id] || 27;
            const newScore = Math.max(25, currentScore - Math.floor(gap / 2));
            analysis.speakerPoints[s.id] = newScore;
          });
        }
        
        return {
          winner: analysis.winner || 'affirmative',
          keyArguments: analysis.keyArguments || 'No key arguments provided',
          clash: analysis.clash || 'No clash analysis provided',
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

  static async generateCrossExaminationQuestions(targetArgument: string, topic: string): Promise<string[]> {
    if (!isAPIKeyConfigured()) {
      throw new Error('OpenAI API key not configured. Please set VITE_OPENAI_API_KEY in your .env file.');
    }

    const prompt = `You are an expert debate coach. Generate 3-5 effective cross-examination questions to challenge the following argument.

Debate Topic: ${topic}
Target Argument: "${targetArgument}"

Generate questions that:
1. Expose logical flaws or assumptions
2. Challenge evidence or examples
3. Force the speaker to clarify their position
4. Set up potential rebuttals

Respond in this exact JSON format:
{
  "questions": [
    "Question 1",
    "Question 2", 
    "Question 3",
    "Question 4"
  ]
}`;

    try {
      const response = await fetch(OPENAI_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${OPENAI_API_KEY}`
        },
        body: JSON.stringify({
          model: 'gpt-4.1-nano',
          messages: [
            {
              role: 'user',
              content: prompt
            }
          ],
          max_tokens: 500,
          temperature: 0.7
        })
      });

      if (!response.ok) {
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
          const codeMatch = content.match(/```\s*([\s\S]*?)\s*```/);
          if (codeMatch) {
            jsonContent = codeMatch[1];
          }
        }
        
        const analysis = JSON.parse(jsonContent);
        return analysis.questions || [];
      } catch (parseError) {
        console.error('Failed to parse API response:', parseError);
        throw new Error('Invalid response format from API');
      }
    } catch (error) {
      console.error('API error:', error);
      throw error;
    }
  }

  static async generateRebuttalHint(opponentArgument: string, topic: string, team: 'affirmative' | 'negative'): Promise<string> {
    if (!isAPIKeyConfigured()) {
      throw new Error('OpenAI API key not configured. Please set VITE_OPENAI_API_KEY in your .env file.');
    }

    const prompt = `You are an expert debate coach helping the ${team} team. Generate a strategic rebuttal hint for the following opponent argument.

Debate Topic: ${topic}
Opponent Argument: "${opponentArgument}"
Your Team: ${team}

Provide a concise but strategic hint that:
1. Identifies the weakest point in the opponent's argument
2. Suggests a specific rebuttal approach
3. Mentions potential evidence or examples to use
4. Keeps it brief and actionable

Respond in this exact JSON format:
{
  "hint": "Your strategic rebuttal hint here"
}`;

    try {
      const response = await fetch(OPENAI_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${OPENAI_API_KEY}`
        },
        body: JSON.stringify({
          model: 'gpt-4.1-nano',
          messages: [
            {
              role: 'user',
              content: prompt
            }
          ],
          max_tokens: 300,
          temperature: 0.7
        })
      });

      if (!response.ok) {
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
          const codeMatch = content.match(/```\s*([\s\S]*?)\s*```/);
          if (codeMatch) {
            jsonContent = codeMatch[1];
          }
        }
        
        const analysis = JSON.parse(jsonContent);
        return analysis.hint || 'No hint available';
      } catch (parseError) {
        console.error('Failed to parse API response:', parseError);
        throw new Error('Invalid response format from API');
      }
    } catch (error) {
      console.error('API error:', error);
      throw error;
    }
  }

  static async generateSpeakerFeedback(speakerName: string, team: string, topic: string, speeches: string[]): Promise<{
    strengths: string[];
    areasForImprovement: string[];
    overallAssessment: string;
    delivery: {
      wordsPerMinute: number;
      fillerWords: {
        count: number;
        types: string[];
        percentage: number;
      };
      paceAssessment: string;
      fillerAssessment: string;
    };
  }> {
    if (!isAPIKeyConfigured()) {
      throw new Error('OpenAI API key not configured. Please set VITE_OPENAI_API_KEY in your .env file.');
    }

    // If no speeches provided, return a generic message
    if (!speeches || speeches.length === 0) {
      return {
        strengths: ['Participated actively in the debate'],
        areasForImprovement: [
          'Complete more speeches to receive personalized feedback',
          'Practice speaking clearly and confidently'
        ],
        overallAssessment: 'Thank you for participating in the debate! Complete more speeches to receive detailed personalized feedback.',
        delivery: {
          wordsPerMinute: 0,
          fillerWords: { count: 0, types: [], percentage: 0 },
          paceAssessment: 'Unable to analyze pace - no speech data available',
          fillerAssessment: 'Unable to analyze filler words - no speech data available'
        }
      };
    }

    console.log(`AIService: Generating feedback for ${speakerName} (${team}) on topic: ${topic}`);
    console.log(`AIService: Number of speeches: ${speeches.length}`);

    // Calculate delivery metrics
    const deliveryMetrics = this.calculateDeliveryMetrics(speeches);

    const combinedSpeeches = speeches.join('\n\n');

    const prompt = `You are an expert debate coach. Provide structured feedback for a debater based on their speeches.

Speaker: ${speakerName}
Team: ${team}
Topic: ${topic}

Speeches:
${combinedSpeeches}

Please provide structured feedback in this exact JSON format:
{
  "strengths": [
    "At least 1 specific strength or positive aspect of their debating",
    "Another strength if applicable"
  ],
  "areasForImprovement": [
    "At least 2 specific areas where they can improve",
    "Another area for improvement",
    "Additional improvement area if applicable"
  ],
  "overallAssessment": "A brief 2-3 sentence overall assessment of their performance",
  "delivery": {
    "paceAssessment": "Assessment of speaking pace based on ${deliveryMetrics.wordsPerMinute} words per minute (target: 130-160 wpm)",
    "fillerAssessment": "Assessment of filler word usage - found ${deliveryMetrics.fillerWords.count} filler words (${deliveryMetrics.fillerWords.percentage.toFixed(1)}% of speech)"
  }
}

Requirements:
- Provide 3-5 total bullet points (1-2 strengths, 2-3 areas for improvement)
- Minimum 1 strength, minimum 2 areas for improvement
- Be specific and actionable
- Keep tone encouraging but honest
- Focus on debate skills, argumentation, delivery, and strategy

IMPORTANT: Remember that speaker points in debate are scored on a 25-30 scale where:
- 25 = Horrible performance
- 26 = Poor performance  
- 27 = Average performance
- 28 = Good performance
- 29 = Excellent performance
- 30 = Amazing/Perfect performance

Most speakers score between 26-29, with 30 being extremely rare.`;

    try {
      console.log(`AIService: Making API call for feedback generation...`);
      const response = await fetch(OPENAI_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${OPENAI_API_KEY}`
        },
        body: JSON.stringify({
          model: 'gpt-4.1-nano',
          messages: [
            {
              role: 'user',
              content: prompt
            }
          ],
          max_tokens: 800,
          temperature: 0.7
        })
      });

      console.log(`AIService: API response status: ${response.status}`);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('AIService: API Response:', response.status, errorText);
        throw new Error(`API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      console.log(`AIService: API response data:`, data);
      
      if (!data.choices || !data.choices[0] || !data.choices[0].message || !data.choices[0].message.content) {
        console.error('AIService: Invalid response format:', data);
        throw new Error('Invalid response format from API');
      }
      
      const content = data.choices[0].message.content;
      console.log(`AIService: Generated feedback:`, content.substring(0, 100) + '...');
      
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
          const codeMatch = content.match(/```\s*([\s\S]*?)\s*```/);
          if (codeMatch) {
            jsonContent = codeMatch[1];
          }
        }
        
        const feedback = JSON.parse(jsonContent);
        
        // Add delivery metrics to the response
        feedback.delivery = {
          ...deliveryMetrics,
          paceAssessment: feedback.delivery?.paceAssessment || this.generatePaceAssessment(deliveryMetrics.wordsPerMinute),
          fillerAssessment: feedback.delivery?.fillerAssessment || this.generateFillerAssessment(deliveryMetrics.fillerWords)
        };
        
        // Validate the structure
        if (!feedback.strengths || !feedback.areasForImprovement || !feedback.overallAssessment) {
          throw new Error('Invalid feedback structure');
        }
        
        // Ensure minimum requirements
        if (feedback.strengths.length < 1) {
          feedback.strengths = ['Showed commitment to participating in the debate'];
        }
        if (feedback.areasForImprovement.length < 2) {
          feedback.areasForImprovement = [
            'Practice speaking more clearly and confidently',
            'Develop stronger argumentation skills'
          ];
        }
        
        return feedback;
      } catch (parseError) {
        console.error('AIService: JSON parsing error:', parseError);
        // Return fallback structured feedback
        return {
          strengths: ['Actively participated in the debate'],
          areasForImprovement: [
            'Practice speaking more clearly and confidently',
            'Develop stronger argumentation and evidence usage',
            'Work on timing and speech structure'
          ],
          overallAssessment: `Thank you for participating in the debate, ${speakerName}! While we couldn't generate detailed personalized feedback at this time, we encourage you to review your speeches and continue practicing.`,
          delivery: {
            ...deliveryMetrics,
            paceAssessment: this.generatePaceAssessment(deliveryMetrics.wordsPerMinute),
            fillerAssessment: this.generateFillerAssessment(deliveryMetrics.fillerWords)
          }
        };
      }
    } catch (error) {
      console.error('AIService: API error in generateSpeakerFeedback:', error);
      // Return fallback structured feedback
      return {
        strengths: ['Actively participated in the debate'],
        areasForImprovement: [
          'Practice speaking more clearly and confidently',
          'Develop stronger argumentation and evidence usage',
          'Work on timing and speech structure'
        ],
        overallAssessment: `Thank you for participating in the debate, ${speakerName}! While we couldn't generate detailed personalized feedback at this time, we encourage you to review your speeches and continue practicing.`,
        delivery: {
          ...deliveryMetrics,
          paceAssessment: this.generatePaceAssessment(deliveryMetrics.wordsPerMinute),
          fillerAssessment: this.generateFillerAssessment(deliveryMetrics.fillerWords)
        }
      };
    }
  }

  static async generateContentRecommendations(speakerName: string, team: string, topic: string, speeches: string[], feedback: string): Promise<{
    weaknesses: string[];
    recommendations: Array<{
      type: 'video' | 'book' | 'article' | 'course';
      title: string;
      description: string;
      url?: string;
      reason: string;
    }>;
  }> {
    if (!isAPIKeyConfigured()) {
      throw new Error('OpenAI API key not configured. Please set VITE_OPENAI_API_KEY in your .env file.');
    }

    // If no speeches provided, return default recommendations
    if (!speeches || speeches.length === 0) {
      return {
        weaknesses: ['Limited speech data available for analysis'],
        recommendations: [
          {
            type: 'video',
            title: 'Debate Fundamentals',
            description: 'Learn the basics of debate structure and argumentation',
            reason: 'Essential foundation for all debaters'
          },
          {
            type: 'book',
            title: 'The Art of Debate',
            description: 'Comprehensive guide to debate techniques and strategies',
            reason: 'Valuable resource for improving debate skills'
          }
        ]
      };
    }

    console.log(`AIService: Generating content recommendations for ${speakerName} (${team})`);
    console.log(`AIService: Feedback received:`, feedback.substring(0, 100) + '...');

    const combinedSpeeches = speeches.join('\n\n');

    const prompt = `You are an expert debate coach and educational content curator. Based on a debater's performance and feedback, recommend specific educational content to help them improve.

Speaker: ${speakerName}
Team: ${team}
Topic: ${topic}

Speeches:
${combinedSpeeches}

Feedback Given:
${feedback}

Please analyze the debater's weaknesses and recommend 2-3 specific educational resources (videos, books, articles, or courses) that would help them improve.

First, identify 2-3 specific weaknesses from their performance. Then recommend content that directly addresses these weaknesses.

Respond in this exact JSON format:
{
  "weaknesses": ["specific weakness 1", "specific weakness 2", "specific weakness 3"],
  "recommendations": [
    {
      "type": "video",
      "title": "How to Find Strong Evidence Quickly",
      "description": "A comprehensive guide on research techniques for debate evidence",
      "url": "https://example.com/video-url",
      "reason": "This video directly addresses your struggle with finding relevant evidence"
    },
    {
      "type": "book", 
      "title": "The Art of Rebuttal",
      "description": "Master the techniques of effective counter-arguments",
      "reason": "This book will help improve your rebuttal skills which were identified as an area for growth"
    }
  ]
}

Focus on high-quality, accessible content that directly addresses the specific weaknesses identified. For videos, prefer YouTube educational channels. For books, suggest well-known debate or public speaking books. For articles, suggest academic or debate coaching resources.`;

    try {
      console.log(`AIService: Making API call for content recommendations...`);
      const response = await fetch(OPENAI_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${OPENAI_API_KEY}`
        },
        body: JSON.stringify({
          model: 'gpt-4.1-nano',
          messages: [
            {
              role: 'user',
              content: prompt
            }
          ],
          max_tokens: 1000,
          temperature: 0.7
        })
      });

      console.log(`AIService: Content recommendations API response status: ${response.status}`);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('AIService: Content recommendations API Response:', response.status, errorText);
        throw new Error(`API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      console.log(`AIService: Content recommendations API response data:`, data);
      const content = data.choices[0].message.content;
      
      try {
        let jsonContent = content;
        
        if (content.includes('```json')) {
          const jsonMatch = content.match(/```json\s*([\s\S]*?)\s*```/);
          if (jsonMatch) {
            jsonContent = jsonMatch[1];
          }
        } else if (content.includes('```')) {
          const codeMatch = content.match(/```\s*([\s\S]*?)\s*```/);
          if (codeMatch) {
            jsonContent = codeMatch[1];
          }
        }
        
        const analysis = JSON.parse(jsonContent);
        console.log(`AIService: Parsed content recommendations:`, analysis);
        return {
          weaknesses: analysis.weaknesses || [],
          recommendations: analysis.recommendations || []
        };
      } catch (parseError) {
        console.error('AIService: Failed to parse content recommendations:', parseError);
        console.error('AIService: Raw content:', content);
        throw new Error('Invalid response format from API');
      }
    } catch (error) {
      console.error('AIService: API error in generateContentRecommendations:', error);
      // Return helpful fallback recommendations instead of throwing
      return {
        weaknesses: ['Analysis temporarily unavailable'],
        recommendations: [
          {
            type: 'video',
            title: 'Debate Fundamentals',
            description: 'Essential debate techniques and strategies',
            reason: 'Great starting point for improving debate skills'
          },
          {
            type: 'book',
            title: 'The Art of Debate',
            description: 'Comprehensive guide to debate techniques',
            reason: 'Valuable resource for all debaters'
          }
        ]
      };
    }
  }

  // New methods for argument mapping
  static async extractArgumentNodes(transcript: string, speakerId: string, speakerName: string, team: 'affirmative' | 'negative', speechNumber: number): Promise<{
    nodes: any[];
    connections: any[];
  }> {
    if (!isAPIKeyConfigured()) {
      throw new Error('OpenAI API key not configured. Please set VITE_OPENAI_API_KEY in your .env file.');
    }

    const prompt = `You are an expert debate analyst specializing in argument mapping. Analyze the following speech and extract argument nodes and their relationships.

Speech Transcript:
"${transcript}"

Extract all arguments and organize them into a logical structure. For each argument, identify:
1. Main claims (the core arguments)
2. Supporting evidence (facts, statistics, quotes)
3. Reasoning (logical connections)
4. Counter-claims (responses to opponents)
5. Rebuttals (responses to counter-arguments)

For each node, provide:
- Type: claim, evidence, reasoning, counter-claim, or rebuttal
- Content: the actual text/argument
- Strength: 1-10 scale based on argument quality
- Evidence quality: 1-10 scale for evidence nodes
- Parent relationship: which argument this supports or counters
- Summary: a very short phrase (not a full sentence) that captures the core idea (e.g., 'high cost justified by pay')

Respond in this exact JSON format:
{
  "nodes": [
    {
      "type": "claim",
      "content": "We should ban fast food in schools",
      "strength": 8,
      "evidenceQuality": null,
      "parentId": null,
      "summary": "ban fast food in schools"
    },
    {
      "type": "evidence", 
      "content": "Studies show 60% of school lunches exceed calorie limits",
      "strength": 7,
      "evidenceQuality": 8,
      "parentId": "claim_1",
      "summary": "school lunches exceed calories"
    }
  ],
  "connections": [
    {
      "fromNodeId": "evidence_1",
      "toNodeId": "claim_1", 
      "type": "supports",
      "strength": 8
    }
  ]
}

Keep arguments concise but complete. For the summary, use a short phrase, not a full sentence. Focus on the most important points.`;

    try {
      const response = await fetch(OPENAI_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${OPENAI_API_KEY}`
        },
        body: JSON.stringify({
          model: 'gpt-4.1-nano',
          messages: [
            {
              role: 'user',
              content: prompt
            }
          ],
          max_tokens: 2000,
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
        
        if (content.includes('```json')) {
          const jsonMatch = content.match(/```json\s*([\s\S]*?)\s*```/);
          if (jsonMatch) {
            jsonContent = jsonMatch[1];
          }
        } else if (content.includes('```')) {
          const codeMatch = content.match(/```\s*([\s\S]*?)\s*```/);
          if (codeMatch) {
            jsonContent = codeMatch[1];
          }
        }
        
        const analysis = JSON.parse(jsonContent);
        
        // Add metadata to nodes
        const nodes = (analysis.nodes || []).map((node: any, index: number) => ({
          id: `${speakerId}_${speechNumber}_${index}`,
          ...node,
          speakerId,
          speakerName,
          team,
          speechNumber,
          timestamp: new Date(),
          childrenIds: [],
          position: { x: 0, y: 0 } // Will be calculated by the visual component
        }));

        const connections = (analysis.connections || []).map((conn: any, index: number) => ({
          id: `conn_${speakerId}_${speechNumber}_${index}`,
          ...conn
        }));

        return { nodes, connections };
      } catch (parseError) {
        console.error('Failed to parse argument mapping response:', parseError);
        console.error('Raw content:', content);
        throw new Error('Invalid response format from API');
      }
    } catch (error) {
      console.error('API error:', error);
      throw error;
    }
  }

  static async detectLogicalFallacies(argument: string): Promise<{
    fallacies: any[];
    overallStrength: number;
  }> {
    if (!isAPIKeyConfigured()) {
      throw new Error('OpenAI API key not configured. Please set VITE_OPENAI_API_KEY in your .env file.');
    }

    const prompt = `You are an expert in logical reasoning and fallacy detection. Analyze the following argument for logical fallacies.

Argument: "${argument}"

Identify any logical fallacies present and assess the overall argument strength. Common fallacies include:
- Ad hominem (attacking the person)
- Straw man (misrepresenting opponent's argument)
- Appeal to authority (without proper justification)
- False dichotomy (presenting only two options)
- Hasty generalization (jumping to conclusions)
- Appeal to emotion (without logical support)
- Circular reasoning
- Post hoc ergo propter hoc (correlation vs causation)

For each fallacy found, provide:
- Type of fallacy
- Description of why it's a fallacy
- Severity (low, medium, high)
- Suggestion for improvement

Respond in this exact JSON format:
{
  "fallacies": [
    {
      "type": "Ad hominem",
      "description": "Attacking the person instead of the argument",
      "severity": "medium",
      "suggestion": "Focus on the argument itself, not the speaker"
    }
  ],
  "overallStrength": 6
}

If no fallacies are found, return empty array for fallacies and high strength score.`;

    try {
      const response = await fetch(OPENAI_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${OPENAI_API_KEY}`
        },
        body: JSON.stringify({
          model: 'gpt-4.1-nano',
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

      if (!response.ok) {
        const errorText = await response.text();
        console.error('API Response:', response.status, errorText);
        throw new Error(`API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      const content = data.choices[0].message.content;
      
      try {
        let jsonContent = content;
        
        if (content.includes('```json')) {
          const jsonMatch = content.match(/```json\s*([\s\S]*?)\s*```/);
          if (jsonMatch) {
            jsonContent = jsonMatch[1];
          }
        } else if (content.includes('```')) {
          const codeMatch = content.match(/```\s*([\s\S]*?)\s*```/);
          if (codeMatch) {
            jsonContent = codeMatch[1];
          }
        }
        
        const analysis = JSON.parse(jsonContent);
        return {
          fallacies: analysis.fallacies || [],
          overallStrength: analysis.overallStrength || 8
        };
      } catch (parseError) {
        console.error('Failed to parse fallacy detection response:', parseError);
        console.error('Raw content:', content);
        throw new Error('Invalid response format from API');
      }
    } catch (error) {
      console.error('API error:', error);
      throw error;
    }
  }
} 