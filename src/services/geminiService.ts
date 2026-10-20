import { GoogleGenAI, Type } from '@google/genai';
import { getGeminiApiKey } from './settingsService';

export class MissingApiKeyError extends Error {
  constructor() {
    super('No Gemini API key set. Add your free key in Settings to use the AI planner.');
  }
}

async function getClient() {
  const key = await getGeminiApiKey();
  if (!key) throw new MissingApiKeyError();
  return new GoogleGenAI({ apiKey: key });
}

const MODEL = 'gemini-2.5-flash';

export const generateDailyPlan = async (
  userProfile: any,
  context: { calendarEvents?: any[]; weeklyHabits?: any[]; monthlyGoals?: any[]; longTermPlans?: any[] }
) => {
  const ai = await getClient();
  const prompt = `
    You are a calm, practical daily planning assistant inside a personal productivity app called myday2.
    User Profile: ${JSON.stringify(userProfile)}
    Today's calendar events: ${JSON.stringify(context.calendarEvents || [])}
    Active weekly habits: ${JSON.stringify(context.weeklyHabits || [])}
    Active monthly goals: ${JSON.stringify(context.monthlyGoals || [])}
    Active long-term plans: ${JSON.stringify(context.longTermPlans || [])}

    Generate a realistic, non-overloading daily plan for today (max 5 tasks).
    Weave in anything relevant from the habits/goals/plans above so the day
    actually moves them forward. Include a short motivating quote and one
    focus suggestion for the day.
  `;

  const response = await ai.models.generateContent({
    model: MODEL,
    contents: prompt,
    config: {
      responseMimeType: 'application/json',
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          quote: { type: Type.STRING },
          tasks: { type: Type.ARRAY, items: { type: Type.STRING } },
          focusSuggestion: { type: Type.STRING },
        },
        required: ['quote', 'tasks', 'focusSuggestion'],
      },
    },
  });

  return JSON.parse(response.text || '{}');
};

export const generateNightSummary = async (dailyLog: any, focusLogs: any[]) => {
  const ai = await getClient();
  const prompt = `
    Daily Log: ${JSON.stringify(dailyLog)}
    Focus Logs: ${JSON.stringify(focusLogs)}

    Summarize the user's day based on their logs in a warm, honest, growth-oriented
    tone. Provide a brief reflection and one concrete tip for tomorrow.
  `;

  const response = await ai.models.generateContent({
    model: MODEL,
    contents: prompt,
    config: {
      responseMimeType: 'application/json',
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          summary: { type: Type.STRING },
          reflection: { type: Type.STRING },
          tipForTomorrow: { type: Type.STRING },
        },
        required: ['summary', 'reflection', 'tipForTomorrow'],
      },
    },
  });

  return JSON.parse(response.text || '{}');
};

export const generateWeeklyReport = async (logs: any[]) => {
  const ai = await getClient();
  const prompt = `
    Logs for the week: ${JSON.stringify(logs)}

    Generate a weekly report finding real patterns in the user's behavior,
    consistency, and progress. Be specific and honest, not generic.
  `;

  const response = await ai.models.generateContent({
    model: MODEL,
    contents: prompt,
    config: {
      responseMimeType: 'application/json',
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          patterns: { type: Type.ARRAY, items: { type: Type.STRING } },
          consistencyScore: { type: Type.STRING },
          recommendations: { type: Type.ARRAY, items: { type: Type.STRING } },
        },
        required: ['patterns', 'consistencyScore', 'recommendations'],
      },
    },
  });

  return JSON.parse(response.text || '{}');
};
