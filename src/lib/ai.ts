import { supabase, EDGE_FUNCTION_BASE } from './supabase';
import type { Field, CropAssessment, WeatherData, WeatherForecast } from '../types';

export interface CropAssessmentInput {
  imageDataUrl?: string | null;
  symptomsDescription?: string;
  observations?: string;
  field?: Field | null;
  weather?: WeatherData | null;
  forecast?: WeatherForecast[] | null;
  previousAssessment?: CropAssessment | null;
  recentAssessments?: CropAssessment[];
  language?: string;
}

export interface CropAssessmentResult {
  possible_issue: string;
  assessment_confidence: string;
  observed_indicators: string[];
  context_factors: string[];
  evidence_used: string[];
  missing_evidence: string[];
  severity: string;
  assessment_explanation: string;
  what_to_check: string[];
  what_to_consider: string[];
  environmental_considerations: string;
  escalation_guidance: string;
  recommendations: {
    option: string;
    why: string;
    what_to_check?: string[];
    conditions_to_consider?: string[];
  }[];
}

export interface ConversationContext {
  field?: Field | null;
  weather?: WeatherData | null;
  recentAssessments?: CropAssessment[];
  profileName?: string | null;
  cropsGrown?: string[];
  language?: string;
}

export class AIError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AIError';
  }
}

async function callEdgeFunction<T>(name: string, body: unknown): Promise<T> {
  const { data: { session } } = await supabase.auth.getSession();
  const response = await fetch(`${EDGE_FUNCTION_BASE}/${name}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${session?.access_token ?? ''}`,
      apikey: import.meta.env.VITE_SUPABASE_ANON_KEY || '',
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new AIError(errorData?.error ?? 'Neraya couldn\'t complete the request right now. Please try again.');
  }

  return response.json() as Promise<T>;
}

export async function sendChatMessage(
  message: string,
  history: { role: string; content: string }[],
  context: ConversationContext
): Promise<string> {
  try {
    const data = await callEdgeFunction<{ content: string } | { error: string }>('ai-chat', {
      message,
      history,
      context: {
        field: context.field ? {
          name: context.field.name,
          crop_type: context.field.crop_type,
          growth_stage: context.field.growth_stage,
          location_text: context.field.location_text,
          notes: context.field.notes,
        } : null,
        weather: context.weather ? {
          temperature: context.weather.temperature,
          humidity: context.weather.humidity,
          wind_speed: context.weather.wind_speed,
          weather_description: context.weather.weather_description,
        } : null,
        recentAssessments: context.recentAssessments?.map(a => ({
          possible_issue: a.possible_issue,
          severity: a.severity,
          assessment_confidence: a.assessment_confidence,
          created_at: a.created_at,
        })),
        profileName: context.profileName,
        cropsGrown: context.cropsGrown,
        language: context.language ?? 'en',
      },
    });

    if ('error' in data) {
      return "I'm having trouble connecting right now. Let's try again in a moment. In the meantime, could you tell me a bit more about what you're seeing in your field?";
    }

    return data.content;
  } catch {
    return "I'm having trouble connecting right now. Let's try again in a moment. In the meantime, could you tell me a bit more about what you're seeing in your field?";
  }
}

export async function analyzeCrop(input: CropAssessmentInput): Promise<CropAssessmentResult> {
  try {
    const data = await callEdgeFunction<CropAssessmentResult | { error: string }>('ai-analyze', {
      imageDataUrl: input.imageDataUrl,
      symptomsDescription: input.symptomsDescription,
      observations: input.observations,
      field: input.field ? {
        name: input.field.name,
        crop_type: input.field.crop_type,
        crop_variety: input.field.crop_variety,
        growth_stage: input.field.growth_stage,
        location_text: input.field.location_text,
        notes: input.field.notes,
        planting_date: input.field.planting_date,
      } : null,
      weather: input.weather ? {
        temperature: input.weather.temperature,
        humidity: input.weather.humidity,
        wind_speed: input.weather.wind_speed,
        weather_description: input.weather.weather_description,
      } : null,
      forecast: input.forecast?.map(f => ({
        date: f.date,
        temp_max: f.temp_max,
        temp_min: f.temp_min,
        precipitation_probability: f.precipitation_probability,
        weather_description: f.weather_description,
      })) ?? null,
      previousAssessment: input.previousAssessment ? {
        possible_issue: input.previousAssessment.possible_issue,
        severity: input.previousAssessment.severity,
        assessment_confidence: input.previousAssessment.assessment_confidence,
        observed_indicators: input.previousAssessment.observed_indicators,
        created_at: input.previousAssessment.created_at,
      } : null,
      language: input.language ?? 'en',
    });

    if ('error' in data) {
      throw new AIError(data.error);
    }

    return validateAssessmentResult(data as unknown as Record<string, unknown>);
  } catch (err) {
    if (err instanceof AIError) throw err;
    throw new AIError('Neraya couldn\'t complete the assessment right now. Your image has not been lost. Please try again.');
  }
}

function validateAssessmentResult(raw: Record<string, unknown>): CropAssessmentResult {
  const str = (v: unknown, fallback: string): string =>
    typeof v === 'string' && v.trim() ? v.trim() : fallback;
  const strArr = (v: unknown): string[] =>
    Array.isArray(v) ? v.filter((x): x is string => typeof x === 'string' && x.trim() !== '') : [];
  const conf = (v: unknown): string => {
    const valid = ['Low', 'Moderate', 'High', 'Unknown'];
    return typeof v === 'string' && valid.includes(v) ? v : 'Unknown';
  };

  return {
    possible_issue: str(raw.possible_issue, 'Unknown'),
    assessment_confidence: conf(raw.assessment_confidence),
    observed_indicators: strArr(raw.observed_indicators),
    context_factors: strArr(raw.context_factors),
    evidence_used: strArr(raw.evidence_used),
    missing_evidence: strArr(raw.missing_evidence),
    severity: conf(raw.severity),
    assessment_explanation: str(raw.assessment_explanation, ''),
    what_to_check: strArr(raw.what_to_check),
    what_to_consider: strArr(raw.what_to_consider),
    environmental_considerations: str(raw.environmental_considerations, ''),
    escalation_guidance: str(raw.escalation_guidance, ''),
    recommendations: Array.isArray(raw.recommendations)
      ? raw.recommendations
          .filter((r): r is Record<string, unknown> => typeof r === 'object' && r !== null)
          .map(r => ({
            option: str(r.option, 'Unknown'),
            why: str(r.why, ''),
            ...(Array.isArray(r.what_to_check) ? { what_to_check: strArr(r.what_to_check) } : {}),
            ...(Array.isArray(r.conditions_to_consider) ? { conditions_to_consider: strArr(r.conditions_to_consider) } : {}),
          }))
      : [],
  };
}

export async function uploadImage(file: File, userId: string): Promise<{ url: string; path: string } | null> {
  try {
    const ext = file.name.split('.').pop() ?? 'jpg';
    const path = `${userId}/${Date.now()}.${ext}`;
    const { error } = await supabase.storage
      .from('crop-images')
      .upload(path, file);

    if (error) return null;

    const { data: { publicUrl } } = supabase.storage
      .from('crop-images')
      .getPublicUrl(path);

    return { url: publicUrl, path };
  } catch {
    return null;
  }
}
