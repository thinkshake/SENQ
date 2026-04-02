/**
 * SENQ API client for frontend.
 */

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api";

// ── Types ──────────────────────────────────────────────────────────

export interface Outcome {
  id: string;
  label: string;
  probability: number;
  totalAmountWei: string;
}

export interface Market {
  id: string;
  title: string;
  description: string;
  category: string;
  categoryLabel: string;
  status: "Draft" | "Open" | "Closed" | "Resolved" | "Paid" | "Canceled" | "Stalled";
  bettingDeadline: string;
  resolutionTime: string | null;
  totalPoolWei: string;
  outcomes: Outcome[];
  resolvedOutcomeId: string | null;
  createdAt: string;
}

export interface Bet {
  id: string;
  marketId: string;
  outcomeId: string;
  outcomeLabel: string;
  bettorAddress: string;
  amountWei: string;
  weightScore: number;
  effectiveAmountWei: string;
  txHash: string | null;
  createdAt: string;
}

export interface UserBet extends Bet {
  marketTitle: string;
  currentProbability: number;
  status: "open" | "closed";
}

export interface Attribute {
  id: string;
  type: string;
  typeLabel: string;
  label: string;
  weight: number;
  verifiedAt: string;
}

export interface Category {
  value: string;
  label: string;
}

export interface Payout {
  id: string;
  marketId: string;
  marketTitle?: string;
  amountWei: string;
  status: "Pending" | "Sent" | "Failed";
  payoutTx: string | null;
  createdAt: string;
}

export interface Trade {
  id: string;
  offerTx: string;
  takerGets: string;
  takerPays: string;
  executedAt: string;
  blockNumber: number;
}

export interface ApiError {
  code: string;
  message: string;
}

// ── Helper ─────────────────────────────────────────────────────────

async function apiFetch<T>(
  path: string,
  options?: RequestInit
): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options?.headers,
    },
  });

  const json = await res.json();

  if (!res.ok) {
    const error = json.error as ApiError;
    throw new Error(error?.message || `API error: ${res.status}`);
  }

  return (json.data ?? json) as T;
}

// ── Markets ────────────────────────────────────────────────────────

export async function getMarkets(params?: {
  status?: string;
  category?: string;
}): Promise<Market[]> {
  const searchParams = new URLSearchParams();
  if (params?.status) {
    // API expects PascalCase (e.g. "Open", "Resolved")
    const s = params.status;
    searchParams.set("status", s.charAt(0).toUpperCase() + s.slice(1));
  }
  if (params?.category && params.category !== "all")
    searchParams.set("category", params.category);

  const query = searchParams.toString();
  const path = query ? `/markets?${query}` : "/markets";
  const result = await apiFetch<{ markets: Market[] } | Market[]>(path);
  return Array.isArray(result) ? result : result.markets;
}

export async function getOpenMarkets(): Promise<Market[]> {
  return getMarkets({ status: "open" });
}

export async function getMarket(id: string): Promise<Market> {
  const result = await apiFetch<Market | { market: Market }>(`/markets/${id}`);
  return "market" in result ? result.market : result;
}

// ── Bets ───────────────────────────────────────────────────────────

export interface PlaceBetResponse {
  bet: Bet;
  weightScore: number;
  effectiveAmountWei: string;
  approveTx: {
    from: string;
    to: string;
    data: string;
  } | null;
  betTx: {
    from: string;
    to: string;
    data: string;
  };
}

export async function placeBet(
  marketId: string,
  outcomeId: string,
  amountWei: string,
  bettorAddress: string,
): Promise<PlaceBetResponse> {
  return apiFetch<PlaceBetResponse>(`/markets/${marketId}/bets`, {
    method: "POST",
    body: JSON.stringify({ outcomeId, amountWei, bettorAddress }),
  });
}

export async function confirmBet(
  marketId: string,
  betId: string,
  txHash: string,
): Promise<{ betId: string; status: string }> {
  return apiFetch(`/markets/${marketId}/bets/${betId}/confirm`, {
    method: "POST",
    body: JSON.stringify({ txHash }),
  });
}

export async function getBetsForMarket(
  marketId: string,
  limit?: number,
): Promise<{ bets: Bet[] }> {
  const query = limit ? `?limit=${limit}` : "";
  return apiFetch<{ bets: Bet[] }>(`/markets/${marketId}/bets${query}`);
}

export interface BetPreview {
  potentialPayout: string;
  impliedOdds: string;
  weightScore: number;
  effectiveAmount: string;
  newProbability: number;
}

export async function previewBet(
  marketId: string,
  outcomeId: string,
  amountWei: string,
  bettorAddress?: string,
): Promise<BetPreview> {
  const params = new URLSearchParams({
    outcomeId,
    amountWei,
  });
  if (bettorAddress) params.set("bettorAddress", bettorAddress);

  return apiFetch<BetPreview>(
    `/markets/${marketId}/preview?${params.toString()}`
  );
}

// ── User Attributes ────────────────────────────────────────────────

export async function fetchUserAttributes(
  address: string,
): Promise<{ address: string; weightScore: number; attributes: Attribute[] }> {
  return apiFetch(`/users/${address}/attributes`);
}

export async function addUserAttribute(
  address: string,
  attribute: { type: string; label: string; weight: number },
): Promise<Attribute> {
  return apiFetch<Attribute>(`/users/${address}/attributes`, {
    method: "POST",
    body: JSON.stringify(attribute),
  });
}

export async function removeUserAttribute(
  address: string,
  attributeId: string,
): Promise<void> {
  await apiFetch(`/users/${address}/attributes/${attributeId}`, {
    method: "DELETE",
  });
}

// ── User Bets (Portfolio) ──────────────────────────────────────────

export async function fetchUserBets(
  address: string,
  status?: string,
): Promise<{ bets: UserBet[]; totalBets: number; totalAmountWei: string }> {
  const query = status ? `?status=${status}` : "";
  return apiFetch(`/users/${address}/bets${query}`);
}

// ── Categories ─────────────────────────────────────────────────────

export async function fetchCategories(): Promise<{ categories: Category[] }> {
  return apiFetch<{ categories: Category[] }>("/categories");
}

// ── Trades ─────────────────────────────────────────────────────────

export interface TradesResponse {
  trades: Trade[];
  stats: {
    tradeCount: number;
    volumeWei: string;
  };
}

export async function getTradesForMarket(
  marketId: string,
): Promise<TradesResponse> {
  return apiFetch<TradesResponse>(`/markets/${marketId}/trades`);
}

// ── Payouts ────────────────────────────────────────────────────────

export async function getPayoutsForMarket(marketId: string): Promise<{
  payouts: Payout[];
  stats: {
    total: number;
    pending: number;
    sent: number;
    failed: number;
    totalWei: string;
    sentWei: string;
  };
}> {
  return apiFetch(`/markets/${marketId}/payouts`);
}

export async function getPayoutsForUser(address: string): Promise<Payout[]> {
  return apiFetch<Payout[]>(`/users/${address}/payouts`);
}

export interface ClaimTxResponse {
  payoutId: string;
  amountWei: string;
  status: string;
  claimTx: { from: string; to: string; data: string };
}

export async function getClaimTx(marketId: string, address: string): Promise<ClaimTxResponse> {
  return apiFetch<ClaimTxResponse>(`/markets/${marketId}/claim-tx?address=${address}`);
}

// ── Admin ─────────────────────────────────────────────────────────

function adminHeaders(adminKey: string): HeadersInit {
  return { "X-Admin-Key": adminKey };
}

export async function adminGetMarkets(adminKey: string): Promise<Market[]> {
  const result = await apiFetch<{ markets: Market[] } | Market[]>("/markets", {
    headers: adminHeaders(adminKey),
  });
  return Array.isArray(result) ? result : result.markets;
}

export async function adminCreateMarket(
  adminKey: string,
  body: {
    title: string;
    description: string;
    category?: string;
    categoryLabel?: string;
    bettingDeadline: string;
    outcomes: { label: string }[];
  },
): Promise<Market> {
  return apiFetch<Market>("/markets", {
    method: "POST",
    headers: adminHeaders(adminKey),
    body: JSON.stringify(body),
  });
}

export async function adminCloseMarket(
  adminKey: string,
  marketId: string,
): Promise<{ id: string; status: string }> {
  return apiFetch(`/markets/${marketId}/close`, {
    method: "POST",
    headers: adminHeaders(adminKey),
  });
}

export async function adminResolveMarket(
  adminKey: string,
  marketId: string,
  outcomeId: string,
): Promise<{ id: string; status: string; resolvedOutcomeId: string }> {
  return apiFetch(`/markets/${marketId}/resolve`, {
    method: "POST",
    headers: adminHeaders(adminKey),
    body: JSON.stringify({ outcomeId }),
  });
}

// ── Allowance ─────────────────────────────────────────────────────

export async function fetchAllowance(address: string): Promise<string> {
  const result = await apiFetch<{ allowance: string }>(`/allowance/${address}`);
  return result.allowance;
}

// ── Formatting Helpers ─────────────────────────────────────────────

const JPYC_DECIMALS = parseInt(process.env.NEXT_PUBLIC_JPYC_DECIMALS || "18", 10);

export function weiToJpyc(wei: string | number): number {
  return Number(wei) / 10 ** JPYC_DECIMALS;
}

export function jpycToWei(jpyc: number): string {
  return (BigInt(Math.floor(jpyc)) * 10n ** BigInt(JPYC_DECIMALS)).toString();
}

export function formatJpyc(wei: string | number): string {
  const jpyc = weiToJpyc(wei);
  if (jpyc === 0) return "0 JPYC";
  return `${Math.floor(jpyc).toLocaleString("ja-JP")} JPYC`;
}

export function formatJpycCompact(wei: string | number): string {
  const jpyc = weiToJpyc(wei);
  if (jpyc >= 1_000_000) return `${(jpyc / 1_000_000).toFixed(1)}M JPYC`;
  if (jpyc >= 1000) return `${(jpyc / 1000).toFixed(1)}K JPYC`;
  return `${Math.floor(jpyc).toLocaleString("ja-JP")} JPYC`;
}

export function formatDeadline(deadline: string): string {
  const date = new Date(deadline);
  const now = new Date();
  const diff = date.getTime() - now.getTime();

  if (diff <= 0) {
    return "締切";
  }

  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

  if (days > 0) {
    return `残り${days}日${hours}時間`;
  }
  if (hours > 0) {
    return `残り${hours}時間`;
  }

  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  return `残り${minutes}分`;
}
