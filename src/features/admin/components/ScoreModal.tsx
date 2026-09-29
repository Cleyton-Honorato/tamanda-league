'use client';

import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Field';
import { Modal } from '@/components/ui/Modal';
import { ActionError, onSubmitForm, useAction } from './useAction';
import { finishMatchAction } from '@/server/actions/matches';
import type { MatchDto } from '@/lib/types';

export function ScoreModal({
  match,
  onClose,
}: {
  match: MatchDto | null;
  onClose: () => void;
}) {
  const finish = useAction(finishMatchAction);

  function handleSubmit(formData: FormData) {
    if (!match) return;
    finish.run(
      {
        id: match.id,
        scoreA: formData.get('scoreA'),
        scoreB: formData.get('scoreB'),
      },
      onClose,
    );
  }

  return (
    <Modal
      open={match !== null}
      onClose={onClose}
      title="Placar do jogo"
      size="sm"
    >
      {match && (
        <form onSubmit={onSubmitForm(handleSubmit)} className="flex flex-col gap-4">
          <div className="grid grid-cols-[1fr_auto_1fr] items-end gap-3">
            <Input
              id="scoreA"
              name="scoreA"
              type="number"
              inputMode="numeric"
              min={0}
              max={200}
              label={match.teamA?.shortName ?? 'Time A'}
              defaultValue={match.scoreA ?? ''}
              required
              className="text-center font-display text-2xl"
              error={finish.fieldErrors.scoreA}
            />
            <span className="pb-3 font-display text-xl text-muted-foreground">
              ×
            </span>
            <Input
              id="scoreB"
              name="scoreB"
              type="number"
              inputMode="numeric"
              min={0}
              max={200}
              label={match.teamB?.shortName ?? 'Time B'}
              defaultValue={match.scoreB ?? ''}
              required
              className="text-center font-display text-2xl"
              error={finish.fieldErrors.scoreB}
            />
          </div>

          <p className="text-center text-sm text-muted-foreground">
            {match.teamA?.name ?? 'A definir'} × {match.teamB?.name ?? 'A definir'}
          </p>

          <ActionError message={finish.error} />

          <div className="flex gap-2">
            <Button type="submit" fullWidth disabled={finish.pending}>
              {finish.pending ? 'Salvando…' : 'Encerrar jogo'}
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
