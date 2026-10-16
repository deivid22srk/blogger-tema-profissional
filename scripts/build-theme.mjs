#!/usr/bin/env node
/* ==========================================================================
 * build-theme.mjs — monta dist/theme.xml (zero dependências)
 * 1. Injeta styles.css, main.js e blog-widget.xml nos placeholders do template
 * 2. Roda verificações estruturais próprias (variáveis do skin, includes,
 *    sequências proibidas como "]]>" e "</script>" em conteúdo injetado)
 * 3. Valida a boa formação do XML (xmllint → lxml → xml.etree, o que houver)
 * Uso: node scripts/build-theme.mjs
 * ========================================================================== */
import { readFile, writeFile, mkdir } from "node:fs/promises";
import { execFileSync } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const raiz = join(dirname(fileURLToPath(import.meta.url)), "..");
const ARQ = {
  template: join(raiz, "src", "theme.template.xml"),
  css: join(raiz, "src", "styles.css"),
  js: join(raiz, "src", "main.js"),
  blog: join(raiz, "src", "blog-widget.xml"),
  saida: join(raiz, "dist", "theme.xml"),
};

const CORE_INCLUDES = new Set([
  // Includables fornecidos pelo motor do Blogger (temas oficiais também os usam)
  "all-head-content",
  "quickedit",
  "urlParamsAsFormInput",
  "threadedComments",
  "threadedCommentForm",
  "threadedCommentJs",
  "iframeComments",
  "addComments",
  "responsiveImage",
  "responsiveImageStyle",
  "flatBloggerIcon",
]);

const erros = [];
function falha(msg) {
  erros.push(msg);
}

const [template, css, js, blog] = await Promise.all([
  readFile(ARQ.template, "utf8"),
  readFile(ARQ.css, "utf8"),
  readFile(ARQ.js, "utf8"),
  readFile(ARQ.blog, "utf8"),
]);

/* ---------- 1. Placeholders presentes? ---------------------------------- */
for (const marcador of ["/*@STYLES_CSS@*/", "/*@MAIN_JS@*/", "/*@BLOG_WIDGET@*/"]) {
  if (!template.includes(marcador)) falha(`Placeholder ausente no template: ${marcador}`);
}

/* ---------- 2. Sequências proibidas ------------------------------------ */
// CDATA-quebrante e fechamento precoce de script: estrito para o que vai
// DENTRO de CDATA (css/js); o blog-widget vai em contexto XML cru e a boa
// formação dele é garantida pelo parser no final do build.
for (const [nome, conteudo, dentroDeCdata] of [
  ["styles.css", css, true],
  ["main.js", js, true],
  ["blog-widget.xml", blog, false],
]) {
  const fechaCdata = "]]" + ">";
  if (dentroDeCdata && conteudo.includes(fechaCdata)) {
    falha(`"${nome}" contém a sequência de fechamento de CDATA (${fechaCdata})`);
  }
  if (dentroDeCdata && conteudo.includes("</script")) {
    falha(`"${nome}" contém "</script" — proibido dentro de CDATA`);
  }
}

/* ---------- 3. Variáveis do skin: todo $(nome) deve estar declarado ----- */
const declaradas = new Set(
  [...template.matchAll(/<Variable\s+name="([^"]+)"/g)].map((m) => m[1])
);
const usadas = new Set(
  [...css.matchAll(/\$\(([A-Za-z0-9._-]+)\)/g)].map((m) => m[1])
);
for (const v of usadas) {
  if (!declaradas.has(v)) falha(`Variável do skin usada no CSS mas não declarada: \$(${v})`);
}

/* ---------- 4. Montagem ------------------------------------------------ */
let xml = template
  .replace("/*@STYLES_CSS@*/", () => css)
  .replace("/*@MAIN_JS@*/", () => js)
  .replace("/*@BLOG_WIDGET@*/", () => blog);

// Sobrou algum placeholder?
if (/\/\*@[A-Z_]+@\*\//.test(xml)) {
  falha("Restaram placeholders não substituídos no XML final");
}

/* ---------- 5. Includes resolvíveis ------------------------------------ */
// Includables definidos dentro do próprio tema (qualquer widget/defaultmarkup)
const definidos = new Set([...xml.matchAll(/<b:includable\s+id='([^']+)'/g)].map((m) => m[1]));
const chamados = [...xml.matchAll(/<b:include[^>]*\sname='([^']+)'/g)].map((m) => m[1]);
for (const nome of new Set(chamados)) {
  if (!definidos.has(nome) && !CORE_INCLUDES.has(nome)) {
    falha(`b:include name='${nome}' não existe no tema nem é includable do motor`);
  }
}

/* ---------- 6. Tags b: pareadas (por nome, dentro de cada arquivo) ------ */
const paresB = [
  ["b:if", true],
  ["b:loop", true],
  ["b:includable", true],
  ["b:widget", false],
  ["b:section", true],
];
for (const [tag, autopareada] of paresB) {
  // [\s>] evita casar prefixos de outras tags (ex.: <b:widget-setting .../>)
  const abre = [...xml.matchAll(new RegExp(`<${tag}[\\s>]`, "g"))].length;
  const fecha = [...xml.matchAll(new RegExp(`</${tag}>`, "g"))].length;
  const autoFechada = [...xml.matchAll(new RegExp(`<${tag}\\s[^>]*?/>`, "g"))].length;
  // Bloco: aberturas = fechamentos + auto-fechadas (<tag .../>)
  if (abre - autoFechada !== fecha) {
    falha(`Tags <${tag}> desbalanceadas: ${abre} aberturas (${autoFechada} auto-fechadas) vs ${fecha} fechamentos`);
  }
}

/* ---------- 7. Grava --------------------------------------------------- */
await mkdir(dirname(ARQ.saida), { recursive: true });
await writeFile(ARQ.saida, xml, "utf8");

/* ---------- 8. Validação de boa formação do XML ------------------------ */
function validarXml(caminho) {
  // a) xmllint, se existir
  try {
    execFileSync("xmllint", ["--noout", caminho], { stdio: "pipe" });
    return "xmllint";
  } catch (e) {
    if (e.code !== "ENOENT") throw new Error("xmllint: " + e.stderr?.toString());
  }
  // b) lxml (python), se instalado
  try {
    execFileSync(
      "python3",
      ["-c", "import sys; from lxml import etree; etree.parse(sys.argv[1]); print('ok')", caminho],
      { stdio: "pipe" }
    );
    return "lxml";
  } catch (e) {
    if (e.code !== "ENOENT" && !String(e.stderr || "").includes("ModuleNotFoundError")) {
      throw new Error("lxml: " + e.stderr?.toString());
    }
  }
  // c) xml.etree (stdlib — sempre presente)
  try {
    execFileSync(
      "python3",
      ["-c", "import sys, xml.etree.ElementTree as ET; ET.parse(sys.argv[1]); print('ok')", caminho],
      { stdio: "pipe" }
    );
    return "xml.etree";
  } catch (e) {
    throw new Error("XML mal formado: " + e.stderr?.toString());
  }
}

let validador = "nenhum";
try {
  validador = validarXml(ARQ.saida);
} catch (e) {
  falha(e.message);
}

/* ---------- 9. Relatório ---------------------------------------------- */
const kb = (Buffer.byteLength(xml, "utf8") / 1024).toFixed(1);
if (erros.length) {
  console.error("✗ Build falhou:");
  for (const e of erros) console.error("  • " + e);
  process.exit(1);
}
console.log(`✓ dist/theme.xml gerado (${kb} KB)`);
console.log(`  Validação XML: ${validador}`);
console.log(`  Variáveis do skin: ${[...usadas].join(", ") || "—"}`);
console.log(`  Includes resolvidos: ${new Set(chamados).size} únicos`);
