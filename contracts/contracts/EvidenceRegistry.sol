// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/access/AccessControl.sol";

/**
 * @title EvidenceRegistry
 * @dev Main contract for managing evidence and custody chain
 * Implements complete chain of custody tracking with role-based access
 */
contract EvidenceRegistry is AccessControl {
    // Role constants
    bytes32 public constant OFFICER_ROLE = keccak256("OFFICER_ROLE");
    bytes32 public constant ANALYST_ROLE = keccak256("ANALYST_ROLE");
    bytes32 public constant COURT_ROLE = keccak256("COURT_ROLE");

    // Status Enum - Evidence lifecycle
    enum Status {
        Registered,
        InTransit,
        InLab,
        InCourt,
        Disposed
    }

    // Custody Record - Tracks each transfer
    struct CustodyRecord {
        address from;
        address to;
        uint256 timestamp;
        string action;
        Status statusAtTransfer;
    }

    // Evidence Struct - Complete evidence information
    struct Evidence {
        string evidenceId;
        string caseId;
        string fileHash;
        string ipfsCid;
        address currentCustodian;
        Status status;
        uint256 registeredAt;
        bool exists;
    }

    // Storage Mappings
    mapping(string => Evidence) public evidenceRegistry;
    mapping(string => CustodyRecord[]) public custodyHistory;

    // Events
    event EvidenceRegistered(
        string indexed evidenceId,
        string caseId,
        string fileHash,
        string ipfsCid,
        address indexed registeredBy,
        uint256 timestamp
    );

    event CustodyTransferred(
        string indexed evidenceId,
        address indexed from,
        address indexed to,
        string action,
        uint256 timestamp
    );

    event StatusUpdated(
        string indexed evidenceId,
        Status oldStatus,
        Status newStatus,
        address indexed updatedBy,
        uint256 timestamp
    );

    event EvidenceDisposed(
        string indexed evidenceId,
        address indexed disposedBy,
        uint256 timestamp
    );

    /**
     * @dev Initialize with deployer as admin
     */
    constructor() {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
    }

    /**
     * @dev Register new evidence (Officer privilege)
     * Creates initial evidence record with Registered status
     * and first custody record
     */
    function registerEvidence(
        string memory _evidenceId,
        string memory _caseId,
        string memory _fileHash,
        string memory _ipfsCid
    ) external onlyRole(OFFICER_ROLE) {
        require(
            !evidenceRegistry[_evidenceId].exists,
            "Evidence already registered"
        );
        require(bytes(_evidenceId).length > 0, "Invalid evidence ID");
        require(bytes(_caseId).length > 0, "Invalid case ID");
        require(bytes(_fileHash).length > 0, "Invalid file hash");
        require(bytes(_ipfsCid).length > 0, "Invalid IPFS CID");

        // Create evidence record
        evidenceRegistry[_evidenceId] = Evidence({
            evidenceId: _evidenceId,
            caseId: _caseId,
            fileHash: _fileHash,
            ipfsCid: _ipfsCid,
            currentCustodian: msg.sender,
            status: Status.Registered,
            registeredAt: block.timestamp,
            exists: true
        });

        // Create first custody record
        custodyHistory[_evidenceId].push(
            CustodyRecord({
                from: address(0),
                to: msg.sender,
                timestamp: block.timestamp,
                action: "REGISTERED",
                statusAtTransfer: Status.Registered
            })
        );

        emit EvidenceRegistered(
            _evidenceId,
            _caseId,
            _fileHash,
            _ipfsCid,
            msg.sender,
            block.timestamp
        );
    }

    /**
     * @dev Transfer custody of evidence
     * Only current custodian or higher role can transfer
     */
    function transferCustody(
        string memory _evidenceId,
        address _newCustodian,
        string memory _action
    ) external {
        Evidence storage evidence = evidenceRegistry[_evidenceId];
        require(evidence.exists, "Evidence not found");
        require(_newCustodian != address(0), "Invalid recipient address");
        require(
            msg.sender == evidence.currentCustodian ||
                hasRole(DEFAULT_ADMIN_ROLE, msg.sender),
            "Not authorized to transfer"
        );

        address previousCustodian = evidence.currentCustodian;

        // Update current custodian
        evidence.currentCustodian = _newCustodian;

        // Record custody transfer
        custodyHistory[_evidenceId].push(
            CustodyRecord({
                from: previousCustodian,
                to: _newCustodian,
                timestamp: block.timestamp,
                action: _action,
                statusAtTransfer: evidence.status
            })
        );

        emit CustodyTransferred(
            _evidenceId,
            previousCustodian,
            _newCustodian,
            _action,
            block.timestamp
        );
    }

    /**
     * @dev Update evidence status
     * Status transitions: Registered → InTransit → InLab → InCourt → Disposed
     * Only analyst or authorized personnel can update
     */
    function updateStatus(string memory _evidenceId, Status _newStatus)
        external
        onlyRole(ANALYST_ROLE)
    {
        Evidence storage evidence = evidenceRegistry[_evidenceId];
        require(evidence.exists, "Evidence not found");

        Status oldStatus = evidence.status;

        // Validate status transition
        require(_newStatus != oldStatus, "Status unchanged");
        require(
            uint(oldStatus) <= uint(_newStatus),
            "Invalid status transition (can only progress forward)"
        );

        evidence.status = _newStatus;

        emit StatusUpdated(
            _evidenceId,
            oldStatus,
            _newStatus,
            msg.sender,
            block.timestamp
        );

        // Record status update in custody history
        custodyHistory[_evidenceId].push(
            CustodyRecord({
                from: msg.sender,
                to: evidence.currentCustodian,
                timestamp: block.timestamp,
                action: statusToString(_newStatus),
                statusAtTransfer: _newStatus
            })
        );
    }

    /**
     * @dev Mark evidence as disposed (Court or Admin privilege)
     */
    function disposeEvidence(string memory _evidenceId)
        external
        onlyRole(COURT_ROLE)
    {
        Evidence storage evidence = evidenceRegistry[_evidenceId];
        require(evidence.exists, "Evidence not found");
        require(evidence.status != Status.Disposed, "Already disposed");

        evidence.status = Status.Disposed;

        emit EvidenceDisposed(_evidenceId, msg.sender, block.timestamp);

        // Record disposal in custody history
        custodyHistory[_evidenceId].push(
            CustodyRecord({
                from: evidence.currentCustodian,
                to: address(0),
                timestamp: block.timestamp,
                action: "DISPOSED",
                statusAtTransfer: Status.Disposed
            })
        );
    }

    /**
     * @dev Get evidence details
     */
    function getEvidence(string memory _evidenceId)
        external
        view
        returns (Evidence memory)
    {
        require(evidenceRegistry[_evidenceId].exists, "Evidence not found");
        return evidenceRegistry[_evidenceId];
    }

    /**
     * @dev Get custody history for evidence
     */
    function getCustodyHistory(string memory _evidenceId)
        external
        view
        returns (CustodyRecord[] memory)
    {
        require(evidenceRegistry[_evidenceId].exists, "Evidence not found");
        return custodyHistory[_evidenceId];
    }

    /**
     * @dev Get custody history length
     */
    function getCustodyHistoryLength(string memory _evidenceId)
        external
        view
        returns (uint256)
    {
        require(evidenceRegistry[_evidenceId].exists, "Evidence not found");
        return custodyHistory[_evidenceId].length;
    }

    /**
     * @dev Get single custody record
     */
    function getCustodyRecord(string memory _evidenceId, uint256 _index)
        external
        view
        returns (CustodyRecord memory)
    {
        require(evidenceRegistry[_evidenceId].exists, "Evidence not found");
        require(
            _index < custodyHistory[_evidenceId].length,
            "Index out of bounds"
        );
        return custodyHistory[_evidenceId][_index];
    }

    /**
     * @dev Convert Status enum to string
     */
    function statusToString(Status _status)
        internal
        pure
        returns (string memory)
    {
        if (_status == Status.Registered) return "REGISTERED";
        if (_status == Status.InTransit) return "IN_TRANSIT";
        if (_status == Status.InLab) return "IN_LAB";
        if (_status == Status.InCourt) return "IN_COURT";
        if (_status == Status.Disposed) return "DISPOSED";
        return "UNKNOWN";
    }

    /**
     * @dev Get status as string
     */
    function getStatusString(string memory _evidenceId)
        external
        view
        returns (string memory)
    {
        require(evidenceRegistry[_evidenceId].exists, "Evidence not found");
        return statusToString(evidenceRegistry[_evidenceId].status);
    }
}