const express = require("express");
const cors = require("cors");

const app = express();
app.use(cors());

const PORT = process.env.PORT || 3000;

// -------------------------
// “BASE DE DATOS” EN MEMORIA
// -------------------------
let cache = null;
let lastUpdate = 0;

// -------------------------
// DATASET INICIAL (FALLBACK REALISTA)
// -------------------------
const fallbackData = {
  flights: [
    {
      icao24: "abc123",
      callsign: "IBE123",
      originCountry: "Spain",
      latitude: 41.3,
      longitude: 2.1,
      altitude: 10000,
      velocity: 250,
      heading: 90
    },
    {
      icao24: "def456",
      callsign: "RYR456",
      originCountry: "Ireland",
      latitude: 40.4,
      longitude: 3.7,
      altitude: 11000,
      velocity: 230,
      heading: 120
    }
  ],
  fallback: true
};

// -------------------------
// ROOT
// -------------------------
app.get("/", (req, res) => {
  res.send("🚀 Backend SpaceAir funcionando");
});

// -------------------------
// TRANSFORMACIÓN LIMPIA
// -------------------------
function mapStates(states) {
  return states.map((s) => ({
    icao24: s[0],
    callsign: s[1]?.trim() || null,
    originCountry: s[2],
    timePosition: s[3],
    longitude: s[5],
    latitude: s[6],
    altitude: s[7],
    velocity: s[9],
    heading: s[10],
    category: s[17]
  }));
}

// -------------------------
// STATES
// -------------------------
app.get("/states", async (req, res) => {
  try {
    console.log("🌍 Trying OpenSky...");

    const response = await fetch("https://opensky-network.org/api/states/all", {
      headers: {
        "User-Agent": "Mozilla/5.0",
        "Accept": "application/json"
      }
    });

    const data = await response.json();

    if (data?.states) {
      const transformed = {
        flights: mapStates(data.states),
        fallback: false
      };

      cache = transformed;
      lastUpdate = Date.now();

      console.log("💾 Live data cached");

      return res.json(transformed);
    }

    throw new Error("Invalid API response");

  } catch (err) {
    console.log("⚠️ OpenSky failed");

    // 1. cache si existe
    if (cache) {
      return res.json(cache);
    }

    // 2. fallback inicial
    return res.json(fallbackData);
  }
});

// -------------------------
// START
// -------------------------
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});