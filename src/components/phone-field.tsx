"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { tidyPhoneInput } from "@/lib/phone";

type Props = {
  id?: string;
  defaultValue?: string;
  /** frase explicando para que o número será usado */
  purpose: string;
  optional?: boolean;
};

/** Campo de celular. Ao sair dele, um número válido é mostrado já formatado: (11) 91234-5678. */
export function PhoneField({ id = "phone", defaultValue = "", purpose, optional = false }: Props) {
  return (
    <div className="flex flex-col gap-2">
      <Label htmlFor={id} className="text-base">
        Celular com DDD{optional && <span className="font-normal text-muted-foreground"> (opcional)</span>}
      </Label>
      <Input
        id={id}
        name="phone"
        type="tel"
        inputMode="tel"
        autoComplete="tel-national"
        placeholder="(11) 91234-5678"
        defaultValue={defaultValue}
        aria-describedby={`${id}-hint`}
        onBlur={(e) => {
          e.currentTarget.value = tidyPhoneInput(e.currentTarget.value);
        }}
        className="h-12 text-base placeholder:text-base"
      />
      <p id={`${id}-hint`} className="text-base text-muted-foreground">
        {purpose} Exemplo: (11) 91234-5678.
      </p>
    </div>
  );
}
