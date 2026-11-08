// ---------- Config ----------
const CORES = { direitos: "#2b6cb0", ciencia: "#6b46c1", bi: "#d53f8c" };
const LABELS = { direitos: "Direitos", ciencia: "Ciência/Psi", bi: "Bi / Não Monossexual" };

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

    // acessibilidade: abre/fecha resumo (aqui o card já mostra tudo; deixamos gancho p/ modal)
    const card = artigo.querySelector(".card");
    card.addEventListener("click", () => console.log("card clicado:", ev.id));
    card.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        card.click();
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
ligarFiltros();
carregar();
