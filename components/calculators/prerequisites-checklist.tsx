"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { CPL_PREREQUISITES } from "@/lib/calculators/cpl";

export function PrerequisitesChecklist() {
  const [checked, setChecked] = useState<Set<string>>(new Set());
  const done = checked.size;

  function toggle(item: string, value: boolean) {
    setChecked((prev) => {
      const next = new Set(prev);
      if (value) next.add(item);
      else next.delete(item);
      return next;
    });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Antes de começar os anúncios</CardTitle>
        <CardDescription>
          {done} de {CPL_PREREQUISITES.length} pré-requisitos levantados com o cliente.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        {CPL_PREREQUISITES.map((item) => (
          <label key={item} className="flex items-center gap-2 text-sm">
            <Checkbox
              checked={checked.has(item)}
              onCheckedChange={(value) => toggle(item, value === true)}
            />
            <span className={checked.has(item) ? "text-muted-foreground line-through" : ""}>
              {item}
            </span>
          </label>
        ))}
      </CardContent>
    </Card>
  );
}
