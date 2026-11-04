#!/usr/bin/env bash
# Move os arquivos da cadeira de IA baixados do Moodle (em ~/Downloads)
# para conteudo-moodle/, com nomes na ordem das aulas.
set -u
SRC="${1:-$HOME/Downloads}"
DST="$(cd "$(dirname "$0")/.." && pwd)/conteudo-moodle"
P=00-plano-de-ensino; U1=01-unidade-1-visao-geral; U2=02-unidade-2-solucao-de-problemas
U3=03-unidade-3-raciocinio-e-planejamento; AM=04-aprendizado-de-maquina; L=05-listas-gabaritos-provas
while IFS='|' read -r orig dest; do
  [ -z "$orig" ] && continue
  if [ -f "$SRC/$orig" ]; then
    mkdir -p "$DST/$(dirname "$dest")"; mv -n "$SRC/$orig" "$DST/$dest" && echo "ok    $dest"
  elif [ -f "$DST/$dest" ]; then echo "já    $dest"
  else echo "FALTA $orig"; fi
done <<LIST
Programa-Disciplina-IA.docx.pdf|$P/00-programa-da-disciplina.pdf
AULA 1.pdf|$P/aula-01-apresentacao-da-disciplina.pdf
AULA 2 - 1.pdf|$U1/aula-02a-visao-geral-e-subareas-de-ia.pdf
turing-computing-machinery.pdf|$U1/leitura-turing-computing-machinery.pdf
AULA 2 - 2.pdf|$U2/aula-02b-agentes-e-ambientes.pdf
AULA 3.pdf|$U2/aula-03-busca-nao-informada.pdf
AULA 4.pdf|$U2/aulas-04-05-busca-informada.pdf
AULA 6.pdf|$U2/aula-06-busca-local-hc-sa.pdf
busca_local_comparacao.html|$U2/simulacao-busca-local-hc-sa.html
AULA7.pdf|$U2/aula-07-algoritmos-geneticos.pdf
AULA 8.pdf|$U2/aulas-08-09-busca-adversaria.pdf
poda-alfa-beta-demo.html|$U2/demo-poda-alfa-beta.html
jogo-da-velha-minimax.html|$U2/jogo-da-velha-minimax.html
super-jogo-da-velha.html|$U2/super-jogo-da-velha-minimax.html
AULA 12.pdf|$U3/aula-12-intro-unidade-3-revisao-de-logica.pdf
AULA 13 (1).pdf|$U3/aula-13-planejamento-classico.pdf
AULA 14.pdf|$U3/aula-14-planejamento-classico-e-pddl.pdf
E2.pdf|$U3/e2-enunciado.pdf
Problemas.pdf|$U3/e2-problemas.pdf
AULA 19.pdf|$AM/aula-19-intro-aprendizado-de-maquina.pdf
AULA 20.pdf|$AM/aula-20-aprendizado-bayesiano.pdf
AULA 21.pdf|$AM/aula-21-knn.pdf
AULA 24.pdf|$AM/aula-24-arvores-de-decisao.pdf
E3.pdf|$AM/e3-enunciado.pdf
Gabarito-E1-LM.pdf|$L/e1-gabarito.pdf
resolucao_turma_LM.html|$L/e1-simulacao-poda-alfa-beta.html
Lista Unidade 2.pdf|$L/lista-unidade-2.pdf
Lista Unidade 2 - Gabarito.pdf|$L/lista-unidade-2-gabarito.pdf
Gabarito P1-33.pdf|$L/prova-p1-2026-1.pdf
Fórmulas-AprendizadoMáquina.pdf|$L/formulas-aprendizado-de-maquina.pdf
Lista Unidade 4.pdf|$L/lista-unidade-4-aprendizado-probabilistico.pdf
Lista Unidade 5.pdf|$L/lista-unidade-5-aprendizado-de-maquina.pdf
P2 - 33 - 2.pdf|$L/prova-p2-2026-1.pdf
LIST
