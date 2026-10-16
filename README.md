# eSahaay: Intelligent Helpline Triage for Women's Safety

> **Decision-Support Assistant for Women's Safety Helplines**  
> *Translating fragmented, multilingual caller complaints into structured, evidence-backed incident reports while keeping trained human operators in complete control.*

---

## 1. Executive Summary & Problem Statement

Women's safety helplines frequently receive short, fragmented complaints spoken or typed under acute stress in **Hindi, English, and Hinglish**. Callers describe indirect intimidation (*"usne bola dekh lunga"*), repeated unwanted following, ambiguous threats, or vague locations (*"red building ke paas metro station ke paas"*).

Standard keyword-matching systems often fail:
- They miss indirect threats.
- They fall victim to negations (*"usne mujhe dhamki nahi di"* being misclassified as a confirmed threat).
- They silently guess ambiguous locations or conflicting statements.

**eSahaay** addresses these challenges through a hybrid AI/NLP analysis pipeline with strict safeguards:
1. **Verbatim Evidence Grounding:** Every finding links to exact quotes with interactive UI highlighting.
2. **Explicit Negation Detection:** Safeguards prevent denied actions from being treated as threats.
3. **Contradiction Detection:** Statements like being safe at home while simultaneously trapped in public are flagged for clarification.
4. **Location Completeness Audit:** Vague landmarks without colony, gate, or address are flagged before field resources are dispatched.
5. **Human-in-the-Loop Review:** Urgency assessments and categorization are strictly provisional; trained operators review and finalize all reports.

> **CRITICAL ETHICAL NOTICE:** eSahaay is a **decision-support tool, NOT an emergency service and NOT a replacement for trained human operators**. It does not initiate automated calls to emergency dispatchers (112/police) or family members. If active danger is identified, operators are advised to follow internal emergency escalation protocols without waiting for forms or AI updates.

---

## 2. Technology Stack

- **Frontend:** React 18, TypeScript, Tailwind CSS, Lucide Icons, Recharts
- **Backend:** Python 3.11+, FastAPI, Pydantic v2 (Strict Schema Validation)
- **AI/NLP Engine:**
  - Configurable Interchangeable LLM Provider (Google Gemini, OpenAI GPT-4o, Anthropic) via API keys.
  - **Deterministic Demo & Safeguard Engine:** Built-in rule and regex safeguard system that works fully offline without requiring any paid API keys. Clearly labeled so no fake AI attribution is presented.
- **Storage:** Local SQLite database (`cases.db`) for persisting analyzed and reviewed cases.
- **Testing:** Pytest backend test suite covering negations, contradictions, locations, and review endpoints.

---

## 3. Architecture & Project Layout

```
BVCOE Hackathon/
├── backend/
│   ├── app/
│   │   ├── api/
│   │   │   └── routes.py             # FastAPI routes (/health, /analyze, /cases, /evaluate)
│   │   ├── data/
│   │   │   ├── demo_cases.py         # 5 rich synthetic test complaints
│   │   │   └── eval_dataset.py       # 10 labeled ground-truth benchmark cases
│   │   ├── models/
│   │   │   └── schemas.py            # Pydantic v2 schemas for evidence & review
│   │   ├── services/
│   │   │   ├── ai_provider.py        # Gemini / OpenAI / Deterministic switch
│   │   │   ├── case_store.py         # SQLite persistence & overview statistics
│   │   │   ├── evaluation_service.py # Empirical metrics, confusion matrix, under-triage
│   │   │   └── rule_engine.py        # Negation, contradiction, and evidence engine
│   │   ├── config.py                 # Pydantic Settings
│   │   └── main.py                   # FastAPI initialization & CORS
│   ├── tests/
│   │   └── test_api.py               # Unit & integration test suite (9 tests)
│   ├── requirements.txt
│   └── .env.example
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── DemoCaseSelectorModal.tsx # 1-click synthetic case loader
│   │   │   ├── EmergencyBanner.tsx       # Active danger & decision-support alerts
│   │   │   ├── EvidenceCard.tsx          # Verbatim excerpt cards with fact/inference tag
│   │   │   ├── Header.tsx                # Status bar, operator badge, AI mode pill
│   │   │   ├── HumanReviewModal.tsx      # Operator urgency & category review dialog
│   │   │   ├── Sidebar.tsx               # Persistent navy navigation bar
│   │   │   ├── TranscriptHighlighter.tsx # Interactive transcript span highlighter
│   │   │   └── UrgencyBadge.tsx          # Accessible urgency status badges
│   │   ├── pages/
│   │   │   ├── AboutPage.tsx             # Social impact, safeguards, and stack
│   │   │   ├── CaseHistoryPage.tsx       # SQLite case history with filters & detail modal
│   │   │   ├── EvaluationPage.tsx        # Live benchmark evaluation with confusion matrix
│   │   │   ├── NewIncidentPage.tsx       # Main transcript analysis & review interface
│   │   │   └── OverviewPage.tsx          # Operations landing page with KPIs & chart
│   │   ├── services/
│   │   │   └── api.ts                    # Backend API client
│   │   ├── types/
│   │   │   └── index.ts                  # TypeScript interface definitions
│   │   ├── App.tsx                       # Master layout & state coordinator
│   │   ├── index.css                     # Tailwind directives
│   │   └── main.tsx
│   ├── package.json
│   ├── tailwind.config.js
│   ├── tsconfig.app.json
│   └── vite.config.ts
├── run_backend.bat                       # Launch FastAPI backend
├── run_frontend.bat                      # Launch Vite React frontend
├── start.bat                             # 1-Click launcher for both
└── README.md
```

---

## 4. Key Innovation Highlights

### 1. Verbatim Evidence Grounding
Every single finding presented in the triage report provides:
- The exact quote from the caller.
- Why the quote is relevant.
- A clear label distinguishing **Explicit Facts** stated by the caller from **AI Interpretations**.
- Uncertainty warnings where language is colloquial or ambiguous.
- Interactive highlighting: clicking an excerpt in the transcript highlights the corresponding evidence card and vice-versa.

### 2. Safeguards Against Linguistic Ambiguity & Negations
- **Negation Guard:** When a caller mentions *"Usne mujhe koi dhamki nahi di aur hathiyar nahi tha"*, traditional keyword matchers trigger threat alerts. eSahaay detects the negation, prevents high-urgency escalation, and logs an explicit safeguard notice.
- **Contradiction Guard:** When a caller states *"Main ghar par hoon"* followed by *"Main abhi metro station pe phasi hoon"*, eSahaay flags conflicting statements and marks the provisional urgency as **Unable to Determine**, prompting operator clarification.
- **Location Completeness Audit:** Detects whether a location has landmark/area specifics or is dangerously vague (*"red building near metro"*), generating urgent operator follow-up questions.

### 3. Critical Under-Triage Safety Tracking
Under-triage (misclassifying a high-risk situation as low or medium) is catastrophic in domestic violence and stalking situations. eSahaay's **Evaluation Dashboard** tracks the **Under-Triage Error Rate** as a primary safety metric on a ground-truth labeled benchmark dataset.

---

## 5. Quick Start & Local Execution

### Prerequisites
- **Python 3.10+** (Python 3.11 recommended)
- **Node.js 18+** with npm

### 1. Installation

**Backend Setup:**
```bash
# In project root
python -m venv .venv
# On Windows:
.venv\Scripts\activate
# On Linux/macOS:
# source .venv/bin/activate

pip install -r backend/requirements.txt
```

**Frontend Setup:**
```bash
cd frontend
npm install
cd ..
```

### 2. Configuration (`.env`)
Copy `.env.example` to `.env` in the root and/or backend folder:
```ini
# AI Provider: "mock" (default, runs offline without key), "gemini", or "openai"
AI_PROVIDER=mock

# AI API Key (Leave empty to use built-in deterministic demo mode)
AI_API_KEY=

# Model Name
AI_MODEL=gemini-1.5-pro

# Database Path
DATABASE_PATH=cases.db
```

### 3. Run the Application

**Option A: 1-Click Launch (Windows)**
Double click `start.bat` or run:
```cmd
start.bat
```

**Option B: Manual Terminal Launch**
Terminal 1 (Backend):
```bash
# With virtual environment activated:
set PYTHONPATH=backend
python -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
```

Terminal 2 (Frontend):
```bash
cd frontend
npm run dev -- --host 127.0.0.1 --port 5173
```

- **Frontend App:** http://localhost:5173
- **FastAPI Interactive API Docs:** http://localhost:8000/docs
- **Health Check:** http://localhost:8000/api/v1/health

---

## 6. Running Tests

Run the backend automated test suite covering health, negations, contradictions, API endpoints, review persistence, and evaluation:

```bash
set PYTHONPATH=backend
pytest backend/tests -v
```

All 9 test cases will execute and validate the core safeguards.

---

## 7. Step-by-Step Hackathon Demo Walkthrough

1. **Overview Dashboard:**
   - Open `http://localhost:5173`.
   - Observe the live KPI cards, urgency distribution chart, and pre-seeded demo cases.
   - Note the prominent legal and human-in-the-loop disclaimers.

2. **Load a Synthetic Hinglish Complaint:**
   - Click **"Analyze New Incident"** in the sidebar.
   - Click **"Load Demo Case"** and select **DEMO-001** (*Hinglish Stalking & Indirect Threat*).
   - Click **"Analyze Incident"**.

3. **Inspect Grounded Evidence & Excerpt Highlighting:**
   - Note the **Transcript Viewer** highlighting excerpts like *"scooty ke peeche aa raha hai"* and *"dekh lunga"*.
   - Click any highlighted phrase to focus the corresponding **Evidence Card**.
   - Note the explicit separation between **Explicit Facts** and **AI Interpretations**.

4. **Test the Negation Safeguard:**
   - Click **"Load Demo Case"** and select **DEMO-004** (*Negation Safeguard: Explicitly Denied Threat*).
   - Click **"Analyze Incident"**.
   - Note the green **Negation Safeguard Active** banner explaining why *"dhamki nahi di"* was protected against false-positive escalation.

5. **Test Incomplete Location & Immediate Danger:**
   - Load **DEMO-003** (*Urgent Active Danger*) or **DEMO-002** (*Incomplete Location & Low Battery*).
   - Notice the flashing red **Emergency Escalation Advisory Banner** directing immediate protocol invocation without form delays.
   - Review the missing information checklist (precise address, metro gate).

6. **Conduct Human Operator Review:**
   - Click **"Human Operator Review"**.
   - Override or confirm Urgency, adjust categories, add operator notes (*"Caller instructed to remain locked; nearest PCR patrol alerted"*).
   - Click **"Save & Finalize Review"**.
   - Notice the report immediately updates to show **Operator Confirmed** status.

7. **Review Persisted Case History:**
   - Click **"Case History"** in the sidebar.
   - Search by keyword or filter by Urgency / Review Status.
   - Click any case to open the audit file drawer.

8. **Execute Evaluation Benchmark:**
   - Click **"Evaluation Dashboard"** in the sidebar.
   - Click **"Run Benchmark Evaluation"**.
   - Inspect the **Urgency Confusion Matrix**, category match accuracy, and the **Under-Triage Error Rate**.
   - Inspect the Discrepancy Analysis table showing ground-truth vs model predictions.

---

## 8. Summary of Implemented Features & Ethical Boundaries

| Feature | Implementation Status | Safeguard Description |
|---|---|---|
| **Multilingual Parsing** | Complete | Supports Hindi, English, and romanized Hinglish seamlessly |
| **Evidence Grounding** | Complete | Verbatim quotations with character offsets; no hallucinated facts |
| **Negation Protection** | Complete | Detects denied actions (*"dhamki nahi di"*) to eliminate false alarms |
| **Contradiction Guard** | Complete | Detects conflicting claims; flags status as Unable to Determine |
| **Location Audit** | Complete | Flags vague landmarks and prompts for critical dispatch coordinates |
| **Human Review Workflow** | Complete | Full operator override for urgency, categories, and audit notes |
| **SQLite Persistence** | Complete | Saves all cases and review records with search and delete |
| **Live Evaluation Dashboard** | Complete | Computed confusion matrix, category overlap, and under-triage rate |
| **Zero-Cost Demo Mode** | Complete | 100% functional out of the box without requiring paid API keys |

### Ethical and Technical Limitations
- **Decision-Support Boundary:** eSahaay does NOT dispatch police, ambulances, or third-party units automatically.
- **Audio Pre-processing:** The current version analyzes textual transcripts. Live telephone speech-to-text (ASR) integration should use dedicated Hindi/Hinglish acoustic models.
- **Privacy:** Stored cases contain only minimal synthetic complaint text. Real-world deployments should integrate encrypted database storage and role-based access control (RBAC).
