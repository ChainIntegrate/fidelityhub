const { ethers } = require("ethers");

// ── ABI contratti ──────────────────────────────────────────────────────────────
const TOKEN_ABI = [
  "function caricaPunti(address cliente, uint256 quantita, string calldata nota) external",
  "function scalaPunti(address cliente, uint256 quantita, string calldata nota) external",
  "function trasferisciPunti(address da, address a, uint256 quantita, string calldata nota) external",
  "function saldoCliente(address cliente) external view returns (uint256)",
  "function supplyTotale() external view returns (uint256)",
  "function totalSupply() external view returns (uint256)",
  // ── Eventi ──────────────────────────────────────────────────────────────────
  "event PointsLoaded(address indexed to, uint256 amount, string note)",
  "event PointsScaled(address indexed from, uint256 amount, string note)",
  "event PointsTransferred(address indexed from, address indexed to, uint256 amount, string note)",
];

const BADGE_ABI = [
  "function assegnaBadge(address cliente, uint256 tipoId) external",
  "function revocaBadge(address cliente, uint256 tipoId) external",
  "function trasferisciBadge(address da, address a, uint256 tipoId) external",
  "function haIlBadge(address cliente, uint256 tipoId) external view returns (bool)",
  "function badgeDelClientes(address cliente) external view returns (uint256[])",
  "function getInfoBadge(uint256 tipoId) external view returns (string, string, string, bool, uint256)",
  "function getTuttiBadge() external view returns (uint256[], string[], bool[])",
  "function aggiungiBadge(string calldata nome, string calldata descrizione, string calldata immagineURI) external",
  "function disattivaBadge(uint256 tipoId) external",
  "function numeroTipi() external view returns (uint256)",
  // ── Eventi ──────────────────────────────────────────────────────────────────
  "event BadgeAssegnato(address indexed cliente, uint256 indexed tipoId, bytes32 tokenId)",
  "event BadgeRevocato(address indexed cliente, uint256 indexed tipoId, bytes32 tokenId)",
  "event BadgeTrasferito(address indexed da, address indexed a, uint256 indexed tipoId, bytes32 tokenId)",
];

// ── Setup provider e signer ────────────────────────────────────────────────────
let provider, signer, tokenContract, badgeContract;

function init() {
  provider = new ethers.JsonRpcProvider(process.env.LUKSO_RPC);

  signer = new ethers.Wallet(process.env.ADMIN_PRIVATE_KEY, provider);

  tokenContract = new ethers.Contract(
    process.env.FIDELITY_TOKEN_ADDRESS,
    TOKEN_ABI,
    signer
  );

  badgeContract = new ethers.Contract(
    process.env.FIDELITY_BADGE_ADDRESS,
    BADGE_ABI,
    signer
  );

  console.log("✅ Blockchain service inizializzato");
  console.log("   Network:", process.env.LUKSO_RPC);
  console.log("   Token:", process.env.FIDELITY_TOKEN_ADDRESS);
  console.log("   Badge:", process.env.FIDELITY_BADGE_ADDRESS);
  console.log("   Admin:", signer.address);
}

// ── Token LSP7 ─────────────────────────────────────────────────────────────────
async function caricaPunti(address, quantita, nota) {
  const tx = await tokenContract.caricaPunti(address, quantita, nota);
  await tx.wait();
  return tx.hash;
}

async function scalaPunti(address, quantita, nota) {
  const tx = await tokenContract.scalaPunti(address, quantita, nota);
  await tx.wait();
  return tx.hash;
}

async function trasferisciPunti(da, a, quantita, nota) {
  const tx = await tokenContract.trasferisciPunti(da, a, quantita, nota);
  await tx.wait();
  return tx.hash;
}

async function getSaldo(address) {
  const saldo = await tokenContract.saldoCliente(address);
  return Number(saldo);
}

async function getSupplyTotale() {
  const supply = await tokenContract.supplyTotale();
  return Number(supply);
}

// ── Badge LSP8 ─────────────────────────────────────────────────────────────────
async function assegnaBadge(address, tipoId) {
  const tx = await badgeContract.assegnaBadge(address, tipoId);
  await tx.wait();
  return tx.hash;
}

async function revocaBadge(address, tipoId) {
  const tx = await badgeContract.revocaBadge(address, tipoId);
  await tx.wait();
  return tx.hash;
}

async function trasferisciBadge(da, a, tipoId) {
  const tx = await badgeContract.trasferisciBadge(da, a, tipoId);
  await tx.wait();
  return tx.hash;
}

async function getBadgeCliente(address) {
  const ids = await badgeContract.badgeDelClientes(address);
  return ids.map(id => Number(id));
}

async function haIlBadge(address, tipoId) {
  return await badgeContract.haIlBadge(address, tipoId);
}

async function getTuttiBadge() {
  const [ids, nomi, attivi] = await badgeContract.getTuttiBadge();
  return ids.map((id, i) => ({
    id:     Number(id),
    nome:   nomi[i],
    attivo: attivi[i],
  }));
}

async function aggiungiBadge(nome, descrizione, immagineURI) {
  const tx = await badgeContract.aggiungiBadge(nome, descrizione, immagineURI);
  await tx.wait();
  return tx.hash;
}

async function getStorico(address) {
  const fromBlock = 0n;

  // Filtri eventi LSP7
  const filterCarica    = tokenContract.filters.PointsLoaded(address);
  const filterScala     = tokenContract.filters.PointsScaled(address);
  const filterTxIn      = tokenContract.filters.PointsTransferred(null, address);
  const filterTxOut     = tokenContract.filters.PointsTransferred(address);

  // Filtri eventi LSP8
  const filterBadgeIn   = badgeContract.filters.BadgeAssegnato(address);
  const filterBadgeRev  = badgeContract.filters.BadgeRevocato(address);
  const filterBadgeTxIn = badgeContract.filters.BadgeTrasferito(null, address);
  const filterBadgeTxOut= badgeContract.filters.BadgeTrasferito(address);

  const [
    evCarica, evScala, evTxIn, evTxOut,
    evBadgeIn, evBadgeRev, evBadgeTxIn, evBadgeTxOut
  ] = await Promise.all([
    tokenContract.queryFilter(filterCarica,    fromBlock),
    tokenContract.queryFilter(filterScala,     fromBlock),
    tokenContract.queryFilter(filterTxIn,      fromBlock),
    tokenContract.queryFilter(filterTxOut,     fromBlock),
    badgeContract.queryFilter(filterBadgeIn,   fromBlock),
    badgeContract.queryFilter(filterBadgeRev,  fromBlock),
    badgeContract.queryFilter(filterBadgeTxIn, fromBlock),
    badgeContract.queryFilter(filterBadgeTxOut,fromBlock),
  ]);

  const eventi = [];

  for (const e of evCarica) {
    const block = await provider.getBlock(e.blockNumber);
    eventi.push({ tipo:"carica", qty: Number(e.args.amount), nota: e.args.note, hash: e.transactionHash, ts: block.timestamp * 1000 });
  }
  for (const e of evScala) {
    const block = await provider.getBlock(e.blockNumber);
    eventi.push({ tipo:"scala", qty: Number(e.args.amount), nota: e.args.note, hash: e.transactionHash, ts: block.timestamp * 1000 });
  }
  for (const e of evTxIn) {
    const block = await provider.getBlock(e.blockNumber);
    eventi.push({ tipo:"trasferisci_in", qty: Number(e.args.amount), nota: e.args.note, da: e.args.from, hash: e.transactionHash, ts: block.timestamp * 1000 });
  }
  for (const e of evTxOut) {
    const block = await provider.getBlock(e.blockNumber);
    eventi.push({ tipo:"trasferisci_out", qty: Number(e.args.amount), nota: e.args.note, a: e.args.to, hash: e.transactionHash, ts: block.timestamp * 1000 });
  }
  for (const e of evBadgeIn) {
    const block = await provider.getBlock(e.blockNumber);
    eventi.push({ tipo:"badge_in", tipoId: Number(e.args.tipoId), hash: e.transactionHash, ts: block.timestamp * 1000 });
  }
  for (const e of evBadgeRev) {
    const block = await provider.getBlock(e.blockNumber);
    eventi.push({ tipo:"badge_rev", tipoId: Number(e.args.tipoId), hash: e.transactionHash, ts: block.timestamp * 1000 });
  }
  for (const e of evBadgeTxIn) {
    const block = await provider.getBlock(e.blockNumber);
    eventi.push({ tipo:"badge_tx_in", tipoId: Number(e.args.tipoId), da: e.args.da, hash: e.transactionHash, ts: block.timestamp * 1000 });
  }
  for (const e of evBadgeTxOut) {
    const block = await provider.getBlock(e.blockNumber);
    eventi.push({ tipo:"badge_tx_out", tipoId: Number(e.args.tipoId), a: e.args.a, hash: e.transactionHash, ts: block.timestamp * 1000 });
  }

  return eventi.sort((a,b) => b.ts - a.ts);
}

module.exports = {
  init, caricaPunti, scalaPunti, trasferisciPunti,
  getSaldo, getSupplyTotale, getStorico,
  assegnaBadge, revocaBadge, trasferisciBadge,
  getBadgeCliente, haIlBadge, getTuttiBadge, aggiungiBadge,
};
