import { PageSkeleton } from "@/components/ui/skeleton";

// Aparece na hora ao navegar entre as telas do app, enquanto os dados da página chegam.
export default function AppLoading() {
  return <PageSkeleton rows={4} />;
}
