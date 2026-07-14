const SUPABASE_URL = 'https://uoqcoezbqwvwrbpluakm.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVvcWNvZXpicXd2d3JicGx1YWttIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODM5NTY2MzIsImV4cCI6MjA5OTUzMjYzMn0.t5FDR8tKRdQhUjnIv2gVEYflaU2TSwDXQ7sPxvADfIk';

// ============================================================
//  Regras
// ============================================================
const LIMITE = 5;                 // máximo de músicas por pessoa (navegador)
const STORAGE_KEY = 'minhasMusicasIds';

const db = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const form = document.getElementById('form');
const inTitle = document.getElementById('title');
const inArtist = document.getElementById('artist');
const addBtn = document.getElementById('addBtn');
const list = document.getElementById('list');
const empty = document.getElementById('empty');
const count = document.getElementById('count');
const mineEl = document.getElementById('mine');
const msg = document.getElementById('msg');
const banner = document.getElementById('config-alert');
let msgTimer = null;

// ---- "minhas músicas" (limite de 5 por navegador) ----------
function meusIds() {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || []; }
    catch { return []; }
}
function salvarMeusIds(ids) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(ids));
}


function normalizar(txt) {
    return txt
        .normalize('NFD').replace(/[̀-ͯ]/g, '') // remove acentos
        .toLowerCase()
        .trim()
        .replace(/\s+/g, ' ');
}
function chave(titulo, artista) {
    return normalizar(titulo) + ' :: ' + normalizar(artista);
}

function mostrarMsg(texto, tipo) {
    msg.textContent = texto;
    msg.className = 'msg show ' + tipo;
    clearTimeout(msgTimer);
    msgTimer = setTimeout(() => { msg.className = 'msg ' + tipo; }, 3500);
}

function atualizarLimite() {
    const usados = meusIds().length;
    mineEl.textContent = usados;
    const cheio = usados >= LIMITE;
    inTitle.disabled = inArtist.disabled = addBtn.disabled = cheio;
    addBtn.textContent = cheio ? 'Você já escolheu suas 5 músicas' : 'Adicionar à lista';
}

// ---- Renderiza a lista compartilhada -----------------------
function render(musicas) {
    const meus = meusIds();
    list.innerHTML = '';
    empty.style.display = musicas.length ? 'none' : 'block';
    if (!musicas.length) empty.textContent = 'Nenhuma música ainda. Adicione a primeira! 👆';
    count.textContent = musicas.length + (musicas.length === 1 ? ' música' : ' músicas');

    musicas.forEach((m, i) => {
        const li = document.createElement('li');

        const num = document.createElement('div');
        num.className = 'num';
        num.textContent = i + 1;

        const info = document.createElement('div');
        info.className = 'info';
        const t = document.createElement('div');
        t.className = 'title';
        t.textContent = m.titulo;
        const a = document.createElement('div');
        a.className = 'artist';
        a.textContent = m.artista;
        info.append(t, a);

        li.append(num, info);

        // Só mostra "remover" para músicas que ESTE navegador adicionou.
        if (meus.includes(m.id)) {
            const btn = document.createElement('button');
            btn.className = 'remove';
            btn.type = 'button';
            btn.title = 'Remover (sua)';
            btn.textContent = '✕';
            btn.addEventListener('click', () => remover(m.id));
            li.appendChild(btn);
        }

        list.appendChild(li);
    });
}

async function carregar() {
    const { data, error } = await db
        .from('lista_musicas')
        .select('id, titulo, artista')
        .order('criado_em', { ascending: true });

    if (error) {
        empty.style.display = 'block';
        empty.textContent = 'Não consegui carregar a lista. Confira a configuração.';
        console.error(error);
        return;
    }
    render(data);
}

async function adicionar(titulo, artista) {
    if (meusIds().length >= LIMITE) {
        mostrarMsg('Você já escolheu suas 5 músicas.', 'error');
        return;
    }

    const { data, error } = await db
        .from('lista_musicas')
        .insert({ titulo, artista, chave: chave(titulo, artista) })
        .select('id')
        .single();

    if (error) {
        if (error.code === '23505') { 
            mostrarMsg('⚠️ "' + titulo + '" de ' + artista + ' já está na lista.', 'error');
        } else {
            mostrarMsg('Não consegui adicionar agora. Tente de novo.', 'error');
            console.error(error);
        }
        return;
    }

    // Guarda o id como "minha" música (conta pro limite de 5).
    const ids = meusIds(); ids.push(data.id); salvarMeusIds(ids);
    atualizarLimite();
    mostrarMsg('✓ Música adicionada!', 'ok');
    form.reset();
    await carregar();
    if (!inTitle.disabled) inTitle.focus();
}

// ---- Remove uma música (só as suas) ------------------------
async function remover(id) {
    const { error } = await db.from('lista_musicas').delete().eq('id', id);
    if (error) {
        mostrarMsg('Não consegui remover.', 'error');
        return;
    }
    salvarMeusIds(meusIds().filter(x => x !== id));
    atualizarLimite();
    await carregar();
}

form.addEventListener('submit', (e) => {
    e.preventDefault();
    const titulo = inTitle.value.trim();
    const artista = inArtist.value.trim();
    if (!titulo || !artista) {
        mostrarMsg('Preencha o título e o artista.', 'error');
        return;
    }
    adicionar(titulo, artista);
});

function iniciar() {
    if (SUPABASE_URL.includes('SEU-PROJETO') || SUPABASE_ANON_KEY.includes('COLE_AQUI')) {
        if (banner) banner.style.display = 'block';
        empty.textContent = 'Configure o Supabase para carregar a lista.';
        return;
    }

    atualizarLimite();
    carregar();

    db.channel('lista-musicas-tempo-real')
        .on('postgres_changes',
            { event: '*', schema: 'public', table: 'lista_musicas' },
            carregar)
        .subscribe();
}

iniciar();