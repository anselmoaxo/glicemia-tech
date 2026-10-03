import { PageSkeleton } from "@/components/ui/skeleton";

// Aparece na hora ao trocar de tela no menu, enquanto as consultas da página terminam.
export default function AdminLoading() {
  return <PageSkeleton cards={3} rows={4} />;
}
