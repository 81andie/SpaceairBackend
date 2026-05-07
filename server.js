import express from "express";
import cors from "cors";

const app = express();
app.use(cors());

const PORT = 3000;

// endpoint de prueba OpenSky
app.get("/states", async (req, res) => {
  try {
    const response = await fetch("https://opensky-network.org/api/states/all");
    const data = await response.json();

    res.json(data);
  } catch (err) {
    console.log(err);
    res.status(500).json({ error: "error fetching data" });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});