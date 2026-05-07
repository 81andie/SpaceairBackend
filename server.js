import express from "express";
import cors from "cors";

const app = express();
app.use(cors());

const PORT = process.env.PORT || 3000;

// TEST ROOT
app.get("/", (req, res) => {     
  res.send("🚀 Backend SpaceAir funcionando bien");
});

// STATES
app.get("/states", async (req, res) => {
  try {
    const response = await fetch("https://opensky-network.org/api/states/all");
    const data = await response.json();
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: "OpenSky failed" });
  }
});

app.listen(PORT, () => {
  console.log("Server running on port", PORT);
});