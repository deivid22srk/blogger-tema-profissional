# Tinta & Papel — tema editorial para o Blogger

Tema profissional para o Blogger com direção **editorial moderna**: papel quente,
tinta quente e um único acento de terracota — tipografia **Fraunces** (títulos) +
**Inter** (texto), design system próprio com tokens CSS, modo claro/escuro/automático
e widgets do Blogger totalmente estilizados.

- **Um único arquivo XML** pronto para upload no painel do Blogger
- HTML, CSS e **JavaScript 100% próprios (vanilla)** — sem Bootstrap, sem Material Design, sem frameworks
- **Modo claro, escuro e automático** com anti-flash e preferência salva
- **Cor de destaque configurável** pelo Designer de Temas do Blogger
- Home com **herói em destaque + grid de cartões**, página de post com **leitura longa**, comentários funcionando, posts relacionados, barra de progresso e compartilhamento
- **404 autoral**, busca em overlay (atalho `/`), menu drawer no mobile, cabeçalho inteligente
- **Monetização de links integrada** (linkmonetizado.com, script de página inteira) com lista de exclusão de domínios — os links internos do blog nunca são monetizados
- SEO (Open Graph, microdata `BlogPosting`), acessibilidade (WCAG AA/AAA verificado por script, foco visível, `prefers-reduced-motion`) e performance (lazy loading, `preconnect`, `display=swap`, script `defer`)

---

## Instalação no Blogger

> ⚠️ **Faça backup do tema atual antes de prosseguir**
> (Tema → seta ao lado de "Personalizar" → **Backup** → baixe o XML atual).

1. Baixe o arquivo `theme.xml`:
   - **Release (recomendado):** [github.com/deivid22srk/blogger-tema-profissional/releases](https://github.com/deivid22srk/blogger-tema-profissional/releases) → baixe o `theme.xml` da versão mais recente;
   - ou **CI:** aba [*Actions*](https://github.com/deivid22srk/blogger-tema-profissional/actions) → execução mais recente → *Artifacts* → `theme`.
2. No painel do Blogger: **Tema** → seta ao lado de **"Personalizar"** → **Restaurar** → **Fazer upload**.
3. Selecione `theme.xml` e confirme.
4. Visite o blog e confira: home, um post, busca e o menu mobile.

Após instalar, ajuste em **Layout**: páginas do menu (PageList), widget "Sobre o blog"
(HTML no rodapé) e links do rodapé (LinkList). A barra lateral já vem com Populares,
Perfil, Rótulos e Arquivo — todos substituíveis em **Layout → Barra lateral**.

---

## Personalizações

### Pelo painel do Blogger (sem tocar em código)

| O quê | Onde |
|---|---|
| **Cor de destaque** | Tema → Personalizar → Avançado → *Cor de destaque* (`keycolor`) |
| **Cor de fundo (modo claro)** | Tema → Personalizar → Avançado → *Cor de fundo* |
| **Cor do texto (modo claro)** | Tema → Personalizar → Avançado → *Cor do texto* |
| Logotipo em imagem | Layout → *Marca* (Cabeçalho) → enviar imagem |
| Menu | Layout → *Menu principal* (widget Páginas) |
| Widgets da barra lateral e do rodapé | Layout → seções "Barra lateral", "Rodapé" |

O modo escuro deriva automaticamente do acento escolhido (o tema clareia a cor
para manter contraste AAA sobre o fundo escuro).

### Monetização de links (linkmonetizado.com)

O tema já vem com o script de página inteira do linkmonetizado.com configurado
no fim do `<body>` — ele converte automaticamente os **links externos** dos
posts em links monetizados. A configuração fica em `src/theme.template.xml`
(bloco “MONETIZAÇÃO DE LINKS”):

```js
var app_url = 'https://linkmonetizado.com/';
var app_api_token = 'seu-token';
var app_advert = 1;
var app_exclude_domains = ["hail-games.blogspot.com","linkmonetizado.com","do.webjogos.top"];
```

- **app_exclude_domains** protege o blog e parceiros: nenhum domínio listado é
  monetizado (links internos, downloads do próprio site etc.). Adicione outros
  domínios separados por vírgula.
- Para editar sem rebuild: **Tema → Editar HTML**, busque por `app_api_token`.
- O token fica visível no código-fonte da página **por design do serviço**
  (o navegador do visitante precisa dele para gerar os links).

### Pelo código (design system)

Todos os tokens ficam no início de `src/styles.css`:
`--cor-*` (cores), `--espaco-*` (espaçamento), `--raio-*` (cantos),
`--sombra-*` (elevação) e a escala tipográfica. Textos de interface ficam em
`src/blog-widget.xml` (busca "pt-BR" para localizar). Depois de editar:

```bash
npm run build     # gera dist/theme.xml e valida
```

---

## Desenvolvimento

```bash
git clone https://github.com/deivid22srk/blogger-tema-profissional
cd blogger-tema-profissional
node scripts/build-theme.mjs      # ou: npm run build
```

```
blogger-tema-profissional/
├── .github/workflows/build.yml   # CI: monta e valida o XML a cada push
├── docs/NOTAS.md                 # pesquisa na documentação + decisões de design
├── preview/                      # maquete estática para validação visual (não vai ao Blogger)
├── scripts/build-theme.mjs       # build zero-dependência (injeta CSS/JS no XML)
├── scripts/validar-estrutura.py  # checagem estrutural extra (widgets/sections/skin)
├── src/
│   ├── theme.template.xml        # esqueleto do tema (head, skin, widgets, rodapé)
│   ├── blog-widget.xml           # widget Blog completo (posts, comentários, 404…)
│   ├── styles.css                # design system + componentes
│   └── main.js                   # tema, menu, busca, progresso, relacionados…
└── dist/theme.xml                # ARQUIVO FINAL para upload (gerado)
```

O build usa apenas módulos nativos do Node — **não há dependências de npm**.
A validação de XML usa `xmllint` quando disponível (instalado no CI) com
retaguarda para `lxml`/`xml.etree` do Python. A cada push na `main`, o workflow
[`.github/workflows/build.yml`](.github/workflows/build.yml) monta, valida e
publica o `theme.xml` como artefato.

Para conferir o visual localmente, abra `preview/index.html` e `preview/post.html`
no navegador (maquete estática que espelha a saída renderizada — capturas de
referência em `preview/capturas/`).

---

## Limitações conhecidas e próximos passos

- **Textos de interface em pt-BR** (botões, 404, estados vazios). Para internacionalizar, troque os textos em `src/blog-widget.xml` — ou substitua-os pelos correspondentes de `data:messages.*`.
- **Posts relacionados** dependem do feed JSON público do blog; blogs sem rótulos recebem a lista de recentes. Em blogs privados o feed não fica exposto e a seção simplesmente não aparece.
- O widget **FeaturedPost** não é usado por padrão (o herói usa o primeiro post da home via loop, que é mais flexível); é possível adicioná-lo em **Layout** se preferir.
- Comentários: o tema usa o sistema encadeado nativo do Blogger (includables padrão do motor, mesma estratégia dos temas oficiais) — comentários de terceiros (Disqus etc.) exigem ajuste manual.
- O script de monetização é carregado de um serviço externo (linkmonetizado.com); se o serviço sair do ar, os links simplesmente permanecem originais — nada quebra no tema.
- Próximos passos sugeridos: índice/sumário automático para posts longos, paginação por carregamento infinito opcional, botão de newsletter no rodapé e variáveis de fontes no Designer de Temas.

## Licença

[MIT](LICENSE) — use, estude e adapte livremente. Um crédito é sempre bem-vindo.
