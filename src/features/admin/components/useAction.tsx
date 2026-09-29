'use client';

import { useCallback, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import type { ActionResult } from '@/lib/result';

type ActionFn<T> = (input: unknown) => Promise<ActionResult<T>>;

/**
 * Chama uma server action guardando erro e estado de envio.
 *
 * O `router.refresh()` no sucesso é o que traz de volta os dados do servidor
 * depois do `revalidatePath` da action — sem ele a tela continuaria mostrando
 * o que foi renderizado antes da mudança.
 */
export function useAction<T>(action: ActionFn<T>) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const reset = useCallback(() => {
    setError(null);
    setFieldErrors({});
  }, []);

  const run = useCallback(
    (input: unknown, onSuccess?: (data: T) => void) => {
      reset();
      startTransition(async () => {
        const result = await action(input);

        if (result.ok) {
          router.refresh();
          onSuccess?.(result.data);
          return;
        }

        setError(result.error);
        setFieldErrors(result.fieldErrors ?? {});
      });
    },
    [action, reset, router],
  );

  return { run, pending, error, fieldErrors, reset };
}

/**
 * Submissão de formulário sem a prop `action`: o React 19 reseta os campos
 * depois de toda action de form, então um erro de validação apagaria o que a
 * pessoa digitou. Com onSubmit + preventDefault os valores ficam na tela.
 */
export function onSubmitForm(handler: (data: FormData) => void) {
  return (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    handler(new FormData(event.currentTarget));
  };
}

export function ActionError({ message }: { message: string | null }) {
  if (!message) return null;
  return (
    <p className="rounded-[var(--radius-md)] border border-accent/40 bg-accent/10 px-3 py-2 text-sm text-accent">
      {message}
    </p>
  );
}
