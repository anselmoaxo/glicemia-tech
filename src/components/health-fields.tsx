import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DIABETES_OPTIONS, MAX_YEARS_WITH_DIABETES, SEX_OPTIONS } from "@/lib/profile-utils";

export type HealthDefaults = {
  birthDate?: string | null;
  sex?: string | null;
  diabetesType?: string | null;
  yearsWithDiabetes?: number | null;
};

const select =
  "h-12 w-full rounded-lg border border-input bg-background px-3 text-base focus-visible:outline-2 focus-visible:outline-ring";

/** Campos opcionais sobre o paciente. Sem estado: funciona em formulários de servidor e de cliente. */
export function HealthFields({ defaults = {}, idPrefix = "" }: { defaults?: HealthDefaults; idPrefix?: string }) {
  const id = (n: string) => `${idPrefix}${n}`;
  return (
    <>
      <div className="flex flex-col gap-2">
        <Label htmlFor={id("birthDate")} className="text-base">Data de nascimento</Label>
        <Input
          id={id("birthDate")}
          name="birthDate"
          type="date"
          min="1900-01-01"
          defaultValue={defaults.birthDate ?? ""}
          autoComplete="bday"
          className="h-12 text-base"
        />
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor={id("sex")} className="text-base">Sexo</Label>
        <select id={id("sex")} name="sex" defaultValue={defaults.sex ?? "nao_informado"} className={select}>
          {SEX_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor={id("diabetesType")} className="text-base">Tipo de diabetes</Label>
        <select
          id={id("diabetesType")}
          name="diabetesType"
          defaultValue={defaults.diabetesType ?? "nao_informado"}
          className={select}
        >
          {DIABETES_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor={id("yearsWithDiabetes")} className="text-base">Há quantos anos tem diabetes?</Label>
        <Input
          id={id("yearsWithDiabetes")}
          name="yearsWithDiabetes"
          type="number"
          inputMode="numeric"
          min={0}
          max={MAX_YEARS_WITH_DIABETES}
          defaultValue={defaults.yearsWithDiabetes ?? ""}
          aria-describedby={id("yearsHint")}
          className="h-12 text-base"
        />
        <p id={id("yearsHint")} className="text-base text-muted-foreground">
          Em anos. Use 0 para menos de 1 ano. Se não souber, deixe em branco.
        </p>
      </div>
    </>
  );
}
