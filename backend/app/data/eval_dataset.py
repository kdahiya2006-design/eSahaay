"""
Ground-truth labeled synthetic dataset for evaluating eSahaay.
Contains distinct edge-cases across Hindi, English, and Hinglish.
Ground-truth fields are used to objectively calculate precision, recall,
accuracy, confusion matrix, and under-triage risks.
"""

from typing import List, Dict, Any

EVALUATION_DATASET: List[Dict[str, Any]] = [
    {
        "id": "EVAL-001",
        "name": "Repeated Following with Indirect Threat",
        "transcript": "Aaj college ke bahar bhi tha. Teesra din hai jab wo meri scooty ke peeche aa raha hai. Maine bola kya chahiye toh usne bola dekh lunga. Kal aao fir pata chalega.",
        "expected_urgency": "Medium",
        "expected_categories": ["Stalking / Unwanted Following", "Indirect Threat"],
        "expected_negation": False,
        "expected_contradiction": False,
        "expected_location_incomplete": True, # 'college ke bahar' without college name
        "has_medical_concern": False,
        "notes": "Classic indirect intimidation without immediate active breach"
    },
    {
        "id": "EVAL-002",
        "name": "Immediate Active Physical Intrusion",
        "transcript": "Emergency! Mere flat ke bahar koi darwaza zor se peet raha hai aur gaaliyan de raha hai. Wo keh raha hai darwaza tod kar ghus jayega. Main bedroom mein locked hoon, please police bhejo abhi!",
        "expected_urgency": "High",
        "expected_categories": ["Active Intrusion / Violence", "Physical Threat"],
        "expected_negation": False,
        "expected_contradiction": False,
        "expected_location_incomplete": True, # 'mere flat' without address
        "has_medical_concern": False,
        "notes": "High urgency active danger case. Must not be under-triaged."
    },
    {
        "id": "EVAL-003",
        "name": "Explicitly Denied Threat (Negation Guard)",
        "transcript": "Ek ladka bus stop pe roz ghoorta hai aur pass khada hota hai. Lekin usne mujhe koi dhamki nahi di aur na hi mujhe chhua hai. Koi hathiyar bhi nahi tha. Bas uncomfortable lagta hai.",
        "expected_urgency": "Low",
        "expected_categories": ["Harassment / Loitering"],
        "expected_negation": True, # Contains 'dhamki nahi di', 'chhua nahi', 'hathiyar nahi tha'
        "expected_contradiction": False,
        "expected_location_incomplete": True,
        "has_medical_concern": False,
        "notes": "Keywords 'dhamki' & 'hathiyar' are present but negated; urgency must not be High."
    },
    {
        "id": "EVAL-004",
        "name": "Incomplete Location with Immediate Apprehension",
        "transcript": "Main ek red building ke paas khadi hoon metro ke paas. Koi aadmi pichle 15 minute se follow kar raha hai. Yahan andhera hai aur phone battery khatam hone wali hai. Please send someone.",
        "expected_urgency": "High",
        "expected_categories": ["Stalking / Unwanted Following", "Vulnerable Location"],
        "expected_negation": False,
        "expected_contradiction": False,
        "expected_location_incomplete": True,
        "has_medical_concern": False,
        "notes": "Incomplete location coupled with active darkness, isolation, and dead battery."
    },
    {
        "id": "EVAL-005",
        "name": "Contradictory Location Statement",
        "transcript": "Main abhi ghar par aaram se baithi hoon. Par wo ladka college canteen ke bahar mujhe gher ke khada hai aur main bahar nahi nikal pa rahi hoon.",
        "expected_urgency": "Unable to Determine",
        "expected_categories": ["Harassment"],
        "expected_negation": False,
        "expected_contradiction": True, # 'ghar par' vs 'college canteen ke bahar gher ke khada hai main bahar nahi nikal pa rahi'
        "expected_location_incomplete": True,
        "has_medical_concern": False,
        "notes": "Direct contradiction makes physical safety state indeterminate until operator calls back."
    },
    {
        "id": "EVAL-006",
        "name": "Physical Assault Requiring Medical Aid",
        "transcript": "Mere pati ne mujhe kitchen mein push kiya aur mere haath se blood nikal raha hai. I need medical help immediately. Please send an ambulance or first aid team.",
        "expected_urgency": "High",
        "expected_categories": ["Domestic Violence", "Physical Assault"],
        "expected_negation": False,
        "expected_contradiction": False,
        "expected_location_incomplete": True,
        "has_medical_concern": True, # Medical aid explicitly needed
        "notes": "Must recommend Healthcare or Medical Assistance immediately."
    },
    {
        "id": "EVAL-007",
        "name": "Fragmented Hinglish Cyber Harassment",
        "transcript": "Instagram pe unknown account fake pictures post kar raha hai mere naam se. Messages bhi bheje par koi call nahi kiya. Block kiya toh naya account bana liya.",
        "expected_urgency": "Low",
        "expected_categories": ["Cyber Harassment / Defamation"],
        "expected_negation": True, # 'koi call nahi kiya'
        "expected_contradiction": False,
        "expected_location_incomplete": False, # Online incident
        "has_medical_concern": False,
        "notes": "Digital harassment without imminent physical harm; Low urgency for physical escalation."
    },
    {
        "id": "EVAL-008",
        "name": "Vague Incoherent Fragmented Complaint",
        "transcript": "Bahut ajeeb log hain... kal pata nahi... sab kuch ajeeb ho raha hai... suniye please.",
        "expected_urgency": "Unable to Determine",
        "expected_categories": ["Unspecified Concern"],
        "expected_negation": False,
        "expected_contradiction": False,
        "expected_location_incomplete": True,
        "has_medical_concern": False,
        "notes": "Highly fragmented, lacks timeline, location, identities, or specific offense."
    },
    {
        "id": "EVAL-009",
        "name": "Past Workplace Harassment with Specific Details",
        "transcript": "My manager at ABC Tech Connaught Place made inappropriate remarks during our review meeting yesterday at 4 PM. He did not physically touch me or threaten me, but made lewd suggestions.",
        "expected_urgency": "Low",
        "expected_categories": ["Workplace Harassment", "Verbal Misconduct"],
        "expected_negation": True, # 'did not physically touch me or threaten me'
        "expected_contradiction": False,
        "expected_location_incomplete": False, # 'ABC Tech Connaught Place'
        "has_medical_concern": False,
        "notes": "Past workplace incident with specific location and explicit physical touch negation."
    },
    {
        "id": "EVAL-010",
        "name": "Escalating Domestic Stalking Outside Residence",
        "transcript": "My estranged husband has been parked outside my apartment building in Rohini Sector 15 for 2 hours honking and flashing headlights. He was issued a restraining order last week.",
        "expected_urgency": "Medium",
        "expected_categories": ["Stalking / Violation of Order", "Domestic Harassment"],
        "expected_negation": False,
        "expected_contradiction": False,
        "expected_location_incomplete": False, # 'Rohini Sector 15 apartment'
        "has_medical_concern": False,
        "notes": "Active presence outside home violating legal order, high risk of escalation."
    }
]
