const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface ChatInput {
  message: string;
  history: Array<{ role: string; content: string }>;
  context: {
    field?: {
      name: string;
      crop_type?: string | null;
      growth_stage?: string | null;
      location_text?: string | null;
      notes?: string | null;
    } | null;
    weather?: {
      temperature: number;
      humidity: number;
      wind_speed: number;
      weather_description: string;
    } | null;
    recentAssessments?: Array<{
      possible_issue?: string | null;
      severity?: string | null;
      assessment_confidence?: string | null;
      created_at?: string;
    }>;
    profileName?: string | null;
    cropsGrown?: string[];
    language?: string;
  };
}

const LANGUAGE_INSTRUCTIONS: Record<string, string> = {
  te: 'Respond in Telugu.',
  hi: 'Respond in Hindi.',
  ta: 'Respond in Tamil.',
  kn: 'Respond in Kannada.',
  mr: 'Respond in Marathi.',
};

const SYSTEM_PROMPT = `You are Neraya, a calm, knowledgeable agricultural companion. You help farmers understand what might be happening in their crops and make thoughtful decisions.

Core principle: "Neraya doesn't predict for the farmer. Neraya helps the farmer decide."

Guidelines:
- Speak naturally and warmly, like a knowledgeable neighbor who genuinely cares.
- Never say "As an AI", "Based on your query", "I understand your concern", "Here are some steps", "Certainly", "Absolutely", or any robotic or generic AI phrasing.
- Vary your sentence structure. Do not make every answer follow the same template.
- Acknowledge uncertainty honestly. Never present an AI assessment as a confirmed diagnosis.
- When a farmer expresses frustration or discouragement, acknowledge it naturally before providing practical help. Do not pretend to have human emotions. Do not say "Don't worry" when the situation may be serious.
- Ask useful follow-up questions when you need more information.
- Reference context like weather, field history, and previous assessments when available and relevant. If there is no previous assessment, say so.
- For "What should I know about my field today?", use current weather, crop, growth stage, latest assessment, and any unresolved concerns.
- For "What did my last assessment find?", use the actual saved assessment data from context.
- For "What should I check next?", use the assessment's missing evidence and recommended checks.
- For "Has anything changed?", compare previous assessments when enough history exists. If there is not enough history, say so.
- For "Is this weather a problem?", use real weather and crop context without claiming causation unless supported.
- Keep responses concise and readable on mobile devices. Use short paragraphs.
- Use simple, clear language. Avoid unnecessary jargon. Explain technical concepts naturally when needed.
- If you don't have enough information, say so plainly and suggest what additional observation or another scan could help.
- Be supportive without being overly emotional or patronizing.
- Never use em dashes or en dashes. Use commas, periods, colons, or separate sentences.
- Do not invent memories, assessments, weather data, or community information.
- Do not give dangerous or overly specific chemical or pesticide instructions without sufficient context.
- For serious or uncertain cases, recommend qualified agricultural expertise.
- When useful for decision support, structure responses around: What I know, What may be happening, What to check, What you can do, When to seek expert help. Do not use this structure for every casual question.`;

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

    const input: ChatInput = await req.json();

    const contextParts: string[] = [];
    if (input.context.field) {
      contextParts.push(`Selected field: ${input.context.field.name}`);
      if (input.context.field.crop_type) contextParts.push(`Crop: ${input.context.field.crop_type}`);
      if (input.context.field.growth_stage) contextParts.push(`Growth stage: ${input.context.field.growth_stage}`);
      if (input.context.field.location_text) contextParts.push(`Location: ${input.context.field.location_text}`);
      if (input.context.field.notes) contextParts.push(`Field notes: ${input.context.field.notes}`);
    }
    if (input.context.weather) {
      contextParts.push(`Current weather: ${input.context.weather.temperature}C, ${input.context.weather.weather_description}, humidity ${input.context.weather.humidity}%, wind ${input.context.weather.wind_speed}km/h`);
    }
    if (input.context.recentAssessments && input.context.recentAssessments.length > 0) {
      const latest = input.context.recentAssessments[0];
      const parts = [`Most recent assessment: ${latest.possible_issue ?? "N/A"}`];
      if (latest.severity) parts.push(`severity: ${latest.severity}`);
      if (latest.assessment_confidence) parts.push(`confidence: ${latest.assessment_confidence}`);
      if (latest.created_at) parts.push(`date: ${new Date(latest.created_at).toLocaleDateString()}`);
      contextParts.push(parts.join(", "));
      if (input.context.recentAssessments.length > 1) {
        contextParts.push(`Total assessments on record: ${input.context.recentAssessments.length}`);
      }
    } else {
      contextParts.push("No previous assessments on record for this field.");
    }
    if (input.context.profileName) {
      contextParts.push(`Farmer name: ${input.context.profileName}`);
    }
    if (input.context.cropsGrown && input.context.cropsGrown.length > 0) {
      contextParts.push(`Farmer grows: ${input.context.cropsGrown.join(", ")}`);
    }

    const langInstruction = input.context.language && LANGUAGE_INSTRUCTIONS[input.context.language]
      ? `\n\n${LANGUAGE_INSTRUCTIONS[input.context.language]}`
      : '';
    const systemContent = SYSTEM_PROMPT + langInstruction + (contextParts.length > 0 ? `\n\nContext:\n${contextParts.join("\n")}` : "");

    const contents = [
      ...input.history.slice(-8).map(m => ({
        role: m.role === "assistant" ? "model" : "user",
        parts: [{ text: m.content }],
      })),
      { role: "user", parts: [{ text: input.message }] },
    ];

    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent?key=${GEMINI_API_KEY}`;

    const geminiResponse = await fetch(geminiUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents,
        systemInstruction: { parts: [{ text: systemContent }] },
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 1024,
        },
      }),
    });

    if (!geminiResponse.ok) {
      const errText = await geminiResponse.text();
      console.error("Gemini API error:", geminiResponse.status, errText);
      return new Response(
        JSON.stringify({ error: "The AI service returned an error. Please try again." }),
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

    return new Response(
      JSON.stringify({ content }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("ai-chat error:", err);
    return new Response(
      JSON.stringify({ error: "Neraya couldn't respond right now. Please try again in a moment." }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
 
 
