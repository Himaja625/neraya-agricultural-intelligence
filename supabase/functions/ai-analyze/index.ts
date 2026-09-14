import { createClient } from "npm:@supabase/supabase-js@2.57.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface AssessmentInput {
  imageDataUrl?: string | null;
  symptomsDescription?: string;
  observations?: string;
  field?: {
    name: string;
    crop_type?: string | null;
    crop_variety?: string | null;
    growth_stage?: string | null;
    location_text?: string | null;
    notes?: string | null;
    planting_date?: string | null;
  } | null;
  weather?: {
    temperature: number;
    humidity: number;
    wind_speed: number;
    weather_description: string;
  } | null;
  forecast?: Array<{
    date: string;
    temp_max: number;
    temp_min: number;
    precipitation_probability: number;
    weather_description: string;
  }> | null;
  previousAssessment?: {
    possible_issue?: string | null;
    severity?: string | null;
    assessment_confidence?: string | null;
    observed_indicators?: string[];
    created_at?: string;
  } | null;
  language?: string;
}

const LANGUAGE_INSTRUCTIONS: Record<string, string> = {
  te: 'Write all farmer-facing text (possible_issue, assessment_explanation, recommendations, etc.) in Telugu. Keep JSON keys in English.',
  hi: 'Write all farmer-facing text (possible_issue, assessment_explanation, recommendations, etc.) in Hindi. Keep JSON keys in English.',
  ta: 'Write all farmer-facing text (possible_issue, assessment_explanation, recommendations, etc.) in Tamil. Keep JSON keys in English.',
  kn: 'Write all farmer-facing text (possible_issue, assessment_explanation, recommendations, etc.) in Kannada. Keep JSON keys in English.',
  mr: 'Write all farmer-facing text (possible_issue, assessment_explanation, recommendations, etc.) in Marathi. Keep JSON keys in English.',
};

const SYSTEM_PROMPT = `You are Neraya's crop analysis engine. You analyze crop images and contextual information to help farmers understand what might be happening with their crops.

CRITICAL RULES:
- Never claim certainty. This is an AI-assisted assessment, not a confirmed diagnosis.
- Use uncertainty-aware language: "Possible...", "May be consistent with...", "Insufficient evidence to determine..."
- If the image quality is insufficient, say so explicitly.
- If only one plant is visible, note that the assessment is limited.
- If the affected area is not close enough, say so.
- If the underside of leaves is not visible, note it as missing evidence.
- If surrounding plants are not shown, note it.
- Do not force a disease identification when evidence is insufficient. Use "Unknown" honestly.
- Do not give dangerous or overly specific chemical/pesticide instructions without sufficient context.
- For serious or uncertain cases, recommend qualified agricultural expertise.
- Never use em dashes or en dashes. Use commas, periods, or separate sentences.

REASONING STRUCTURE:
Distinguish between:
- OBSERVED: What is visibly present in the image
- POSSIBLE: What conditions could plausibly explain those observations
- CONTEXT: What environmental/field factors may contribute
- MISSING: What information is unavailable
- NEXT CHECK: What the farmer should inspect or provide next
- DECISION SUPPORT: Reasonable options based on current evidence

Return JSON with this exact structure:
{
  "possible_issue": "short description or Unknown",
  "assessment_confidence": "Low | Moderate | High | Unknown",
  "observed_indicators": ["visible signs from the image"],
  "context_factors": ["relevant environmental or historical factors"],
  "evidence_used": ["inputs actually considered"],
  "missing_evidence": ["useful missing information"],
  "severity": "Low | Moderate | High | Unknown",
  "assessment_explanation": "plain language explanation for the farmer",
  "what_to_check": ["specific things the farmer can look at"],
  "what_to_consider": ["action-oriented guidance"],
  "environmental_considerations": "how current conditions may affect this",
  "escalation_guidance": "when to seek expert help",
  "recommendations": [
    {"option": "Monitor", "why": "...", "what_to_check": ["..."]},
    {"option": "Take action", "why": "...", "conditions_to_consider": ["..."]},
    {"option": "Seek expert advice", "why": "..."}
  ]
}`;

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");
    if (!GEMINI_API_KEY) {
      return new Response(
        JSON.stringify({
          error: "AI service not configured. Please set GEMINI_API_KEY in edge function secrets.",
        }),
        { status: 503, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const input: AssessmentInput = await req.json();

    const contextParts: string[] = [];
    if (input.field) {
      contextParts.push(`Field: ${input.field.name}`);
      if (input.field.crop_type) contextParts.push(`Crop: ${input.field.crop_type}`);
      if (input.field.crop_variety) contextParts.push(`Variety: ${input.field.crop_variety}`);
      if (input.field.growth_stage) contextParts.push(`Growth stage: ${input.field.growth_stage}`);
      if (input.field.location_text) contextParts.push(`Location: ${input.field.location_text}`);
      if (input.field.notes) contextParts.push(`Field notes: ${input.field.notes}`);
      if (input.field.planting_date) contextParts.push(`Planted: ${input.field.planting_date}`);
    }
    if (input.weather) {
      contextParts.push(`Current weather: ${input.weather.temperature}C, ${input.weather.weather_description}, humidity ${input.weather.humidity}%, wind ${input.weather.wind_speed}km/h`);
    }
    if (input.forecast && input.forecast.length > 0) {
      const forecastSummary = input.forecast.slice(0, 5).map(f =>
        `${f.date}: ${f.temp_max}/${f.temp_min}C, ${f.weather_description}, ${f.precipitation_probability}% rain`
      ).join("; ");
      contextParts.push(`5-day forecast: ${forecastSummary}`);
    }
    if (input.symptomsDescription) {
      contextParts.push(`Farmer description: ${input.symptomsDescription}`);
    }
    if (input.observations) {
      contextParts.push(`Additional observations: ${input.observations}`);
    }
    if (input.previousAssessment) {
      const prev = input.previousAssessment;
      const parts = [`Previous assessment: ${prev.possible_issue ?? "N/A"}`];
      if (prev.severity) parts.push(`severity: ${prev.severity}`);
      if (prev.assessment_confidence) parts.push(`confidence: ${prev.assessment_confidence}`);
      if (prev.created_at) parts.push(`date: ${new Date(prev.created_at).toLocaleDateString()}`);
      if (prev.observed_indicators && prev.observed_indicators.length > 0) {
        parts.push(`observed: ${prev.observed_indicators.join(", ")}`);
      }
      contextParts.push(parts.join(", "));
    }

    const langInstruction = input.language && LANGUAGE_INSTRUCTIONS[input.language]
      ? `\n\n${LANGUAGE_INSTRUCTIONS[input.language]}`
      : '';
    const userText = `Please analyze this crop.${langInstruction}${contextParts.length > 0 ? "\n\nContext:\n" + contextParts.join("\n") : ""}`;

    const contents: Array<{ text: string } | { inlineData: { mimeType: string; data: string } }> = [
      { text: userText },
    ];

    if (input.imageDataUrl) {
      const match = input.imageDataUrl.match(/^data:(image\/[a-zA-Z]+);base64,(.+)$/);
      if (match) {
        contents.unshift({
          inlineData: { mimeType: match[1], data: match[2] },
        });
      }
    }

    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent?key=${GEMINI_API_KEY}`;

    const geminiResponse = await fetch(geminiUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: contents }],
        systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] },
        generationConfig: {
          temperature: 0.4,
          maxOutputTokens: 2048,
          responseMimeType: "application/json",
        },
      }),
    });

    if (!geminiResponse.ok) {
      const errText = await geminiResponse.text();
      console.error("Gemini API error:", geminiResponse.status, errText);
      return new Response(
        JSON.stringify({ error: "The AI analysis service returned an error. Please try again." }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const geminiData = await geminiResponse.json();
    const content = geminiData?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!content) {
      return new Response(
        JSON.stringify({ error: "The AI service returned an empty response. Please try again." }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    let result;
    try {
      result = JSON.parse(content);
    } catch {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        return new Response(
          JSON.stringify({ error: "The AI response could not be parsed. Please try again." }),
          { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      result = JSON.parse(jsonMatch[0]);
    }

    const validated = validateAssessment(result);
    return new Response(
      JSON.stringify(validated),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("ai-analyze error:", err);
    return new Response(
      JSON.stringify({ error: "Neraya couldn't complete the assessment right now. Please try again." }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

function validateAssessment(raw: Record<string, unknown>): Record<string, unknown> {
  const str = (v: unknown, fallback: string): string =>
    typeof v === "string" && v.trim() ? v.trim() : fallback;
  const strArr = (v: unknown): string[] =>
    Array.isArray(v) ? v.filter((x): x is string => typeof x === "string" && x.trim()) : [];
  const conf = (v: unknown): string => {
    const valid = ["Low", "Moderate", "High", "Unknown"];
    return typeof v === "string" && valid.includes(v) ? v : "Unknown";
  };
  const sev = (v: unknown): string => {
    const valid = ["Low", "Moderate", "High", "Unknown"];
    return typeof v === "string" && valid.includes(v) ? v : "Unknown";
  };
  const recs = (v: unknown): Array<Record<string, unknown>> => {
    if (!Array.isArray(v)) return [];
    return v.filter((r): r is Record<string, unknown> => typeof r === "object" && r !== null).map(r => ({
      option: str((r as Record<string, unknown>).option, "Unknown"),
      why: str((r as Record<string, unknown>).why, ""),
      ...(Array.isArray((r as Record<string, unknown>).what_to_check)
        ? { what_to_check: strArr((r as Record<string, unknown>).what_to_check) }
        : {}),
      ...(Array.isArray((r as Record<string, unknown>).conditions_to_consider)
        ? { conditions_to_consider: strArr((r as Record<string, unknown>).conditions_to_consider) }
        : {}),
    }));
  };

  return {
    possible_issue: str(raw.possible_issue, "Unknown"),
    assessment_confidence: conf(raw.assessment_confidence),
    observed_indicators: strArr(raw.observed_indicators),
    context_factors: strArr(raw.context_factors),
    evidence_used: strArr(raw.evidence_used),
    missing_evidence: strArr(raw.missing_evidence),
    severity: sev(raw.severity),
    assessment_explanation: str(raw.assessment_explanation, ""),
    what_to_check: strArr(raw.what_to_check),
    what_to_consider: strArr(raw.what_to_consider),
    environmental_considerations: str(raw.environmental_considerations, ""),
    escalation_guidance: str(raw.escalation_guidance, ""),
    recommendations: recs(raw.recommendations),
  };
}
 
