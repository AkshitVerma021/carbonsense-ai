/**
 * @fileoverview CarbonSense AI — Persistence Layer
 * @description Handles all localStorage operations for profiles,
 *              carbon entries, completed actions, and streak tracking.
 * @version 1.0.0
 */

// tracker.js
// Handles all localStorage persistence — saving & loading user data

const Tracker = {

    KEYS: {
        profile: "cs_profile",
        entries: "cs_entries",
        actions: "cs_actions",
        streak: "cs_streak"
    },

    // ── Profile (user's lifestyle info) ──────────────────────────────
    saveProfile(profile) {
        localStorage.setItem(this.KEYS.profile, JSON.stringify(profile));
    },

    loadProfile() {
        const raw = localStorage.getItem(this.KEYS.profile);
        return raw ? JSON.parse(raw) : null;
    },

    // ── Carbon Entries (daily footprint logs) ────────────────────────
    saveEntry(entry) {
        const entries = this.loadEntries();
        entry.id = Date.now();
        entry.date = new Date().toISOString().split("T")[0]; // YYYY-MM-DD
        entries.push(entry);
        localStorage.setItem(this.KEYS.entries, JSON.stringify(entries));
        return entry;
    },

    loadEntries() {
        const raw = localStorage.getItem(this.KEYS.entries);
        return raw ? JSON.parse(raw) : [];
    },

    // Get entries grouped by week (last 7 days)
    getWeeklyData() {
        const entries = this.loadEntries();
        const days = {};

        // Build last 7 days map
        for (let i = 6; i >= 0; i--) {
            const d = new Date();
            d.setDate(d.getDate() - i);
            const key = d.toISOString().split("T")[0];
            days[key] = { date: key, total: 0, breakdown: {} };
        }

        // Fill in entries
        entries.forEach(entry => {
            if (days[entry.date]) {
                days[entry.date].total += entry.total || 0;
                const cat = entry.category || "other";
                days[entry.date].breakdown[cat] =
                    (days[entry.date].breakdown[cat] || 0) + (entry.total || 0);
            }
        });

        return Object.values(days);
    },

    // Get total footprint (all time)
    getTotalFootprint() {
        return this.loadEntries().reduce((sum, e) => sum + (e.total || 0), 0);
    },

    // Get today's footprint
    getTodayFootprint() {
        const today = new Date().toISOString().split("T")[0];
        const entries = this.loadEntries().filter(e => e.date === today);
        return entries.reduce((sum, e) => sum + (e.total || 0), 0);
    },

    // ── Completed Actions ─────────────────────────────────────────────
    completeAction(actionId) {
        const actions = this.loadCompletedActions();
        if (!actions.includes(actionId)) {
            actions.push(actionId);
            localStorage.setItem(this.KEYS.actions, JSON.stringify(actions));
        }
    },

    loadCompletedActions() {
        const raw = localStorage.getItem(this.KEYS.actions);
        return raw ? JSON.parse(raw) : [];
    },

    getTotalSavings() {
        const completed = this.loadCompletedActions();
        return CarbonData.actions
            .filter(a => completed.includes(a.id))
            .reduce((sum, a) => sum + a.saving, 0);
    },

    // ── Streak Tracking ───────────────────────────────────────────────
    updateStreak() {
        const today = new Date().toISOString().split("T")[0];
        const streak = this.loadStreak();

        if (streak.lastDate === today) return streak; // already logged today

        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const yStr = yesterday.toISOString().split("T")[0];

        if (streak.lastDate === yStr) {
            streak.count++;               // consecutive day
        } else {
            streak.count = 1;             // reset streak
        }

        streak.lastDate = today;
        localStorage.setItem(this.KEYS.streak, JSON.stringify(streak));
        return streak;
    },

    loadStreak() {
        const raw = localStorage.getItem(this.KEYS.streak);
        return raw ? JSON.parse(raw) : { count: 0, lastDate: null };
    },

    // ── Reset Everything ──────────────────────────────────────────────
    clearAll() {
        Object.values(this.KEYS).forEach(k => localStorage.removeItem(k));
    }

};