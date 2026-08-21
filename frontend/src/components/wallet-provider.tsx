"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useAuth } from "@/components/auth-provider";
import {
  connectWallet as connectMetaMaskWallet,
  describeWalletError,
  ensureTargetNetwork,
  getEthereumProvider,
  getTargetChainName,
  isMetaMaskAvailable,
  TARGET_CHAIN_ID,
  waitForEthereumProvider,
} from "@/lib/chain";

type WalletContextValue = {
  installed: boolean;
  connectedAddress: string;
  linkedAddress: string;
  chainId: number | null;
  loading: boolean;
  connecting: boolean;
  disconnecting: boolean;
  isConnected: boolean;
  isLinked: boolean;
  isOnTargetChain: boolean;
  targetChainId: number;
  targetChainName: string;
  error: string;
  clearError: () => void;
  connectWallet: () => Promise<void>;
  disconnectWallet: () => Promise<void>;
  switchToTargetChain: () => Promise<void>;
  refreshWalletState: () => Promise<void>;
};

const WalletContext = createContext<WalletContextValue | undefined>(undefined);

function abbreviateAddress(address: string) {
  return address ? `${address.slice(0, 6)}...${address.slice(-4)}` : "";
}

async function linkWalletToUser(email: string, walletAddress: string) {
  await fetch("/api/wallet/link", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-user-email": email,
    },
    body: JSON.stringify({ walletAddress }),
  });
}

async function fetchLinkedWallet(email: string) {
  const response = await fetch("/api/wallet/me", {
    headers: {
      "x-user-email": email,
    },
  });

  if (!response.ok) {
    return "";
  }

  const data = (await response.json()) as { walletAddress?: string };
  return data.walletAddress || "";
}

export function WalletProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [installed, setInstalled] = useState(false);
  const [connectedAddress, setConnectedAddress] = useState("");
  const [linkedAddress, setLinkedAddress] = useState("");
  const [chainId, setChainId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState(false);
  const [disconnecting, setDisconnecting] = useState(false);
  const [error, setError] = useState("");

  const clearError = useCallback(() => setError(""), []);

  const refreshWalletState = useCallback(async () => {
    // Wallet extensions inject asynchronously, so wait rather than reading once.
    const ethereum = await waitForEthereumProvider();

    if (!ethereum) {
      setInstalled(false);
      setLoading(false);
      return;
    }

    try {
      setInstalled(true);

      const [accounts, chain] = await Promise.all([
        ethereum.request({ method: "eth_accounts" }) as Promise<string[]>,
        ethereum.request({ method: "eth_chainId" }) as Promise<string>,
      ]);

      const nextAddress = accounts?.[0] || "";
      setConnectedAddress(nextAddress);
      setChainId(Number.parseInt(chain, 16));

      if (typeof window !== "undefined" && nextAddress) {
        window.localStorage.setItem("wallet:last-address", nextAddress);
      }

      if (user?.email) {
        const nextLinked = await fetchLinkedWallet(user.email);
        setLinkedAddress(nextLinked || nextAddress);
      }
    } catch (caughtError) {
      console.error("Unable to refresh wallet state:", caughtError);
    } finally {
      setLoading(false);
    }
  }, [user?.email]);

  useEffect(() => {
    void refreshWalletState();
  }, [refreshWalletState]);

  useEffect(() => {
    let cancelled = false;
    let cleanup: (() => void) | undefined;

    void waitForEthereumProvider().then((ethereum) => {
      if (cancelled || !ethereum?.on) return;

      setInstalled(true);

      const handleAccountsChanged = (accounts: string[]) => {
        const nextAddress = accounts?.[0] || "";
        setConnectedAddress(nextAddress);

        if (typeof window !== "undefined") {
          if (nextAddress) {
            window.localStorage.setItem("wallet:last-address", nextAddress);
          } else {
            window.localStorage.removeItem("wallet:last-address");
          }
        }

        if (user?.email && nextAddress) {
          void linkWalletToUser(user.email, nextAddress)
            .then(() => fetchLinkedWallet(user.email as string))
            .then((walletAddress) => setLinkedAddress(walletAddress || nextAddress))
            .catch((caughtError) => console.error("Wallet sync failed:", caughtError));
        }
      };

      const handleChainChanged = (hexChainId: string) => {
        setChainId(Number.parseInt(hexChainId, 16));
        setError("");
      };

      ethereum.on("accountsChanged", handleAccountsChanged);
      ethereum.on("chainChanged", handleChainChanged);

      cleanup = () => {
        ethereum.removeListener?.("accountsChanged", handleAccountsChanged);
        ethereum.removeListener?.("chainChanged", handleChainChanged);
      };
    });

    return () => {
      cancelled = true;
      cleanup?.();
    };
  }, [user?.email]);

  const connectWallet = useCallback(async () => {
    setConnecting(true);
    setError("");

    try {
      const { address, chainId: nextChainId } = await connectMetaMaskWallet();
      setInstalled(true);
      setConnectedAddress(address);
      setChainId(nextChainId);

      if (typeof window !== "undefined") {
        window.localStorage.setItem("wallet:last-address", address);
      }

      if (user?.email) {
        await linkWalletToUser(user.email, address);
        const nextLinked = await fetchLinkedWallet(user.email);
        setLinkedAddress(nextLinked || address);
      } else {
        setLinkedAddress(address);
      }
    } catch (caughtError: any) {
      const message = describeWalletError(caughtError);
      setError(message);
      throw new Error(message);
    } finally {
      setConnecting(false);
    }
  }, [user?.email]);

  const switchToTargetChain = useCallback(async () => {
    setError("");

    try {
      const provider = await ensureTargetNetwork();
      setChainId(Number((await provider.getNetwork()).chainId));
    } catch (caughtError: any) {
      const message = describeWalletError(caughtError);
      setError(message);
      throw new Error(message);
    }
  }, []);

  const disconnectWallet = useCallback(async () => {
    setDisconnecting(true);

    try {
      // Ask MetaMask to forget the approval so the next connect re-prompts.
      // Unsupported on older builds, so failure here is not an error.
      if (isMetaMaskAvailable()) {
        try {
          await getEthereumProvider().request({
            method: "wallet_revokePermissions",
            params: [{ eth_accounts: {} }],
          } as any);
        } catch {
          /* older MetaMask builds do not implement this */
        }
      }

      setConnectedAddress("");
      setChainId(null);
      setError("");

      if (typeof window !== "undefined") {
        window.localStorage.removeItem("wallet:last-address");
      }
    } finally {
      setDisconnecting(false);
    }
  }, []);

  const value = useMemo<WalletContextValue>(
    () => ({
      installed,
      connectedAddress,
      linkedAddress,
      chainId,
      loading,
      connecting,
      disconnecting,
      isConnected: Boolean(connectedAddress),
      isLinked: Boolean(
        linkedAddress &&
          connectedAddress &&
          linkedAddress.toLowerCase() === connectedAddress.toLowerCase(),
      ),
      isOnTargetChain: chainId === TARGET_CHAIN_ID,
      targetChainId: TARGET_CHAIN_ID,
      targetChainName: getTargetChainName(),
      error,
      clearError,
      connectWallet,
      disconnectWallet,
      switchToTargetChain,
      refreshWalletState,
    }),
    [
      installed,
      connectedAddress,
      linkedAddress,
      chainId,
      loading,
      connecting,
      disconnecting,
      error,
      clearError,
      connectWallet,
      disconnectWallet,
      switchToTargetChain,
      refreshWalletState,
    ],
  );

  return <WalletContext.Provider value={value}>{children}</WalletContext.Provider>;
}

export function useWallet() {
  const context = useContext(WalletContext);
  if (!context) {
    throw new Error("useWallet must be used within a WalletProvider");
  }

  return context;
}

export function abbreviateWalletAddress(address: string) {
  return abbreviateAddress(address);
}
