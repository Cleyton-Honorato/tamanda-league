'use client';

import { useState } from 'react';
import { CalendarClock, RotateCcw, Target, Trash2, Wand2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input, Select } from '@/components/ui/Field';
import { Modal } from '@/components/ui/Modal';
import { EmptyState } from '@/components/ui/EmptyState';
import { ScoreModal } from './ScoreModal';
import { ActionError, onSubmitForm, useAction } from './useAction';
import {
  clearBracketAction,
  generateBracketAction,
  reopenMatchAction,
  scheduleMatchAction,
  setBracketSlotAction,
} from '@/server/actions/matches';
import { toDateTimeLocal, formatDateTimeShort } from '@/lib/format';
import { cn } from '@/lib/cn';
import {
  KNOCKOUT_STAGES,
  STAGE_LABELS,
  type KnockoutStage,
  type MatchDto,
  type TeamDto,
} from '@/lib/types';

function EmptyBracket({ teamsCount }: { teamsCount: number }) {
  const generate = useAction(generateBracketAction);
  const [entryStage, setEntryStage] = useState<KnockoutStage>(
    teamsCount >= 16 ? 'R16' : 'QF',
  );

  return (
    <div className="flex flex-col gap-4">
      <EmptyState
        title="Sem chaveamento"
        description="Gere o mata-mata e depois escolha quem entra em cada confronto."
      />

      <Card className="flex flex-col gap-3 p-4">
        <Select
          id="entryStage"
          label="Times no mata-mata"
          value={entryStage}
          onChange={(event) =>
            setEntryStage(event.target.value as KnockoutStage)
          }
        >
          <option value="R16">16 times (oitavas de final)</option>
          <option value="QF">8 times (quartas de final)</option>
        </Select>

        <ActionError message={generate.error} />

        <Button
          disabled={generate.pending}
          onClick={() => generate.run({ entryStage })}
        >
          <Wand2 className="h-4 w-4" />
          {generate.pending ? 'Gerando…' : 'Gerar chaveamento'}
        </Button>
      </Card>
    </div>
  );
}

function SlotEditor({
  match,
  teams,
  onClose,
}: {
  match: MatchDto | null;
  teams: TeamDto[];
  onClose: () => void;
}) {
  const save = useAction(setBracketSlotAction);

  function handleSubmit(formData: FormData) {
    if (!match?.slot) return;
    save.run(
      {
        slot: match.slot,
        teamAId: formData.get('teamAId'),
        teamBId: formData.get('teamBId'),
      },
      onClose,
    );
  }

  return (
    <Modal
      open={match !== null}
      onClose={onClose}
      title={`Confronto ${match?.slot ?? ''}`}
      size="sm"
    >
      {match && (
        <form onSubmit={onSubmitForm(handleSubmit)} className="flex flex-col gap-4">
          <Select
            id="teamAId"
            name="teamAId"
            label="Time A"
            defaultValue={match.teamA?.id ?? ''}
            error={save.fieldErrors.teamAId}
          >
            <option value="">A definir</option>
            {teams.map((team) => (
              <option key={team.id} value={team.id}>
                {team.name}
              </option>
            ))}
          </Select>

          <Select
            id="teamBId"
            name="teamBId"
            label="Time B"
            defaultValue={match.teamB?.id ?? ''}
            error={save.fieldErrors.teamBId}
          >
            <option value="">A definir</option>
            {teams.map((team) => (
              <option key={team.id} value={team.id}>
                {team.name}
              </option>
            ))}
          </Select>

          <ActionError message={save.error} />

          <div className="flex gap-2">
            <Button type="submit" fullWidth disabled={save.pending}>
              {save.pending ? 'Salvando…' : 'Salvar'}
            </Button>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
          </div>
        </form>
      )}
    </Modal>
  );
}

function ScheduleModal({
  match,
  onClose,
}: {
  match: MatchDto | null;
  onClose: () => void;
}) {
  const schedule = useAction(scheduleMatchAction);

  function handleSubmit(formData: FormData) {
    if (!match) return;
    schedule.run(
      { id: match.id, scheduledAt: formData.get('scheduledAt') },
      onClose,
    );
  }

  return (
    <Modal open={match !== null} onClose={onClose} title="Data do jogo" size="sm">
      {match && (
        <form onSubmit={onSubmitForm(handleSubmit)} className="flex flex-col gap-4">
          <Input
            id="scheduledAt"
            name="scheduledAt"
            type="datetime-local"
            label="Data e horário"
            defaultValue={
              match.scheduledAt ? toDateTimeLocal(match.scheduledAt) : ''
            }
            error={schedule.fieldErrors.scheduledAt}
          />
          <p className="text-sm text-muted-foreground">
            Deixe em branco para marcar como &quot;a definir&quot;.
          </p>

          <ActionError message={schedule.error} />

          <div className="flex gap-2">
            <Button type="submit" fullWidth disabled={schedule.pending}>
              {schedule.pending ? 'Salvando…' : 'Salvar'}
            </Button>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
          </div>
        </form>
      )}
    </Modal>
  );
}

export function BracketManager({
  matches,
  teams,
  entryStage,
}: {
  matches: MatchDto[];
  teams: TeamDto[];
  entryStage: KnockoutStage | null;
}) {
  const [editingSlot, setEditingSlot] = useState<MatchDto | null>(null);
  const [scheduling, setScheduling] = useState<MatchDto | null>(null);
  const [scoring, setScoring] = useState<MatchDto | null>(null);

  const clear = useAction(clearBracketAction);
  const reopen = useAction(reopenMatchAction);

  if (matches.length === 0 || !entryStage) {
    return (
      <div className="flex flex-col gap-4">
        <h1 className="font-display text-3xl uppercase tracking-wide">
          Chaveamento
        </h1>
        <EmptyBracket teamsCount={teams.length} />
      </div>
    );
  }

  const stages = KNOCKOUT_STAGES.filter((stage) =>
    matches.some((match) => match.stage === stage),
  );

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl uppercase tracking-wide">
            Chaveamento
          </h1>
          <p className="text-sm text-muted-foreground">
            Escolha os times das {STAGE_LABELS[entryStage].toLowerCase()}; as
            rodadas seguintes se preenchem sozinhas.
          </p>
        </div>

        <Button
          variant="ghost"
          disabled={clear.pending}
          onClick={() => {
            if (confirm('Apagar todo o chaveamento? Os resultados serão perdidos.')) {
              clear.run({});
            }
          }}
        >
          <Trash2 className="h-4 w-4" />
          Apagar
        </Button>
      </div>

      <ActionError message={clear.error ?? reopen.error} />

      {stages.map((stage) => {
        const stageMatches = matches
          .filter((match) => match.stage === stage)
          .sort((a, b) => (a.slot ?? 0) - (b.slot ?? 0));
        const isEntry = stage === entryStage;

        return (
          <section key={stage}>
            <h2 className="mb-2.5 font-display text-xl uppercase tracking-widest text-accent">
              {STAGE_LABELS[stage]}
            </h2>

            <ul className="grid gap-2 sm:grid-cols-2">
              {stageMatches.map((match) => {
                const decided = match.status === 'FINISHED';
                const aWins = decided && (match.scoreA ?? 0) > (match.scoreB ?? 0);
                const ready = match.teamA && match.teamB;

                return (
                  <li key={match.id}>
                    <Card className="p-3">
                      <div className="mb-2 flex items-center justify-between gap-2">
                        <span className="font-display text-sm uppercase tracking-widest text-muted-foreground">
                          Jogo {match.slot}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {match.scheduledAt
                            ? formatDateTimeShort(match.scheduledAt)
                            : 'Data a definir'}
                        </span>
                      </div>

                      <div className="mb-3 flex flex-col gap-1">
                        {[
                          { team: match.teamA, score: match.scoreA, win: aWins },
                          {
                            team: match.teamB,
                            score: match.scoreB,
                            win: decided && !aWins,
                          },
                        ].map((side, i) => (
                          <div
                            key={i}
                            className="flex items-center justify-between gap-2"
                          >
                            <span
                              className={cn(
                                'truncate font-display text-lg uppercase leading-tight',
                                !side.team && 'italic text-muted-foreground',
                                side.win && 'text-primary',
                              )}
                            >
                              {side.team?.name ?? 'A definir'}
                            </span>
                            {side.score !== null && (
                              <span
                                className={cn(
                                  'font-display text-xl leading-none',
                                  side.win ? 'text-primary' : 'text-muted-foreground',
                                )}
                              >
                                {side.score}
                              </span>
                            )}
                          </div>
                        ))}
                      </div>

                      <div className="flex flex-wrap gap-2 border-t border-border pt-2.5">
                        {isEntry && !decided && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setEditingSlot(match)}
                          >
                            Times
                          </Button>
                        )}

                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setScheduling(match)}
                        >
                          <CalendarClock className="h-4 w-4" />
                          Data
                        </Button>

                        {decided ? (
                          <Button
                            size="sm"
                            variant="ghost"
                            disabled={reopen.pending}
                            onClick={() => reopen.run({ id: match.id })}
                          >
                            <RotateCcw className="h-4 w-4" />
                            Reabrir
                          </Button>
                        ) : (
                          <Button
                            size="sm"
                            disabled={!ready}
                            onClick={() => setScoring(match)}
                          >
                            <Target className="h-4 w-4" />
                            Placar
                          </Button>
                        )}
                      </div>
                    </Card>
                  </li>
                );
              })}
            </ul>
          </section>
        );
      })}

      <SlotEditor
        match={editingSlot}
        teams={teams}
        onClose={() => setEditingSlot(null)}
      />
      <ScheduleModal match={scheduling} onClose={() => setScheduling(null)} />
      <ScoreModal match={scoring} onClose={() => setScoring(null)} />
    </div>
  );
}
