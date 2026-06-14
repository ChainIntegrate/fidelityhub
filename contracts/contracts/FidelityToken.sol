// SPDX-License-Identifier: BUSL-1.1
pragma solidity ^0.8.19;

import "@lukso/lsp-smart-contracts/contracts/LSP7DigitalAsset/LSP7DigitalAsset.sol";

/**
 * @title FidelityToken
 * @dev Token LSP7 per la gestione punti fedeltà su LUKSO
 * - Decimals: 0 (solo interi)
 * - Admin: mint, burn, transfer
 * - Utenti: possono trasferire liberamente i propri punti
 * - Compatibile con EOA (MetaMask) e Universal Profile (UP)
 */
contract FidelityToken is LSP7DigitalAsset {

    // ── Errori custom ──────────────────────────────────────────────────────────
    error NotAuthorized(address caller);
    error InvalidAmount(uint256 amount);
    error InsufficientBalance(address account, uint256 balance, uint256 required);

    // ── Eventi ─────────────────────────────────────────────────────────────────
    event PointsLoaded(address indexed to, uint256 amount, string note);
    event PointsScaled(address indexed from, uint256 amount, string note);
    event PointsTransferred(address indexed from, address indexed to, uint256 amount, string note);

    // ── Constructor ────────────────────────────────────────────────────────────
    constructor(
        string memory name,
        string memory symbol,
        address owner
    ) LSP7DigitalAsset(
        name,
        symbol,
        owner,
        0,
        true    // isNonDivisible = true → decimals = 0, solo interi
    ) {}

// ── Carica Punti (mint) ────────────────────────────────────────────────────
    function caricaPunti(
        address cliente,
        uint256 quantita,
        string calldata nota
    ) external {
        if (msg.sender != owner()) revert NotAuthorized(msg.sender);
        if (quantita == 0) revert InvalidAmount(quantita);
        _mint(cliente, quantita, true, "");
        emit PointsLoaded(cliente, quantita, nota);
    }

    // ── Scala Punti (burn) ─────────────────────────────────────────────────────
    function scalaPunti(
        address cliente,
        uint256 quantita,
        string calldata nota
    ) external {
        if (msg.sender != owner()) revert NotAuthorized(msg.sender);
        if (quantita == 0) revert InvalidAmount(quantita);
        uint256 saldo = balanceOf(cliente);
        if (saldo < quantita) revert InsufficientBalance(cliente, saldo, quantita);
        _burn(cliente, quantita, "");
        emit PointsScaled(cliente, quantita, nota);
    }

    // ── Trasferisci Punti admin ────────────────────────────────────────────────
    function trasferisciPunti(
        address da,
        address a,
        uint256 quantita,
        string calldata nota
    ) external {
        if (msg.sender != owner()) revert NotAuthorized(msg.sender);
        if (quantita == 0) revert InvalidAmount(quantita);
        uint256 saldo = balanceOf(da);
        if (saldo < quantita) revert InsufficientBalance(da, saldo, quantita);
        transfer(da, a, quantita, true, "");
        emit PointsTransferred(da, a, quantita, nota);
    }

    // ── Saldo cliente ──────────────────────────────────────────────────────────
    function saldoCliente(address cliente) external view returns (uint256) {
        return balanceOf(cliente);
    }

    // ── Supply totale ──────────────────────────────────────────────────────────
    function supplyTotale() external view returns (uint256) {
        return totalSupply();
    }}
