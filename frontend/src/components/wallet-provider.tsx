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
import { connectWallet as connectMetaMaskWallet, getEthereumProvider, isMetaMaskAvailable } from "@/lib/chain";

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
  connectWallet: () => Promise<void>;
  disconnectWallet: () => Promise<void>;
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

  const refreshWalletState = useCallback(async () => {
    if (!isMetaMaskAvailable()) {
      setInstalled(false);
      setLoading(false);
      return;
    }

    try {
      setInstalled(true);
      const ethereum = getEthereumProvider();
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

      if (user?.email && nextAddress) {
        const nextLinked = await fetchLinkedWallet(user.email);
        setLinkedAddress(nextLinked || nextAddress);
      } else if (user?.email) {
        const nextLinked = await fetchLinkedWallet(user.email);
        setLinkedAddress(nextLinked);
      }
    } catch (error) {
      console.error("Unable to refresh wallet state:", error);
    } finally {
      setLoading(false);
    }
  }, [user?.email]);

  useEffect(() => {
    void refreshWalletState();
  }, [refreshWalletState]);

  useEffect(() => {
    if (!isMetaMaskAvailable()) return;

    const ethereum = getEthereumProvider();

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
          .then(() => fetchLinkedWallet(user.email))
          .then((walletAddress) => setLinkedAddress(walletAddress || nextAddress))
          .catch((error) => console.error("Wallet sync failed:", error));
      }
    };

    const handleChainChanged = (hexChainId: string) => {
      setChainId(Number.parseInt(hexChainId, 16));
    };

    ethereum.on("accountsChanged", handleAccountsChanged);
    ethereum.on("chainChanged", handleChainChanged);

    return () => {
      ethereum.removeListener("accountsChanged", handleAccountsChanged);
      ethereum.removeListener("chainChanged", handleChainChanged);
    };
  }, [user?.email]);

  const connectWallet = useCallback(async () => {
    if (!isMetaMaskAvailable()) {
      throw new Error("MetaMask is not installed.");
    }

    setConnecting(true);
    try {
      const { address, chainId: nextChainId } = await connectMetaMaskWallet();
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
    } finally {
      setConnecting(false);
    }
  }, [user?.email]);

  const disconnectWallet = useCallback(async () => {
    setDisconnecting(true);
    try {
      setConnectedAddress("");
      setChainId(null);
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
      isLinked: Boolean(linkedAddress && connectedAddress && linkedAddress.toLowerCase() === connectedAddress.toLowerCase()),
      connectWallet,
      disconnectWallet,
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
      connectWallet,
      disconnectWallet,
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
