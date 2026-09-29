# Tamanda League 3X3

Plataforma do campeonato de basquete 3x3 do bairro: site público com agenda,
classificação, chaveamento e galeria, mais um painel administrativo para
organizar tudo.

O site é público — só o painel em `/admin` pede login. A interface é
**mobile-first**, porque é no celular que os jogadores acompanham.

## Stack

Next.js 16 (App Router) · React 19 · TypeScript · Tailwind v4 · MongoDB
(Mongoose) · Cloudinary para fotos e vídeos · Vitest.

Autenticação própria com `jose` (JWT) e `bcryptjs`, sem dependência externa.

## Como rodar

1. **Banco**: o projeto usa a instância local do MongoDB na porta 27017.
   Se ela não estiver no ar:

   ```bash
   docker run -d --name tamanda-mongo -p 27017:27017 -v tamanda-mongo-data:/data/db mongo:8.2
   ```

2. **Variáveis**: copie `.env.example` para `.env.local` e preencha.
   Gere o segredo da sessão com `openssl rand -base64 32`.

3. **Instalar e semear**:

   ```bash
   npm install
   npm run seed:admin
   ```

4. **Subir**:

   ```bash
   npm run dev
   ```

   O site fica em http://localhost:3005 e o painel em http://localhost:3005/admin.

Para navegar com o campeonato já montado (4 grupos, 16 times e 24 jogos):

```bash
npm run seed:demo
```

Atenção: `seed:demo` apaga grupos, times e jogos existentes. O admin é preservado.

## Cloudinary

A galeria só aceita envios depois que `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`
e `CLOUDINARY_API_SECRET` estiverem no `.env.local` (o plano gratuito basta).
O navegador envia o arquivo direto para o Cloudinary usando uma assinatura
gerada no servidor — a chave secreta nunca chega ao cliente.

Sem as credenciais o resto do sistema funciona normalmente; o painel apenas
avisa que o envio está indisponível.

## Publicar (Vercel + Atlas + Cloudinary)

Tudo em plano gratuito e permanente. A ordem importa: o site consulta o banco
durante o build, então o Atlas precisa estar no ar antes do primeiro deploy.

### 1. MongoDB Atlas

1. Crie uma conta e um cluster **M0** (gratuito), região São Paulo (`sa-east-1`).
2. Em **Database Access**, crie um usuário e guarde a senha.
3. Em **Network Access**, libere `0.0.0.0/0` — a Vercel não tem IP fixo.
4. Copie a string de conexão e acrescente o nome do banco:
   `mongodb+srv://USUARIO:SENHA@cluster.xxxx.mongodb.net/tamanda-league?retryWrites=true&w=majority`

### 2. Cloudinary

Crie a conta gratuita e copie **Cloud name**, **API key** e **API secret** do
painel. Sem isso o site funciona normalmente, mas a galeria não aceita envios.

### 3. Vercel

1. Suba o repositório para o GitHub e importe o projeto na Vercel.
2. Em **Settings → Environment Variables**, cadastre todas as chaves do
   `.env.example`, para os ambientes Production e Preview:

   | Variável | Observação |
   | --- | --- |
   | `MONGODB_URI` | string do Atlas, com `/tamanda-league` antes do `?` |
   | `JWT_SECRET` | **gere um novo**, diferente do local: `openssl rand -base64 32` |
   | `ADMIN_EMAIL` / `ADMIN_NAME` / `ADMIN_PASSWORD` | credenciais do painel |
   | `CLOUDINARY_*` | as três chaves do Cloudinary |
   | `APP_TZ` | `America/Sao_Paulo` |
   | `NEXT_PUBLIC_SITE_URL` | endereço final, ex.: `https://tamanda-league.vercel.app` |

3. Faça o deploy.

### 4. Criar o admin em produção

O banco novo começa vazio. Com o `.env.local` apontando **temporariamente** para
a string do Atlas, rode uma vez na sua máquina:

```bash
npm run seed:admin
```

Depois volte o `.env.local` para o Mongo local. Confira o acesso em
`https://SEU-SITE/admin`.

> Use uma senha forte no `ADMIN_PASSWORD` de produção: é ela que libera a edição
> de todo o campeonato.


## Comandos

| Comando | O que faz |
| --- | --- |
| `npm run dev` | Servidor de desenvolvimento na porta 3005 |
| `npm run build` | Build de produção |
| `npm test` | Testes das regras do campeonato |
| `npm run seed:admin` | Cria/atualiza o admin a partir do `.env.local` |
| `npm run seed:demo` | Popula o campeonato com dados de exemplo |

## Regras do campeonato

- Pontuação 3x3 da FIBA: **vitória vale 2 pontos, derrota vale 1**.
- Não existe empate — o placar sempre tem um vencedor.
- Empate na pontuação entre **dois** times é decidido no confronto direto;
  com três ou mais, o critério passa a ser saldo, depois pontos marcados.
- No mata-mata o vencedor avança sozinho para a rodada seguinte. Para corrigir
  um resultado já lançado, reabra antes o jogo seguinte.

## Organização

```
src/
├── app/(public)/     páginas abertas a todos
├── app/admin/        painel (login fora do layout protegido)
├── server/
│   ├── models/       schemas do Mongoose
│   ├── services/     regras do campeonato (as puras têm teste ao lado)
│   ├── actions/      server actions, sempre validadas com zod
│   └── auth/         sessão do admin
├── features/         componentes por domínio (público e admin)
├── components/       UI, layout e elementos da marca
└── lib/              utilitários e tipos compartilhados
```

O acesso ao painel é garantido por `requireAdmin()` em cada página e em cada
action; o `src/proxy.ts` apenas evita exibir uma tela que seria negada.
