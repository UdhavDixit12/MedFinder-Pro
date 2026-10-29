import config from '../config/env.js';
import { fetchWithTimeout, readJson } from '../utils/http.js';
import { RED_FLAGS, SYMPTOMS } from './symptomKnowledge.js';

export const DISCLAIMER =
  'This information is general and educational only. It is not a medical diagnosis and does not replace advice from a qualified healthcare professional.';

const EMERGENCY_MESSAGE =
  'Some of what you described can be a sign of a serious condition. If this is happening now, call 112 (national emergency) or 102 (ambulance) immediately, or go to the nearest hospital emergency department.';

const MENTAL_HEALTH_MESSAGE =
  'If you are thinking about harming yourself, please reach out now: call 112, or the Tele-MANAS mental health helpline 14416 (India, 24×7). You do not have to go through this alone.';

const normalize = (text) => String(text || '').toLowerCase().replace(/[’`]/g, "'").replace(/\s+/g, ' ');
const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const matchesKeyword = (haystack, keyword) =>
  new RegExp(`(^|[^a-z])${escapeRegex(keyword.toLowerCase())}(s|es|ing)?($|[^a-z])`).test(haystack);

export const isAiConfigured = () => Boolean(config.ai.apiKey);

export function analyzeRules({ symptoms = [], redFlags = [], description = '', ageGroup, duration }) {
  const text = normalize(description);
  const selected = new Set(symptoms);

  const matchedSymptoms = SYMPTOMS.filter(
    (s) => selected.has(s.id) || s.keywords.some((k) => matchesKeyword(text, k)),
  );
  const selectedFlags = new Set(redFlags);
  const emergencyFlags = RED_FLAGS.filter(
    (f) => selectedFlags.has(f.id) || f.keywords.some((k) => matchesKeyword(text, k)),
  ).map(({ id, label }) => ({ id, label }));

  const longDuration = duration === 'over_week' || duration === '3_7_days';
  const vulnerable = ageGroup === 'infant' || ageGroup === 'older_adult' || ageGroup === 'pregnant';

  let urgency = 'information';
  if (emergencyFlags.length) urgency = 'emergency';
  else if (longDuration || vulnerable || matchedSymptoms.length >= 3) urgency = 'see_doctor';
  else if (matchedSymptoms.length) urgency = 'monitor';

  const facilityCounts = matchedSymptoms.reduce((acc, s) => ({ ...acc, [s.facilityType]: (acc[s.facilityType] || 0) + 1 }), {});
  const suggestedFacilityType =
    urgency === 'emergency'
      ? 'hospital'
      : Object.entries(facilityCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || 'clinic';

  const notes = [];
  if (longDuration) notes.push('Symptoms that last several days or longer are worth discussing with a doctor.');
  if (ageGroup === 'infant') notes.push('Infants and young children can become unwell quickly. Seek medical advice early.');
  if (ageGroup === 'older_adult') notes.push('Older adults may be more vulnerable to complications. Consider seeing a doctor sooner.');
  if (ageGroup === 'pregnant') notes.push('During pregnancy, it is best to check new symptoms with your doctor or midwife.');
  if (!matchedSymptoms.length && !emergencyFlags.length) {
    notes.push('We could not match your description to the topics this basic guide covers. A doctor or pharmacist can help.');
  }

  return {
    urgency,
    emergencyFlags,
    emergencyMessage: emergencyFlags.length ? EMERGENCY_MESSAGE : null,
    mentalHealthMessage: emergencyFlags.some((f) => f.id === 'self_harm') ? MENTAL_HEALTH_MESSAGE : null,
    matchedSymptoms: matchedSymptoms.map((s) => ({ id: s.id, label: s.label, info: s.info, seeDoctorIf: s.seeDoctorIf })),
    notes,
    suggestedFacilityType,
  };
}

const AI_SYSTEM_PROMPT = `You provide general, educational health information for a symptom-guidance web app in India.
Rules:
- Never diagnose. Never say the user "has" a condition. Use hedged language ("can be associated with").
- Never recommend specific medicines, doses or treatments.
- Always encourage professional evaluation when symptoms are severe, persistent or worrying.
- If anything could be an emergency, say to call 112 or 102 immediately.
- Respond ONLY with JSON: {"summary": string (max 80 words), "possibleCauses": string[] (max 4, general categories), "generalCare": string[] (max 4, non-medication, e.g. rest, fluids), "seeDoctorIf": string[] (max 5)}`;

async function analyzeWithAi({ symptoms, description, ageGroup, duration }) {
  const labels = SYMPTOMS.filter((s) => symptoms.includes(s.id)).map((s) => s.label);
  const userContent = JSON.stringify({
    selectedSymptoms: labels,
    description: description.slice(0, 1000),
    ageGroup: ageGroup || 'not specified',
    duration: duration || 'not specified',
  });

  const response = await fetchWithTimeout(
    config.ai.apiUrl,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${config.ai.apiKey}` },
      body: JSON.stringify({
        model: config.ai.model,
        temperature: 0.2,
        max_tokens: 500,
        response_format: { type: 'json_object' },
        messages: [
          { role: 'system', content: AI_SYSTEM_PROMPT },
          { role: 'user', content: userContent },
        ],
      }),
    },
    config.ai.timeoutMs,
    'The AI provider',
  );
  if (!response.ok) throw new Error(`AI provider HTTP ${response.status}`);
  const data = await readJson(response, 'The AI provider');
  const content = data?.choices?.[0]?.message?.content;
  const parsed = JSON.parse(content);
  const strings = (arr, max) => (Array.isArray(arr) ? arr.filter((x) => typeof x === 'string').slice(0, max).map((x) => x.slice(0, 300)) : []);
  return {
    summary: typeof parsed.summary === 'string' ? parsed.summary.slice(0, 800) : '',
    possibleCauses: strings(parsed.possibleCauses, 4),
    generalCare: strings(parsed.generalCare, 4),
    seeDoctorIf: strings(parsed.seeDoctorIf, 5),
    model: config.ai.model,
  };
}

export async function checkSymptoms(input) {
  const rules = analyzeRules(input);
  const result = {
    mode: 'rules',
    modeLabel: 'Basic rule-based guidance (no AI)',
    ...rules,
    ai: null,
    aiError: null,
    disclaimer: DISCLAIMER,
    generatedAt: new Date().toISOString(),
  };

  if (isAiConfigured() && rules.urgency !== 'emergency') {
    try {
      result.ai = await analyzeWithAi(input);
      result.mode = 'ai';
      result.modeLabel = `AI-assisted general information (${config.ai.model})`;
    } catch (err) {
      console.warn('[symptoms] AI provider failed, using rule-based guidance:', err.message);
      result.aiError = 'The AI service could not be reached, so basic rule-based guidance is shown instead.';
    }
  }
  return result;
}

export function symptomCatalog() {
  return {
    symptoms: SYMPTOMS.map(({ id, label }) => ({ id, label })),
    redFlags: RED_FLAGS.map(({ id, label }) => ({ id, label })),
    aiEnabled: isAiConfigured(),
    disclaimer: DISCLAIMER,
  };
}
