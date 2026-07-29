/**
 * Thin wrapper for calling the Rork AI proxy (Claude) for caption / reply generation.
 * Uses the OpenAI-compatible chat completions endpoint behind the Vercel AI Gateway.
 */

const TOOLKIT_URL = process.env.EXPO_PUBLIC_TOOLKIT_URL;
const SECRET_KEY = process.env.EXPO_PUBLIC_RORK_TOOLKIT_SECRET_KEY;

const MODEL = "anthropic/claude-sonnet-4.6";

export type ChatMessage = {
  role: "system" | "user" | "assistant";
  content: string;
};

export async function chat(messages: ChatMessage[], opts?: { maxTokens?: number; temperature?: number }): Promise<string> {
  if (!TOOLKIT_URL || !SECRET_KEY) {
    throw new Error("AI proxy not configured");
  }
  const url = `${TOOLKIT_URL}/v2/vercel/v1/chat/completions`;
  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${SECRET_KEY}`,
    },
    body: JSON.stringify({
      model: MODEL,
      messages,
      temperature: opts?.temperature ?? 0.8,
      max_tokens: opts?.maxTokens ?? 600,
    }),
  });

  if (!res.ok) {
    const errText = await res.text().catch(() => "");
    console.log("[ai] error", res.status, errText.slice(0, 200));
    throw new Error(`AI request failed (${res.status})`);
  }
  const data = (await res.json()) as { choices?: { message?: { content?: string } }[] };
  const content = data.choices?.[0]?.message?.content ?? "";
  return content.trim();
}

export type CaptionInputs = {
  businessName: string;
  city: string;
  state: string;
  phone: string;
  website?: string;
  service: string;
  notes?: string;
  /** Optional override for the specific job site (city, neighborhood, etc.). */
  jobLocation?: string;
};

export async function generateBeforeAfterCaption(inputs: CaptionInputs): Promise<string> {
  const sys = `You write punchy, authentic social media captions for blue-collar contractors. Voice: confident, direct, local, proud of the craft. Sound like the OWNER wrote it on his phone after the job, not a marketing agency.

HARD RULES:
- NEVER say: elevate, transform your space, we are passionate, unleash, unlock, dream home, journey, partner with us.
- NEVER invent details (square footage, hours, products, chemicals) that weren't given. If the contractor didn't mention it, don't make it up.
- NEVER assume the surface (e.g. don't call concrete a "driveway" \u2014 it could be a sidewalk, patio, pool deck, parking lot, warehouse floor, garage, curb).
- NEVER assume method (don't say "pressure washing" if the service is soft washing or roof cleaning; don't claim chemicals were/weren't used).
- 3-5 short punchy lines. Line breaks for readability.
- 1-2 emojis MAX, only if they fit naturally. No emoji spam, no hashtag walls (3-5 relevant hashtags max at the end, on their own line).
- End with a clear CTA using the phone number.
- Mention the job site location (city/neighborhood) once for local SEO.
- Vary opening lines. Don't always start with "Just finished" or "Check out".

SERVICE-SPECIFIC GUIDANCE (apply only the one that matches):
- House Washing / Soft Washing: emphasize the SOFT WASH process \u2014 low pressure + professional cleaning solutions that kill mold/mildew/algae at the root. Do NOT call it pressure washing.
- Roof Cleaning: soft wash only, low pressure, treatment kills black streaks (gloeocapsa magma) without damaging shingles.
- Concrete Cleaning: surface cleaner + professional detergents to lift embedded dirt, oil, organic stains. The surface could be a driveway, sidewalk, patio, pool deck, parking lot, garage, curb \u2014 only name it if the contractor said so in the notes.
- Concrete Sealing: protective sealer applied after cleaning; enhances color, repels stains, extends life.
- Driveway Cleaning: same as concrete cleaning but it IS a driveway.
- Deck/Fence Cleaning: appropriate pressure + wood-safe cleaner; mention restoring the original look.
- Window Cleaning: streak-free, inside/outside if mentioned, screens/tracks if mentioned.
- Gutter Cleaning: hand-cleaned or vacuumed debris; mention preventing water damage.
- Fleet / Building Washing: commercial scale, professional chemicals, minimal downtime.
- Other / unknown: stay generic about the work; don't fabricate technique.`;

  const jobLine = inputs.jobLocation && inputs.jobLocation.trim().length > 0
    ? `Job site location: ${inputs.jobLocation}  (use THIS as the local area in the caption)`
    : `Job site location: ${inputs.city}, ${inputs.state}`;
  const user = `Service: ${inputs.service}
Business name: ${inputs.businessName}
${jobLine}
Phone: ${inputs.phone}
${inputs.website ? `Website: ${inputs.website}` : ""}
${inputs.notes ? `Notes from the contractor (use ONLY these specifics, don't invent more): ${inputs.notes}` : "No extra notes from the contractor \u2014 keep specifics generic and accurate to the service."}

Write the Facebook/Instagram caption for a before-and-after photo of this job. Output ONLY the caption text, no quotes, no preamble, no "Caption:" label.`;

  return chat(
    [
      { role: "system", content: sys },
      { role: "user", content: user },
    ],
    { maxTokens: 400 }
  );
}

export async function generateReviewPostCaption(inputs: {
  businessName: string;
  city: string;
  state: string;
  reviewer: string;
  reviewText: string;
}): Promise<string> {
  const sys = `You write authentic social captions for contractors sharing a 5-star Google review. Tone: humble, grateful, confident. Short. 3-4 lines. End with a soft CTA inviting people to call or check reviews. No hashtag walls. 1-2 emojis MAX.`;
  const user = `Business: ${inputs.businessName}
Area: ${inputs.city}, ${inputs.state}
Reviewer: ${inputs.reviewer}
Review: "${inputs.reviewText}"

Output ONLY the caption.`;
  return chat(
    [
      { role: "system", content: sys },
      { role: "user", content: user },
    ],
    { maxTokens: 300 }
  );
}

export async function generateGoogleReplyToReview(inputs: {
  businessName: string;
  city: string;
  state: string;
  service: string;
  reviewer: string;
  reviewText: string;
}): Promise<string> {
  const sys = `You write SEO-optimized owner replies to Google reviews for service contractors. Rules:
- Personalize: reference something specific from the review.
- Naturally include the service type, city, and business name once each (for local SEO).
- 2-4 sentences. Warm and professional. No corporate jargon.
- End with a brief invitation to call again or refer friends.
- Output ONLY the reply text.`;
  const user = `Business: ${inputs.businessName}
Service: ${inputs.service}
Area: ${inputs.city}, ${inputs.state}
Customer: ${inputs.reviewer}
Their review: "${inputs.reviewText}"`;
  return chat(
    [
      { role: "system", content: sys },
      { role: "user", content: user },
    ],
    { maxTokens: 300 }
  );
}
