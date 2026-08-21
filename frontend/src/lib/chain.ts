import { BrowserProvider, Contract, JsonRpcProvider, type Eip1193Provider } from "ethers";

/**
 * Target network configuration.
 *
 * Defaults to the local Hardhat node (chain id 31337) because that is what the
 * backend reads transaction receipts from (see backend/.env RPC_URL). The
 * frontend and backend MUST agree on the chain, otherwise a wallet-signed
 * transaction lands on one chain while the backend looks for its receipt on
 * another and registration fails with "Transaction receipt not found".
 */
export const TARGET_CHAIN_ID = Number(process.env.NEXT_PUBLIC_CHAIN_ID || 31337);
export const TARGET_CHAIN_HEX = `0x${TARGET_CHAIN_ID.toString(16)}`;
export const TARGET_RPC_URL = process.env.NEXT_PUBLIC_RPC_URL || "http://127.0.0.1:8545";

type ChainPreset = {
  chainName: string;
  nativeCurrency: { name: string; symbol: string; decimals: number };
  rpcUrls: string[];
  blockExplorerUrls?: string[];
};

const CHAIN_PRESETS: Record<number, ChainPreset> = {
  31337: {
    chainName: "Hardhat Localhost 8545",
    nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
    rpcUrls: [TARGET_RPC_URL],
  },
  11155111: {
    chainName: "Sepolia",
    nativeCurrency: { name: "Sepolia Ether", symbol: "ETH", decimals: 18 },
    rpcUrls: [TARGET_RPC_URL || "https://rpc.sepolia.org"],
    blockExplorerUrls: ["https://sepolia.etherscan.io"],
  },
};

export function getTargetChainName() {
  return (
    process.env.NEXT_PUBLIC_CHAIN_NAME ||
    CHAIN_PRESETS[TARGET_CHAIN_ID]?.chainName ||
    `Chain ${TARGET_CHAIN_ID}`
  );
}

export function getExplorerTxUrl(txHash: string) {
  const base = CHAIN_PRESETS[TARGET_CHAIN_ID]?.blockExplorerUrls?.[0];
  return base && txHash ? `${base}/tx/${txHash}` : "";
}

// Kept for backwards compatibility with existing imports.
export const SEPOLIA_CHAIN_ID = 11155111;
export const SEPOLIA_CHAIN_HEX = "0xaa36a7";

const REGISTRY_ADDRESS =
  process.env.NEXT_PUBLIC_REGISTRY_CONTRACT_ADDRESS ||
  process.env.NEXT_PUBLIC_EVIDENCE_REGISTRY_ADDRESS ||
  "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512";

export const EVIDENCE_REGISTRY_ABI = [
  "function registerEvidence(string evidenceId,string caseId,string fileHash,string ipfsCid) external",
  "function transferCustody(string evidenceId,address newCustodian) external",
  "function getEvidence(string evidenceId) external view returns (string evidenceId,string caseId,string fileHash,string ipfsCid,address creatorWallet,address currentCustodian,uint8 status,uint256 registeredAt,bool exists)",
  "function getCustodyHistory(string evidenceId) external view returns (tuple(address from,address to,uint256 timestamp,string action,uint8 statusAtTransfer)[])",
  "event EvidenceRegistered(string indexed evidenceId,string caseId,string fileHash,string ipfsCid,address indexed creatorWallet,uint256 timestamp)",
  "event CustodyTransferred(string indexed evidenceId,address indexed previousCustodian,address indexed newCustodian,uint256 timestamp)",
];

export function getRegistryAddress() {
  return REGISTRY_ADDRESS;
}

/* -------------------------------------------------------------------------- */
/* Provider discovery                                                          */
/* -------------------------------------------------------------------------- */

type InjectedProvider = Eip1193Provider & {
  isMetaMask?: boolean;
  providers?: InjectedProvider[];
  on?: (event: string, handler: (...args: any[]) => void) => void;
  removeListener?: (event: string, handler: (...args: any[]) => void) => void;
};

/**
 * Picks the MetaMask provider specifically.
 *
 * When several wallet extensions are installed they fight over `window.ethereum`;
 * the losers still expose themselves through `window.ethereum.providers`. Without
 * this, "Connect Wallet" can silently drive Coinbase Wallet / Phantom instead of
 * MetaMask, or fail outright.
 */
function selectMetaMaskProvider(candidate: InjectedProvider | undefined): InjectedProvider | null {
  if (!candidate) return null;

  if (Array.isArray(candidate.providers) && candidate.providers.length > 0) {
    const metaMask = candidate.providers.find((entry) => entry?.isMetaMask);
    return metaMask || candidate.providers[0] || candidate;
  }

  return candidate;
}

function readInjectedProvider(): InjectedProvider | null {
  if (typeof window === "undefined") return null;
  return selectMetaMaskProvider((window as Window & { ethereum?: InjectedProvider }).ethereum);
}

export function isMetaMaskAvailable() {
  return Boolean(readInjectedProvider());
}

export function getEthereumProvider(): InjectedProvider {
  const provider = readInjectedProvider();

  if (!provider) {
    throw new Error(
      "MetaMask was not detected in this browser. Install the MetaMask extension and reload the page.",
    );
  }

  return provider;
}

/**
 * Waits for the wallet to inject itself.
 *
 * Extensions inject `window.ethereum` asynchronously, often *after* React has
 * already hydrated. Reading it once on mount is a race: lose it and the UI
 * decides MetaMask is not installed and disables the connect button forever.
 */
export function waitForEthereumProvider(timeoutMs = 3000): Promise<InjectedProvider | null> {
  if (typeof window === "undefined") return Promise.resolve(null);

  const existing = readInjectedProvider();
  if (existing) return Promise.resolve(existing);

  return new Promise((resolve) => {
    let settled = false;

    const finish = (provider: InjectedProvider | null) => {
      if (settled) return;
      settled = true;
      window.removeEventListener("ethereum#initialized", onInitialized);
      window.clearInterval(pollId);
      window.clearTimeout(timeoutId);
      resolve(provider);
    };

    const onInitialized = () => finish(readInjectedProvider());

    // MetaMask dispatches this once it finishes injecting.
    window.addEventListener("ethereum#initialized", onInitialized, { once: true });

    // Belt and braces for wallets that never dispatch the event.
    const pollId = window.setInterval(() => {
      const provider = readInjectedProvider();
      if (provider) finish(provider);
    }, 150);

    const timeoutId = window.setTimeout(() => finish(readInjectedProvider()), timeoutMs);
  });
}

export async function getBrowserProvider() {
  return new BrowserProvider(getEthereumProvider());
}

/** Read-only provider that works even when no wallet is connected. */
export function getFallbackRpcProvider() {
  return new JsonRpcProvider(TARGET_RPC_URL, TARGET_CHAIN_ID);
}

/* -------------------------------------------------------------------------- */
/* Error normalisation                                                         */
/* -------------------------------------------------------------------------- */

function extractProviderCode(error: any): number | undefined {
  const candidates = [
    error?.code,
    error?.data?.originalError?.code,
    error?.error?.code,
    error?.info?.error?.code,
  ];

  for (const candidate of candidates) {
    if (typeof candidate === "number") return candidate;
  }

  return undefined;
}

function extractRevertReason(error: any): string {
  return (
    error?.revert?.args?.[0] ||
    error?.reason ||
    error?.shortMessage ||
    error?.info?.error?.message ||
    error?.data?.message ||
    ""
  );
}

/** Turns raw MetaMask / ethers errors into something a user can act on. */
export function describeWalletError(error: any): string {
  const code = extractProviderCode(error);

  if (code === 4001 || error?.code === "ACTION_REJECTED") {
    return "You rejected the request in MetaMask.";
  }
  if (code === -32002) {
    return (
      "MetaMask already has an unanswered connection request queued from an earlier attempt. " +
      "Click the MetaMask extension icon in your toolbar and approve or reject the prompt shown there. " +
      "If no prompt appears, close any detached MetaMask popup window, or disable and re-enable the " +
      "MetaMask extension, then reload this page."
    );
  }
  if (code === 4900 || code === 4901) {
    return "MetaMask is not connected to any network. Unlock MetaMask and try again.";
  }
  if (code === -32603) {
    return "MetaMask could not reach the network. Make sure the Hardhat node is running (npx hardhat node).";
  }
  if (error?.code === "INSUFFICIENT_FUNDS") {
    return "This wallet has no ETH for gas. Fund it with: node scripts/fund-wallet.js <your address>";
  }
  if (error?.code === "NONCE_EXPIRED" || /nonce too (high|low)/i.test(String(error?.message))) {
    return "MetaMask's cached nonce is stale after a node restart. In MetaMask: Settings > Advanced > Clear activity tab data, then retry.";
  }

  const reason = extractRevertReason(error);
  if (reason) {
    if (/already registered/i.test(reason)) {
      return "This evidence ID is already registered on-chain. Registering again is not allowed.";
    }
    if (/Only current custodian/i.test(reason)) {
      return "Only the wallet that currently holds this evidence can transfer it.";
    }
    if (/Evidence not found/i.test(reason)) {
      return "This evidence record does not exist on the current chain. It may have been registered against an earlier node instance.";
    }
    return reason;
  }

  return error?.message || "MetaMask request failed.";
}

/**
 * Wraps a provider error in a readable Error while keeping the original numeric
 * code reachable, so diagnostics can still report it.
 */
export function asWalletError(error: any): Error & { code?: number | string; cause?: unknown } {
  const wrapped = new Error(describeWalletError(error)) as Error & {
    code?: number | string;
    cause?: unknown;
  };

  wrapped.code = extractProviderCode(error) ?? error?.code;
  wrapped.cause = error;
  return wrapped;
}

/* -------------------------------------------------------------------------- */
/* Connection + network management                                             */
/* -------------------------------------------------------------------------- */

/**
 * MetaMask queues `eth_requestAccounts` and rejects every later call with
 * -32002 until the queued prompt is answered. Firing a second request while one
 * is in flight therefore makes the jam worse, so share a single promise.
 */
let inFlightConnect: Promise<{ address: string; chainId: number; provider: BrowserProvider }> | null =
  null;

export function connectWallet() {
  if (!inFlightConnect) {
    inFlightConnect = performConnect().finally(() => {
      inFlightConnect = null;
    });
  }

  return inFlightConnect;
}

async function performConnect() {
  const ethereum = await waitForEthereumProvider();

  if (!ethereum) {
    throw new Error(
      "MetaMask was not detected in this browser. Install the MetaMask extension and reload the page.",
    );
  }

  let accounts: string[] = [];

  // If this site was already approved, the accounts are readable without a
  // prompt — which also sidesteps a stuck -32002 queue entirely.
  try {
    accounts = ((await ethereum.request({ method: "eth_accounts" })) as string[]) || [];
  } catch {
    accounts = [];
  }

  if (accounts.length === 0) {
    try {
      accounts = (await ethereum.request({ method: "eth_requestAccounts" })) as string[];
    } catch (error) {
      if (extractProviderCode(error) !== -32002) {
        throw asWalletError(error);
      }

      // A prompt is already stranded in MetaMask's queue. `wallet_requestPermissions`
      // drives the same approval flow through a different RPC method, which in
      // several MetaMask builds re-surfaces the orphaned prompt rather than
      // queueing behind it. If it also fails, the user must clear it by hand.
      try {
        await ethereum.request({
          method: "wallet_requestPermissions",
          params: [{ eth_accounts: {} }],
        } as any);

        accounts = ((await ethereum.request({ method: "eth_accounts" })) as string[]) || [];
      } catch {
        throw asWalletError(error);
      }

      if (accounts.length === 0) {
        throw asWalletError(error);
      }
    }
  }

  if (!accounts || accounts.length === 0) {
    throw new Error(
      "MetaMask returned no accounts. Unlock the extension (enter your password) and try again.",
    );
  }

  // Put the wallet on the right chain immediately, so the user is not surprised
  // by a network switch at signing time.
  let chainId = TARGET_CHAIN_ID;
  try {
    const provider = await ensureTargetNetwork();
    chainId = Number((await provider.getNetwork()).chainId);
  } catch {
    const raw = (await ethereum.request({ method: "eth_chainId" })) as string;
    chainId = Number.parseInt(raw, 16);
  }

  return {
    address: accounts[0],
    chainId,
    provider: new BrowserProvider(ethereum),
  };
}

/**
 * Ensures MetaMask is pointed at the configured chain, adding the network if
 * MetaMask does not know about it yet (error 4902 — the usual outcome for a
 * local Hardhat node, whose built-in MetaMask entry uses chain id 1337 rather
 * than Hardhat's 31337).
 */
export async function ensureTargetNetwork() {
  const ethereum = getEthereumProvider();

  const currentHex = (await ethereum.request({ method: "eth_chainId" })) as string;
  if (Number.parseInt(currentHex, 16) === TARGET_CHAIN_ID) {
    return new BrowserProvider(ethereum);
  }

  try {
    await ethereum.request({
      method: "wallet_switchEthereumChain",
      params: [{ chainId: TARGET_CHAIN_HEX }],
    });
  } catch (error) {
    const code = extractProviderCode(error);

    if (code === 4902 || code === -32603) {
      const preset = CHAIN_PRESETS[TARGET_CHAIN_ID];

      if (!preset) {
        throw new Error(
          `${getTargetChainName()} (chain id ${TARGET_CHAIN_ID}) is not configured in MetaMask. Add it manually with RPC ${TARGET_RPC_URL}.`,
        );
      }

      try {
        await ethereum.request({
          method: "wallet_addEthereumChain",
          params: [{ chainId: TARGET_CHAIN_HEX, ...preset }],
        });
      } catch (addError) {
        throw new Error(
          `Could not add ${preset.chainName} to MetaMask: ${describeWalletError(addError)}`,
        );
      }
    } else {
      throw asWalletError(error);
    }
  }

  // MetaMask can resolve the switch before it has actually applied it.
  const provider = new BrowserProvider(ethereum);
  const network = await provider.getNetwork();

  if (Number(network.chainId) !== TARGET_CHAIN_ID) {
    throw new Error(
      `MetaMask is on chain ${network.chainId} but this app needs ${getTargetChainName()} (${TARGET_CHAIN_ID}). Switch networks in MetaMask and try again.`,
    );
  }

  return provider;
}

/** Backwards-compatible alias; now honours NEXT_PUBLIC_CHAIN_ID. */
export const ensureSepoliaNetwork = ensureTargetNetwork;

/**
 * Fails fast with a readable message when the registry is missing from the
 * chain the wallet is on — otherwise ethers reports an opaque decoding error.
 */
async function assertRegistryDeployed(provider: BrowserProvider) {
  const code = await provider.getCode(REGISTRY_ADDRESS);

  if (!code || code === "0x") {
    throw new Error(
      `No EvidenceRegistry contract found at ${REGISTRY_ADDRESS} on ${getTargetChainName()}. Redeploy with "npx hardhat run scripts/deploy.ts --network localhost" and update NEXT_PUBLIC_REGISTRY_CONTRACT_ADDRESS.`,
    );
  }
}

export async function getRegistryContract() {
  const provider = await ensureTargetNetwork();
  await assertRegistryDeployed(provider);
  const signer = await provider.getSigner();
  return new Contract(REGISTRY_ADDRESS, EVIDENCE_REGISTRY_ABI, signer);
}

/** Read-only registry access. Falls back to the RPC URL when no wallet is present. */
export async function getRegistryReadContract() {
  try {
    const ethereum = readInjectedProvider();

    if (ethereum) {
      const provider = new BrowserProvider(ethereum);
      const network = await provider.getNetwork();

      if (Number(network.chainId) === TARGET_CHAIN_ID) {
        return new Contract(REGISTRY_ADDRESS, EVIDENCE_REGISTRY_ABI, provider);
      }
    }
  } catch {
    // fall through to the direct RPC provider
  }

  return new Contract(REGISTRY_ADDRESS, EVIDENCE_REGISTRY_ABI, getFallbackRpcProvider());
}

/* -------------------------------------------------------------------------- */
/* Transactions                                                                */
/* -------------------------------------------------------------------------- */

export async function sendWalletSignedTransfer(evidenceId: string, newCustodian: string) {
  try {
    const contract = await getRegistryContract();
    const tx = await contract.transferCustody(evidenceId, newCustodian);
    const receipt = await tx.wait();

    return {
      txHash: receipt.hash || receipt.transactionHash,
      blockNumber: Number(receipt.blockNumber || 0),
    };
  } catch (error) {
    throw asWalletError(error);
  }
}

export async function sendWalletSignedRegistration(
  evidenceId: string,
  caseId: string,
  fileHash: string,
  ipfsCid: string,
) {
  try {
    const contract = await getRegistryContract();
    const tx = await contract.registerEvidence(evidenceId, caseId, fileHash, ipfsCid);
    const receipt = await tx.wait();

    return {
      txHash: receipt.hash || receipt.transactionHash,
      blockNumber: Number(receipt.blockNumber || 0),
    };
  } catch (error) {
    throw asWalletError(error);
  }
}
