
/*//https://spaceairbackend.onrender.com/states?lat=1.3&lon=6.2&dist=10


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

    console.log("Fetch ADSB.lol...");

    const response = await fetch(
      "https://api.adsb.lol/v2/lat/41.3/lon/2.1/dist/3500"
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
  console.log(` Server running on port ${PORT}`);
});*/


const express = require("express");
const cors = require("cors");

const app = express();

app.use(cors());

const PORT = process.env.PORT || 3000;

// -------------------------
// CACHE POR ZONA
// -------------------------
const cache = new Map();

// 30 segundos
const CACHE_DURATION = 30 * 1000;

// -------------------------
// VALIDACIÓN
// -------------------------
function isValidNumber(value) {

  return !isNaN(value) && isFinite(value);

}

// -------------------------
// MAPEO VUELOS
// -------------------------
function mapFlights(ac) {

  return ac.map((f) => ({

    // IDENTIFICACIÓN
    icao24: f.hex,

    callsign: f.flight?.trim() || null,

    originCountry: f.r || "Unknown",

    registration: f.reg || null,

    aircraft: f.t || null,

    squawk: f.squawk || null,

    // POSICIÓN
    latitude: f.lat,

    longitude: f.lon,

    altitude: f.alt_baro,

    heading: f.track,

    velocity: f.gs,

    verticalRate: f.baro_rate || 0,

    // ESTADO
    emergency: f.emergency || "none",

    category: f.category || null,
    seen: f.seen || null,
    airline: f.airline,
    op: f.op,
    ownOp: f.ownOp,

  }));

}

// -------------------------
// ENDPOINT DINÁMICO
// -------------------------
app.get("/states", async (req, res) => {

  try {

    // -------------------------
    // QUERY PARAMS
    // -------------------------
    const lat = parseFloat(req.query.lat);

    const lon = parseFloat(req.query.lon);

    const dist = parseFloat(req.query.dist || 120);

    // -------------------------
    // VALIDACIÓN
    // -------------------------
    if (
      !isValidNumber(lat) ||
      !isValidNumber(lon) ||
      !isValidNumber(dist)
    ) {

      return res.status(400).json({
        error: "Invalid params"
      });

    }

    // -------------------------
    // REDONDEO COORDS
    // EVITA MILLONES DE CACHES
    // -------------------------
    const roundedLat = Number(lat.toFixed(2));

    const roundedLon = Number(lon.toFixed(2));

    // -------------------------
    // CACHE KEY
    // -------------------------
    const cacheKey =
      `${roundedLat}-${roundedLon}-${dist}`;

    const cached = cache.get(cacheKey);

    // -------------------------
    // CACHE HIT
    // -------------------------
    if (
      cached &&
      Date.now() - cached.time < CACHE_DURATION
    ) {

      console.log("CACHE HIT");

      return res.json(cached.data);

    }

    // -------------------------
    // URL ADSB
    // -------------------------
    const url =
      `https://api.adsb.lol/v2/lat/${lat}/lon/${lon}/dist/${dist}`;

    console.log("FETCH:", url);

    // -------------------------
    // FETCH
    // -------------------------
    const response = await fetch(url);

    if (!response.ok) {

      throw new Error("ADSB fetch failed");

    }

    const data = await response.json();

    if (!data || !data.ac) {

      throw new Error("Invalid ADSB response");

    }

    // -------------------------
    // MAP FLIGHTS
    // -------------------------
    const flights = mapFlights(data.ac);

    // -------------------------
    // RESULTADO
    // -------------------------
    const result = {

      flights,

      meta: {

        center: {

          lat,
          lon

        },

        dist,

        total: flights.length

      },

      fallback: false

    };

    // -------------------------
    // SOLO GUARDAR SI HAY DATOS
    // -------------------------
    if (flights.length > 0) {

      cache.set(cacheKey, {

        data: result,

        time: Date.now()

      });

    }

    // -------------------------
    // RESPONSE
    // -------------------------
    return res.json(result);

  } catch (err) {

    console.error(err);

    // -------------------------
    // FALLBACK:
    // USAR ÚLTIMA CACHE VÁLIDA
    // -------------------------
    const latestCache =
      [...cache.values()][0];

    if (latestCache) {

      console.log("USING FALLBACK CACHE");

      return res.json({

        ...latestCache.data,

        fallback: true

      });

    }

    // -------------------------
    // SI NO HAY CACHE
    // -------------------------
    return res.status(500).json({

      flights: [],

      fallback: true,

      error: "Failed fetching flights"

    });

  }

});

// -------------------------
// START
// -------------------------
app.listen(PORT, () => {

  console.log(
    `Server running on port ${PORT}`
  );

});