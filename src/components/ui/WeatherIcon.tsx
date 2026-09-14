import { Sun, Cloud, CloudRain, CloudSnow, CloudLightning, CloudDrizzle, Moon, CloudSun } from './Icons';

interface WeatherIconProps {
  code: number;
  isDay?: boolean;
  size?: number;
  className?: string;
}

export default function WeatherIcon({ code, isDay = true, size = 24, className = '' }: WeatherIconProps) {
  const props = { size, className, strokeWidth: 1.75 };

  if (code === 0 || code === 1) return isDay ? <Sun {...props} /> : <Moon {...props} />;
  if (code === 2) return isDay ? <CloudSun {...props} /> : <Cloud {...props} />;
  if (code === 3 || code === 45 || code === 48) return <Cloud {...props} />;
  if (code >= 51 && code <= 67) return <CloudRain {...props} />;
  if (code >= 71 && code <= 77) return <CloudSnow {...props} />;
  if (code >= 80 && code <= 82) return <CloudRain {...props} />;
  if (code >= 85 && code <= 86) return <CloudSnow {...props} />;
  if (code >= 95) return <CloudLightning {...props} />;

  // OpenWeatherMap codes
  if (code >= 200 && code < 300) return <CloudLightning {...props} />;
  if (code >= 300 && code < 500) return <CloudDrizzle {...props} />;
  if (code >= 500 && code < 600) return <CloudRain {...props} />;
  if (code >= 600 && code < 700) return <CloudSnow {...props} />;
  if (code >= 700 && code < 800) return <Cloud {...props} />;
  if (code === 800) return isDay ? <Sun {...props} /> : <Moon {...props} />;
  if (code > 800 && code < 900) return isDay ? <CloudSun {...props} /> : <Cloud {...props} />;

  return <Cloud {...props} />;
}
