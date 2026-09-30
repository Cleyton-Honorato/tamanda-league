'use client';

import { useRef, useState } from 'react';
import Link from 'next/link';
import { Dices, ImagePlus, Pencil, Plus, Trash2, X } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card, accentForIndex } from '@/components/ui/Card';
import { Input, Label, Select } from '@/components/ui/Field';
import { Modal } from '@/components/ui/Modal';
import { EmptyState } from '@/components/ui/EmptyState';
import { TeamCrest } from '@/components/brand/TeamCrest';
import { ActionError, onSubmitForm, useAction } from './useAction';
import { useCloudinaryUpload } from './useCloudinaryUpload';
import { deleteTeamAction, saveTeamAction } from '@/server/actions/teams';
import { commitTeamDrawAction, previewTeamDrawAction } from '@/server/actions/team-draw';
import type { GroupDto, TeamDto } from '@/lib/types';
import type { AthleteDto } from '@/server/services/athletes';
import type { TeamDrawPreview } from '@/server/services/team-draw';

function CrestPicker({
  value,
  onChange,
}: {
  value: { crestUrl: string | null; crestPublicId: string | null };
  onChange: (next: { crestUrl: string | null; crestPublicId: string | null }) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const { upload, uploading, error } = useCloudinaryUpload('escudos');

  return (
    <div>
      <Label>Escudo (opcional)</Label>
      <div className="flex items-center gap-3">
        <TeamCrest
          team={{
            id: '',
            name: '',
            shortName: '?',
            crestUrl: value.crestUrl,
          }}
          size="lg"
        />

        <div className="flex flex-col gap-2">
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={async (event) => {
              const file = event.target.files?.[0];
              event.target.value = '';
              if (!file) return;

              const [asset] = await upload([file]);
              if (asset) {
                onChange({ crestUrl: asset.url, crestPublicId: asset.publicId });
              }
            }}
          />

          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={uploading}
            onClick={() => inputRef.current?.click()}
          >
            <ImagePlus className="h-4 w-4" />
            {uploading ? 'Enviando…' : 'Escolher imagem'}
          </Button>

          {value.crestUrl && (
            <Button
              type="button"
              size="sm"
              variant="ghost"
              onClick={() => onChange({ crestUrl: null, crestPublicId: null })}
            >
              <X className="h-4 w-4" />
              Remover
            </Button>
          )}
        </div>
      </div>

      {error && <p className="mt-1.5 text-sm text-accent">{error}</p>}
    </div>
  );
}

export function TeamsManager({
  teams,
  groups,
  athletes,
}: {
  teams: TeamDto[];
  groups: GroupDto[];
  athletes: AthleteDto[];
}) {
  const [editing, setEditing] = useState<TeamDto | null>(null);
  const [creating, setCreating] = useState(false);
  const [crest, setCrest] = useState<{
    crestUrl: string | null;
    crestPublicId: string | null;
  }>({ crestUrl: null, crestPublicId: null });

  const save = useAction(saveTeamAction);
  const remove = useAction(deleteTeamAction);
  const previewDraw = useAction(previewTeamDrawAction);
  const confirmDraw = useAction(commitTeamDrawAction);
  const [proposal, setProposal] = useState<TeamDrawPreview | null>(null);
  const ratedCount = athletes.filter((athlete) => athlete.level !== null).length;
  const canDraw = teams.length === 0 && groups.length === 2 && athletes.length >= 4 && ratedCount === athletes.length;
  const rosterByTeam = new Map(teams.map((team) => [team.id, athletes.filter((athlete) => athlete.teamId === team.id)]));

  const open = creating || editing !== null;

  function startCreate() {
    setCrest({ crestUrl: null, crestPublicId: null });
    setCreating(true);
  }

  function startEdit(team: TeamDto) {
    setCrest({ crestUrl: team.crestUrl, crestPublicId: team.crestPublicId });
    setEditing(team);
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
        name: formData.get('name'),
        shortName: formData.get('shortName'),
        groupId: formData.get('groupId'),
        crestUrl: crest.crestUrl,
        crestPublicId: crest.crestPublicId,
      },
      close,
    );
  }

  const groupName = (id: string | null) =>
    groups.find((group) => group.id === id)?.name ?? 'Sem grupo';

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl uppercase tracking-wide">Times</h1>
          <p className="text-sm text-muted-foreground">
            {teams.length} time(s) inscritos.
          </p>
        </div>
        <Button onClick={startCreate}>
          <Plus className="h-4 w-4" />
          Novo
        </Button>
      </div>

      <ActionError message={remove.error} />

      {teams.length === 0 && (
        <Card className="border-primary/25 bg-[linear-gradient(115deg,#0b281a,#111a15_60%,#21170f)] p-5 sm:p-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="font-display text-xs uppercase tracking-[.24em] text-accent">Formação dos elencos</p>
              <h2 className="mt-2 font-display text-2xl uppercase">Sorteio equilibrado 3x3</h2>
              <p className="mt-2 max-w-xl text-sm text-muted-foreground">Quatro atletas por time. O sorteio distribui as estrelas entre as equipes e alterna os times entre as duas conferências. Atletas excedentes ficam como reservas.</p>
              <p className="mt-2 text-xs text-foreground/75">{ratedCount}/{athletes.length} atletas avaliados · {groups.length}/2 conferências</p>
            </div>
            <Button disabled={!canDraw || previewDraw.pending} onClick={() => previewDraw.run({}, setProposal)}>
              <Dices className="h-4 w-4" /> {previewDraw.pending ? 'Sorteando…' : proposal ? 'Sortear novamente' : 'Gerar prévia'}
            </Button>
          </div>
          {!canDraw && <p className="mt-4 text-sm text-accent">{groups.length !== 2 ? 'Cadastre as duas conferências.' : ratedCount < athletes.length ? <><Link className="underline" href="/admin/atletas">Avalie os atletas</Link> antes de sortear.</> : 'Cadastre ao menos quatro atletas.'}</p>}
          <ActionError message={previewDraw.error} />
          <ActionError message={confirmDraw.error} />
        </Card>
      )}

      {proposal && teams.length === 0 && (
        <section className="space-y-4" aria-label="Prévia do sorteio">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="font-display text-xl uppercase">Prévia · {proposal.teams.length} times</h2>
              <p className="text-xs text-muted-foreground">Confira os elencos antes de gravar o sorteio.</p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setProposal(null)}>Descartar</Button>
              <Button disabled={confirmDraw.pending} onClick={() => confirmDraw.run({ seed: proposal.seed, fingerprint: proposal.fingerprint }, () => setProposal(null))}>{confirmDraw.pending ? 'Confirmando…' : 'Confirmar times'}</Button>
            </div>
          </div>
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {proposal.teams.map((team) => <Card key={team.name} className="p-4">
              <div className="flex items-center justify-between gap-3">
                <div><h3 className="font-display text-lg uppercase">{team.name}</h3><p className="text-xs text-muted-foreground">{team.groupName}</p></div>
                <span className="rounded-md bg-primary/10 px-2 py-1 font-display text-sm text-primary">{team.totalLevel} pts</span>
              </div>
              <ol className="mt-3 space-y-1 border-t border-border pt-3 text-sm">
                {team.athletes.map((athlete) => <li key={athlete.id} className="flex justify-between gap-2"><span className="truncate">{athlete.name}</span><span className="shrink-0 text-accent">{'★'.repeat(athlete.level)}</span></li>)}
              </ol>
            </Card>)}
          </div>
          {proposal.reserves.length > 0 && <p className="rounded-lg border border-accent/30 bg-accent/10 p-3 text-sm">Reserva{proposal.reserves.length > 1 ? 's' : ''} sem time: {proposal.reserves.map((athlete) => athlete.name).join(', ')}.</p>}
        </section>
      )}

      {groups.length === 0 && (
        <p className="rounded-[var(--radius-md)] border border-accent/40 bg-accent/10 px-3 py-2 text-sm text-accent">
          Crie os grupos primeiro para conseguir alocar os times.
        </p>
      )}

      {teams.length === 0 && !proposal ? (
        <EmptyState
          title="Nenhum time"
          description="Cadastre os times que vão disputar o campeonato."
        />
      ) : teams.length > 0 ? (
        <ul className="flex flex-col gap-2">
          {teams.map((team, index) => (
            <li key={team.id}>
              <Card accent={accentForIndex(index)} className="flex items-center gap-3 p-3">
                <TeamCrest
                  team={team}
                  size="md"
                  accent={index % 2 === 0 ? 'green' : 'orange'}
                />

                <div className="min-w-0 flex-1">
                  <p className="truncate font-display text-xl uppercase leading-tight">
                    {team.name}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {team.shortName} · {groupName(team.groupId)}
                  </p>
                  <div className="mt-2 text-xs text-muted-foreground">
                    <p className="font-display uppercase tracking-wide text-foreground/75">Elenco · {rosterByTeam.get(team.id)?.length ?? 0}/4 · {rosterByTeam.get(team.id)?.reduce((sum, athlete) => sum + (athlete.level ?? 0), 0) ?? 0} pts</p>
                    {(rosterByTeam.get(team.id)?.length ?? 0) > 0 && <p className="mt-1">{rosterByTeam.get(team.id)?.map((athlete) => `${athlete.name} (${athlete.level ?? '–'}★)`).join(' · ')}</p>}
                  </div>
                </div>

                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => startEdit(team)}
                  aria-label={`Editar ${team.name}`}
                >
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  disabled={remove.pending}
                  onClick={() => {
                    if (confirm(`Excluir ${team.name}?`)) {
                      remove.run({ id: team.id });
                    }
                  }}
                  aria-label={`Excluir ${team.name}`}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </Card>
            </li>
          ))}
        </ul>
      ) : null}

      <Modal open={open} onClose={close} title={editing ? 'Editar time' : 'Novo time'}>
        <form onSubmit={onSubmitForm(handleSubmit)} className="flex flex-col gap-4">
          <Input
            id="name"
            name="name"
            label="Nome do time"
            placeholder="Feras do Bairro"
            defaultValue={editing?.name ?? ''}
            required
            error={save.fieldErrors.name}
          />

          <Input
            id="shortName"
            name="shortName"
            label="Sigla"
            placeholder="FER"
            maxLength={5}
            defaultValue={editing?.shortName ?? ''}
            required
            error={save.fieldErrors.shortName}
            className="uppercase"
          />

          <Select
            id="groupId"
            name="groupId"
            label="Grupo"
            defaultValue={editing?.groupId ?? ''}
            error={save.fieldErrors.groupId}
          >
            <option value="">Sem grupo</option>
            {groups.map((group) => (
              <option key={group.id} value={group.id}>
                {group.name}
              </option>
            ))}
          </Select>

          <CrestPicker value={crest} onChange={setCrest} />

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
