import { createClient } from "npm:@supabase/supabase-js@2.57.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const OPENWEATHER_API_KEY = Deno.env.get("OPENWEATHER_API_KEY");
    if (!OPENWEATHER_API_KEY) {
      return new Response(
        JSON.stringify({
          current: null,
          forecast: [],
          available: false,
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const url = new URL(req.url);
    const lat = url.searchParams.get("lat");
    const lon = url.searchParams.get("lon");

    if (!lat || !lon) {
      return new Response(
        JSON.stringify({ error: "Latitude and longitude are required." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const latNum = parseFloat(lat);
    const lonNum = parseFloat(lon);

    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { data: cached } = await supabase
      .from("weather_cache")
      .select("*")
      .eq("latitude", latNum)
      .eq("longitude", lonNum)
      .maybeSingle();

    if (cached) {
      const age = Date.now() - new Date(cached.fetched_at).getTime();
      if (age < 30 * 60 * 1000) {
        return new Response(
          JSON.stringify(cached.weather_data),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    const currentRes = await fetch(
      `https://api.openweathermap.org/data/2.5/weather?lat=${latNum}&lon=${lonNum}&appid=${OPENWEATHER_API_KEY}&units=metric`
    );
    if (!currentRes.ok) {
      return new Response(
        JSON.stringify({
          current: null,
          forecast: [],
          available: false,
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    const currentData = await currentRes.json();

    const forecastRes = await fetch(
      `https://api.openweathermap.org/data/2.5/forecast?lat=${latNum}&lon=${lonNum}&appid=${OPENWEATHER_API_KEY}&units=metric&cnt=24`
    );
    let forecast: Array<{
      date: string;
      temp_max: number;
      temp_min: number;
      precipitation_probability: number;
      weather_code: number;
      weather_description: string;
    }> = [];
    if (forecastRes.ok) {
      const forecastData = await forecastRes.json();
      const dailyMap = new Map<string, { max: number; min: number; pop: number; code: number; desc: string }>();
      for (const item of forecastData.list ?? []) {
        const date = item.dt_txt.split(" ")[0];
        const existing = dailyMap.get(date);
        if (!existing) {
          dailyMap.set(date, {
            max: item.main.temp_max,
            min: item.main.temp_min,
            pop: item.pop ?? 0,
            code: item.weather?.[0]?.id ?? 0,
            desc: item.weather?.[0]?.description ?? "",
          });
        } else {
          existing.max = Math.max(existing.max, item.main.temp_max);
          existing.min = Math.min(existing.min, item.main.temp_min);
          existing.pop = Math.max(existing.pop, item.pop ?? 0);
        }
      }
      forecast = Array.from(dailyMap.entries()).slice(0, 5).map(([date, v]) => ({
        date,
        temp_max: Math.round(v.max),
        temp_min: Math.round(v.min),
        precipitation_probability: Math.round(v.pop * 100),
        weather_code: v.code,
        weather_description: v.desc,
      }));
    }

    const current = {
      temperature: Math.round(currentData.main.temp),
      feels_like: Math.round(currentData.main.feels_like),
      humidity: currentData.main.humidity,
      wind_speed: Math.round(currentData.wind.speed),
      weather_code: currentData.weather?.[0]?.id ?? 0,
      weather_description: currentData.weather?.[0]?.description ?? "Unknown",
      is_day: currentData.sys?.sunrise
        ? Date.now() / 1000 > currentData.sys.sunrise && Date.now() / 1000 < currentData.sys.sunset
        : true,
      fetched_at: new Date().toISOString(),
    };

    const result = { current, forecast, available: true };

    await supabase.from("weather_cache").upsert({
      latitude: latNum,
      longitude: lonNum,
      weather_data: result,
      fetched_at: new Date().toISOString(),
    }, { onConflict: "latitude,longitude" });

    return new Response(
      JSON.stringify(result),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("weather error:", err);
    return new Response(
      JSON.stringify({
        current: null,
        forecast: [],
        available: false,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
