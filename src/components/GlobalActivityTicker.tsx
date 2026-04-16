import { useState, useEffect } from "react";

const activities = [
  'User ***92 (London, UK) withdrew $4,200',
  'User ***47 (Tokyo, JP) deposited $12,500',
  'User ***18 (Frankfurt, DE) invested $8,000',
  'User ***63 (New York, US) withdrew $2,750',
  'User ***31 (Sydney, AU) deposited $5,400',
  'User ***55 (Dubai, AE) invested $20,000',
  'User ***79 (Singapore, SG) withdrew $6,100',
  'User ***24 (Toronto, CA) deposited $3,800',
  'User ***88 (São Paulo, BR) invested $15,000',
  'User ***41 (Zürich, CH) withdrew $9,500',
];

export function GlobalActivityTicker() {
  const [items, setItems] = useState(activities);

  useEffect(() => {
    const interval = setInterval(() => {
      setItems((prev) => {
        const shuffled = [...prev];
        const idx = Math.floor(Math.random() * shuffled.length);
        const amounts = [1200, 2500, 3800, 4200, 5000, 6700, 8400, 10500, 15000, 22000];
        const cities = ["Paris, FR", "Seoul, KR", "Mumbai, IN", "Lagos, NG", "Mexico City, MX", "Berlin, DE"];
        const actions = ["deposited", "withdrew", "invested"];
        const newId = String(Math.floor(Math.random() * 90) + 10);
        const city = cities[Math.floor(Math.random() * cities.length)];
        const action = actions[Math.floor(Math.random() * actions.length)];
        const amount = amounts[Math.floor(Math.random() * amounts.length)];
        shuffled[idx] = `User ***${newId} (${city}) ${action} $${amount.toLocaleString()}`;
        return shuffled;
      });
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const doubled = [...items, ...items];

  return (
    <div className="w-full bg-card/50 border-y border-border overflow-hidden">
      <div className="flex animate-ticker whitespace-nowrap py-2.5">
        {doubled.map((item, i) => (
          <div key={i} className="flex items-center gap-2 px-6 text-xs text-muted-foreground">
            <span className="relative flex h-1.5 w-1.5">
              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-primary/60" />
            </span>
            {item}
          </div>
        ))}
      </div>
    </div>
  );
}
