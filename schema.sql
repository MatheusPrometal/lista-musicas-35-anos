-- ============================================================
--  Lista de Músicas — estrutura do banco (Supabase / PostgreSQL)
--  Cole tudo isto no SQL Editor do seu projeto Supabase e rode.
--  NÃO guarda quem adicionou (anônimo). Dedup por título+artista.
-- ============================================================
-- Tabela: só a música. Nenhuma coluna de "quem adicionou".
create table if not exists public.lista_musicas (
    id uuid primary key default gen_random_uuid (),
    titulo text not null,
    artista text not null,
    chave text not null, -- título+artista normalizados (dedup)
    criado_em timestamptz not null default now ()
);

-- Dedup no banco: a mesma música (chave) nunca entra duas vezes.
-- Mesmo que dois colaboradores tentem ao mesmo tempo, o banco garante.
create unique index if not exists lista_musicas_chave_unica on public.lista_musicas (chave);

-- ------------------------------------------------------------
--  Segurança (RLS) — libera acesso anônimo controlado.
--  A "anon key" que vai no site só pode fazer o que as políticas
--  abaixo permitem. Nada de dados pessoais aqui.
-- ------------------------------------------------------------
alter table public.lista_musicas enable row level security;

-- Qualquer um pode LER a lista.
create policy "leitura publica" on public.lista_musicas for
select
    using (true);

-- Qualquer um pode ADICIONAR uma música.
create policy "insercao publica" on public.lista_musicas for insert
with
    check (true);

-- Qualquer um pode REMOVER (o app só mostra o botão de remover
-- para as músicas que a própria pessoa adicionou naquele navegador).
-- Se preferir travar isso e só remover pelo painel, apague esta policy.
create policy "remocao publica" on public.lista_musicas for delete using (true);

-- ------------------------------------------------------------
--  Realtime (opcional): faz a lista atualizar ao vivo pra todos.
--  Se der erro dizendo que a publicação não existe, pode ignorar
--  esta linha — o app continua funcionando (só sem tempo real).
-- ------------------------------------------------------------
alter publication supabase_realtime add table public.lista_musicas;