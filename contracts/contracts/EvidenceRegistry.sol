// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

contract EvidenceRegistry {

    struct Evidence {
        string evidenceId;
        string fileHash;
        string ipfsCid;
        string uploadedBy;
        uint256 timestamp;
    }

    mapping(string => Evidence) public evidences;

    event EvidenceRegistered(
        string evidenceId,
        string fileHash,
        string ipfsCid,
        string uploadedBy,
        uint256 timestamp
    );

    function registerEvidence(
        string memory _evidenceId,
        string memory _fileHash,
        string memory _ipfsCid,
        string memory _uploadedBy
    ) public {

        evidences[_evidenceId] = Evidence({
            evidenceId: _evidenceId,
            fileHash: _fileHash,
            ipfsCid: _ipfsCid,
            uploadedBy: _uploadedBy,
            timestamp: block.timestamp
        });

        emit EvidenceRegistered(
            _evidenceId,
            _fileHash,
            _ipfsCid,
            _uploadedBy,
            block.timestamp
        );
    }

    function getEvidence(
        string memory _evidenceId
    ) public view returns (
        string memory,
        string memory,
        string memory,
        string memory,
        uint256
    ) {

        Evidence memory e = evidences[_evidenceId];

        return (
            e.evidenceId,
            e.fileHash,
            e.ipfsCid,
            e.uploadedBy,
            e.timestamp
        );
    }
}