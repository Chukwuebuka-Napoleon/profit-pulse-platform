export function MarketPartners() {
  const partners = [
    { name: "TradingView", letters: "TV" },
    { name: "CoinMarketCap", letters: "CMC" },
    { name: "Reuters", letters: "R" },
  ];

  return (
    <section className="py-12 px-4 border-t border-border">
      <div className="max-w-6xl mx-auto">
        <p className="text-center text-xs uppercase tracking-widest text-muted-foreground mb-8">
          Market Data Partners
        </p>
        <div className="flex items-center justify-center gap-12 md:gap-20">
          {partners.map((p) => (
            <div
              key={p.name}
              className="flex flex-col items-center gap-2 opacity-40 hover:opacity-60 transition-opacity"
            >
              <div className="h-10 w-20 rounded bg-muted/50 flex items-center justify-center">
                <span className="text-lg font-bold font-mono text-muted-foreground tracking-wider">
                  {p.letters}
                </span>
              </div>
              <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
                {p.name}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
