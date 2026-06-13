const express = require("express");
const store = require("../services/userStore");
const blockchain = require("../services/blockchain");

const router = express.Router();

// ── POST /api/punti/carica ─────────────────────────────────────────────────────
// Carica stelle su un cliente (mint LSP7)
router.post("/carica", async (req, res) => {
  try {
    const { clienteId, quantita, nota } = req.body;

    if (!clienteId || !quantita || quantita <= 0) {
      return res.status(400).json({ success: false, error: "Dati non validi" });
    }

    const cliente = store.findById(clienteId);
    if (!cliente) return res.status(404).json({ success: false, error: "Cliente non trovato" });
    if (cliente.status !== "active") return res.status(400).json({ success: false, error: "Cliente non attivo" });

    // Chiama il contratto LSP7
    const txHash = await blockchain.caricaPunti(
      cliente.address,
      quantita,
      nota || "Carico stelle"
    );

    // Legge il nuovo saldo dalla blockchain
    const nuovoSaldo = await blockchain.getSaldo(cliente.address);

    res.json({
      success: true,
      data: {
        txHash,
        cliente:    cliente.nome + " " + cliente.cognome,
        address:    cliente.address,
        quantita,
        nuovoSaldo,
        nota:       nota || "Carico stelle",
      }
    });

  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ── POST /api/punti/scala ──────────────────────────────────────────────────────
// Scala stelle da un cliente (burn LSP7)
router.post("/scala", async (req, res) => {
  try {
    const { clienteId, quantita, nota } = req.body;

    if (!clienteId || !quantita || quantita <= 0) {
      return res.status(400).json({ success: false, error: "Dati non validi" });
    }

    const cliente = store.findById(clienteId);
    if (!cliente) return res.status(404).json({ success: false, error: "Cliente non trovato" });
    if (cliente.status !== "active") return res.status(400).json({ success: false, error: "Cliente non attivo" });

    // Verifica saldo prima di chiamare il contratto
    const saldoAttuale = await blockchain.getSaldo(cliente.address);
    if (saldoAttuale < quantita) {
      return res.status(400).json({
        success: false,
        error: `Saldo insufficiente. Il cliente ha ${saldoAttuale} stelle`
      });
    }

    const txHash = await blockchain.scalaPunti(
      cliente.address,
      quantita,
      nota || "Scala stelle"
    );

    const nuovoSaldo = await blockchain.getSaldo(cliente.address);

    res.json({
      success: true,
      data: {
        txHash,
        cliente:    cliente.nome + " " + cliente.cognome,
        address:    cliente.address,
        quantita,
        nuovoSaldo,
        nota:       nota || "Scala stelle",
      }
    });

  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ── POST /api/punti/trasferisci ────────────────────────────────────────────────
// Trasferisce stelle tra due clienti
router.post("/trasferisci", async (req, res) => {
  try {
    const { daId, aId, quantita, nota } = req.body;

    if (!daId || !aId || !quantita || quantita <= 0) {
      return res.status(400).json({ success: false, error: "Dati non validi" });
    }
    if (daId === aId) {
      return res.status(400).json({ success: false, error: "Mittente e destinatario coincidono" });
    }

    const da = store.findById(daId);
    const a  = store.findById(aId);
    if (!da) return res.status(404).json({ success: false, error: "Cliente mittente non trovato" });
    if (!a)  return res.status(404).json({ success: false, error: "Cliente destinatario non trovato" });

    // Verifica saldo mittente
    const saldoDa = await blockchain.getSaldo(da.address);
    if (saldoDa < quantita) {
      return res.status(400).json({
        success: false,
        error: `Saldo insufficiente. Il cliente ha ${saldoDa} stelle`
      });
    }

    const txHash = await blockchain.trasferisciPunti(
      da.address,
      a.address,
      quantita,
      nota || "Trasferimento stelle"
    );

    const [nuovoSaldoDa, nuovoSaldoA] = await Promise.all([
      blockchain.getSaldo(da.address),
      blockchain.getSaldo(a.address),
    ]);

    res.json({
      success: true,
      data: {
        txHash,
        da:           da.nome + " " + da.cognome,
        a:            a.nome  + " " + a.cognome,
        quantita,
        nuovoSaldoDa,
        nuovoSaldoA,
        nota:         nota || "Trasferimento stelle",
      }
    });

  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ── GET /api/punti/saldo/:clienteId ───────────────────────────────────────────
// Legge saldo direttamente dalla blockchain
router.get("/saldo/:clienteId", async (req, res) => {
  try {
    const cliente = store.findById(req.params.clienteId);
    if (!cliente) return res.status(404).json({ success: false, error: "Cliente non trovato" });

    const saldo = await blockchain.getSaldo(cliente.address);
    res.json({
      success: true,
      data: {
        clienteId: cliente.id,
        nome:      cliente.nome + " " + cliente.cognome,
        address:   cliente.address,
        saldo,
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ── GET /api/punti/supply ──────────────────────────────────────────────────────
// Supply totale in circolazione
router.get("/supply", async (req, res) => {
  try {
    const supply = await blockchain.getSupplyTotale();
    res.json({ success: true, data: { supply } });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;