// SPDX-License-Identifier: BUSL-1.1
pragma solidity ^0.8.19;

import { LSP8IdentifiableDigitalAsset } from "@lukso/lsp8-contracts/contracts/LSP8IdentifiableDigitalAsset.sol";
import { _LSP4_TOKEN_TYPE_NFT } from "@lukso/lsp4-contracts/contracts/LSP4Constants.sol";
import { _LSP8_TOKENID_FORMAT_NUMBER } from "@lukso/lsp8-contracts/contracts/LSP8Constants.sol";

/**
 * @title FidelityBadge
 * @dev Badge NFT LSP8 per i riconoscimenti fedeltà su LUKSO
 * - Ogni badge è un NFT unico identificato da tokenId
 * - Tipi di badge configurabili dall'admin (scalabile)
 * - Un solo badge per tipo per wallet
 * - Trasferibile tra EOA e Universal Profile
 * - Revocabile dall'admin
 */
contract FidelityBadge is LSP8IdentifiableDigitalAsset {

    error NotAuthorized(address caller);
    error BadgeTypeNotExists(uint256 tipoId);
    error ClienteHaGiaQuestoBadge(address cliente, uint256 tipoId);
    error ClienteNonHaQuestoBadge(address cliente, uint256 tipoId);
    error BadgeTypeNotActive(uint256 tipoId);

    struct TipoBadge {
        string nome;
        string descrizione;
        string immagineURI;
        bool attivo;
        uint256 totaleMintati;
    }

    mapping(uint256 => TipoBadge) public tipiBadge;
    mapping(address => mapping(uint256 => bytes32)) public badgeDelCliente;
    mapping(bytes32 => uint256) public tipoDelToken;

    uint256 public numeroTipi;
    uint256 private _tokenCounter;

    event TipoBadgeAggiunto(uint256 indexed tipoId, string nome);
    event TipoBadgeAggiornato(uint256 indexed tipoId, string nome);
    event TipoBadgeDisattivato(uint256 indexed tipoId);
    event BadgeAssegnato(address indexed cliente, uint256 indexed tipoId, bytes32 tokenId);
    event BadgeRevocato(address indexed cliente, uint256 indexed tipoId, bytes32 tokenId);
    event BadgeTrasferito(address indexed da, address indexed a, uint256 indexed tipoId, bytes32 tokenId);

    constructor(
        string memory name,
        string memory symbol,
        address owner
    ) LSP8IdentifiableDigitalAsset(
        name,
        symbol,
        owner,
        _LSP4_TOKEN_TYPE_NFT,
        _LSP8_TOKENID_FORMAT_NUMBER
    ) {
        _aggiungiBadge("Gold",         "Cliente di livello Gold",         "");
        _aggiungiBadge("Silver",       "Cliente di livello Silver",       "");
        _aggiungiBadge("VIP",          "Cliente VIP",                     "");
        _aggiungiBadge("Early Adopter","Primo ad aderire al programma",   "");
        _aggiungiBadge("Top Cliente",  "Il migliore cliente del mese",    "");
    }

    modifier soloAdmin() {
        if (msg.sender != owner()) revert NotAuthorized(msg.sender);
        _;
    }

    modifier tipoEsiste(uint256 tipoId) {
        if (tipoId == 0 || tipoId > numeroTipi) revert BadgeTypeNotExists(tipoId);
        _;
    }

    function aggiungiBadge(
        string calldata nome,
        string calldata descrizione,
        string calldata immagineURI
    ) external soloAdmin {
        _aggiungiBadge(nome, descrizione, immagineURI);
    }

    function _aggiungiBadge(
        string memory nome,
        string memory descrizione,
        string memory immagineURI
    ) internal {
        numeroTipi++;
        tipiBadge[numeroTipi] = TipoBadge({
            nome: nome,
            descrizione: descrizione,
            immagineURI: immagineURI,
            attivo: true,
            totaleMintati: 0
        });
        emit TipoBadgeAggiunto(numeroTipi, nome);
    }

    function aggiornaBadge(
        uint256 tipoId,
        string calldata nome,
        string calldata descrizione,
        string calldata immagineURI
    ) external soloAdmin tipoEsiste(tipoId) {
        TipoBadge storage b = tipiBadge[tipoId];
        b.nome = nome;
        b.descrizione = descrizione;
        b.immagineURI = immagineURI;
        emit TipoBadgeAggiornato(tipoId, nome);
    }

    function disattivaBadge(uint256 tipoId) external soloAdmin tipoEsiste(tipoId) {
        tipiBadge[tipoId].attivo = false;
        emit TipoBadgeDisattivato(tipoId);
    }

    function riattivaBadge(uint256 tipoId) external soloAdmin tipoEsiste(tipoId) {
        tipiBadge[tipoId].attivo = true;
    }

    function assegnaBadge(
        address cliente,
        uint256 tipoId
    ) external soloAdmin tipoEsiste(tipoId) {
        if (!tipiBadge[tipoId].attivo) revert BadgeTypeNotActive(tipoId);
        if (badgeDelCliente[cliente][tipoId] != bytes32(0))
            revert ClienteHaGiaQuestoBadge(cliente, tipoId);
        _tokenCounter++;
        bytes32 tokenId = bytes32(_tokenCounter);
        badgeDelCliente[cliente][tipoId] = tokenId;
        tipoDelToken[tokenId] = tipoId;
        tipiBadge[tipoId].totaleMintati++;
        _mint(cliente, tokenId, true, "");

        // Setta metadati LSP4 per questo tokenId
        bytes32 metaKey = keccak256(abi.encodePacked("LSP8MetadataJSON:", tokenId));
        string memory meta = string(abi.encodePacked(
            '{"LSP4Metadata":{"name":"', tipiBadge[tipoId].nome,
            '","description":"', tipiBadge[tipoId].descrizione,
            '","attributes":[{"key":"type","value":"FidelityBadge"},{"key":"level","value":"', tipiBadge[tipoId].nome, '"}]}}'
        ));
        _setData(metaKey, bytes(meta));

        emit BadgeAssegnato(cliente, tipoId, tokenId);
    }

    function revocaBadge(
        address cliente,
        uint256 tipoId
    ) external soloAdmin tipoEsiste(tipoId) {
        bytes32 tokenId = badgeDelCliente[cliente][tipoId];
        if (tokenId == bytes32(0)) revert ClienteNonHaQuestoBadge(cliente, tipoId);
        delete badgeDelCliente[cliente][tipoId];
        delete tipoDelToken[tokenId];
        _burn(tokenId, "");
        emit BadgeRevocato(cliente, tipoId, tokenId);
    }

    function trasferisciBadge(
        address da,
        address a,
        uint256 tipoId
    ) external soloAdmin tipoEsiste(tipoId) {
        bytes32 tokenId = badgeDelCliente[da][tipoId];
        if (tokenId == bytes32(0)) revert ClienteNonHaQuestoBadge(da, tipoId);
        if (badgeDelCliente[a][tipoId] != bytes32(0))
            revert ClienteHaGiaQuestoBadge(a, tipoId);
        delete badgeDelCliente[da][tipoId];
        badgeDelCliente[a][tipoId] = tokenId;
        transfer(da, a, tokenId, true, "");
        emit BadgeTrasferito(da, a, tipoId, tokenId);
    }

    function badgeDelClientes(address cliente) external view returns (uint256[] memory) {
        uint256 count = 0;
        for (uint256 i = 1; i <= numeroTipi; i++) {
            if (badgeDelCliente[cliente][i] != bytes32(0)) count++;
        }
        uint256[] memory risultato = new uint256[](count);
        uint256 idx = 0;
        for (uint256 i = 1; i <= numeroTipi; i++) {
            if (badgeDelCliente[cliente][i] != bytes32(0)) {
                risultato[idx++] = i;
            }
        }
        return risultato;
    }

    function getInfoBadge(uint256 tipoId) external view tipoEsiste(tipoId) returns (
        string memory nome,
        string memory descrizione,
        string memory immagineURI,
        bool attivo,
        uint256 totaleMintati
    ) {
        TipoBadge storage b = tipiBadge[tipoId];
        return (b.nome, b.descrizione, b.immagineURI, b.attivo, b.totaleMintati);
    }

    function haIlBadge(address cliente, uint256 tipoId) external view returns (bool) {
        return badgeDelCliente[cliente][tipoId] != bytes32(0);
    }

    function getTuttiBadge() external view returns (
        uint256[] memory ids,
        string[] memory nomi,
        bool[] memory attivi
    ) {
        ids = new uint256[](numeroTipi);
        nomi = new string[](numeroTipi);
        attivi = new bool[](numeroTipi);
        for (uint256 i = 1; i <= numeroTipi; i++) {
            ids[i-1] = i;
            nomi[i-1] = tipiBadge[i].nome;
            attivi[i-1] = tipiBadge[i].attivo;
        }
        return (ids, nomi, attivi);
    }
}