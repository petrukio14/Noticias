# 🚚 Equipe Bauzinho Notícias

Portal de notícias automático sobre **Fiorino, Fretes, Logística, Mercado Livre, Shopee, Amazon, Transportadoras, Agregados, Motorista Autônomo, Diesel, Pedágio e ANTT**, pronto para publicação no **GitHub Pages**.

## 📁 Estrutura do projeto

```
/
├── index.html          # Página inicial
├── noticia.html        # Página individual de notícia
├── categoria.html      # Página de listagem por categoria
├── 404.html            # Página de erro
├── robots.txt
├── sitemap.xml
├── package.json
├── assets/
│   ├── css/style.css
│   └── js/script.js
├── data/
│   └── noticias.json   # Banco de notícias (atualizado automaticamente)
├── scripts/
│   └── gerarNoticias.js
└── .github/
    └── workflows/
        └── noticias.yml
```

## 🚀 Como publicar no GitHub Pages

1. Crie um repositório novo no GitHub (ex: `equipe-bauzinho-noticias`).
2. Suba todos os arquivos deste projeto para a raiz do repositório.
3. Em **Settings > Pages**, selecione a fonte **GitHub Actions**.
4. A primeira execução do workflow `noticias.yml` irá gerar `data/noticias.json` e publicar o site automaticamente.

## ⚙️ Automação diária

O workflow `.github/workflows/noticias.yml`:

- É executado automaticamente **todos os dias às 08:00 (horário de Brasília)**.
- Pode ser disparado manualmente em **Actions > Atualizar Notícias - Equipe Bauzinho > Run workflow**.
- Executa `scripts/gerarNoticias.js`, que busca notícias no **Google News (RSS)** para os termos:
  - logística, frete, Fiorino, Mercado Livre, Shopee, Amazon, diesel, pedágio, transportadora, motorista agregado, motorista autônomo, ANTT.
- Atualiza `data/noticias.json` com as notícias mais recentes.
- Faz commit automático e republica o site no GitHub Pages.

## 🧪 Testar localmente

```bash
npm install
node scripts/gerarNoticias.js
```

Depois, basta abrir `index.html` em um servidor local (ex: extensão "Live Server" do VS Code ou `npx serve`).

## 🎨 Identidade visual

| Elemento     | Cor      |
|--------------|----------|
| Azul Escuro  | `#0D47A1` |
| Laranja      | `#FF9800` |
| Branco       | `#FFFFFF` |

## 📢 Google AdSense

Um espaço reservado para anúncios já está presente na barra lateral (`index.html`). Basta substituir `data-ad-client` e `data-ad-slot` pelos dados da sua conta do Google AdSense e incluir o script oficial do AdSense no `<head>` das páginas.

## 🔍 SEO

- Meta tags de título e descrição dinâmicas.
- Open Graph e Twitter Cards.
- Dados estruturados **Schema.org `NewsArticle`** em cada notícia.
- `sitemap.xml` e `robots.txt` configurados.
