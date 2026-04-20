import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";

// In a real scenario, this comes from your AI Pipeline fusion engine
const MOCK_ATTRIBUTION_DATA = [
  { feature: "Shelf Density", contribution: 28, direction: "positive" },
  { feature: "Inventory Value", contribution: 22, direction: "positive" },
  { feature: "Geo Footfall", contribution: 18, direction: "positive" },
  { feature: "SKU Diversity", contribution: 12, direction: "positive" },
  { feature: "Competition Index", contribution: -10, direction: "negative" },
  { feature: "Catchment Score", contribution: 8, direction: "positive" },
];

export default function FeatureBreakdown() {
  return (
    <div className="w-full h-full min-h-[300px] flex flex-col">
      <h2 className="text-sm font-semibold text-muted uppercase tracking-wider mb-6">
        Estimate Drivers (Feature Attribution)
      </h2>

      <div className="flex-1 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            layout="vertical"
            data={MOCK_ATTRIBUTION_DATA}
            margin={{ top: 0, right: 30, left: 40, bottom: 0 }}
          >
            <XAxis type="number" hide />
            <YAxis
              dataKey="feature"
              type="category"
              axisLine={false}
              tickLine={false}
              tick={{ fill: "#64748B", fontSize: 12 }}
              width={120}
            />
            <Tooltip
              cursor={{ fill: "transparent" }}
              contentStyle={{
                borderRadius: "12px",
                border: "1px solid #E2E8F0",
                boxShadow: "0 4px 20px -2px rgba(0, 0, 0, 0.05)",
              }}
              formatter={(value: any) => [`${value}%`, "Impact"]}
            />
            <Bar dataKey="contribution" radius={[0, 4, 4, 0]} barSize={24}>
              {MOCK_ATTRIBUTION_DATA.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  // Tailwind colors: Emerald-500 for positive, Red-400 for negative
                  fill={entry.direction === "positive" ? "#10B981" : "#F87171"}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
