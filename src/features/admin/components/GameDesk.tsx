'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { ArrowLeft, Check, Flag, Pause, Play, RefreshCw, Undo2 } from 'lucide-react';
import { remainingTime, gameTotals, type GameCommand } from '@/lib/live-game';
import type { readLiveGame } from '@/server/services/live-game';
import { changeLiveGameAction, finishLiveGameAction, readLiveGameAction } from '@/server/actions/live-game';
import type { MatchDto } from '@/lib/types';
import { STAGE_LABELS } from '@/lib/types';
import { TeamCrest } from '@/components/brand/TeamCrest';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Field';

type DeskState = Awaited<ReturnType<typeof readLiveGame>>;
function clockText(ms: number) {
  const seconds = Math.ceil(ms / 1000);
  return `${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`;
}

export function GameDesk({ match, initial }: { match: MatchDto; initial: DeskState }) {
  const [state, setState] = useState(initial);
  const [now, setNow] = useState(initial.serverNow);
  const anchor = useRef<{ server: number; local: number } | null>(null);
  const busy = useRef(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [finishOpen, setFinishOpen] = useState(false);
  const [clockOpen, setClockOpen] = useState(false);
  const [saved, setSaved] = useState(false);

  function accept(next: DeskState) {
    anchor.current = { server: next.serverNow, local: performance.now() };
    setNow(next.serverNow);
    setState(next);
  }
  useEffect(() => {
    anchor.current = { server: initial.serverNow, local: performance.now() };
    const timer = window.setInterval(() => {
      if (anchor.current) setNow(anchor.current.server + performance.now() - anchor.current.local);
    }, 200);
    return () => window.clearInterval(timer);
  }, [initial.serverNow]);

  async function operate(command?: GameCommand, finish = false) {
    if (busy.current) return;
    busy.current = true;
    setPending(true); setError(null); setSaved(false);
    try {
      const result = finish
        ? await finishLiveGameAction({ id: match.id, version: state.version })
        : command
          ? await changeLiveGameAction({ id: match.id, version: state.version, command })
          : await readLiveGameAction({ id: match.id });
      if (!result.ok) { setError(result.error); return; }
      accept(result.data); setSaved(Boolean(command || finish)); setClockOpen(false); setFinishOpen(false);
    } catch { setError('Não foi possível confirmar o salvamento. Atualize a mesa para conferir o último registro antes de continuar.'); }
    finally { busy.current = false; setPending(false); }
  }
  const remaining = remainingTime(state.game, now);
  const running = state.game.startedAt !== null && remaining > 0;
  const finished = state.status === 'FINISHED';
  const totals = gameTotals(state.game);
  const disabled = pending || finished || Boolean(error);
  const last = state.game.baskets.at(-1);

  return <div className="space-y-6">
    <div className="flex flex-wrap items-center justify-between gap-4">
      <div><Link href={match.stage === 'GROUP' ? '/admin/jogos' : '/admin/chaveamento'} className="inline-flex items-center gap-2 text-sm text-muted-foreground"><ArrowLeft size={16} /> Voltar aos jogos</Link><h1 className="mt-3 font-display text-3xl uppercase">Mesa de jogo <span className="text-primary">/ 3×3</span></h1></div>
      <div className="flex flex-wrap items-center gap-3"><p role="status" className="text-xs text-muted-foreground">{pending ? 'Salvando…' : saved ? 'Salvo no campeonato' : 'Mesa do campeonato'}</p><Button variant="outline" disabled={pending} onClick={() => operate()}><RefreshCw size={16} /> Atualizar</Button></div>
    </div>
    {error && <p role="alert" className="rounded-xl border border-accent bg-surface p-4 text-accent">{error} Use “Atualizar” para conferir o estado salvo.</p>}
    <section aria-label="Placar da partida" className="relative overflow-hidden rounded-2xl border border-border bg-[#101814]">
      <div aria-hidden className="h-2 bg-[repeating-linear-gradient(135deg,#145b34_0_18px,#101814_18px_24px,#9b491c_24px_42px,#101814_42px_48px)]" />
      <div className="flex justify-between border-b border-border px-5 py-3 font-display text-sm uppercase tracking-widest"><span>{STAGE_LABELS[match.stage]}</span><span className={running ? 'text-primary' : 'text-accent'}>{finished ? 'Encerrado' : running ? 'Em jogo' : remaining === 0 ? 'Tempo esgotado' : 'Cronômetro pausado'}</span></div>
      <div className="grid grid-cols-2 items-center gap-4 p-5 md:grid-cols-[1fr_1fr_1fr] md:p-8">
        {(['A', 'B'] as const).map((side) => { const team = side === 'A' ? match.teamA : match.teamB; return <div key={side} className={`text-center ${side === 'B' ? 'md:col-start-3 md:row-start-1' : ''}`}><div className="flex justify-center"><TeamCrest team={team} size="md" accent={side === 'A' ? 'green' : 'orange'} /></div><h2 className="mt-3 font-display text-xl uppercase sm:text-2xl">{team?.name}</h2><p className={`font-display text-7xl leading-tight tabular-nums sm:text-8xl ${side === 'A' ? 'text-primary' : 'text-accent'}`}>{finished ? (side === 'A' ? state.scoreA : state.scoreB) ?? totals[side] : totals[side]}</p></div>; })}
        <div className="col-span-2 border-t border-border pt-4 text-center md:col-span-1 md:col-start-2 md:row-start-1 md:border-0 md:pt-0"><p className="font-display text-xs uppercase tracking-[.25em] text-muted-foreground">Tempo restante</p><p className="my-2 font-mono text-5xl font-semibold tabular-nums sm:text-6xl" aria-label={`Tempo restante: ${clockText(remaining)}`}>{clockText(remaining)}</p><Button className="w-full cursor-pointer shadow-none" variant={running ? 'outline' : 'primary'} disabled={disabled || (!running && remaining === 0)} onClick={() => operate({ type: running ? 'pause' : 'start' })}>{running ? <Pause size={18} /> : <Play size={18} />}{running ? 'Pausar tempo' : 'Iniciar tempo'}</Button><button className="mt-3 min-h-11 cursor-pointer text-sm text-muted-foreground underline disabled:opacity-40" disabled={disabled || running} onClick={() => setClockOpen(true)}>Ajustar tempo</button></div>
      </div>
    </section>
    <div className="flex flex-wrap items-center justify-between gap-3"><p className="text-sm text-muted-foreground">Registre cada cesta no jogador. Os pontos são somados ao time.</p><Button variant="outline" disabled={disabled || !last} onClick={() => last && operate({ type: 'undo', eventId: last.id })}><Undo2 size={16} /> Desfazer última cesta</Button></div>
    <div className="grid gap-5 xl:grid-cols-2">{(['A', 'B'] as const).map((side) => <section key={side} className={`overflow-hidden rounded-xl border border-border border-t-4 bg-surface ${side === 'A' ? 'border-t-primary' : 'border-t-accent'}`}><h2 className="border-b border-border p-5 font-display text-2xl uppercase">{side === 'A' ? match.teamA?.name : match.teamB?.name}<span className="float-right text-sm text-muted-foreground">Elenco</span></h2><ul className="divide-y divide-border">{state.game.players.filter((p) => p.team === side).map((player) => { const points = state.game.baskets.filter((b) => b.playerId === player.id).reduce((sum, b) => sum + b.points, 0); return <li key={player.id} className="flex flex-wrap items-center gap-3 p-4"><span aria-hidden className="flex h-10 w-10 items-center justify-center rounded-lg bg-elevated font-display text-xl">{player.name.slice(0, 2).toUpperCase()}</span><p className="min-w-0 flex-1 break-words font-display text-lg uppercase">{player.name}</p><span className="w-9 text-center font-display text-3xl tabular-nums" aria-label={`${points} pontos`}>{points}</span><div className="flex gap-2">{([1, 2] as const).map((points) => <button key={points} disabled={disabled} onClick={() => operate({ type: 'score', playerId: player.id, points, eventId: crypto.randomUUID() })} aria-label={`Marcar ${points} ponto${points === 1 ? '' : 's'} para ${player.name}`} className={`h-12 w-12 cursor-pointer rounded-lg border font-display text-xl transition-colors disabled:opacity-40 ${side === 'A' ? 'border-primary/40 bg-primary/10 text-primary hover:bg-primary/20' : 'border-accent/40 bg-accent/10 text-accent hover:bg-accent/20'}`}>+{points}</button>)}</div></li>; })}</ul>{state.game.players.filter((p) => p.team === side).length !== 4 && <p className="p-4 text-sm text-accent">O elenco precisa ter quatro atletas para operar a mesa.</p>}</section>)}</div>
    <section className="rounded-xl border border-border bg-surface p-5"><div className="flex flex-wrap items-center justify-between gap-4"><h2 className="font-display text-2xl uppercase">Histórico de cestas</h2><span className="text-sm text-muted-foreground">{state.game.baskets.length} registros</span></div>{!last ? <p className="py-8 text-center text-sm text-muted-foreground">A primeira cesta aparece aqui com o jogador e o tempo da partida.</p> : <ol className="mt-4 max-h-72 divide-y divide-border overflow-auto">{[...state.game.baskets].reverse().map((basket) => { const player = state.game.players.find((p) => p.id === basket.playerId); return <li key={basket.id} className="flex items-center gap-4 py-3"><time className="font-mono text-sm text-muted-foreground">{clockText(basket.remainingMs)}</time><span className={`font-display text-xl ${player?.team === 'A' ? 'text-primary' : 'text-accent'}`}>+{basket.points}</span><span className="flex-1 text-sm">{player?.name}</span><button disabled={disabled} onClick={() => { if (confirm(`Remover esta cesta de ${player?.name}?`)) operate({ type: 'undo', eventId: basket.id }); }} className="min-h-11 cursor-pointer px-2 text-sm text-muted-foreground underline disabled:opacity-40">Desfazer</button></li>; })}</ol>}</section>
    <div className="flex flex-wrap items-center justify-between gap-4 border-t border-border pt-5"><p className="text-sm text-muted-foreground">{finished ? 'Resultado registrado no campeonato.' : 'Encerrar publica o resultado na classificação e no chaveamento.'}</p><Button variant="outline" disabled={disabled || totals.A === totals.B || running} onClick={() => setFinishOpen(true)}><Flag size={16} /> Encerrar partida</Button></div>
    {!finished && <p className="text-xs text-muted-foreground">Pause o cronômetro e confira o vencedor antes de encerrar. Em caso de empate, ajuste o tempo para a prorrogação.</p>}
    <Modal open={finishOpen} onClose={() => !pending && setFinishOpen(false)} title="Confirmar resultado"><p className="mb-5 text-lg">{match.teamA?.name} {totals.A} × {totals.B} {match.teamB?.name}</p><Button fullWidth disabled={pending} onClick={() => operate(undefined, true)}><Check size={18} /> Confirmar encerramento</Button></Modal>
    <Modal open={clockOpen} onClose={() => !pending && setClockOpen(false)} title="Ajustar cronômetro"><form className="space-y-4" onSubmit={(event) => { event.preventDefault(); const data = new FormData(event.currentTarget); operate({ type: 'clock', seconds: Number(data.get('minutes')) * 60 + Number(data.get('seconds')) }); }}><div className="grid grid-cols-2 gap-3"><Input label="Minutos" id="clock-minutes" name="minutes" type="number" min={0} max={60} required defaultValue={Math.floor(remaining / 60000)} /><Input label="Segundos" id="clock-seconds" name="seconds" type="number" min={0} max={59} required defaultValue={Math.floor(remaining / 1000) % 60} /></div><Button type="submit" fullWidth disabled={pending}>Salvar tempo</Button></form></Modal>
  </div>;
}
