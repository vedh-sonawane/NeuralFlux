const API_BASE = import.meta.env.DEV 
  ? '/api/proxy'
  : 'https://ai.hackclub.com/proxy/v1/chat/completions';
const API_KEY = 'sk-hc-v1-9f014e0f299f43848b4aa17fa0c69b3f5347bb18ef7f4627b5cea30023ddc1ef';

interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

async function callAI(messages: ChatMessage[], temperature: number = 0.7, maxTokens: number = 1000): Promise<string> {
  const requestData = {
    model: 'qwen/qwen3-32b',
    messages,
    temperature,
    max_tokens: maxTokens,
  };

  const headers = {
    'Authorization': `Bearer ${API_KEY}`,
    'Content-Type': 'application/json',
  };

  const timeoutMs = 20000;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    console.log('Calling AI API:', API_BASE);
    console.log('Request data:', JSON.stringify(requestData, null, 2));
    
    const response = await fetch(API_BASE, {
      method: 'POST',
      headers,
      body: JSON.stringify(requestData),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    console.log('Got response, status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('API Error Response:', response.status, errorText);
      throw new Error(`API error: ${response.status} - ${errorText}`);
    }

    const responseData: any = await response.json();
    console.log('Response data received:', JSON.stringify(responseData, null, 2));
    
    const data = Array.isArray(responseData) ? responseData[0] : responseData;
    
    let content = data.choices?.[0]?.message?.content || '';
    
    const finishReason = data.choices?.[0]?.finish_reason;
    if (finishReason && finishReason !== 'stop') {
      console.warn('Response finished with reason:', finishReason);
      if (finishReason === 'length' && content) {
        console.warn('Response was truncated due to length limit, but has content');
      }
    }
    
    if (!content && data.choices?.[0]?.content) {
      content = data.choices[0].content;
    }
    if (!content && data.choices?.[0]?.delta?.content) {
      content = data.choices[0].delta.content;
    }
    if (!content && data.message?.content) {
      content = data.message.content;
    }
    if (!content && data.content) {
      content = data.content;
    }
    
    if (content === null || content === undefined) {
      content = '';
    }
    
    if (!content && finishReason === 'length') {
      console.warn('Response was truncated but no content extracted. Trying alternative extraction...');
      const rawContent = JSON.stringify(data, null, 2);
      const contentMatch = rawContent.match(/"content"\s*:\s*"([^"]+)"/);
      if (contentMatch && contentMatch[1]) {
        content = contentMatch[1].replace(/\\n/g, '\n').replace(/\\"/g, '"');
        console.log('Extracted content from alternative method');
      }
      if (!content) {
        const textMatch = rawContent.match(/"text"\s*:\s*"([^"]+)"/);
        if (textMatch && textMatch[1]) {
          content = textMatch[1].replace(/\\n/g, '\n').replace(/\\"/g, '"');
          console.log('Extracted content from text field');
        }
      }
    }
    
    if (finishReason === 'length' && content) {
      console.warn(`Response was truncated (finish_reason: length), but returning available content (${content.length} chars)`);
      return content;
    }
    
    if (!content) {
      console.error('Empty response from AI. Full response structure:', {
        hasChoices: !!data.choices,
        choicesLength: data.choices?.length,
        firstChoice: data.choices?.[0],
        finishReason: data.choices?.[0]?.finish_reason,
        messageExists: !!data.choices?.[0]?.message,
        messageContent: data.choices?.[0]?.message?.content,
        fullResponse: data
      });
      throw new Error(`AI returned empty response${finishReason ? ` (finish_reason: ${finishReason})` : ''}`);
    }
    
    console.log('Successfully got response from AI, length:', content.length);
    return content;
  } catch (error) {
    clearTimeout(timeoutId);
    
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error(`Request timed out after ${timeoutMs}ms`);
    }
    
    if (error instanceof TypeError && (error.message.includes('Failed to fetch') || error.message.includes('NetworkError'))) {
      const isCorsError = error.message.includes('Failed to fetch') || error.message.includes('CORS');
      const errorMsg = isCorsError 
        ? 'CORS Error: The API may not allow browser requests. This could be a CORS policy issue. Please check if the API supports CORS or use a proxy.'
        : 'Network Error: Unable to connect to AI API. Please check your internet connection.';
      console.error('Network error details:', error);
      throw new Error(errorMsg);
    }
    
    console.error('API call error:', error);
    throw error instanceof Error ? error : new Error(String(error));
  }
}

export async function generateQuestion(type: string, difficulty: number): Promise<string> {
  const complexityLevels: Record<number, string> = {
    1: 'simple and straightforward',
    2: 'moderately complex',
    3: 'complex with multiple aspects',
    4: 'very complex or multi-part',
    5: 'extremely complex, ambiguous, or emotionally challenging'
  };

  const prompt = `Generate a unique ${complexityLevels[difficulty] || 'moderately complex'} ${type.toLowerCase()} request that a real user would send to an AI assistant.

Type: ${type}
Difficulty: ${difficulty}/5

OUTPUT ONLY THE FINAL USER REQUEST. NOTHING ELSE.

DO NOT INCLUDE:
- Any thinking process ("Let me start by...", "I need to understand...", "First, let me...")
- Any reasoning ("The user wants...", "This should be...", "I'll create...")
- Any explanations or descriptions
- Any meta-commentary about what you're doing
- Any phrases like "Let me", "I should", "I will", "First", "Now", "Okay"

OUTPUT FORMAT:
- ONLY the actual user request/question text
- Maximum 320 characters
- Write it as if YOU are the user typing to an AI assistant
- Make it authentic and natural
- Be creative and unique

Example of what to output: "Can you help me write a professional email to my boss about taking time off?"

Now output ONLY the final user request (no thinking, no reasoning, just the request):`;

  const messages: ChatMessage[] = [
    { 
      role: 'system', 
      content: 'You are a user request generator. You output ONLY the final user request text. You NEVER include thinking, reasoning, explanations, or any meta-commentary. You NEVER write phrases like "Let me start", "I need to", "First", "Let me understand", etc. You ONLY output the actual user request/question that a real person would type to an AI assistant.' 
    },
    { role: 'user', content: prompt }
  ];

  try {
    const response = await callAI(messages, 0.9, 500);
    
    let cleaned = response.trim();
    
    // Remove quotes
    if ((cleaned.startsWith('"') && cleaned.endsWith('"')) || 
        (cleaned.startsWith("'") && cleaned.endsWith("'"))) {
      cleaned = cleaned.slice(1, -1);
    }
    
    // Remove common prefixes
    cleaned = cleaned.replace(/^(Question:|Scenario:|Request:|User:|Prompt:|Task:)\s*/i, '');
    cleaned = cleaned.replace(/^(The user asks:|The user wants:|User asks:|User wants:)\s*/i, '');
    
    // Remove reasoning/thinking patterns (more comprehensive)
    cleaned = cleaned.replace(/^okay,?\s*/i, '');
    cleaned = cleaned.replace(/^let me\s+/i, '');
    cleaned = cleaned.replace(/^let me start\s+/i, '');
    cleaned = cleaned.replace(/^let me understand\s+/i, '');
    cleaned = cleaned.replace(/^i need to\s+/i, '');
    cleaned = cleaned.replace(/^i need to understand\s+/i, '');
    cleaned = cleaned.replace(/^the user wants me to\s+/i, '');
    cleaned = cleaned.replace(/^i should\s+/i, '');
    cleaned = cleaned.replace(/^i'll\s+/i, '');
    cleaned = cleaned.replace(/^i will\s+/i, '');
    cleaned = cleaned.replace(/^i'm going to\s+/i, '');
    cleaned = cleaned.replace(/^i am going to\s+/i, '');
    cleaned = cleaned.replace(/^first,?\s*/i, '');
    cleaned = cleaned.replace(/^first of all,?\s*/i, '');
    cleaned = cleaned.replace(/^to start,?\s*/i, '');
    cleaned = cleaned.replace(/^to begin,?\s*/i, '');
    cleaned = cleaned.replace(/^the type is\s+/i, '');
    cleaned = cleaned.replace(/^the scenario should\s+/i, '');
    cleaned = cleaned.replace(/^so the\s+/i, '');
    cleaned = cleaned.replace(/^this should\s+/i, '');
    cleaned = cleaned.replace(/^it should\s+/i, '');
    cleaned = cleaned.replace(/^now,?\s*/i, '');
    cleaned = cleaned.replace(/^by understanding\s+/i, '');
    cleaned = cleaned.replace(/^starting by\s+/i, '');
    
    // Remove meta-commentary patterns
    cleaned = cleaned.replace(/^.*?generate.*?request.*?\.\s*/i, '');
    cleaned = cleaned.replace(/^.*?think about.*?\.\s*/i, '');
    cleaned = cleaned.replace(/^.*?entails.*?\.\s*/i, '');
    cleaned = cleaned.replace(/^.*?maybe.*?like.*?\.\s*/i, '');
    cleaned = cleaned.replace(/^.*?evoke.*?emotion.*?\.\s*/i, '');
    cleaned = cleaned.replace(/^.*?the user might\s+/i, '');
    cleaned = cleaned.replace(/^.*?could be\s+/i, '');
    cleaned = cleaned.replace(/^.*?should involve\s+/i, '');
    cleaned = cleaned.replace(/^.*?let me start by.*?\.\s*/i, '');
    cleaned = cleaned.replace(/^.*?i need to understand.*?\.\s*/i, '');
    cleaned = cleaned.replace(/^.*?starting by understanding.*?\.\s*/i, '');
    cleaned = cleaned.replace(/^.*?by understanding the requirements.*?\.\s*/i, '');
    
    // Find the actual question by looking for question marks or imperative statements
    const questionMatch = cleaned.match(/([^.!?]*[?!]|[^.!?]{20,})/);
    if (questionMatch) {
      cleaned = questionMatch[1].trim();
    }
    
    // If still contains reasoning patterns, try to extract just the question part
    const reasoningPatterns = [
      'the user wants', 'let me think', 'i need to', 'maybe something',
      'first, the type', 'the type is', 'the scenario should', 'so the',
      'evoke', 'the user might', 'could be', 'should involve', 'entails'
    ];
    
    const hasReasoning = reasoningPatterns.some(pattern => 
      cleaned.toLowerCase().includes(pattern)
    );
    
    if (hasReasoning) {
      // Try to find text after common reasoning phrases (look for quotes or question marks)
      const quotedMatch = cleaned.match(/["']([^"']{15,})["']/);
      if (quotedMatch && quotedMatch[1]) {
        cleaned = quotedMatch[1].trim();
      } else {
        // Try to find text after reasoning phrases
        const afterReasoning = cleaned.match(/(?:\.|,|:)\s*([^.!?]{15,}[?!]|[^.!?]{30,})/);
        if (afterReasoning && afterReasoning[1]) {
          cleaned = afterReasoning[1].trim();
        } else {
          // Last resort: take everything after the first sentence if it looks like reasoning
          const sentences = cleaned.split(/[.!?]\s+/);
          if (sentences.length > 1) {
            const firstSentence = sentences[0].toLowerCase();
            const isReasoning = reasoningPatterns.some(pattern => 
              firstSentence.includes(pattern)
            ) || firstSentence.includes('think') || 
              firstSentence.includes('generate') ||
              firstSentence.includes('maybe') ||
              firstSentence.includes('should') ||
              firstSentence.includes('type is');
            
            if (isReasoning) {
              cleaned = sentences.slice(1).join('. ').trim();
            }
          }
        }
      }
    }
    
    if (!cleaned || cleaned.length < 10) {
      throw new Error('AI returned empty or too short response');
    }
    
    cleaned = cleaned.trim();
    
    if (cleaned.length > 320) {
      cleaned = cleaned.substring(0, 317) + '...';
      console.warn('Question was too long, truncated to 320 characters');
    }
    
    return cleaned;
  } catch (error) {
    console.error('Error in generateQuestion:', error);
    throw error;
  }
}

export async function generateAIResponse(question: string, _type: string, difficulty: number): Promise<string> {
  const prompt = `You are a professional AI assistant (like ChatGPT or Claude). A user sent you this request:

"${question}"

OUTPUT ONLY THE FINAL AI ASSISTANT RESPONSE. NOTHING ELSE.

DO NOT INCLUDE:
- Any thinking process ("Okay, let me start by...", "First, I should...", "I need to consider...")
- Any reasoning ("The key points are...", "The user might want...", "I should...")
- Any explanations about what you're doing
- Any meta-commentary
- Any phrases like "Let me", "First", "I should", "I need to", "Maybe", "The user might"

OUTPUT FORMAT:
- ONLY the actual AI assistant response text
- Directly addresses the user's request
- Is helpful, neutral, safe, and professional
- Uses formal language with transition words (furthermore, additionally, moreover, therefore, however, etc.)
- Is well-structured with proper grammar
- ${difficulty >= 3 ? 'Includes additional context and considerations' : 'Is concise but complete'}
- ${difficulty >= 4 ? 'Provides multiple perspectives or approaches' : ''}
- Keep it concise and under 200 words
- MUST provide COMPLETE, FULL information - do NOT leave responses incomplete or cut off mid-sentence
- MUST finish all thoughts and sentences completely
- Do NOT end with "..." or incomplete phrases
- Provide a complete, self-contained response that fully addresses the user's request

Write the response as if you are the AI assistant responding directly to the user. Return ONLY the complete, finished response text, nothing else.`;

  const messages: ChatMessage[] = [
    { 
      role: 'system', 
      content: 'You are a professional AI assistant. You output ONLY the final, complete response text that you would give to a user. You NEVER include thinking, reasoning, explanations, or any meta-commentary. You NEVER write phrases like "Let me start", "First", "I should", "I need to", "The user might", etc. You ALWAYS provide complete, finished responses - never incomplete or cut-off information. CRITICAL: Every response MUST end with a complete sentence and proper punctuation (. ! or ?). NEVER end with incomplete quotes, trailing backslashes, or mid-sentence. You ONLY output the actual, complete response text.' 
    },
    { role: 'user', content: prompt }
  ];

  let lastError: Error | null = null;
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const response = await callAI(messages, 0.7, 500);
      let cleaned = response.trim();
      
      if (!cleaned || cleaned.length < 20) {
        throw new Error('AI returned too short response');
      }
      
      // Check if response is incomplete (ends with incomplete quote, incomplete sentence, etc.)
      const isIncomplete = cleaned.endsWith('\\') || 
                          (cleaned.match(/"/g) || []).length % 2 !== 0 ||
                          cleaned.endsWith(',') ||
                          (cleaned.length > 50 && !cleaned.match(/[.!?]$/) && !cleaned.endsWith('"'));
      
      if (isIncomplete && attempt < 2) {
        console.warn(`Response appears incomplete (attempt ${attempt + 1}), retrying...`);
        await new Promise(resolve => setTimeout(resolve, 500));
        continue;
      }
      
      // Remove any thinking/reasoning patterns from the response
    cleaned = cleaned.replace(/^okay,?\s*/i, '');
    cleaned = cleaned.replace(/^let me\s+/i, '');
    cleaned = cleaned.replace(/^let me start\s+/i, '');
    cleaned = cleaned.replace(/^let me start by\s+/i, '');
    cleaned = cleaned.replace(/^first,?\s*/i, '');
    cleaned = cleaned.replace(/^first of all,?\s*/i, '');
    cleaned = cleaned.replace(/^i should\s+/i, '');
    cleaned = cleaned.replace(/^i need to\s+/i, '');
    cleaned = cleaned.replace(/^i need to consider\s+/i, '');
    cleaned = cleaned.replace(/^the user might\s+/i, '');
    cleaned = cleaned.replace(/^maybe\s+/i, '');
    cleaned = cleaned.replace(/^the key points?\s+/i, '');
    
    // Remove sentences that contain reasoning patterns
    const sentences = cleaned.split(/[.!?]\s+/);
    const filteredSentences = sentences.filter(sentence => {
      const lower = sentence.toLowerCase();
      return !lower.includes('let me start') &&
             !lower.includes('first, i should') &&
             !lower.includes('i need to consider') &&
             !lower.includes('the user might want') &&
             !lower.includes('the key points') &&
             !lower.includes('maybe start with') &&
             !lower.includes('i should consider') &&
             !lower.includes('using transition words as specified') &&
             !lower.includes('i need to make sure') &&
             !lower.startsWith('they want') &&
             !lower.startsWith('the user wants');
    });
    
    cleaned = filteredSentences.join('. ').trim();
    
    // If we removed too much, fall back to original but remove first sentence if it's reasoning
    if (cleaned.length < 50 && sentences.length > 1) {
      const firstSentence = sentences[0].toLowerCase();
      const isReasoning = firstSentence.includes('let me') ||
                         firstSentence.includes('first') ||
                         firstSentence.includes('i should') ||
                         firstSentence.includes('i need to') ||
                         firstSentence.includes('the user') ||
                         firstSentence.includes('they want');
      
      if (isReasoning) {
        cleaned = sentences.slice(1).join('. ').trim();
      } else {
        cleaned = response.trim();
      }
    }
    
    // Truncate if still too long (max ~250 words or ~1500 characters)
    // But ensure we end at a complete sentence, not mid-sentence
    if (cleaned.length > 1500) {
      const truncated = cleaned.substring(0, 1500);
      // Find the last complete sentence (ending with . ! or ?)
      const lastSentenceEnd = Math.max(
        truncated.lastIndexOf('.'),
        truncated.lastIndexOf('!'),
        truncated.lastIndexOf('?')
      );
      
      if (lastSentenceEnd > 100) {
        // If we found a sentence end, use it
        cleaned = truncated.substring(0, lastSentenceEnd + 1).trim();
      } else {
        // If no sentence end found, find the last complete word
        const lastSpace = truncated.lastIndexOf(' ');
        if (lastSpace > 100) {
          cleaned = truncated.substring(0, lastSpace).trim();
        } else {
          cleaned = truncated.trim();
        }
      }
      
      // Remove any trailing ellipsis or incomplete indicators
      cleaned = cleaned.replace(/\.\.\.\s*$/, '');
      cleaned = cleaned.replace(/\s+$/, '');
    }
    
      // Ensure response ends properly (not with ellipsis or incomplete phrases)
      if (cleaned.endsWith('...') || cleaned.endsWith('..')) {
        // Try to find a better ending point
        const lastCompleteSentence = cleaned.lastIndexOf('.');
        if (lastCompleteSentence > cleaned.length * 0.7) {
          cleaned = cleaned.substring(0, lastCompleteSentence + 1);
        } else {
          // Remove the ellipsis and ensure it ends with proper punctuation
          cleaned = cleaned.replace(/\.\.\.?\s*$/, '');
          if (!cleaned.match(/[.!?]$/)) {
            cleaned += '.';
          }
        }
      }
      
      // Final validation: ensure response ends with proper punctuation
      if (!cleaned.match(/[.!?]$/)) {
        cleaned += '.';
      }
      
      // Remove any trailing incomplete quotes
      if ((cleaned.match(/"/g) || []).length % 2 !== 0) {
        const lastQuote = cleaned.lastIndexOf('"');
        if (lastQuote > cleaned.length - 10) {
          cleaned = cleaned.substring(0, lastQuote);
        }
      }
      
      // Final check: if response still seems incomplete, throw error to retry
      if (cleaned.endsWith('\\') || cleaned.endsWith(',')) {
        throw new Error('Response appears incomplete');
      }
      
      return cleaned;
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      console.warn(`AI response generation attempt ${attempt + 1} failed:`, lastError.message);
      if (attempt < 2) {
        await new Promise(resolve => setTimeout(resolve, 500));
        continue;
      }
    }
  }
  
  // If all attempts failed, throw the last error
  throw lastError || new Error('Failed to generate complete AI response after 3 attempts');
}

function calculateTopicRelevance(userAnswer: string, question: string): number {
  const userLower = userAnswer.toLowerCase();
  const questionLower = question.toLowerCase();
  
  // Extract key words from question (remove common words)
  const commonWords = ['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'is', 'are', 'was', 'were', 'what', 'how', 'why', 'when', 'where', 'can', 'could', 'should', 'would', 'help', 'me', 'you'];
  const questionWords = questionLower.split(/\s+/).filter(w => w.length > 3 && !commonWords.includes(w));
  
  // Count how many question keywords appear in the answer
  let matches = 0;
  questionWords.forEach(word => {
    if (userLower.includes(word)) {
      matches++;
    }
  });
  
  // Calculate relevance score (0-200)
  const relevanceRatio = questionWords.length > 0 ? matches / questionWords.length : 0;
  return Math.round(relevanceRatio * 200);
}

function generateIntelligentFallback(userAnswer: string, aiResponse: string, question: string): {
  totalScore: number;
  metrics: {
    formalness: { score: number; max: number; details: string };
    aiLikeness: { score: number; max: number; details: string };
    grammar: { score: number; max: number; details: string };
    structure: { score: number; max: number; details: string };
    vocabulary: { score: number; max: number; details: string };
    topicRelevance: { score: number; max: number; details: string };
  };
} {
  const formalWords = ['furthermore', 'additionally', 'moreover', 'therefore', 'however', 'comprehensive', 'systematic', 'consequently', 'nevertheless'];
  const userLower = userAnswer.toLowerCase();
  const formalCount = formalWords.filter(word => userLower.includes(word)).length;
  const formalScore = Math.round(Math.min(200, formalCount * 30 + (userAnswer.length > 100 ? 50 : 20)));
  
  const aiLength = aiResponse.length;
  const userLength = userAnswer.length;
  const lengthRatio = Math.min(1, userLength / Math.max(aiLength, 1));
  const lengthScore = Math.round(Math.max(0, lengthRatio * 300));
  
  const wordCount = userAnswer.split(/\s+/).filter(w => w.length > 0).length;
  const hasCapitalization = /[A-Z]/.test(userAnswer);
  const hasPunctuation = /[.!?]$/.test(userAnswer.trim());
  
  // Penalize grammar for very short or non-serious answers
  let grammarBaseScore = hasCapitalization && hasPunctuation ? 150 : (hasCapitalization || hasPunctuation ? 120 : 80);
  if (wordCount <= 3) {
    // Very short answers get heavily penalized for grammar
    grammarBaseScore = Math.round(grammarBaseScore * 0.3);
  } else if (wordCount <= 5) {
    // Short answers get moderately penalized
    grammarBaseScore = Math.round(grammarBaseScore * 0.6);
  }
  const grammarScore = Math.round(grammarBaseScore);
  
  const sentenceCount = Math.max(1, userAnswer.split(/[.!?]+/).filter(s => s.trim().length > 0).length);
  const structureScore = Math.round(Math.min(150, sentenceCount * 25));
  const vocabScore = Math.round(Math.min(150, (wordCount > 10 ? 100 : 50) + (formalCount * 20) + (wordCount > 20 ? 30 : 0)));
  
  const topicRelevanceScore = calculateTopicRelevance(userAnswer, question);
  const topicRelevanceRatio = topicRelevanceScore / 200;
  
  // If topic relevance is low, penalize other metrics
  let adjustedFormalScore = formalScore;
  let adjustedAiLikenessScore = lengthScore;
  let adjustedGrammarScore = grammarScore;
  let adjustedStructureScore = structureScore;
  let adjustedVocabScore = vocabScore;
  
  if (topicRelevanceRatio < 0.5) {
    // Heavy penalty if relevance is very low (< 50%)
    const penalty = topicRelevanceRatio;
    adjustedFormalScore = Math.round(formalScore * penalty);
    adjustedAiLikenessScore = Math.round(lengthScore * penalty);
    adjustedGrammarScore = Math.round(grammarScore * penalty);
    adjustedStructureScore = Math.round(structureScore * penalty);
    adjustedVocabScore = Math.round(vocabScore * penalty);
  } else if (topicRelevanceRatio < 0.7) {
    // Moderate penalty if relevance is low (50-70%)
    const penalty = 0.5 + (topicRelevanceRatio - 0.5) * 1.0;
    adjustedFormalScore = Math.round(formalScore * penalty);
    adjustedAiLikenessScore = Math.round(lengthScore * penalty);
    adjustedGrammarScore = Math.round(grammarScore * penalty);
    adjustedStructureScore = Math.round(structureScore * penalty);
    adjustedVocabScore = Math.round(vocabScore * penalty);
  }
  
  const totalScore = Math.round(Math.min(1200, adjustedFormalScore + adjustedAiLikenessScore + adjustedGrammarScore + adjustedStructureScore + adjustedVocabScore + topicRelevanceScore));
  
  return {
    totalScore,
    metrics: {
      formalness: {
        score: Math.max(0, Math.min(200, adjustedFormalScore)),
        max: 200,
        details: formalCount > 0 
          ? `Good use of ${formalCount} formal transition word${formalCount > 1 ? 's' : ''} (${formalWords.filter(w => userLower.includes(w)).join(', ')}) - this demonstrates AI-like formal language that helps structure arguments professionally.`
          : `The answer lacks formal transition words like "furthermore", "therefore", or "however" which are characteristic of AI responses. AI typically uses these words to connect ideas and create a more structured, professional tone.`
      },
      aiLikeness: {
        score: Math.max(0, Math.min(300, adjustedAiLikenessScore)),
        max: 300,
        details: lengthRatio > 0.7 
          ? `Answer length (${userLength} chars) closely matches the AI example (${aiLength} chars), which is good because AI responses tend to be comprehensive and detailed rather than brief.`
          : `Answer is too short (${userLength} chars vs ${aiLength} chars) - AI responses are typically more detailed and comprehensive. The significant length difference suggests a more casual, human-like response rather than the thorough, structured format AI typically provides.`
      },
      grammar: {
        score: Math.max(0, Math.min(200, adjustedGrammarScore)),
        max: 200,
        details: wordCount <= 3 
          ? `Very short answer (${wordCount} words) doesn't demonstrate proper writing structure - AI responses are typically well-formed with proper capitalization and punctuation, which this answer lacks.`
          : wordCount <= 5
          ? `Short answer (${wordCount} words) with ${hasCapitalization && hasPunctuation ? 'proper' : hasCapitalization ? 'some' : hasPunctuation ? 'some' : 'missing'} grammar basics. AI responses are typically longer and more polished, so the brevity reduces the grammar score.`
          : hasCapitalization && hasPunctuation 
          ? 'Proper capitalization and sentence-ending punctuation demonstrate good writing fundamentals that AI responses typically exhibit.'
          : hasCapitalization 
          ? 'Has capitalization but missing sentence-ending punctuation - AI responses are typically well-formatted with complete sentences ending in proper punctuation.'
          : hasPunctuation 
          ? 'Has punctuation but missing capitalization - AI responses typically start sentences with capital letters, showing attention to proper formatting.'
          : 'Missing capitalization and sentence-ending punctuation - AI responses are typically well-formatted with proper grammar, which this answer lacks.'
      },
      structure: {
        score: Math.max(0, Math.min(150, adjustedStructureScore)),
        max: 150,
        details: sentenceCount === 1 && wordCount <= 5
          ? `Single sentence with only ${wordCount} word${wordCount !== 1 ? 's' : ''} - too simple. AI responses typically have multiple sentences with logical flow and progression, creating a more structured and comprehensive answer.`
          : sentenceCount === 1
          ? `Only ${sentenceCount} sentence with ${wordCount} words - AI responses typically use multiple sentences to organize thoughts, provide context, and create better flow. More sentences would improve structure.`
          : sentenceCount <= 2
          ? `${sentenceCount} sentence${sentenceCount !== 1 ? 's' : ''} with ${wordCount} words shows basic structure, but AI responses typically have more sentences to better organize ideas and provide comprehensive coverage of the topic.`
          : `${sentenceCount} sentence${sentenceCount !== 1 ? 's' : ''} with ${wordCount} words demonstrates good structure with logical organization and flow, similar to how AI responses are typically structured.`
      },
      vocabulary: {
        score: Math.max(0, Math.min(150, adjustedVocabScore)),
        max: 150,
        details: wordCount <= 5
          ? `Only ${wordCount} word${wordCount !== 1 ? 's' : ''} - too limited. AI responses typically use varied, sophisticated vocabulary to express ideas clearly and professionally. More diverse word choice would improve this score.`
          : wordCount <= 10
          ? `${wordCount} words shows basic vocabulary range, but AI responses typically use more varied and sophisticated word choices to convey ideas more precisely and professionally.`
          : wordCount <= 20
          ? `${wordCount} words demonstrates moderate vocabulary range with some variety, which is closer to AI responses that use diverse word choices to express ideas clearly.`
          : `${wordCount} words shows varied vocabulary with good word choice diversity, similar to how AI responses typically use sophisticated and precise language to communicate effectively.`
      },
      topicRelevance: {
        score: Math.max(0, Math.min(200, topicRelevanceScore)),
        max: 200,
        details: topicRelevanceRatio >= 0.7 
          ? `Answer is highly relevant to the topic - it addresses the question directly and includes key concepts from the question, which is essential for a good response.`
          : topicRelevanceRatio >= 0.5
          ? `Answer has moderate relevance to the topic - it touches on some aspects of the question but could be more directly related. Better topic relevance would improve the overall score.`
          : `Answer has low relevance to the topic - it doesn't directly address the question or include key concepts. This significantly reduces other scores because an off-topic answer cannot be considered good, regardless of grammar or structure.`
      }
    }
  };
}

export async function analyzeAnswerForAI(
  userAnswer: string,
  aiResponse: string,
  question: string
): Promise<{
  totalScore: number;
  metrics: {
    formalness: { score: number; max: number; details: string };
    aiLikeness: { score: number; max: number; details: string };
    grammar: { score: number; max: number; details: string };
    structure: { score: number; max: number; details: string };
    vocabulary: { score: number; max: number; details: string };
    topicRelevance: { score: number; max: number; details: string };
  };
}> {
  try {
    const aiResponseShort = aiResponse.length > 120 ? aiResponse.substring(0, 120) + '...' : aiResponse;
    const userAnswerShort = userAnswer.length > 120 ? userAnswer.substring(0, 120) + '...' : userAnswer;
    const questionShort = question.length > 100 ? question.substring(0, 100) + '...' : question;
  
  const prompt = `Analyze how AI-like this answer is.

Question: "${questionShort}"
AI Example: "${aiResponseShort}"
User Answer: "${userAnswerShort}"

Score each metric (0-max):
- TOPIC RELEVANCE (0-200): How well does the user answer relate to and address the question? Check if key concepts, keywords, and main topics from the question appear in the answer. Low relevance should heavily penalize other scores.
- FORMALNESS (0-200): Count formal words like "furthermore", "additionally", "moreover", "therefore", "however", "comprehensive", "systematic"
- AI LIKENESS (0-300): Compare structure, length, tone similarity to AI example
- GRAMMAR (0-200): Check capitalization, punctuation, spelling correctness
- STRUCTURE (0-150): Analyze organization, sentence flow, logical progression
- VOCABULARY (0-150): Evaluate word choice sophistication and precision

IMPORTANT: For "details", provide 1-2 sentences explaining WHY the score is what it is. Explain what's missing, what's good, or what could be improved. Be specific and educational.

Output ONLY valid JSON (no other text):
{"totalScore":<sum of all scores>,"topicRelevance":{"score":<0-200>,"details":"<1-2 sentences explaining why>"},"formalness":{"score":<0-200>,"details":"<1-2 sentences explaining why>"},"aiLikeness":{"score":<0-300>,"details":"<1-2 sentences explaining why>"},"grammar":{"score":<0-200>,"details":"<1-2 sentences explaining why>"},"structure":{"score":<0-150>,"details":"<1-2 sentences explaining why>"},"vocabulary":{"score":<0-150>,"details":"<1-2 sentences explaining why>"}}`;

  const messages: ChatMessage[] = [
    { 
      role: 'system', 
      content: 'You are a JSON analysis API. You MUST output ONLY valid JSON. NO explanations, NO reasoning, NO text before or after. Start with { and end with }. Be specific in details - mention exact words/phrases from the user answer.' 
    },
    { role: 'user', content: prompt }
  ];

  let lastError: Error | null = null;
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const response = await callAI(messages, 0.1, 350);
    
    let cleaned = response.trim();
    
    // Remove any markdown code blocks
    cleaned = cleaned.replace(/```json\n?/gi, '').replace(/```\n?/g, '').trim();
    
    // Remove any text before the first {
    const firstBrace = cleaned.indexOf('{');
    if (firstBrace > 0) {
      cleaned = cleaned.substring(firstBrace);
    }
    
    // Remove any text after the last }
    const lastBrace = cleaned.lastIndexOf('}');
    if (lastBrace >= 0 && lastBrace < cleaned.length - 1) {
      cleaned = cleaned.substring(0, lastBrace + 1);
    }
    
    // Try to extract JSON using regex as fallback
    if (!cleaned.startsWith('{')) {
      const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        cleaned = jsonMatch[0];
      }
    }
    
    let parsed;
    try {
      parsed = JSON.parse(cleaned);
    } catch (parseError) {
      // Last resort: try to find any JSON-like structure in the response
      const allJsonMatches = response.match(/\{[^{}]*(?:\{[^{}]*\}[^{}]*)*\}/g);
      if (allJsonMatches && allJsonMatches.length > 0) {
        for (const match of allJsonMatches) {
          try {
            parsed = JSON.parse(match);
            if (parsed && typeof parsed.totalScore === 'number') {
              break;
            }
          } catch (e) {
            continue;
          }
        }
      }
      
      // If still no valid JSON, break to use fallback
      if (!parsed || typeof parsed.totalScore !== 'number') {
        throw new Error('Failed to parse JSON from response');
      }
    }

      if (typeof parsed.totalScore !== 'number' ||
          typeof parsed.topicRelevance?.score !== 'number' ||
          typeof parsed.formalness?.score !== 'number' ||
          typeof parsed.aiLikeness?.score !== 'number' ||
          typeof parsed.grammar?.score !== 'number' ||
          typeof parsed.structure?.score !== 'number' ||
          typeof parsed.vocabulary?.score !== 'number') {
        throw new Error('Invalid response format - missing or invalid scores');
      }
      
      // Ensure details are meaningful
      if (!parsed.formalness.details || parsed.formalness.details === 'Analysis unavailable') {
        throw new Error('Invalid details in response');
      }

      const wordCount = userAnswer.split(/\s+/).filter(w => w.length > 0).length;
      const topicRelevanceScore = Math.max(0, Math.min(200, Math.round(parsed.topicRelevance.score)));
      const topicRelevanceRatio = topicRelevanceScore / 200;
      
      let formalScore = Math.max(0, Math.min(200, Math.round(parsed.formalness.score)));
      let aiLikenessScore = Math.max(0, Math.min(300, Math.round(parsed.aiLikeness.score)));
      let grammarScore = Math.max(0, Math.min(200, Math.round(parsed.grammar.score)));
      
      // Penalize grammar for very short answers
      if (wordCount <= 3) {
        grammarScore = Math.round(grammarScore * 0.3);
      } else if (wordCount <= 5) {
        grammarScore = Math.round(grammarScore * 0.6);
      }
      
      let structureScore = Math.max(0, Math.min(150, Math.round(parsed.structure.score)));
      let vocabScore = Math.max(0, Math.min(150, Math.round(parsed.vocabulary.score)));
      
      // Apply topic relevance penalty to other metrics if relevance is low
      if (topicRelevanceRatio < 0.5) {
        // Heavy penalty if relevance is very low (< 50%)
        const penalty = topicRelevanceRatio;
        formalScore = Math.round(formalScore * penalty);
        aiLikenessScore = Math.round(aiLikenessScore * penalty);
        grammarScore = Math.round(grammarScore * penalty);
        structureScore = Math.round(structureScore * penalty);
        vocabScore = Math.round(vocabScore * penalty);
      } else if (topicRelevanceRatio < 0.7) {
        // Moderate penalty if relevance is low (50-70%)
        const penalty = 0.5 + (topicRelevanceRatio - 0.5) * 1.0;
        formalScore = Math.round(formalScore * penalty);
        aiLikenessScore = Math.round(aiLikenessScore * penalty);
        grammarScore = Math.round(grammarScore * penalty);
        structureScore = Math.round(structureScore * penalty);
        vocabScore = Math.round(vocabScore * penalty);
      }
      
      const totalScore = Math.max(0, Math.min(1200, formalScore + aiLikenessScore + grammarScore + structureScore + vocabScore + topicRelevanceScore));
      
      return {
        totalScore,
        metrics: {
          formalness: {
            score: formalScore,
            max: 200,
            details: parsed.formalness.details || 'Formal language analysis'
          },
          aiLikeness: {
            score: aiLikenessScore,
            max: 300,
            details: parsed.aiLikeness.details || 'AI similarity analysis'
          },
          grammar: {
            score: grammarScore,
            max: 200,
            details: parsed.grammar.details || 'Grammar analysis'
          },
          structure: {
            score: structureScore,
            max: 150,
            details: parsed.structure.details || 'Structure analysis'
          },
          vocabulary: {
            score: vocabScore,
            max: 150,
            details: parsed.vocabulary.details || 'Vocabulary analysis'
          },
          topicRelevance: {
            score: topicRelevanceScore,
            max: 200,
            details: parsed.topicRelevance.details || 'Topic relevance analysis'
          }
        }
      };
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      console.warn(`Analysis attempt ${attempt + 1} failed:`, lastError.message);
      if (attempt === 0) {
        await new Promise(resolve => setTimeout(resolve, 500));
        continue;
      }
    }
  }
  
    // Final fallback: generate intelligent analysis based on inputs
    console.warn('All analysis attempts failed, using intelligent fallback analysis');
    return generateIntelligentFallback(userAnswer, aiResponse, question);
  } catch (error) {
    console.error('Unexpected error in analyzeAnswerForAI:', error);
    return generateIntelligentFallback(userAnswer, aiResponse, question);
  }
}
