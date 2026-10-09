'use client';

import { useEffect, useMemo, useRef, useState, type PointerEvent as ReactPointerEvent } from 'react';
import Link from 'next/link';
import { createPortal } from 'react-dom';
import { ArrowRightLeft, Dices, GripVertical, ImagePlus, Pencil, Plus, Trash2, X } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input, Label, Select } from '@/components/ui/Field';
import { Modal } from '@/components/ui/Modal';
import { EmptyState } from '@/components/ui/EmptyState';
import { TeamCrest } from '@/components/brand/TeamCrest';
import { ActionError, onSubmitForm, useAction } from './useAction';
import { useCloudinaryUpload } from './useCloudinaryUpload';
import { deleteTeamAction, saveTeamAction, transferAthleteAction } from '@/server/actions/teams';
import { commitTeamDrawAction, previewTeamDrawAction } from '@/server/actions/team-draw';
import type { GroupDto, TeamDto } from '@/lib/types';
import type { AthleteDto } from '@/server/services/athletes';
import type { TeamDrawPreview } from '@/server/services/team-draw';

function formatPoints(value: number) {
  return value.toLocaleString('pt-BR');
}

type DropTarget = { teamId: string | null; athleteId: string | null };
type DragState = { athlete: AthleteDto; x: number; y: number; target: DropTarget | null };

function dropTargetAt(x: number, y: number): DropTarget | null {
  const element = document.elementFromPoint(x, y) as HTMLElement | null;
  if (element?.closest('[data-drop-reserve]')) return { teamId: null, athleteId: null };
  const team = element?.closest<HTMLElement>('[data-drop-team]');
  if (!team) return null;
  const athlete = element?.closest<HTMLElement>('[data-drop-athlete]');
  return { teamId: team.dataset.dropTeam ?? null, athleteId: athlete?.dataset.dropAthlete ?? null };
}

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
  const [moving, setMoving] = useState<AthleteDto | null>(null);
  const [destinationTeamId, setDestinationTeamId] = useState('');
  const [swapAthleteId, setSwapAthleteId] = useState('');
  const [crest, setCrest] = useState<{
    crestUrl: string | null;
    crestPublicId: string | null;
  }>({ crestUrl: null, crestPublicId: null });

  const save = useAction(saveTeamAction);
  const remove = useAction(deleteTeamAction);
  const transfer = useAction(transferAthleteAction);
  const runTransfer = transfer.run;
  const resetTransfer = transfer.reset;
  const [drag, setDrag] = useState<DragState | null>(null);
  const dragRef = useRef<{ athlete: AthleteDto; pointerId: number; startX: number; startY: number; moved: boolean } | null>(null);
  const dragEnabled = useRef(false);
  const previewDraw = useAction(previewTeamDrawAction);
  const confirmDraw = useAction(commitTeamDrawAction);
  const [proposal, setProposal] = useState<TeamDrawPreview | null>(null);
  const ratedCount = athletes.filter((athlete) => athlete.level !== null).length;
  const canDraw = teams.length === 0 && groups.length === 2 && athletes.length >= 4 && ratedCount === athletes.length;
  const rosterByTeam = useMemo(() => new Map(teams.map((team) => [team.id, athletes.filter((athlete) => athlete.teamId === team.id)])), [teams, athletes]);

  const open = creating || editing !== null;
  const destinationRoster = rosterByTeam.get(destinationTeamId) ?? [];
  const requiresSwap = destinationTeamId !== '' && destinationRoster.length >= 4;

  useEffect(() => {
    function onMove(event: PointerEvent) {
      const current = dragRef.current;
      if (!current || current.pointerId !== event.pointerId) return;
      if (!current.moved && Math.hypot(event.clientX - current.startX, event.clientY - current.startY) < 6) return;
      current.moved = true;
      event.preventDefault();
      const target = dropTargetAt(event.clientX, event.clientY);
      setDrag({ athlete: current.athlete, x: event.clientX, y: event.clientY, target });
      if (event.clientY < 70) window.scrollBy(0, -18);
      else if (event.clientY > window.innerHeight - 70) window.scrollBy(0, 18);
    }
    function onEnd(event: PointerEvent) {
      const current = dragRef.current;
      if (!current || current.pointerId !== event.pointerId) return;
      dragRef.current = null;
      setDrag(null);
      if (!current.moved || !dragEnabled.current) return;
      const target = dropTargetAt(event.clientX, event.clientY);
      if (!target || target.teamId === current.athlete.teamId) return;
      const roster = target.teamId ? rosterByTeam.get(target.teamId) ?? [] : [];
      const swapId = target.athleteId && target.athleteId !== current.athlete.id ? target.athleteId : null;
      if (target.teamId && roster.length >= 4 && !swapId) {
        setMoving(current.athlete);
        setDestinationTeamId(target.teamId);
        setSwapAthleteId('');
        resetTransfer();
        return;
      }
      runTransfer({ athleteId: current.athlete.id, destinationTeamId: target.teamId, swapAthleteId: swapId });
    }
    function onCancel() {
      dragRef.current = null;
      setDrag(null);
    }
    window.addEventListener('pointermove', onMove, { passive: false });
    window.addEventListener('pointerup', onEnd);
    window.addEventListener('pointercancel', onCancel);
    return () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onEnd);
      window.removeEventListener('pointercancel', onCancel);
    };
  }, [rosterByTeam, runTransfer, resetTransfer]);

  function startDrag(event: ReactPointerEvent<HTMLButtonElement>, athlete: AthleteDto) {
    if (transfer.pending || event.button !== 0) return;
    dragRef.current = { athlete, pointerId: event.pointerId, startX: event.clientX, startY: event.clientY, moved: false };
    dragEnabled.current = true;
  }

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
  const teamSections = [
    ...groups.map((group) => ({ id: group.id, name: group.name, teams: teams.filter((team) => team.groupId === group.id) })),
    ...(teams.some((team) => !groups.some((group) => group.id === team.groupId))
      ? [{ id: 'unassigned', name: 'Sem grupo', teams: teams.filter((team) => !groups.some((group) => group.id === team.groupId)) }]
      : []),
  ];

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl uppercase tracking-wide">Times</h1>
          <p className="text-sm text-muted-foreground">
            {teams.length} time(s) inscritos.
          </p>
          {teams.length > 0 && <p className="mt-1 text-xs text-muted-foreground">Arraste pela alça para outro time ou sobre um jogador para trocar. No celular, use a mesma alça ou o botão de troca.</p>}
        </div>
        <div className="flex flex-wrap gap-2">
          {teams.length > 0 && <Link href="/admin/grupos" className="inline-flex min-h-11 items-center gap-2 rounded-[var(--radius-md)] border border-border px-4 font-display text-sm uppercase tracking-wide text-foreground transition-colors hover:border-primary hover:text-primary">Sortear grupos</Link>}
          <Button onClick={startCreate}>
            <Plus className="h-4 w-4" />
            Novo
          </Button>
        </div>
      </div>

      <ActionError message={remove.error} />
      <ActionError message={transfer.error} />

      {teams.length === 0 && (
        <Card className="border-primary/25 bg-[linear-gradient(115deg,#0b281a,#111a15_60%,#21170f)] p-5 sm:p-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="font-display text-xs uppercase tracking-[.24em] text-accent">Formação dos elencos</p>
              <h2 className="mt-2 font-display text-2xl uppercase">Sorteio equilibrado 3x3</h2>
              <p className="mt-2 max-w-xl text-sm text-muted-foreground">Quatro atletas por time. O sorteio equilibra os elencos; depois você sorteia as conferências. Atletas excedentes ficam como reservas.</p>
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
                <div><h3 className="font-display text-lg uppercase">{team.name}</h3><p className="text-xs text-muted-foreground">Conferência a sortear</p></div>
                <span className="rounded-md bg-primary/10 px-2 py-1 font-display text-sm text-primary">{formatPoints(team.totalLevel)} pts</span>
              </div>
              <ol className="mt-3 space-y-1 border-t border-border pt-3 text-sm">
                {team.athletes.map((athlete) => <li key={athlete.id} className="flex justify-between gap-2"><span className="truncate">{athlete.name}</span><span className="shrink-0 text-accent">{athlete.level.toLocaleString('pt-BR')} ★</span></li>)}
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
        <div className="space-y-8">
          {teamSections.map((section) => <section key={section.id} aria-label={section.name} className="space-y-4">
            <div className={`flex items-end justify-between gap-3 border-b pb-3 ${section.name.toLowerCase().includes('laranja') ? 'border-accent/60' : 'border-primary/60'}`}>
              <h2 className={`font-display text-2xl uppercase ${section.name.toLowerCase().includes('laranja') ? 'text-accent' : 'text-primary'}`}>{section.name}</h2>
              <span className="font-display text-sm uppercase text-muted-foreground">{section.teams.length} {section.teams.length === 1 ? 'time' : 'times'}</span>
            </div>
            <div className="grid gap-4 md:grid-cols-2 2xl:grid-cols-3">
          {section.teams.map((team) => (
            <Card key={team.id} data-drop-team={team.id} accent={groupName(team.groupId).toLowerCase().includes('laranja') ? 'orange' : 'green'} className={`flex min-w-0 flex-col p-5 transition-colors ${drag?.target?.teamId === team.id ? 'border-primary bg-primary/10' : ''}`}>
              <div className="flex items-start gap-3">
                <TeamCrest
                  team={team}
                  size="lg"
                  accent={groupName(team.groupId).toLowerCase().includes('laranja') ? 'orange' : 'green'}
                />

                <div className="min-w-0 flex-1 pt-1">
                  <h2 className="truncate font-display text-2xl uppercase leading-tight">
                    {team.name}
                  </h2>
                  <p className="mt-1 text-xs uppercase tracking-wide text-muted-foreground">
                    {team.shortName} · {groupName(team.groupId)}
                  </p>
                </div>
                <button
                  type="button"
                  className="rounded-md border border-border p-2 text-muted-foreground transition-colors hover:border-primary hover:text-primary cursor-pointer"
                  onClick={() => startEdit(team)}
                  aria-label={`Editar ${team.name}`}
                >
                  <Pencil className="h-4 w-4" />
                </button>
              </div>

              <div className="mt-5 flex items-center justify-between border-y border-border py-3 font-display text-xs uppercase tracking-wider">
                <span>Elenco {rosterByTeam.get(team.id)?.length ?? 0}/4</span>
                <span className={groupName(team.groupId).toLowerCase().includes('laranja') ? 'text-accent' : 'text-primary'}>{formatPoints(rosterByTeam.get(team.id)?.reduce((sum, athlete) => sum + (athlete.level ?? 0), 0) ?? 0)} pts</span>
              </div>
              <div className="mt-3 flex-1 space-y-2">
                {(rosterByTeam.get(team.id) ?? []).map((athlete, position) => (
                  <div key={athlete.id} data-drop-athlete={athlete.id} className={`flex items-center gap-2 rounded-lg border bg-background/40 px-2 py-2.5 transition-colors ${drag?.target?.athleteId === athlete.id && drag.athlete.id !== athlete.id ? 'border-accent bg-accent/15' : 'border-border/75'}`}>
                    <button type="button" onPointerDown={(event) => startDrag(event, athlete)} className="touch-none cursor-grab rounded p-1 text-muted-foreground active:cursor-grabbing" aria-label={`Arrastar ${athlete.name}`} title="Arraste para outro time ou sobre um jogador">
                      <GripVertical className="h-4 w-4" />
                    </button>
                    <span className="font-display text-sm text-muted-foreground">{String(position + 1).padStart(2, '0')}</span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium" title={athlete.name}>{athlete.name}</p>
                      {athlete.nickname && <p className="truncate text-xs text-muted-foreground">{athlete.nickname}</p>}
                    </div>
                    <span className="shrink-0 font-display text-sm text-accent">{athlete.level === null ? '—' : formatPoints(athlete.level)} ★</span>
                    <button type="button" onClick={() => { setMoving(athlete); setDestinationTeamId(''); setSwapAthleteId(''); transfer.reset(); }} className="cursor-pointer rounded-md p-2 text-muted-foreground transition-colors hover:bg-primary/15 hover:text-primary" aria-label={`Mover ${athlete.name} para outro time`} title="Mover ou trocar atleta">
                      <ArrowRightLeft className="h-4 w-4" />
                    </button>
                  </div>
                ))}
                {(rosterByTeam.get(team.id)?.length ?? 0) === 0 && <p className="py-6 text-center text-sm text-muted-foreground">Nenhum atleta neste time.</p>}
              </div>
              <div className="mt-4 flex justify-end border-t border-border pt-3">
                <Button
                  size="sm" variant="ghost"
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
              </div>
            </Card>
          ))}
            </div>
          </section>)}
        </div>
      ) : null}

      {teams.length > 0 && <Card data-drop-reserve="true" className={`p-5 transition-colors ${drag?.target?.teamId === null && drag?.target !== null ? 'border-primary bg-primary/10' : ''}`}>
        <h2 className="font-display text-xl uppercase">Atletas sem time</h2>
        <p className="mt-1 text-xs text-muted-foreground">Solte aqui para deixar um atleta na reserva.</p>
        <div className="mt-4 flex flex-wrap gap-2">
          {athletes.filter((athlete) => !athlete.teamId).map((athlete) => <div key={athlete.id} className="flex items-center gap-1 rounded-lg border border-border bg-elevated px-2 py-1.5 text-sm">
            <button type="button" onPointerDown={(event) => startDrag(event, athlete)} className="touch-none cursor-grab p-1 text-muted-foreground active:cursor-grabbing" aria-label={`Arrastar ${athlete.name}`} title="Arraste para um time"><GripVertical className="h-4 w-4" /></button>
            <span>{athlete.name}</span><span className="font-display text-accent">{athlete.level === null ? '—' : formatPoints(athlete.level)} ★</span>
            <button type="button" onClick={() => { setMoving(athlete); setDestinationTeamId(''); setSwapAthleteId(''); transfer.reset(); }} className="cursor-pointer rounded p-1 text-muted-foreground hover:text-primary" aria-label={`Mover ${athlete.name}`}><ArrowRightLeft className="h-4 w-4" /></button>
          </div>)}
          {!athletes.some((athlete) => !athlete.teamId) && <p className="text-sm text-muted-foreground">Nenhum atleta na reserva.</p>}
        </div>
      </Card>}

      {drag && createPortal(<div aria-hidden="true" className="pointer-events-none fixed z-[100] max-w-64 -translate-x-1/2 -translate-y-1/2 rounded-lg border border-primary bg-surface px-4 py-3 shadow-xl" style={{ left: drag.x, top: drag.y }}>
        <p className="truncate font-display text-base uppercase">{drag.athlete.name}</p>
        <p className="text-xs text-muted-foreground">{drag.target?.athleteId ? 'Solte para trocar' : drag.target?.teamId ? 'Solte para mover' : drag.target ? 'Solte na reserva' : 'Arraste até um time'}</p>
      </div>, document.body)}

      <Modal open={moving !== null} onClose={() => setMoving(null)} title="Mover atleta">
        {moving && <form className="space-y-4" onSubmit={(event) => { event.preventDefault(); transfer.run({ athleteId: moving.id, destinationTeamId: destinationTeamId || null, swapAthleteId: requiresSwap ? swapAthleteId || null : null }, () => setMoving(null)); }}>
          <div className="rounded-lg border border-border bg-elevated p-4">
            <p className="font-display text-lg uppercase">{moving.name}</p>
            <p className="text-sm text-muted-foreground">Time atual: {teams.find((team) => team.id === moving.teamId)?.name ?? 'Sem time'}</p>
          </div>
          <Select id="destinationTeamId" label="Destino" value={destinationTeamId} onChange={(event) => { setDestinationTeamId(event.target.value); setSwapAthleteId(''); }}>
            <option value="">Sem time / reserva</option>
            {teams.filter((team) => team.id !== moving.teamId).map((team) => <option key={team.id} value={team.id}>{team.name} · {groupName(team.groupId)} · {rosterByTeam.get(team.id)?.length ?? 0}/4</option>)}
          </Select>
          {requiresSwap && <Select id="swapAthleteId" label="Time cheio: escolha quem vem no lugar" value={swapAthleteId} required onChange={(event) => setSwapAthleteId(event.target.value)}>
            <option value="">Selecione um atleta</option>
            {destinationRoster.map((athlete) => <option key={athlete.id} value={athlete.id}>{athlete.name} · {athlete.level === null ? '—' : formatPoints(athlete.level)} ★</option>)}
          </Select>}
          <p className="text-xs text-muted-foreground">Times com jogos registrados não podem ter o elenco alterado.</p>
          <ActionError message={transfer.error} />
          <div className="flex gap-2">
            <Button type="submit" fullWidth disabled={transfer.pending || (moving.teamId === null && !destinationTeamId) || (requiresSwap && !swapAthleteId)}>{transfer.pending ? 'Salvando…' : requiresSwap ? 'Confirmar troca' : 'Confirmar mudança'}</Button>
            <Button type="button" variant="outline" onClick={() => setMoving(null)}>Cancelar</Button>
          </div>
        </form>}
      </Modal>

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
