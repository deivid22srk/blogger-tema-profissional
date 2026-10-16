#!/usr/bin/env python3
"""Verificação estrutural extra do dist/theme.xml (além da boa formação).

Usa apenas a biblioteca padrão (xml.etree) para funcionar em qualquer
ambiente — inclusive nos runners do GitHub Actions, sem instalar nada.
"""
import sys
import xml.etree.ElementTree as ET

NS_B = "{http://www.google.com/2005/gml/b}"
NS_DATA = "{http://www.google.com/2005/gml/data}"
NS_EXPR = "{http://www.google.com/2005/gml/expr}"

CAMINHO = sys.argv[1] if len(sys.argv) > 1 else "dist/theme.xml"
arvore = ET.parse(CAMINHO)
raiz_doc = arvore.getroot()
problemas = []

def todos(tag_ns, nome):
    return list(raiz_doc.iter(f"{tag_ns}{nome}"))

# 1. Namespaces essenciais em uso (implica declaração correta no <html>)
if not todos(NS_B, "section"):
    problemas.append("Namespace b: sem uso — xmlns:b ausente?")
if not any(el.tag.startswith(NS_DATA) for el in raiz_doc.iter()):
    problemas.append("Tags <data:...> não encontradas — xmlns:data ausente?")
tem_expr = any(
    a.startswith(NS_EXPR) for el in raiz_doc.iter() for a in el.attrib
)
if not tem_expr:
    problemas.append("Atributos expr: não encontrados — xmlns:expr ausente?")

# 2. Todo widget tem includable 'main'
widgets = todos(NS_B, "widget")
for widget in widgets:
    wid = widget.get("id")
    tipos = [i.get("id") for i in widget.iter(f"{NS_B}includable")]
    if "main" not in tipos:
        problemas.append(f"Widget {wid} sem b:includable 'main' (tem: {tipos})")

# 3. IDs únicos de widgets e sections
ids_widget = [w.get("id") for w in widgets]
dups = {i for i in ids_widget if ids_widget.count(i) > 1}
if dups:
    problemas.append(f"IDs de widget duplicados: {dups}")
sections = todos(NS_B, "section")
ids_section = [s.get("id") for s in sections]
dups = {i for i in ids_section if ids_section.count(i) > 1}
if dups:
    problemas.append(f"IDs de section duplicados: {dups}")

# 4. Widgets obrigatórios presentes
tipos_widget = [w.get("type") for w in widgets]
obrigatorios = {"Blog", "Header", "Attribution"}
faltando = obrigatorios - set(tipos_widget)
if faltando:
    problemas.append(f"Widgets obrigatórios ausentes: {faltando}")

# 5. b:skin com CDATA/CSS injetado e variáveis do Designer
skins = todos(NS_B, "skin")
skin_texto = "".join(s.text or "" for s in skins)
if len(skin_texto) < 1000:
    problemas.append("b:skin parece vazio ou sem CSS injetado")
if "<Variable" not in skin_texto:
    problemas.append("b:skin sem <Variable> do Designer de Temas")

if problemas:
    print("✗ Problemas estruturais:")
    for p in problemas:
        print("  •", p)
    sys.exit(1)

print(
    f"✓ Estrutura OK: {len(ids_widget)} widgets, {len(ids_section)} sections, "
    f"{len(skin_texto) // 1024} KB de CSS no skin"
)
