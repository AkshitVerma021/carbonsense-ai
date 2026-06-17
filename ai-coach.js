/**
 * @fileoverview CarbonSense AI — AI Coach Module
 * @description Manages Claude AI conversations with full demo mode fallback.
 *              Handles onboarding, profile analysis, daily check-ins,
 *              and free-form sustainability coaching.
 * @version 2.0.0
 * @license MIT
 */

"use strict";

const AICoach = {

  /** @type {string|null} */
  apiKey: null,
  /** @type {boolean} */
  demoMode: false,
  /** @type {Array<{role: string, content: string}>} */
  conversationHistory: [],
  /** @type {number} */
  demoStep: 0,
  /** @type {number} */
  demoFallbackIndex: 0,

  // ── Demo Responses ────────────────────────────────────────────────
  demoResponses: [
    `Hi! I'm CarbonSense 🌍 — your personal carbon footprint coach.

I'll ask you a few quick questions about your daily life, then show you exactly where your emissions come from and your top actions to reduce them.

Ready to discover your carbon footprint? Let's start! 🚀

**First question:** How do you mainly get around on a typical day? (For example: car, bike, metro, bus, work from home)`,

    `Great! That's really helpful 🚗

**Next question:** How would you describe your diet?
- 🥩 Meat-heavy (beef/lamb most days)
- 🍗 Mixed (some meat, some veg)
- 🥗 Vegetarian (no meat)
- 🌱 Vegan (no animal products)`,

    `Got it! Diet is actually one of the biggest factors in carbon footprint 🍽️

**Next question:** What's your approximate monthly electricity bill at home?
(For example: ₹500, ₹1500, ₹3000)`,

    `Perfect! Electricity usage varies a lot by household 💡

**Next question:** How many flights do you take per year?
(Include both domestic and international)`,

    `Almost done! Just one more 🙏

**Last question:** How would you describe your shopping habits?
- 🛍️ Heavy (lots of online orders, new clothes often)
- 📦 Moderate (occasional shopping)
- ♻️ Minimal (buy only what I need)`,

    `Thanks for sharing all that! Here's your personalized carbon footprint analysis 🌍

---

🎯 **Total estimated footprint: 3,240 kg CO₂/year**

📊 **Breakdown:**
- 🚗 Transport: 38% (~1,231 kg)
- 🍽️ Food: 31% (~1,004 kg)
- ⚡ Energy: 22% (~713 kg)
- 🛍️ Shopping: 9% (~292 kg)

📈 **Compared to averages:**
- Your footprint: **3,240 kg/year**
- India average: **1,900 kg/year**
- World average: **4,000 kg/year**
- Paris 2030 target: **2,500 kg/year**

You're above the India average but below the world average ⚠️

✅ **Your Top 3 Actions (personalised):**

1. 🚌 **Switch to public transport daily** → saves ~1,500 kg CO₂/year
2. 🥗 **Go plant-based 3 days/week** → saves ~420 kg CO₂/year
3. 💡 **Switch all lights to LED** → saves ~100 kg CO₂/year

**Total potential savings: 2,020 kg/year** — that would bring you well below the India average! 🌱

You're already making good choices. Small, consistent changes make a huge difference over time. Let's track your progress together!`
  ],

  demoFallbacks: [
    `Great question! 🌱 Switching to an electric vehicle in India can save up to 2,400 kg CO₂/year compared to a petrol car. With improving charging infrastructure in cities, it's becoming more practical every year. The upfront cost is higher but total cost of ownership is lower over 5 years.`,

    `That's a really impactful change to consider! 🥗 A plant-based diet 3 days per week can save approximately 420 kg CO₂/year. The biggest win is reducing beef — beef produces 27 kg CO₂ per kg, compared to just 0.5 kg for a vegan meal. Even small dietary shifts add up significantly.`,

    `Great thinking! ⚡ Air conditioning is typically the biggest energy consumer in India. Setting your AC to 24°C instead of 18°C can reduce energy use by up to 24%. Combined with LED lights and a 5-star rated AC, you could cut your energy footprint by 30%.`,

    `That's a smart approach! 🛍️ Fast fashion is one of the most overlooked sources of carbon emissions. Each clothing item produces about 20 kg CO₂ in manufacturing and transport. Buying 50% less clothing and choosing sustainable brands can save ~200 kg CO₂/year easily.`,

    `Excellent awareness! ✈️ One domestic flight (e.g. Delhi to Mumbai) produces about 255 kg CO₂ per passenger. Choosing train travel when possible is the single best transport swap for long distances in India. The same journey by train emits just ~40 kg CO₂.`,

    `You're on the right track! 🌍 Every action you take matters. The India average is 1,900 kg CO₂/year. If you complete all 8 actions on your dashboard, you could save up to 6,920 kg/year. Keep going! 💪`
  ],

  // ── Init ──────────────────────────────────────────────────────────
  /**
   * Initialises the AI coach with optional API key.
   * Falls back to demo mode if no valid key provided.
   * @param {string|null} apiKey
   */
  init(apiKey) {
    if (apiKey && typeof apiKey === "string" && apiKey.startsWith("sk-ant-")) {
      this.apiKey   = apiKey.replace(/[^a-zA-Z0-9\-_]/g, "").trim();
      this.demoMode = false;
    } else {
      this.apiKey   = null;
      this.demoMode = true;
    }
    this.conversationHistory = [];
    this.demoStep            = 0;
    this.demoFallbackIndex   = 0;
  },

  // ── Core API Call ─────────────────────────────────────────────────
  /**
   * Sends a message to Claude API or returns a demo response.
   * @param {string} userMessage
   * @param {string|null} systemPrompt
   * @returns {Promise<{success: boolean, message: string}>}
   */
  async sendMessage(userMessage, systemPrompt = null) {
    this.conversationHistory.push({ role: "user", content: userMessage });

    if (this.demoMode) return await this.getDemoResponse();

    const system = systemPrompt || this.getDefaultSystemPrompt();

    try {
      const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "Content-Type":      "application/json",
          "x-api-key":         this.apiKey,
          "anthropic-version": "2023-06-01",
          "anthropic-dangerous-client-side-api-key-flag": "true"
        },
        body: JSON.stringify({
          model:      "claude-opus-4-6",
          max_tokens: 1024,
          system,
          messages:   this.conversationHistory
        })
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error?.message || "API call failed");
      }

      const data  = await response.json();
      const reply = data.content[0].text;

      this.conversationHistory.push({ role: "assistant", content: reply });
      return { success: true, message: reply };

    } catch (error) {
      console.warn("API failed, switching to demo mode:", error.message);
      this.demoMode = true;
      return await this.getDemoResponse();
    }
  },

  // ── Demo Engine ───────────────────────────────────────────────────
  /**
   * Returns a demo response simulating AI interaction.
   * @returns {Promise<{success: boolean, message: string}>}
   */
  async getDemoResponse() {
    await new Promise(r => setTimeout(r, 800 + Math.random() * 600));

    let reply;
    if (this.demoStep < this.demoResponses.length) {
      reply = this.demoResponses[this.demoStep];
      this.demoStep++;
    } else {
      reply = this.demoFallbacks[this.demoFallbackIndex % this.demoFallbacks.length];
      this.demoFallbackIndex++;
    }

    this.conversationHistory.push({ role: "assistant", content: reply });
    return { success: true, message: reply };
  },

  // ── System Prompt ─────────────────────────────────────────────────
  /**
   * Returns the default system prompt for the AI coach.
   * @returns {string}
   */
  getDefaultSystemPrompt() {
    return `You are CarbonSense — a friendly, knowledgeable, and empathetic AI carbon footprint coach.

Your personality:
- Warm, encouraging, never preachy or guilt-tripping
- Use simple language, avoid jargon
- Use emojis occasionally to keep it friendly 🌱
- Give specific numbers and facts when possible
- Always personalize advice to the user's actual situation

Your goals:
1. Help users understand their carbon footprint in a relatable way
2. Suggest realistic, actionable steps — not overwhelming ones
3. Celebrate small wins and progress
4. Compare user footprint to India average (1,900 kg CO2/year) and world average (4,000 kg)

Rules:
- Keep responses concise (3-5 sentences unless doing full analysis)
- Never make the user feel bad about their choices
- Always end with a question OR a clear next step
- Format action plans as numbered lists with emoji icons`;
  },

  // ── Onboarding ────────────────────────────────────────────────────
  /**
   * Starts the conversational onboarding flow.
   * @returns {Promise<string>} Opening message
   */
  async startOnboarding() {
    if (this.demoMode) {
      const greeting = this.demoResponses[0];
      this.demoStep  = 1;
      this.conversationHistory.push({ role: "assistant", content: greeting });
      return greeting;
    }

    const greeting = `Hi! I'm CarbonSense 🌍 — your personal carbon footprint coach.

I'll ask you a few quick questions about your daily life, then show you exactly where your emissions come from and your top actions to reduce them.

Ready to discover your carbon footprint? Let's start! 🚀

**First question:** How do you mainly get around on a typical day? (For example: car, bike, metro, bus, work from home)`;

    this.conversationHistory.push({ role: "assistant", content: greeting });
    return greeting;
  },

  // ── Profile Analysis ──────────────────────────────────────────────
  /**
   * Requests a full footprint analysis from Claude based on user profile.
   * @param {object} profileData
   * @returns {Promise<{success: boolean, message: string}>}
   */
  async analyzeProfile(profileData) {
    if (this.demoMode) return await this.getDemoResponse();

    const prompt = `Based on this user profile, calculate their estimated annual carbon footprint and give a breakdown by category. Then provide their top 3 personalized actions.

User Profile:
- Transport: ${profileData.transport}
- Weekly km: ${profileData.weeklyKm} km
- Diet: ${profileData.diet}
- Monthly electricity bill: ₹${profileData.electricityBill}
- Flights/year: ${profileData.flights}
- Shopping: ${profileData.shopping}
- Location: India

Emission factors: petrol car=0.21kg/km, EV=0.05kg/km, bus=0.089kg/km, metro=0.031kg/km
Diet: meat-heavy≈2500kg/yr, mixed≈1500kg/yr, vegetarian≈1000kg/yr, vegan≈600kg/yr
Electricity: 0.82kg/kWh (assume ₹8/kWh)

Format:
1. 🎯 Total estimated footprint: X,XXX kg CO2/year
2. 📊 Breakdown by category (%)
3. 📈 Compared to India average (1,900 kg/year)
4. ✅ Top 3 Actions with kg CO2 saved
5. One encouraging closing line`;

    return await this.sendMessage(prompt);
  },

  // ── Daily Check-in ────────────────────────────────────────────────
  /**
   * Generates a friendly daily check-in response.
   * @param {object} todayData
   * @returns {Promise<{success: boolean, message: string}>}
   */
  async dailyCheckin(todayData) {
    if (this.demoMode) return await this.getDemoResponse();

    const prompt = `User logged today:
- Transport: ${todayData.transport} for ${todayData.km} km
- Meals: ${todayData.meals}
- Energy: ${todayData.energy || "not logged"}
- Total: ${todayData.total} kg CO2

Give a brief 2-3 sentence friendly check-in. India avg = ~5.2 kg/day. End with one tip for tomorrow.`;

    return await this.sendMessage(prompt);
  },

  // ── Ask Question ──────────────────────────────────────────────────
  /**
   * Answers a free-form sustainability question.
   * @param {string} userQuestion
   * @param {object|null} userProfile
   * @returns {Promise<{success: boolean, message: string}>}
   */
  async askQuestion(userQuestion, userProfile) {
    if (this.demoMode) return await this.getDemoResponse();

    const context = userProfile
      ? `User context: transport=${userProfile.transport}, diet=${userProfile.diet}, location=India.`
      : "";

    return await this.sendMessage(`${context}\n\nQuestion: ${userQuestion}`);
  },

  // ── Weekly Report ─────────────────────────────────────────────────
  /**
   * Generates a personalized weekly progress report.
   * @param {Array} weeklyData
   * @param {string[]} completedActions
   * @returns {Promise<{success: boolean, message: string}>}
   */
  async generateWeeklyReport(weeklyData, completedActions) {
    if (this.demoMode) return await this.getDemoResponse();

    const totalWeek  = weeklyData.reduce((s, d) => s + d.total, 0).toFixed(1);
    const avgDaily   = (totalWeek / 7).toFixed(1);
    const actionList = completedActions.join(", ") || "none yet";

    return await this.sendMessage(
      `Generate a friendly weekly carbon footprint report.
Stats: Total=${totalWeek}kg, Daily avg=${avgDaily}kg/day, India avg=5.2kg/day.
Actions completed: ${actionList}.
Keep to 4-5 sentences. Celebrate wins, note improvements, set one goal for next week.`
    );
  },

  // ── Reset ─────────────────────────────────────────────────────────
  /**
   * Resets conversation history and demo state.
   */
  resetConversation() {
    this.conversationHistory = [];
    this.demoStep            = 0;
    this.demoFallbackIndex   = 0;
  }

};