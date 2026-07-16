import { BrowserProvider, Contract, type Eip1193Provider } from "ethers";

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

export function isMetaMaskAvailable() {
  return typeof window !== "undefined" && Boolean((window as Window & { ethereum?: Eip1193Provider }).ethereum);
}

export function getEthereumProvider() {
  if (!isMetaMaskAvailable()) {
    throw new Error("MetaMask is not installed.");
  }

  return (window as Window & { ethereum: Eip1193Provider }).ethereum;
}

export async function getBrowserProvider() {
  return new BrowserProvider(getEthereumProvider());
}

export async function connectWallet() {
  const ethereum = getEthereumProvider();
  const accounts = (await ethereum.request({ method: "eth_requestAccounts" })) as string[];

  if (!accounts || accounts.length === 0) {
    throw new Error("No wallet account was returned by MetaMask.");
  }

  const provider = await getBrowserProvider();
  const network = await provider.getNetwork();
  return {
    address: accounts[0],
    chainId: Number(network.chainId),
    provider,
  };
}

export async function ensureSepoliaNetwork() {
  const ethereum = getEthereumProvider();
  const provider = await getBrowserProvider();
  const network = await provider.getNetwork();

  if (Number(network.chainId) === SEPOLIA_CHAIN_ID) {
    return provider;
  }

  try {
    await ethereum.request({
      method: "wallet_switchEthereumChain",
      params: [{ chainId: SEPOLIA_CHAIN_HEX }],
    });
  } catch (error: any) {
    if (error?.code === 4902) {
      throw new Error("Sepolia network is not available in MetaMask. Please add it first.");
    }
    if (error?.code === 4001) {
      throw new Error("Network switch was rejected in MetaMask.");
    }
    throw error;
  }

  return provider;
}

export async function getRegistryContract() {
  const provider = await ensureSepoliaNetwork();
  const signer = await provider.getSigner();
  return new Contract(REGISTRY_ADDRESS, EVIDENCE_REGISTRY_ABI, signer);
}

export async function getRegistryReadContract() {
  const provider = await getBrowserProvider();
  return new Contract(REGISTRY_ADDRESS, EVIDENCE_REGISTRY_ABI, provider);
}

export async function sendWalletSignedTransfer(evidenceId: string, newCustodian: string) {
  const contract = await getRegistryContract();
  const tx = await contract.transferCustody(evidenceId, newCustodian);
  const receipt = await tx.wait();

  return {
    txHash: receipt.hash || receipt.transactionHash,
    blockNumber: Number(receipt.blockNumber || 0),
  };
}

export async function sendWalletSignedRegistration(
  evidenceId: string,
  caseId: string,
  fileHash: string,
  ipfsCid: string,
) {
  const contract = await getRegistryContract();
  const tx = await contract.registerEvidence(evidenceId, caseId, fileHash, ipfsCid);
  const receipt = await tx.wait();

  return {
    txHash: receipt.hash || receipt.transactionHash,
    blockNumber: Number(receipt.blockNumber || 0),
  };
}
