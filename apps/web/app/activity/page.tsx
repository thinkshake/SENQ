"use client";

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useWallet } from "@/contexts/WalletContext";
import { useUser } from "@/contexts/UserContext";
import { formatEth } from "@/lib/api";

export default function ActivityPage() {
  const wallet = useWallet();
  const user = useUser();

  if (!wallet.connected) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <div className="max-w-md mx-auto">
          <h1 className="text-2xl font-bold mb-4">ウォレットを接続</h1>
          <p className="text-muted-foreground mb-8">
            MetaMaskを接続してアクティビティ履歴を確認しましょう。
          </p>
          {!wallet.metaMaskInstalled ? (
            <a
              href="https://metamask.io"
              target="_blank"
              rel="noopener noreferrer"
            >
              <Button className="w-full" size="lg">
                MetaMaskをインストール
              </Button>
            </a>
          ) : (
            <Button
              onClick={wallet.connect}
              disabled={wallet.loading}
              className="w-full"
              size="lg"
            >
              {wallet.loading ? "接続中..." : "MetaMaskを接続"}
            </Button>
          )}
        </div>
      </div>
    );
  }

  const bets = user.bets;

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">アクティビティ</h1>
        <p className="text-muted-foreground">ベット履歴</p>
      </div>

      {/* Activity List */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">最近のアクティビティ</CardTitle>
        </CardHeader>
        <CardContent>
          {user.loading ? (
            <div className="animate-pulse space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-16 bg-muted rounded"></div>
              ))}
            </div>
          ) : bets.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <p className="mb-4">まだアクティビティがありません</p>
              <Link href="/markets">
                <Button>最初のベットをする</Button>
              </Link>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {bets.map((bet) => (
                <div
                  key={bet.id}
                  className="py-4 flex items-center justify-between"
                >
                  <div>
                    <Link
                      href={`/markets/${bet.marketId}`}
                      className="font-medium line-clamp-1 hover:underline"
                    >
                      {bet.marketTitle || bet.marketId}
                    </Link>
                    <div className="text-sm text-muted-foreground flex items-center gap-2 mt-1">
                      <Badge variant="secondary">{bet.outcomeLabel}</Badge>
                      {bet.weightScore > 1 && (
                        <Badge variant="outline">
                          ×{bet.weightScore.toFixed(1)}
                        </Badge>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-medium">
                      {formatEth(bet.amountWei)}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {new Date(bet.createdAt).toLocaleDateString("ja-JP")}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
