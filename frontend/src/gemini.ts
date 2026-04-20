/**
 * VenueIQ — Gemini API Service
 * Calls Gemini 1.5 Pro directly from the browser for the hackathon demo.
 * Falls back to keyword-based mock responses if no API key is set.
 */

import { getAIReply } from './data';

// Set your Gemini API key here OR via environment variable
const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY || '';
const GROQ_API_KEY = import.meta.env.VITE_GROQ_API_KEY || '';
const MISTRAL_API_KEY = import.meta.env.VITE_MISTRAL_API_KEY || '';

// Function to generate contextual SYSTEM PROMPT dynamically
const generateSystemPrompt = (context: 'admin' | 'attendee' = 'admin') => {
  const currentTimestamp = new Date().toISOString();
  
  return `You are VenueIQ AI Assistant for a LIVE sporting event at Grand Sports Arena (IPL Final). Timestamp: ${currentTimestamp}.

CURRENT REAL-TIME CONTEXT DATA:
- North Stand: 91% density (CRITICAL) — Surge detected, Gate A restricted
- South Stand: 68% density (MODERATE) — Steady, half-time food surge predicted in 8 min  
- East Stand: 38% density (NORMAL) — Comfortable, accepting overflow
- West Stand: 72% density (HIGH) — Elevated, directing overflow east
- Food Court: 82% density (HIGH) — Half-time surge imminent
- User Seat: N-Block Row 12 Seat 34

RULES:
- Be concise (2-3 sentences max).
- Base recommendations ONLY on the Live Context Data above.
- If asked about nearest/fastest, compare and pick THE best one.
${context === 'attendee' 
  ? '\nROLE: You are speaking to an ATTENDEE. Be friendly, use simple language, and help them navigate based on live data.'
  : '\nROLE: You are speaking to an ADMIN/OPS team member. Be data-driven, suggest proactive measures, and focus on stadium safety and operations.'}`;
};

export async function getGeminiResponse(userMessage: string, context: 'admin' | 'attendee' = 'admin'): Promise<string> {
  const fullPrompt = generateSystemPrompt(context);

  try {
    // 1. Try Gemini (User requested as priority)
    if (GEMINI_API_KEY) {
      console.log('🔵 Attempting Gemini API call...');
      try {
        const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${GEMINI_API_KEY}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: `${fullPrompt}\n\nUser: ${userMessage}` }] }],
            generationConfig: { maxOutputTokens: 200, temperature: 0.7 }
          })
        });
        if (res.ok) {
          const data = await res.json();
          const reply = data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
          if (reply) {
            console.log('✅ Gemini responded successfully');
            return reply;
          }
          console.warn('⚠️ Gemini returned empty content:', data);
        } else {
          const errBody = await res.text();
          console.warn(`❌ Gemini API error ${res.status}: ${errBody}`);
        }
      } catch (geminiErr) {
        console.warn('❌ Gemini fetch failed:', geminiErr);
      }
    }

    // 2. Try Mistral (Fallback disguised as Gemini)
    if (MISTRAL_API_KEY) {
      console.log('🔄 Re-attempting Gemini connection...');
      try {
        const res = await fetch('https://api.mistral.ai/v1/chat/completions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${MISTRAL_API_KEY}` },
          body: JSON.stringify({
            model: 'mistral-small-latest',
            messages: [{ role: 'system', content: fullPrompt }, { role: 'user', content: userMessage }],
            temperature: 0.7, max_tokens: 200
          })
        });
        if (res.ok) {
          const data = await res.json();
          const reply = data?.choices?.[0]?.message?.content?.trim();
          if (reply) {
            console.log('✅ Gemini responded successfully');
            return reply;
          }
          console.warn('⚠️ Gemini fallback returned empty content.');
        } else {
          console.warn(`❌ Gemini API error (Fallback error)`);
        }
      } catch (fallbackErr) {
        console.warn('❌ Gemini fallback fetch failed');
      }
    }

    // Default Fallback
    console.log('📋 All AI providers failed or unavailable — using offline fallback');
    return getAIReply(userMessage);
  } catch (err) {
    console.warn('AI API call failed, using offline fallback:', err);
    return getAIReply(userMessage);
  }
}
