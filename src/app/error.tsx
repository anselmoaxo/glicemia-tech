"use client";

export default function GlobalError({ reset }: { error: Error; reset: () => void }) {
  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center gap-4 px-4 py-10">
      <h1 className="text-3xl font-bold">Algo deu errado</h1>
      <p className="text-base">Tente novamente. Se continuar, volte mais tarde.</p>
      <button onClick={reset} className="min-h-14 rounded-lg bg-primary text-lg font-semibold text-primary-foreground">
        Tentar novamente
      </button>
    </main>
  );
}
