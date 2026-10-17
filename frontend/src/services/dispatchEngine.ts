/**
 * eSahaay Emergency Measurement, Dispatch Decision Engine,
 * Nearby Field Units Radar, and Situational Question Assistant
 */

import type {
  DispatchDecision,
  NearbyEmergencyUnit,
  SituationalQuestion,
  UrgencyLevel,
  DispatchServiceType
} from '../types';

export interface EmergencyMeasurementResult {
  threatScore: number; // 0 - 100
  urgencyLevel: UrgencyLevel;
  primaryService: DispatchServiceType;
  decisions: DispatchDecision[];
  metrics: {
    lifeThreatScore: number;
    physicalViolenceScore: number;
    medicalTraumaScore: number;
    fireHazardScore: number;
    shelterNeedScore: number;
    perpetratorProximityScore: number;
  };
  summary: string;
}

export const dispatchEngine = {
  /**
   * Evaluates situation and decides dispatch recommendations for all 6 services:
   * Medical, Ambulance, Police, Fire, NGO, Shelter
   */
  evaluateEmergencyMeasurement(
    transcript: string,
    categories: string[] = [],
    provisionalUrgency: UrgencyLevel = 'Medium',
    immediateDanger: boolean = false
  ): EmergencyMeasurementResult {
    const text = transcript.toLowerCase();

    // Check specific conditions
    const hasActiveIntrusion = /darwaza|door|peet|ghus|break|tod|bedroom|locked/.test(text);
    const hasPhysicalInjury = /blood|chot|injury|fracture|pain|haath|dhakka|wound|bleeding|hospital/.test(text);
    const hasFire = /aag|fire|dhuwan|smoke|burn|cylinder|blast|flame|trapped/.test(text);
    const hasStalking = /follow|peeche|scooty|bike|car|roz|teesra din|intezar|wait/.test(text);
    const hasDomesticAbuse = /pati|husband|domestic|maar|sharab|ghar se nikal|abuse|estranged/.test(text);
    const hasWeapon = /chaku|knife|gun|hathiyar|weapon|blade/.test(text) && !/nahi|not|no/.test(text);
    const hasImminentThreat = /dekh lunga|mar dunga|threat|kill|jan se/.test(text) && !/dhamki nahi di/.test(text);

    // Compute component metrics
    let lifeThreatScore = 25;
    let physicalViolenceScore = 20;
    let medicalTraumaScore = 10;
    let fireHazardScore = 5;
    let shelterNeedScore = 15;
    let proximityScore = 30;

    if (immediateDanger || hasActiveIntrusion) {
      lifeThreatScore = Math.max(lifeThreatScore, 90);
      physicalViolenceScore = Math.max(physicalViolenceScore, 95);
      proximityScore = 95;
    }
    if (hasWeapon) {
      lifeThreatScore = Math.max(lifeThreatScore, 95);
      physicalViolenceScore = Math.max(physicalViolenceScore, 90);
    }
    if (hasPhysicalInjury) {
      medicalTraumaScore = 88;
      lifeThreatScore = Math.max(lifeThreatScore, 75);
    }
    if (hasFire) {
      fireHazardScore = 98;
      lifeThreatScore = 92;
    }
    if (hasDomesticAbuse) {
      shelterNeedScore = 92;
      physicalViolenceScore = Math.max(physicalViolenceScore, 70);
    }
    if (hasStalking) {
      proximityScore = Math.max(proximityScore, 75);
      physicalViolenceScore = Math.max(physicalViolenceScore, 65);
    }

    // Overall Threat Score
    let overallThreat = Math.max(
      lifeThreatScore,
      physicalViolenceScore * 0.9,
      medicalTraumaScore * 0.85,
      fireHazardScore * 0.95,
      shelterNeedScore * 0.8
    );
    overallThreat = Math.min(99, Math.round(overallThreat));

    // Determine 6 service decisions
    const decisions: DispatchDecision[] = [
      // 1. Police (112 / PCR)
      {
        service: 'police',
        serviceName: 'Police (112 PCR Van / Patrol)',
        status: (immediateDanger || hasActiveIntrusion || hasWeapon || hasStalking || hasImminentThreat || categories.includes('Stalking / Unwanted Following') || categories.includes('Active Intrusion / Violence Risk'))
          ? 'RECOMMENDED'
          : (hasDomesticAbuse ? 'STANDBY' : 'NOT_REQUIRED'),
        urgency: (immediateDanger || hasActiveIntrusion || hasWeapon) ? 'IMMEDIATE' : (hasStalking ? 'HIGH' : 'ROUTINE'),
        reason: hasActiveIntrusion
          ? 'Perpetrator attempting forced entry into residence; immediate armed PCR unit required for physical containment.'
          : (hasStalking
            ? 'Persistent pursuit reported; nearest PCR patrolling vehicle needed for interception and victim safe escort.'
            : (hasWeapon
              ? 'Perpetrator reported in possession of weapon. Emergency police response protocol activated.'
              : 'Standby for preventive patrolling or statement recording.')),
        dispatched: false,
      },

      // 2. Ambulance (108 CATS)
      {
        service: 'ambulance',
        serviceName: 'Ambulance (108 Emergency Medical Service)',
        status: (hasPhysicalInjury || hasFire || text.includes('ambulance') || categories.includes('Physical Injury / Medical Concern'))
          ? 'RECOMMENDED'
          : (immediateDanger ? 'STANDBY' : 'NOT_REQUIRED'),
        urgency: (hasPhysicalInjury || hasFire) ? 'IMMEDIATE' : 'ROUTINE',
        reason: hasPhysicalInjury
          ? 'Active physical injury, trauma, or bleeding reported by caller. Advanced Life Support ambulance required.'
          : (hasFire
            ? 'Structure fire with potential smoke inhalation and burn risk. Ambulance dispatched on scene.'
            : 'On standby for secondary triage support if caller health deteriorates.'),
        dispatched: false,
      },

      // 3. Medical (Hospital Emergency / Trauma Team)
      {
        service: 'medical',
        serviceName: 'Medical (Hospital Casualty & Trauma Ward)',
        status: (hasPhysicalInjury || text.includes('fracture') || text.includes('blood') || text.includes('hospital'))
          ? 'RECOMMENDED'
          : (hasFire ? 'STANDBY' : 'NOT_REQUIRED'),
        urgency: hasPhysicalInjury ? 'IMMEDIATE' : 'ROUTINE',
        reason: hasPhysicalInjury
          ? 'Direct bodily trauma requiring immediate hospital casualty intimation, X-ray, and medico-legal documentation.'
          : 'Emergency casualty ward alerted on standby for potential burn or respiratory patient intake.',
        dispatched: false,
      },

      // 4. Fire (101 Fire Tender)
      {
        service: 'fire',
        serviceName: 'Fire (101 Fire Tender & Rescue Unit)',
        status: hasFire ? 'RECOMMENDED' : 'NOT_REQUIRED',
        urgency: hasFire ? 'IMMEDIATE' : 'NONE',
        reason: hasFire
          ? 'Active fire, smoke entrapment, or gas hazard detected. Immediate hydraulic tender dispatch required.'
          : 'No fire or environmental hazardous materials reported in caller transcript.',
        dispatched: false,
      },

      // 5. NGO (Sakhi One Stop Centre / Women Legal Cell)
      {
        service: 'ngo',
        serviceName: 'NGO (Sakhi One Stop Crisis Centre & Legal Cell)',
        status: (hasDomesticAbuse || hasStalking || categories.includes('Domestic Concern') || categories.includes('Stalking / Unwanted Following') || categories.includes('Harassment / Loitering'))
          ? 'RECOMMENDED'
          : 'STANDBY',
        urgency: hasDomesticAbuse ? 'HIGH' : 'ROUTINE',
        reason: hasDomesticAbuse
          ? 'Domestic violence crisis requiring immediate psychological counseling, case worker accompaniment, and legal aid.'
          : 'Counselor follow-up for safety planning and victim support.',
        dispatched: false,
      },

      // 6. Shelter (Swadhar Greh / Safe Short-Stay Sanctuary)
      {
        service: 'shelter',
        serviceName: 'Shelter (Swadhar Greh / Safe Refuge)',
        status: (hasDomesticAbuse || text.includes('ghar se nikal') || text.includes('sheelter') || text.includes('shelter') || text.includes('beghar'))
          ? 'RECOMMENDED'
          : (immediateDanger ? 'STANDBY' : 'NOT_REQUIRED'),
        urgency: hasDomesticAbuse ? 'HIGH' : 'ROUTINE',
        reason: hasDomesticAbuse
          ? 'Caller thrown out of residence or facing domestic peril with dependent child. Safe refuge intake required.'
          : 'Safe emergency accommodation on standby if residence cannot be secured.',
        dispatched: false,
      },
    ];

    // Determine primary service
    let primaryService: DispatchServiceType = 'police';
    if (hasFire) primaryService = 'fire';
    else if (hasPhysicalInjury) primaryService = 'ambulance';
    else if (hasDomesticAbuse && !hasActiveIntrusion) primaryService = 'shelter';

    // Urgency level alignment
    let calculatedUrgency: UrgencyLevel = provisionalUrgency;
    if (overallThreat >= 85 || immediateDanger || hasFire || hasActiveIntrusion) {
      calculatedUrgency = 'High';
    } else if (overallThreat >= 50) {
      calculatedUrgency = 'Medium';
    } else {
      calculatedUrgency = 'Low';
    }

    const summary = `Threat Index: ${overallThreat}/100 [${calculatedUrgency}]. Primary Dispatch: ${primaryService.toUpperCase()}. Active service requirements: ${decisions.filter(d => d.status === 'RECOMMENDED').map(d => d.serviceName.split(' ')[0]).join(', ')}.`;

    return {
      threatScore: overallThreat,
      urgencyLevel: calculatedUrgency,
      primaryService,
      decisions,
      metrics: {
        lifeThreatScore,
        physicalViolenceScore,
        medicalTraumaScore,
        fireHazardScore,
        shelterNeedScore,
        perpetratorProximityScore: proximityScore,
      },
      summary,
    };
  },

  /**
   * Generates localized emergency units (PCR, Ambulance, Fire, Hospital, Shelter, NGO)
   * dynamically positioned near the victim's location.
   */
  getNearbyEmergencyUnits(locationText: string = ''): NearbyEmergencyUnit[] {
    const loc = locationText.toLowerCase();

    // Baseline area anchor
    let areaName = 'Munirka / South Delhi';
    let baseStation = 'Bhikaji Cama / Vasant Vihar';

    if (loc.includes('rajiv chowk') || loc.includes('connaught') || loc.includes('cp')) {
      areaName = 'Connaught Place / Central Delhi';
      baseStation = 'Barakhamba Road';
    } else if (loc.includes('salt lake') || loc.includes('karunamoyee') || loc.includes('kolkata')) {
      areaName = 'Salt Lake Sector II, Kolkata';
      baseStation = 'Bidhannagar East';
    } else if (loc.includes('swargate') || loc.includes('pune')) {
      areaName = 'Swargate Bus Terminal, Pune';
      baseStation = 'Swargate Police Division';
    } else if (loc.includes('koyambedu') || loc.includes('chennai')) {
      areaName = 'Koyambedu CMBT, Chennai';
      baseStation = 'Koyambedu Traffic & Law Order';
    } else if (loc.includes('madhapur') || loc.includes('hyderabad')) {
      areaName = 'Madhapur Metro Corridor, Hyderabad';
      baseStation = 'Cyberabad Commission';
    } else if (loc.includes('model town') || loc.includes('ludhiana')) {
      areaName = 'Model Town Market, Ludhiana';
      baseStation = 'Model Town Police Station';
    } else if (loc.includes('hauz khas')) {
      areaName = 'Hauz Khas Village & Metro, Delhi';
      baseStation = 'Hauz Khas Beat Patrol';
    } else if (loc.includes('rohini')) {
      areaName = 'Rohini Sector 14, North Delhi';
      baseStation = 'Rohini South Station';
    } else if (loc.includes('noida')) {
      areaName = 'Noida Sector 18 Commercial Hub';
      baseStation = 'Sector 20 Police Station';
    }

    return [
      // Police Units
      {
        id: 'unit-pcr-1',
        serviceType: 'police',
        name: `PCR Van Eagle-04 (${areaName})`,
        unitCode: 'PCR-DL-1C-4921',
        vehicleType: 'Innova Emergency Response Vehicle',
        distanceKm: 0.8,
        etaMinutes: 3,
        status: 'available',
        contactNumber: 'VHF Ch. 4 / +91 98711 00112',
        stationName: `${baseStation} Police Post`,
        specialization: 'Rapid Interception & Women Safety Patrol',
      },
      {
        id: 'unit-pcr-2',
        serviceType: 'police',
        name: `Women Helpdesk Patrol Cheetah-09`,
        unitCode: 'PCR-DL-1C-8812',
        vehicleType: 'Mahindra Scorpio Emergency Patrol',
        distanceKm: 1.4,
        etaMinutes: 5,
        status: 'available',
        contactNumber: 'VHF Ch. 4 / +91 98711 00119',
        stationName: `${baseStation} Women Desk`,
        specialization: 'Women Officer Escort & Physical Intervention',
      },

      // Ambulance Units
      {
        id: 'unit-amb-1',
        serviceType: 'ambulance',
        name: '108 CATS Advanced Life Support (ALS-31)',
        unitCode: 'AMB-108-DL-31',
        vehicleType: 'Force Traveller ALS (Oxygen + Defibrillator)',
        distanceKm: 1.1,
        etaMinutes: 4,
        status: 'available',
        contactNumber: '108 Direct / +91 98114 10831',
        stationName: `CATS Central Emergency Standby (${areaName})`,
        specialization: 'Trauma Life Support & Paramedic Resuscitation',
      },
      {
        id: 'unit-amb-2',
        serviceType: 'ambulance',
        name: 'Red Cross Rapid Ambulance BLS-14',
        unitCode: 'AMB-RC-DL-14',
        vehicleType: 'Maruti Eeco Basic Life Support',
        distanceKm: 2.3,
        etaMinutes: 7,
        status: 'available',
        contactNumber: '+91 98114 99014',
        stationName: 'Sub-District Health Standby',
        specialization: 'Basic First Aid & Emergency Hospital Transit',
      },

      // Fire Units
      {
        id: 'unit-fire-1',
        serviceType: 'fire',
        name: 'Delhi Fire Service Water Tender #04',
        unitCode: 'DFS-WT-04',
        vehicleType: 'Heavy Water Tender & Foam Monitor',
        distanceKm: 1.7,
        etaMinutes: 6,
        status: 'available',
        contactNumber: '101 Direct / 011-23412222',
        stationName: `${baseStation} Fire Post`,
        specialization: 'Structural Fire Extinguishing & Smoke Ventilation',
      },
      {
        id: 'unit-fire-2',
        serviceType: 'fire',
        name: 'Hydraulic Platform Rescue Tender #02',
        unitCode: 'DFS-HPT-02',
        vehicleType: 'Bronto Skylift 55m Hydraulic Crane',
        distanceKm: 3.2,
        etaMinutes: 10,
        status: 'available',
        contactNumber: '011-23414444',
        stationName: 'Divisional Fire Headquarters',
        specialization: 'High-Rise Ladder Rescue & Evacuation',
      },

      // Medical Center
      {
        id: 'unit-med-1',
        serviceType: 'medical',
        name: 'Government Emergency Trauma Centre & Casualty',
        unitCode: 'HOSP-TRAUMA-01',
        vehicleType: 'Level-1 Emergency Trauma Ward',
        distanceKm: 1.9,
        etaMinutes: 6,
        status: 'available',
        contactNumber: 'Casualty: 011-26165060 (Ext 102)',
        stationName: `Apex Medical Casualty (${areaName})`,
        specialization: '24/7 Medico-Legal Care, Surgical Casualty & ICU',
      },

      // NGO & Crisis Center
      {
        id: 'unit-ngo-1',
        serviceType: 'ngo',
        name: 'Sakhi One Stop Crisis Centre (OSC)',
        unitCode: 'NGO-SAKHI-01',
        vehicleType: 'Mobile Crisis Intervention Van',
        distanceKm: 1.3,
        etaMinutes: 5,
        status: 'available',
        contactNumber: 'Helpline: 181 / +91 98110 55181',
        stationName: 'Ministry of WCD Sakhi Centre',
        specialization: 'Legal Aid, Psycho-Social Counseling & Police Liaison',
      },

      // Shelter
      {
        id: 'unit-shelter-1',
        serviceType: 'shelter',
        name: 'Swadhar Greh Emergency Safe Refuge for Women',
        unitCode: 'SHELTER-SWD-03',
        vehicleType: 'Secured Safe Stay Home',
        distanceKm: 1.6,
        etaMinutes: 6,
        status: 'available',
        contactNumber: 'Care Desk: 011-26881144',
        stationName: `Swadhar Sanctuary (${areaName})`,
        specialization: 'Safe Night Shelter, Food, Medical Support (6 Beds Free)',
      },
    ];
  },

  /**
   * Generates situational questions to ask the victim based on the live call context
   */
  getSituationalQuestions(
    transcript: string,
    categories: string[] = [],
    immediateDanger: boolean = false
  ): SituationalQuestion[] {
    const text = transcript.toLowerCase();
    const questions: SituationalQuestion[] = [];

    // Safety & Whisper questions (if danger/stalker nearby)
    if (immediateDanger || text.includes('peet') || text.includes('door') || text.includes('dar')) {
      questions.push({
        id: 'q-safety-1',
        category: 'safety',
        questionEn: 'Can you speak freely right now, or should I only ask you questions you can answer with Yes or No?',
        questionHi: 'क्या आप इस समय खुलकर बात कर सकती हैं, या मुझे ऐसे सवाल पूछने चाहिए जिनका उत्तर आप सिर्फ "हाँ" या "ना" में दे सकें?',
        isAsked: false,
        priority: 'critical',
      });
      questions.push({
        id: 'q-safety-2',
        category: 'safety',
        questionEn: 'Are you currently inside a secured room with the bolt or latch firmly locked from inside?',
        questionHi: 'क्या आप इस समय किसी कमरे के अंदर हैं और दरवाज़े की कुंडी अंदर से अच्छी तरह बंद है?',
        isAsked: false,
        priority: 'critical',
      });
    }

    if (categories.includes('Domestic Concern') || text.includes('husband') || text.includes('pati') || text.includes('sharab')) {
      questions.push({
        id: 'q-dom-1',
        category: 'safety',
        questionEn: 'Are there any dependent children or family members with you right now who also need immediate safe shelter?',
        questionHi: 'क्या आपके साथ कोई छोटे बच्चे या परिवार के सदस्य भी हैं जिन्हें तत्काल सुरक्षित शेल्टर की आवश्यकता है?',
        isAsked: false,
        priority: 'high',
      });
    }

    // Location pinpointing questions
    if (!text.includes('gate') && !text.includes('sector') && !text.includes('pillar')) {
      questions.push({
        id: 'q-loc-1',
        category: 'location',
        questionEn: 'Can you see any shop board, landmark, street pole number, or metro pillar number nearby?',
        questionHi: 'क्या आपको आसपास कोई दुकान का बोर्ड, लैंडमार्क, खंभा नंबर या मेट्रो पिलर नंबर दिखाई दे रहा है?',
        isAsked: false,
        priority: 'high',
      });
      questions.push({
        id: 'q-loc-2',
        category: 'location',
        questionEn: 'Are you standing on the main road, or are you in an interior alley or bus stop?',
        questionHi: 'क्या आप मुख्य सड़क पर हैं, या किसी अंदरूनी गली अथवा बस स्टैंड के पास हैं?',
        isAsked: false,
        priority: 'high',
      });
    }

    // Medical & physical trauma
    if (text.includes('blood') || text.includes('chot') || text.includes('pain') || text.includes('hath') || text.includes('mar')) {
      questions.push({
        id: 'q-med-1',
        category: 'medical',
        questionEn: 'Are you experiencing any physical bleeding, fractures, or difficulty breathing right now?',
        questionHi: 'क्या आपको कहीं से खून बह रहा है, फ्रैक्चर की आशंका है, या सांस लेने में तकलीफ़ हो रही है?',
        isAsked: false,
        priority: 'critical',
      });
      questions.push({
        id: 'q-med-2',
        category: 'medical',
        questionEn: 'Do you need an emergency ambulance to meet you immediately at the exact location?',
        questionHi: 'क्या आपको मौके पर तुरंत आपातकालीन एम्बुलेंस की आवश्यकता है?',
        isAsked: false,
        priority: 'high',
      });
    }

    // Perpetrator & description
    if (text.includes('follow') || text.includes('bike') || text.includes('car') || text.includes('ladka')) {
      questions.push({
        id: 'q-perp-1',
        category: 'perpetrator',
        questionEn: 'Do you know this person by name or relation, or is he an unknown individual?',
        questionHi: 'क्या आप इस व्यक्ति को नाम या किसी रिश्ते से जानती हैं, या यह कोई पूरी तरह अज्ञात व्यक्ति है?',
        isAsked: false,
        priority: 'high',
      });
      questions.push({
        id: 'q-perp-2',
        category: 'perpetrator',
        questionEn: 'Can you note down the vehicle color, model, or license plate digits safely without looking at him directly?',
        questionHi: 'क्या आप बिना सीधे देखे, उस गाड़ी का रंग, मॉडल या नंबर प्लेट के कुछ अंक नोट कर सकती हैं?',
        isAsked: false,
        priority: 'recommended',
      });
    }

    // Phone & companion check
    if (text.includes('battery') || text.includes('phone') || text.includes('dark')) {
      questions.push({
        id: 'q-bat-1',
        category: 'general',
        questionEn: 'Your battery might run out soon. Do you have an alternate companion or family number we can call?',
        questionHi: 'आपकी फोन बैटरी खत्म हो सकती है; क्या आपके पास किसी परिचित या परिवार का दूसरा नंबर है जिस पर हम संपर्क कर सकें?',
        isAsked: false,
        priority: 'high',
      });
    }

    // Default safety questions if list is short
    if (questions.length < 3) {
      questions.push({
        id: 'q-gen-1',
        category: 'safety',
        questionEn: 'Is there any public shop, security guard booth, or well-lit area nearby where you can step inside safely?',
        questionHi: 'क्या आसपास कोई खुली दुकान, सिक्योरिटी गार्ड बूथ या रोशनी वाली जगह है जहां आप सुरक्षित जा सकें?',
        isAsked: false,
        priority: 'high',
      });
      questions.push({
        id: 'q-gen-2',
        category: 'general',
        questionEn: 'Has this individual approached you or threatened you before today?',
        questionHi: 'क्या इस व्यक्ति ने आज से पहले भी आपका पीछा किया है या कोई धमकी दी है?',
        isAsked: false,
        priority: 'recommended',
      });
    }

    return questions;
  }
};
