import express from "express";
import cors from "cors";

const app = express();
app.use(cors());

let cache = null;
let cacheTime = 0;
const CACHE_DURATION = 30 * 1000;

app.get("/states", async (req, res) => {
  try {
    const now = Date.now();

    // 🔥 CACHE
    if (cache && now - cacheTime < CACHE_DURATION) {
      return res.json({
        source: "cache",
        ...cache
      });
    }

    console.log("🌍 Fetching OpenSky...");

    const response = await fetch("https://opensky-network.org/api/states/all");
    const data = await response.json();

    cache = data;
    cacheTime = now;

    return res.json({
      source: "api",
      ...data
    });

  } catch (error) {
    console.error(error);

    return res.status(500).json({
      error: true,
      states: []
    });
  }
});

app.listen(3000, () => {
  console.log("🚀 Backend running on http://localhost:3000");
});