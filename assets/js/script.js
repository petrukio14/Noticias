/* =========================================================
   Equipe Bauzinho Notícias - script.js
   Lógica compartilhada entre index.html, noticia.html e categoria.html
   ========================================================= */

const SITE_URL = "https://equipebauzinho.github.io";
const DATA_URL = "data/noticias.json";

let NOTICIAS = [];

/* ---------------------------------------------------------
   UTILITÁRIOS
--------------------------------------------------------- */

function formatarData(dataStr){
  if(!dataStr) return "";
  const data = new Date(dataStr);
  if(isNaN(data.getTime())) return dataStr;
  return data.toLocaleDateString("pt-BR", { day:"2-digit", month:"long", year:"numeric" });
}

function getQueryParam(nome){
  const params = new URLSearchParams(window.location.search);
  return params.get(nome);
}

function slugify(texto){
  return (texto || "")
    .toString()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function imagemPadrao(){
  return "https://picsum.photos/seed/bauzinho/800/500";
}

/* ---------------------------------------------------------
   CARREGAMENTO DE DADOS
--------------------------------------------------------- */

async function carregarNoticias(){
  if(NOTICIAS.length) return NOTICIAS;
  try{
    const resp = await fetch(DATA_URL, { cache: "no-store" });
    if(!resp.ok) throw new Error("Falha ao carregar noticias.json");
    const json = await resp.json();
    NOTICIAS = Array.isArray(json) ? json : [];
  }catch(err){
    console.error("Erro ao carregar notícias:", err);
    NOTICIAS = [];
  }
  // Ordena por data, mais recentes primeiro
  NOTICIAS.sort((a,b)=> new Date(b.data) - new Date(a.data));
  return NOTICIAS;
}

/* ---------------------------------------------------------
   MODO ESCURO
--------------------------------------------------------- */

function initDarkMode(){
  const toggle = document.getElementById("darkModeToggle");
  const saved = localStorage.getItem("bauzinho-theme");

  if(saved === "dark"){
    document.documentElement.setAttribute("data-theme", "dark");
    if(toggle) toggle.textContent = "☀️";
  }

  if(toggle){
    toggle.addEventListener("click", () => {
      const atual = document.documentElement.getAttribute("data-theme");
      if(atual === "dark"){
        document.documentElement.removeAttribute("data-theme");
        localStorage.setItem("bauzinho-theme", "light");
        toggle.textContent = "🌙";
      }else{
        document.documentElement.setAttribute("data-theme", "dark");
        localStorage.setItem("bauzinho-theme", "dark");
        toggle.textContent = "☀️";
      }
    });
  }
}

/* ---------------------------------------------------------
   MENU MOBILE
--------------------------------------------------------- */

function initMenuMobile(){
  const btn = document.getElementById("menuToggle");
  const nav = document.getElementById("mainNav");
  if(!btn || !nav) return;
  btn.addEventListener("click", () => {
    nav.classList.toggle("open");
  });
}

/* ---------------------------------------------------------
   BUSCA INSTANTÂNEA
--------------------------------------------------------- */

function initBusca(){
  const input = document.getElementById("searchInput");
  const resultsBox = document.getElementById("searchResults");
  if(!input || !resultsBox) return;

  input.addEventListener("input", async () => {
    const termo = input.value.trim().toLowerCase();

    if(termo.length < 2){
      resultsBox.classList.remove("active");
      resultsBox.innerHTML = "";
      return;
    }

    const noticias = await carregarNoticias();
    const encontrados = noticias.filter(n =>
      (n.titulo || "").toLowerCase().includes(termo) ||
      (n.resumo || "").toLowerCase().includes(termo) ||
      (n.categoria || "").toLowerCase().includes(termo)
    ).slice(0, 8);

    if(!encontrados.length){
      resultsBox.innerHTML = `<div class="search-empty">Nenhum resultado encontrado para "${escapeHtml(input.value)}"</div>`;
    }else{
      resultsBox.innerHTML = encontrados.map(n => `
        <a class="search-result-item" href="noticia.html?id=${n.id}">
          <img src="${n.imagem || imagemPadrao()}" alt="${escapeHtml(n.titulo)}" loading="lazy" onerror="this.src='${imagemPadrao()}'">
          <div class="sr-info">
            <strong>${escapeHtml(n.titulo)}</strong>
            <small>${escapeHtml(n.categoria || "")} • ${formatarData(n.data)}</small>
          </div>
        </a>
      `).join("");
    }

    resultsBox.classList.add("active");
  });

  document.addEventListener("click", (e) => {
    if(!resultsBox.contains(e.target) && e.target !== input){
      resultsBox.classList.remove("active");
    }
  });
}

function escapeHtml(str){
  if(!str) return "";
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

/* ---------------------------------------------------------
   CARDS DE NOTÍCIA
--------------------------------------------------------- */

function criarCardHtml(n){
  return `
    <a class="news-card" href="noticia.html?id=${n.id}">
      <img src="${n.imagem || imagemPadrao()}" alt="${escapeHtml(n.titulo)}" loading="lazy" onerror="this.src='${imagemPadrao()}'">
      <div class="card-body">
        <span class="badge">${escapeHtml(n.categoria || "Geral")}</span>
        <h3>${escapeHtml(n.titulo)}</h3>
        <p>${escapeHtml(n.resumo || "")}</p>
        <span class="card-date">📅 ${formatarData(n.data)}</span>
      </div>
    </a>
  `;
}

/* ---------------------------------------------------------
   PÁGINA INICIAL (index.html)
--------------------------------------------------------- */

async function renderHome(){
  const heroEl = document.getElementById("hero");
  const gridEl = document.getElementById("newsGrid");
  if(!heroEl || !gridEl) return;

  const noticias = await carregarNoticias();

  if(!noticias.length){
    heroEl.innerHTML = `<div class="hero-skeleton">Nenhuma notícia disponível no momento. Volte em breve!</div>`;
    gridEl.innerHTML = "";
    return;
  }

  // Destaque = primeira notícia (mais recente)
  const destaque = noticias[0];
  heroEl.innerHTML = `
    <a class="hero-link" href="noticia.html?id=${destaque.id}">
      <img class="hero-img" src="${destaque.imagem || imagemPadrao()}" alt="${escapeHtml(destaque.titulo)}" loading="lazy" onerror="this.src='${imagemPadrao()}'">
      <div class="hero-content">
        <span class="badge">${escapeHtml(destaque.categoria || "Destaque")}</span>
        <h1>${escapeHtml(destaque.titulo)}</h1>
        <p>${escapeHtml(destaque.resumo || "")}</p>
        <div class="meta">📅 ${formatarData(destaque.data)}</div>
      </div>
    </a>
  `;

  // Grid principal = demais notícias
  const restantes = noticias.slice(1);
  gridEl.innerHTML = restantes.length
    ? restantes.map(criarCardHtml).join("")
    : `<p class="empty-message">Nenhuma outra notícia disponível.</p>`;

  renderMaisLidas(noticias);
  renderCategorias(noticias);
}

function renderMaisLidas(noticias){
  const ul = document.getElementById("maisLidas");
  if(!ul) return;

  const top5 = noticias.slice(0, 5);
  ul.innerHTML = top5.map((n, i) => `
    <li>
      <span class="rank-number">${i+1}</span>
      <a href="noticia.html?id=${n.id}">${escapeHtml(n.titulo)}</a>
    </li>
  `).join("");
}

function renderCategorias(noticias){
  const ul = document.getElementById("categoriasList");
  if(!ul) return;

  const contagem = {};
  noticias.forEach(n => {
    const cat = n.categoria || "Geral";
    contagem[cat] = (contagem[cat] || 0) + 1;
  });

  const categorias = Object.keys(contagem).sort();

  ul.innerHTML = categorias.map(cat => `
    <li>
      <a href="categoria.html?cat=${encodeURIComponent(cat)}">
        ${escapeHtml(cat)} <span class="tag-count">${contagem[cat]}</span>
      </a>
    </li>
  `).join("");
}

/* ---------------------------------------------------------
   PÁGINA DE NOTÍCIA (noticia.html)
--------------------------------------------------------- */

async function renderNoticia(){
  const container = document.getElementById("articleContent");
  if(!container) return;

  const id = parseInt(getQueryParam("id"), 10);
  const noticias = await carregarNoticias();
  const noticia = noticias.find(n => n.id === id);

  if(!noticia){
    container.innerHTML = `
      <h1>Notícia não encontrada</h1>
      <p>A notícia que você procura não existe ou foi removida.</p>
      <a class="btn-primary" href="index.html">Voltar para a página inicial</a>
    `;
    return;
  }

  // Breadcrumb
  const breadcrumb = document.getElementById("breadcrumb");
  if(breadcrumb){
    breadcrumb.innerHTML = `
      <a href="index.html">Início</a> &raquo;
      <a href="categoria.html?cat=${encodeURIComponent(noticia.categoria)}">${escapeHtml(noticia.categoria)}</a> &raquo;
      <span>${escapeHtml(noticia.titulo)}</span>
    `;
  }

  // Conteúdo do artigo
  const conteudoHtml = (noticia.conteudo || noticia.resumo || "")
    .split(/\n+/)
    .filter(p => p.trim().length)
    .map(p => `<p>${escapeHtml(p)}</p>`)
    .join("");

  container.innerHTML = `
    <img class="article-img" src="${noticia.imagem || imagemPadrao()}" alt="${escapeHtml(noticia.titulo)}" loading="lazy" onerror="this.src='${imagemPadrao()}'">
    <span class="badge">${escapeHtml(noticia.categoria || "Geral")}</span>
    <h1>${escapeHtml(noticia.titulo)}</h1>
    <div class="article-meta">
      <span>📅 ${formatarData(noticia.data)}</span>
      <span>📂 ${escapeHtml(noticia.categoria || "Geral")}</span>
    </div>
    <div class="article-content">
      ${conteudoHtml || "<p>Conteúdo não disponível.</p>"}
    </div>
    ${noticia.url ? `
      <div class="article-source">
        Fonte original: <a href="${noticia.url}" target="_blank" rel="noopener nofollow">${escapeHtml(noticia.url)}</a>
      </div>
    ` : ""}
  `;

  // SEO dinâmico
  atualizarSEO(noticia);

  // Compartilhamento
  configurarCompartilhamento(noticia);

  // Relacionadas
  renderRelacionadas(noticia, noticias);
}

function atualizarSEO(noticia){
  const tituloPagina = `${noticia.titulo} - Equipe Bauzinho Notícias`;
  const descricao = (noticia.resumo || "").substring(0, 160);
  const urlPagina = `${SITE_URL}/noticia.html?id=${noticia.id}`;
  const imagem = noticia.imagem || imagemPadrao();

  document.title = tituloPagina;

  setMeta("pageTitle", tituloPagina, "text");
  setMeta("pageDescription", descricao, "content");
  setMeta("pageCanonical", urlPagina, "href");

  setMeta("ogTitle", tituloPagina, "content");
  setMeta("ogDescription", descricao, "content");
  setMeta("ogImage", imagem, "content");
  setMeta("ogUrl", urlPagina, "content");

  setMeta("twitterTitle", tituloPagina, "content");
  setMeta("twitterDescription", descricao, "content");
  setMeta("twitterImage", imagem, "content");

  // JSON-LD Article
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "NewsArticle",
    "headline": noticia.titulo,
    "description": descricao,
    "image": [imagem],
    "datePublished": noticia.data,
    "dateModified": noticia.data,
    "author": {
      "@type": "Organization",
      "name": "Equipe Bauzinho Notícias"
    },
    "publisher": {
      "@type": "Organization",
      "name": "Equipe Bauzinho Notícias",
      "logo": {
        "@type": "ImageObject",
        "url": `${SITE_URL}/assets/img/logo.png`
      }
    },
    "mainEntityOfPage": {
      "@type": "WebPage",
      "@id": urlPagina
    },
    "articleSection": noticia.categoria
  };

  const script = document.getElementById("jsonLd");
  if(script) script.textContent = JSON.stringify(jsonLd, null, 2);
}

function setMeta(id, valor, atributo){
  const el = document.getElementById(id);
  if(!el) return;
  if(atributo === "text"){
    el.textContent = valor;
  }else{
    el.setAttribute(atributo, valor);
  }
}

function configurarCompartilhamento(noticia){
  const urlPagina = `${SITE_URL}/noticia.html?id=${noticia.id}`;
  const texto = encodeURIComponent(`${noticia.titulo} - ${urlPagina}`);

  const whatsapp = document.getElementById("whatsappShare");
  if(whatsapp){
    whatsapp.href = `https://wa.me/?text=${texto}`;
  }

  const copyBtn = document.getElementById("copyLink");
  if(copyBtn){
    copyBtn.addEventListener("click", () => {
      navigator.clipboard.writeText(urlPagina).then(() => {
        copyBtn.textContent = "✅ Link copiado!";
        setTimeout(() => { copyBtn.innerHTML = "🔗 Copiar Link"; }, 2000);
      }).catch(() => {
        alert("Não foi possível copiar o link.");
      });
    });
  }
}

function renderRelacionadas(noticia, noticias){
  const grid = document.getElementById("relatedGrid");
  if(!grid) return;

  const relacionadas = noticias
    .filter(n => n.id !== noticia.id && n.categoria === noticia.categoria)
    .slice(0, 4);

  const lista = relacionadas.length ? relacionadas : noticias.filter(n => n.id !== noticia.id).slice(0, 4);

  grid.innerHTML = lista.length
    ? lista.map(criarCardHtml).join("")
    : `<p class="empty-message">Nenhuma notícia relacionada encontrada.</p>`;
}

/* ---------------------------------------------------------
   PÁGINA DE CATEGORIA (categoria.html)
--------------------------------------------------------- */

async function renderCategoria(){
  const grid = document.getElementById("categoryGrid");
  if(!grid) return;

  const cat = getQueryParam("cat") || "Geral";
  const noticias = await carregarNoticias();

  const tituloEl = document.getElementById("categoryTitle");
  const descEl = document.getElementById("categoryDesc");
  const emptyEl = document.getElementById("emptyMessage");

  if(tituloEl) tituloEl.textContent = `📂 ${cat}`;
  if(descEl) descEl.textContent = `Todas as notícias sobre ${cat} reunidas em um só lugar.`;

  // SEO
  document.title = `${cat} - Equipe Bauzinho Notícias`;
  setMeta("pageTitle", document.title, "text");
  setMeta("pageDescription", `Notícias sobre ${cat}: as últimas atualizações do setor de logística e e-commerce.`, "content");
  setMeta("pageCanonical", `${SITE_URL}/categoria.html?cat=${encodeURIComponent(cat)}`, "href");
  setMeta("ogTitle", document.title, "content");
  setMeta("ogDescription", `Notícias sobre ${cat}.`, "content");
  setMeta("twitterTitle", document.title, "content");
  setMeta("twitterDescription", `Notícias sobre ${cat}.`, "content");

  const filtradas = noticias.filter(n =>
    (n.categoria || "").toLowerCase() === cat.toLowerCase()
  );

  if(!filtradas.length){
    grid.innerHTML = "";
    if(emptyEl) emptyEl.style.display = "block";
    return;
  }

  if(emptyEl) emptyEl.style.display = "none";
  grid.innerHTML = filtradas.map(criarCardHtml).join("");
}

/* ---------------------------------------------------------
   LAZY LOAD (fallback para navegadores antigos)
--------------------------------------------------------- */

function initLazyLoad(){
  if("IntersectionObserver" in window){
    const observer = new IntersectionObserver((entries, obs) => {
      entries.forEach(entry => {
        if(entry.isIntersecting){
          const img = entry.target;
          if(img.dataset.src){
            img.src = img.dataset.src;
            img.removeAttribute("data-src");
          }
          obs.unobserve(img);
        }
      });
    });

    document.querySelectorAll("img[data-src]").forEach(img => observer.observe(img));
  }
}

/* ---------------------------------------------------------
   INICIALIZAÇÃO
--------------------------------------------------------- */

document.addEventListener("DOMContentLoaded", () => {
  const anoEl = document.getElementById("anoAtual");
  if(anoEl) anoEl.textContent = new Date().getFullYear();

  initDarkMode();
  initMenuMobile();
  initBusca();

  const page = document.body.dataset.page || detectarPagina();

  if(page === "home") renderHome();
  if(page === "noticia") renderNoticia();
  if(page === "categoria") renderCategoria();

  initLazyLoad();
});

function detectarPagina(){
  const path = window.location.pathname;
  if(path.includes("noticia.html")) return "noticia";
  if(path.includes("categoria.html")) return "categoria";
  return "home";
}
