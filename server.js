let cache = null;
let lastUpdate = 0;

app.get("/states", async (req, res) => {
  try {
    console.log("🚀 /states called");

    // 🔥 si hay cache reciente (5 min)
    const now = Date.now();
    if (cache && now - lastUpdate < 5 * 60 * 1000) {
      console.log("⚡ returning cache");
      return res.json(cache);
    }

    console.log("🌍 fetching OpenSky...");

    const response = await fetch("https://opensky-network.org/api/states/all", {
      headers: {
        "User-Agent": "Mozilla/5.0",
        "Accept": "application/json"
      }
    });

    if (!response.ok) {
      throw new Error("OpenSky response not OK");
    }

    const data = await response.json();

    if (!data?.states) {
      throw new Error("Invalid OpenSky response");
    }

    // 🔥 guardamos cache
    cache = data;
    lastUpdate = now;

    console.log("💾 cache updated");

    return res.json(data);

  } catch (err) {
    console.log("❌ OpenSky error:", err.message);

    // 🔥 fallback seguro (NO rompe frontend)
    return res.json(cache || {
      states: [],
      error: true,
      message: "OpenSky temporarily unavailable"
    });
  }
});