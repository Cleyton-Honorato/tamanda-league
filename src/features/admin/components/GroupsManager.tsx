'use client';

import { useState } from 'react';
import { Dices, Pencil, Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card, accentForIndex } from '@/components/ui/Card';
import { Input } from '@/components/ui/Field';
import { Modal } from '@/components/ui/Modal';
import { EmptyState } from '@/components/ui/EmptyState';
import { ActionError, onSubmitForm, useAction } from './useAction';
import { deleteGroupAction, saveGroupAction } from '@/server/actions/groups';
import { commitGroupDrawAction, previewGroupDrawAction } from '@/server/actions/group-draw';
import type { GroupDto, TeamDto } from '@/lib/types';
import type { GroupDrawPreview } from '@/server/services/group-draw';

export function GroupsManager({
  groups,
  teams,
}: {
  groups: GroupDto[];
  teams: TeamDto[];
}) {
  const [editing, setEditing] = useState<GroupDto | null>(null);
  const [creating, setCreating] = useState(false);
  const save = useAction(saveGroupAction);
  const remove = useAction(deleteGroupAction);
  const previewDraw = useAction(previewGroupDrawAction);
  const confirmDraw = useAction(commitGroupDrawAction);
  const [proposal, setProposal] = useState<GroupDrawPreview | null>(null);

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
            Dois grupos para distribuir os times depois de formar os elencos.
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
        <ul className="grid gap-4 lg:grid-cols-2">
          {groups.map((group, index) => (
            <li key={group.id}>
              <Card accent={group.name.toLowerCase().includes('laranja') ? 'orange' : accentForIndex(index)} className="h-full p-4">
                <div className="flex items-center gap-3">
                <div className="min-w-0 flex-1">
                  <p className="truncate font-display text-xl uppercase">
                    {group.name}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {teams.filter((team) => team.groupId === group.id).length} time(s)
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
                </div>
                <ul className="mt-4 space-y-1 border-t border-border pt-3">
                  {teams.filter((team) => team.groupId === group.id).map((team) => (
                    <li key={team.id} className="flex items-center justify-between gap-3 text-sm">
                      <span className="truncate">{team.name}</span>
                      <span className="shrink-0 font-display text-xs text-muted-foreground">{team.shortName}</span>
                    </li>
                  ))}
                  {!teams.some((team) => team.groupId === group.id) && <li className="text-sm text-muted-foreground">Nenhum time neste grupo.</li>}
                </ul>
              </Card>
            </li>
          ))}
        </ul>
      )}

      {groups.length === 2 && teams.length >= 4 && (
        <section aria-label="Sorteio dos grupos" className="mt-4 border border-border bg-surface p-5 sm:p-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="font-display text-xs uppercase tracking-[.24em] text-accent">Fase de grupos</p>
              <h2 className="mt-2 font-display text-2xl uppercase">Sortear as conferências</h2>
              <p className="mt-2 max-w-2xl text-sm text-muted-foreground">Distribua os times entre Verde e Laranja, mantendo os elencos e equilibrando a força média. Confira a prévia antes de confirmar.</p>
            </div>
            <Button disabled={previewDraw.pending || confirmDraw.pending} onClick={() => previewDraw.run({}, setProposal)}>
              <Dices className="h-4 w-4" />{previewDraw.pending ? 'Sorteando…' : proposal ? 'Sortear novamente' : 'Gerar prévia'}
            </Button>
          </div>
          <div className="mt-3"><ActionError message={previewDraw.error ?? confirmDraw.error} /></div>

          {proposal && <div className="mt-6 space-y-5 border-t border-border pt-5">
            <div className="grid gap-4 lg:grid-cols-2">
              {proposal.groups.map((group) => {
                const orange = group.name.toLowerCase().includes('laranja');
                return <div key={group.id} className={`border bg-background p-4 ${orange ? 'border-accent/50' : 'border-primary/50'}`}>
                  <div className="flex flex-wrap items-end justify-between gap-2 border-b border-border pb-3">
                    <h3 className={`font-display text-xl uppercase ${orange ? 'text-accent' : 'text-primary'}`}>{group.name}</h3>
                    <span className="font-display text-sm text-muted-foreground">{group.teams.length} times · média {group.averageStrength.toLocaleString('pt-BR', { maximumFractionDigits: 1 })} ★</span>
                  </div>
                  <ul className="mt-3 space-y-2">
                    {group.teams.map((team) => <li key={team.id} className="flex items-center justify-between gap-2 text-sm">
                      <span className="min-w-0 truncate">{team.name}{team.moved && <span className="ml-2 font-display text-xs uppercase text-muted-foreground">novo grupo</span>}</span>
                      <span className="shrink-0 font-display">{team.strength.toLocaleString('pt-BR')} ★</span>
                    </li>)}
                  </ul>
                </div>;
              })}
            </div>
            <p className="text-sm text-muted-foreground">{proposal.replacedFixtures > 0 ? `Ao confirmar, ${proposal.replacedFixtures} confrontos ainda sem data serão reorganizados para os novos grupos.` : 'Ao confirmar, os confrontos da fase de grupos serão criados.'} Jogos agendados ou iniciados não são alterados.</p>
            <div className="flex flex-wrap gap-2">
              <Button disabled={confirmDraw.pending} onClick={() => confirmDraw.run({ seed: proposal.seed, fingerprint: proposal.fingerprint }, () => setProposal(null))}>{confirmDraw.pending ? 'Confirmando…' : 'Confirmar grupos'}</Button>
              <Button variant="outline" onClick={() => setProposal(null)}>Descartar</Button>
            </div>
          </div>}
        </section>
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
