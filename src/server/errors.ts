/**
 * Erro previsto de regra de negócio: a mensagem é escrita para o admin ler na
 * tela, então nunca vaza detalhe técnico.
 */
export class DomainError extends Error {
  readonly field?: string;

  constructor(message: string, field?: string) {
    super(message);
    this.name = 'DomainError';
    this.field = field;
  }
}

export class NotFoundError extends DomainError {
  constructor(message = 'Registro não encontrado.') {
    super(message);
    this.name = 'NotFoundError';
  }
}
