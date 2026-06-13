const express = require("express");
const store = require("../services/userStore");
const blockchain = require("../services/blockchain");

const router = express.Router();

// ── GET /api/badge ─────────────────────────────────────────────────────────────
// Lista tutti i tipi di riconoscimento disponibili
router.get("/", async (req, res) => {
  try {
    const badge = await blockchain.getTuttiBadge();
    res.json({ success: true, data: badge });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ── POST /api/badge/aggiungi ───────────────────────────────────────────────────
// Aggiunge un nuovo tipo di riconoscimento (scalabile)
router.post("/aggiungi", async (req, res) => {
  try {
    const { nome, descrizione, immagineURI } = req.body;
    if (!nome) return res.status(400).json({ success: false, error: "Nome obbligatorio" });

    const txHash = await blockchain.aggiungiBadge(
      nome,
      descrizione || "",
      immagineURI || "ipfs://"
    );

    res.json({ success: true, data: { txHash, nome } });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ── POST /api/badge/assegna ────────────────────────────────────────────────────
// Assegna un riconoscimento a un cliente
router.post("/assegna", async (req, res) => {
  try {
    const { clienteId, tipoId } = req.body;
    if (!clienteId || !tipoId) {
      return res.status(400).json({ success: false, error: "clienteId e tipoId obbligatori" });
    }

    const cliente = store.findById(clienteId);
    if (!cliente) return res.status(404).json({ success: false, error: "Cliente non trovato" });
    if (cliente.status !== "active") return res.status(400).json({ success: false, error: "Cliente non attivo" });

    // Controlla se ha già questo badge
    const haGia = await blockchain.haIlBadge(cliente.address, tipoId);
    if (haGia) {
      return res.status(400).json({ success: false, error: "Il cliente ha già questo riconoscimento" });
    }

    const txHash = await blockchain.assegnaBadge(cliente.address, tipoId);

    res.json({
      success: true,
      data: {
        txHash,
        cliente: cliente.nome + " " + cliente.cognome,
        address: cliente.address,
        tipoId,
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ── POST /api/badge/revoca ─────────────────────────────────────────────────────
// Revoca un riconoscimento da un cliente
router.post("/revoca", async (req, res) => {
  try {
    const { clienteId, tipoId } = req.body;
    if (!clienteId || !tipoId) {
      return res.status(400).json({ success: false, error: "clienteId e tipoId obbligatori" });
    }

    const cliente = store.findById(clienteId);
    if (!cliente) return res.status(404).json({ success: false, error: "Cliente non trovato" });

    // Controlla se ha il badge
    const ha = await blockchain.haIlBadge(cliente.address, tipoId);
    if (!ha) {
      return res.status(400).json({ success: false, error: "Il cliente non possiede questo riconoscimento" });
    }

    const txHash = await blockchain.revocaBadge(cliente.address, tipoId);

    res.json({
      success: true,
      data: {
        txHash,
        cliente: cliente.nome + " " + cliente.cognome,
        address: cliente.address,
        tipoId,
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ── POST /api/badge/trasferisci ────────────────────────────────────────────────
// Trasferisce un riconoscimento tra due clienti
router.post("/trasferisci", async (req, res) => {
  try {
    const { daId, aId, tipoId } = req.body;
    if (!daId || !aId || !tipoId) {
      return res.status(400).json({ success: false, error: "daId, aId e tipoId obbligatori" });
    }
    if (daId === aId) {
      return res.status(400).json({ success: false, error: "Mittente e destinatario coincidono" });
    }

    const da = store.findById(daId);
    const a  = store.findById(aId);
    if (!da) return res.status(404).json({ success: false, error: "Cliente mittente non trovato" });
    if (!a)  return res.status(404).json({ success: false, error: "Cliente destinatario non trovato" });

    // Verifica che il mittente abbia il badge
    const ha = await blockchain.haIlBadge(da.address, tipoId);
    if (!ha) {
      return res.status(400).json({ success: false, error: "Il cliente mittente non possiede questo riconoscimento" });
    }

    // Verifica che il destinatario non abbia già il badge
    const haGia = await blockchain.haIlBadge(a.address, tipoId);
    if (haGia) {
      return res.status(400).json({ success: false, error: "Il cliente destinatario ha già questo riconoscimento" });
    }

    const txHash = await blockchain.trasferisciBadge(da.address, a.address, tipoId);

    res.json({
      success: true,
      data: {
        txHash,
        da:     da.nome + " " + da.cognome,
        a:      a.nome  + " " + a.cognome,
        tipoId,
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ── GET /api/badge/cliente/:clienteId ─────────────────────────────────────────
// Badge posseduti da un cliente
router.get("/cliente/:clienteId", async (req, res) => {
  try {
    const cliente = store.findById(req.params.clienteId);
    if (!cliente) return res.status(404).json({ success: false, error: "Cliente non trovato" });

    const badgeIds = await blockchain.getBadgeCliente(cliente.address);
    const tuttiBadge = await blockchain.getTuttiBadge();

    const badgeCliente = tuttiBadge.filter(b => badgeIds.includes(b.id));

    res.json({
      success: true,
      data: {
        cliente: cliente.nome + " " + cliente.cognome,
        address: cliente.address,
        badge:   badgeCliente,
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;