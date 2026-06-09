# 🌍 CarbonSense AI — Your Personal Carbon Footprint Coach

> An AI-powered conversational coach that helps individuals understand,
> track, and reduce their carbon footprint through personalized insights
> and simple actions — powered by Claude AI.

![CarbonSense AI](https://img.shields.io/badge/AI-Powered-22c55e?style=for-the-badge)
![License](https://img.shields.io/badge/License-MIT-blue?style=for-the-badge)
![Status](https://img.shields.io/badge/Status-Live-success?style=for-the-badge)

---

## 📌 Table of Contents

- [Chosen Vertical](#-chosen-vertical)
- [The Problem](#-the-problem)
- [The Solution](#-the-solution)
- [How It Works](#-how-it-works)
- [Project Structure](#-project-structure)
- [Tech Stack](#-tech-stack)
- [Features](#-features)
- [How To Run](#-how-to-run)
- [Running Tests](#-running-tests)
- [Emissions Data Sources](#-emissions-data-sources)
- [Assumptions Made](#-assumptions-made)
- [Security](#-security)
- [Impact](#-impact)

---

## 🎯 Chosen Vertical

**Carbon Footprint Awareness & Reduction**

CarbonSense AI directly addresses the challenge:

> *"Design a solution that helps individuals understand, track, and reduce
> their carbon footprint through simple actions and personalized insights."*

Instead of a static calculator, CarbonSense AI is a **living, conversational
AI coach** — it learns your lifestyle, calculates your real footprint, and
guides you toward meaningful change over time.

---

## ❗ The Problem

Most carbon tools today are:

| Problem | Impact |
|--------|--------|
| One-time calculators | No ongoing tracking or accountability |
| Generic tips | Not relevant to the individual's actual lifestyle |
| Overwhelming data | Users disengage quickly |
| No feedback loop | No way to measure improvement |

**Result:** People feel informed for a moment — then nothing changes.

---

## 💡 The Solution

CarbonSense AI takes a **conversational coaching approach** with 5 pillars:

### Pillar 1 — Conversational Onboarding
Instead of a boring form, Claude AI asks friendly, natural questions:
- How do you commute?
- What does your diet look like?
- What's your monthly electricity bill?
- How often do you fly?

This feels like talking to a friend, not filling out a tax form.

### Pillar 2 — Personalized Footprint Analysis
Claude calculates your estimated annual CO₂ footprint using **real emissions
factors** and breaks it down by category:
- 🚗 Transport
- 🍽️ Food
- ⚡ Energy
- 🛍️ Shopping

Then compares it to India average (1,900 kg/year) and world average
(4,000 kg/year) so you understand where you actually stand.

### Pillar 3 — Ranked Action Plan
Instead of generic advice, Claude generates **YOUR top actions** ranked
by potential CO₂ savings — specific to your profile:

> *"Switching to public transport would save you ~1,500 kg CO₂/year —
> your single biggest opportunity."*

### Pillar 4 — Progress Dashboard
A beautiful visual dashboard tracks:
- Today's footprint vs daily average
- 7-day emissions chart (colour-coded)
- Actions completed and CO₂ saved
- Daily logging streak

### Pillar 5 — Ongoing AI Coaching
The chat is always open — ask Claude anything:
- *"Is an electric scooter worth it in India?"*
- *"How much does going vegetarian actually help?"*
- *"Give me my weekly progress report"*

---

## ⚙️ How It Works

```
┌─────────────────────────────────────────────────┐
│                  USER OPENS APP                  │
└─────────────────────┬───────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────┐
│         ENTER ANTHROPIC API KEY                  │
│         (stored securely in localStorage)        │
└─────────────────────┬───────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────┐
│         AI ONBOARDING CHAT                       │
│  Claude asks 5-7 lifestyle questions             │
│  Transport → Diet → Energy → Shopping            │
└─────────────────────┬───────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────┐
│         PROFILE ANALYSIS                         │
│  Claude calculates annual footprint              │
│  Breaks down by category                         │
│  Compares to India / world averages              │
│  Generates ranked action plan                    │
└─────────────────────┬───────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────┐
│         DASHBOARD                                │
│  Stats cards → Weekly chart → Actions checklist  │
└─────────────────────┬───────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────┐
│         ONGOING USE                              │
│  Daily check-ins → Weekly AI reports → Free chat │
└─────────────────────────────────────────────────┘
```

### Logic Flow — Profile Detection

```javascript
// app.js detects when enough info is collected
if (conversationHistory.length >= 8 && mentionsProfile) {
    → extract profile from conversation text
    → call AICoach.analyzeProfile(profile)
    → Claude returns formatted footprint analysis
    → save profile to localStorage via Tracker
    → redirect user to Dashboard
}
```

### Emission Calculation Example

```
User drives petrol car 100km/week:
  100 km × 52 weeks × 0.21 kg CO₂/km = 1,092 kg CO₂/year

User eats meat-heavy diet:
  ~2,500 kg CO₂/year (estimated from diet type)

User pays ₹1,500/month electricity:
  ₹1,500 ÷ ₹8/kWh = 187.5 kWh/month
  187.5 × 12 × 0.82 kg/kWh = 1,845 kg CO₂/year

TOTAL ESTIMATE: ~5,437 kg CO₂/year
vs India average: 1,900 kg/year → High 🔴
```

---

## 📁 Project Structure

```
carbonsense-ai/
│
├── index.html              # Complete UI — welcome, chat & dashboard screens
├── style.css               # Dark theme, fully responsive, WCAG accessible
├── app.js                  # Main controller — state, routing, UI logic
├── ai-coach.js             # Claude AI integration & conversation management
├── carbon-data.js          # Real-world emissions factors database + helpers
├── tracker.js              # localStorage persistence — profiles, entries, streaks
│
├── tests/
│   └── carbon.test.js      # 30+ unit tests for all calculation logic
│
└── README.md               # This file
```

### File Responsibilities

| File | Responsibility | Lines |
|------|---------------|-------|
| `carbon-data.js` | Emissions database, benchmarks, action library | ~90 |
| `tracker.js` | Save/load profiles, entries, streaks, savings | ~100 |
| `ai-coach.js` | Claude API calls, prompts, conversation history | ~130 |
| `app.js` | UI controller, screen routing, event handling | ~280 |
| `index.html` | All 3 screens, semantic HTML, ARIA labels | ~180 |
| `style.css` | Complete design system, dark theme, responsive | ~400 |
| `carbon.test.js` | 7 test suites, 30+ assertions | ~220 |

---

## 🛠️ Tech Stack

| Technology | Purpose | Why Chosen |
|-----------|---------|-----------|
| Vanilla JavaScript | Core logic | No build step, maximum clarity |
| HTML5 + CSS3 | UI & styling | Lightweight, fast, accessible |
| Claude API (claude-opus-4-6) | AI coaching | Best-in-class conversational AI |
| Chart.js (CDN) | Weekly chart | Lightweight, beautiful charts |
| localStorage | Data persistence | No backend needed, fully private |
| Inter (Google Fonts) | Typography | Clean, modern, readable |

**Total dependencies: 2** (Chart.js + Inter font) — both via CDN.
No npm, no build step, no framework. Just open and run.

---

## ✨ Features

### Core Features
- 🤖 **AI Conversational Coach** — natural onboarding via Claude AI
- 📊 **Visual Dashboard** — weekly bar chart, colour-coded by level
- 🎯 **Personalized Action Plan** — ranked by YOUR CO₂ saving potential
- 🔥 **Streak Tracking** — gamified daily logging to build habits
- 📝 **Weekly AI Reports** — personalized progress summaries
- 💬 **Free Chat** — ask Claude anything about sustainability

### Technical Features
- ♿ **Accessible** — ARIA labels, keyboard navigation, WCAG AA contrast
- 📱 **Responsive** — works perfectly on mobile and desktop
- 🌙 **Dark Theme** — easy on the eyes, modern design
- 🔒 **Private by Design** — all data in browser, nothing on servers
- ⚡ **Fast** — no build step, loads instantly
- 🧪 **Tested** — 30+ unit tests covering all calculation logic

---

## 🚀 How To Run

### Option 1 — Direct (Simplest)
```bash
# 1. Clone the repo
git clone https://github.com/AkshitVerma021/carbonsense-ai.git

# 2. Open in browser — NO install needed!
cd carbonsense-ai
open index.html        # Mac
start index.html       # Windows
xdg-open index.html    # Linux
```

### Option 2 — Local Server (Recommended)
```bash
# Using Python
python -m http.server 8000

# Using Node.js
npx serve .

# Then open: http://localhost:8000
```

### Option 3 — VS Code
Install the **Live Server** extension → right-click `index.html` →
**Open with Live Server**

### Getting Your API Key
1. Go to [console.anthropic.com](https://console.anthropic.com)
2. Sign up / log in
3. Navigate to **API Keys** → **Create Key**
4. Copy the key (starts with `sk-ant-`)
5. Paste it into CarbonSense AI when prompted

---

## 🧪 Running Tests

### In Browser Console
1. Open `index.html` in browser
2. Open DevTools → Console (F12)
3. Copy and paste contents of `tests/carbon.test.js`
4. Hit Enter — see full test results

### With Node.js
```bash
node tests/carbon.test.js
```

### Expected Output
```
══════════════════════════════════════
         CARBONSENSE TEST RESULTS
══════════════════════════════════════
✅ PASS  Petrol car 100km = 21kg CO2
✅ PASS  Electric car 100km = 5kg CO2
✅ PASS  Bus 100km = 8.9kg CO2
✅ PASS  Metro 100km = 3.1kg CO2
✅ PASS  Walking = 0kg CO2
✅ PASS  EV saves 75% vs petrol car
✅ PASS  1kg beef = 27kg CO2
✅ PASS  Vegan meal = 0.5kg CO2
✅ PASS  100 kWh electricity = 82kg CO2
✅ PASS  1 clothing item = 20kg CO2
✅ PASS  1000kg is Excellent level
✅ PASS  3500kg is High level
✅ PASS  All 5 actions = 2820kg saved
... (30+ tests total)
──────────────────────────────────────
Total:  30+ tests
Passed: 30+ ✅
Failed: 0  ❌
══════════════════════════════════════
```

### Test Coverage

| Suite | Tests | What's Covered |
|-------|-------|----------------|
| Transport | 6 | Car, EV, bus, metro, walking emissions |
| Food | 5 | Beef, chicken, vegan, meat meals |
| Energy | 3 | Electricity, LPG calculations |
| Shopping | 3 | Clothing, electronics |
| Footprint Levels | 6 | Classification + colour coding |
| Action Savings | 5 | Single, multiple, combined actions |
| Edge Cases | 5 | Unknown inputs, zero, large values |

---

## 📊 Emissions Data Sources

All emission factors are sourced from peer-reviewed and government data:

| Category | Factor | Source |
|----------|--------|--------|
| Petrol car | 0.21 kg CO₂/km | UK DEFRA 2023 |
| Electric car | 0.05 kg CO₂/km | UK DEFRA 2023 |
| Bus | 0.089 kg CO₂/km | UK DEFRA 2023 |
| Metro | 0.031 kg CO₂/km | UK DEFRA 2023 |
| Beef | 27.0 kg CO₂/kg | Poore & Nemecek 2018 |
| Chicken | 6.9 kg CO₂/kg | Poore & Nemecek 2018 |
| Electricity | 0.82 kg CO₂/kWh | India CEA 2023 |
| India average | 1,900 kg/year | Global Carbon Project 2023 |
| World average | 4,000 kg/year | Global Carbon Project 2023 |
| Paris target | 2,500 kg/year | IPCC SR1.5 |

---

## 💭 Assumptions Made

1. **India context** — electricity grid uses India CEA emission factor
   (0.82 kg CO₂/kWh). Adjustable in `carbon-data.js` for other regions.

2. **Diet estimation** — annual food footprint is estimated from diet
   type (vegan/vegetarian/mixed/meat-heavy) since precise meal-by-meal
   tracking during onboarding would be impractical and off-putting.

3. **Default weekly km** — if user doesn't specify distance, defaults
   to 100 km/week for transport calculations.

4. **Flight distance** — assumes average domestic flight of ~1,000 km
   when user says "one flight" without specifying distance.

5. **Electricity bill conversion** — assumes ₹8/kWh average India
   tariff to convert monthly bill (₹) to kWh consumption.

6. **API key storage** — stored in localStorage for session persistence.
   Users are advised to keep it private and not share their browser profile.

7. **No backend required** — by design, all data is client-side for
   simplicity, privacy, and zero infrastructure cost.

---

## 🔒 Security

| Concern | How Addressed |
|---------|--------------|
| API key exposure | Stored in localStorage only, never logged or shared |
| Third-party data | All AI calls go directly to `api.anthropic.com` |
| User data privacy | No data leaves the browser — no analytics, no tracking |
| Input sanitization | All user inputs sanitized before processing |
| XSS prevention | innerHTML used only for controlled, formatted AI responses |

---

## 🌱 Impact

> If just **1 million Indians** used CarbonSense AI and each reduced
> their footprint by 10% through suggested actions, it would save
> approximately **190,000 tonnes of CO₂ per year** —
> equivalent to planting **8.6 million trees**.

The actions recommended by CarbonSense AI are not arbitrary — they are
ranked by **actual CO₂ impact**, so users focus on changes that matter
most, not just the easiest ones.

---

## 📄 License

MIT License — free to use, modify, and distribute.

---

*Built with 💚 for a lower-carbon future*