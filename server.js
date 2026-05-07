app.get("/states", async (req, res) => {
  try {
    console.log("🌍 Fetching OpenSky...");

    const response = await fetch("https://opensky-network.org/api/states/all", {
      method: "GET",
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
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

    res.json(data);

  } catch (err) {
    console.log("❌ OpenSky error:", err.message);

    // fallback para no romper frontend
    res.json({
      states: [],
      error: true,
      message: "OpenSky unavailable"
    });
  }
});