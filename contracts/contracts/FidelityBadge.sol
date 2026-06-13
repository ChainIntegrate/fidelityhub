// SPDX-License-Identifier: BUSL-1.1
pragma solidity ^0.8.19;

import "@lukso/lsp-smart-contracts/contracts/LSP8IdentifiableDigitalAsset/LSP8IdentifiableDigitalAsset.sol";

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
    ) LSP8IdentifiableDigitalAsset(name, symbol, owner, 0, 0) {
        _aggiungiBadge("Gold", "Cliente di livello Gold", "ipfs://");
        _aggiungiBadge("Silver", "Cliente di livello Silver", "ipfs://");
        _aggiungiBadge("VIP", "Cliente VIP", "ipfs://");
        _aggiungiBadge("Early Adopter", "Primo ad aderire al programma", "ipfs://");
        _aggiungiBadge("Top Cliente", "Il migliore cliente del mese", "ipfs://");
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
