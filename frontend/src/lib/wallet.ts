// Ví trình duyệt (ethers v6): khóa sinh ngẫu nhiên, lưu sessionStorage, ký tx thô theo chain_id.
// Backend (/api/chain/{name}/send_raw) tự kiểm chain_id trước khi đưa vào py-evm.
import { Wallet, parseEther, type TransactionRequest } from "ethers";
import { apiGet, apiPost } from "./api";
import type { TxSummary } from "./types";

const KEY = "xchain-demo-wallet";

export function loadWallet(): Wallet {
  try {
    const pk = sessionStorage.getItem(KEY);
    if (pk) return new Wallet(pk);
  } catch {
    /* storage bị chặn */
  }
  const w = Wallet.createRandom();
  try {
    sessionStorage.setItem(KEY, w.privateKey);
  } catch {
    /* bỏ qua */
  }
  return new Wallet(w.privateKey);
}

export function resetWallet(): Wallet {
  try {
    sessionStorage.removeItem(KEY);
  } catch {
    /* bỏ qua */
  }
  return loadWallet();
}

export async function signTransfer(w: Wallet, chainId: number, to: string, eth: string, nonce: number): Promise<string> {
  const tx: TransactionRequest = {
    to,
    value: parseEther(eth),
    gasLimit: 21000n,
    maxFeePerGas: 5_000_000_000n,
    maxPriorityFeePerGas: 1n,
    nonce,
    chainId: BigInt(chainId),
    type: 2,
  };
  return w.signTransaction(tx);
}

export const faucet = (chain: string, address: string, eth = 1) =>
  apiPost<TxSummary>(`/api/chain/${chain}/faucet`, { address, eth });

export const sendRaw = (chain: string, raw: string) => apiPost<TxSummary>(`/api/chain/${chain}/send_raw`, { raw });

export const account = (chain: string, address: string) =>
  apiGet<{ address: string; wei: string; nonce: number }>(`/api/chain/${chain}/balance/${address}`);
