/**
 * Retorno padrão das server actions. Erros de domínio e de validação voltam
 * como dado para o formulário renderizar — exceção só para bug de verdade.
 */
export type ActionErrorCode =
  | 'VALIDATION'
  | 'UNAUTHENTICATED'
  | 'DOMAIN'
  | 'UNKNOWN';

export type ActionResult<T = void> =
  | { ok: true; data: T }
  | {
      ok: false;
      error: string;
      code: ActionErrorCode;
      fieldErrors?: Record<string, string>;
    };

export function success<T>(data: T): ActionResult<T> {
  return { ok: true, data };
}

export function failure<T = void>(
  error: string,
  code: ActionErrorCode = 'DOMAIN',
  fieldErrors?: Record<string, string>,
): ActionResult<T> {
  return { ok: false, error, code, fieldErrors };
}
