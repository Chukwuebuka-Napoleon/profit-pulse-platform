import { useState, useEffect } from "react";
import { TrendingUp, TrendingDown } from "lucide-react";

interface CryptoPrice {
  symbol: string;
  name: string;
  price: number;
  change: number;
}

const cryptoData: CryptoPrice[] = [
  { symbol: "BTC", name: "Bitcoin", price: 67432.18, change: 2.34 },
  { symbol: "ETH", name: "Ethereum", price: 3521.45, change: -0.87 },
  { symbol: "USDT", name: "Tether", price: 1.0, change: 0.01 },
  { symbol: "BNB", name: "BNB", price: 589.32, change: 1.56 },
  { symbol: "SOL", name: "Solana", price: 142.87, change: 4.21 },
  { symbol: "XRP", name: "Ripple", price: 0.5423, change: -1.23 },
];

export function CryptoTicker() {
  const [prices, setPrices] = useState(cryptoData);

  useEffect(() => {
    const interval = setInterval(() => {
      setPrices((prev) =>
        prev.map((coin) => ({
          ...coin,
          price: coin.price * (1 + (Math.random() - 0.5) * 0.002),
          change: coin.change + (Math.random() - 0.5) * 0.1,
        }))
      );
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const tickerItems = [...prices, ...prices];

  return (
    <div className="w-full bg-surface-overlay border-b border-border overflow-hidden">
      <div className="flex animate-ticker whitespace-nowrap py-2.5">
        {tickerItems.map((coin, i) => (
          <div key={i} className="flex items-center gap-2 px-6 text-sm">
            <span className="font-mono font-semibold text-foreground">{coin.symbol}</span>
            <span className="font-mono text-muted-foreground">
              ${coin.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
            <span className={`flex items-center gap-0.5 font-mono text-xs ${coin.change >= 0 ? "text-success" : "text-destructive"}`}>
              {coin.change >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
              {coin.change >= 0 ? "+" : ""}{coin.change.toFixed(2)}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
