# NOTAS — Pesquisa, decisões e direção de design

Tema: **Tinta & Papel** — tema editorial profissional para o Blogger.
Autor: deivid22srk · Licença: MIT · Data: 2026-10

---

## 1. O que a documentação oficial ensina (Fase 1.1)

### 1.1 Estrutura de um tema

- O tema é **um único arquivo XML** com `<?xml version="1.0" encoding="UTF-8" ?>`, `<!DOCTYPE html>`
  e `<html>` declarando os namespaces `xmlns:b`, `xmlns:data`, `xmlns:expr`.
- Temas modernos (padrão seguido dos temas oficiais Contempo/Notable) usam no `<html>`:

  ```xml
  <html b:css='false' b:defaultwidget-version?='b:defaultwidgetversion=2'
        b:layoutsVersion='3' b:responsive='true'
        expr:dir='data:blog.languageDirection' ...>
  ```

  - `b:css='false'` desliga o CSS padrão de widgets do Blogger (tema assume todo o estilo).
  - `b:layoutsVersion='3'` + `b:defaultwidgetversion='2'` habilitam o motor de dados v2
    (lambdas, `data:view.*`, `resizeImage`, snippets etc.).
  - `b:responsive='true'` declara tema responsivo (sem template mobile separado).

### 1.2 Tags de template (verificadas na documentação e nos temas oficiais)

- `<b:section>`: apenas `<b:widget>` como filho (HTML cru vai **fora** da section).
  Atributos: `id` (obrigatório), `class`, `name`, `maxwidgets`, `showaddelement`, `growth`, `tag`.
- `<b:widget>`: `id` (Tipo+Nº, ex.: `Blog1`), `type`, `locked`, `title`, `visible`, `cond`
  (widget condicional, ex.: `cond='data:view.isHomepage'`), `version` (implícito v2).
- `<b:includable id='main'>` é obrigatório em cada widget; os demais são chamados com
  `<b:include name='...' data='...'/>`.
- Controle: `<b:if>`, `<b:elseif/>`, `<b:else/>`, `<b:loop values var index>`, `<b:switch>`,
  `<b:eval expr>`, `<b:with value var>`, `<b:attr cond name value>`, `<b:class cond name>`,
  `<b:message name='messages.X'><b:param .../></b:message>`, `<b:comment>`.
- Condições v2: `and`, `or`, `not`, `==`, `!=`, `&gt;`, `&lt;`, ternário `? :`,
  elvis `?:`, pertencimento `in {"A","B"}`, lambdas `any/all/none/filter/map/count`
  (ex.: `data:posts filter (p => p.id not in data:featuredPostIds)`).

### 1.3 Dados (Layouts Data Tags + API v2 confirmada em temas oficiais)

- **Globais**: `data:blog.title`, `data:blog.homepageUrl`, `data:blog.url`,
  `data:blog.pageType`, `data:blog.searchUrl`, `data:blog.locale`, `data:blog.encoding`,
  `data:blog.languageDirection`, `data:blog.jumpLinkMessage`.
- **`data:view.*`** (v2): `isHomepage`, `isPost`, `isPage`, `isSingleItem`, `isMultipleItems`,
  `isSearch`, `isLabelSearch`, `isArchive`, `isError`, `isPreview`, `isLayoutMode`,
  `title(.escaped)`, `description(.jsonEscaped)`, `url.canonical`, `featuredImage`,
  `search.label`, `search.query(.escaped)`, `archive.year/month/day`, `postId`.
- **Post (loop `data:posts`)**: `id`, `title`, `body`, `url`, `date` (+`.iso8601`),
  `author.name`, `author.profileUrl`, `author.authorPhoto.url`, `author.aboutMe`,
  `labels` (`name`, `url`), `featuredImage` (+`.isYoutube`, `.youtubeMaxResDefaultUrl`),
  `snippets.short/long` (+`.jsonEscaped`), `numberOfComments`, `allowComments`,
  `hasJumpLink`, `commentsUrl`, `commentsUrlOnclick`.
- **Comentários (v2)**: `data:post.comments` com `id`, `body`, `author`, `authorUrl`,
  `authorAvatarSrc`, `url`, `timestamp`, `isDeleted`, `adminClass`, `deleteUrl`;
  formulário embutido via `data:post.commentFormIframeSrc` + iframe `#comment-editor` +
  `data:post.cmtfpIframe` + `BLOG_CMT_createIframe('<data:post.appRpcRelayPath/>')`.
- **Paginação**: `data:olderPageUrl` / `data:newerPageUrl` (contextuais).
- **Imagens**: `resizeImage(imagem, largura, "W:H")` gera URL recortada do CDN do Blogger.
- **Mensagens localizadas**: `data:messages.*` (postAComment, comments, search, newer, older…).

### 1.4 Widgets mapeados (campos verificados)

| Widget | Campos usados neste tema |
|---|---|
| `Blog` | posts, paginação, comentários, mensagens de status |
| `Header` | `data:this.description`, `data:sourceUrl`, `data:imagePlacement in {"REPLACE","BEFORE_DESCRIPTION"}` |
| `PageList` | `data:links` → `link.title`, `link.href`, `link.isCurrentPage`; settings `homeTitle` |
| `BlogSearch` | `form expr:action='data:blog.searchUrl'`, input `q`, includable core `urlParamsAsFormInput` |
| `PopularPosts` | settings `numItemsToShow/showThumbnails/showSnippets/timeRange`; loop `data:posts` |
| `Label` | `data:this.labels` → `name`, `url`, `count` |
| `BlogArchive` | `data:this.data` → `name`, `url`, `post-count`; `data:this.style` |
| `Profile` | solo: `displayname`, `userUrl`, `aboutme`, `location`, `authorPhoto.image/width/height`; time: loop `data:authors` (item: `display-name`, `userUrl`) |
| `HTML` / `LinkList` | `title`, `content` / `links` → `name`, `target` |
| `Attribution` | `data:bloggerUrl`, `data:copyright`, `b:message messages.poweredByBlogger` |

- **Comentários encadeados**: o próprio Contempo **não define** `threadedComments`,
  `threadedCommentJs` etc. — ele usa os includables padrão do motor (`commentPicker` →
  `threadedComments`). O tema segue a mesma estratégia: define o despachante `commentPicker`
  e a versão plana (`comments`, `commentForm`, `commentItem`, `commentList`), e delega o
  encadeamento ao includable padrão `threadedComments`, estilizado via CSS.

### 1.5 Designer de Temas e `<b:skin>`

- CSS vive em `<b:skin><![CDATA[ ... ]]></b:skin>`; variáveis do Designer são declaradas
  **dentro do CDATA, num comentário CSS** no topo:
  `/* <Variable name="keycolor" description="..." type="color" default="..." value="..."/> */`
  agrupadas por `<Group description="..." selector="...">`.
- Referência no CSS: `$(nome.da.variavel)`. Tipos: `color`, `font`, `length`, `automatic`.
- `<b:template-skin>` só afeta o editor de layout (grid administrativo) — dispensado aqui;
  o layout editor usa o padrão do motor.
- Erros comuns de upload: `&` sem escapar em atributos (`&amp;`), `b:section` com HTML cru,
  `$(var)` referenciada sem `<Variable>` declarada, CDATA quebrado pela sequência `]]>`,
  tags `b:` mal fechadas.

### 1.6 Decisão técnica: build? (Fase 1.3)

**Opção B leve, com zero dependências de npm.** Justificativa:

- O Blogger só aceita o XML final — nada de `npm`/Vite no runtime.
- Manter `styles.css`, `main.js` e `theme.template.xml` separados na fonte melhora
  demais a organização (sintaxe destacada, revisão por diffs) para abrir mão.
- O `scripts/build-theme.mjs` usa **apenas módulos nativos do Node** (`node:fs/promises`,
  `node:child_process`): injeta CSS/JS nos placeholders do template, roda verificações
  estruturais (variáveis `$(...)` declaradas, `b:include` resolvíveis, `]]>` proibido,
  tags `b:` balanceadas) e grava `dist/theme.xml`.
- Validação de boa formação do XML: `lxml`/`xmllint` localmente e `xml.etree` (stdlib
  do Python, pré-instalado nos runners do GitHub) no CI — nenhuma dependência externa.
- Tamanho final estimado (~100 KB) está muito abaixo do limite prático do Blogger (~1 MB).

### 1.7 Boas práticas levantadas

- Escapar `&` como `&amp;` em **todos** os atributos com expressão (inclusive URLs de fontes).
- `font-display: swap`, `preconnect` para `fonts.googleapis.com`/`fonts.gstatic.com`.
- `loading='lazy'` + `decoding='async'` em imagens abaixo da dobra; `fetchpriority='high'`
  na imagem do herói.
- Scripts com `defer` e o anti-flash de tema **inline no `<head>`** (antes do CSS pintar).
- Compatibilidade com o JS do Blogger: manter `<b:include data='blog' name='all-head-content'/>`,
  não remover `all-head-content`, preservar IDs do formulário de comentários
  (`comment-editor`, `comment-editor-src`) e classes administrativas (`item-control`).

---

## 2. Referências de design (Fase 1.2)

Analisadas (observação de padrões públicos — nada foi copiado):

1. **Medium** — leitura longa: medida de ~65–75 caracteres, entrelinho generoso (1.7+),
   hierarquia tipográfica forte para o título.
2. **Ghost (temas editoriais premium)** — herói em destaque + grid de cartões com imagens
   em proporção fixa; tipografia serifada de display com sans para o corpo.
3. **Linear** — disciplina de tokens (espaçamento/raio/sombra), modo escuro impecável com
   superfícies em camadas, bordas sutis em vez de sombras pesadas.
4. **Stripe** — paleta restrita com um acento confiante, foco visível caprichado,
   microinterações rápidas (150–250 ms).
5. **Vercel** — neutralidade do texto, contraste alto, densidade confortável, rodapé sóbrio.
6. **Portfólios editoriais contemporâneos** — cabeçalho fino fixo que se esconde ao rolar,
   rótulos em versalete/caps, numerais tabulares nas metadatas.

### Direção visual escolhida: **Editorial moderno "Papel & Tinta"**

- **Papel quente** no claro (`#FAF8F3`) e **tinta quente** no escuro (`#15120E`) — nada de
  cinza genérico; os neutros têm temperatura, o que dá identidade impressa ao blog.
- **Um só acento**: terracota (`#9C4526` claro / `#E8946B` escuro), configurável pelo
  Designer de Temas via `$(keycolor)`.
- **Par tipográfico**: **Fraunces** (serifada variável, com personalidade de imprensa,
  usada em títulos/logotipo) + **Inter** (sans neutra para corpo e interface).
  Justificativa: o contraste serif-display × sans-texto é a assinatura do editorial moderno;
  ambas são variáveis do Google Fonts (um único request, `display=swap`).
- **Acabamento**: filetes (bordas 1px) em vez de sombras pesadas; sombra apenas de elevação
  em elementos flutuantes (menu, overlay); cantos 6–14 px; foco visível em anel de 2 px;
  `prefers-reduced-motion` respeitado em todas as animações.

### Tokens (variáveis CSS)

- Cores: `--cor-fundo`, `--cor-superficie`, `--cor-superficie-2`, `--cor-texto`,
  `--cor-texto-suave`, `--cor-borda`, `--cor-destaque`, `--cor-destaque-forte`,
  `--cor-destaque-suave` (versão translúcida para fundos de chip).
- Espaço: `--espaco-1..10` (4 → 128 px, escala quasi-proporcional).
- Raio: `--raio-s 6px`, `--raio-m 10px`, `--raio-g 16px`, `--raio-full 999px`.
- Sombra: `--sombra-1` (sutil), `--sombra-2` (overlay/menu), `--sombra-3` (modal).
- Tipografia: `--fonte-titulo` (Fraunces), `--fonte-corpo` (Inter); escala fluida com
  `clamp()` (título do herói 2rem→3.25rem; título de post 2.25rem→3.5rem).

### Contraste verificado (WCAG 2.1, calculado por script)

| Par | Razão | Nível |
|---|---|---|
| Texto `#1F1B16` / fundo `#FAF8F3` | 16.1:1 | AAA |
| Texto suave `#6B635A` / fundo | 5.6:1 | AA |
| Acento (links) `#9C4526` / fundo | 6.0:1 | AA (quase AAA) |
| Texto `#EDE7DD` / fundo `#15120E` | 15.2:1 | AAA |
| Texto suave `#A69C8F` / fundo escuro | 6.9:1 | AA |
| Acento escuro `#E8946B` / fundo escuro | 7.9:1 | AAA |

### Decisões de UX

- **Três estados de tema** (claro/escuro/automático) com ciclo no botão; preferência em
  `localStorage` (`btp-tema`); anti-flash resolve o estado antes da primeira pintura.
- **Herói editorial** na home (primeiro post) + grid de cartões; sem widget FeaturedPost
  (menos acoplamento; o filtro é feito no loop com `b:loop index`).
- **Tempo de leitura** calculado no cliente (corpo do post ÷ 200 ppm) — o Blogger não
  expõe esse dado na API.
- **Posts relacionados** via feed JSON público do próprio blog
  (`/feeds/posts/default/-/rótulo?alt=json`), sem chave de API.
- **404 autoral**, paginação com setas, barra de progresso de leitura, voltar ao topo,
  botão de copiar link com toast, busca em overlay.
- Textos de interface em pt-BR (idioma-alvo do tema), documentado como limitação.

---

## 3. Validação executada (Fase 2/3)

- **XML**: boa formação confirmada com `lxml` (local) e `xmllint` (CI); verificação
  estrutural própria: 11 widgets com `main`, 9 sections com `id` únicos, skin com
  43 KB de CSS e variáveis do Designer declaradas (21 includables resolvidos).
- **Visual**: maquete estática (`preview/`) conferida em navegador headless em
  6 combinações — home/post × desktop/mobile × claro/escuro — além do drawer
  mobile e da busca em overlay. Correções resultantes da validação:
  1. `.leia-mais .seta` sem largura explícita comprimia o texto do link;
  2. `--cor-tinta` no escuro estava com valor de papel (rodapé invisível);
  3. `transform`/`backdrop-filter` no cabeçalho criavam *containing block*
     e quebravam o `position: fixed` do drawer — corrigido animando `top` e
     movendo o blur para `.topo::before`;
  4. overlay de busca ganhou fundo escurecido real (`rgba(15,12,9,.45)` + blur);
  5. `data-tempo-leitura` sem valor violava o XML — corrigido com `=''`.
- **CI**: workflow verde na `main`; `theme.xml` publicado como artefato e como
  asset da release v1.0.0 (sha256 conferido contra o build local).

---

## v1.1.0 — Monetização de links (linkmonetizado.com)

**Pedido do usuário**: incluir o script de página inteira do linkmonetizado.com
e manter o tema responsivo.

Decisões de implementação:

- **Posição**: bloco colocado no fim do `<body>`, **depois** do script principal
  do tema e **antes** de `</body>`. As variáveis (`app_url`, `app_api_token`,
  `app_advert`, `app_exclude_domains`) são declaradas em um `<script>` que
  antecede o `<script src='https://linkmonetizado.com/js/full-page-script.js'>`;
  a ordem sequencial de execução garante que o script externo encontre a
  configuração pronta.
- **CDATA**: o bloco de variáveis fica dentro de `//<![CDATA[ ... //]]>`
  (mesma técnica dos demais scripts do tema) — blindagem contra o parser XML
  do Blogger. Os valores não contêm `&`, `<` ou `>`, mas o CDATA torna a
  manutenção segura mesmo se a lista de exclusão crescer.
- **URL explícita em `https:`**: o snippet original usava URL protocol-relative
  (`//linkmonetizado.com/...`). Como o Blogger serve todas as páginas em HTTPS,
  o resultado é idêntico; explicitar o protocolo evita ambiguidade em previews
  e no editor. Valores de configuração mantidos exatamente como fornecidos.
- **Sem `defer` no script externo**: scripts clássicos no fim do corpo executam
  durante o parsing, antes dos scripts `defer` — comportamento idêntico ao
  snippet original do serviço (reescrita de links no carregamento).
- **Exclusões**: `hail-games.blogspot.com` (o próprio blog), `linkmonetizado.com`
  e `do.webjogos.top` ficam fora da monetização — links internos nunca são
  convertidos, evitando loop de redirecionamento.
- **Responsividade**: inalterada — o script apenas reescreve `href`s externos;
  o layout mobile-first (13 media queries, fluid type com `clamp()`) segue
  intacto.
- **Nota de segurança**: o `app_api_token` é público por natureza (o navegador
  do visitante o executa); documentado no README. Segredo de repositório ele
  não é.
