const { ethers } = require("hardhat");

async function main() {
  console.log("🚀 Deploy FidelityHub su LUKSO Testnet...\n");

  // Account che fa il deploy
  const [deployer] = await ethers.getSigners();
  console.log("Deploy account:", deployer.address);

  // Account admin del cliente (riceve ownership)
  const adminCliente = process.env.ADMIN_CLIENTE;
  console.log("Admin cliente:", adminCliente);

  // ── Deploy FidelityToken (LSP7) ──────────────────────────────────────────
  console.log("\n📦 Deploy FidelityToken (LSP7)...");
  const FidelityToken = await ethers.getContractFactory("FidelityToken");
  const token = await FidelityToken.deploy(
    "FidelityPoints",   // nome token
    "FPT",              // simbolo
    deployer.address    // owner iniziale = deployer
  );
  await token.waitForDeployment();
  const tokenAddress = await token.getAddress();
  console.log("✅ FidelityToken deployato:", tokenAddress);

  // ── Deploy FidelityBadge (LSP8) ──────────────────────────────────────────
  console.log("\n📦 Deploy FidelityBadge (LSP8)...");
  const FidelityBadge = await ethers.getContractFactory("FidelityBadge");
  const badge = await FidelityBadge.deploy(
    "FidelityBadge",    // nome
    "FBG",              // simbolo
    deployer.address    // owner iniziale = deployer
  );
  await badge.waitForDeployment();
  const badgeAddress = await badge.getAddress();
  console.log("✅ FidelityBadge deployato:", badgeAddress);

  // ── Trasferimento ownership al cliente ───────────────────────────────────
  console.log("\n🔑 Trasferimento ownership all'admin cliente...");
  
  await token.transferOwnership(adminCliente);
  console.log("✅ FidelityToken ownership trasferita a:", adminCliente);

  await badge.transferOwnership(adminCliente);
  console.log("✅ FidelityBadge ownership trasferita a:", adminCliente);

  // ── Riepilogo ────────────────────────────────────────────────────────────
  console.log("\n═══════════════════════════════════════════════");
  console.log("✅ DEPLOY COMPLETATO");
  console.log("═══════════════════════════════════════════════");
  console.log("FidelityToken (LSP7):", tokenAddress);
  console.log("FidelityBadge (LSP8):", badgeAddress);
  console.log("Owner (admin cliente):", adminCliente);
  console.log("═══════════════════════════════════════════════");
  console.log("\n⚠️  Salva questi indirizzi nel file .env del server!");
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("❌ Errore deploy:", err);
    process.exit(1);
  });