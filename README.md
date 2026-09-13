# Painel interno — campanha Poly Dantas

CRM interno simples para a equipe da campanha, com login por nome + PIN,
funções separadas por pessoa e 3 módulos: monitoramento de engajamento,
agenda da semana e banco de ideias.

## Stack

- Next.js (App Router) + TypeScript + Tailwind CSS
- Supabase (Postgres) como banco de dados, acessado só pelo servidor
- Deploy pensado para Vercel

Não usa o sistema de autenticação do Supabase — é um login próprio,
bem simples, por nome + PIN numérico (4 a 6 dígitos), pensado para uma
equipe pequena que vai acessar principalmente pelo celular.

## Como funciona o login

1. A pessoa digita o nome.
2. Se for o **primeiro uso do sistema** (nenhum cadastro ainda), quem
   acessar primeiro vira automaticamente o **usuário master**.
3. Se o nome já foi cadastrado pelo master mas ainda não tem PIN, o
   sistema pede para criar um PIN (primeiro acesso da pessoa).
4. Se já tem PIN, pede o PIN.
5. Depois de entrar, fica logado nesse navegador/celular (cookie
   válido por 1 ano) — não pede PIN de novo a cada aba.

## Funções (roles)

- **master** — acesso total + tela de administração (`/admin`): cadastra
  pessoas, muda nome, muda função, reseta PIN e remove gente.
- **full** — acesso total aos 3 módulos, sem a tela de admin.
- **engagement_only** — só vê o módulo de Monitoramento de engajamento
  (uso: Ana Camila).
- **agenda_only** — só vê o módulo de Agenda da semana (uso: Céica).

Quem é o master cadastra todo mundo em `/admin` (nome + função). A
pessoa cria o próprio PIN no primeiro acesso.

## Módulos

- **Monitoramento de engajamento** (`/engajamento`): lista de pessoas
  que precisam comentar no grupo, separado por link de post. Para cada
  post dá pra marcar quem já comentou e ver o placar (`8/12 comentaram`).
- **Agenda da semana** (`/agenda`): compromissos com data, hora, local
  e detalhes da programação, com campo opcional para anexar a ideia de
  conteúdo daquele dia.
- **Banco de ideias** (`/ideias`): quadro de post-its, sem estrutura,
  só para soltar ideias rapidamente.

## Configurar o Supabase

1. Crie um projeto em https://supabase.com.
2. Vá em **SQL Editor** → **New query**, cole o conteúdo de
   [`supabase/schema.sql`](supabase/schema.sql) e rode. Isso cria todas
   as tabelas.
3. Vá em **Project Settings → API** e copie:
   - **Project URL**
   - **service_role key** (a secreta, não a `anon`/pública)

## Rodar localmente

1. Copie `.env.local.example` para `.env.local` e preencha:
   ```
   NEXT_PUBLIC_SUPABASE_URL=...
   SUPABASE_SERVICE_ROLE_KEY=...
   SESSION_SECRET=... (já vem uma gerada, pode trocar por outra string aleatória grande)
   ```
2. Instale as dependências e rode:
   ```bash
   npm install
   npm run dev
   ```
3. Acesse http://localhost:3000 — o primeiro nome que você digitar vira
   o usuário master.

## Deploy no Vercel

1. Suba este projeto para um repositório Git (GitHub/GitLab/Bitbucket).
2. Importe o repositório no Vercel.
3. Em **Environment Variables**, adicione as mesmas três variáveis do
   `.env.local` (com os valores do seu projeto Supabase de produção).
4. Deploy. O `SESSION_SECRET` de produção deve ser diferente do usado
   em desenvolvimento — gere um novo com:
   ```bash
   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
   ```

**Importante:** a `SUPABASE_SERVICE_ROLE_KEY` dá acesso total ao banco,
ignorando qualquer restrição. Ela só deve existir nas variáveis de
ambiente do servidor (Vercel / `.env.local`), nunca em código com
prefixo `NEXT_PUBLIC_` e nunca exposta ao navegador.
