/**
 * Equipe Bauzinho Notícias
 * scripts/gerarNoticias.js
 *
 * Lê feeds RSS do Google News para uma lista de termos relacionados a
 * fretes, logística, e-commerce e transporte de cargas, converte os
 * itens em objetos JSON no formato usado pelo site e salva o resultado
 * em data/noticias.json.
 *
 * Uso:
 *   node scripts/gerarNoticias.js
 *
 * Dependência:
 *   npm install rss-parser
 */

const fs = require("fs");
const path = require("path");
const Parser = require("rss-parser");

const parser = new Parser({
  timeout: 15000,
  headers: { "User-Agent": "Mozilla/5.0 (EquipeBauzinhoNoticiasBot/1.0)" }
});

// Termos de busca -> categoria exibida no site
const TERMOS = [
  { termo: "logística",        categoria: "Logística" },
  { termo: "frete",             categoria: "Fretes" },
  { termo: "Fiorino",           categoria: "Fiorino" },
  { termo: "Mercado Livre frete", categoria: "Mercado Livre" },
  { termo: "Shopee entrega",     categoria: "Shopee" },
  { termo: "Amazon logística",   categoria: "Amazon" },
  { termo: "diesel preço",       categoria: "Combustível" },
  { termo: "pedágio",            categoria: "Pedágio" },
  { termo: "transportadora",     categoria: "Transportadoras" },
  { termo: "motorista agregado", categoria: "Agregados" },
  { termo: "motorista autônomo", categoria: "Motorista Autônomo" },
  { termo: "ANTT frete",         categoria: "ANTT" }
];

const SAIDA = path.join(__dirname, "..", "data", "noticias.json");
const MAX_POR_TERMO = 8;
const MAX_TOTAL = 120;
const IMAGEM_PADRAO_BASE = "https://picsum.photos/seed";

function montarUrlGoogleNews(termo){
  const query = encodeURIComponent(termo);
  return `https://news.google.com/rss/search?q=${query}&hl=pt-BR&gl=BR&ceid=BR:pt`;
}

function limparTexto(texto){
  if(!texto) return "";
  return texto
    .replace(/<[^>]*>/g, "")    // remove tags HTML
    .replace(/\s+/g, " ")
    .trim();
}

function extrairImagem(item){
  // Tenta extrair imagem de media:content, enclosure ou do HTML da descrição
  if(item.enclosure && item.enclosure.url) return item.enclosure.url;

  if(item["media:content"] && item["media:content"]["$"] && item["media:content"]["$"].url){
    return item["media:content"]["$"].url;
  }

  const conteudo = item.content || item["content:encoded"] || item.contentSnippet || "";
  const match = conteudo.match(/<img[^>]+src="([^"]+)"/i);
  if(match) return match[1];

  return null;
}

function gerarResumo(item){
  const base = limparTexto(item.contentSnippet || item.content || item.title || "");
  return base.length > 220 ? base.substring(0, 217) + "..." : base;
}

function gerarConteudo(item){
  const base = limparTexto(item["content:encoded"] || item.content || item.contentSnippet || item.title || "");
  // Quebra em parágrafos curtos para melhor leitura
  if(base.length <= 280) return base;

  const partes = [];
  let restante = base;
  while(restante.length > 280){
    let corte = restante.lastIndexOf(". ", 280);
    if(corte === -1) corte = 280;
    partes.push(restante.substring(0, corte + 1).trim());
    restante = restante.substring(corte + 1).trim();
  }
  if(restante) partes.push(restante);

  return partes.join("\n\n");
}

async function buscarNoticiasPorTermo({ termo, categoria }){
  const url = montarUrlGoogleNews(termo);
  console.log(`Buscando: ${termo} -> ${categoria}`);

  try{
    const feed = await parser.parseURL(url);
    const itens = (feed.items || []).slice(0, MAX_POR_TERMO);

    return itens.map(item => {
      const imagemExtraida = extrairImagem(item);
      const seed = encodeURIComponent(slugify(item.title || termo));

      return {
        titulo: limparTexto(item.title),
        categoria,
        data: item.isoDate || item.pubDate || new Date().toISOString(),
        imagem: imagemExtraida || `${IMAGEM_PADRAO_BASE}/${seed}/800/500`,
        resumo: gerarResumo(item),
        conteudo: gerarConteudo(item),
        url: item.link || ""
      };
    });
  }catch(err){
    console.error(`Erro ao buscar feed para "${termo}":`, err.message);
    return [];
  }
}

function slugify(texto){
  return (texto || "")
    .toString()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .substring(0, 60) || "noticia";
}

function carregarNoticiasExistentes(){
  try{
    const conteudo = fs.readFileSync(SAIDA, "utf-8");
    const json = JSON.parse(conteudo);
    return Array.isArray(json) ? json : [];
  }catch(err){
    return [];
  }
}

async function main(){
  console.log("==> Iniciando geração automática de notícias...");

  const resultados = await Promise.all(TERMOS.map(buscarNoticiasPorTermo));
  let novasNoticias = resultados.flat();

  // Remove duplicados pela URL
  const vistos = new Set();
  novasNoticias = novasNoticias.filter(n => {
    const chave = n.url || n.titulo;
    if(vistos.has(chave)) return false;
    vistos.add(chave);
    return true;
  });

  // Ordena por data, mais recentes primeiro
  novasNoticias.sort((a, b) => new Date(b.data) - new Date(a.data));

  // Combina com notícias existentes, evitando duplicação por título/url
  const existentes = carregarNoticiasExistentes();
  const urlsExistentes = new Set(existentes.map(n => n.url || n.titulo));

  const combinadas = [...novasNoticias.filter(n => !urlsExistentes.has(n.url || n.titulo)), ...existentes];

  // Limita o total e reordena por data
  combinadas.sort((a, b) => new Date(b.data) - new Date(a.data));
  const finalLista = combinadas.slice(0, MAX_TOTAL);

  // Reatribui IDs sequenciais
  const comIds = finalLista.map((n, index) => ({
    id: index + 1,
    titulo: n.titulo,
    categoria: n.categoria,
    data: n.data,
    imagem: n.imagem,
    resumo: n.resumo,
    conteudo: n.conteudo,
    url: n.url
  }));

  fs.mkdirSync(path.dirname(SAIDA), { recursive: true });
  fs.writeFileSync(SAIDA, JSON.stringify(comIds, null, 2), "utf-8");

  console.log(`==> ${comIds.length} notícias salvas em ${SAIDA}`);
}

main().catch(err => {
  console.error("Erro fatal ao gerar notícias:", err);
  process.exit(1);
});
