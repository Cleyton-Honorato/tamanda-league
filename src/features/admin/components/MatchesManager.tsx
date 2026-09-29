'use client';

import { useState } from 'react';
import { Pencil, Plus, RotateCcw, Target, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input, Select } from '@/components/ui/Field';
import { Modal } from '@/components/ui/Modal';
import { EmptyState } from '@/components/ui/EmptyState';
import { MatchRow } from './MatchRow';
import { ScoreModal } from './ScoreModal';
import { ActionError, onSubmitForm, useAction } from './useAction';
import {
  deleteMatchAction,
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

      {matches.length === 0 ? (
        <EmptyState
          title="Nenhum jogo"
          description="Monte a tabela da fase de grupos."
        />
      ) : (
        <ul className="flex flex-col gap-2">
          {matches.map((match, index) => (
            <li key={match.id}>
              <MatchRow
                match={match}
                index={index}
                groups={groups}
                actions={
                  <>
                    {match.status === 'SCHEDULED' ? (
                      <Button size="sm" onClick={() => setScoring(match)}>
                        <Target className="h-4 w-4" />
                        Placar
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={reopen.pending}
                        onClick={() => reopen.run({ id: match.id })}
                      >
                        <RotateCcw className="h-4 w-4" />
                        Reabrir
                      </Button>
                    )}

                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => startEdit(match)}
                    >
                      <Pencil className="h-4 w-4" />
                      Editar
                    </Button>

                    <Button
                      size="sm"
                      variant="ghost"
                      disabled={remove.pending}
                      onClick={() => {
                        if (confirm('Excluir este jogo?')) {
                          remove.run({ id: match.id });
                        }
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                      Excluir
                    </Button>
                  </>
                }
              />
            </li>
          ))}
        </ul>
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
