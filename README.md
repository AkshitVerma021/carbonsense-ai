# 🌍 CarbonSense AI — Your Personal Carbon Footprint Coach

> An AI-powered conversational coach that helps individuals **understand**,
> **track**, and **reduce** their carbon footprint through simple actions
> and personalized insights — powered by Claude AI (Anthropic).

![Score](https://img.shields.io/badge/AI%20Eval%20Score-92.78%2F100-22c55e?style=for-the-badge)
![Efficiency](https://img.shields.io/badge/Efficiency-100%2F100-22c55e?style=for-the-badge)
![License](https://img.shields.io/badge/License-MIT-blue?style=for-the-badge)

---

## 📌 Table of Contents
- [Problem Statement Alignment](#-problem-statement-alignment)
- [The Problem](#-the-problem)
- [The Solution](#-the-solution)
- [How It Works](#-how-it-works)
- [Project Structure](#-project-structure)
- [Tech Stack](#-tech-stack)
- [Features](#-features)
- [Security](#-security)
- [How To Run](#-how-to-run)
- [Running Tests](#-running-tests)
- [Emissions Data Sources](#-emissions-data-sources)
- [Assumptions](#-assumptions)

---

## 🎯 Problem Statement Alignment

**Challenge:** *"Design a solution that helps individuals understand, track,
and reduce their carbon footprint through simple actions and personalized insights."*

| Requirement | Implementation | File |
|-------------|---------------|------|
| **Understand** carbon footprint | Conversational AI explains footprint in plain language with India/world comparisons | `ai-coach.js` |
| **Track** carbon footprint | Daily logging, 7-day visual chart, streak counter, category breakdown | `tracker.js` |
| **Reduce** carbon footprint | 8 ranked actions with exact CO₂ savings, completion tracking | `carbon-data.js` |
| **Simple actions** | Actions rated easy/medium/hard with one-line tips | `carbon-data.js` |
| **Personalized insights** | Claude AI analyses individual lifestyle — transport, diet, energy, shopping | `ai-coach.js` |
| **Smart dynamic assistant** | Full conversational AI with context memory across session | `ai-coach.js` |
| **Logical decision making** | Profile extracted from conversation, emission factors applied, actions ranked by impact | `app.js` |
| **Real-world usability** | Works without API key (demo mode), mobile responsive, zero install | `app.js` |

---

## ❗ The Problem

| Problem with existing tools | Impact |
|----------------------------|--------|
| One-time calculators | No ongoing accountability |
| Generic tips | Not relevant to individual lifestyle |
| Overwhelming dashboards | Users disengage |
| No progress feedback | Nothing changes |

---

## 💡 The Solution — 5 Core Pillars

### 1. Conversational Onboarding
Claude AI asks 5–7 friendly lifestyle questions — feels like talking
to a friend, not filling a form. Transport → Diet → Energy → Shopping.

### 2. Personalized Footprint Analysis
Claude calculates annual CO₂ using real emissions factors, broken down
by category, compared to India average (1,900 kg/year) and world average (4,000 kg/year).

### 3. Ranked Action Plan
Top actions ranked by YOUR potential savings — not generic advice:
> *"Switching to public transport saves YOU ~1,500 kg CO₂/year"*

### 4. Progress Dashboard
- Today's footprint vs daily India average (5.2 kg/day)
- 7-day bar chart (colour-coded green/amber/red)
- Actions completed + total CO₂ saved
- Daily logging streak

### 5. Ongoing AI Coaching
Chat is always open — ask anything about sustainability, get a weekly
report, or log daily activities conversationally.

---

## ⚙️ How It Works

```
User Opens App
      │
      ▼
Enter API Key (optional — Demo Mode if blank)
      │
      ▼
AI Onboarding Chat → 5-7 lifestyle questions
      │
      ▼
Claude analyses profile → footprint breakdown + top 3 actions
      │
      ▼
Dashboard: stats + weekly chart + actions checklist
      │
      ▼
Daily check-ins + weekly AI reports + free chat
```

### Emission Calculation Logic

```javascript
// Transport example
weeklyKm × 52 × emissionFactor = annual kg CO₂
// e.g. 100km/week × 52 × 0.21 (petrol) = 1,092 kg/year

// Diet
// meat-heavy ≈ 2,500 kg/year | vegetarian ≈ 1,000 kg | vegan ≈ 600 kg

// Energy
// (monthlyBill ÷ ₹8/kWh) × 12 × 0.82 kg/kWh = annual kg CO₂
```

---

## 📁 Project Structure

```
carbonsense-ai/
│
├── index.html           # Complete UI — welcome, chat & dashboard screens
├── style.css            # Dark theme, WCAG accessible, fully responsive
├── app.js               # Main controller — routing, state, events, charts
├── ai-coach.js          # Claude AI integration + demo mode fallback
├── carbon-data.js       # Real-world emissions database + helper functions
├── tracker.js           # localStorage persistence layer
│
├── tests/
│   └── carbon.test.js   # 40+ unit tests across 10 suites
│
└── README.md
```

| File | Responsibility |
|------|---------------|
| `carbon-data.js` | Emissions factors, benchmarks, 8 ranked actions |
| `tracker.js` | Save/load profiles, entries, streaks, savings |
| `ai-coach.js` | Claude API, conversation history, demo fallback |
| `app.js` | UI controller, screen routing, XSS sanitization |
| `index.html` | 3 screens, semantic HTML5, ARIA labels |
| `style.css` | Design system, dark theme, responsive grid |
| `carbon.test.js` | 10 suites, 40+ assertions |

---

## 🛠️ Tech Stack

| Technology | Purpose |
|-----------|---------|
| Vanilla JS (ES6+) | Core logic — no framework, maximum clarity |
| HTML5 + CSS3 | Semantic markup, accessible design |
| Claude API (claude-opus-4-6) | Conversational AI coaching |
| Chart.js | Weekly emissions bar chart |
| localStorage | Private client-side persistence |

**Zero npm dependencies. No build step. Open and run.**

---

## ✨ Features

- 🤖 Conversational AI onboarding via Claude
- 📊 7-day visual dashboard with colour-coded chart
- 🎯 Personalised ranked action plan with CO₂ savings
- 🔥 Daily streak tracking
- 📝 Weekly AI progress reports
- 🎮 Demo mode — works without API key
- ♿ WCAG AA accessible — ARIA, keyboard nav, focus rings
- 📱 Fully responsive — mobile and desktop
- 🔒 XSS sanitization on all inputs
- 🧪 40+ unit tests across 10 suites

---

## 🔒 Security

| Concern | Implementation |
|---------|---------------|
| XSS prevention | All user input sanitized before rendering |
| API key safety | Stored in localStorage only, never logged |
| Input length limit | Max 1000 chars enforced in `sanitizeInput()` |
| HTML stripping | `<>` characters stripped from all inputs |
| Direct API calls | All requests go directly to `api.anthropic.com` |
| No tracking | Zero analytics, no data leaves the browser |

---

## 🚀 How To Run

```bash
# 1. Clone
git clone https://github.com/AkshitVerma021/carbonsense-ai.git
cd carbonsense-ai

# 2. Open — no install needed!
start index.html       # Windows
open index.html        # Mac
xdg-open index.html    # Linux
```

**Or** use VS Code Live Server extension.

**API Key (optional):**
1. Visit [console.anthropic.com](https://console.anthropic.com)
2. Create API key (starts with `sk-ant-`)
3. Paste into app — or leave blank for Demo Mode

---

## 🧪 Running Tests

```bash
node tests/carbon.test.js
```

**Or** paste `tests/carbon.test.js` into browser DevTools console.

### Test Suites

| Suite | Tests | Coverage |
|-------|-------|---------|
| Transport Emissions | 6 | Car, EV, bus, metro, walking |
| Food Emissions | 5 | Beef, chicken, vegan, meals |
| Energy Emissions | 3 | Electricity, LPG |
| Shopping Emissions | 3 | Clothing, electronics |
| Footprint Levels | 6 | Classification + colours |
| Action Savings | 5 | Single, multiple, combined |
| Edge Cases | 5 | Unknown inputs, zero, overflow |
| Security Sanitization | 5 | XSS, null, length limits |
| Tracker Logic | 4 | Entry save/load, today sum |
| Benchmarks | 5 | Data integrity checks |

---

## 📊 Emissions Data Sources

| Category | Factor | Source |
|----------|--------|--------|
| Petrol car | 0.21 kg CO₂/km | UK DEFRA 2023 |
| Electric car | 0.05 kg CO₂/km | UK DEFRA 2023 |
| Bus | 0.089 kg CO₂/km | UK DEFRA 2023 |
| Beef | 27.0 kg CO₂/kg | Poore & Nemecek 2018 |
| Electricity | 0.82 kg CO₂/kWh | India CEA 2023 |
| India average | 1,900 kg/year | Global Carbon Project 2023 |
| Paris target | 2,500 kg/year | IPCC SR1.5 |

---

## 💭 Assumptions

1. India electricity grid factor (0.82 kg/kWh) — adjustable in `carbon-data.js`
2. Diet footprint estimated from type — meal-by-meal tracking impractical for onboarding
3. Default 100 km/week transport if user doesn't specify
4. Average domestic flight = ~1,000 km
5. Electricity bill converted at ₹8/kWh average India tariff
6. All data client-side — no backend for privacy and simplicity

---

## 🌱 Impact

> If 1 million Indians reduced their footprint by 10% using CarbonSense AI,
> it would save **190,000 tonnes of CO₂/year** — equal to planting
> **8.6 million trees**. 🌳

---

*Built with 💚 for a lower-carbon future*