const express = require("express");
const cors = require("cors");

const app = express();
app.use(cors());

const PORT = process.env.PORT || 3000;

// -------------------------
// CACHE SIMPLE
// -------------------------
let cacheStore = {
  data: null,
  time: 0
};

const CACHE_DURATION = 30 * 1000;

// -------------------------
// MAPEO LIMPIO
// -------------------------
function mapFlights(ac) {
  return ac.map((f) => ({
    icao24: f.hex,
    callsign: f.flight?.trim() || null,
    originCountry: f.r || "Unknown",
    latitude: f.lat,
    longitude: f.lon,
    altitude: f.alt_baro,
    velocity: f.gs,
    heading: f.track
  }));
}

// -------------------------
// ENDPOINT
// -------------------------
app.get("/states", async (req, res) => {
  try {
    const now = Date.now();

    // CACHE HIT
    if (cacheStore.data && now - cacheStore.time < CACHE_DURATION) {
      return res.json(cacheStore.data);
    }

    console.log("🌍 Fetch ADSB.lol...");

    const response = await fetch(
      "https://api.adsb.lol/v2/lat/41.3/lon/2.1/dist/2000"
    );

    const data = await response.json();

    if (!data || !data.ac) {
      throw new Error("Invalid ADSB response");
    }

    const result = {
      flights: mapFlights(data.ac),
      fallback: false
    };

    // guardar cache
    cacheStore = {
      data: result,
      time: now
    };

    return res.json(result);

  } catch (err) {
    console.log("⚠️ Fallback activated");

    return res.json(
      cacheStore.data || {
        flights: [],
        fallback: true,
        message: "ADSB unavailable"
      }
    );
  }
});

// -------------------------
// START
// -------------------------
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});