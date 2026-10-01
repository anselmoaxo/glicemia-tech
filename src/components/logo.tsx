import { Droplet } from "lucide-react";

export function Logo({ size = "md" }: { size?: "md" | "lg" }) {
  const big = size === "lg";
  return (
    <span className="flex items-center gap-2.5">
      <span
        aria-hidden
        className={`grid place-items-center rounded-xl bg-gradient-to-br from-brand-600 to-brand-500 text-primary-foreground shadow-md shadow-brand-600/30 ${big ? "size-12" : "size-9"}`}
      >
        <Droplet className={big ? "size-7" : "size-5"} fill="currentColor" />
      </span>
      <span className={`font-bold tracking-tight ${big ? "text-3xl" : "text-xl"}`}>Glicose Tech</span>
    </span>
  );
}
