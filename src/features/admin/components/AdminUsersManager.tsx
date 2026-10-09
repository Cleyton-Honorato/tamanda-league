'use client';

import { useState } from 'react';
import { Check, Eye, EyeOff, Plus, ShieldCheck, UserRound } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Field';
import { Modal } from '@/components/ui/Modal';
import { createAdminUserAction } from '@/server/actions/admin-users';
import type { AdminUserDto } from '@/server/services/admin-users';
import { ActionError, onSubmitForm, useAction } from './useAction';

function initialsFor(name: string) {
  const parts = name.trim().split(/\s+/);
  return `${parts[0]?.[0] ?? ''}${parts.length > 1 ? parts[parts.length - 1]?.[0] ?? '' : ''}`.toUpperCase();
}

export function AdminUsersManager({ admins, currentAdminId }: { admins: AdminUserDto[]; currentAdminId: string }) {
  const [creating, setCreating] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const create = useAction(createAdminUserAction);

  function close() {
    setCreating(false);
    setShowPassword(false);
    create.reset();
  }

  function submit(data: FormData) {
    create.run({
      name: data.get('name'),
      email: data.get('email'),
      password: data.get('password'),
      confirmPassword: data.get('confirmPassword'),
    }, close);
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="mb-2 font-display text-xs uppercase tracking-[0.25em] text-primary">Controle de acesso</p>
          <h1 className="font-display text-3xl uppercase tracking-wide">Administradores</h1>
          <p className="mt-1 text-sm text-muted-foreground">{admins.length} {admins.length === 1 ? 'usuário com acesso ao painel' : 'usuários com acesso ao painel'}</p>
        </div>
        <Button onClick={() => setCreating(true)}><Plus className="h-4 w-4" /> Novo administrador</Button>
      </div>

      <Card className="overflow-hidden border-primary/20 bg-[linear-gradient(120deg,#0d2218,#111915_58%,#21170f)] p-5 sm:p-6">
        <div className="flex items-start gap-4">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-primary/25 bg-primary/10 text-primary"><ShieldCheck className="h-5 w-5" /></span>
          <div>
            <h2 className="font-display text-xl uppercase tracking-wide">Acesso completo</h2>
            <p className="mt-1 max-w-2xl text-sm leading-relaxed text-muted-foreground">Todo administrador cadastrado pode gerenciar atletas, times, jogos, galeria e também cadastrar outros administradores.</p>
          </div>
        </div>
      </Card>

      <section aria-labelledby="admin-list-title">
        <div className="mb-3 flex items-center justify-between gap-3">
          <h2 id="admin-list-title" className="font-display text-xl uppercase tracking-wide">Usuários cadastrados</h2>
          <span className="font-display text-xs uppercase tracking-[0.18em] text-muted-foreground">{admins.length} no total</span>
        </div>
        <ul className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {admins.map((admin) => {
            const isCurrent = admin.id === currentAdminId;
            return (
              <li key={admin.id}>
                <Card className={`relative h-full overflow-hidden p-5 ${isCurrent ? 'border-primary/35' : ''}`}>
                  <span aria-hidden className={`absolute inset-y-0 left-0 w-1 ${isCurrent ? 'bg-primary' : 'bg-accent'}`} />
                  <div className="flex items-start gap-3">
                    <span aria-hidden className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-elevated font-display text-xl text-foreground">{initialsFor(admin.name)}</span>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="truncate font-display text-lg uppercase tracking-wide">{admin.name}</h3>
                        {isCurrent && <span className="inline-flex items-center gap-1 rounded-full border border-primary/25 bg-primary/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-primary"><Check className="h-3 w-3" /> Você</span>}
                      </div>
                      <p className="mt-1 truncate text-sm text-muted-foreground" title={admin.email}>{admin.email}</p>
                      <p className="mt-3 flex items-center gap-1.5 font-display text-xs uppercase tracking-[0.16em] text-foreground/60"><UserRound className="h-3.5 w-3.5" /> Administrador</p>
                    </div>
                  </div>
                </Card>
              </li>
            );
          })}
        </ul>
      </section>

      <Modal open={creating} onClose={close} title="Novo administrador">
        <form onSubmit={onSubmitForm(submit)} className="flex flex-col gap-4">
          <div className="rounded-[var(--radius-md)] border border-primary/20 bg-primary/5 px-4 py-3 text-sm text-muted-foreground">O novo usuário poderá acessar todas as áreas administrativas.</div>
          <Input id="admin-name" name="name" label="Nome completo" autoComplete="name" required error={create.fieldErrors.name} />
          <Input id="admin-email" name="email" type="email" label="E-mail" autoComplete="email" required error={create.fieldErrors.email} />
          <div className="relative">
            <Input id="admin-password" name="password" type={showPassword ? 'text' : 'password'} label="Senha" autoComplete="new-password" required minLength={8} className="pr-12" error={create.fieldErrors.password} />
            <button type="button" onClick={() => setShowPassword((value) => !value)} aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'} aria-pressed={showPassword} className="absolute right-2 top-8 flex h-9 w-9 cursor-pointer items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-elevated hover:text-foreground focus-visible:outline-2 focus-visible:outline-primary">{showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}</button>
          </div>
          <Input id="admin-confirm-password" name="confirmPassword" type={showPassword ? 'text' : 'password'} label="Confirmar senha" autoComplete="new-password" required minLength={8} error={create.fieldErrors.confirmPassword} />
          <p className="-mt-2 text-xs text-muted-foreground">Use ao menos 8 caracteres, com uma letra e um número.</p>
          <ActionError message={create.error} />
          <div className="flex flex-col-reverse gap-2 sm:flex-row">
            <Button type="button" variant="outline" fullWidth onClick={close}>Cancelar</Button>
            <Button type="submit" fullWidth disabled={create.pending}>{create.pending ? 'Cadastrando…' : 'Cadastrar administrador'}</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
