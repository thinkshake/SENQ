/**
 * Seed script — inserts demo markets, outcomes, and sample user attributes.
 *
 * Usage:
 *   bun run apps/api/src/db/seed.ts
 */
import { initDatabase, closeDatabase, getDb, generateId } from "./index";
import { createMarketWithOutcomes } from "./models/markets";
import { addAttribute } from "./models/user-attributes";

// ── Demo data (from apps/mock/lib/markets-data.ts) ───

const DEMO_OPERATOR = "0x0000000000000000000000000000000000000001"; // EVM placeholder

const DEMO_MARKETS = [
  {
    title: "宮城県知事選挙の当選者予想",
    description:
      "2026年に予定される宮城県知事選挙の当選者を予測するマーケット",
    category: "politics",
    categoryLabel: "政治",
    bettingDeadline: "2026-06-15T00:00:00Z",
    resolutionTime: "2026-06-20T00:00:00Z",
    outcomes: [
      { label: "村井嘉浩（現職）" },
      { label: "新人候補A" },
      { label: "新人候補B" },
      { label: "その他" },
    ],
  },
  {
    title: "2026年の日本国内の米の平均価格帯",
    description:
      "2026年末時点での日本国内の米5kgあたりの平均小売価格を予測",
    category: "economy",
    categoryLabel: "経済",
    bettingDeadline: "2026-12-31T00:00:00Z",
    resolutionTime: "2027-01-15T00:00:00Z",
    outcomes: [
      { label: "¥2,500未満" },
      { label: "¥2,500〜¥3,000" },
      { label: "¥3,000〜¥3,500" },
      { label: "¥3,500以上" },
    ],
  },
  {
    title: "受験期の渋谷駅周辺の交通混雑レベル",
    description:
      "2026年1-3月の受験シーズンにおける渋谷駅周辺の混雑度を予測",
    category: "local",
    categoryLabel: "地域",
    bettingDeadline: "2026-03-31T00:00:00Z",
    resolutionTime: "2026-04-05T00:00:00Z",
    outcomes: [
      { label: "例年並み" },
      { label: "やや混雑" },
      { label: "大幅混雑" },
    ],
  },
  {
    title: "2026年 日銀の政策金利 年末時点",
    description: "2026年12月末時点の日銀政策金利の水準を予測",
    category: "economy",
    categoryLabel: "経済",
    bettingDeadline: "2026-12-31T00:00:00Z",
    resolutionTime: "2027-01-10T00:00:00Z",
    outcomes: [
      { label: "0.50%以下" },
      { label: "0.50%〜0.75%" },
      { label: "0.75%〜1.00%" },
      { label: "1.00%以上" },
    ],
  },
  {
    title: "次期自民党総裁は誰か",
    description: "次回の自民党総裁選挙における当選者を予測",
    category: "politics",
    categoryLabel: "政治",
    bettingDeadline: "2027-09-30T00:00:00Z",
    resolutionTime: "2027-10-05T00:00:00Z",
    outcomes: [
      { label: "高市早苗" },
      { label: "小泉進次郎" },
      { label: "河野太郎" },
      { label: "石破茂" },
      { label: "その他" },
    ],
  },
  {
    title: "2026年の訪日外国人観光客数",
    description: "2026年の年間訪日外国人数の範囲を予測",
    category: "economy",
    categoryLabel: "経済",
    bettingDeadline: "2026-12-31T00:00:00Z",
    resolutionTime: "2027-01-20T00:00:00Z",
    outcomes: [
      { label: "3,500万人未満" },
      { label: "3,500〜4,000万人" },
      { label: "4,000万人以上" },
    ],
  },
];

const DEMO_USER_ATTRIBUTES = [
  {
    walletAddress: "0x1111111111111111111111111111111111111111",
    attributes: [
      { attributeType: "region" as const, attributeLabel: "宮城県在住", weight: 1.5 },
      { attributeType: "expertise" as const, attributeLabel: "政治学専攻", weight: 1.2 },
    ],
  },
  {
    walletAddress: "0x2222222222222222222222222222222222222222",
    attributes: [
      { attributeType: "region" as const, attributeLabel: "東京都在住", weight: 1.3 },
      { attributeType: "experience" as const, attributeLabel: "金融業界5年", weight: 1.4 },
    ],
  },
];

// ── Main ───────────────────────────────────────────────────────────

async function seed() {
  await initDatabase();
  const db = getDb();

  // Check if data already exists
  const existing = db
    .query("SELECT COUNT(*) as count FROM markets")
    .get() as { count: number };

  if (existing.count > 0) {
    console.log(
      `Database already has ${existing.count} markets. Skipping seed.`
    );
    console.log("To re-seed, delete the database file first.");
    closeDatabase();
    return;
  }

  console.log("Seeding database with demo data...");

  // Create markets with outcomes
  for (const market of DEMO_MARKETS) {
    const created = createMarketWithOutcomes({
      title: market.title,
      description: market.description,
      category: market.category,
      categoryLabel: market.categoryLabel,
      createdBy: DEMO_OPERATOR,
      bettingDeadline: market.bettingDeadline,
      resolutionTime: market.resolutionTime,
      
      operatorAddress: DEMO_OPERATOR,
      outcomes: market.outcomes,
    });

    // Set market to Open so bets can be placed
    db.query(
      "UPDATE markets SET status = 'Open', updated_at = strftime('%Y-%m-%dT%H:%M:%fZ','now') WHERE id = ?"
    ).run(created.id);

    console.log(
      `  Created market: ${created.title} (${created.outcomes.length} outcomes)`
    );
  }

  // Create demo user attributes
  for (const user of DEMO_USER_ATTRIBUTES) {
    for (const attr of user.attributes) {
      addAttribute({
        walletAddress: user.walletAddress,
        ...attr,
      });
    }
    console.log(
      `  Created attributes for ${user.walletAddress} (${user.attributes.length} attrs)`
    );
  }

  console.log("Seed complete!");
  closeDatabase();
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  closeDatabase();
  process.exit(1);
});
