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
let filtroEixo = "todos";
let filtroPais = "todos";

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
function abrirModal(ev) {
  const dialog = document.getElementById(MODAL_IDS.dialog);
  if (!dialog) return;

  document.getElementById(MODAL_IDS.data).textContent = ev.data;
  document.getElementById(MODAL_IDS.titulo).textContent = ev.titulo;
  document.getElementById(MODAL_IDS.resumo).textContent = ev.resumo;
  document.getElementById(MODAL_IDS.fonte).textContent =
    `Fonte: ${ev.fonte} · ${ev.pais === "brasil" ? "Brasil" : "Mundo"}`;

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
ligarFiltros();
carregar();
