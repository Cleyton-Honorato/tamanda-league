'use client';

import { useState, useTransition } from 'react';
import { Eye, EyeOff, ArrowRight, LoaderCircle } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Field';
import { onSubmitForm } from '@/features/admin/components/useAction';
import { loginAction } from '@/server/actions/auth';

export function LoginForm({ returnTo }: { returnTo?: string }) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
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
    <form onSubmit={onSubmitForm(handleSubmit)} className="flex flex-col gap-4 sm:gap-5" aria-busy={pending}>
      <Input
        id="email"
        name="email"
        type="email"
        label="E-mail"
        autoComplete="username"
        placeholder="voce@exemplo.com"
        required
        className="h-13 bg-background/60 text-base"
        error={fieldErrors.email}
      />

      <div className="relative">
      <Input
        id="password"
        name="password"
        type={showPassword ? 'text' : 'password'}
        label="Senha"
        autoComplete="current-password"
        placeholder="••••••••"
        required
        className="h-13 bg-background/60 pr-12 text-base"
        error={fieldErrors.password}
      />
      <button type="button" onClick={() => setShowPassword((value) => !value)} aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'} aria-pressed={showPassword} className="absolute right-2 top-8 rounded-md p-2 text-muted-foreground focus-visible:outline-2 focus-visible:outline-primary">
        {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
      </button>
      </div>

      {error && (
        <p role="alert" className="rounded-[var(--radius-md)] border border-accent/40 bg-accent/10 px-3 py-2 text-sm text-accent">
          {error}
        </p>
      )}

      <Button type="submit" size="lg" fullWidth disabled={pending}>
        {pending ? <LoaderCircle className="h-4 w-4 animate-spin motion-reduce:animate-none" /> : <ArrowRight className="h-4 w-4" />}
        {pending ? 'Entrando…' : 'Entrar no painel'}
      </Button>
    </form>
  );
}
