// ---------- Config ----------
const CORES = { direitos: "#2b6cb0", ciencia: "#6b46c1", bi: "#d53f8c" };
const LABELS = { direitos: "Direitos", ciencia: "Ciência/Psi", bi: "Bi / Não Monossexual" };
const MODAL_IDS = {
  dialog: "modal-evento",
  fechar: "modal-fechar",
  data: "modal-data",
  titulo: "modal-titulo",
  resumo: "modal-resumo",
  fonte: "modal-fonte",
};

let eventos = [];
let filtroEixo = "bi";
let filtroPais = "brasil";

// ---------- Carregar dados ----------
async function carregar() {
  try {
    const base = new URL(".", window.location.href);
    const resp = await fetch(new URL("dados.json", base));
    if (!resp.ok) throw new Error("Falha ao carregar dados.json");
    const json = await resp.json();
    eventos = json.eventos
      .slice()
      .sort((a, b) => a.ano - b.ano);
    render();
  } catch (err) {
    console.error(err);
    document.getElementById("timeline").innerHTML =
      '<p class="vazio">Não foi possível carregar os dados. Rode via servidor local (ex.: <code>python -m http.server</code>).</p>';
  }
}

// ---------- Render ----------
function render() {
  const timeline = document.getElementById("timeline");
  const vazio = document.getElementById("vazio");
  timeline.innerHTML = "";

  const filtrados = eventos.filter(ev => {
    const okEixo = filtroEixo === "todos" || ev.eixo === filtroEixo;
    const okPais = filtroPais === "todos" || ev.pais === filtroPais;
    return okEixo && okPais;
  });

  vazio.hidden = filtrados.length > 0;

  filtrados.forEach(ev => {
    const artigo = document.createElement("article");
    artigo.className = "evento";
    artigo.style.setProperty("--cor-eixo", CORES[ev.eixo] || "#888");
    artigo.dataset.id = ev.id;

    artigo.innerHTML = `
      <div class="card" role="button" tabindex="0"
           aria-label="${ev.titulo}, ${ev.data}">
        <div class="card-topo">
          <span class="ano">${ev.data}</span>
          <span class="tag">${LABELS[ev.eixo] || ev.eixo}</span>
        </div>
        <h2>${ev.titulo}</h2>
        <p>${ev.resumo}</p>
        <span class="fonte">Fonte: ${ev.fonte} · ${ev.pais === "brasil" ? "Brasil" : "Mundo"}</span>
      </div>
    `;

    const card = artigo.querySelector(".card");
    card.addEventListener("click", () => abrirModal(ev));
    card.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        abrirModal(ev);
      }
    });

    timeline.appendChild(artigo);
  });

  observar();
}

// ---------- Animação de entrada ----------
let observer;
function observar() {
  if (observer) observer.disconnect();

  const reduzir = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (reduzir) {
    document.querySelectorAll(".evento").forEach(el => el.classList.add("visivel"));
    return;
  }

  observer = new IntersectionObserver((entradas) => {
    entradas.forEach(ent => {
      if (ent.isIntersecting) {
        ent.target.classList.add("visivel");
        observer.unobserve(ent.target);
      }
    });
  }, { threshold: 0.15 });

  document.querySelectorAll(".evento").forEach(el => observer.observe(el));
}

// ---------- Modal ----------
// Função auxiliar: escapa HTML e transforma URLs em links <a>
function escreverFonteComLinks(elemento, texto) {
  // 1. Escapa caracteres HTML para evitar injeção (o "problema de segurança")
  const textoEscapado = texto
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

  // 2. Encontra URLs (http:// ou https://) e as transforma em links
  const textoComLinks = textoEscapado.replace(
    /(https?:\/\/[^\s]+)/g,
    '<a href="$1" target="_blank" rel="noopener noreferrer">$1</a>'
  );

  // 3. Insere o resultado no elemento
  elemento.innerHTML = textoComLinks;
}

function abrirModal(ev) {
  const dialog = document.getElementById(MODAL_IDS.dialog);
  if (!dialog) return;

  document.getElementById(MODAL_IDS.data).textContent = ev.data;
  document.getElementById(MODAL_IDS.titulo).textContent = ev.titulo;
  document.getElementById(MODAL_IDS.resumo).textContent = ev.resumo;
  
  // A linha abaixo foi trocada: agora usa a função auxiliar para gerar links
  const fonteEl = document.getElementById(MODAL_IDS.fonte);
  const textoFonte = `Fonte: ${ev.fonte} · ${ev.pais === "brasil" ? "Brasil" : "Mundo"}`;
  escreverFonteComLinks(fonteEl, textoFonte);

  dialog.style.setProperty("--cor-eixo", CORES[ev.eixo] || "#888");
  dialog.showModal();
}

function fecharModal() {
  const dialog = document.getElementById(MODAL_IDS.dialog);
  if (dialog && dialog.open) dialog.close();
}

function ligarModal() {
  const dialog = document.getElementById(MODAL_IDS.dialog);
  const botaoFechar = document.getElementById(MODAL_IDS.fechar);
  if (!dialog || !botaoFechar) return;

  botaoFechar.addEventListener("click", fecharModal);

  // Clique no backdrop: o <dialog> recebe o clique, mas o conteúdo
  // interno não. Se o alvo do clique for o próprio <dialog>, foi backdrop.
  dialog.addEventListener("click", (e) => {
    if (e.target === dialog) fecharModal();
  });

  // Esc já fecha por padrão em <dialog> nativo, mas garantimos aqui
  // também por consistência com navegadores antigos.
  dialog.addEventListener("cancel", (e) => {
    e.preventDefault();
    fecharModal();
  });
}

// ---------- Conceitos ----------
async function carregarConceitos() {
  try {
    const base = new URL(".", window.location.href);
    const resp = await fetch(new URL("conceitos.json", base));
    if (!resp.ok) throw new Error("Falha ao carregar conceitos.json");
    const json = await resp.json();
    renderConceitos(json.conceitos || []);
  } catch (err) {
    console.error("Erro ao carregar conceitos:", err);
    const lista = document.getElementById("conceitos-lista");
    if (lista) {
      lista.innerHTML = '<p class="vazio">Não foi possível carregar os conceitos.</p>';
    }
  }
}

function renderConceitos(conceitos) {
  const lista = document.getElementById("conceitos-lista");
  if (!lista) return;
  lista.innerHTML = "";

  if (conceitos.length === 0) {
    lista.innerHTML = '<p class="vazio">Nenhum conceito cadastrado.</p>';
    return;
  }

  conceitos.forEach(c => {
    const card = document.createElement("article");
    card.className = "conceito-card";
    card.innerHTML = `
      <h3>${c.titulo}</h3>
      <p>${c.resumo}</p>
      <span class="conceito-fonte">${c.fonte}</span>
    `;
    lista.appendChild(card);
  });
}

function abrirModalConceitos() {
  const dialog = document.getElementById("modal-conceitos");
  if (!dialog) return;
  dialog.showModal();
}

function ligarModalConceitos() {
  const dialog = document.getElementById("modal-conceitos");
  const btnAbrir = document.getElementById("btn-conceitos");
  const btnFechar = document.getElementById("modal-conceitos-fechar");
  if (!dialog || !btnAbrir || !btnFechar) return;

  btnAbrir.addEventListener("click", abrirModalConceitos);
  btnFechar.addEventListener("click", () => dialog.close());

  dialog.addEventListener("click", (e) => {
    if (e.target === dialog) dialog.close();
  });
  dialog.addEventListener("cancel", (e) => {
    e.preventDefault();
    dialog.close();
  });
}

// ---------- Antes das Identidades ----------
async function carregarAntesIdentidades() {
  try {
    const base = new URL(".", window.location.href);
    const resp = await fetch(new URL("antes-identidades.json", base));
    if (!resp.ok) throw new Error("Falha ao carregar antes-identidades.json");
    const json = await resp.json();
    renderAntesIdentidades(json.marcadores || []);
  } catch (err) {
    console.error("Erro ao carregar antes-identidades:", err);
    const lista = document.getElementById("antes-identidades-lista");
    if (lista) {
      lista.innerHTML = '<p class="vazio">Não foi possível carregar os marcadores históricos.</p>';
    }
  }
}

function renderAntesIdentidades(marcadores) {
  const lista = document.getElementById("antes-identidades-lista");
  if (!lista) return;
  lista.innerHTML = "";

  if (marcadores.length === 0) {
    lista.innerHTML = '<p class="vazio">Nenhum marcador cadastrado.</p>';
    return;
  }

  marcadores.forEach(m => {
    const card = document.createElement("article");
    card.className = "antes-card";
    card.innerHTML = `
      <h3>${m.epoca}</h3>
      <span class="antes-periodo">${m.periodo}</span>
      <img class="antes-imagem" src="${m.imagem}" alt="Ilustração conceitual: ${m.epoca}" onerror="this.style.display='none'">
      <p>${m.texto}</p>
      <p class="antes-pergunta">${m.pergunta}</p>
      <span class="antes-fontes">${m.fontes}</span>
    `;
    lista.appendChild(card);
  });
}

function abrirModalAntes() {
  const dialog = document.getElementById("modal-antes-identidades");
  if (!dialog) return;
  dialog.showModal();
}

function ligarModalAntes() {
  const dialog = document.getElementById("modal-antes-identidades");
  const btnAbrir = document.getElementById("btn-antes-identidades");
  const btnFechar = document.getElementById("modal-antes-fechar");
  if (!dialog || !btnAbrir || !btnFechar) return;

  btnAbrir.addEventListener("click", abrirModalAntes);
  btnFechar.addEventListener("click", () => dialog.close());

  dialog.addEventListener("click", (e) => {
    if (e.target === dialog) dialog.close();
  });
  dialog.addEventListener("cancel", (e) => {
    e.preventDefault();
    dialog.close();
  });
}

// ---------- Filtros ----------
function ligarFiltros() {
  document.querySelectorAll('[data-eixo]').forEach(btn => {
    btn.addEventListener("click", () => {
      document.querySelectorAll('[data-eixo]').forEach(b => b.classList.remove("ativo"));
      btn.classList.add("ativo");
      filtroEixo = btn.dataset.eixo;
      render();
    });
  });

  document.querySelectorAll('[data-pais]').forEach(btn => {
    btn.addEventListener("click", () => {
      document.querySelectorAll('[data-pais]').forEach(b => b.classList.remove("ativo"));
      btn.classList.add("ativo");
      filtroPais = btn.dataset.pais;
      render();
    });
  });
}

// ---------- Init ----------
ligarModal();
ligarModalConceitos();
ligarModalAntes();
ligarFiltros();
carregar();
carregarConceitos();
carregarAntesIdentidades();
