import type { DemoCase } from '../types';

/**
 * Pre-configured synthetic demo scenarios for eSahaay across India's major spoken languages.
 * All transcripts are purely fictional and designed to test triage safeguards,
 * multi-lingual comprehension, negation detection, location completeness, and urgency triage.
 */
export const SYNTHETIC_DEMO_CASES: DemoCase[] = [
  {
    id: 'DEMO-001',
    title: 'Hinglish Stalking & Indirect Threat',
    category_hint: 'Stalking / Unwanted Following & Threat',
    language_hint: 'Hinglish',
    description: "Repeated unwanted following near college campus with an indirect verbal threat ('dekh lunga').",
    transcript: "Aaj college ke bahar bhi tha. Teesra din hai jab wo meri scooty ke peeche aa raha hai. Maine use bola 'kya problem hai' toh usne bola 'dekh lunga'. Mujhe dar lag raha hai kal subah aate waqt.",
    incident_time_hint: 'Today afternoon, ongoing for 3 days',
    operator_notes: 'Caller sounds anxious. Seeking advice before attending morning classes tomorrow.'
  },
  {
    id: 'DEMO-002',
    title: 'Hindi (हिंदी) Metro Station Following',
    category_hint: 'Stalking / Unwanted Following',
    language_hint: 'Hindi',
    description: 'Caller speaking in Hindi Devanagari reporting a persistent stalker outside Rajiv Chowk Metro Station.',
    transcript: 'नमस्ते, मैं राजीव चौक मेट्रो स्टेशन के गेट नंबर 4 के बाहर खड़ी हूं। एक अज्ञात व्यक्ति पिछले 20 मिनट से लगातार मेरा पीछा कर रहा है। वह बार-बार मेरे पास आने की कोशिश कर रहा है और मुझे असहज महसूस करा रहा है। मुझे घर जाने में डर लग रहा है।',
    incident_time_hint: 'Last 20 minutes',
    operator_notes: 'Location identified: Gate No 4 Rajiv Chowk. Advised caller to approach CISF/Delhi Police booth.'
  },
  {
    id: 'DEMO-003',
    title: 'Bengali (বাংলা) Stalking & Threat',
    category_hint: 'Stalking / Threat / Harassment',
    language_hint: 'Bengali',
    description: 'Caller speaking in Bengali reporting persistent motorcycle stalking after office hours near Salt Lake.',
    transcript: 'নমস্কার, আমি সল্টলেক করুণাময়ী বাস স্ট্যান্ডের কাছে দাঁড়িয়ে আছি। গত তিন দিন ধরে একটা ছেলে আমার অফিসের পর বাইকে করে পিছনে আসছে। আজ আমাকে অশোভন কথা বলে হুমকি দিয়েছে। খুব ভয় করছে।',
    incident_time_hint: 'Evening after office, ongoing 3 days',
    operator_notes: 'Operator translation required: Salt Lake Karunamoyee area, motorcycle pursuit.'
  },
  {
    id: 'DEMO-004',
    title: 'Marathi (मराठी) Bus Stand Stalking',
    category_hint: 'Stalking / Unwanted Following',
    language_hint: 'Marathi',
    description: 'Caller in Marathi reporting being trailed by an unknown man on a quiet street near Swargate Pune.',
    transcript: 'माझं नाव स्नेहा आहे, मी स्वारगेट बस स्टँडजवळ आहे. एक अनोळखी माणूस मागील अर्ध्या तासापासून माझा पाठलाग करत आहे. मी जिथे जाते तिथे तो मागे येतोय. रस्ता शांत आहे आणि मला खूप भीती वाटतेय, कृपया मदत पाठवा.',
    incident_time_hint: 'Past 30 minutes',
    operator_notes: 'Location: Near Swargate bus stand, Pune. Caller isolated.'
  },
  {
    id: 'DEMO-005',
    title: 'Tamil (தமிழ்) Late Night Intimidation',
    category_hint: 'Harassment / Waylaying',
    language_hint: 'Tamil',
    description: 'Caller in Tamil reporting two individuals attempting to block transit route near Koyambedu bus terminal.',
    transcript: 'வணக்கம், நான் கோயம்பேடு பஸ் நிலையத்துக்கு பக்கத்தில் நிற்கிறேன். இரண்டு நபர்கள் ஆட்டோவில் என்னை தொடர்ந்து வந்து கமெண்ட் அடிக்கிறார்கள். என்னை வீட்டுக்கு போக விடாமல் வழி மறிக்க பார்க்கிறார்கள். எனக்கு உடனடியாக உதவி வேண்டும்.',
    incident_time_hint: 'Current time, late night commute',
    operator_notes: 'Immediate safety assistance requested: Koyambedu area transit intercept.'
  },
  {
    id: 'DEMO-006',
    title: 'Telugu (తెలుగు) Hostel Corridor Following',
    category_hint: 'Stalking / Physical Reach Attempt',
    language_hint: 'Telugu',
    description: 'Caller in Telugu reporting persistent daily follower who attempted physical contact today near Madhapur.',
    transcript: 'హలో, నేను మాదాపూర్ మెట్రో స్టేషన్ సమీపంలో ఉన్నాను. కాలేజ్ హాస్టల్ వెళ్లే దారిలో ఒక వ్యక్తి ప్రతిరోజూ నన్ను ఫాలో అవుతూ వేధిస్తున్నాడు. ఈరోజు నా చేయి పట్టుకోవడానికి ప్రయత్నించాడు. దయచేసి ఎవరైనా పెట్రోలింగ్ పోలీసులను పంపండి.',
    incident_time_hint: 'Today evening, ongoing harassment',
    operator_notes: 'Caller reports physical reach attempt. Escalate to local She Team / Hyderabad patrol.'
  },
  {
    id: 'DEMO-007',
    title: 'Punjabi (ਪੰਜਾਬੀ) Market Transit Stalking',
    category_hint: 'Stalking / Intimidation',
    language_hint: 'Punjabi',
    description: 'Caller in Punjabi describing two individuals in a car repeatedly tailing her scooty and attempting vehicle cut-off.',
    transcript: 'ਸਤਿ ਸ੍ਰੀ ਅਕਾਲ, ਮੈਂ ਮਾਡਲ ਟਾਊਨ ਮਾਰਕੀਟ ਲੁਧਿਆਣਾ ਵਿੱਚ ਹਾਂ। ਇੱਕ ਕਾਰ ਵਿੱਚ ਦੋ ਲੜਕੇ ਪਿਛਲੇ ਦੋ ਦਿਨਾਂ ਤੋਂ ਮੇਰਾ ਪਿੱਛਾ ਕਰ ਰਹੇ ਹਨ ਅਤੇ ਅਵਾਜ਼ਾਂ ਕੱਸ ਰਹੇ ਹਨ। ਅੱਜ ਉਹਨਾਂ ਨੇ ਮੇਰੀ ਸਕੂਟੀ ਅੱਗੇ ਗੱਡੀ ਲਗਾਉਣ ਦੀ ਕੋਸ਼ਿਸ਼ ਕੀਤੀ। ਮੈਨੂੰ ਤੁਰੰਤ ਮਦਦ ਚਾਹੀਦੀ ਹੈ।',
    incident_time_hint: 'Ongoing 2 days, active pursuit',
    operator_notes: 'Vehicle intercept attempt in Model Town Ludhiana. High concern.'
  },
  {
    id: 'DEMO-008',
    title: 'Gujarati (ગુજરાતી) Campus Harassment',
    category_hint: 'Stalking / Verbal Threat',
    language_hint: 'Gujarati',
    description: 'Caller in Gujarati reporting repeat motorcycle stalker who attempted to intercept and threatened her.',
    transcript: 'નમસ્તે, હું નવરંગપુરા કોલેજ પાસે ઊભી છું. એક છોકરો બાઇક પર છેલ્લા ત્રણ દિવસથી મારી પાછળ આવી રહ્યો છે. આજે તેણે રસ્તામાં મને રોકવાની કોશિશ કરી અને ધમકી આપી. મને ખૂબ ડર લાગે છે, પ્લીઝ હેલ્પ મોકલો.',
    incident_time_hint: 'Last 3 days, today afternoon',
    operator_notes: 'Campus boundary incident, Navrangpura Ahmedabad.'
  },
  {
    id: 'DEMO-009',
    title: 'Incomplete Location & Low Phone Battery',
    category_hint: 'Suspicious Follower / Incomplete Location',
    language_hint: 'Hinglish',
    description: "Vague location description ('red building near metro') with dwindling phone battery.",
    transcript: 'Hello, main ek red building ke paas khadi hoon metro station ke paas. Koi aadmi pichle 15 minute se ajeeb tarike se follow kar raha hai. Yahan street light bahut kam hai aur phone battery bhi 5% hai. Jaldi help chahiye.',
    incident_time_hint: 'Last 15 minutes',
    operator_notes: 'Critical: need specific metro station name and landmark immediately.'
  },
  {
    id: 'DEMO-010',
    title: 'Urgent Active Danger / Forced Intrusion',
    category_hint: 'Intrusion Threat / Immediate Danger',
    language_hint: 'Hinglish',
    description: 'Aggressive individual attempting to force entry into caller\'s home with active verbal threats.',
    transcript: 'Emergency! Mere flat ke bahar koi darwaza zor zor se peet raha hai aur gaaliyan de raha hai. Wo keh raha hai darwaza tod kar ghus jayega. Main bedroom mein locked hoon, please police ya PCR bhejo abhi!',
    incident_time_hint: 'Right now (Active)',
    operator_notes: 'Immediate safety protocol: Advised caller to stay in locked room; escalate to police dispatch.'
  },
  {
    id: 'DEMO-011',
    title: 'Negation Safeguard: Explicitly Denied Threat',
    category_hint: 'Persistent Loitering / Denied Threat',
    language_hint: 'Hinglish',
    description: 'Caller describes uncomfortable loitering but explicitly clarifies that NO threat was made and NO physical touch occurred.',
    transcript: 'Ek ladka bus stop pe roz ghoorta hai aur pass khade hone ki koshish karta hai. Lekin usne mujhe koi dhamki nahi di hai aur na hi physical chhua hai. Koi hathiyar bhi nahi tha. Bas uncomfortable lagta hai aur preventive complaint karni hai.',
    incident_time_hint: 'Daily routine, bus commute',
    operator_notes: 'Verification test: Ensure engine does not classify as violent threat due to keyword dhamki.'
  },
  {
    id: 'DEMO-012',
    title: 'Contradiction / Ambiguity Safeguard',
    category_hint: 'Conflicting Location Statements',
    language_hint: 'Hinglish',
    description: 'Caller makes contradictory statements about their immediate location, needing human clarification.',
    transcript: 'Main abhi apne ghar par safe hoon. Par wo aadmi metro station ke platform number 2 pe abhi bhi mera intezar kar raha hai aur main wahi seedhiyon ke paas phasi hui hoon. Bahut confusion ho raha hai.',
    incident_time_hint: 'Current time',
    operator_notes: 'Contradiction flagged: Caller states ghar par safe hoon then platform number 2 pe phasi hui hoon.'
  }
];
