// app.js
// Main application controller — wires AI, Tracker, and CarbonData together

const App = {

  state: {
    screen:       "welcome",   // welcome | setup | chat | dashboard
    apiKey:       null,
    profile:      null,
    onboarding:   false,
    loading:      false
  },

  // ── Boot ──────────────────────────────────────────────────────────
  async init() {
    // Load saved API key
    const savedKey = localStorage.getItem("cs_apikey");
    if (savedKey) {
      this.state.apiKey = savedKey;
      AICoach.init(savedKey);
    }

    // Load saved profile
    const profile = Tracker.loadProfile();
    if (profile) {
      this.state.profile = profile;
    }

    // Decide starting screen
    if (!this.state.apiKey) {
      this.showScreen("welcome");
    } else if (!this.state.profile) {
      this.showScreen("chat");
      await this.beginOnboarding();
    } else {
      this.showScreen("dashboard");
      this.renderDashboard();
    }

    this.bindEvents();
  },

  // ── Screen Router ─────────────────────────────────────────────────
  showScreen(name) {
    document.querySelectorAll(".screen").forEach(s => s.classList.remove("active"));
    const screen = document.getElementById(`screen-${name}`);
    if (screen) screen.classList.add("active");
    this.state.screen = name;
  },

  // ── Event Bindings ────────────────────────────────────────────────
  bindEvents() {
    // API Key submit
    const apiForm = document.getElementById("api-key-form");
    if (apiForm) {
      apiForm.addEventListener("submit", e => {
        e.preventDefault();
        this.handleApiKeySubmit();
      });
    }

    // Chat send button
    const sendBtn = document.getElementById("send-btn");
    if (sendBtn) {
      sendBtn.addEventListener("click", () => this.handleChatSend());
    }

    // Chat input enter key
    const chatInput = document.getElementById("chat-input");
    if (chatInput) {
      chatInput.addEventListener("keydown", e => {
        if (e.key === "Enter" && !e.shiftKey) {
          e.preventDefault();
          this.handleChatSend();
        }
      });
    }

    // Nav buttons
    document.getElementById("nav-chat")?.addEventListener("click", () => {
      this.showScreen("chat");
    });

    document.getElementById("nav-dashboard")?.addEventListener("click", () => {
      this.showScreen("dashboard");
      this.renderDashboard();
    });

    document.getElementById("nav-reset")?.addEventListener("click", () => {
      if (confirm("Reset all your data and start fresh?")) {
        Tracker.clearAll();
        localStorage.removeItem("cs_apikey");
        location.reload();
      }
    });

    // Log today button
    document.getElementById("log-today-btn")?.addEventListener("click", () => {
      this.showScreen("chat");
      this.promptDailyCheckin();
    });

    // Weekly report button
    document.getElementById("weekly-report-btn")?.addEventListener("click", () => {
      this.generateWeeklyReport();
    });
  },

  // ── API Key Handling ──────────────────────────────────────────────
  handleApiKeySubmit() {
    const input = document.getElementById("api-key-input");
    const key   = input?.value.trim();

    // Allow empty key — triggers demo mode
    if (key && !key.startsWith("sk-ant-")) {
      this.showToast("Invalid API key format. Starting Demo Mode instead 🎮", "error");
      AICoach.init(null);
    } else if (key) {
      localStorage.setItem("cs_apikey", key);
      this.state.apiKey = key;
      AICoach.init(key);
      this.showToast("API key saved! Live AI mode activated 🤖", "success");
    } else {
      // No key entered — demo mode
      AICoach.init(null);
      this.showToast("Starting Demo Mode 🎮 — explore all features!", "success");
    }

    this.showScreen("chat");
    this.beginOnboarding();
  },

  // ── Onboarding ────────────────────────────────────────────────────
  async beginOnboarding() {
    this.state.onboarding = true;
    AICoach.resetConversation();

    const greeting = await AICoach.startOnboarding();
    this.appendMessage("assistant", greeting);
  },

  // ── Chat Handling ─────────────────────────────────────────────────
  async handleChatSend() {
    const input = document.getElementById("chat-input");
    const text  = input?.value.trim();
    if (!text || this.state.loading) return;

    input.value = "";
    this.appendMessage("user", text);
    this.setLoading(true);

    // Check if onboarding is complete (detect key phrases)
    const lowerText = text.toLowerCase();
    const profileKeywords = ["flight", "diet", "electricity", "vegetarian",
                              "vegan", "meat", "car", "bike", "metro", "bus"];
    const mentionsProfile = profileKeywords.some(k => lowerText.includes(k));

    let result;

    // If onboarding and user has answered enough questions, trigger analysis
    if (this.state.onboarding &&
        AICoach.conversationHistory.length >= 8 &&
        mentionsProfile) {
      result = await this.triggerProfileAnalysis(text);
    } else {
      result = await AICoach.askQuestion(text, this.state.profile);
    }

    this.setLoading(false);

    if (result.success) {
      this.appendMessage("assistant", result.message);

      // Check if profile analysis just completed
      if (result.message.includes("Total estimated footprint")) {
        this.state.onboarding = false;
        this.extractAndSaveProfile(result.message);
        this.showDashboardPrompt();
      }
    } else {
      this.appendMessage("assistant", `⚠️ ${result.message}`);
    }
  },

  // ── Profile Analysis Trigger ──────────────────────────────────────
  async triggerProfileAnalysis(lastMessage) {
    // Extract profile from conversation history
    const history  = AICoach.conversationHistory
      .filter(m => m.role === "user")
      .map(m => m.content)
      .join(" ");

    const profile = this.extractProfileFromText(history + " " + lastMessage);
    return await AICoach.analyzeProfile(profile);
  },

  extractProfileFromText(text) {
    const lower = text.toLowerCase();

    // Transport detection
    let transport = "car_petrol";
    if (lower.includes("electric"))  transport = "car_electric";
    else if (lower.includes("metro") || lower.includes("subway")) transport = "metro";
    else if (lower.includes("bus"))  transport = "bus";
    else if (lower.includes("bike") || lower.includes("cycle")) transport = "walking";
    else if (lower.includes("train")) transport = "train";
    else if (lower.includes("work from home") || lower.includes("wfh")) transport = "walking";

    // Diet detection
    let diet = "mixed";
    if (lower.includes("vegan"))        diet = "vegan";
    else if (lower.includes("vegetarian") || lower.includes("veggie")) diet = "vegetarian";
    else if (lower.includes("meat") || lower.includes("non-veg")) diet = "meat-heavy";

    // Weekly km (default estimate)
    const kmMatch = text.match(/(\d+)\s*km/i);
    const weeklyKm = kmMatch ? parseInt(kmMatch[1]) : 100;

    // Flights
    const flightMatch = text.match(/(\d+)\s*flight/i);
    const flights = flightMatch ? parseInt(flightMatch[1]) : 2;

    // Electricity bill
    const billMatch = text.match(/₹?\s*(\d+)/);
    const electricityBill = billMatch ? parseInt(billMatch[1]) : 1500;

    // Shopping
    let shopping = "moderate";
    if (lower.includes("shop a lot") || lower.includes("online"))  shopping = "heavy";
    else if (lower.includes("minimal") || lower.includes("rarely")) shopping = "minimal";

    const profile = { transport, diet, weeklyKm, flights, electricityBill, shopping };

    // Save to tracker
    Tracker.saveProfile(profile);
    this.state.profile = profile;

    return profile;
  },

  extractAndSaveProfile(analysisText) {
    // Profile was already saved in extractProfileFromText
    // Update streak
    Tracker.updateStreak();
  },

  // ── Daily Check-in Prompt ─────────────────────────────────────────
  async promptDailyCheckin() {
    const prompt = `I want to log today's carbon activities. Ask me what I did today for transport, food and energy in a friendly conversational way.`;
    this.appendMessage("user", prompt);
    this.setLoading(true);

    const result = await AICoach.askQuestion(prompt, this.state.profile);
    this.setLoading(false);

    if (result.success) this.appendMessage("assistant", result.message);
  },

  // ── Weekly Report ─────────────────────────────────────────────────
  async generateWeeklyReport() {
    this.showScreen("chat");
    this.setLoading(true);

    const weeklyData       = Tracker.getWeeklyData();
    const completedActions = Tracker.loadCompletedActions();
    const result           = await AICoach.generateWeeklyReport(weeklyData, completedActions);

    this.setLoading(false);

    if (result.success) {
      this.appendMessage("assistant", `📊 **Your Weekly Report**\n\n${result.message}`);
    }
  },

  // ── Dashboard Render ──────────────────────────────────────────────
  renderDashboard() {
    const weeklyData  = Tracker.getWeeklyData();
    const streak      = Tracker.loadStreak();
    const savings     = Tracker.getTotalSavings();
    const todayTotal  = Tracker.getTodayFootprint();
    const profile     = this.state.profile;

    // Update stat cards
    this.setText("stat-today",   `${todayTotal.toFixed(1)} kg`);
    this.setText("stat-streak",  `${streak.count} days`);
    this.setText("stat-savings", `${savings} kg saved`);

    // Render actions list
    this.renderActions();

    // Render chart
    this.renderWeeklyChart(weeklyData);
  },

  renderActions() {
    const completed = Tracker.loadCompletedActions();
    const container = document.getElementById("actions-list");
    if (!container) return;

    container.innerHTML = CarbonData.actions.map(action => `
      <div class="action-card ${completed.includes(action.id) ? "completed" : ""}"
           data-id="${action.id}">
        <div class="action-info">
          <span class="action-title">${action.title}</span>
          <span class="action-saving">saves ~${action.saving} kg CO₂/year</span>
          <span class="action-tip">${action.tip}</span>
        </div>
        <button class="action-btn"
                onclick="App.toggleAction('${action.id}')"
                aria-label="${completed.includes(action.id) ? "Undo" : "Mark complete"}: ${action.title}">
          ${completed.includes(action.id) ? "✅" : "○"}
        </button>
      </div>
    `).join("");
  },

  toggleAction(actionId) {
    Tracker.completeAction(actionId);
    this.renderActions();
    const savings = Tracker.getTotalSavings();
    this.setText("stat-savings", `${savings} kg saved`);
    this.showToast("Great choice! Every action counts 🌱", "success");
  },

  renderWeeklyChart(weeklyData) {
    const canvas = document.getElementById("weekly-chart");
    if (!canvas || typeof Chart === "undefined") return;

    // Destroy existing chart
    if (window._weeklyChart) window._weeklyChart.destroy();

    const labels = weeklyData.map(d => {
      const date = new Date(d.date);
      return date.toLocaleDateString("en-IN", { weekday: "short" });
    });

    window._weeklyChart = new Chart(canvas, {
      type: "bar",
      data: {
        labels,
        datasets: [{
          label:           "kg CO₂",
          data:            weeklyData.map(d => d.total.toFixed(2)),
          backgroundColor: weeklyData.map(d =>
            d.total <= 5.2 ? "#22c55e" : d.total <= 8 ? "#f59e0b" : "#ef4444"
          ),
          borderRadius: 8
        }]
      },
      options: {
        responsive:         true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              label: ctx => `${ctx.raw} kg CO₂`
            }
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            grid:  { color: "rgba(255,255,255,0.1)" },
            ticks: { color: "#94a3b8" }
          },
          x: {
            grid:  { display: false },
            ticks: { color: "#94a3b8" }
          }
        }
      }
    });
  },

  // ── Dashboard Prompt After Onboarding ─────────────────────────────
  showDashboardPrompt() {
    setTimeout(() => {
      this.appendMessage("assistant",
        `🎉 Profile complete! Head to your **Dashboard** to see your footprint breakdown and track your progress. You can keep chatting with me anytime for tips or questions! 🌱`
      );
    }, 1000);
  },

  // ── Chat UI Helpers ───────────────────────────────────────────────
  appendMessage(role, text) {
    const container = document.getElementById("chat-messages");
    if (!container) return;

    const div       = document.createElement("div");
    div.className   = `message message-${role}`;
    div.setAttribute("role", "article");
    div.setAttribute("aria-label", `${role === "user" ? "You" : "CarbonSense"} said`);

    // Convert basic markdown bold (**text**) to <strong>
    const formatted = text
      .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
      .replace(/\n/g, "<br>");

    div.innerHTML = `
      <div class="message-bubble">${formatted}</div>
      <div class="message-time">${new Date().toLocaleTimeString("en-IN",
        { hour: "2-digit", minute: "2-digit" })}</div>
    `;

    container.appendChild(div);
    container.scrollTop = container.scrollHeight;
  },

  setLoading(isLoading) {
    this.state.loading = isLoading;
    const indicator    = document.getElementById("loading-indicator");
    const sendBtn      = document.getElementById("send-btn");

    if (indicator) indicator.style.display = isLoading ? "flex" : "none";
    if (sendBtn)   sendBtn.disabled        = isLoading;
  },

  setText(id, text) {
    const el = document.getElementById(id);
    if (el) el.textContent = text;
  },

  showToast(message, type = "success") {
    const toast     = document.createElement("div");
    toast.className = `toast toast-${type}`;
    toast.setAttribute("role", "alert");
    toast.textContent = message;
    document.body.appendChild(toast);

    setTimeout(() => toast.classList.add("visible"), 10);
    setTimeout(() => {
      toast.classList.remove("visible");
      setTimeout(() => toast.remove(), 300);
    }, 3000);
  }

};

// Boot the app when DOM is ready
document.addEventListener("DOMContentLoaded", () => App.init());