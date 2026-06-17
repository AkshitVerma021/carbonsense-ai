/**
 * @fileoverview CarbonSense AI — Persistence Layer
 * @description Handles all localStorage operations for profiles,
 *              carbon entries, completed actions, and streak tracking.
 * @version 2.0.0
 * @license MIT
 */

"use strict";

const Tracker = {

  /** @type {{profile: string, entries: string, actions: string, streak: string}} */
  KEYS: {
    profile: "cs_profile",
    entries: "cs_entries",
    actions: "cs_actions",
    streak:  "cs_streak"
  },

  // ── Profile ───────────────────────────────────────────────────────
  /**
   * Saves user lifestyle profile to localStorage.
   * @param {object} profile - User profile object
   */
  saveProfile(profile) {
    try {
      if (!profile || typeof profile !== "object") return;
      localStorage.setItem(this.KEYS.profile, JSON.stringify(profile));
    } catch (error) {
      console.error("Error saving profile:", error);
    }
  },

  /**
   * Loads user profile from localStorage.
   * @returns {object|null}
   */
  loadProfile() {
    try {
      const raw = localStorage.getItem(this.KEYS.profile);
      return raw ? JSON.parse(raw) : null;
    } catch (error) {
      console.error("Error loading profile:", error);
      return null;
    }
  },

  // ── Entries ───────────────────────────────────────────────────────
  /**
   * Saves a carbon activity entry with today's date.
   * @param {object} entry - Entry with total (number) and category (string)
   * @returns {object|null} Saved entry or null on failure
   */
  saveEntry(entry) {
    try {
      if (!entry || typeof entry.total !== "number") {
        console.warn("Invalid entry data:", entry);
        return null;
      }
      const entries = this.loadEntries();
      entry.id      = Date.now();
      entry.date    = new Date().toISOString().split("T")[0];
      entry.total   = parseFloat(entry.total.toFixed(3));
      entries.push(entry);
      localStorage.setItem(this.KEYS.entries, JSON.stringify(entries));
      return entry;
    } catch (error) {
      console.error("Error saving entry:", error);
      return null;
    }
  },

  /**
   * Loads all carbon entries from localStorage.
   * @returns {Array}
   */
  loadEntries() {
    try {
      const raw = localStorage.getItem(this.KEYS.entries);
      return raw ? JSON.parse(raw) : [];
    } catch (error) {
      console.error("Error loading entries:", error);
      return [];
    }
  },

  /**
   * Returns last 7 days of data grouped by date.
   * @returns {Array<{date: string, total: number, breakdown: object}>}
   */
  getWeeklyData() {
    try {
      const entries = this.loadEntries();
      const days    = {};

      for (let i = 6; i >= 0; i--) {
        const d   = new Date();
        d.setDate(d.getDate() - i);
        const key = d.toISOString().split("T")[0];
        days[key] = { date: key, total: 0, breakdown: {} };
      }

      entries.forEach(entry => {
        if (days[entry.date]) {
          days[entry.date].total += entry.total || 0;
          const cat = entry.category || "other";
          days[entry.date].breakdown[cat] =
            (days[entry.date].breakdown[cat] || 0) + (entry.total || 0);
        }
      });

      return Object.values(days);
    } catch (error) {
      console.error("Error getting weekly data:", error);
      return [];
    }
  },

  /**
   * Returns today's total footprint in kg CO2.
   * @returns {number}
   */
  getTodayFootprint() {
    try {
      const today   = new Date().toISOString().split("T")[0];
      const entries = this.loadEntries().filter(e => e.date === today);
      return entries.reduce((sum, e) => sum + (e.total || 0), 0);
    } catch (error) {
      console.error("Error getting today footprint:", error);
      return 0;
    }
  },

  /**
   * Returns total all-time footprint in kg CO2.
   * @returns {number}
   */
  getTotalFootprint() {
    try {
      return this.loadEntries().reduce((sum, e) => sum + (e.total || 0), 0);
    } catch (error) {
      return 0;
    }
  },

  // ── Actions ───────────────────────────────────────────────────────
  /**
   * Marks an action as completed (idempotent).
   * @param {string} actionId
   */
  completeAction(actionId) {
    try {
      if (!actionId || typeof actionId !== "string") return;
      const actions = this.loadCompletedActions();
      if (!actions.includes(actionId)) {
        actions.push(actionId);
        localStorage.setItem(this.KEYS.actions, JSON.stringify(actions));
      }
    } catch (error) {
      console.error("Error completing action:", error);
    }
  },

  /**
   * Returns array of completed action IDs.
   * @returns {string[]}
   */
  loadCompletedActions() {
    try {
      const raw = localStorage.getItem(this.KEYS.actions);
      return raw ? JSON.parse(raw) : [];
    } catch (error) {
      return [];
    }
  },

  /**
   * Calculates total CO2 saved from completed actions.
   * @returns {number} kg CO2 saved
   */
  getTotalSavings() {
    try {
      const completed = this.loadCompletedActions();
      return CarbonData.actions
        .filter(a => completed.includes(a.id))
        .reduce((sum, a) => sum + a.saving, 0);
    } catch (error) {
      return 0;
    }
  },

  // ── Streak ────────────────────────────────────────────────────────
  /**
   * Updates the daily logging streak.
   * @returns {{count: number, lastDate: string|null}}
   */
  updateStreak() {
    try {
      const today  = new Date().toISOString().split("T")[0];
      const streak = this.loadStreak();
      if (streak.lastDate === today) return streak;

      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yStr = yesterday.toISOString().split("T")[0];

      streak.count    = streak.lastDate === yStr ? streak.count + 1 : 1;
      streak.lastDate = today;
      localStorage.setItem(this.KEYS.streak, JSON.stringify(streak));
      return streak;
    } catch (error) {
      console.error("Error updating streak:", error);
      return { count: 0, lastDate: null };
    }
  },

  /**
   * Loads current streak data.
   * @returns {{count: number, lastDate: string|null}}
   */
  loadStreak() {
    try {
      const raw = localStorage.getItem(this.KEYS.streak);
      return raw ? JSON.parse(raw) : { count: 0, lastDate: null };
    } catch (error) {
      return { count: 0, lastDate: null };
    }
  },

  /**
   * Clears all stored data — full reset.
   */
  clearAll() {
    try {
      Object.values(this.KEYS).forEach(k => localStorage.removeItem(k));
    } catch (error) {
      console.error("Error clearing data:", error);
    }
  }

};