# 🎵 Lista de Músicas (com Supabase)

Lista compartilhada onde cada colaborador escolhe até **5 músicas**.
Tudo **anônimo** (não guarda quem adicionou) e **sem repetir** música
(mesmo título + artista não entra duas vezes).

## Arquivos

| Arquivo        | O que é                                                    |
|----------------|------------------------------------------------------------|
| `index.html`   | A página                                                    |
| `style.css`    | A aparência                                                 |
| `script.js`    | A lógica + conexão com o Supabase (**configure aqui**)     |
| `schema.sql`   | O que rodar no banco do Supabase para criar a tabela       |

## Passo a passo

### 1. Criar o projeto e a tabela
1. Entre em https://supabase.com e crie um projeto novo (grátis).
2. No menu lateral, abra **SQL Editor** → **New query**.
3. Cole todo o conteúdo de `schema.sql` e clique em **Run**.
   Isso cria a tabela `lista_musicas` já com as regras de segurança.

### 2. Pegar a URL e a chave
1. No projeto, vá em **Project Settings** (engrenagem) → **API**.
2. Copie:
   - **Project URL** → algo como `https://xxxx.supabase.co`
   - **anon public** (chave pública) → um texto longo começando com `eyJ...`
     ou `sb_publishable_...`
3. Pode colar essa `anon key` no site sem medo: ela é pública por design,
   e as regras (RLS) do `schema.sql` limitam o que ela pode fazer.

### 3. Configurar o site
Abra `script.js` e preencha as duas primeiras linhas:

```js
const SUPABASE_URL      = 'https://xxxx.supabase.co';
const SUPABASE_ANON_KEY = 'eyJ...sua-chave...';
```

### 4. Publicar (para mandar no WhatsApp)
Você precisa de um **link** para enviar aos colaboradores. Opções grátis:
- **Netlify Drop** (mais fácil): https://app.netlify.com/drop — arraste a
  pasta com os 4 arquivos e ele te dá um link na hora.
- **Vercel**, **GitHub Pages** ou **Cloudflare Pages** também funcionam.

Aí é só mandar o link no WhatsApp de cada um. Todos veem e editam a **mesma** lista.

## Como você vê o resultado final
Como a lista é única e sem repetições, a própria página **já mostra o
resultado consolidado** de todos. Para exportar/gerenciar, você também pode
abrir o Supabase → **Table Editor** → `lista_musicas` (dá pra baixar em CSV).

## Detalhes importantes (limitações honestas)
- **Limite de 5 é por navegador/aparelho.** Como é anônimo (sem login), o
  controle das 5 fica salvo no navegador da pessoa. Se ela limpar os dados
  do navegador ou abrir em outro aparelho, consegue adicionar mais. Para um
  time de colegas isso costuma bastar; para um limite "à prova de bala" seria
  preciso login/identificação.
- **Remover:** cada pessoa só vê o botão de remover nas músicas que **ela
  mesma** adicionou (naquele navegador). Você, como dono, pode remover
  qualquer uma pelo Table Editor do Supabase.
- **Dedup de verdade:** a proteção contra repetição está no banco (índice
  único), então funciona mesmo se duas pessoas adicionarem ao mesmo tempo.