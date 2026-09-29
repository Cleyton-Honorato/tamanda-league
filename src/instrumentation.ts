/**
 * O campeonato é local: datas e horários são sempre de São Paulo, tanto no dev
 * quanto em produção (onde o runtime normalmente roda em UTC).
 */
export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    process.env.TZ = process.env.APP_TZ ?? 'America/Sao_Paulo';
  }
}
