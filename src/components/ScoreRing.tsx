"use client";

export default function ScoreRing({ score, size = 64 }: { score: number; size?: number }) {
  const radius = (size - 8) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = (score / 10) * circumference;
  const offset = circumference - progress;

  const getColor = (s: number) => {
    if (s >= 9) return "#2DD4A8"; // brand teal
    if (s >= 7) return "#5EEAD2"; // brand light
    if (s >= 5) return "#FDE047"; // yellow
    return "#F87171"; // red
  };

  return (
    <div className="relative animate-score" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="#4A4544"
          strokeWidth="4"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={getColor(score)}
          strokeWidth="4"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="score-ring"
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span
          className="font-mono font-bold"
          style={{ fontSize: size * 0.35, color: getColor(score) }}
        >
          {score}
        </span>
      </div>
    </div>
  );
}
