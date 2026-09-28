"use client";

import { useState, useTransition } from "react";
import { Check, Copy, ExternalLink, FileText, Pencil } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { updateClientFormUrl } from "@/lib/settings/actions";

export function ClientFormLink({ url, canEdit }: { url: string; canEdit: boolean }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(url);
  const [copied, setCopied] = useState(false);
  const [pending, startTransition] = useTransition();

  async function copy() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      toast.success("Link copiado. É só colar na conversa com o cliente.");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Não foi possível copiar. Selecione o link e copie manualmente.");
    }
  }

  function save(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      const result = await updateClientFormUrl(draft);
      if (result?.error) toast.error(result.error);
      else {
        toast.success("Link atualizado.");
        setEditing(false);
      }
    });
  }

  return (
    <div className="flex flex-col gap-3 rounded-lg border border-primary/40 bg-primary/5 p-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex min-w-0 items-center gap-3">
        <div className="flex size-9 shrink-0 items-center justify-center rounded-md bg-primary text-primary-foreground">
          <FileText className="size-4" />
        </div>
        <div className="min-w-0">
          <p className="text-sm font-medium">Formulário do cliente (ClickUp)</p>
          {editing ? (
            <form onSubmit={save} className="mt-1 flex gap-2">
              <Input
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                disabled={pending}
                className="h-7 w-full min-w-0 sm:w-96"
                autoFocus
              />
              <Button type="submit" size="sm" disabled={pending}>
                {pending ? "Salvando..." : "Salvar"}
              </Button>
              <Button
                type="button"
                size="sm"
                variant="ghost"
                onClick={() => {
                  setDraft(url);
                  setEditing(false);
                }}
              >
                Cancelar
              </Button>
            </form>
          ) : (
            <p className="truncate text-xs text-muted-foreground">{url}</p>
          )}
        </div>
      </div>
      {!editing && (
        <div className="flex shrink-0 gap-2">
          <Button
            variant="outline"
            size="sm"
            nativeButton={false}
            render={<a href={url} target="_blank" rel="noopener noreferrer" />}
          >
            <ExternalLink />
            Abrir
          </Button>
          <Button size="sm" onClick={copy}>
            {copied ? <Check /> : <Copy />}
            {copied ? "Copiado" : "Copiar link"}
          </Button>
          {canEdit && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setEditing(true)}
              aria-label="Editar link"
            >
              <Pencil />
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
