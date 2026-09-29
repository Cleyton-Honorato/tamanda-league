'use client';

import { useState } from 'react';
import { Pencil, Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card, accentForIndex } from '@/components/ui/Card';
import { Input } from '@/components/ui/Field';
import { Modal } from '@/components/ui/Modal';
import { EmptyState } from '@/components/ui/EmptyState';
import { ActionError, onSubmitForm, useAction } from './useAction';
import { deleteGroupAction, saveGroupAction } from '@/server/actions/groups';
import type { GroupDto } from '@/lib/types';

export function GroupsManager({
  groups,
  teamCounts,
}: {
  groups: GroupDto[];
  teamCounts: Record<string, number>;
}) {
  const [editing, setEditing] = useState<GroupDto | null>(null);
  const [creating, setCreating] = useState(false);
  const save = useAction(saveGroupAction);
  const remove = useAction(deleteGroupAction);

  const open = creating || editing !== null;

  function close() {
    setCreating(false);
    setEditing(null);
    save.reset();
  }

  function handleSubmit(formData: FormData) {
    save.run(
      {
        id: editing?.id,
        name: formData.get('name'),
        order: formData.get('order'),
      },
      close,
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl uppercase tracking-wide">Conferências</h1>
          <p className="text-sm text-muted-foreground">
            Duas conferências para distribuir os times quando forem formados.
          </p>
        </div>
        {groups.length < 2 && <Button onClick={() => setCreating(true)}>
          <Plus className="h-4 w-4" />
          Novo
        </Button>}
      </div>

      <ActionError message={remove.error} />

      {groups.length === 0 ? (
        <EmptyState
          title="Nenhum grupo"
          description="Crie os grupos para depois distribuir os times."
        />
      ) : (
        <ul className="flex flex-col gap-2">
          {groups.map((group, index) => (
            <li key={group.id}>
              <Card accent={accentForIndex(index)} className="flex items-center gap-3 p-3">
                <div className="min-w-0 flex-1">
                  <p className="truncate font-display text-xl uppercase">
                    {group.name}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {teamCounts[group.id] ?? 0} time(s) · ordem {group.order}
                  </p>
                </div>

                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setEditing(group)}
                  aria-label={`Editar ${group.name}`}
                >
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  disabled={remove.pending}
                  onClick={() => {
                    if (confirm(`Excluir o ${group.name}?`)) {
                      remove.run({ id: group.id });
                    }
                  }}
                  aria-label={`Excluir ${group.name}`}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </Card>
            </li>
          ))}
        </ul>
      )}

      <Modal
        open={open}
        onClose={close}
        title={editing ? 'Editar grupo' : 'Novo grupo'}
      >
        <form onSubmit={onSubmitForm(handleSubmit)} className="flex flex-col gap-4">
          <Input
            id="name"
            name="name"
            label="Nome"
            placeholder="Grupo A"
            defaultValue={editing?.name ?? ''}
            required
            error={save.fieldErrors.name}
          />
          <Input
            id="order"
            name="order"
            type="number"
            label="Ordem"
            min={0}
            max={99}
            defaultValue={editing?.order ?? groups.length}
            required
            error={save.fieldErrors.order}
          />

          <ActionError message={save.error} />

          <div className="flex gap-2">
            <Button type="submit" fullWidth disabled={save.pending}>
              {save.pending ? 'Salvando…' : 'Salvar'}
            </Button>
            <Button type="button" variant="outline" onClick={close}>
              Cancelar
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
