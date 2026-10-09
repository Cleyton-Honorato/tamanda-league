'use client';

import { useState } from 'react';
import { Dices, Pencil, Plus, RotateCcw, Target, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input, Select } from '@/components/ui/Field';
import { Modal } from '@/components/ui/Modal';
import { EmptyState } from '@/components/ui/EmptyState';
import { MatchRow } from './MatchRow';
import { ScoreModal } from './ScoreModal';
import { ActionError, onSubmitForm, useAction } from './useAction';
import {
  deleteMatchAction,
  generateGroupFixturesAction,
  reopenMatchAction,
  saveGroupMatchAction,
} from '@/server/actions/matches';
import { toDateTimeLocal } from '@/lib/format';
import type { GroupDto, MatchDto, TeamDto } from '@/lib/types';

export function MatchesManager({
  matches,
  groups,
  teams,
}: {
  matches: MatchDto[];
  groups: GroupDto[];
  teams: TeamDto[];
}) {
  const [editing, setEditing] = useState<MatchDto | null>(null);
  const [creating, setCreating] = useState(false);
  const [scoring, setScoring] = useState<MatchDto | null>(null);
  const [groupId, setGroupId] = useState<string>(groups[0]?.id ?? '');

  const save = useAction(saveGroupMatchAction);
  const remove = useAction(deleteMatchAction);
  const reopen = useAction(reopenMatchAction);
  const generate = useAction(generateGroupFixturesAction);

  const formOpen = creating || editing !== null;

  function startCreate() {
    setGroupId(groups[0]?.id ?? '');
    setCreating(true);
  }

  function startEdit(match: MatchDto) {
    setGroupId(match.groupId ?? groups[0]?.id ?? '');
    setEditing(match);
  }

  function close() {
    setCreating(false);
    setEditing(null);
    save.reset();
  }

  function handleSubmit(formData: FormData) {
    save.run(
      {
        id: editing?.id,
        groupId: formData.get('groupId'),
        teamAId: formData.get('teamAId'),
        teamBId: formData.get('teamBId'),
        scheduledAt: formData.get('scheduledAt'),
      },
      close,
    );
  }

  // Só faz sentido escalar times do grupo escolhido.
  const teamsInGroup = teams.filter((team) => team.groupId === groupId);
  const canCreate = groups.length > 0 && teams.length >= 2;
  const eligibleGroups = groups.length === 2 && groups.every((group) => teams.filter((team) => team.groupId === group.id).length >= 2);
  const fixtureCount = groups.reduce((total, group) => { const count = teams.filter((team) => team.groupId === group.id).length; return total + count * (count - 1) / 2; }, 0);
  const rounds = [...new Set(matches.map((match) => match.round))].sort((a, b) => (a ?? Number.MAX_SAFE_INTEGER) - (b ?? Number.MAX_SAFE_INTEGER));

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl uppercase tracking-wide">Jogos</h1>
          <p className="text-sm text-muted-foreground">
            Fase de grupos — {matches.length} jogo(s).
          </p>
        </div>
        <Button onClick={startCreate} disabled={!canCreate}>
          <Plus className="h-4 w-4" />
          Novo
        </Button>
      </div>

      {!canCreate && (
        <p className="rounded-[var(--radius-md)] border border-accent/40 bg-accent/10 px-3 py-2 text-sm text-accent">
          Cadastre ao menos um grupo e dois times para agendar jogos.
        </p>
      )}

      <ActionError message={remove.error ?? reopen.error} />

      {matches.length === 0 && eligibleGroups && <div className="rounded-[var(--radius-lg)] border border-primary/30 bg-surface p-5 sm:p-6">
        <p className="font-display text-xs uppercase tracking-[.2em] text-primary">Fase de grupos</p>
        <h2 className="mt-2 font-display text-2xl uppercase">Montar confrontos</h2>
        <p className="mt-2 max-w-2xl text-sm text-muted-foreground">Os times estão definidos, mas os jogos ainda não foram criados. Gere um turno único dentro de cada conferência: {fixtureCount} partidas ao todo, com datas a definir. Depois você pode agendar cada jogo.</p>
        <Button className="mt-4" disabled={generate.pending} onClick={() => generate.run({})}><Dices className="h-4 w-4" />{generate.pending ? 'Montando…' : 'Gerar fase de grupos'}</Button>
        <div className="mt-3"><ActionError message={generate.error} /></div>
      </div>}

      {matches.length === 0 ? (
        <EmptyState
          title="Nenhum jogo"
          description="Gere os confrontos entre os times das duas conferências ou cadastre um jogo manualmente."
        />
      ) : (
        <div className="space-y-5">
          {rounds.map((round) => <section key={round ?? 'manual'}>
            <div className="mb-2 flex items-center gap-3">
              <h2 className="font-display text-lg uppercase text-primary">{round === null ? 'Jogos avulsos' : `Rodada ${round}`}</h2>
              <span className="h-px flex-1 bg-border" />
              <span className="font-display text-xs text-muted-foreground">{matches.filter((match) => match.round === round).length} jogos</span>
            </div>
            <ul className="grid gap-3 lg:grid-cols-2 2xl:grid-cols-3">
              {matches.filter((match) => match.round === round).map((match, index) => <li key={match.id} className="min-w-0">
                <MatchRow match={match} index={index} groups={groups} compact actions={<>
                  {match.status === 'SCHEDULED' ? <button type="button" onClick={() => setScoring(match)} aria-label="Lançar placar" title="Placar" className="inline-flex h-9 w-9 cursor-pointer items-center justify-center rounded-lg bg-primary text-background transition-colors hover:bg-primary/85"><Target className="h-4 w-4" /></button>
                    : <button type="button" disabled={reopen.pending} onClick={() => reopen.run({ id: match.id })} aria-label="Reabrir jogo" title="Reabrir" className="inline-flex h-9 w-9 cursor-pointer items-center justify-center rounded-lg border border-border text-muted-foreground transition-colors hover:border-primary hover:text-primary disabled:opacity-50"><RotateCcw className="h-4 w-4" /></button>}
                  <button type="button" onClick={() => startEdit(match)} aria-label="Editar jogo" title="Editar" className="inline-flex h-9 w-9 cursor-pointer items-center justify-center rounded-lg border border-border text-muted-foreground transition-colors hover:border-primary hover:text-primary"><Pencil className="h-4 w-4" /></button>
                  <button type="button" disabled={remove.pending} onClick={() => { if (confirm('Excluir este jogo?')) remove.run({ id: match.id }); }} aria-label="Excluir jogo" title="Excluir" className="ml-auto inline-flex h-9 w-9 cursor-pointer items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-red-500/10 hover:text-red-400 disabled:opacity-50"><Trash2 className="h-4 w-4" /></button>
                </>} />
              </li>)}
            </ul>
          </section>)}
        </div>
      )}

      <Modal
        open={formOpen}
        onClose={close}
        title={editing ? 'Editar jogo' : 'Novo jogo'}
      >
        <form onSubmit={onSubmitForm(handleSubmit)} className="flex flex-col gap-4">
          <Select
            id="groupId"
            name="groupId"
            label="Grupo"
            value={groupId}
            onChange={(event) => setGroupId(event.target.value)}
            required
            error={save.fieldErrors.groupId}
          >
            {groups.map((group) => (
              <option key={group.id} value={group.id}>
                {group.name}
              </option>
            ))}
          </Select>

          {teamsInGroup.length < 2 ? (
            <p className="rounded-[var(--radius-md)] border border-accent/40 bg-accent/10 px-3 py-2 text-sm text-accent">
              Esse grupo tem menos de dois times.
            </p>
          ) : (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <Select
                id="teamAId"
                name="teamAId"
                label="Time A"
                defaultValue={editing?.teamA?.id ?? ''}
                required
                error={save.fieldErrors.teamAId}
              >
                <option value="">Escolha…</option>
                {teamsInGroup.map((team) => (
                  <option key={team.id} value={team.id}>
                    {team.name}
                  </option>
                ))}
              </Select>

              <Select
                id="teamBId"
                name="teamBId"
                label="Time B"
                defaultValue={editing?.teamB?.id ?? ''}
                required
                error={save.fieldErrors.teamBId}
              >
                <option value="">Escolha…</option>
                {teamsInGroup.map((team) => (
                  <option key={team.id} value={team.id}>
                    {team.name}
                  </option>
                ))}
              </Select>
            </div>
          )}

          <Input
            id="scheduledAt"
            name="scheduledAt"
            type="datetime-local"
            label="Data e horário"
            defaultValue={
              editing?.scheduledAt ? toDateTimeLocal(editing.scheduledAt) : ''
            }
            error={save.fieldErrors.scheduledAt}
          />

          <ActionError message={save.error} />

          <div className="flex gap-2">
            <Button
              type="submit"
              fullWidth
              disabled={save.pending || teamsInGroup.length < 2}
            >
              {save.pending ? 'Salvando…' : 'Salvar'}
            </Button>
            <Button type="button" variant="outline" onClick={close}>
              Cancelar
            </Button>
          </div>
        </form>
      </Modal>

      <ScoreModal match={scoring} onClose={() => setScoring(null)} />
    </div>
  );
}
