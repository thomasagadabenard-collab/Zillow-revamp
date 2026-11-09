import "../../css/StatsStrip.css";

const stats = [
  { value: "2k+", label: "Homes sold last month" },
  { value: "5k+", label: "Happy homeowners" },
  { value: "200+", label: "Trusted agents" },
  { value: "4.8", label: "Average rating" },
];

export default function StatsStrip() {
  return (
    <section className="stats-strip" aria-label="Company statistics">
      {stats.map(({ value, label }) => (
        <div className="stats-strip__item" key={label}>
          <div className="stats-strip__value">{value}</div>
          <div className="stats-strip__label">{label}</div>
        </div>
      ))}
    </section>
  );
}
