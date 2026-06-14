// SPDX-License-Identifier: BUSL-1.1
pragma solidity ^0.8.19;

import { LSP7DigitalAsset } from "@lukso/lsp7-contracts/contracts/LSP7DigitalAsset.sol";
import { _LSP4_TOKEN_TYPE_TOKEN } from "@lukso/lsp4-contracts/contracts/LSP4Constants.sol";

/**
 * @title FidelityToken
 * @dev Token LSP7 per la gestione punti fedeltà su LUKSO
 * - Decimals: 0 (solo interi)
 * - Admin: mint, burn, transfer
 * - Utenti: possono trasferire liberamente i propri punti
 * - Compatibile con EOA (MetaMask) e Universal Profile (UP)
 */
contract FidelityToken is LSP7DigitalAsset {

    error NotAuthorized(address caller);
    error InvalidAmount(uint256 amount);
    error InsufficientBalance(address account, uint256 balance, uint256 required);

    event PointsLoaded(address indexed to, uint256 amount, string note);
    event PointsScaled(address indexed from, uint256 amount, string note);
    event PointsTransferred(address indexed from, address indexed to, uint256 amount, string note);

    constructor(
        string memory name,
        string memory symbol,
        address owner
    ) LSP7DigitalAsset(
        name,
        symbol,
        owner,
        _LSP4_TOKEN_TYPE_TOKEN,
        true  // isNonDivisible = true → decimals = 0
    ) {}

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

    function saldoCliente(address cliente) external view returns (uint256) {
        return balanceOf(cliente);
    }

    function supplyTotale() external view returns (uint256) {
        return totalSupply();
    }
}