const express = require("express");
const { ethers } = require("ethers");
const { v4: uuidv4 } = require("uuid");
const { cifra } = require("../services/crypto");
const store = require("../services/userStore");
const blockchain = require("../services/blockchain");

const router = express.Router();

// ── GET /api/clienti ───────────────────────────────────────────────────────────
// Lista tutti i clienti (senza chiavi private)
router.get("/", async (req, res) => {
  try {
    const clienti = store.getAll().map(u => {
      const { encryptedPk, ...safe } = u;
      return safe;
    });
    res.json({ success: true, data: clienti });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ── GET /api/clienti/:id ───────────────────────────────────────────────────────
// Dettaglio singolo cliente con saldo blockchain
router.get("/:id", async (req, res) => {
  try {
    const user = store.findById(req.params.id);
    if (!user) return res.status(404).json({ success: false, error: "Cliente non trovato" });

    // Legge saldo e badge dalla blockchain
    const [stelle, badgeIds] = await Promise.all([
      blockchain.getSaldo(user.address),
      blockchain.getBadgeCliente(user.address),
    ]);

    const { encryptedPk, ...safe } = user;
    res.json({ success: true, data: { ...safe, stelle, badge: badgeIds } });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ── POST /api/clienti/crea ─────────────────────────────────────────────────────
// Crea nuovo cliente con EOA generato o esistente
router.post("/crea", async (req, res) => {
  try {
    const { nome, cognome, luogo, dataNascita, walletType, existingAddress, isMigrazione, migrazioneId } = req.body;

    // Validazione
    if (!nome || !cognome || !luogo || !dataNascita) {
      return res.status(400).json({ success: false, error: "Dati anagrafici incompleti" });
    }

    // Controlla duplicati
    const duplicati = store.findByName(nome, cognome);
    if (duplicati.length > 0 && !isMigrazione) {
      return res.status(400).json({
        success: false,
        error: `Esiste già un cliente con questo nome. Se è un aggiornamento profilo, imposta isMigrazione: true`
      });
    }

    let address, encryptedPk = null, privateKeyChiaro = null;

    if (walletType === "EOA") {
      // Genera nuovo EOA
      const wallet = ethers.Wallet.createRandom();
      address        = wallet.address;
      privateKeyChiaro = wallet.privateKey;
      encryptedPk    = cifra(wallet.privateKey);
    } else if (walletType === "EOA_ESTERNO" || walletType === "UP") {
      // Usa address esterno fornito
      if (!existingAddress || !ethers.isAddress(existingAddress)) {
        return res.status(400).json({ success: false, error: "Indirizzo non valido" });
      }
      address = existingAddress;
    } else {
      return res.status(400).json({ success: false, error: "walletType non valido" });
    }

    // Controlla che l'address non sia già in uso
    if (store.addressExists(address)) {
      return res.status(400).json({ success: false, error: "Questo indirizzo è già associato a un altro cliente" });
    }

    // Se è migrazione, archivia il profilo precedente
    if (isMigrazione && migrazioneId) {
      store.update(migrazioneId, { status: "migrated" });
    }

    // Crea il nuovo cliente
    const newUser = {
      id:           uuidv4(),
      nome,
      cognome,
      luogo,
      dataNascita,
      address,
      encryptedPk,  // null se wallet esterno
      walletType,
      status:       "active",
      createdAt:    Date.now(),
      migrazioneId: isMigrazione ? migrazioneId : null,
    };

    store.add(newUser);

    // Risposta — include la chiave in chiaro SOLO alla creazione
    const { encryptedPk: _, ...safe } = newUser;
    res.json({
      success: true,
      data: {
        ...safe,
        privateKey: privateKeyChiaro, // null se wallet esterno
      }
    });

  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ── PATCH /api/clienti/:id/archivia ───────────────────────────────────────────
router.patch("/:id/archivia", async (req, res) => {
  try {
    const user = store.findById(req.params.id);
    if (!user) return res.status(404).json({ success: false, error: "Cliente non trovato" });
    store.update(req.params.id, { status: "archived" });
    res.json({ success: true, message: "Cliente archiviato" });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ── GET /api/clienti/:id/chiave ────────────────────────────────────────────────
// Restituisce la chiave privata decifrata (solo per admin)
router.get("/:id/chiave", async (req, res) => {
  try {
    const user = store.findById(req.params.id);
    if (!user) return res.status(404).json({ success: false, error: "Cliente non trovato" });
    if (!user.encryptedPk) return res.status(400).json({ success: false, error: "Chiave non in custodia del sistema" });

    const { decifra } = require("../services/crypto");
    const privateKey = decifra(user.encryptedPk);
    res.json({ success: true, data: { address: user.address, privateKey } });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ── POST /api/clienti/login ────────────────────────────────────────────────────
// Verifica codice di accesso cliente
router.post("/login", async (req, res) => {
  try {
    const { codice } = req.body;
    if (!codice) return res.status(400).json({ success: false, error: "Codice obbligatorio" });

    const { decifra } = require("../services/crypto");
    const users = store.getAll();

    // Cerca il cliente la cui chiave privata corrisponde al codice
    for (const u of users) {
      if (!u.encryptedPk) continue;
      try {
        const pk = decifra(u.encryptedPk);
        if (pk === codice.trim()) {
          const { encryptedPk, ...safe } = u;
          return res.json({ success: true, data: safe });
        }
      } catch { continue; }
    }

    res.status(401).json({ success: false, error: "Codice di accesso non valido" });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;