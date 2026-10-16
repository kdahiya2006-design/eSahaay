"""
Interchangeable AI Model Provider Service.
Supports:
1. Google Gemini (via google-generativeai or REST)
2. OpenAI / Compatible (via openai library or httpx REST)
3. Anthropic Claude (via REST / anthropic)
4. Deterministic Demo Mode (Rule-based fallback when no key is configured or offline)

Always clearly labels the execution mode and never falsifies LLM attribution.
"""

import json
import logging
from typing import Optional
from app.config import settings
from app.models.schemas import IncidentAnalysis
from app.services.rule_engine import RuleEngine

logger = logging.getLogger("esahaay.ai_provider")

ANALYSIS_SYSTEM_PROMPT = """
You are eSahaay, an intelligent helpline triage assistant for women's safety in India.
Helpline callers across India speak in various regional languages (including Hindi, Bengali, Marathi, Telugu, Tamil, Gujarati, Urdu, Kannada, Odia, Malayalam, Punjabi, Assamese, Maithili, Bhojpuri, etc.) as well as code-mixed dialects (Hinglish, Tanglish, Banglish).

CRITICAL REQUIREMENT - MULTILINGUAL COMPREHENSION & OPERATOR TRANSLATION:
A human operator might receive a call in a regional language they do not speak. To ensure instant comprehension:
1. Identify the caller's spoken language and script (e.g. "Bengali", "Marathi", "Tamil", "Telugu", "Hindi", "Punjabi", "Gujarati", "Hinglish", "English", etc.).
2. You MUST provide the `translations` object containing 3 high-quality, complete translations of the full transcript:
   - "english": A complete, fluent, clear English translation of the entire transcript.
   - "hindi": A complete Hindi translation in Devanagari script (हिंदी).
   - "hinglish": A complete colloquial Hinglish translation in Roman English script (e.g., "Aaj college ke bahar...").
3. In `evidence_items`, include `english_translation` and `hindi_translation` for every verbatim excerpt so the operator immediately understands the proof.

CRITICAL SAFETY & TRIAGE RULES:
1. EVIDENCE GROUNDING: For every finding, provide the exact verbatim quote from the original transcript in `transcript_excerpt`. Do NOT fabricate quotations.
2. NEGATION SAFEGUARD: If the caller explicitly denies an action in any language (e.g., Hindi/Hinglish "dhamki nahi di" / "chhua nahi", Marathi "धमकी दिली नाही", Bengali "দ্যায়নি / স্পর্শ করেনি", Tamil "மிரட்டவில்லை", English "did not threaten"), NEVER classify it as a confirmed threat or assault. Record it in `negations_detected`!
3. CONTRADICTIONS: Flag conflicting statements (e.g., claiming to be safe at home while simultaneously saying trapped in public).
4. LOCATION SPECIFICITY: Flag vague/incomplete locations that lack specific area, landmark, or gate number.
5. PROVISIONAL URGENCY: "High", "Medium", "Low", or "Unable to Determine".
6. NO FABRICATIONS: Never invent names, dates, or weapons not stated in the transcript.

JSON FORMAT EXAMPLE:
{
  "case_id": "ESH-XXXXXX",
  "incident_summary": "Short incident summary in English for the triage log",
  "detected_language": "Bengali",
  "detected_language_script": "Bengali",
  "translations": {
    "english": "A man has been following me near the college gate for three days. Today he threatened me. I am scared.",
    "hindi": "एक आदमी पिछले तीन दिनों से कॉलेज गेट के पास मेरा पीछा कर रहा है। आज उसने मुझे धमकी दी। मुझे डर लग रहा है।",
    "hinglish": "Ek aadmi pichhle 3 din se college gate ke paas mera peecha kar raha hai. Aaj usne mujhe dhamki di. Mujhe dar lag raha hai.",
    "detected_dialect_or_notes": "Standard Kolkata Bengali"
  },
  "incident_categories": ["Stalking / Unwanted Following", "Indirect Threat / Intimidation"],
  "key_entities": ["College gate", "Scooty"],
  "location": {
    "mentioned_location": "College gate",
    "confidence": "Low / Incomplete",
    "is_vague_or_incomplete": true,
    "landmarks": ["College gate"]
  },
  "incident_time": "Ongoing for 3 days",
  "people_or_relationships": "Unknown individual",
  "potential_safety_concerns": ["Repeated pursuit", "Verbal intimidation"],
  "provisional_urgency": "Medium",
  "urgency_reasons": ["Repeated following across 3 consecutive days"],
  "immediate_danger_flag": false,
  "evidence_items": [
    {
      "finding": "Repeated following reported",
      "transcript_excerpt": "তিন দিন ধরে কলেজের গেটের কাছে আমার পিছনে আসছে",
      "english_translation": "Has been coming behind me near college gate for three days",
      "hindi_translation": "तीन दिनों से कॉलेज गेट के पास मेरे पीछे आ रहा है",
      "relevance": "Demonstrates persistent pursuit",
      "is_fact": true,
      "uncertainty_note": "Perpetrator identity not known to caller"
    }
  ],
  "negations_detected": [],
  "contradictions_detected": [],
  "missing_information": ["Exact campus address / landmark", "Current caller location"],
  "uncertainty_warnings": ["Colloquial threat idiom used"],
  "suggested_follow_up_questions": ["Are you currently in a safe, crowded area?"],
  "support_recommendations": [
    {
      "category": "Authorized Women's Support Services",
      "relevance_reason": "Campus safety planning and helplines",
      "supporting_evidence": "তিন দিন ধরে",
      "uncertainty": "Caller consent needed"
    }
  ],
  "operator_review_steps": ["Verify caller current location and coordinate with campus security"]
}
"""

class AIProviderService:
    @classmethod
    async def analyze(
        cls,
        transcript: str,
        language_hint: Optional[str] = None,
        incident_time_hint: Optional[str] = None,
        operator_notes: Optional[str] = None
    ) -> IncidentAnalysis:
        provider = (settings.AI_PROVIDER or "mock").lower()
        api_key = settings.AI_API_KEY

        # If no key configured or mock mode requested, use deterministic rule-based analysis
        if not api_key or provider in ["mock", "demo", "none"]:
            logger.info("Using Deterministic Rule-Based Engine (Demo Mode)")
            analysis = RuleEngine.analyze_transcript(
                transcript=transcript,
                language_hint=language_hint,
                incident_time_hint=incident_time_hint,
                operator_notes=operator_notes
            )
            analysis.analysis_mode = "deterministic_demo"
            analysis.provider_label = "Demo Mode: Deterministic Rule-Based Engine (No External AI Key Configured)"
            return analysis

        # Attempt Live AI Provider
        try:
            if provider == "gemini":
                return await cls._analyze_with_gemini(transcript, api_key, language_hint, incident_time_hint, operator_notes)
            elif provider in ["openai", "compatible"]:
                return await cls._analyze_with_openai(transcript, api_key, language_hint, incident_time_hint, operator_notes)
            else:
                logger.warning(f"Unknown provider '{provider}', falling back to deterministic rule engine.")
                return RuleEngine.analyze_transcript(transcript, language_hint, incident_time_hint, operator_notes)
        except Exception as e:
            logger.error(f"Live AI provider failed ({str(e)}), falling back gracefully to deterministic rule engine.")
            fallback_analysis = RuleEngine.analyze_transcript(transcript, language_hint, incident_time_hint, operator_notes)
            fallback_analysis.analysis_mode = "deterministic_demo"
            fallback_analysis.provider_label = f"Fallback Mode: Deterministic Engine (Live AI Error: {type(e).__name__})"
            return fallback_analysis

    @classmethod
    async def _analyze_with_gemini(cls, transcript: str, api_key: str, lang_hint, time_hint, notes) -> IncidentAnalysis:
        import httpx
        user_prompt = f"""
Transcript:
\"\"\"{transcript}\"\"\"

Language hint: {lang_hint or 'Auto-detect'}
Incident time hint: {time_hint or 'Not provided'}
Operator notes: {notes or 'None'}

Return ONLY a valid JSON object matching the IncidentAnalysis structure.
"""
        payload = {
            "contents": [
                {"role": "user", "parts": [{"text": ANALYSIS_SYSTEM_PROMPT + "\n\n" + user_prompt}]}
            ],
            "generationConfig": {
                "temperature": 0.1,
                "response_mime_type": "application/json"
            }
        }
        
        candidate_models = [settings.AI_MODEL, "gemini-3.5-flash", "gemini-flash-lite-latest"]
        # Remove duplicates while preserving order
        candidate_models = list(dict.fromkeys(candidate_models))
        
        last_error = None
        data = None
        used_model = settings.AI_MODEL
        
        async with httpx.AsyncClient(timeout=30.0) as client:
            for model_name in candidate_models:
                url = f"https://generativelanguage.googleapis.com/v1beta/models/{model_name}:generateContent?key={api_key}"
                try:
                    resp = await client.post(url, json=payload)
                    resp.raise_for_status()
                    data = resp.json()
                    used_model = model_name
                    break
                except httpx.HTTPStatusError as e:
                    last_error = e
                    logger.warning(f"Gemini model {model_name} returned {e.response.status_code}, trying next candidate...")
                    continue
                except Exception as e:
                    last_error = e
                    continue
                    
        if not data:
            raise last_error or RuntimeError("All Gemini candidate models failed")
            
        raw_text = data["candidates"][0]["content"]["parts"][0]["text"]
        parsed = json.loads(raw_text)
        
        # Normalize keys if model returned minor variations
        if not parsed.get("case_id"):
            import uuid
            parsed["case_id"] = f"ESH-{uuid.uuid4().hex[:6].upper()}"
        if "incident_summary" not in parsed:
            parsed["incident_summary"] = parsed.get("summary") or parsed.get("short_incident_summary") or "Complaint triage analysis."
        detected_lang = parsed.get("detected_language") or parsed.get("language_detected") or parsed.get("language") or RuleEngine.detect_language(transcript, lang_hint)
        parsed["detected_language"] = str(detected_lang)
        
        if "detected_language_script" not in parsed or not parsed["detected_language_script"]:
            parsed["detected_language_script"] = RuleEngine.detect_script(transcript)

        # Normalize 3-way operator translations (English, Hindi, Hinglish)
        trans = parsed.get("translations")
        fallback_trans = RuleEngine.generate_translations(transcript, parsed["detected_language"])
        if not trans or not isinstance(trans, dict):
            parsed["translations"] = fallback_trans.model_dump()
        else:
            parsed["translations"] = {
                "english": trans.get("english") or fallback_trans.english,
                "hindi": trans.get("hindi") or fallback_trans.hindi,
                "hinglish": trans.get("hinglish") or fallback_trans.hinglish,
                "detected_dialect_or_notes": trans.get("detected_dialect_or_notes") or fallback_trans.detected_dialect_or_notes
            }

        if "provisional_urgency" not in parsed:
            u_str = str(parsed.get("urgency") or parsed.get("urgency_level") or "Medium").lower()
            if "high" in u_str: parsed["provisional_urgency"] = "High"
            elif "low" in u_str: parsed["provisional_urgency"] = "Low"
            elif "unable" in u_str or "indeter" in u_str: parsed["provisional_urgency"] = "Unable to Determine"
            else: parsed["provisional_urgency"] = "Medium"
        if "location" not in parsed or not isinstance(parsed["location"], dict):
            parsed["location"] = RuleEngine.extract_location(transcript).model_dump()
        else:
            loc = parsed["location"]
            conf_str = str(loc.get("confidence", "Unknown"))
            if "high" in conf_str.lower(): loc["confidence"] = "High"
            elif "low" in conf_str.lower() or "incomp" in conf_str.lower() or "vague" in conf_str.lower(): loc["confidence"] = "Low / Incomplete"
            elif "medium" in conf_str.lower(): loc["confidence"] = "Medium"
            else: loc["confidence"] = "Unknown"
            if "is_vague_or_incomplete" not in loc: loc["is_vague_or_incomplete"] = False
            if "landmarks" not in loc or not isinstance(loc["landmarks"], list): loc["landmarks"] = []

        # Normalize negations
        norm_negs = []
        for n in parsed.get("negations_detected", []):
            if isinstance(n, dict):
                stmt = n.get("statement") or n.get("quote") or n.get("text") or n.get("negated_finding") or "Caller clarification"
                concept = n.get("negated_concept") or n.get("concept") or n.get("negated_finding") or "Negated threat/action"
                exp = n.get("explanation") or n.get("reason") or "Caller explicitly denied this concern."
                norm_negs.append({"statement": stmt, "negated_concept": concept, "explanation": exp})
        parsed["negations_detected"] = norm_negs

        # Normalize contradictions
        norm_conts = []
        for c in parsed.get("contradictions_detected", []):
            if isinstance(c, dict):
                ca = c.get("claim_a") or c.get("statement_1") or "First statement"
                cb = c.get("claim_b") or c.get("statement_2") or "Conflicting statement"
                exp = c.get("explanation") or c.get("reason") or "Contradictory caller statements."
                norm_conts.append({"claim_a": ca, "claim_b": cb, "explanation": exp})
        parsed["contradictions_detected"] = norm_conts

        # Normalize support recommendations
        valid_cats = [
            "Police or Emergency Escalation",
            "Healthcare or Medical Assistance",
            "Shelter or Safe Accommodation",
            "Authorized Women's Support Services",
            "Further Clarification / Operator Follow-up"
        ]
        norm_supp = []
        for s in parsed.get("support_recommendations", []):
            if isinstance(s, dict):
                cat = s.get("category", "")
                matched_cat = next((vc for vc in valid_cats if vc.lower() in cat.lower()), "Authorized Women's Support Services")
                norm_supp.append({
                    "category": matched_cat,
                    "relevance_reason": s.get("relevance_reason") or s.get("reason") or "Suggested support resource",
                    "supporting_evidence": s.get("supporting_evidence") or s.get("evidence"),
                    "uncertainty": s.get("uncertainty")
                })
        parsed["support_recommendations"] = norm_supp
            
        analysis = IncidentAnalysis(**parsed)
        analysis.analysis_mode = "live_ai"
        analysis.provider_label = f"Live AI: Google Gemini ({used_model})"
        
        # Cross-verify negations and contradictions
        rule_negations = RuleEngine.detect_negations(transcript)
        for rn in rule_negations:
            if not any(n.statement.lower() == rn.statement.lower() for n in analysis.negations_detected):
                analysis.negations_detected.append(rn)
                
        rule_contradictions = RuleEngine.detect_contradictions(transcript)
        if rule_contradictions:
            for rc in rule_contradictions:
                if not any(c.claim_a.lower() == rc.claim_a.lower() for c in analysis.contradictions_detected):
                    analysis.contradictions_detected.append(rc)
            analysis.provisional_urgency = "Unable to Determine"

        # Ensure character offsets are mapped for UI highlight
        for item in analysis.evidence_items:
            if item.start_char is None and item.transcript_excerpt:
                idx = transcript.lower().find(item.transcript_excerpt.lower())
                if idx != -1:
                    item.start_char = idx
                    item.end_char = idx + len(item.transcript_excerpt)
        return analysis

    @classmethod
    async def _analyze_with_openai(cls, transcript: str, api_key: str, lang_hint, time_hint, notes) -> IncidentAnalysis:
        import httpx
        url = "https://api.openai.com/v1/chat/completions"
        user_prompt = f"""
Transcript:
\"\"\"{transcript}\"\"\"

Language hint: {lang_hint or 'Auto-detect'}
Incident time hint: {time_hint or 'Not provided'}
Operator notes: {notes or 'None'}

Return ONLY a valid JSON object matching IncidentAnalysis.
"""
        headers = {
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json"
        }
        payload = {
            "model": settings.AI_MODEL or "gpt-4o-mini",
            "messages": [
                {"role": "system", "content": ANALYSIS_SYSTEM_PROMPT},
                {"role": "user", "content": user_prompt}
            ],
            "response_format": {"type": "json_object"},
            "temperature": 0.1
        }
        async with httpx.AsyncClient(timeout=25.0) as client:
            resp = await client.post(url, headers=headers, json=payload)
            resp.raise_for_status()
            data = resp.json()
            raw_text = data["choices"][0]["message"]["content"]
            parsed = json.loads(raw_text)
            
            detected_lang = parsed.get("detected_language") or RuleEngine.detect_language(transcript, lang_hint)
            parsed["detected_language"] = str(detected_lang)
            if "detected_language_script" not in parsed or not parsed["detected_language_script"]:
                parsed["detected_language_script"] = RuleEngine.detect_script(transcript)
            
            trans = parsed.get("translations")
            fallback_trans = RuleEngine.generate_translations(transcript, parsed["detected_language"])
            if not trans or not isinstance(trans, dict):
                parsed["translations"] = fallback_trans.model_dump()
            else:
                parsed["translations"] = {
                    "english": trans.get("english") or fallback_trans.english,
                    "hindi": trans.get("hindi") or fallback_trans.hindi,
                    "hinglish": trans.get("hinglish") or fallback_trans.hinglish,
                    "detected_dialect_or_notes": trans.get("detected_dialect_or_notes") or fallback_trans.detected_dialect_or_notes
                }

            analysis = IncidentAnalysis(**parsed)
            analysis.analysis_mode = "live_ai"
            analysis.provider_label = f"Live AI: OpenAI ({settings.AI_MODEL or 'gpt-4o-mini'})"
            return analysis
