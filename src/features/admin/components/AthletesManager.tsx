'use client';

import { useState } from 'react';
import { Pencil, Plus, Star, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input, Select } from '@/components/ui/Field';
import { Modal } from '@/components/ui/Modal';
import { ActionError, onSubmitForm, useAction } from './useAction';
import { deleteAthleteAction, saveAthleteAction, setAthleteLevelAction } from '@/server/actions/athletes';
import type { AthleteDto } from '@/server/services/athletes';
import type { TeamDto } from '@/lib/types';

function initialsFor(name: string) {
  const parts = name.trim().split(/\s+/);
  return `${parts[0]?.[0] ?? ''}${parts.length > 1 ? parts[parts.length - 1]?.[0] ?? '' : ''}`.toUpperCase();
}

export function AthletesManager({ athletes, teams }: { athletes: AthleteDto[]; teams: TeamDto[] }) {
  const [editing, setEditing] = useState<AthleteDto | null>(null);
  const [creating, setCreating] = useState(false);
  const [level, setLevel] = useState<number | null>(null);
  const save = useAction(saveAthleteAction);
  const rate = useAction(setAthleteLevelAction);
  const remove = useAction(deleteAthleteAction);

  function close() {
    setEditing(null);
    setCreating(false);
    setLevel(null);
    save.reset();
  }

  function submit(data: FormData) {
    save.run({ id: editing?.id, name: data.get('name'), nickname: data.get('nickname'), level, teamId: data.get('teamId') || null }, close);
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl uppercase tracking-wide">Atletas</h1>
          <p className="text-sm text-muted-foreground">{athletes.length} inscritos · {athletes.filter((athlete) => athlete.level !== null).length} avaliados · {athletes.filter((athlete) => !athlete.teamId).length} aguardando time</p>
        </div>
        <Button onClick={() => setCreating(true)}><Plus className="h-4 w-4" /> Novo</Button>
      </div>

      <ActionError message={remove.error} />
      <ActionError message={rate.error} />
      {athletes.length === 0 ? (
        <p className="rounded-[var(--radius-lg)] border border-border bg-surface p-6 text-muted-foreground">Nenhum atleta cadastrado.</p>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
          {athletes.map((athlete) => (
            <li key={athlete.id}>
              <Card className="relative flex h-full min-h-[248px] flex-col overflow-hidden rounded-2xl border-white/10 bg-[linear-gradient(145deg,#171e1b_0%,#0d1311_65%)] shadow-[0_14px_30px_#0003]">
                <span aria-hidden className="absolute right-0 top-0 h-16 w-16 border-r-2 border-t-2 border-primary/40 [clip-path:polygon(30%_0,100%_0,100%_100%)]" />
                <div className="relative flex flex-1 flex-col p-5 pb-4">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-display text-[11px] uppercase tracking-[0.24em] text-muted-foreground">Atleta · 3x3</span>
                    <div className="flex shrink-0 gap-1">
                      <button type="button" onClick={() => { setLevel(athlete.level); setEditing(athlete); }} aria-label={`Editar ${athlete.name}`} title="Editar atleta" className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-lg border border-white/10 bg-black/15 text-muted-foreground transition-colors hover:border-primary/50 hover:bg-primary/10 hover:text-primary focus-visible:outline-2 focus-visible:outline-primary"><Pencil className="h-4 w-4" /></button>
                      <button type="button" disabled={remove.pending} onClick={() => { if (confirm(`Excluir ${athlete.name}?`)) remove.run({ id: athlete.id }); }} aria-label={`Excluir ${athlete.name}`} title="Excluir atleta" className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-lg border border-white/10 bg-black/15 text-muted-foreground transition-colors hover:border-red-400/50 hover:bg-red-400/10 hover:text-red-300 focus-visible:outline-2 focus-visible:outline-primary disabled:cursor-not-allowed disabled:opacity-50"><Trash2 className="h-4 w-4" /></button>
                    </div>
                  </div>

                  <div className="mt-4 flex min-w-0 items-center gap-3">
                    <span aria-hidden className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl border border-white/15 bg-[linear-gradient(135deg,#27312d,#151c19)] font-display text-2xl text-foreground shadow-inner shadow-black/30">{initialsFor(athlete.name)}</span>
                    <div className="min-w-0">
                      {athlete.nickname ? (
                        <p className="truncate font-display text-base uppercase tracking-wide text-sky-200" title={`Apelido: ${athlete.nickname}`}>“{athlete.nickname}”</p>
                      ) : (
                        <p className="font-display text-xs uppercase tracking-[0.18em] text-muted-foreground">Elenco</p>
                      )}
                      <p className="mt-1 text-xs text-muted-foreground">{athlete.teamId ? teams.find((team) => team.id === athlete.teamId)?.name ?? 'Com time' : 'Aguardando time'}</p>
                    </div>
                  </div>

                  <p className="mt-4 max-w-full font-display text-[clamp(1.35rem,1.7vw,1.8rem)] uppercase leading-[1.05] text-foreground [overflow-wrap:anywhere]" title={athlete.name}>{athlete.name}</p>
                </div>

                <div className="relative border-t border-white/10 bg-black/20 px-5 py-3">
                  <div className="mb-2 flex items-center justify-between gap-2 font-display text-xs uppercase tracking-[0.16em]">
                    <span className="text-muted-foreground">Nível</span>
                    <span className={athlete.level === null ? 'text-muted-foreground' : 'text-accent'}>{athlete.level === null ? 'A definir' : `${athlete.level} de 5`}</span>
                  </div>
                  <div className="flex items-center gap-1.5" role="group" aria-label={`Avaliar ${athlete.name}: ${athlete.level === null ? 'sem nível' : `${athlete.level} de 5 estrelas`}`}>
                    {Array.from({ length: 5 }, (_, star) => {
                      const value = star + 1;
                      const selected = athlete.level !== null && value <= athlete.level;
                      return <button key={value} type="button" disabled={rate.pending} onClick={() => rate.run({ id: athlete.id, level: value })} aria-label={`${value} ${value === 1 ? 'estrela' : 'estrelas'} para ${athlete.name}`} aria-pressed={athlete.level === value} title={`Definir ${value} ${value === 1 ? 'estrela' : 'estrelas'}`} className={`flex h-9 w-9 cursor-pointer items-center justify-center rounded-md border transition-colors hover:border-accent/60 hover:bg-accent/10 hover:text-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:cursor-wait ${selected ? 'border-accent/45 bg-accent/15 text-accent' : 'border-white/10 bg-white/[0.04] text-muted-foreground'}`}><Star className={`h-5 w-5 ${selected ? 'fill-current' : ''}`} /></button>;
                    })}
                  </div>
                </div>
              </Card>
            </li>
          ))}
        </ul>
      )}

      <Modal open={creating || editing !== null} onClose={close} title={editing ? 'Editar atleta' : 'Novo atleta'}>
        <form onSubmit={onSubmitForm(submit)} className="flex flex-col gap-4">
          <Input id="name" name="name" label="Nome" defaultValue={editing?.name ?? ''} required error={save.fieldErrors.name} />
          <Input id="nickname" name="nickname" label="Apelido (opcional)" defaultValue={editing?.nickname ?? ''} error={save.fieldErrors.nickname} />
          {teams.length > 0 && <Select id="teamId" name="teamId" label="Time" defaultValue={editing?.teamId ?? ''} error={save.fieldErrors.teamId}>
            <option value="">Sem time / reserva</option>
            {teams.map((team) => <option key={team.id} value={team.id} disabled={team.id !== editing?.teamId && athletes.filter((athlete) => athlete.teamId === team.id).length >= 4}>{team.name} · {athletes.filter((athlete) => athlete.teamId === team.id).length}/4</option>)}
          </Select>}
          <fieldset>
            <legend className="mb-1.5 font-display text-sm uppercase tracking-widest text-muted-foreground">Nível do atleta</legend>
            <div className="flex items-center gap-1">
              {Array.from({ length: 5 }, (_, index) => {
                const value = index + 1;
                return <button key={value} type="button" onClick={() => setLevel(value)} aria-label={`${value} ${value === 1 ? 'estrela' : 'estrelas'}`} aria-pressed={level === value} className="flex h-10 w-10 items-center justify-center rounded-md text-accent focus-visible:outline-2 focus-visible:outline-primary"><Star className={`h-6 w-6 ${level !== null && value <= level ? 'fill-current' : 'opacity-40'}`} /></button>;
              })}
              {level !== null && <button type="button" onClick={() => setLevel(null)} className="ml-2 text-xs text-muted-foreground underline focus-visible:outline-2 focus-visible:outline-primary">Limpar</button>}
            </div>
            <p className="mt-1 text-xs text-muted-foreground">{level === null ? 'Ainda não avaliado' : `${level} de 5 estrelas`}</p>
            {save.fieldErrors.level && <p className="mt-1 text-xs text-accent">{save.fieldErrors.level}</p>}
          </fieldset>
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
