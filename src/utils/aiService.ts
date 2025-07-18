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
3. Individual speaker scores (0-100 scale) - IMPORTANT: The winning team must have higher scores than the losing team
4. Overall debate summary

IMPORTANT SCORING RULES:
- The winning team should have higher scores than the losing team
- For close debates, use scores like 85-84, 82-81, etc.
- For decisive wins, use larger gaps like 88-82, 85-78, etc.
- Base scores on actual performance quality, not just win/loss
- All scores should be between 70-95 for realistic debate scoring

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
        
        // Validate that winning team has higher scores
        const winningTeam = analysis.winner;
        const winningTeamSpeakers = session.speakers.filter((s: any) => s.team === winningTeam);
        const losingTeamSpeakers = session.speakers.filter((s: any) => s.team !== winningTeam);
        
        const winningScores = winningTeamSpeakers.map((s: any) => analysis.speakerPoints[s.id] || 0);
        const losingScores = losingTeamSpeakers.map((s: any) => analysis.speakerPoints[s.id] || 0);
        
        const avgWinningScore = winningScores.length > 0 ? winningScores.reduce((a: number, b: number) => a + b, 0) / winningScores.length : 0;
        const avgLosingScore = losingScores.length > 0 ? losingScores.reduce((a: number, b: number) => a + b, 0) / losingScores.length : 0;
        
        // If winning team doesn't have higher average score, adjust scores
        if (avgWinningScore <= avgLosingScore) {
          const adjustment = Math.max(3, Math.ceil((avgLosingScore - avgWinningScore) + 2));
          winningTeamSpeakers.forEach((s: any) => {
            if (analysis.speakerPoints[s.id]) {
              analysis.speakerPoints[s.id] += adjustment;
            }
          });
        }
        
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

  static async generateSpeakerFeedback(speakerName: string, team: string, topic: string, speeches: string[]): Promise<string> {
    if (!isAPIKeyConfigured()) {
      throw new Error('OpenAI API key not configured. Please set VITE_OPENAI_API_KEY in your .env file.');
    }

    // If no speeches provided, return a generic message
    if (!speeches || speeches.length === 0) {
      return 'No speeches available for analysis. Please ensure you have completed at least one speech to receive personalized feedback.';
    }

    console.log(`AIService: Generating feedback for ${speakerName} (${team}) on topic: ${topic}`);
    console.log(`AIService: Number of speeches: ${speeches.length}`);

    const combinedSpeeches = speeches.join('\n\n');

    const prompt = `You are an expert debate coach. Provide personalized feedback for a debater based on their speeches.

Speaker: ${speakerName}
Team: ${team}
Topic: ${topic}

Speeches:
${combinedSpeeches}

Please provide constructive feedback in 2-3 paragraphs covering:
1. Strengths and effective techniques used
2. Areas for improvement
3. Specific advice for future debates

Keep the tone encouraging but honest. Focus on actionable advice.`;

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
          max_tokens: 500,
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
      
      const feedback = data.choices[0].message.content;
      console.log(`AIService: Generated feedback:`, feedback.substring(0, 100) + '...');
      return feedback;
    } catch (error) {
      console.error('AIService: API error in generateSpeakerFeedback:', error);
      // Return a helpful fallback message instead of throwing
      return `Thank you for participating in the debate, ${speakerName}! While we couldn't generate personalized feedback at this time, we encourage you to review your speeches and consider areas where you felt most confident and areas where you could improve. Practice and preparation are key to becoming a stronger debater.`;
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