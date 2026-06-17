/**
 * @fileoverview CarbonSense AI — Main Application Controller
 * @description Manages screen routing, UI state, event handling,
 *              chart rendering and coordinates all modules.
 * @version 2.0.0
 * @license MIT
 */

"use strict";

const App = {

  /** @type {{screen: string, apiKey: string|null, profile: object|null, loading: boolean}} */
  state: {
    screen:  "welcome",
    apiKey:  null,
    profile: null,
    loading: false
  },

  // ── Boot ──────────────────────────────────────────────────────────
  /**
   * Initialises the app — loads saved state and routes to correct screen.
   * @returns {Promise<void>}
   */
  async init() {
    try {
      const savedKey = localStorage.getItem("cs_apikey");
      if (savedKey) {
        this.state.apiKey = savedKey;
        AICoach.init(savedKey);
      }

      const profile = Tracker.loadProfile();
      if (profile) this.state.profile = profile;

      if (!this.state.apiKey && !this.state.profile) {
        this.showScreen("welcome");
      } else if (!this.state.profile) {
        this.showScreen("chat");
        await this.beginOnboarding();
      } else {
        this.showScreen("dashboard");
        this.renderDashboard();
      }

      this.bindEvents();
    } catch (error) {
      console.error("App init error:", error);
      this.showScreen("welcome");
    }
  },

  // ── Screen Router ─────────────────────────────────────────────────
  /**
   * Shows a named screen and hides all others.
   * @param {string} name - Screen identifier
   */
  showScreen(name) {
    document.querySelectorAll(".screen").forEach(s => s.classList.remove("active"));
    const screen = document.getElementById(`screen-${name}`);
    if (screen) screen.classList.add("active");
    this.state.screen = name;
  },

  // ── Event Bindings ────────────────────────────────────────────────
  /**
   * Binds all DOM event listeners.
   */
  bindEvents() {
    const apiForm = document.getElementById("api-key-form");
    if (apiForm) apiForm.addEventListener("submit", e => { e.preventDefault(); this.handleApiKeySubmit(); });

    const sendBtn = document.getElementById("send-btn");
    if (sendBtn) sendBtn.addEventListener("click", () => this.handleChatSend());

    const chatInput = document.getElementById("chat-input");
    if (chatInput) {
      chatInput.addEventListener("keydown", e => {
        if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); this.handleChatSend(); }
      });
    }

    document.getElementById("nav-chat")?.addEventListener("click", () => this.showScreen("chat"));

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

    document.getElementById("log-today-btn")?.addEventListener("click", () => {
      this.showScreen("chat");
      this.promptDailyCheckin();
    });

    document.getElementById("weekly-report-btn")?.addEventListener("click", () => {
      this.generateWeeklyReport();
    });
  },

  // ── Security Helpers ──────────────────────────────────────────────
  /**
   * Sanitizes user input to prevent XSS attacks.
   * @param {string} input - Raw user input
   * @returns {string} Sanitized string
   */
  sanitizeInput(input) {
    if (typeof input !== "string") return "";
    return input
      .trim()
      .slice(0, 1000)
      .replace(/[<>]/g, "");
  },

  /**
   * Validates Anthropic API key format.
   * @param {string} key
   * @returns {boolean}
   */
  isValidApiKey(key) {
    return typeof key === "string" &&
           key.startsWith("sk-ant-") &&
           key.length > 20;
  },

  // ── API Key Submit ────────────────────────────────────────────────
  /**
   * Handles API key form submission.
   */
  handleApiKeySubmit() {
    try {
      const input = document.getElementById("api-key-input");
      const key   = input?.value.trim();

      if (key && !this.isValidApiKey(key)) {
        this.showToast("Invalid key format. Starting Demo Mode 🎮", "error");
        AICoach.init(null);
      } else if (key) {
        localStorage.setItem("cs_apikey", key);
        this.state.apiKey = key;
        AICoach.init(key);
        this.showToast("Live AI mode activated 🤖", "success");
      } else {
        AICoach.init(null);
        this.showToast("Starting Demo Mode 🎮 — explore all features!", "success");
      }

      this.showScreen("chat");
      this.beginOnboarding();
    } catch (error) {
      console.error("API key submit error:", error);
      this.showToast("Something went wrong. Please try again.", "error");
    }
  },

  // ── Onboarding ────────────────────────────────────────────────────
  /**
   * Starts the AI onboarding conversation.
   * @returns {Promise<void>}
   */
  async beginOnboarding() {
    try {
      AICoach.resetConversation();
      const greeting = await AICoach.startOnboarding();
      this.appendMessage("assistant", greeting);
    } catch (error) {
      console.error("Onboarding error:", error);
      this.showToast("Error starting chat. Please refresh.", "error");
    }
  },

  // ── Chat Send ─────────────────────────────────────────────────────
  /**
   * Handles sending a chat message.
   * @returns {Promise<void>}
   */
  async handleChatSend() {
    const input = document.getElementById("chat-input");
    const text  = this.sanitizeInput(input?.value || "");
    if (!text || this.state.loading) return;

    input.value = "";
    this.appendMessage("user", text);
    this.setLoading(true);

    try {
      const lowerText       = text.toLowerCase();
      const profileKeywords = [
        "flight","diet","electricity","vegetarian","vegan","meat",
        "car","bike","metro","bus","shop","energy","bill","walk","cycle"
      ];
      const mentionsProfile = profileKeywords.some(k => lowerText.includes(k));

      let result;
      if (AICoach.conversationHistory.length >= 8 && mentionsProfile) {
        result = await this.triggerProfileAnalysis(text);
      } else {
        result = await AICoach.askQuestion(text, this.state.profile);
      }

      if (result.success) {
        this.appendMessage("assistant", result.message);
        if (result.message.includes("Total estimated footprint")) {
          this.extractAndSaveProfile(text);
          this.showDashboardPrompt();
        }
      } else {
        this.appendMessage("assistant", `⚠️ ${result.message}`);
      }
    } catch (error) {
      console.error("Chat send error:", error);
      this.appendMessage("assistant", "⚠️ Something went wrong. Please try again.");
    } finally {
      this.setLoading(false);
    }
  },

  // ── Profile Analysis ──────────────────────────────────────────────
  /**
   * Triggers AI profile analysis from conversation history.
   * @param {string} lastMessage
   * @returns {Promise<{success: boolean, message: string}>}
   */
  async triggerProfileAnalysis(lastMessage) {
    const history = AICoach.conversationHistory
      .filter(m => m.role === "user")
      .map(m => m.content)
      .join(" ");

    const profile = this.extractProfileFromText(history + " " + lastMessage);
    return await AICoach.analyzeProfile(profile);
  },

  /**
   * Extracts a structured profile object from raw conversation text.
   * @param {string} text
   * @returns {object} Profile data
   */
  extractProfileFromText(text) {
    const lower = text.toLowerCase();

    let transport = "car_petrol";
    if (lower.includes("electric"))                               transport = "car_electric";
    else if (lower.includes("metro") || lower.includes("subway")) transport = "metro";
    else if (lower.includes("bus"))                               transport = "bus";
    else if (lower.includes("bike") || lower.includes("cycle"))  transport = "walking";
    else if (lower.includes("train"))                            transport = "train";
    else if (lower.includes("work from home") || lower.includes("wfh")) transport = "walking";

    let diet = "mixed";
    if (lower.includes("vegan"))                                       diet = "vegan";
    else if (lower.includes("vegetarian") || lower.includes("veggie")) diet = "vegetarian";
    else if (lower.includes("meat") || lower.includes("non-veg"))      diet = "meat-heavy";

    const kmMatch         = text.match(/(\d+)\s*km/i);
    const weeklyKm        = kmMatch ? parseInt(kmMatch[1]) : 100;

    const flightMatch     = text.match(/(\d+)\s*flight/i);
    const flights         = flightMatch ? parseInt(flightMatch[1]) : 2;

    const billMatch       = text.match(/₹?\s*(\d+)/);
    const electricityBill = billMatch ? parseInt(billMatch[1]) : 1500;

    let shopping = "moderate";
    if (lower.includes("shop a lot") || lower.includes("online"))    shopping = "heavy";
    else if (lower.includes("minimal") || lower.includes("rarely"))  shopping = "minimal";

    const profile = { transport, diet, weeklyKm, flights, electricityBill, shopping };
    Tracker.saveProfile(profile);
    this.state.profile = profile;
    return profile;
  },

  /**
   * Finalises profile save and updates streak.
   */
  extractAndSaveProfile() {
    try {
      Tracker.updateStreak();
    } catch (error) {
      console.error("Profile save error:", error);
    }
  },

  // ── Daily Check-in ────────────────────────────────────────────────
  /**
   * Prompts user to log today's carbon activities.
   * @returns {Promise<void>}
   */
  async promptDailyCheckin() {
    const prompt = "I want to log today's carbon activities. Ask me about my transport, food and energy use today in a friendly way.";
    this.appendMessage("user", prompt);
    this.setLoading(true);

    try {
      const result = await AICoach.askQuestion(prompt, this.state.profile);
      if (result.success) this.appendMessage("assistant", result.message);
    } catch (error) {
      console.error("Daily checkin error:", error);
    } finally {
      this.setLoading(false);
    }
  },

  // ── Weekly Report ─────────────────────────────────────────────────
  /**
   * Generates and displays a weekly AI progress report.
   * @returns {Promise<void>}
   */
  async generateWeeklyReport() {
    this.showScreen("chat");
    this.setLoading(true);

    try {
      const weeklyData       = Tracker.getWeeklyData();
      const completedActions = Tracker.loadCompletedActions();
      const result           = await AICoach.generateWeeklyReport(weeklyData, completedActions);

      if (result.success) {
        this.appendMessage("assistant", `📊 **Your Weekly Report**\n\n${result.message}`);
      }
    } catch (error) {
      console.error("Weekly report error:", error);
      this.showToast("Error generating report.", "error");
    } finally {
      this.setLoading(false);
    }
  },

  // ── Dashboard ─────────────────────────────────────────────────────
  /**
   * Renders all dashboard components.
   */
  renderDashboard() {
    try {
      const weeklyData = Tracker.getWeeklyData();
      const streak     = Tracker.loadStreak();
      const savings    = Tracker.getTotalSavings();
      const todayTotal = Tracker.getTodayFootprint();

      this.setText("stat-today",   `${todayTotal.toFixed(1)} kg`);
      this.setText("stat-streak",  `${streak.count} days`);
      this.setText("stat-savings", `${savings} kg saved`);

      const annualEstimate = todayTotal > 0 ? todayTotal * 365 : 1900;
      const level          = getFootprintLevel(annualEstimate);
      const levelEl        = document.getElementById("footprint-level");
      if (levelEl) {
        levelEl.textContent = level.level;
        levelEl.style.color = level.color;
      }

      this.renderActions();
      this.renderWeeklyChart(weeklyData);
    } catch (error) {
      console.error("Dashboard render error:", error);
      this.showToast("Error loading dashboard.", "error");
    }
  },

  /**
   * Renders the actions checklist with completion state.
   */
  renderActions() {
    try {
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
    } catch (error) {
      console.error("Actions render error:", error);
    }
  },

  /**
   * Toggles an action's completion state.
   * @param {string} actionId
   */
  toggleAction(actionId) {
    if (!actionId || typeof actionId !== "string") return;
    try {
      Tracker.completeAction(actionId);
      this.renderActions();
      const savings = Tracker.getTotalSavings();
      this.setText("stat-savings", `${savings} kg saved`);
      this.showToast("Great choice! Every action counts 🌱", "success");
    } catch (error) {
      console.error("Toggle action error:", error);
      this.showToast("Something went wrong. Please try again.", "error");
    }
  },

  /**
   * Renders the weekly emissions bar chart.
   * @param {Array} weeklyData
   */
  renderWeeklyChart(weeklyData) {
    const canvas = document.getElementById("weekly-chart");
    if (!canvas) { console.warn("Chart canvas not found"); return; }
    if (typeof Chart === "undefined") { console.warn("Chart.js not loaded"); return; }

    try {
      if (window._weeklyChart) window._weeklyChart.destroy();

      const labels = weeklyData.map(d =>
        new Date(d.date).toLocaleDateString("en-IN", { weekday: "short" })
      );
      const data = weeklyData.map(d => parseFloat(d.total.toFixed(2)));

      window._weeklyChart = new Chart(canvas, {
        type: "bar",
        data: {
          labels,
          datasets: [{
            label:           "kg CO₂",
            data,
            backgroundColor: data.map(v =>
              v <= 5.2 ? "#22c55e" : v <= 8 ? "#f59e0b" : "#ef4444"
            ),
            borderRadius: 8
          }]
        },
        options: {
          responsive:          true,
          maintainAspectRatio: false,
          plugins: {
            legend: { display: false },
            tooltip: { callbacks: { label: ctx => `${ctx.raw} kg CO₂` } }
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
    } catch (error) {
      console.error("Chart render error:", error);
    }
  },

  // ── UI Helpers ────────────────────────────────────────────────────
  /**
   * Appends a chat message to the conversation.
   * @param {"user"|"assistant"} role
   * @param {string} text
   */
  appendMessage(role, text) {
    const container = document.getElementById("chat-messages");
    if (!container) return;

    const div     = document.createElement("div");
    div.className = `message message-${role}`;
    div.setAttribute("role", "article");
    div.setAttribute("aria-label", `${role === "user" ? "You" : "CarbonSense"} said`);

    // Sanitize to prevent XSS then apply safe markdown
    const sanitized = text
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#x27;");

    const formatted = sanitized
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

  /**
   * Shows or hides the typing/loading indicator.
   * @param {boolean} isLoading
   */
  setLoading(isLoading) {
    this.state.loading = isLoading;
    const indicator    = document.getElementById("loading-indicator");
    const sendBtn      = document.getElementById("send-btn");
    if (indicator) indicator.style.display = isLoading ? "flex" : "none";
    if (sendBtn)   sendBtn.disabled        = isLoading;
  },

  /**
   * Sets the text content of an element by ID.
   * @param {string} id
   * @param {string} text
   */
  setText(id, text) {
    const el = document.getElementById(id);
    if (el) el.textContent = text;
  },

  /**
   * Displays a toast notification.
   * @param {string} message
   * @param {"success"|"error"} type
   */
  showToast(message, type = "success") {
    try {
      const toast     = document.createElement("div");
      toast.className = `toast toast-${type}`;
      toast.setAttribute("role", "alert");
      toast.setAttribute("aria-live", "assertive");
      toast.textContent = message;
      document.body.appendChild(toast);

      setTimeout(() => toast.classList.add("visible"), 10);
      setTimeout(() => {
        toast.classList.remove("visible");
        setTimeout(() => toast.remove(), 300);
      }, 3000);
    } catch (error) {
      console.error("Toast error:", error);
    }
  },

  /**
   * Shows navigation prompt after onboarding completes.
   */
  showDashboardPrompt() {
    setTimeout(() => {
      this.appendMessage("assistant",
        `🎉 Profile complete! Head to your **Dashboard** to see your footprint breakdown and track your progress. You can keep chatting with me anytime for tips! 🌱`
      );
    }, 1000);
  }

};

// Boot when DOM is ready
document.addEventListener("DOMContentLoaded", () => App.init());