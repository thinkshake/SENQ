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
import { useT, useLanguage } from "@/contexts/LanguageContext";
import { getDateLocale } from "@/lib/format";
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

// ── Auth gate ───────────────────────────────────────────────────

function AdminAuth({ onAuth }: { onAuth: (key: string) => void }) {
  const [key, setKey] = useState("");
  const t = useT();

  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>{t.admin.title}</CardTitle>
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
              {t.admin.login}
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
  const t = useT();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  // Form state
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [deadline, setDeadline] = useState("");
  const outcomes = ["YES", "NO"];

  function reset() {
    setTitle("");
    setDescription("");
    setCategory("");
    setDeadline("");
    // outcomes are fixed to YES/NO
  }

  function handleClose() {
    reset();
    setOpen(false);
  }

  async function handleCreate() {
    if (!title.trim() || !deadline) {
      toast({ title: t.admin.inputError, description: t.admin.fillRequired, variant: "destructive" });
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
        outcomes: outcomes.map((label) => ({ label })),
      });

      toast({ title: t.admin.success, description: t.admin.marketPublished });
      handleClose();
      onCreated();
    } catch (err) {
      toast({
        title: t.admin.error,
        description: err instanceof Error ? err.message : t.admin.createFailed,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) handleClose(); else setOpen(true); }}>
      <DialogTrigger asChild>
        <Button>{t.admin.createMarket}</Button>
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{t.admin.newMarket}</DialogTitle>
          <DialogDescription>{t.admin.enterMarketInfo}</DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4 py-2">
          <div className="flex flex-col gap-1.5">
            <Label>{t.admin.titleLabel}</Label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder={t.admin.titlePlaceholder} />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label>{t.admin.descriptionLabel}</Label>
            <Input value={description} onChange={(e) => setDescription(e.target.value)} placeholder={t.admin.descriptionPlaceholder} />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label>{t.admin.categoryLabel}</Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder={t.admin.categoryPlaceholder} />
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
            <Label>{t.admin.deadlineLabel}</Label>
            <Input type="datetime-local" value={deadline} onChange={(e) => setDeadline(e.target.value)} />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label>{t.admin.outcomesLabel}</Label>
            <p className="text-sm text-muted-foreground">YES / NO</p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            {t.admin.cancel}
          </Button>
          <Button onClick={handleCreate} disabled={loading}>
            {loading ? t.admin.creating : t.admin.createMarket}
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
  const t = useT();
  const [open, setOpen] = useState(false);
  const [selectedOutcome, setSelectedOutcome] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleResolve() {
    if (!selectedOutcome) return;
    setLoading(true);
    try {
      await adminResolveMarket(adminKey, market.id, selectedOutcome);
      toast({ title: t.admin.success, description: t.admin.marketResolved });
      setOpen(false);
      onResolved();
    } catch (err) {
      toast({
        title: t.admin.error,
        description: err instanceof Error ? err.message : t.admin.resolveFailed,
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
          {t.admin.confirmResolve}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t.admin.resolveMarket}</DialogTitle>
          <DialogDescription>{market.title}</DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-3 py-2">
          <Label>{t.admin.selectWinningOutcome}</Label>
          <Select value={selectedOutcome} onValueChange={setSelectedOutcome}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder={t.admin.selectOutcome} />
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
            {t.admin.cancel}
          </Button>
          <Button variant="destructive" onClick={handleResolve} disabled={loading || !selectedOutcome}>
            {loading ? t.admin.resolving : t.admin.resolve}
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
  const t = useT();
  const [loading, setLoading] = useState(false);

  async function handleClose() {
    setLoading(true);
    try {
      await adminCloseMarket(adminKey, market.id);
      toast({ title: t.admin.success, description: t.admin.marketClosedSuccess });
      onAction();
    } catch (err) {
      toast({
        title: t.admin.error,
        description: err instanceof Error ? err.message : t.admin.operationFailed,
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
          {t.admin.closeMarket}
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
  const t = useT();
  const { locale } = useLanguage();
  const dateLocale = getDateLocale(locale);

  const statusLabel: Record<string, string> = {
    Draft: t.admin.statusDraft,
    Open: t.admin.statusOpen,
    Closed: t.admin.statusClosed,
    Resolved: t.admin.statusResolved,
  };

  const statusVariant: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
    Draft: "outline",
    Open: "default",
    Closed: "secondary",
    Resolved: "destructive",
  };

  if (markets.length === 0) {
    return <p className="text-muted-foreground py-8 text-center text-sm">{t.admin.noMarkets}</p>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b text-left">
            <th className="px-3 py-2 font-medium">{t.admin.tableId}</th>
            <th className="px-3 py-2 font-medium">{t.admin.tableTitle}</th>
            <th className="px-3 py-2 font-medium">{t.admin.tableStatus}</th>
            <th className="px-3 py-2 font-medium">{t.admin.tableDeadline}</th>
            <th className="px-3 py-2 font-medium">{t.admin.tableActions}</th>
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
                {new Date(m.bettingDeadline).toLocaleString(dateLocale)}
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
  const t = useT();
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
        title: t.admin.error,
        description: err instanceof Error ? err.message : t.admin.fetchFailed,
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
  }, [adminKey, toast, t]);

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
        <h1 className="text-2xl font-bold">{t.admin.title}</h1>
        <div className="flex gap-2">
          {!walletConnected ? (
            <Button variant="outline" size="sm" onClick={connect}>
              {t.admin.connectMetaMask}
            </Button>
          ) : (
            <span className="text-xs text-muted-foreground flex items-center gap-1">
              <span className="w-2 h-2 bg-green-500 rounded-full" />
              {walletAddress?.slice(0, 8)}...
            </span>
          )}
          <CreateMarketDialog adminKey={adminKey} categories={categories} onCreated={loadMarkets} />
          <Button variant="outline" size="sm" onClick={handleLogout}>
            {t.admin.logout}
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>{t.admin.marketList}</CardTitle>
            <Button variant="ghost" size="sm" onClick={loadMarkets} disabled={loading}>
              {loading ? t.admin.loadingDots : t.admin.refresh}
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
