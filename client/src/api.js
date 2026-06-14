import axios from "axios";

const API = axios.create({
  baseURL: "http://localhost:3001/api",
  headers: { "Content-Type": "application/json" },
});


// ── Clienti ────────────────────────────────────────────────────────────────────
export const getClienti        = ()         => API.get("/clienti");
export const getCliente        = (id)       => API.get(`/clienti/${id}`);
export const creaCliente       = (data)     => API.post("/clienti/crea", data);
export const archiviaCliente   = (id)       => API.patch(`/clienti/${id}/archivia`);
export const getChiaveCliente  = (id)       => API.get(`/clienti/${id}/chiave`);

// ── Punti ──────────────────────────────────────────────────────────────────────
export const caricaPunti       = (data)     => API.post("/punti/carica", data);
export const scalaPunti        = (data)     => API.post("/punti/scala", data);
export const trasferisciPunti  = (data)     => API.post("/punti/trasferisci", data);
export const getSaldo          = (id)       => API.get(`/punti/saldo/${id}`);
export const getSupply         = ()         => API.get("/punti/supply");

// ── Badge ──────────────────────────────────────────────────────────────────────
export const getBadge          = ()         => API.get("/badge");
export const assegnaBadge      = (data)     => API.post("/badge/assegna", data);
export const revocaBadge       = (data)     => API.post("/badge/revoca", data);
export const trasferisciBadge  = (data)     => API.post("/badge/trasferisci", data);
export const getBadgeCliente   = (id)       => API.get(`/badge/cliente/${id}`);
export const aggiungiBadge     = (data)     => API.post("/badge/aggiungi", data);

// ── Health ─────────────────────────────────────────────────────────────────────
export const getHealth         = ()         => API.get("/health");

export const loginCliente = (codice) => API.post("/clienti/login", { codice });