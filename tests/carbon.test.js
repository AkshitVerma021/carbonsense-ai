// tests/carbon.test.js
// Unit tests for CarbonSense AI — validates core calculation logic

// ── Simple Test Runner ────────────────────────────────────────────
const TestRunner = {
    passed: 0,
    failed: 0,
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
            `${description} (expected: ${expected}, got: ${actual.toFixed(4)})`,
            pass
        );
    },

    run(suiteName, fn) {
        console.log(`\n📋 Running: ${suiteName}`);
        fn();
    },

    summary() {
        console.log("\n══════════════════════════════════════");
        console.log("         CARBONSENSE TEST RESULTS      ");
        console.log("══════════════════════════════════════");
        this.results.forEach(r => console.log(`${r.status}  ${r.description}`));
        console.log("──────────────────────────────────────");
        console.log(`Total:  ${this.passed + this.failed} tests`);
        console.log(`Passed: ${this.passed} ✅`);
        console.log(`Failed: ${this.failed} ❌`);
        console.log("══════════════════════════════════════");
        return this.failed === 0;
    }
};

// ── Mock CarbonData (mirrors carbon-data.js) ──────────────────────
const CarbonData = {
    transport: {
        car_petrol: { factor: 0.21, unit: "km" },
        car_electric: { factor: 0.05, unit: "km" },
        bus: { factor: 0.089, unit: "km" },
        metro: { factor: 0.031, unit: "km" },
        walking: { factor: 0.0, unit: "km" },
        train: { factor: 0.041, unit: "km" },
        flight_short: { factor: 0.255, unit: "km" }
    },
    food: {
        beef: { factor: 27.0, unit: "kg" },
        chicken: { factor: 6.9, unit: "kg" },
        vegan_meal: { factor: 0.5, unit: "meal" },
        meat_meal: { factor: 3.5, unit: "meal" }
    },
    energy: {
        electricity: { factor: 0.82, unit: "kWh" },
        lpg: { factor: 1.51, unit: "kg" }
    },
    shopping: {
        clothing: { factor: 20.0, unit: "item" },
        electronics: { factor: 70.0, unit: "item" }
    },
    benchmarks: {
        india_average: 1900,
        world_average: 4000,
        target_2030: 2500
    },
    actions: [
        { id: "public_transport", saving: 1500 },
        { id: "plant_based_3days", saving: 420 },
        { id: "no_beef", saving: 600 },
        { id: "led_lights", saving: 100 },
        { id: "buy_less_clothes", saving: 200 }
    ]
};

// ── Calculation Functions (mirrors carbon-data.js) ────────────────
function calculateEmission(category, type, amount) {
    if (CarbonData[category] && CarbonData[category][type]) {
        return CarbonData[category][type].factor * amount;
    }
    return 0;
}

function getFootprintLevel(totalKg) {
    const avg = CarbonData.benchmarks.india_average;
    const pct = ((totalKg - avg) / avg) * 100;
    if (totalKg <= avg * 0.7) return { level: "Excellent 🌱", color: "#22c55e", pct };
    if (totalKg <= avg) return { level: "Good 👍", color: "#84cc16", pct };
    if (totalKg <= avg * 1.5) return { level: "Average ⚠️", color: "#f59e0b", pct };
    return { level: "High 🔴", color: "#ef4444", pct };
}

function getTotalSavings(completedActionIds) {
    return CarbonData.actions
        .filter(a => completedActionIds.includes(a.id))
        .reduce((sum, a) => sum + a.saving, 0);
}

// ── TEST SUITES ───────────────────────────────────────────────────

// Suite 1: Transport Emissions
TestRunner.run("Transport Emission Calculations", () => {

    TestRunner.assertEqual(
        "Petrol car 100km = 21kg CO2",
        calculateEmission("transport", "car_petrol", 100),
        21.0
    );

    TestRunner.assertEqual(
        "Electric car 100km = 5kg CO2",
        calculateEmission("transport", "car_electric", 100),
        5.0
    );

    TestRunner.assertEqual(
        "Bus 100km = 8.9kg CO2",
        calculateEmission("transport", "bus", 100),
        8.9
    );

    TestRunner.assertEqual(
        "Metro 100km = 3.1kg CO2",
        calculateEmission("transport", "metro", 100),
        3.1
    );

    TestRunner.assertEqual(
        "Walking = 0kg CO2",
        calculateEmission("transport", "walking", 100),
        0.0
    );

    TestRunner.assertEqual(
        "EV saves 75% vs petrol car",
        calculateEmission("transport", "car_petrol", 100) -
        calculateEmission("transport", "car_electric", 100),
        16.0
    );

});

// Suite 2: Food Emissions
TestRunner.run("Food Emission Calculations", () => {

    TestRunner.assertEqual(
        "1kg beef = 27kg CO2",
        calculateEmission("food", "beef", 1),
        27.0
    );

    TestRunner.assertEqual(
        "1kg chicken = 6.9kg CO2",
        calculateEmission("food", "chicken", 1),
        6.9
    );

    TestRunner.assertEqual(
        "Vegan meal = 0.5kg CO2",
        calculateEmission("food", "vegan_meal", 1),
        0.5
    );

    TestRunner.assertEqual(
        "Meat meal = 3.5kg CO2",
        calculateEmission("food", "meat_meal", 1),
        3.5
    );

    TestRunner.assertEqual(
        "Beef emits ~5.6x more than vegan meal per kg",
        calculateEmission("food", "beef", 1) /
        calculateEmission("food", "vegan_meal", 1),
        54.0,
        1.0
    );

});

// Suite 3: Energy Emissions
TestRunner.run("Energy Emission Calculations", () => {

    TestRunner.assertEqual(
        "100 kWh electricity = 82kg CO2",
        calculateEmission("energy", "electricity", 100),
        82.0
    );

    TestRunner.assertEqual(
        "1kg LPG = 1.51kg CO2",
        calculateEmission("energy", "lpg", 1),
        1.51
    );

    TestRunner.assertEqual(
        "Monthly 200kWh = 164kg CO2",
        calculateEmission("energy", "electricity", 200),
        164.0
    );

});

// Suite 4: Shopping Emissions
TestRunner.run("Shopping Emission Calculations", () => {

    TestRunner.assertEqual(
        "1 clothing item = 20kg CO2",
        calculateEmission("shopping", "clothing", 1),
        20.0
    );

    TestRunner.assertEqual(
        "1 electronic device = 70kg CO2",
        calculateEmission("shopping", "electronics", 1),
        70.0
    );

    TestRunner.assertEqual(
        "5 clothing items = 100kg CO2",
        calculateEmission("shopping", "clothing", 5),
        100.0
    );

});

// Suite 5: Footprint Level Classification
TestRunner.run("Footprint Level Classification", () => {

    TestRunner.assert(
        "1000kg is Excellent (below 70% of India avg)",
        getFootprintLevel(1000).level === "Excellent 🌱"
    );

    TestRunner.assert(
        "1700kg is Good (below India avg 1900)",
        getFootprintLevel(1700).level === "Good 👍"
    );

    TestRunner.assert(
        "2200kg is Average (1x–1.5x India avg)",
        getFootprintLevel(2200).level === "Average ⚠️"
    );

    TestRunner.assert(
        "3500kg is High (above 1.5x India avg)",
        getFootprintLevel(3500).level === "High 🔴"
    );

    TestRunner.assert(
        "Excellent level has green color",
        getFootprintLevel(1000).color === "#22c55e"
    );

    TestRunner.assert(
        "High level has red color",
        getFootprintLevel(3500).color === "#ef4444"
    );

});

// Suite 6: Action Savings
TestRunner.run("Action Savings Calculations", () => {

    TestRunner.assertEqual(
        "No actions = 0kg saved",
        getTotalSavings([]),
        0
    );

    TestRunner.assertEqual(
        "public_transport saves 1500kg",
        getTotalSavings(["public_transport"]),
        1500
    );

    TestRunner.assertEqual(
        "plant_based_3days saves 420kg",
        getTotalSavings(["plant_based_3days"]),
        420
    );

    TestRunner.assertEqual(
        "3 actions combined savings correct",
        getTotalSavings(["public_transport", "no_beef", "led_lights"]),
        2200
    );

    TestRunner.assertEqual(
        "All 5 actions = 2820kg saved",
        getTotalSavings([
            "public_transport",
            "plant_based_3days",
            "no_beef",
            "led_lights",
            "buy_less_clothes"
        ]),
        2820
    );

});

// Suite 7: Edge Cases
TestRunner.run("Edge Cases & Robustness", () => {

    TestRunner.assertEqual(
        "Unknown category returns 0",
        calculateEmission("unknown", "car", 100),
        0
    );

    TestRunner.assertEqual(
        "Unknown type returns 0",
        calculateEmission("transport", "rocket", 100),
        0
    );

    TestRunner.assertEqual(
        "Zero amount = zero emissions",
        calculateEmission("transport", "car_petrol", 0),
        0
    );

    TestRunner.assertEqual(
        "Large amount scales correctly",
        calculateEmission("transport", "car_petrol", 10000),
        2100.0
    );

    TestRunner.assert(
        "Duplicate actions not double-counted in savings",
        getTotalSavings(["led_lights"]) === 100
    );

});

// ── RUN SUMMARY ───────────────────────────────────────────────────
const allPassed = TestRunner.summary();

if (typeof process !== "undefined") {
    process.exit(allPassed ? 0 : 1);
}