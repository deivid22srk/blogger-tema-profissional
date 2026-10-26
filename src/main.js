/* ==========================================================================
 * TINTA & PAPEL — script principal do tema (vanilla JS, sem dependências)
 * Responsável por: tema claro/escuro/automático, menu mobile, busca em
 * overlay, cabeçalho inteligente, barra de progresso, tempo de leitura,
 * posts relacionados (feed JSON do Blogger), compartilhar, voltar ao topo
 * e pequenos acabamentos (tabelas roláveis, links externos, fade de imagens).
 * ========================================================================== */
(function () {
  "use strict";

  var CHAVE_TEMA = "btp-tema";
  var raiz = document.documentElement;
  var movimentoReduzido = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ------------------------------------------------------------------
   * 0. REALOCAÇÃO DE WIDGETS DESLOCADOS — ao instalar o tema sobre um
   * blog já existente, o Blogger costuma despejar os widgets antigos na
   * primeira seção que aceita widgets, que é o "Menu principal" (dentro
   * do cabeçalho). No PC a navegação é estática e esses widgets
   * transbordavam do cabeçalho fixo, cobrindo a página inteira. O CSS do
   * tema já os esconde como retaguarda; aqui eles são realocados para o
   * fim da barra lateral (#lateral-widgets), onde são exibidos como
   * cartões nas vistas de post/página — nenhum conteúdo é perdido.
   * ------------------------------------------------------------------ */
  (function () {
    var menu = document.querySelector(".menu-principal");
    if (!menu) return;
    var widgets = menu.querySelectorAll(":scope > .widget");
    if (widgets.length < 2) return;
    var alvo = document.getElementById("lateral-widgets");
    var menuVisto = false;
    Array.prototype.forEach.call(widgets, function (w) {
      // O primeiro PageList permanece como navegação do menu
      if (!menuVisto && w.classList.contains("PageList")) {
        menuVisto = true;
        return;
      }
      if (alvo) alvo.appendChild(w);
      else w.style.display = "none";
    });
  })();

  /* ------------------------------------------------------------------
   * 1. TEMA — três estados (automático, claro, escuro) em ciclo.
   * A preferência crua fica em localStorage; o estado resolvido fica
   * no atributo data-tema do <html> (o anti-flash já definiu antes).
   * ------------------------------------------------------------------ */
  function temaEfetivo(pref) {
    if (pref === "claro" || pref === "escuro") return pref;
    return window.matchMedia("(prefers-color-scheme: dark)").matches ? "escuro" : "claro";
  }

  function aplicarTema(pref) {
    raiz.setAttribute("data-tema-pref", pref);
    raiz.setAttribute("data-tema", temaEfetivo(pref));
    var botao = document.querySelector("[data-acao='alternar-tema']");
    if (botao) {
      var rotulos = { auto: "Tema: automático", claro: "Tema: claro", escuro: "Tema: escuro" };
      botao.setAttribute("aria-label", rotulos[pref] + " — clique para alternar");
      botao.setAttribute("title", rotulos[pref]);
    }
  }

  function lerPref() {
    var p = null;
    try { p = localStorage.getItem(CHAVE_TEMA); } catch (e) { /* modo privado */ }
    return p === "claro" || p === "escuro" || p === "auto" ? p : "auto";
  }

  var prefAtual = lerPref();
  aplicarTema(prefAtual);

  // Segue o sistema enquanto a preferência for "automático"
  var mq = window.matchMedia("(prefers-color-scheme: dark)");
  var aoMudarSistema = function () { if (lerPref() === "auto") aplicarTema("auto"); };
  if (mq.addEventListener) mq.addEventListener("change", aoMudarSistema);
  else if (mq.addListener) mq.addListener(aoMudarSistema);

  document.addEventListener("click", function (ev) {
    var botao = ev.target.closest("[data-acao='alternar-tema']");
    if (!botao) return;
    var ciclo = { auto: "claro", claro: "escuro", escuro: "auto" };
    prefAtual = ciclo[lerPref()];
    try { localStorage.setItem(CHAVE_TEMA, prefAtual); } catch (e) { /* ignora */ }
    aplicarTema(prefAtual);
  });

  /* ------------------------------------------------------------------
   * 2. MENU MOBILE — drawer lateral com fundo, Esc e travamento do foco
   * ------------------------------------------------------------------ */
  var nav = document.getElementById("topo-nav");
  var fundoMenu = document.getElementById("lateral-fundo");

  function menuAberto() { return raiz.hasAttribute("data-menu-aberto"); }

  function alternarMenu(forcar) {
    var abrir = typeof forcar === "boolean" ? forcar : !menuAberto();
    if (abrir) {
      raiz.setAttribute("data-menu-aberto", "");
      document.body.style.overflow = "hidden";
      var primeiro = nav ? nav.querySelector("a, button") : null;
      if (primeiro) primeiro.focus();
    } else {
      raiz.removeAttribute("data-menu-aberto");
      document.body.style.overflow = "";
      var botaoMenu = document.querySelector("[data-acao='abrir-menu']");
      if (botaoMenu) botaoMenu.focus();
    }
    var b = document.querySelector("[data-acao='abrir-menu']");
    if (b) b.setAttribute("aria-expanded", menuAberto() ? "true" : "false");
  }

  document.addEventListener("click", function (ev) {
    if (ev.target.closest("[data-acao='abrir-menu']")) alternarMenu(true);
    else if (ev.target.closest("[data-acao='fechar-menu']")) alternarMenu(false);
    else if (menuAberto() && (ev.target.closest("#lateral-fundo") || ev.target.closest("#topo-nav a"))) {
      alternarMenu(false);
    }
  });

  /* ------------------------------------------------------------------
   * 3. BUSCA EM OVERLAY
   * ------------------------------------------------------------------ */
  var overlayBusca = document.getElementById("busca-overlay");

  function alternarBusca(abrir) {
    if (!overlayBusca) return;
    if (abrir) {
      raiz.setAttribute("data-busca-aberta", "");
      var campo = overlayBusca.querySelector("input[type='search'], input[name='q']");
      window.setTimeout(function () { if (campo) campo.focus(); }, 60);
    } else {
      raiz.removeAttribute("data-busca-aberta");
    }
  }

  document.addEventListener("click", function (ev) {
    if (ev.target.closest("[data-acao='abrir-busca']")) alternarBusca(true);
    else if (ev.target.closest("[data-acao='fechar-busca']")) alternarBusca(false);
  });

  document.addEventListener("keydown", function (ev) {
    if (ev.key === "Escape") {
      if (menuAberto()) alternarMenu(false);
      alternarBusca(false);
    }
    // Atalho "/" abre a busca (quando não estiver digitando)
    if (ev.key === "/" && !/input|textarea|select/i.test(document.activeElement.tagName)) {
      ev.preventDefault();
      alternarBusca(true);
    }
  });

  /* ------------------------------------------------------------------
   * 4. CABEÇALHO INTELIGENTE + VOLTAR AO TOPO (mesma escuta de scroll)
   * ------------------------------------------------------------------ */
  var topo = document.getElementById("topo");
  var voltarTopo = document.getElementById("voltar-topo");
  var ultimoY = window.scrollY;
  var scrollPendente = false;

  function aoRolar() {
    var y = window.scrollY;
    if (topo) {
      topo.classList.toggle("topo--rolado", y > 8);
      if (!menuAberto()) {
        // Esconde ao descer, mostra ao subir (com zona morta de 6 px)
        if (y > ultimoY + 6 && y > 160) topo.classList.add("topo--oculto");
        else if (y < ultimoY - 6) topo.classList.remove("topo--oculto");
      }
    }
    if (voltarTopo) voltarTopo.classList.toggle("visivel", y > 600);
    ultimoY = y;
    progressoLeitura();
    scrollPendente = false;
  }

  window.addEventListener("scroll", function () {
    if (!scrollPendente) {
      scrollPendente = true;
      window.requestAnimationFrame(aoRolar);
    }
  }, { passive: true });

  if (voltarTopo) {
    voltarTopo.addEventListener("click", function () {
      window.scrollTo({ top: 0, behavior: movimentoReduzido ? "auto" : "smooth" });
    });
  }

  /* ------------------------------------------------------------------
   * 5. BARRA DE PROGRESSO DE LEITURA (apenas em posts)
   * ------------------------------------------------------------------ */
  var barra = document.getElementById("progresso");
  var artigo = document.querySelector(".post-corpo");

  function progressoLeitura() {
    if (!barra || !artigo) return;
    var total = artigo.offsetHeight - window.innerHeight + artigo.getBoundingClientRect().top + window.scrollY;
    var avanco = window.scrollY - (artigo.getBoundingClientRect().top + window.scrollY - 96);
    var pct = total > 0 ? Math.min(1, Math.max(0, avanco / total)) : 0;
    barra.firstElementChild.style.transform = "scaleX(" + pct + ")";
  }

  /* ------------------------------------------------------------------
   * 6. TEMPO DE LEITURA (~200 palavras por minuto)
   * ------------------------------------------------------------------ */
  var marcasTempo = document.querySelectorAll("[data-tempo-leitura]");
  if (marcasTempo.length && artigo) {
    var palavras = (artigo.textContent || "").trim().split(/\s+/).length;
    var minutos = Math.max(1, Math.round(palavras / 200));
    marcasTempo.forEach(function (el) {
      el.textContent = minutos + " min de leitura";
    });
  }

  /* ------------------------------------------------------------------
   * 7. POSTS RELACIONADOS — via feed JSON público do próprio blog
   * ------------------------------------------------------------------ */
  var caixaRelacionados = document.getElementById("posts-relacionados");

  function slugImagem(url) {
    // Aumenta a miniatura do feed (s72-c) para 480×270 recortada
    if (!url) return "";
    return url.replace(/\/s72(-c)?(-[a-z]+)?\//, "/w480-h270-c/")
              .replace(/=s72(-c)?(-[a-z]+)?$/, "=w480-h270-c");
  }

  function cartaoRelacionado(entrada) {
    var link = "#";
    entrada.link.forEach(function (l) { if (l.rel === "alternate") link = l.href; });
    var titulo = (entrada.title && entrada.title.$t) || "Sem título";
    var thumb = entrada.media$thumbnail ? slugImagem(entrada.media$thumbnail.url) : "";
    var quando = "";
    if (entrada.published && entrada.published.$t) {
      quando = new Date(entrada.published.$t).toLocaleDateString("pt-BR", {
        day: "2-digit", month: "short", year: "numeric"
      });
    }
    var artigoEl = document.createElement("a");
    artigoEl.className = "relacionados__cartao";
    artigoEl.href = link;
    artigoEl.innerHTML =
      '<div class="relacionados__midia">' +
      (thumb ? '<img loading="lazy" decoding="async" alt="" src="' + thumb + '">' : "") +
      "</div><div class=\"relacionados__corpo\"><h3 class=\"relacionados__titulo\">" +
      titulo.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;") +
      '</h3><span class="relacionados__data">' + quando + "</span></div>";
    return artigoEl;
  }

  if (caixaRelacionados && artigo) {
    var hostBlog = caixaRelacionados.getAttribute("data-blog") || "/";
    var urlAtual = location.href.split("#")[0].split("?")[0];
    var chipRotulo = document.querySelector(".post__rotulos .chip");

    function montarUrl(rotulo) {
      var base = hostBlog.replace(/\/$/, "") + "/feeds/posts/default";
      var caminho = rotulo ? base + "/-/" + encodeURIComponent(rotulo) : base;
      return caminho + "?alt=json&max-results=8&orderby=published";
    }

    function carregarRelacionados(rotulo) {
      var grade = caixaRelacionados.querySelector(".relacionados__grade");
      if (!grade) return;
      fetch(montarUrl(rotulo))
        .then(function (r) { if (!r.ok) throw new Error("feed"); return r.json(); })
        .then(function (dados) {
          var entradas = (dados.feed && dados.feed.entry) || [];
          var usados = entradas.filter(function (e) {
            var link = "#";
            e.link.forEach(function (l) { if (l.rel === "alternate") link = l.href; });
            return link.split("#")[0].split("?")[0] !== urlAtual;
          }).slice(0, 3);
          // Poucos resultados com rótulo? Recua para os recentes do blog.
          if (usados.length < 2 && rotulo) { carregarRelacionados(""); return; }
          if (!usados.length) { caixaRelacionados.hidden = true; return; }
          grade.innerHTML = "";
          usados.forEach(function (e) { grade.appendChild(cartaoRelacionado(e)); });
        })
        .catch(function () { caixaRelacionados.hidden = true; });
    }

    caixaRelacionados.hidden = false;
    carregarRelacionados(chipRotulo ? chipRotulo.textContent.trim() : "");
  }

  /* ------------------------------------------------------------------
   * 8. COMPARTILHAR — API nativa com retaguarda para redes sociais
   * ------------------------------------------------------------------ */
  document.addEventListener("click", function (ev) {
    var botao = ev.target.closest("[data-compartilhar]");
    if (!botao) return;
    ev.preventDefault();
    var url = botao.getAttribute("data-url") || location.href;
    var titulo = botao.getAttribute("data-titulo") || document.title;
    var rede = botao.getAttribute("data-compartilhar");

    if (rede === "nativo" && navigator.share) {
      navigator.share({ title: titulo, url: url }).catch(function () { /* cancelado */ });
      return;
    }
    if (rede === "copiar") {
      (navigator.clipboard ? navigator.clipboard.writeText(url) : Promise.reject())
        .then(function () { mostrarToast("Link copiado para a área de transferência"); })
        .catch(function () {
          var tmp = document.createElement("textarea");
          tmp.value = url;
          document.body.appendChild(tmp);
          tmp.select();
          try { document.execCommand("copy"); mostrarToast("Link copiado"); }
          catch (e) { mostrarToast("Não foi possível copiar"); }
          document.body.removeChild(tmp);
        });
      return;
    }
    var alvos = {
      x: "https://twitter.com/intent/tweet?url={u}&text={t}",
      facebook: "https://www.facebook.com/sharer/sharer.php?u={u}",
      linkedin: "https://www.linkedin.com/sharing/share-offsite/?url={u}",
      telegram: "https://t.me/share/url?url={u}&text={t}",
      whatsapp: "https://api.whatsapp.com/send?text={t}%20{u}"
    };
    if (alvos[rede]) {
      var destino = alvos[rede]
        .replace("{u}", encodeURIComponent(url))
        .replace("{t}", encodeURIComponent(titulo));
      window.open(destino, "_blank", "noopener,noreferrer,width=640,height=560");
    }
  });

  var temporizadorToast = null;
  function mostrarToast(mensagem) {
    var toast = document.getElementById("toast");
    if (!toast) return;
    toast.textContent = mensagem;
    toast.classList.add("visivel");
    window.clearTimeout(temporizadorToast);
    temporizadorToast = window.setTimeout(function () {
      toast.classList.remove("visivel");
    }, 2600);
  }

  /* ------------------------------------------------------------------
   * 9. ACABAMENTOS — ano do rodapé, tabelas roláveis, links externos,
   *    fade-in suave das imagens
   * ------------------------------------------------------------------ */
  var ano = document.getElementById("ano-atual");
  if (ano) ano.textContent = String(new Date().getFullYear());

  // Envolve tabelas do corpo do post para rolarem horizontalmente
  if (artigo) {
    artigo.querySelectorAll("table").forEach(function (t) {
      if (t.parentElement && t.parentElement.classList.contains("tabela-envolve")) return;
      var invólucro = document.createElement("div");
      invólucro.className = "tabela-envolve";
      t.parentNode.insertBefore(invólucro, t);
      invólucro.appendChild(t);
    });

    // Links externos abrem em nova aba com noopener
    artigo.querySelectorAll("a[href^='http']").forEach(function (a) {
      if (a.host !== location.host) {
        a.setAttribute("target", "_blank");
        a.setAttribute("rel", "noopener noreferrer");
      }
    });
  }

  // Imagens: adiciona classe de "carregada" para um fade discreto (CSS opcional)
  document.querySelectorAll("img").forEach(function (img) {
    if (img.complete) return;
    img.addEventListener("load", function () {
      img.style.opacity = "1";
    }, { once: true });
  });
})();
