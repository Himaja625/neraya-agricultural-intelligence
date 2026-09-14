export interface FarmerProfile {
  id: string;
  user_id: string;
  full_name: string | null;
  preferred_language: string;
  location_text: string | null;
  latitude: number | null;
  longitude: number | null;
  crops_grown: string[];
  farming_experience: string | null;
  farm_size: string | null;
  notification_preferences: {
    weather: boolean;
    crop: boolean;
    community: boolean;
    alerts: boolean;
  };
  onboarding_completed: boolean;
  created_at: string;
  updated_at: string;
}

export interface Field {
  id: string;
  user_id: string;
  name: string;
  crop_type: string | null;
  crop_variety: string | null;
  location_text: string | null;
  latitude: number | null;
  longitude: number | null;
  area_size: string | null;
  planting_date: string | null;
  growth_stage: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface CropAssessment {
  id: string;
  user_id: string;
  field_id: string | null;
  image_url: string | null;
  image_path: string | null;
  symptoms_description: string | null;
  observations: string | null;
  possible_issue: string | null;
  assessment_confidence: string | null;
  observed_indicators: string[];
  context_factors: string[];
  evidence_used: string[];
  missing_evidence: string[];
  severity: string | null;
  assessment_explanation: string | null;
  what_to_check: string[];
  what_to_consider: string[];
  environmental_considerations: string | null;
  escalation_guidance: string | null;
  recommendations: AssessmentRecommendation[];
  is_ai_assessment: boolean;
  created_at: string;
}

export interface AssessmentRecommendation {
  option: string;
  why: string;
  what_to_check?: string[];
  conditions_to_consider?: string[];
}

export interface Conversation {
  id: string;
  user_id: string;
  field_id: string | null;
  title: string | null;
  created_at: string;
  updated_at: string;
}

export interface ConversationMessage {
  id: string;
  conversation_id: string;
  user_id: string;
  role: 'user' | 'assistant';
  content: string;
  metadata: Record<string, unknown>;
  created_at: string;
}

export interface CommunityPost {
  id: string;
  user_id: string;
  title: string;
  content: string;
  crop_tag: string | null;
  region_tag: string | null;
  field_id: string | null;
  image_url: string | null;
  is_question: boolean;
  is_anonymous: boolean;
  recovery_status: 'still_dealing' | 'improving' | 'resolved' | null;
  helpful_count: number;
  comment_count: number;
  created_at: string;
  updated_at: string;
}

export interface CommunityComment {
  id: string;
  post_id: string;
  user_id: string;
  content: string;
  helpful_count: number;
  created_at: string;
}

export interface CommunityReport {
  id: string;
  reporter_id: string;
  post_id: string | null;
  comment_id: string | null;
  reason: 'misinformation' | 'dangerous_advice' | 'spam' | 'harassment' | 'suspicious_activity' | 'other';
  description: string | null;
  status: 'pending' | 'reviewing' | 'resolved' | 'dismissed';
  resolved_by: string | null;
  resolution_note: string | null;
  created_at: string;
  resolved_at: string | null;
}

export interface UserBlock {
  id: string;
  blocker_id: string;
  blocked_id: string;
  created_at: string;
}

export interface Alert {
  id: string;
  user_id: string;
  field_id: string | null;
  type: 'weather' | 'crop' | 'community' | 'reminder' | 'system';
  title: string;
  body: string | null;
  severity: 'info' | 'warning' | 'urgent';
  is_read: boolean;
  metadata: Record<string, unknown>;
  created_at: string;
}

export interface WeatherData {
  temperature: number;
  feels_like: number;
  humidity: number;
  wind_speed: number;
  weather_code: number;
  weather_description: string;
  is_day: boolean;
  fetched_at: string;
}

export interface WeatherForecast {
  date: string;
  temp_max: number;
  temp_min: number;
  precipitation_probability: number;
  weather_code: number;
  weather_description: string;
}

export interface WeatherCacheEntry {
  id: string;
  latitude: number;
  longitude: number;
  weather_data: {
    current: WeatherData;
    forecast: WeatherForecast[];
  };
  fetched_at: string;
}

export type Language = 'en' | 'te' | 'hi' | 'ta' | 'kn' | 'mr';

export const LANGUAGE_LABELS: Record<Language, string> = {
  en: 'English',
  te: 'Telugu',
  hi: 'Hindi',
  ta: 'Tamil',
  kn: 'Kannada',
  mr: 'Marathi',
};

export const GROWTH_STAGES = [
  'Seedling',
  'Vegetative',
  'Flowering',
  'Fruiting',
  'Maturity',
  'Harvest',
] as const;
