const express = require("express");
const cors = require("cors");

const app = express();
app.use(cors());

// -------------------------
// CACHE SIMPLE
// -------------------------
let cache = null;
let lastUpdate = 0;
const CACHE_TIME = 5 * 60 * 1000; // 5 minutos

// -------------------------
// ROOT
// -------------------------
app.get("/", (req, res) => {
  res.send("🚀 Backend SpaceAir funcionando bien");
});

// -------------------------
// STATES (OpenSky)
// -------------------------
app.get("/states", async (req, res) => {
  try {
    console.log("🚀 /states called");

    const now = Date.now();

    // 🔥 cache
    if (cache && now - lastUpdate < CACHE_TIME) {
      console.log("⚡ Returning cache");
      return res.json(cache);
    }

    console.log("🌍 Fetching OpenSky API...");

    const response = await fetch("https://opensky-network.org/api/states/all", {
      headers: {
        "User-Agent": "Mozilla/5.0",
        "Accept": "application/json"
      }
    });

    console.log("📡 Status:", response.status);

    if (!response.ok) {
      throw new Error("OpenSky response not OK");
    }

    const data = await response.json();

    if (!data || !data.states) {
      throw new Error("Invalid OpenSky data");
    }

    // 💾 guardar cache
    cache = data;
    lastUpdate = now;

    console.log("💾 Cache updated");

    return res.json(data);

  } catch (err) {
    console.log("❌ OpenSky error:", err.message);

    // fallback seguro
    return res.json(cache || {
      states: [],
      error: true,
      message: "OpenSky unavailable"
    });
  }
});

// -------------------------
// START SERVER (IMPORTANTE PARA RENDER)
// -------------------------
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});