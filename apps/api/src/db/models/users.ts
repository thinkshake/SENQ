/**
 * DB model for the users table.
 */
import { getDb, generateId } from "../index";

// ── Types ──────────────────────────────────────────────────────────

export interface User {
  id: string;
  wallet_address: string;
  provider: string;
  created_at: string;
  updated_at: string;
}

// ── Queries ────────────────────────────────────────────────────────

/**
 * Get a user by ID.
 */
export function getUserById(id: string): User | null {
  const db = getDb();
  return db.query("SELECT * FROM users WHERE id = ?").get(id) as User | null;
}

/**
 * Get a user by wallet address.
 */
export function getUserByWallet(address: string): User | null {
  const db = getDb();
  return db.query("SELECT * FROM users WHERE wallet_address = ?").get(address) as User | null;
}

/**
 * Create a new user.
 */
export function createUser(walletAddress: string, provider: string = "metamask"): User {
  const db = getDb();
  const id = generateId("usr");

  db.query(
    `INSERT INTO users (id, wallet_address, provider) VALUES (?, ?, ?)`
  ).run(id, walletAddress, provider);

  return getUserById(id)!;
}

/**
 * Get or create a user by wallet address.
 * Returns existing user if found, otherwise creates a new one.
 */
export function getOrCreateUser(walletAddress: string, provider: string = "metamask"): User {
  const existing = getUserByWallet(walletAddress);
  if (existing) {
    return existing;
  }
  return createUser(walletAddress, provider);
}
