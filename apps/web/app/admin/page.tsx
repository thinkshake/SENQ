"use client";

import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { useWallet } from "@/contexts/WalletContext";
import type { Market } from "@/lib/api";
import {
  adminGetMarkets,
  adminCreateMarket,
  adminCloseMarket,
  adminResolveMarket,
  fetchCategories,
} from "@/lib/api";

const ADMIN_KEY_STORAGE = "senq-admin-key";

function getStoredKey(): string {
  if (typeof window === "undefined") return "";
  return localStorage.getItem(ADMIN_KEY_STORAGE) ?? "";
}

// ── Status helpers ──────────────────────────────────────────────

const statusLabel: Record<string, string> = {
  Draft: "下書き",
  Open: "公開中",
  Closed: "締切",
  Resolved: "確定済",
};

const statusVariant: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  Draft: "outline",
  Open: "default",
  Closed: "secondary",
  Resolved: "destructive",
};

// ── Auth gate ───────────────────────────────────────────────────

function AdminAuth({ onAuth }: { onAuth: (key: string) => void }) {
  const [key, setKey] = useState("");

  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>管理画面</CardTitle>
        </CardHeader>
        <CardContent>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (key.trim()) onAuth(key.trim());
            }}
            className="flex flex-col gap-3"
          >
            <Input
              type="password"
              placeholder="Admin Key"
              value={key}
              onChange={(e) => setKey(e.target.value)}
            />
            <Button type="submit" disabled={!key.trim()}>
              ログイン
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

// ── Create Market dialog ────────────────────────────────────────

function CreateMarketDialog({
  adminKey,
  categories,
  onCreated,
}: {
  adminKey: string;
  categories: { value: string; label: string }[];
  onCreated: () => void;
}) {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  // Form state
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [deadline, setDeadline] = useState("");
  const [outcomes, setOutcomes] = useState(["", ""]);

  function reset() {
    setTitle("");
    setDescription("");
    setCategory("");
    setDeadline("");
    setOutcomes(["", ""]);
  }

  function handleClose() {
    reset();
    setOpen(false);
  }

  async function handleCreate() {
    const filteredOutcomes = outcomes.filter((o) => o.trim());
    if (!title.trim() || !deadline || filteredOutcomes.length < 2) {
      toast({ title: "入力エラー", description: "必須項目を入力してください", variant: "destructive" });
      return;
    }

    setLoading(true);
    try {
      const cat = categories.find((c) => c.value === category);
      await adminCreateMarket(adminKey, {
        title: title.trim(),
        description: description.trim(),
        category: category || undefined,
        categoryLabel: cat?.label,
        bettingDeadline: new Date(deadline).toISOString(),
        outcomes: filteredOutcomes.map((label) => ({ label: label.trim() })),
      });

      toast({ title: "成功", description: "マーケットを公開しました！" });
      handleClose();
      onCreated();
    } catch (err) {
      toast({
        title: "エラー",
        description: err instanceof Error ? err.message : "作成に失敗しました",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) handleClose(); else setOpen(true); }}>
      <DialogTrigger asChild>
        <Button>マーケット作成</Button>
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>新規マーケット作成</DialogTitle>
          <DialogDescription>マーケットの情報を入力してください</DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4 py-2">
          <div className="flex flex-col gap-1.5">
            <Label>タイトル *</Label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="マーケットのタイトル" />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label>説明</Label>
            <Input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="説明文" />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label>カテゴリ</Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="選択してください" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((c) => (
                  <SelectItem key={c.value} value={c.value}>
                    {c.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label>締切日時 *</Label>
            <Input type="datetime-local" value={deadline} onChange={(e) => setDeadline(e.target.value)} />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label>アウトカム * (最低2つ)</Label>
            {outcomes.map((o, i) => (
              <div key={i} className="flex gap-2">
                <Input
                  value={o}
                  onChange={(e) => {
                    const next = [...outcomes];
                    next[i] = e.target.value;
                    setOutcomes(next);
                  }}
                  placeholder={`選択肢 ${i + 1}`}
                />
                {outcomes.length > 2 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setOutcomes(outcomes.filter((_, j) => j !== i))}
                  >
                    削除
                  </Button>
                )}
              </div>
            ))}
            {outcomes.length < 5 && (
              <Button type="button" variant="outline" size="sm" onClick={() => setOutcomes([...outcomes, ""])}>
                選択肢を追加
              </Button>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            キャンセル
          </Button>
          <Button onClick={handleCreate} disabled={loading}>
            {loading ? "作成中..." : "マーケット作成"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ── Resolve dialog ──────────────────────────────────────────────

function ResolveDialog({
  market,
  adminKey,
  onResolved,
}: {
  market: Market;
  adminKey: string;
  onResolved: () => void;
}) {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [selectedOutcome, setSelectedOutcome] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleResolve() {
    if (!selectedOutcome) return;
    setLoading(true);
    try {
      await adminResolveMarket(adminKey, market.id, selectedOutcome);
      toast({ title: "成功", description: "マーケットを確定しました" });
      setOpen(false);
      onResolved();
    } catch (err) {
      toast({
        title: "エラー",
        description: err instanceof Error ? err.message : "確定に失敗しました",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="destructive">
          確定
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>マーケットを確定</DialogTitle>
          <DialogDescription>{market.title}</DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-3 py-2">
          <Label>勝利アウトカムを選択</Label>
          <Select value={selectedOutcome} onValueChange={setSelectedOutcome}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="アウトカムを選択" />
            </SelectTrigger>
            <SelectContent>
              {market.outcomes.map((o) => (
                <SelectItem key={o.id} value={o.id}>
                  {o.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            キャンセル
          </Button>
          <Button variant="destructive" onClick={handleResolve} disabled={loading || !selectedOutcome}>
            {loading ? "確定中..." : "確定する"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ── Market actions ──────────────────────────────────────────────

function MarketActions({
  market,
  adminKey,
  onAction,
}: {
  market: Market;
  adminKey: string;
  onAction: () => void;
}) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  async function handleClose() {
    setLoading(true);
    try {
      await adminCloseMarket(adminKey, market.id);
      toast({ title: "成功", description: "マーケットを締め切りました" });
      onAction();
    } catch (err) {
      toast({
        title: "エラー",
        description: err instanceof Error ? err.message : "操作に失敗しました",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }

  const status = market.status;

  return (
    <div className="flex gap-1">
      {status === "Open" && (
        <Button size="sm" variant="secondary" onClick={handleClose} disabled={loading}>
          締切
        </Button>
      )}
      {status === "Closed" && (
        <ResolveDialog market={market} adminKey={adminKey} onResolved={onAction} />
      )}
    </div>
  );
}

// ── Market table ────────────────────────────────────────────────

function MarketTable({
  markets,
  adminKey,
  onAction,
}: {
  markets: Market[];
  adminKey: string;
  onAction: () => void;
}) {
  if (markets.length === 0) {
    return <p className="text-muted-foreground py-8 text-center text-sm">マーケットがありません</p>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b text-left">
            <th className="px-3 py-2 font-medium">ID</th>
            <th className="px-3 py-2 font-medium">タイトル</th>
            <th className="px-3 py-2 font-medium">ステータス</th>
            <th className="px-3 py-2 font-medium">締切</th>
            <th className="px-3 py-2 font-medium">操作</th>
          </tr>
        </thead>
        <tbody>
          {markets.map((m) => (
            <tr key={m.id} className="border-b">
              <td className="text-muted-foreground px-3 py-2 font-mono text-xs">
                {m.id.slice(0, 8)}
              </td>
              <td className="max-w-[200px] truncate px-3 py-2">{m.title}</td>
              <td className="px-3 py-2">
                <Badge variant={statusVariant[m.status] ?? "outline"}>
                  {statusLabel[m.status] ?? m.status}
                </Badge>
              </td>
              <td className="text-muted-foreground px-3 py-2 text-xs">
                {new Date(m.bettingDeadline).toLocaleString("ja-JP")}
              </td>
              <td className="px-3 py-2">
                <MarketActions market={m} adminKey={adminKey} onAction={onAction} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ── Main admin page ─────────────────────────────────────────────

export default function AdminPage() {
  const { toast } = useToast();
  const { connected: walletConnected, address: walletAddress, connect } = useWallet();
  const [adminKey, setAdminKey] = useState<string | null>(null);
  const [markets, setMarkets] = useState<Market[]>([]);
  const [categories, setCategories] = useState<{ value: string; label: string }[]>([]);
  const [loading, setLoading] = useState(false);

  // Hydrate stored key on mount
  useEffect(() => {
    const stored = getStoredKey();
    if (stored) setAdminKey(stored);
  }, []);

  const loadMarkets = useCallback(async () => {
    if (!adminKey) return;
    setLoading(true);
    try {
      const data = await adminGetMarkets(adminKey);
      setMarkets(data);
    } catch (err) {
      toast({
        title: "エラー",
        description: err instanceof Error ? err.message : "取得に失敗しました",
        variant: "destructive",
      });
      // If auth fails, clear key
      if (err instanceof Error && err.message.includes("Auth")) {
        localStorage.removeItem(ADMIN_KEY_STORAGE);
        setAdminKey(null);
      }
    } finally {
      setLoading(false);
    }
  }, [adminKey, toast]);

  useEffect(() => {
    if (!adminKey) return;
    loadMarkets();
    fetchCategories()
      .then((res) => setCategories(res.categories))
      .catch(() => {});
  }, [adminKey, loadMarkets]);

  function handleAuth(key: string) {
    localStorage.setItem(ADMIN_KEY_STORAGE, key);
    setAdminKey(key);
  }

  function handleLogout() {
    localStorage.removeItem(ADMIN_KEY_STORAGE);
    setAdminKey(null);
    setMarkets([]);
  }

  // Show auth gate if not yet authenticated
  if (adminKey === null) {
    return <AdminAuth onAuth={handleAuth} />;
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6 px-4 py-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">管理画面</h1>
        <div className="flex gap-2">
          {!walletConnected ? (
            <Button variant="outline" size="sm" onClick={connect}>
              MetaMask接続
            </Button>
          ) : (
            <span className="text-xs text-muted-foreground flex items-center gap-1">
              <span className="w-2 h-2 bg-green-500 rounded-full" />
              {walletAddress?.slice(0, 8)}...
            </span>
          )}
          <CreateMarketDialog adminKey={adminKey} categories={categories} onCreated={loadMarkets} />
          <Button variant="outline" size="sm" onClick={handleLogout}>
            ログアウト
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>マーケット一覧</CardTitle>
            <Button variant="ghost" size="sm" onClick={loadMarkets} disabled={loading}>
              {loading ? "読込中..." : "更新"}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <MarketTable markets={markets} adminKey={adminKey} onAction={loadMarkets} />
        </CardContent>
      </Card>
    </div>
  );
}
