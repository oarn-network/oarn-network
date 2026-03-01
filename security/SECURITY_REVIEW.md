# OARN Network - Internal Security Review

**Date:** 2026-03-01
**Reviewer:** Internal Security Audit
**Scope:** Smart Contracts + Node Software

---

## Executive Summary

| Component | Critical | High | Medium | Low | Info |
|-----------|----------|------|--------|-----|------|
| Smart Contracts | 1 | 3 | 5 | 5 | 5 |
| Node (Rust) | 0 | 2 | 5 | 5 | 0 |
| **Total** | **1** | **5** | **10** | **10** | **5** |

**Overall Risk:** MEDIUM - Critical issue exists in deprecated V1 contract (not used in production). High severity issues require attention before mainnet.

---

## SMART CONTRACT FINDINGS

### CRITICAL

#### C-1: Reentrancy in TaskRegistry._completeTask() [V1 ONLY]
**File:** `TaskRegistry.sol:280-303`
**Status:** NOT APPLICABLE - TaskRegistryV2 is used in production and has this fixed.

The old TaskRegistry contract updates state inside a loop while making external calls. TaskRegistryV2 correctly implements checks-effects-interactions pattern.

---

### HIGH SEVERITY

#### H-1: Silent Reward Transfer Failures
**Files:** `TaskRegistry.sol:294-298`, `TaskRegistryV2.sol:395-400`
**Impact:** Nodes could permanently lose rewards if ETH transfer fails.

```solidity
(bool success, ) = nodesToReward[i].call{value: rewardPerNode}("");
if (success) {
    totalDistributed += rewardPerNode;
    // Failed transfers are silently ignored
}
```

**Recommendation:** Implement pull-based withdrawal or track failed transfers for later claim.

#### H-2: Front-Running on Task Claiming
**Files:** `TaskRegistryV2.sol:231-248`
**Impact:** Attackers can front-run profitable task claims.

**Recommendation:** Consider commit-reveal scheme or reputation-based claiming.

#### H-3: Centralized Dispute Resolution
**File:** `TaskRegistryV2.sol:420-432`
**Impact:** Owner can arbitrarily decide dispute outcomes.

**Recommendation:** Multi-sig or decentralized arbitration for mainnet.

---

### MEDIUM SEVERITY

| ID | Issue | File | Recommendation |
|----|-------|------|----------------|
| M-1 | Weak randomness in provider selection | OARNRegistry.sol | Consider Chainlink VRF |
| M-2 | Emission cap not enforced | COMPToken.sol | Implement per-year tracking |
| M-3 | Unbounded loop in getAvailableTasks | TaskRegistry.sol | Off-chain indexing |
| M-4 | DoS via unique result hashes | TaskRegistryV2.sol | Limit unique hashes |
| M-5 | Stake accounting after unstake | OARNRegistry.sol | Zero stakes on unstake |

---

### LOW SEVERITY

- L-1: Missing zero-address check for node
- L-2: External call in overloaded submitTask
- L-3: No minimum stake after slashing
- L-4: Missing event for emergency withdrawal
- L-5: ID scheme footgun (starts at 1)

---

## NODE SOFTWARE FINDINGS

### HIGH SEVERITY

#### H-1: Private Key Logging Risk
**File:** `main.rs:71-76`
**Risk:** Error handling could leak key material.

**Recommendation:** Use opaque error messages, consider `secrecy` crate.

#### H-2: Plaintext Private Key in Config
**File:** `config.rs:262-288`
**Risk:** Config files with keys could be exposed.

**Recommendation:** Implement encrypted keystore support (marked TODO).

---

### MEDIUM SEVERITY

| ID | Issue | File | Recommendation |
|----|-------|------|----------------|
| M-1 | Detailed error info leakage | Multiple | Generic user errors, debug logging |
| M-2 | Unvalidated ONNX execution | compute.rs | Model validation, sandboxing |
| M-3 | No TLS cert pinning | discovery.rs | Certificate pinning for critical endpoints |
| M-4 | Race in task ID query | blockchain.rs | Parse ID from tx events |
| M-5 | Non-atomic active_tasks | compute.rs | Use AtomicUsize |

---

### LOW SEVERITY

- L-1: IPFS cache path traversal risk
- L-2: Hardcoded public IPFS gateways
- L-3: Unchecked .unwrap() calls
- L-4: Non-critical random usage
- L-5: P2P keypair not persisted

---

## POSITIVE FINDINGS

### Smart Contracts
- Solidity 0.8.24 provides overflow protection
- Proper use of OpenZeppelin libraries
- TaskRegistryV2 fixes V1 reentrancy
- Immutable core addresses in OARNRegistry
- Fixed supply GOV token

### Node Software
- Zero `unsafe` blocks
- Strong crypto libraries (sha2, sha3, ethers, libp2p/noise)
- rustls for TLS (no OpenSSL)
- Type-safe input parsing
- Dynamic infrastructure discovery
- Graceful shutdown handling

---

## ACTION ITEMS

### Must Fix Before Mainnet

| Priority | Issue | Action |
|----------|-------|--------|
| HIGH | H-1 (Contracts) | Implement pull-based rewards or failed transfer tracking |
| HIGH | H-2 (Node) | Add encrypted keystore support |
| MEDIUM | M-2 (Contracts) | Enforce COMPToken emission caps |
| MEDIUM | M-4 (Node) | Parse task ID from transaction events |

### Should Fix

| Priority | Issue | Action |
|----------|-------|--------|
| MEDIUM | M-1 (Contracts) | Document randomness limitations |
| MEDIUM | M-2 (Node) | Add model validation/sandboxing |
| MEDIUM | M-5 (Node) | Make active_tasks atomic |

### Can Defer

- Front-running protection (H-2 Contracts) - complex, low immediate risk
- Decentralized disputes (H-3 Contracts) - governance feature
- TLS pinning (M-3 Node) - defense in depth
- P2P key persistence (L-5 Node) - convenience feature

---

## DEPENDENCY AUDIT STATUS

### Contracts
- OpenZeppelin: Latest secure version
- Solidity 0.8.24: No known vulnerabilities

### Node (from cargo-audit 2026-02-28)
- 2 vulnerabilities (in transitive deps, blocked by upstream)
- `dotenv` replaced with `dotenvy`
- See `oarn-node/security/CARGO_AUDIT_REPORT.md`

---

## CONCLUSION

The OARN codebase demonstrates good security practices overall. The critical reentrancy issue exists only in the deprecated V1 contract. For mainnet launch:

1. **Required:** Fix reward distribution failure handling
2. **Required:** Add encrypted keystore support
3. **Required:** Enforce emission caps
4. **Recommended:** Document accepted risks (randomness, centralized disputes)

The multi-node consensus mechanism has been tested and works correctly. Security posture is **acceptable for testnet** and **needs improvements for mainnet**.
