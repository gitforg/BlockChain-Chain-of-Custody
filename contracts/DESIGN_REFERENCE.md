# Chain of Custody Smart Contracts - Design Reference

## Design Principles (Week 2 - Design Before Coding)

### ✅ What We Designed First

Before writing any Solidity code, we designed:

1. **Data Model** - Evidence Record Structure
2. **Status Lifecycle** - How evidence progresses
3. **Custody History** - Complete transfer tracking
4. **Role System** - Who can do what

---

## 1. Data Model

### Evidence Record

Each piece of evidence needs these attributes:

| Field | Type | Purpose | Example |
|-------|------|---------|---------|
| `evidenceId` | string | Unique identifier | `"EV001"` |
| `caseId` | string | Associated case | `"CASE001"` |
| `fileHash` | string | SHA256 hash of file | `"7f82ab..."` |
| `ipfsCid` | string | IPFS content ID | `"QmXYZ..."` |
| `currentCustodian` | address | Current holder | `0x123...` |
| `status` | enum | Current state | `InLab` |
| `registeredAt` | timestamp | Registration time | `1702123456` |

---

## 2. Status Lifecycle

Evidence follows a **one-way progression**:

```
┌─────────┐
│Registered│ ← Officer registers evidence
└────┬────┘
     │
     ▼
┌─────────┐
│InTransit│ ← Evidence being moved
└────┬────┘
     │
     ▼
┌──────┐
│InLab │ ← Evidence in analysis
└────┬─┘
     │
     ▼
┌──────────┐
│InCourt   │ ← Evidence in court proceeding
└────┬─────┘
     │
     ▼
┌──────────┐
│Disposed  │ ← Evidence destruction/archival
└──────────┘
```

**Key Rule:** Status can ONLY move forward, never backward.

```
✅ Allowed:    Registered → InTransit → InLab
❌ Blocked:    InCourt → InTransit (regression)
❌ Blocked:    InLab → InLab (no change)
```

---

## 3. Custody History

Every transfer is recorded on-chain:

### CustodyRecord Structure

```
Transfer 1:
├─ From: 0x000 (system origin)
├─ To: Officer A (0x123...)
├─ Timestamp: 1702000000
├─ Action: "REGISTERED"
└─ Status at transfer: Registered

Transfer 2:
├─ From: Officer A (0x123...)
├─ To: Analyst B (0x456...)
├─ Timestamp: 1702001000
├─ Action: "TRANSFER_TO_LAB"
└─ Status at transfer: Registered

Transfer 3:
├─ From: Analyst B (0x456...)
├─ To: Analyst B (0x456...) [same person]
├─ Timestamp: 1702002000
├─ Action: "IN_LAB"
└─ Status at transfer: InLab
```

**What We Get:**
- Complete audit trail: WHO → WHO → WHO
- Exact timestamps for every action
- Reason for each transfer
- Evidence state at each point

---

## 4. Role System

### Four Roles with Different Permissions

```
┌──────────────────────────────────────────┐
│              ADMIN_ROLE                  │
│  • Create all roles                      │
│  • Emergency transfers                   │
│  • System management                     │
└──────────────────────────────────────────┘

┌──────────────────────────────────────────┐
│            OFFICER_ROLE                  │
│  • Register evidence                     │
│  • Transfer custody                      │
│  • Initial evidence upload               │
└──────────────────────────────────────────┘

┌──────────────────────────────────────────┐
│            ANALYST_ROLE                  │
│  • Update evidence status                │
│  • Perform analysis                      │
│  • Document findings                     │
└──────────────────────────────────────────┘

┌──────────────────────────────────────────┐
│             COURT_ROLE                   │
│  • Mark evidence as presented            │
│  • Authorize disposal                    │
│  • Final disposition                     │
└──────────────────────────────────────────┘
```

---

## 5. Function Mapping to Real-World Actions

| Real-World Action | Solidity Function | Role | Data Recorded |
|---|---|---|---|
| Officer receives evidence | `registerEvidence()` | OFFICER | Evidence ID, Hash, IPFS CID, Officer |
| Send to lab | `transferCustody()` | OFFICER | From/To, Timestamp, "TRANSFER_TO_LAB" |
| Evidence arrives at lab | `updateStatus()` | ANALYST | InLab, Timestamp, Analyst |
| Analysis complete | `updateStatus()` | ANALYST | InCourt, Timestamp, Analyst |
| Court receives evidence | `transferCustody()` | COURT | From/To, Timestamp, "TO_COURT" |
| Evidence disposed | `disposeEvidence()` | COURT | Disposed, Timestamp, Court Officer |
| Audit trail needed | `getCustodyHistory()` | ANY | Full transfer log |

---

## 6. Key Design Decisions

### ✅ Why We Did This

| Decision | Reason |
|----------|--------|
| **Evidence ID as key** | Natural identifier, easier than auto-increment |
| **Status as Enum** | Enforces only valid states, gas efficient |
| **Custody Records Array** | Complete immutable history, blockchain's strength |
| **Current Custodian field** | Quick lookup, efficiency |
| **Events for everything** | Off-chain indexing, real-time monitoring |
| **Role-based access** | Only authorized users can perform actions |
| **Forward-only status** | Prevents tampering, maintains integrity |

### ❌ What We Avoided

| Anti-pattern | Why Not |
|---|---|
| Free-form status strings | Could be typos, invalid states |
| Timestamp not recorded | Can't audit when things happened |
| No custody history | Can't prove chain of custody |
| No roles | Anyone could do anything |
| Backward status transitions | Could hide evidence movement |

---

## 7. Smart Contract File Structure

```
contracts/
├── AccessControlManager.sol
│   └── Manages ADMIN, OFFICER, ANALYST, COURT roles
│
└── EvidenceRegistry.sol
    ├── Stores Evidence records
    ├── Tracks CustodyRecords
    ├── Enforces Status lifecycle
    └── Emits Events for all actions
```

---

## 8. Event Log Example

When you perform actions, blockchain logs events:

```solidity
// Officer registers evidence
EvidenceRegistered(
    evidenceId: "EV001",
    caseId: "CASE001",
    fileHash: "7f82ab...",
    ipfsCid: "QmXYZ...",
    registeredBy: 0x123... (Officer),
    timestamp: 1702000000
)

// Officer transfers to analyst
CustodyTransferred(
    evidenceId: "EV001",
    from: 0x123... (Officer),
    to: 0x456... (Analyst),
    action: "TRANSFER_TO_LAB",
    timestamp: 1702001000
)

// Analyst updates status
StatusUpdated(
    evidenceId: "EV001",
    oldStatus: Registered,
    newStatus: InLab,
    updatedBy: 0x456... (Analyst),
    timestamp: 1702002000
)
```

**These events can be:**
- Monitored in real-time
- Indexed by off-chain database
- Used for alerts and notifications
- Replayed to audit entire history

---

## 9. Query Examples

### Get Current Evidence State
```solidity
Evidence memory ev = evidenceRegistry.getEvidence("EV001");
// Returns: evidenceId, caseId, fileHash, ipfsCid, 
//          currentCustodian, status, registeredAt, exists
```

### View Entire Custody Chain
```solidity
CustodyRecord[] memory history = evidenceRegistry.getCustodyHistory("EV001");
// Returns array of all transfers
```

### Check Evidence Status
```solidity
string memory status = evidenceRegistry.getStatusString("EV001");
// Returns: "REGISTERED", "IN_TRANSIT", "IN_LAB", "IN_COURT", "DISPOSED"
```

---

## 10. Security & Integrity

### What the Smart Contracts Enforce

✅ **Authorization**
- Only officers can register
- Only analysts can update status
- Only court can dispose
- Only admins can manage roles

✅ **Data Integrity**
- Evidence immutable once registered
- Status can only progress forward
- All transfers timestamped and recorded
- No backdating or modification

✅ **Audit Trail**
- Every action logged
- Complete custody chain visible
- Timestamps prove sequence
- Addresses prove responsibility

---

## Summary

This design ensures:
- **Completeness**: All required data captured
- **Integrity**: Data cannot be altered
- **Auditability**: Full chain of custody preserved
- **Accountability**: Every action attributed to specific address
- **Immutability**: Blockchain ensures nothing is lost
