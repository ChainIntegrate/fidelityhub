require("dotenv").config();
const express  = require("express");
const cors     = require("cors");
const helmet   = require("helmet");
const blockchain = require("./services/blockchain");

// ── Routes ─────────────────────────────────────────────────────────────────────
const clientiRoutes = require("./routes/clienti");
const puntiRoutes   = require("./routes/punti");
const badgeRoutes   = require("./routes/badge");

const app  = express();
const PORT = process.env.PORT || 3001;

// ── Middleware ──────────────────────────────────────────────────────────────────
app.use(helmet());
app.use(cors({ origin: "http://localhost:5173" }));
app.use(express.json());

// ── Login Admin ────────────────────────────────────────────────────────────────
app.post("/api/auth/login", (req, res) => {
  try {
    const { email, password } = req.body;
    if (
      email === process.env.ADMIN_EMAIL &&
      password === process.env.ADMIN_PASSWORD
    ) {
      res.json({ success: true, data: { role: "admin" } });
    } else {
      res.status(401).json({ success: false, error: "Credenziali non valide" });
    }
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ── Routes ──────────────────────────────────────────────────────────────────────
app.use("/api/clienti", clientiRoutes);
app.use("/api/punti",   puntiRoutes);
app.use("/api/badge",   badgeRoutes);

// ── Health check ────────────────────────────────────────────────────────────────
app.get("/api/health", async (req, res) => {
  try {
    const supply = await blockchain.getSupplyTotale();
    res.json({
      success: true,
      status:  "online",
      network: process.env.LUKSO_RPC,
      token:   process.env.FIDELITY_TOKEN_ADDRESS,
      badge:   process.env.FIDELITY_BADGE_ADDRESS,
      supply,
    });
  } catch (err) {
    res.status(500).json({ success: false, status: "error", error: err.message });
  }
});

// ── Avvio server ────────────────────────────────────────────────────────────────
async function start() {
  try {
    // Inizializza connessione blockchain
    blockchain.init();

    app.listen(PORT, () => {
      console.log("═══════════════════════════════════════");
      console.log("  FidelityHub Server");
      console.log("═══════════════════════════════════════");
      console.log(`  API:     http://localhost:${PORT}/api`);
      console.log(`  Health:  http://localhost:${PORT}/api/health`);
      console.log("═══════════════════════════════════════");
    });
  } catch (err) {
    console.error("❌ Errore avvio server:", err);
    process.exit(1);
  }
}

start();