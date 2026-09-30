export function StatCard({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="flex flex-col gap-1 rounded-xl border p-4">
      <p className="text-base text-muted-foreground">{label}</p>
      <p className="text-3xl font-bold">
        {value} {value !== "—" && <span className="text-base font-normal text-muted-foreground">mg/dL</span>}
      </p>
      {hint && <p className="text-sm text-muted-foreground">{hint}</p>}
    </div>
  );
}
