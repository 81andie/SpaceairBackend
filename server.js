const express = require("express");
const cors = require("cors");

const app = express();
app.use(cors());

const PORT = process.env.PORT || 3000;

// -------------------------
// CACHE GLOBAL
// -------------------------
let cache = null;
let lastUpdate = 0;
const CACHE_TIME = 5 * 60 * 1000; // 5 min

// -------------------------
// ROOT
// -------------------------
app.get("/", (req, res) => {
  res.send("🚀 Backend SpaceAir funcionando bien");
});

// -------------------------
// STATES
// -------------------------
app.get("/states", async (req, res) => {
  try {
    const now = Date.now();

    // 🔥 1. cache primero
    if (cache && now - lastUpdate < CACHE_TIME) {
      console.log("⚡ CACHE HIT");
      return res.json(cache);
    }

    console.log("🌍 Fetch OpenSky...");

    const response = await fetch(
      "https://opensky-network.org/api/states/all",
      {
        headers: {
          "User-Agent": "Mozilla/5.0",
          "Accept": "application/json"
        }
      }
    );

    const data = await response.json();

    // 🔥 2. validación
    if (data && data.states) {
      cache = data;
      lastUpdate = now;

      console.log("💾 CACHE UPDATED");

      return res.json(data);
    }

    throw new Error("Invalid OpenSky response");

  } catch (err) {
    console.log("⚠️ OpenSky failed, using fallback");

    // 🔥 3. fallback seguro
    return res.json(cache || {
      states: [],
      fallback: true,
      message: "OpenSky temporarily unavailable"
    });
  }
});

// -------------------------
// START
// -------------------------
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});