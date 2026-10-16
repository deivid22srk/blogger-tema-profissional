#!/usr/bin/env python3
"""Verificação estrutural extra do dist/theme.xml (além da boa formação)."""
import sys
from lxml import etree

CAMINHO = sys.argv[1] if len(sys.argv) > 1 else "dist/theme.xml"
arvore = etree.parse(CAMINHO)
raiz_doc = arvore.getroot()
NS = {"b": "http://www.google.com/2005/gml/b"}
problemas = []

# 1. Namespaces essenciais
for ns in ["b", "data", "expr"]:
    if f"xmlns:{ns}" not in raiz_doc.nsmap and ns not in raiz_doc.nsmap:
        problemas.append(f"Namespace ausente: xmlns:{ns}")

# 2. Todo widget tem includable 'main'
for widget in arvore.iter("{http://www.google.com/2005/gml/b}widget"):
    wid = widget.get("id")
    tipos = [i.get("id") for i in widget.iter("{http://www.google.com/2005/gml/b}includable")]
    if "main" not in tipos:
        problemas.append(f"Widget {wid} sem b:includable 'main' (tem: {tipos})")

# 3. IDs únicos de widgets e sections
ids_widget = [w.get("id") for w in arvore.iter("{http://www.google.com/2005/gml/b}widget")]
dups = {i for i in ids_widget if ids_widget.count(i) > 1}
if dups:
    problemas.append(f"IDs de widget duplicados: {dups}")
ids_section = [s.get("id") for s in arvore.iter("{http://www.google.com/2005/gml/b}section")]
dups = {i for i in ids_section if ids_section.count(i) > 1}
if dups:
    problemas.append(f"IDs de section duplicados: {dups}")

# 4. Widgets obrigatórios presentes
tipos = [w.get("type") for w in arvore.iter("{http://www.google.com/2005/gml/b}widget")]
obrigatorios = {"Blog", "Header", "Attribution"}
faltando = obrigatorios - set(tipos)
if faltando:
    problemas.append(f"Widgets obrigatórios ausentes: {faltando}")

# 5. b:skin com CDATA não vazio
skins = arvore.iter("{http://www.google.com/2005/gml/b}skin")
skin_texto = "".join(s.text or "" for s in skins)
if len(skin_texto) < 1000:
    problemas.append("b:skin parece vazio ou sem CSS injetado")

# 6. Variáveis declaradas no skin
if "<Variable" not in skin_texto:
    problemas.append("b:skin sem <Variable> do Designer de Temas")

if problemas:
    print("✗ Problemas estruturais:")
    for p in problemas:
        print("  •", p)
    sys.exit(1)

print("✓ Estrutura OK:", len(ids_widget), "widgets,", len(ids_section), "sections,",
      len(skin_texto) // 1024, "KB de CSS no skin")
