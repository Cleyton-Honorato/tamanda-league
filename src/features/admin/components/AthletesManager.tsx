'use client';

import { useState } from 'react';
import { Pencil, Plus, Trash2, UserRound } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Field';
import { Modal } from '@/components/ui/Modal';
import { ActionError, onSubmitForm, useAction } from './useAction';
import { deleteAthleteAction, saveAthleteAction } from '@/server/actions/athletes';
import type { AthleteDto } from '@/server/services/athletes';

export function AthletesManager({ athletes }: { athletes: AthleteDto[] }) {
  const [editing, setEditing] = useState<AthleteDto | null>(null);
  const [creating, setCreating] = useState(false);
  const save = useAction(saveAthleteAction);
  const remove = useAction(deleteAthleteAction);

  function close() {
    setEditing(null);
    setCreating(false);
    save.reset();
  }

  function submit(data: FormData) {
    save.run({ id: editing?.id, name: data.get('name'), nickname: data.get('nickname') }, close);
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl uppercase tracking-wide">Atletas</h1>
          <p className="text-sm text-muted-foreground">{athletes.length} inscritos · {athletes.filter((athlete) => !athlete.teamId).length} aguardando time</p>
        </div>
        <Button onClick={() => setCreating(true)}><Plus className="h-4 w-4" /> Novo</Button>
      </div>

      <ActionError message={remove.error} />
      {athletes.length === 0 ? (
        <p className="rounded-[var(--radius-lg)] border border-border bg-surface p-6 text-muted-foreground">Nenhum atleta cadastrado.</p>
      ) : (
        <ul className="grid gap-2 sm:grid-cols-2">
          {athletes.map((athlete, index) => (
            <li key={athlete.id}>
              <Card className="flex items-center gap-3 p-3">
                <span className={index % 2 ? 'text-accent' : 'text-primary'}><UserRound className="h-5 w-5" /></span>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-display text-lg uppercase leading-tight">{athlete.name}</p>
                  <p className="text-xs text-muted-foreground">{athlete.nickname ? `${athlete.nickname} · ` : ''}{athlete.teamId ? 'Com time' : 'Aguardando time'}</p>
                </div>
                <Button size="sm" variant="outline" onClick={() => setEditing(athlete)} aria-label={`Editar ${athlete.name}`}><Pencil className="h-4 w-4" /></Button>
                <Button size="sm" variant="ghost" disabled={remove.pending} onClick={() => { if (confirm(`Excluir ${athlete.name}?`)) remove.run({ id: athlete.id }); }} aria-label={`Excluir ${athlete.name}`}><Trash2 className="h-4 w-4" /></Button>
              </Card>
            </li>
          ))}
        </ul>
      )}

      <Modal open={creating || editing !== null} onClose={close} title={editing ? 'Editar atleta' : 'Novo atleta'}>
        <form onSubmit={onSubmitForm(submit)} className="flex flex-col gap-4">
          <Input id="name" name="name" label="Nome" defaultValue={editing?.name ?? ''} required error={save.fieldErrors.name} />
          <Input id="nickname" name="nickname" label="Apelido (opcional)" defaultValue={editing?.nickname ?? ''} error={save.fieldErrors.nickname} />
          <ActionError message={save.error} />
          <div className="flex gap-2">
            <Button type="submit" fullWidth disabled={save.pending}>{save.pending ? 'Salvando…' : 'Salvar'}</Button>
            <Button type="button" variant="outline" onClick={close}>Cancelar</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
