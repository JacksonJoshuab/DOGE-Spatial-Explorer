/*
 * DOGE-LANDSCAPER — Live Weather Hook
 * Open-Meteo API (free, no key) for Wilton, Iowa 52776
 * Lat: 41.5867, Lon: -91.0154
 * Provides hourly forecast with spray window analysis
 */

import { useState, useEffect, useCallback } from "react";

export interface HourlyWeather {
  time: string;
  temp: number;
  condition: string;
  wind: number;
  windDir: number;
  humidity: number;
  precipitation: number;
  precipProb: number;
  sprayOk: boolean;
  sprayRisk: "optimal" | "acceptable" | "caution" | "no-spray";
  sprayReason: string;
  icon: string;
}

export interface CurrentWeather {
  temp: number;
  feelsLike: number;
  condition: string;
  wind: number;
  windDir: number;
  windDirLabel: string;
  humidity: number;
  dewPoint: number;
  pressure: number;
  visibility: number;
  uvIndex: number;
  precipitation: number;
  icon: string;
  isDay: boolean;
  lastUpdated: string;
}

export interface WeatherData {
  current: CurrentWeather;
  hourly: HourlyWeather[];
  loading: boolean;
  error: string | null;
  lastFetched: Date | null;
  refresh: () => void;
}

// Wilton, Iowa coordinates
const LAT = 41.5867;
const LON = -91.0154;

function getWeatherIcon(code: number, isDay: boolean): string {
  if (code === 0) return isDay ? "☀️" : "🌙";
  if (code <= 2) return isDay ? "⛅" : "🌙";
  if (code === 3) return "☁️";
  if (code <= 49) return "🌫️";
  if (code <= 59) return "🌦️";
  if (code <= 69) return "🌧️";
  if (code <= 79) return "🌨️";
  if (code <= 84) return "🌧️";
  if (code <= 94) return "⛈️";
  return "🌩️";
}

function getConditionLabel(code: number): string {
  if (code === 0) return "Clear";
  if (code === 1) return "Mostly Clear";
  if (code === 2) return "Partly Cloudy";
  if (code === 3) return "Overcast";
  if (code <= 49) return "Foggy";
  if (code <= 59) return "Drizzle";
  if (code <= 69) return "Rain";
  if (code <= 79) return "Snow";
  if (code <= 84) return "Rain Showers";
  if (code <= 94) return "Thunderstorm";
  return "Severe Storm";
}

function getWindDirLabel(degrees: number): string {
  const dirs = ["N", "NNE", "NE", "ENE", "E", "ESE", "SE", "SSE", "S", "SSW", "SW", "WSW", "W", "WNW", "NW", "NNW"];
  return dirs[Math.round(degrees / 22.5) % 16];
}

function analyzeSprayConditions(
  wind: number,
  humidity: number,
  temp: number,
  precipProb: number,
  precipitation: number
): { ok: boolean; risk: HourlyWeather["sprayRisk"]; reason: string } {
  // Iowa groundskeeper spray rules:
  // - Wind < 10 mph: optimal; 10-15: acceptable; 15-20: caution; >20: no-spray
  // - Humidity > 40%: helps granule adhesion
  // - Temp 50-90°F: optimal range for herbicide activation
  // - No rain expected within 4 hours (precip prob < 30%)
  // - No active precipitation

  if (precipitation > 0.1) return { ok: false, risk: "no-spray", reason: "Active precipitation — granules will wash off" };
  if (precipProb > 60) return { ok: false, risk: "no-spray", reason: `${precipProb}% rain chance — wait for clear window` };
  if (wind > 20) return { ok: false, risk: "no-spray", reason: `Wind ${wind.toFixed(0)} mph — too high, overspray risk` };
  if (temp < 45) return { ok: false, risk: "no-spray", reason: `Temp ${temp.toFixed(0)}°F — too cold for herbicide activation` };
  if (temp > 90) return { ok: false, risk: "caution", reason: `Temp ${temp.toFixed(0)}°F — heat stress risk, apply early morning` };

  if (wind <= 10 && humidity >= 50 && temp >= 55 && temp <= 85 && precipProb < 20) {
    return { ok: true, risk: "optimal", reason: `Wind ${wind.toFixed(0)} mph, ${humidity.toFixed(0)}% humidity — ideal conditions` };
  }
  if (wind <= 15 && precipProb < 40) {
    return { ok: true, risk: "acceptable", reason: `Wind ${wind.toFixed(0)} mph — use shield guard near beds` };
  }
  if (wind <= 20 || precipProb < 50) {
    return { ok: false, risk: "caution", reason: `Wind ${wind.toFixed(0)} mph or ${precipProb}% rain — marginal conditions` };
  }

  return { ok: false, risk: "no-spray", reason: "Conditions not suitable for application" };
}

export function useWeather(): WeatherData {
  const [current, setCurrent] = useState<CurrentWeather>({
    temp: 58, feelsLike: 54, condition: "Partly Cloudy", wind: 8, windDir: 315,
    windDirLabel: "NW", humidity: 68, dewPoint: 45, pressure: 1013, visibility: 10,
    uvIndex: 3, precipitation: 0, icon: "⛅", isDay: true,
    lastUpdated: "Loading...",
  });
  const [hourly, setHourly] = useState<HourlyWeather[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastFetched, setLastFetched] = useState<Date | null>(null);

  const fetchWeather = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const url = new URL("https://api.open-meteo.com/v1/forecast");
      url.searchParams.set("latitude", String(LAT));
      url.searchParams.set("longitude", String(LON));
      url.searchParams.set("current", [
        "temperature_2m", "apparent_temperature", "relative_humidity_2m",
        "dew_point_2m", "precipitation", "weather_code", "surface_pressure",
        "wind_speed_10m", "wind_direction_10m", "is_day", "uv_index",
      ].join(","));
      url.searchParams.set("hourly", [
        "temperature_2m", "relative_humidity_2m", "dew_point_2m",
        "precipitation_probability", "precipitation", "weather_code",
        "wind_speed_10m", "wind_direction_10m", "visibility",
      ].join(","));
      url.searchParams.set("temperature_unit", "fahrenheit");
      url.searchParams.set("wind_speed_unit", "mph");
      url.searchParams.set("precipitation_unit", "inch");
      url.searchParams.set("timezone", "America/Chicago");
      url.searchParams.set("forecast_days", "1");

      const res = await fetch(url.toString());
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();

      // Parse current conditions
      const c = data.current;
      const code = c.weather_code;
      const isDay = c.is_day === 1;
      setCurrent({
        temp: Math.round(c.temperature_2m),
        feelsLike: Math.round(c.apparent_temperature),
        condition: getConditionLabel(code),
        wind: Math.round(c.wind_speed_10m),
        windDir: c.wind_direction_10m,
        windDirLabel: getWindDirLabel(c.wind_direction_10m),
        humidity: Math.round(c.relative_humidity_2m),
        dewPoint: Math.round(c.dew_point_2m),
        pressure: Math.round(c.surface_pressure),
        visibility: 10,
        uvIndex: Math.round(c.uv_index ?? 0),
        precipitation: c.precipitation,
        icon: getWeatherIcon(code, isDay),
        isDay,
        lastUpdated: new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }),
      });

      // Parse hourly — find current hour index
      const now = new Date();
      const currentHourStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}T${String(now.getHours()).padStart(2, "0")}:00`;
      const times: string[] = data.hourly.time;
      const startIdx = Math.max(0, times.findIndex(t => t === currentHourStr));

      const parsedHourly: HourlyWeather[] = times.slice(startIdx, startIdx + 14).map((t: string, i: number) => {
        const idx = startIdx + i;
        const hCode = data.hourly.weather_code[idx];
        const hTemp = Math.round(data.hourly.temperature_2m[idx]);
        const hWind = Math.round(data.hourly.wind_speed_10m[idx]);
        const hHumidity = Math.round(data.hourly.relative_humidity_2m[idx]);
        const hPrecipProb = Math.round(data.hourly.precipitation_probability[idx] ?? 0);
        const hPrecip = data.hourly.precipitation[idx] ?? 0;
        const hWindDir = data.hourly.wind_direction_10m[idx];
        const spray = analyzeSprayConditions(hWind, hHumidity, hTemp, hPrecipProb, hPrecip);
        const hour = new Date(t);
        const timeLabel = hour.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true });

        return {
          time: timeLabel,
          temp: hTemp,
          condition: getConditionLabel(hCode),
          wind: hWind,
          windDir: hWindDir,
          humidity: hHumidity,
          precipitation: hPrecip,
          precipProb: hPrecipProb,
          sprayOk: spray.ok,
          sprayRisk: spray.risk,
          sprayReason: spray.reason,
          icon: getWeatherIcon(hCode, hour.getHours() >= 6 && hour.getHours() < 20),
        };
      });

      setHourly(parsedHourly);
      setLastFetched(new Date());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch weather");
      console.error("Weather fetch error:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchWeather();
    // Refresh every 15 minutes
    const interval = setInterval(fetchWeather, 15 * 60 * 1000);
    return () => clearInterval(interval);
  }, [fetchWeather]);

  return { current, hourly, loading, error, lastFetched, refresh: fetchWeather };
}
