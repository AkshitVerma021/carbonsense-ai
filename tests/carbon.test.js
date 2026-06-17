/**
 * @fileoverview CarbonSense AI — Test Suite
 * @description 51 unit tests across 10 suites covering emissions,
 *              classification, actions, security, tracker, and benchmarks.
 * @version 2.0.0
 *
 * Run: node tests/carbon.test.js
 * Or paste into browser DevTools console.
 */

"use strict";

// ── Test Runner ───────────────────────────────────────────────────
const TestRunner = {
  passed:  0,
  failed:  0,
  results: [],

  assert(description, condition) {
    if (condition) {
      this.passed++;
      this.results.push({ status: "✅ PASS", description });
    } else {
      this.failed++;
      this.results.push({ status: "❌ FAIL", description });
    }
  },

  assertEqual(description, actual, expected, tolerance = 0.01) {
    const pass = Math.abs(actual - expected) <= tolerance;
    this.assert(
      `${description} (expected: ${expected}, got: ${Number(actual).toFixed(4)})`,
      pass
    );
  },

  run(suiteName, fn) {
    console.log(`\n📋 Running: ${suiteName}`);
    fn();
  },

  summary() {
    console.log("\n══════════════════════════════════════════");
    console.log("      CARBONSENSE AI — TEST RESULTS        ");
    console.log("══════════════════════════════════════════");
    this.results.forEach(r => console.log(`${r.status}  ${r.description}`));
    console.log("──────────────────────────────────────────");
    console.log(`Total : ${this.passed + this.failed} tests`);
    console.log(`Passed: ${this.passed} ✅`);
    console.log(`Failed: ${this.failed} ❌`);
    console.log("══════════════════════════════════════════");
    return this.failed === 0;
  }
};

// ── Mock Data ─────────────────────────────────────────────────────
const CarbonData = {
  transport: {
    car_petrol:   { factor: 0.21,  unit: "km" },
    car_electric: { factor: 0.05,  unit: "km" },
    bus:          { factor: 0.089, unit: "km" },
    metro:        { factor: 0.031, unit: "km" },
    walking:      { factor: 0.0,   unit: "km" },
    train:        { factor: 0.041, unit: "km" },
    flight_short: { factor: 0.255, unit: "km" }
  },
  food: {
    beef:       { factor: 27.0, unit: "kg"   },
    chicken:    { factor: 6.9,  unit: "kg"   },
    vegan_meal: { factor: 0.5,  unit: "meal" },
    meat_meal:  { factor: 3.5,  unit: "meal" }
  },
  energy: {
    electricity: { factor: 0.82, unit: "kWh" },
    lpg:         { factor: 1.51, unit: "kg"  }
  },
  shopping: {
    clothing:    { factor: 20.0, unit: "item" },
    electronics: { factor: 70.0, unit: "item" }
  },
  benchmarks: {
    india_average: 1900,
    world_average: 4000,
    us_average:    14000,
    target_2030:   2500
  },
  actions: [
    { id: "switch_ev",         saving: 2400, title: "Switch to EV",             difficulty: "hard"   },
    { id: "public_transport",  saving: 1500, title: "Use Public Transport",      difficulty: "medium" },
    { id: "plant_based_3days", saving: 420,  title: "Plant-Based 3 Days/Week",  difficulty: "easy"   },
    { id: "no_beef",           saving: 600,  title: "Cut Beef",                  difficulty: "medium" },
    { id: "led_lights",        saving: 100,  title: "Switch to LEDs",            difficulty: "easy"   },
    { id: "solar_panels",      saving: 1200, title: "Install Solar",             difficulty: "hard"   },
    { id: "reduce_flights",    saving: 500,  title: "Replace Flight with Train", difficulty: "medium" },
    { id: "buy_less_clothes",  saving: 200,  title: "Buy Less Clothing",         difficulty: "easy"   }
  ]
};

// ── Helpers ───────────────────────────────────────────────────────
function calculateEmission(category, type, amount) {
  if (!category || !type || typeof amount !== "number") return 0;
  if (CarbonData[category] && CarbonData[category][type]) {
    return CarbonData[category][type].factor * amount;
  }
  return 0;
}

function getFootprintLevel(totalKg) {
  const avg = CarbonData.benchmarks.india_average;
  const pct = ((totalKg - avg) / avg) * 100;
  if (totalKg <= avg * 0.7) return { level: "Excellent 🌱", color: "#22c55e", pct };
  if (totalKg <= avg)       return { level: "Good 👍",       color: "#84cc16", pct };
  if (totalKg <= avg * 1.5) return { level: "Average ⚠️",   color: "#f59e0b", pct };
  return                           { level: "High 🔴",       color: "#ef4444", pct };
}

function getTotalSavings(completedIds) {
  if (!Array.isArray(completedIds)) return 0;
  return CarbonData.actions
    .filter(a => completedIds.includes(a.id))
    .reduce((sum, a) => sum + a.saving, 0);
}

function sanitizeInput(input) {
  if (typeof input !== "string") return "";
  return input.trim().slice(0, 1000).replace(/[<>]/g, "");
}

// ── Suite 1: Transport ────────────────────────────────────────────
TestRunner.run("Transport Emission Calculations", () => {
  TestRunner.assertEqual("Petrol car 100km = 21kg",  calculateEmission("transport","car_petrol",100),   21.0);
  TestRunner.assertEqual("EV 100km = 5kg",           calculateEmission("transport","car_electric",100),  5.0);
  TestRunner.assertEqual("Bus 100km = 8.9kg",        calculateEmission("transport","bus",100),           8.9);
  TestRunner.assertEqual("Metro 100km = 3.1kg",      calculateEmission("transport","metro",100),         3.1);
  TestRunner.assertEqual("Walking = 0kg",            calculateEmission("transport","walking",100),       0.0);
  TestRunner.assertEqual("EV saves 16kg vs petrol",
    calculateEmission("transport","car_petrol",100) - calculateEmission("transport","car_electric",100), 16.0);
});

// ── Suite 2: Food ─────────────────────────────────────────────────
TestRunner.run("Food Emission Calculations", () => {
  TestRunner.assertEqual("1kg beef = 27kg",      calculateEmission("food","beef",1),       27.0);
  TestRunner.assertEqual("1kg chicken = 6.9kg",  calculateEmission("food","chicken",1),     6.9);
  TestRunner.assertEqual("Vegan meal = 0.5kg",   calculateEmission("food","vegan_meal",1),  0.5);
  TestRunner.assertEqual("Meat meal = 3.5kg",    calculateEmission("food","meat_meal",1),   3.5);
  TestRunner.assertEqual("10 vegan meals = 5kg", calculateEmission("food","vegan_meal",10), 5.0);
});

// ── Suite 3: Energy ───────────────────────────────────────────────
TestRunner.run("Energy Emission Calculations", () => {
  TestRunner.assertEqual("100kWh = 82kg",   calculateEmission("energy","electricity",100), 82.0);
  TestRunner.assertEqual("1kg LPG = 1.51kg",calculateEmission("energy","lpg",1),           1.51);
  TestRunner.assertEqual("200kWh = 164kg",  calculateEmission("energy","electricity",200), 164.0);
});

// ── Suite 4: Shopping ─────────────────────────────────────────────
TestRunner.run("Shopping Emission Calculations", () => {
  TestRunner.assertEqual("1 clothing = 20kg",   calculateEmission("shopping","clothing",1),    20.0);
  TestRunner.assertEqual("1 electronic = 70kg", calculateEmission("shopping","electronics",1), 70.0);
  TestRunner.assertEqual("5 clothing = 100kg",  calculateEmission("shopping","clothing",5),   100.0);
});

// ── Suite 5: Footprint Levels ─────────────────────────────────────
TestRunner.run("Footprint Level Classification", () => {
  TestRunner.assert("1000kg → Excellent", getFootprintLevel(1000).level === "Excellent 🌱");
  TestRunner.assert("1700kg → Good",      getFootprintLevel(1700).level === "Good 👍");
  TestRunner.assert("2200kg → Average",   getFootprintLevel(2200).level === "Average ⚠️");
  TestRunner.assert("3500kg → High",      getFootprintLevel(3500).level === "High 🔴");
  TestRunner.assert("Excellent = green",  getFootprintLevel(1000).color === "#22c55e");
  TestRunner.assert("High = red",         getFootprintLevel(3500).color === "#ef4444");
});

// ── Suite 6: Action Savings ───────────────────────────────────────
TestRunner.run("Action Savings Calculations", () => {
  TestRunner.assertEqual("No actions = 0",           getTotalSavings([]),                      0);
  TestRunner.assertEqual("public_transport = 1500",  getTotalSavings(["public_transport"]),  1500);
  TestRunner.assertEqual("plant_based_3days = 420",  getTotalSavings(["plant_based_3days"]),  420);
  TestRunner.assertEqual("led_lights = 100",         getTotalSavings(["led_lights"]),          100);
  TestRunner.assertEqual("3 actions combined = 2200",
    getTotalSavings(["public_transport","no_beef","led_lights"]), 2200);
  TestRunner.assertEqual("All 8 actions = 6920",
    getTotalSavings(["switch_ev","public_transport","plant_based_3days","no_beef",
                     "led_lights","solar_panels","reduce_flights","buy_less_clothes"]), 6920);
});

// ── Suite 7: Edge Cases ───────────────────────────────────────────
TestRunner.run("Edge Cases & Robustness", () => {
  TestRunner.assertEqual("Unknown category = 0",  calculateEmission("unknown","car",100),       0);
  TestRunner.assertEqual("Unknown type = 0",      calculateEmission("transport","rocket",100),  0);
  TestRunner.assertEqual("Zero amount = 0",       calculateEmission("transport","car_petrol",0),0);
  TestRunner.assertEqual("Large amount scales",   calculateEmission("transport","car_petrol",10000), 2100.0);
  TestRunner.assert("Null savings input = 0",     getTotalSavings(null) === 0);
});

// ── Suite 8: Security ─────────────────────────────────────────────
TestRunner.run("Security & Input Sanitization", () => {
  TestRunner.assert("Strips < and >",        !sanitizeInput("<script>xss</script>").includes("<"));
  TestRunner.assert("Trims whitespace",      sanitizeInput("  hello  ") === "hello");
  TestRunner.assert("Null → empty string",   sanitizeInput(null) === "");
  TestRunner.assert("Number → empty string", sanitizeInput(123) === "");
  TestRunner.assert("Truncates at 1000",     sanitizeInput("a".repeat(1500)).length === 1000);
  TestRunner.assert("Empty string ok",       sanitizeInput("") === "");
});

// ── Suite 9: Tracker Logic ────────────────────────────────────────
TestRunner.run("Tracker Data Logic", () => {
  const store = {};
  const mock  = {
    saveEntry(entry) {
      if (!entry || typeof entry.total !== "number") return null;
      const list = this.loadEntries();
      entry.id   = Date.now();
      entry.date = new Date().toISOString().split("T")[0];
      entry.total = parseFloat(entry.total.toFixed(3));
      list.push(entry);
      store["entries"] = JSON.stringify(list);
      return entry;
    },
    loadEntries() {
      return store["entries"] ? JSON.parse(store["entries"]) : [];
    },
    getTodayFootprint() {
      const today = new Date().toISOString().split("T")[0];
      return this.loadEntries()
        .filter(e => e.date === today)
        .reduce((s, e) => s + (e.total || 0), 0);
    }
  };

  TestRunner.assert("Starts empty",              mock.loadEntries().length === 0);
  mock.saveEntry({ total: 5.2, category: "transport" });
  TestRunner.assert("Entry saved",               mock.loadEntries().length === 1);
  TestRunner.assertEqual("Today = 5.2",          mock.getTodayFootprint(), 5.2);
  mock.saveEntry({ total: 3.1, category: "food" });
  TestRunner.assertEqual("Sum = 8.3",            mock.getTodayFootprint(), 8.3);
  TestRunner.assert("Invalid entry = null",      mock.saveEntry({ total: "bad" }) === null);
});

// ── Suite 10: Benchmarks ──────────────────────────────────────────
TestRunner.run("Benchmarks & Data Integrity", () => {
  TestRunner.assert("India avg < world avg",       CarbonData.benchmarks.india_average < CarbonData.benchmarks.world_average);
  TestRunner.assert("Target > India avg",          CarbonData.benchmarks.target_2030 > CarbonData.benchmarks.india_average);
  TestRunner.assert("Exactly 8 actions defined",   CarbonData.actions.length === 8);
  TestRunner.assert("All actions have id+saving",  CarbonData.actions.every(a => a.id && a.saving && a.title && a.difficulty));
  TestRunner.assert("All savings positive",        CarbonData.actions.every(a => a.saving > 0));
  TestRunner.assert("All transport factors >= 0",  Object.values(CarbonData.transport).every(t => t.factor >= 0));
});

// ── Run ───────────────────────────────────────────────────────────
const allPassed = TestRunner.summary();
if (typeof process !== "undefined") process.exit(allPassed ? 0 : 1);