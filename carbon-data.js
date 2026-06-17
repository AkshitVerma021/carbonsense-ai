/**
 * @fileoverview CarbonSense AI — Emissions Data Module
 * @description Real-world CO2 emissions factors, benchmarks, and action library.
 * @version 2.0.0
 * @license MIT
 *
 * Data Sources:
 * - Transport: UK DEFRA 2023 Emissions Factors
 * - Food: Poore & Nemecek 2018 (Science journal)
 * - Energy: India CEA Grid Emission Factor 2023
 * - Benchmarks: Global Carbon Project 2023
 */

"use strict";

const CarbonData = {

  /** Transport emission factors (kg CO2 per km) */
  transport: {
    car_petrol:   { factor: 0.21,  unit: "km",    label: "Petrol Car" },
    car_diesel:   { factor: 0.17,  unit: "km",    label: "Diesel Car" },
    car_electric: { factor: 0.05,  unit: "km",    label: "Electric Car" },
    motorbike:    { factor: 0.11,  unit: "km",    label: "Motorbike" },
    bus:          { factor: 0.089, unit: "km",    label: "Bus" },
    train:        { factor: 0.041, unit: "km",    label: "Train" },
    metro:        { factor: 0.031, unit: "km",    label: "Metro/Subway" },
    flight_short: { factor: 0.255, unit: "km",    label: "Short-haul Flight" },
    flight_long:  { factor: 0.195, unit: "km",    label: "Long-haul Flight" },
    walking:      { factor: 0.0,   unit: "km",    label: "Walking/Cycling" }
  },

  /** Food emission factors (kg CO2 per kg or per meal) */
  food: {
    beef:        { factor: 27.0, unit: "kg",   label: "Beef" },
    lamb:        { factor: 39.2, unit: "kg",   label: "Lamb" },
    pork:        { factor: 12.1, unit: "kg",   label: "Pork" },
    chicken:     { factor: 6.9,  unit: "kg",   label: "Chicken" },
    fish:        { factor: 6.1,  unit: "kg",   label: "Fish/Seafood" },
    eggs:        { factor: 4.8,  unit: "kg",   label: "Eggs" },
    dairy:       { factor: 3.2,  unit: "kg",   label: "Dairy Products" },
    vegetables:  { factor: 2.0,  unit: "kg",   label: "Vegetables" },
    vegan_meal:  { factor: 0.5,  unit: "meal", label: "Vegan Meal" },
    meat_meal:   { factor: 3.5,  unit: "meal", label: "Meat-based Meal" }
  },

  /** Energy emission factors */
  energy: {
    electricity: { factor: 0.82, unit: "kWh", label: "Electricity (India Grid)" },
    natural_gas: { factor: 2.04, unit: "m3",  label: "Natural Gas" },
    lpg:         { factor: 1.51, unit: "kg",  label: "LPG / Cooking Gas" },
    solar:       { factor: 0.04, unit: "kWh", label: "Solar Energy" }
  },

  /** Shopping emission factors */
  shopping: {
    clothing:     { factor: 20.0, unit: "item",  label: "Clothing Item" },
    electronics:  { factor: 70.0, unit: "item",  label: "Electronics Device" },
    furniture:    { factor: 44.0, unit: "item",  label: "Furniture Item" },
    online_order: { factor: 0.5,  unit: "order", label: "Online Order (delivery)" }
  },

  /** Annual footprint benchmarks (kg CO2 per year) */
  benchmarks: {
    world_average: 4000,
    india_average: 1900,
    us_average:    14000,
    eu_average:    8000,
    target_2030:   2500
  },

  /** Ranked actions with CO2 savings potential */
  actions: [
    {
      id:         "switch_ev",
      title:      "Switch to Electric Vehicle",
      category:   "transport",
      saving:     2400,
      difficulty: "hard",
      tip:        "Even switching 50% of driving to EV cuts ~1200kg/year"
    },
    {
      id:         "public_transport",
      title:      "Use Public Transport Daily",
      category:   "transport",
      saving:     1500,
      difficulty: "medium",
      tip:        "Taking metro/bus instead of car saves ~4kg CO2 per day"
    },
    {
      id:         "plant_based_3days",
      title:      "Plant-Based Diet 3 Days/Week",
      category:   "food",
      saving:     420,
      difficulty: "easy",
      tip:        "Skipping meat just 3 days/week has huge impact"
    },
    {
      id:         "no_beef",
      title:      "Cut Beef from Diet",
      category:   "food",
      saving:     600,
      difficulty: "medium",
      tip:        "Beef produces 4x more emissions than chicken"
    },
    {
      id:         "led_lights",
      title:      "Switch to LED Lights",
      category:   "energy",
      saving:     100,
      difficulty: "easy",
      tip:        "LEDs use 75% less energy than traditional bulbs"
    },
    {
      id:         "solar_panels",
      title:      "Install Solar Panels",
      category:   "energy",
      saving:     1200,
      difficulty: "hard",
      tip:        "Payback period in India is typically 4-5 years"
    },
    {
      id:         "reduce_flights",
      title:      "Replace One Flight with Train",
      category:   "transport",
      saving:     500,
      difficulty: "medium",
      tip:        "One domestic flight = ~255kg CO2 vs ~40kg by train"
    },
    {
      id:         "buy_less_clothes",
      title:      "Buy 50% Less Clothing",
      category:   "shopping",
      saving:     200,
      difficulty: "easy",
      tip:        "Fast fashion is one of the world's top polluters"
    }
  ]
};

/**
 * Calculates CO2 emissions for a given activity.
 * @param {string} category - Category key (transport/food/energy/shopping)
 * @param {string} type - Specific type within category
 * @param {number} amount - Quantity of activity
 * @returns {number} kg CO2 emitted
 */
function calculateEmission(category, type, amount) {
  if (!category || !type || typeof amount !== "number") return 0;
  if (CarbonData[category] && CarbonData[category][type]) {
    return CarbonData[category][type].factor * amount;
  }
  return 0;
}

/**
 * Returns footprint level classification vs India average.
 * @param {number} totalKg - Annual footprint in kg CO2
 * @returns {{level: string, color: string, pct: number}}
 */
function getFootprintLevel(totalKg) {
  const avg = CarbonData.benchmarks.india_average;
  const pct = ((totalKg - avg) / avg) * 100;
  if (totalKg <= avg * 0.7) return { level: "Excellent 🌱", color: "#22c55e", pct };
  if (totalKg <= avg)       return { level: "Good 👍",       color: "#84cc16", pct };
  if (totalKg <= avg * 1.5) return { level: "Average ⚠️",   color: "#f59e0b", pct };
  return                           { level: "High 🔴",       color: "#ef4444", pct };
}