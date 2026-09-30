import Link from "next/link";
import { deleteReading } from "@/app/(app)/glicemia/actions";
import { OUT_OF_RANGE_MESSAGE, STATUS_LABEL, type GlucoseStatus } from "@/lib/glucose/classify";
import { contextLabel } from "@/lib/glucose/contexts";
import { formatDateTime } from "@/lib/datetime";
import { ConfirmDeleteButton } from "./confirm-delete-button";

const statusStyle: Record<GlucoseStatus, string> = {
  low: "border-blue-700 bg-blue-50 text-blue-900",
  high: "border-red-700 bg-red-50 text-red-900",
  in_range: "border-green-700 bg-green-50 text-green-900",
  no_target: "border-border bg-muted text-muted-foreground",
};

export type ReadingView = {
  id: string;
  value: number;
  measuredAt: Date;
  contextKey: string;
  customLabel: string | null;
  notes: string | null;
  status: GlucoseStatus;
};

export function ReadingItem({ r, timezone }: { r: ReadingView; timezone: string }) {
  return (
    <li className="flex flex-col gap-3 rounded-xl border p-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-3xl font-bold">
          {r.value} <span className="text-base font-normal text-muted-foreground">mg/dL</span>
        </p>
        <span className={`rounded-full border-2 px-3 py-1 text-sm font-semibold ${statusStyle[r.status]}`}>
          {STATUS_LABEL[r.status]}
        </span>
      </div>
      <p className="text-base">
        {formatDateTime(r.measuredAt, timezone)} · {contextLabel(r.contextKey, r.customLabel)}
      </p>
      {(r.status === "low" || r.status === "high") && (
        <p className="text-sm text-muted-foreground">{OUT_OF_RANGE_MESSAGE}</p>
      )}
      {r.notes &&<p className="text-base text-muted-foreground">{r.notes}</p>}
      <div className="flex gap-3">
        <Link
          href={`/glicemia/${r.id}/editar`}
          className="flex min-h-12 flex-1 items-center justify-center rounded-lg border-2 text-base font-medium focus-visible:outline-2 focus-visible:outline-ring"
        >
          Editar
        </Link>
        <form action={deleteReading} className="flex-1">
          <input type="hidden" name="id" value={r.id} />
          <ConfirmDeleteButton />
        </form>
      </div>
    </li>
  );
}
