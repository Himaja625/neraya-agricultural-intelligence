import { supabase, EDGE_FUNCTION_BASE } from './supabase';
import type { WeatherData, WeatherForecast } from '../types';

const WEATHER_CODES: Record<number, string> = {
  0: 'Clear sky',
  1: 'Mainly clear',
  2: 'Partly cloudy',
  3: 'Overcast',
  45: 'Foggy',
  48: 'Depositing rime fog',
  51: 'Light drizzle',
  53: 'Moderate drizzle',
  55: 'Dense drizzle',
  61: 'Slight rain',
  63: 'Moderate rain',
  65: 'Heavy rain',
  66: 'Freezing light rain',
  67: 'Freezing rain',
  71: 'Slight snow',
  73: 'Moderate snow',
  75: 'Heavy snow',
  77: 'Snow grains',
  80: 'Slight rain showers',
  81: 'Moderate rain showers',
  82: 'Violent rain showers',
  85: 'Slight snow showers',
  86: 'Heavy snow showers',
  95: 'Thunderstorm',
  96: 'Thunderstorm with slight hail',
  99: 'Thunderstorm with heavy hail',
};

export function describeWeatherCode(code: number): string {
  return WEATHER_CODES[code] ?? 'Unknown conditions';
}

export function describeHumidity(humidity: number): string {
  if (humidity >= 80) return 'Humidity is high, which can favor fungal problems.';
  if (humidity >= 60) return 'Humidity is moderately elevated.';
  if (humidity >= 40) return 'Humidity is in a comfortable range for most crops.';
  return 'Humidity is low, which may increase water stress.';
}

export function describeTemperature(temp: number): string {
  if (temp >= 35) return 'High heat stress risk for sensitive crops.';
  if (temp >= 30) return 'Warm temperatures. Watch for heat stress.';
  if (temp >= 15) return 'Temperatures are in a favorable range for most crops.';
  if (temp >= 5) return 'Cool temperatures. Some crops may slow growth.';
  return 'Cold temperatures. Frost risk possible.';
}

export function describeWind(speed: number): string {
  if (speed >= 30) return 'Strong winds. Consider delaying spraying or treatment.';
  if (speed >= 15) return 'Moderate winds. Be cautious with any chemical applications.';
  return 'Wind conditions are calm to light.';
}

export function describePrecipitationForecast(forecast: WeatherForecast[]): string[] {
  const messages: string[] = [];
  const rainyDays = forecast.filter(f => f.precipitation_probability >= 50);
  if (rainyDays.length > 0) {
    const day = new Date(rainyDays[0].date).toLocaleDateString('en-US', { weekday: 'short' });
    messages.push(`Rain is expected around ${day}. Review irrigation needs before watering.`);
  }
  return messages;
}

export function describeDryConditions(forecast: WeatherForecast[]): string[] {
  const messages: string[] = [];
  const dryDays = forecast.filter(f => f.precipitation_probability < 20);
  if (dryDays.length >= 3) {
    messages.push('Dry conditions may increase water demand. Review soil moisture before irrigation.');
  }
  return messages;
}

export interface WeatherServiceResult {
  current: WeatherData | null;
  forecast: WeatherForecast[];
  available: boolean;
}

export async function getWeather(lat: number, lon: number): Promise<WeatherServiceResult> {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    const response = await fetch(
      `${EDGE_FUNCTION_BASE}/weather?lat=${lat}&lon=${lon}`,
      {
        headers: {
          Authorization: `Bearer ${session?.access_token ?? ''}`,
          apikey: import.meta.env.VITE_SUPABASE_ANON_KEY || '',
        },
      }
    );

    if (!response.ok) {
      return { current: null, forecast: [], available: false };
    }

    const data: WeatherServiceResult = await response.json();
    return data;
  } catch {
    return { current: null, forecast: [], available: false };
  }
}
