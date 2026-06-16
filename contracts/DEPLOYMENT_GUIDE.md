# Chain of Custody Smart Contracts - Deployment Guide

## Overview

This guide explains the two smart contracts created for the blockchain chain-of-custody system.

---

## Contracts Created

### 1. **AccessControlManager.sol**
**Purpose:** Role-based access control for the system

**Roles:**
- `ADMIN_ROLE` - Full system control
- `OFFICER_ROLE` - Register evidence, transfer custody
- `ANALYST_ROLE` - Update evidence status
- `COURT_ROLE` - Mark evidence for court/disposal

**Key Functions:**
```solidity
addOfficer(address _officer)        // Admin adds officer
addAnalyst(address _analyst)        // Admin adds analyst
addCourtUser(address _courtUser)    // Admin adds court user
revokeRole(bytes32 _role, address _account)  // Admin revokes role
isOfficer(address _user)            // Check if user is officer
isAnalyst(address _user)            // Check if user is analyst
isCourtUser(address _user)          // Check if user is court user
isAdmin(address _user)              // Check if user is admin
```

---

### 2. **EvidenceRegistry.sol**
**Purpose:** Main contract managing evidence records and custody chain

**Data Structures:**

#### Status Enum
```
Registered → InTransit → InLab → InCourt → Disposed
```

#### Evidence Struct
```solidity
struct Evidence {
    string evidenceId;              // Unique ID (e.g., EV001)
    string caseId;                  // Case reference (e.g., CASE001)
    string fileHash;                // SHA256 hash of file
    string ipfsCid;                 // IPFS content ID
    address currentCustodian;       // Current holder's address
    Status status;                  // Current status
    uint256 registeredAt;           // Registration timestamp
    bool exists;                    // Existence flag
}
```

#### CustodyRecord Struct
```solidity
struct CustodyRecord {
    address from;                   // Previous custodian
    address to;                     // New custodian
    uint256 timestamp;              // Transfer time
    string action;                  // Action description
    Status statusAtTransfer;        // Status at transfer time
}
```

**Key Functions:**

1. **Register Evidence** (Officer only)
```solidity
registerEvidence(
    string _evidenceId,    // e.g., "EV001"
    string _caseId,        // e.g., "CASE001"
    string _fileHash,      // SHA256 hash
    string _ipfsCid        // IPFS CID
)
```
- Creates evidence record with "Registered" status
- Records first custody entry
- Only officers can call

2. **Transfer Custody**
```solidity
transferCustody(
    string _evidenceId,     // Evidence to transfer
    address _newCustodian,  // New holder address
    string _action          // Description (e.g., "TRANSFER_TO_LAB")
)
```
- Transfers evidence to new custodian
- Records custody history
- Current custodian or admin can call

3. **Update Status** (Analyst only)
```solidity
updateStatus(string _evidenceId, Status _newStatus)
```
- Updates evidence status
- Only allows forward progression
- Records in custody history
- Emits StatusUpdated event

4. **Dispose Evidence** (Court only)
```solidity
disposeEvidence(string _evidenceId)
```
- Marks evidence as disposed
- Final status transition
- Court role only

5. **Query Functions**
```solidity
getEvidence(string _evidenceId)              // Returns full evidence record
getCustodyHistory(string _evidenceId)        // Returns all custody records
getCustodyHistoryLength(string _evidenceId)  // Returns transfer count
getCustodyRecord(string _evidenceId, uint256 _index)  // Get specific transfer
getStatusString(string _evidenceId)          // Get status as string
```

---

## Events Emitted

### EvidenceRegistered
```solidity
event EvidenceRegistered(
    string indexed evidenceId,
    string caseId,
    string fileHash,
    string ipfsCid,
    address indexed registeredBy,
    uint256 timestamp
)
```

### CustodyTransferred
```solidity
event CustodyTransferred(
    string indexed evidenceId,
    address indexed from,
    address indexed to,
    string action,
    uint256 timestamp
)
```

### StatusUpdated
```solidity
event StatusUpdated(
    string indexed evidenceId,
    Status oldStatus,
    Status newStatus,
    address indexed updatedBy,
    uint256 timestamp
)
```

### EvidenceDisposed
```solidity
event EvidenceDisposed(
    string indexed evidenceId,
    address indexed disposedBy,
    uint256 timestamp
)
```

---

## Deployment Steps

### 1. Deploy AccessControlManager First
```bash
# Deploy AccessControlManager
# Deployer becomes ADMIN_ROLE
```

### 2. Deploy EvidenceRegistry
```bash
# Deploy EvidenceRegistry
# Constructor grants deployer DEFAULT_ADMIN_ROLE
```

### 3. Set Up Roles (via AccessControlManager)
```
Admin calls:
- addOfficer(officer_address)
- addAnalyst(analyst_address)
- addCourtUser(court_address)
```

### 4. Wire EvidenceRegistry with Roles (if separate)
If you're using AccessControlManager as the role source, update EvidenceRegistry to reference it.

---

## Usage Example Flow

### Step 1: Officer Registers Evidence
```
Officer calls: registerEvidence(
    "EV001",
    "CASE001",
    "7f82ab...",
    "QmXYZ..."
)

Result:
- Evidence created with Registered status
- Custody record: address(0) → Officer
```

### Step 2: Officer Transfers to Lab
```
Officer calls: transferCustody(
    "EV001",
    lab_analyst_address,
    "TRANSFER_TO_LAB"
)

Result:
- Current custodian: Officer → Analyst
- Custody record added: Officer → Analyst
```

### Step 3: Analyst Updates Status
```
Analyst calls: updateStatus(
    "EV001",
    Status.InLab
)

Result:
- Status: Registered → InLab
- StatusUpdated event emitted
- Custody record logged
```

### Step 4: Query History
```
Call: getCustodyHistory("EV001")

Returns:
[
    {from: 0x000..., to: Officer, action: "REGISTERED", status: Registered},
    {from: Officer, to: Analyst, action: "TRANSFER_TO_LAB", status: Registered},
    {from: Analyst, to: Analyst, action: "IN_LAB", status: InLab}
]
```

### Step 5: Court Disposes
```
Court calls: disposeEvidence("EV001")

Result:
- Status: InCourt → Disposed
- Custody record: Custodian → 0x000
- EvidenceDisposed event emitted
```

---

## Security Considerations

✅ **Implemented:**
- OpenZeppelin AccessControl for role management
- Status can only progress forward (no regression)
- Evidence immutability once registered
- All transfers logged on-chain
- Role-based function access

⚠️ **Notes:**
- Ensure proper access control setup post-deployment
- Keep admin private key secure
- Regular audits of custody history
- Monitor for unusual transfer patterns

---

## Testing Recommendations

1. **Unit Tests:**
   - Verify role checks work correctly
   - Test status transitions
   - Validate custody transfers

2. **Integration Tests:**
   - Full workflow: Register → Transfer → Update → Dispose
   - Multi-party transfers
   - Role revocation scenarios

3. **Edge Cases:**
   - Duplicate evidence registration (should fail)
   - Backward status transitions (should fail)
   - Unauthorized function calls (should fail)

---

## Next Steps

1. Deploy contracts to test network
2. Set up proper role hierarchy
3. Implement frontend UI for evidence tracking
4. Create testing suite
5. Perform security audit
