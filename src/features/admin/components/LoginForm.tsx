'use client';

import { useState, useTransition } from 'react';
import { LogIn } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Field';
import { onSubmitForm } from '@/features/admin/components/useAction';
import { loginAction } from '@/server/actions/auth';

export function LoginForm({ returnTo }: { returnTo?: string }) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  function handleSubmit(formData: FormData) {
    setError(null);
    setFieldErrors({});

    startTransition(async () => {
      const result = await loginAction({
        email: formData.get('email'),
        password: formData.get('password'),
        returnTo,
      });

      // Em caso de sucesso a action redireciona e nada volta para cá.
      if (result && !result.ok) {
        setError(result.error);
        setFieldErrors(result.fieldErrors ?? {});
      }
    });
  }

  return (
    <form onSubmit={onSubmitForm(handleSubmit)} className="flex flex-col gap-4">
      <Input
        id="email"
        name="email"
        type="email"
        label="E-mail"
        autoComplete="username"
        placeholder="voce@exemplo.com"
        required
        error={fieldErrors.email}
      />

      <Input
        id="password"
        name="password"
        type="password"
        label="Senha"
        autoComplete="current-password"
        placeholder="••••••••"
        required
        error={fieldErrors.password}
      />

      {error && (
        <p className="rounded-[var(--radius-md)] border border-accent/40 bg-accent/10 px-3 py-2 text-sm text-accent">
          {error}
        </p>
      )}

      <Button type="submit" size="lg" fullWidth disabled={pending}>
        <LogIn className="h-4 w-4" />
        {pending ? 'Entrando…' : 'Entrar'}
      </Button>
    </form>
  );
}
