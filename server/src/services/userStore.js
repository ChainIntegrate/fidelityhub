const fs   = require("fs");
const path = require("path");

const DATA_DIR  = path.join(__dirname, "../../data");
const DATA_FILE = path.join(DATA_DIR, "users.json");

// ── Inizializzazione ───────────────────────────────────────────────────────────
if (!fs.existsSync(DATA_DIR))  fs.mkdirSync(DATA_DIR, { recursive: true });
if (!fs.existsSync(DATA_FILE)) fs.writeFileSync(DATA_FILE, "[]", "utf8");

// ── Indice in memoria ──────────────────────────────────────────────────────────
class UserStore {
  constructor() {
    this.users    = [];
    this.byId     = new Map();
    this.byAddress= new Map();
    this.load();
  }

  // Carica da disco e ricostruisce gli indici
  load() {
    try {
      this.users = JSON.parse(fs.readFileSync(DATA_FILE, "utf8"));
    } catch {
      this.users = [];
    }
    this.byId.clear();
    this.byAddress.clear();
    for (const u of this.users) {
      this.byId.set(u.id, u);
      this.byAddress.set(u.address.toLowerCase(), u);
    }
  }

  // Scrittura atomica su disco + ricostruzione indici
  save(users) {
    const tmp = DATA_FILE + ".tmp";
    fs.writeFileSync(tmp, JSON.stringify(users, null, 2), "utf8");
    fs.renameSync(tmp, DATA_FILE);
    this.users = users;
    this.load();
  }

  // ── Query ──────────────────────────────────────────────────────────────────
  getAll()              { return this.users; }
  findById(id)          { return this.byId.get(id) || null; }
  findByAddress(addr)   { return this.byAddress.get(addr.toLowerCase()) || null; }
  findByName(nome, cog) { return this.users.filter(u => u.nome === nome && u.cognome === cog); }

  // ── Operazioni ─────────────────────────────────────────────────────────────
  add(user) {
    const all = [...this.users, user];
    this.save(all);
    return user;
  }

  update(id, changes) {
    const all = this.users.map(u => u.id === id ? { ...u, ...changes } : u);
    this.save(all);
    return this.findById(id);
  }

  // Controlla se esiste già un utente con stesso indirizzo
  addressExists(addr) {
    return this.byAddress.has(addr.toLowerCase());
  }

  // Controlla duplicati nome/cognome
  nameExists(nome, cognome) {
    return this.users.some(u =>
      u.nome === nome &&
      u.cognome === cognome &&
      u.status === "active"
    );
  }
}

// Singleton — una sola istanza per tutta la vita del server
const store = new UserStore();
module.exports = store;