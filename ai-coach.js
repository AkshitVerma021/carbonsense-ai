// ai-coach.js
// Handles all Claude AI interactions — onboarding, insights, action plans

const AICoach = {

    apiKey: null,
    conversationHistory: [],

    // ── Initialize with API Key ───────────────────────────────────────
    init(apiKey) {
        this.apiKey = apiKey;
        this.conversationHistory = [];
    },

    // ── Core API Call ─────────────────────────────────────────────────
    async sendMessage(userMessage, systemPrompt = null) {
        this.conversationHistory.push({
            role: "user",
            content: userMessage
        });

        const system = systemPrompt || this.getDefaultSystemPrompt();

        try {
            const response = await fetch("https://api.anthropic.com/v1/messages", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "x-api-key": this.apiKey,
                    "anthropic-version": "2023-06-01",
                    "anthropic-dangerous-client-side-api-key-flag": "true"
                },
                body: JSON.stringify({
                    model: "claude-opus-4-6",
                    max_tokens: 1024,
                    system: system,
                    messages: this.conversationHistory
                })
            });

            if (!response.ok) {
                const err = await response.json();
                throw new Error(err.error?.message || "API call failed");
            }

            const data = await response.json();
            const reply = data.content[0].text;

            // Save assistant reply to history
            this.conversationHistory.push({
                role: "assistant",
                content: reply
            });

            return { success: true, message: reply };

        } catch (error) {
            return { success: false, message: `Error: ${error.message}` };
        }
    },

    // ── System Prompt ─────────────────────────────────────────────────
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
4. Compare user's footprint to India average (1,900 kg CO2/year) and world average (4,000 kg)

Important rules:
- Keep responses concise (3-5 sentences max unless doing a full analysis)
- Never make the user feel bad about their choices
- Always end with either a question OR a clear next step
- When giving the action plan, format it as a numbered list with emoji icons`;
    },

    // ── Onboarding Flow ───────────────────────────────────────────────
    async startOnboarding() {
        const greeting = `Hi! I'm CarbonSense 🌍 — your personal carbon footprint coach.

I'll ask you a few quick questions about your daily life, then show you exactly where your emissions come from and your top actions to reduce them.

Ready to discover your carbon footprint? Let's start! 🚀

**First question:** How do you mainly get around on a typical day? (For example: car, bike, metro, bus, work from home)`;

        this.conversationHistory.push({
            role: "assistant",
            content: greeting
        });

        return greeting;
    },

    // ── Profile Analysis ──────────────────────────────────────────────
    async analyzeProfile(profileData) {
        const prompt = `Based on this user profile, calculate their estimated annual carbon footprint and give a breakdown by category. Then provide their top 3 personalized actions to reduce it.

User Profile:
- Transport: ${profileData.transport}
- Weekly km travelled: ${profileData.weeklyKm} km
- Diet type: ${profileData.diet}
- Monthly electricity bill: ₹${profileData.electricityBill}
- Flights per year: ${profileData.flights}
- Shopping habits: ${profileData.shopping}
- Location: ${profileData.location || "India"}

Use the following emission factors:
- Petrol car: 0.21 kg CO2/km, Electric car: 0.05 kg/km, Bus: 0.089 kg/km, Metro: 0.031 kg/km
- Meat-heavy diet: ~2,500 kg/year, Mixed diet: ~1,500 kg/year, Vegetarian: ~1,000 kg/year, Vegan: ~600 kg/year
- India electricity grid: 0.82 kg CO2/kWh (assume ₹8/kWh avg)
- Short flight: ~255 kg CO2 each

Format your response as:
1. 🎯 Total estimated footprint: X,XXX kg CO2/year
2. 📊 Breakdown (transport / food / energy / shopping %)
3. 📈 Compared to India average (1,900 kg/year)
4. ✅ Your Top 3 Actions (numbered, with kg CO2 saved per year)
5. One encouraging closing line`;

        return await this.sendMessage(prompt);
    },

    // ── Daily Check-in ────────────────────────────────────────────────
    async dailyCheckin(todayData) {
        const prompt = `The user logged today's activities:
- Transport: ${todayData.transport} for ${todayData.km} km
- Meals: ${todayData.meals}
- Energy usage: ${todayData.energy || "not logged"}

Today's total: ${todayData.total} kg CO2

Give a brief (2-3 sentence) friendly check-in response. Compare to their daily target if possible (India avg = ~5.2 kg/day). End with one small tip for tomorrow.`;

        return await this.sendMessage(prompt);
    },

    // ── Custom Question ───────────────────────────────────────────────
    async askQuestion(userQuestion, userProfile) {
        const context = userProfile
            ? `Context about this user: transport=${userProfile.transport}, diet=${userProfile.diet}, location=${userProfile.location || "India"}.`
            : "";

        const prompt = `${context}\n\nUser question: ${userQuestion}`;
        return await this.sendMessage(prompt);
    },

    // ── Generate Weekly Report ────────────────────────────────────────
    async generateWeeklyReport(weeklyData, completedActions) {
        const totalWeek = weeklyData.reduce((s, d) => s + d.total, 0).toFixed(1);
        const avgDaily = (totalWeek / 7).toFixed(1);
        const actionList = completedActions.join(", ") || "none yet";

        const prompt = `Generate a friendly weekly carbon footprint report.

Weekly stats:
- Total this week: ${totalWeek} kg CO2
- Daily average: ${avgDaily} kg CO2/day
- India daily average: 5.2 kg/day
- Actions completed this week: ${actionList}

Keep it to 4-5 sentences. Celebrate wins, note areas to improve, set one goal for next week.`;

        return await this.sendMessage(prompt);
    },

    // ── Clear History (new session) ───────────────────────────────────
    resetConversation() {
        this.conversationHistory = [];
    }

};