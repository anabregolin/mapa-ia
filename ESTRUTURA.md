# Estrutura do conteúdo — Mapa Mental de IA

Base para os dados do app: tópicos, ordem, ligações, fórmulas, exercícios e demos.
Tirada dos 28 PDFs, 5 HTMLs e 4 PDDLs em `conteudo-moodle/`.

**Níveis:** 🟢 básico · 🟡 intermediário · 🔴 avançado
**Fonte:** `[aula-06 p28]` = arquivo e página do slide original.

---

## 1. Linha do tempo (o que a barra de controle vai percorrer)

| Pos. | Etapa | Aulas | Tópicos |
|---|---|---|---|
| 0 | Abertura | 1 | Apresentação, IA no dia a dia |
| 1 | **U1 — Visão geral** | 2a | História, Turing, subáreas |
| 2 | **U2 — Agentes** | 2b | Agentes, ambientes, formulação de problemas |
| 3 | U2 — Busca não-informada | 3 | BFS, DFS, custo uniforme, IDS |
| 4 | U2 — Busca informada | 4–5 | Heurísticas, gulosa, A*, IDA*, Weighted A* |
| 5 | U2 — Busca local | 6–7 | Hill Climbing, Simulated Annealing, Genéticos |
| 6 | U2 — Busca adversária | 8–9 | Teoria dos jogos, Minimax, Alfa-beta |
| 7 | ✏️ E1 + P1 | — | Exercício avaliativo 1, Prova 1 |
| 8 | **U3 — Lógica** | 12 | Lógica proposicional, inferência, predicados |
| 9 | U3 — Planejamento | 13–14 | STRIPS, PDDL, progressão/regressão, GraphPlan |
| 10 | ✏️ E2 | — | Modelagem STRIPS + PDDL |
| 11 | **U4 — Incerteza** | 20 | Probabilidade, Bayes, Naive Bayes, Laplace |
| 12 | **U5 — Aprendizado de máquina** | 19 | Paradigmas, bias indutivo, dados |
| 13 | U5 — KNN | 21 | Distâncias, similaridade, KNN |
| 14 | U5 — Árvores de decisão | 24 | Hunt, Gini, entropia, ganho |
| 15 | U5 — Regressão, redes neurais, métricas | (sem slide) | Ver seção 6 |
| 16 | ✏️ E3 + P2 | — | Kaggle, Prova 2 |

> A aula 19 (intro ML) vem antes da 20 no Moodle, mas o programa põe Incerteza (U4) antes de ML (U5).
> No app: **ordem do Moodle na barra** (19 → 20 → 21 → 24), com Bayes ligado às duas unidades.

---

## 2. Árvore de tópicos

### U1 · Visão Geral
- `u1.historia` 🟢 **História da IA** — Turing (1950), ENIAC, Dartmouth (1956), Samuel (damas), ELIZA (1966), sistemas especialistas (DENDRAL, MYCIN), inverno da IA, renascimento (GPU, Big Data, AlexNet 2012, AlphaGo 2016, GPT) `[aula-02a]`
- `u1.turing` 🟢 **Teste de Turing** — critério de inteligência; faz sentido hoje? `[aula-02a p11-22]` + artigo original
- `u1.subareas` 🟢 **Subáreas** — representação, raciocínio, planejamento, ML, visão, PLN, multiagentes `[aula-02a p43]`
- `u1.paradigma` 🟡 **Mudança de paradigma** — de regras fixas para aprender com dados `[aula-02a p41]`

### U2 · Solução de Problemas
**Agentes** `[aula-02b]`
- `u2.agente` 🟢 Agente = sensores + atuadores; **autonomia**
- `u2.tipos-agente` 🟢 Reativo (simples, com modelo) × Cognitivo (objetivo, utilidade, aprendizado)
- `u2.ambientes` 🟢 5 eixos: observável, determinístico, episódico, estático, discreto (+ agente único/multi)
- `u2.tipos-problema` 🟡 Estado único × conformidade × contingência (aspirador de pó, 8 estados)
- `u2.formulacao` 🟢 5 itens: estado inicial, ações, função sucessora S(x), teste objetivo, custo (mapa da Romênia)
- `u2.agente-resolvedor` 🟡 SIMPLE-PROBLEM-SOLVING-AGENT (pseudocódigo)

**Busca não-informada** `[aula-03]`
- `u2.arvore-busca` 🟢 Raiz, nós, arestas, folhas
- `u2.criterios` 🟢 Completude, otimalidade, tempo, espaço; parâmetros **b, d, m**
- `u2.bfs` 🟢 BFS — fila FIFO, ótimo em passos, muita memória
- `u2.dfs` 🟢 DFS — pilha, pouca memória, não completo/ótimo
- `u2.ucs` 🟡 Custo uniforme — fila de prioridade por g(n) ≈ Dijkstra
- `u2.dls-ids` 🟡 Profundidade limitada → Iterative Deepening (melhor dos dois mundos)

**Busca informada** `[aulas-04-05]`
- `u2.heuristica` 🟢 h(n): estimativa até o objetivo; h=0 só no objetivo
- `u2.admissivel` 🟡 Admissível h ≤ h*, consistente, qualidade
- `u2.heur-exemplos` 🟡 Euclidiana (mapa), Manhattan (grade), 8-puzzle: Hamming h1=6, Manhattan h2=14
- `u2.gulosa` 🟡 Gulosa f=h — rápida, não ótima (Iasi → Fagaras)
- `u2.astar` 🔴 A* f=g+h — ótimo se h admissível; Romênia custo 418; memória exponencial
- `u2.idastar` 🔴 IDA* — limite em f, pouca memória (15-puzzle)
- `u2.wastar` 🔴 Weighted A* f=g+w·h — w=0 UCS, w=1 A*, w→∞ gulosa

**Busca local** `[aula-06, aula-07]`
- `u2.otimizacao` 🟢 Otimizar uma solução em vez de achar um caminho (caixeiro viajante (n−1)!/2; N-rainhas)
- `u2.hill` 🟡 Hill Climbing — vizinho melhor; máximo local, platô, encosta; reinício aleatório
- `u2.sa` 🔴 Simulated Annealing — aceita pior com P=e^(ΔE/T); resfriamento
- `u2.ag` 🔴 Algoritmos genéticos — gene, cromossomo, população, fitness
  - `u2.ag.crossover` 1 ponto, n pontos, uniforme, máscara
  - `u2.ag.mutacao` taxa Pm, diversidade
  - `u2.ag.selecao` roleta, torneio, rank

**Busca adversária** `[aulas-08-09]`
- `u2.teoria-jogos` 🟢 Soma zero, informação perfeita, forma normal × extensiva, von Neumann, MAD
- `u2.nash` 🟡 Estratégia dominante, equilíbrio de Nash, eficiência, Pareto (dilema do prisioneiro, pedra-papel-tesoura)
- `u2.forma-extensiva` 🟡 S₀, PLAYER, ACTIONS, RESULT, TERMINAL-TEST, UTILITY
- `u2.minimax` 🔴 MAX/MIN, O(b^m); xadrez b≈35, m≈40
- `u2.alfabeta` 🔴 α, β, poda se α ≥ β; O(b^(m/2)); não muda o resultado

### U3 · Raciocínio e Planejamento
**Lógica** `[aula-12]`
- `u3.agente-kb` 🟢 Agente baseado em conhecimento: Percepção → KB → Inferência → Ação
- `u3.proposicao` 🟢 O que é (e não é) proposição
- `u3.operadores` 🟢 ¬ ∧ ∨ → ↔ e tabelas-verdade
- `u3.equivalencias` 🟡 De Morgan, comutativa, distributiva
- `u3.inferencia` 🟡 Silogismo, Modus Ponens, Modus Tollens, silogismo hipotético e disjuntivo
- `u3.predicados` 🔴 ∀ ∃, predicados sobre objetos

**Planejamento** `[aula-13, aula-14]`
- `u3.plan-vs-busca` 🟢 Busca cega (10 bilhões de ISBNs) × agente que raciocina Buy(x) → Have(x)
- `u3.strips` 🟡 Estados (literais ground, sem funções), mundo fechado, objetivos, ações (pré-condição, add/delete)
- `u3.esquemas` 🟡 Esquema × ação concreta; substituição {p/P1, from/SFO…}
- `u3.semantica` 🟡 Aplicar ação → novo estado s'
- `u3.pddl` 🟡 domain.pddl × problem.pddl; custo (total-cost)
- `u3.prog-regr` 🟡 Progressão (forward) × regressão (backward)
- `u3.classico` 🟢 5 suposições do planejamento clássico
- `u3.graphplan` 🔴 Níveis de estado/ação, mutex (efeitos inconsistentes, interferência, necessidades concorrentes), extração regressiva — jantar surpresa

### U4 · Raciocínio sob Incerteza `[aula-20]`
- `u4.incerteza` 🟢 IA clássica "sabe" × IA probabilística "acredita"
- `u4.prob-basica` 🟢 Espaço amostral, evento, 2^|Ω| eventos, axiomas, P(¬X)=1−P(X)
- `u4.conjunta` 🟡 P(A∩B), independência (dados) × dependência
- `u4.condicional` 🟡 Regra do produto; P(Rei|Copas)=1/13; bolinhas 25%
- `u4.bayes` 🔴 Priori, verossimilhança, evidência, posteriori; meningite 0,02%
- `u4.apr-bayesiano` 🔴 Aprender = atualizar crenças; MAP (argmax); exemplo Taylor
- `u4.naive` 🔴 Independência condicional → produto; Taylor, 22, EUA
- `u4.laplace` 🔴 Frequência zero → (contagem+1)/(total+k)
- `u4.redes-bayes` 🔴 Redes Bayesianas (só título no slide)

### U5 · Aprendizado de Máquina
**Fundamentos** `[aula-19]`
- `u5.ml` 🟢 Programação tradicional × ML (dados + respostas → modelo)
- `u5.paradigmas` 🟢 Supervisionado (classificação/regressão), não supervisionado (clustering, associação, redução de dimensionalidade), reforço; semi e auto-supervisionado
- `u5.modelos` 🟡 Simbólicos, matemáticos, probabilísticos, lazy
- `u5.fitting` 🟡 Underfitting × overfitting × **generalização**
- `u5.bias` 🟡 Bias indutivo: todo algoritmo assume algo sobre o mundo
- `u5.atributos` 🟢 Nominal, ordinal, binário (simétrico/assimétrico), intervalar, proporcional, discreto/contínuo
- `u5.qualidade` 🟡 Ruído × outlier, faltantes (remover, média/mediana/moda, interpolação, regressão, avançados)

**KNN** `[aula-21]`
- `u5.proximidade` 🟢 Similaridade × distância; 4 propriedades (simetria, …, desigualdade triangular)
- `u5.distancias` 🟡 Euclidiana, Manhattan, Minkowski (p=1, 2, ∞), Minkowski normalizada
- `u5.binarios` 🟡 SMC × Jaccard
- `u5.knn` 🔴 Algoritmo, classificação (voto) × regressão (média), efeito de k, normalização, voto ponderado, lazy, maldição da dimensionalidade

**Árvores de decisão** `[aula-24]`
- `u5.arvore` 🟢 Raiz, nós internos, folhas; regras "se… então"; NP-difícil achar a ótima
- `u5.hunt` 🟡 Indução top-down, algoritmo de Hunt, divisões binária/múltipla/contínua
- `u5.gini` 🔴 Gini do nó e da divisão
- `u5.entropia` 🔴 Entropia e ganho de informação

**Sem slide** (aparecem na lista 5, na folha de fórmulas ou na P2)
- `u5.regressao` 🟡 Regressão linear f(x)=β₀+Σβᵢxᵢ × logística
- `u5.gradiente` 🔴 Gradiente descendente, taxa de aprendizado (oscilação)
- `u5.redes-neurais` 🔴 Forward pass, loss, backpropagation, early stopping
- `u5.metricas` 🟡 Matriz de confusão, acurácia, erro, sensibilidade, especificidade, precisão, F1
- `u5.treino-teste` 🟢 Divisão 70/30 (E3), validação

---

## 3. Conexões entre tópicos (linhas do mapa)

**Pré-requisito** (A → B: precisa de A para entender B)
- formulacao → arvore-busca → bfs, dfs → ucs → astar
- criterios → todos os algoritmos de busca
- heuristica → admissivel → gulosa, astar → idastar, wastar
- dls-ids → idastar (mesma ideia: aprofundamento iterativo)
- otimizacao → hill → sa ; hill → ag
- teoria-jogos → forma-extensiva → minimax → alfabeta
- operadores → inferencia → predicados → strips → pddl → graphplan
- prob-basica → conjunta → condicional → bayes → apr-bayesiano → naive → laplace
- proximidade → distancias → knn ; atributos → binarios
- arvore → hunt → gini, entropia

**Ligações "parecido com"** (as mais legais de mostrar)
- `ucs` ≡ `astar` com h=0 ≡ `wastar` com w=0 ; `gulosa` ≡ `wastar` com w→∞
- `gulosa` ~ `dfs` (segue um caminho cegamente)
- `bfs` ≡ `ucs` com custo 1
- `sa` com T→0 ≡ `hill` ; T→∞ ≡ passeio aleatório
- `u3.prog-regr` usa `bfs/ucs` (plano de custo mínimo = custo uniforme)
- `graphplan` extração = busca regressiva
- `heur-exemplos` Manhattan/Euclidiana = mesmas distâncias de `u5.distancias` (Minkowski p=1 e p=2)
- `u3.predicados` → `u5.arvore` (regras "se… então") → `u1.historia` sistemas especialistas
- `u5.arvore` ~ árvore de busca (a lista 5 Q7 fala disso)
- `entropia` ↔ Shannon (Dartmouth, `u1.historia`)
- `knn` k pequeno ↔ `fitting` overfitting ; k grande ↔ underfitting
- `naive` "assume independência" ↔ `bias` ; `knn` "assume proximidade" ↔ `bias`
- `qualidade` imputação KNN ↔ `knn` ; Minkowski normalizada ↔ valores faltantes
- `atributos` binário assimétrico ↔ `binarios` Jaccard
- `apr-bayesiano` ↔ LLMs P(próxima palavra | contexto)
- `ag` MarI/O ↔ `redes-neurais`
- `u2.ambientes` multiagente ↔ `teoria-jogos`
- `u4.incerteza` ↔ `u2.tipos-problema` contingência

---

## 4. Fórmulas (cada uma vira uma animação "montar → substituir → resolver")

| ID | Fórmula | Exemplo resolvido da aula |
|---|---|---|
| f.estados | 2ⁿ estados para n variáveis binárias | aspirador: 2³ = 8 |
| f.complex | BFS O(bᵈ); Minimax O(bᵐ), espaço O(bm); alfa-beta O(b^(m/2)) | xadrez 35⁴⁰ |
| f.tsp | rotas = (n−1)!/2 | 5 → 12; 10 → 181.440* |
| f.admissivel | h(n) ≤ h*(n) | linha reta ≤ estrada |
| f.consistente | h(n) ≤ c(n,a,n') + h(n') | — |
| f.gulosa | f(n) = h(n) | Erechim → POA = 445 km (E1) |
| f.astar | f(n) = g(n) + h(n) | Arad → Bucharest = 418 |
| f.wastar | f(n) = g(n) + w·h(n) | w = 0, 1, ∞ |
| f.sa | P = e^(ΔE/T), ΔE = f(x') − f(x) | — |
| f.roleta | pᵢ = fitnessᵢ / Σ fitness | A=10 … D=40 → 10%, 20%, 30%, 40% |
| f.fitness-eq | fitness = 1 / (1 + \|alvo − resultado\|) | 5x+y²+w+z³=185 |
| f.alfabeta | poda se α ≥ β | lista U2 Q22: 1 poda / 3 podas |
| f.prob | P(¬X) = 1 − P(X); 0 ≤ P ≤ 1 | — |
| f.conjunta | P(A∩B) = P(A)·P(B) (independentes) | dois dados: 1/36 |
| f.produto | P(A∩B) = P(B\|A)·P(A) | Rei\|Copas = 1/13; bolinhas = 25% |
| f.bayes | P(A\|B) = P(B\|A)·P(A) / P(B) | meningite 0,0002 |
| f.map | ĉ = argmax P(cₖ\|x) | Taylor → feminino (0,66 × 0,33) |
| f.naive | P(c\|x₁..xₘ) ∝ P(c)·∏ P(xᵢ\|c) | Taylor,22,EUA → masc 0,014 × 0 |
| f.laplace | (contagem(xᵢ,c)+1) / (contagem(c)+k) | masc 0,0053 × fem 0,0025 |
| f.euclid | √Σ(xᵢ−yᵢ)² | (1,2)-(4,6) = 5 |
| f.manhattan | Σ\|xᵢ−yᵢ\| | (1,2)-(4,6) = 7 |
| f.minkowski | (Σ\|xᵢ−yᵢ\|ᵖ)^(1/p) | p=3 → 4,498 |
| f.mink-norm | (Σδ\|xᵢ−yᵢ\|ᵖ / Σδ)^(1/p) | — |
| f.smc | (m₁₁+m₀₀)/(m₀₁+m₁₀+m₁₁+m₀₀) | 0,7 |
| f.jaccard | m₁₁/(m₀₁+m₁₀+m₁₁) | 0 |
| f.knn | voto da maioria / média dos k | esportes E=(77; 1,8) → futebol |
| f.gini | 1 − Σ p(j\|t)² | (0,6)=0; (3,3)=0,5 |
| f.gini-split | Σ (nᵢ/n)·Gini(i) | aula: 0,371 < 0,5 |
| f.entropia | −Σ p log₂ p | máx log₂ c |
| f.ganho | E(pai) − Σ (nᵢ/n)·E(i) | — |
| f.regressao | f(x) = β₀ + Σ βᵢxᵢ | — |
| f.metricas | TFP, TFN, especificidade, sensibilidade, precisão, F1 | lista 5 Q17 |

\* O slide diz 9!/2 = 118.440, mas a conta dá **181.440**. Vale avisar no app.

---

## 5. Exercícios por tópico

✅ tem gabarito oficial · 🧮 conferi a conta (sem gabarito) · 🖼️ depende de figura do PDF

| Fonte | Questão | Tópico | Status |
|---|---|---|---|
| aula-02b | Drone; 6 ambientes (cruzadinha, xadrez…) | ambientes | ✅ |
| aula-02b | Aspirador: estado único / conformidade / contingência | tipos-problema | ✅ |
| aula-02b | Modelar problema do dia a dia | formulacao | aberto |
| Lista U2 | Q1 ambientes · Q2 colorir mapa, macaco e bananas | ambientes, formulacao | ✅ |
| Lista U2 | Q3–Q7 critérios, BFS/DFS, A* | criterios, bfs, dfs, astar | ✅ |
| Lista U2 | Q8.1–8.6 grafo S→G com BFS, UCS, gulosa, A* | bfs…astar | ✅ 🖼️ |
| Lista U2 | Q9 gulosa × A* · Q10 8-puzzle com A* | gulosa, astar | ✅ (Q10 "arquivo separado", não veio) 🖼️ |
| Lista U2 | Q11 Hill Climbing n18 → n0 com reinício | hill | ✅ 🖼️ |
| Lista U2 | Q12–Q13 HC × SA | hill, sa | ✅ |
| Lista U2 | Q14–Q18 fitness, mutação, crossover, roleta, equação 185 | ag | ✅ |
| Lista U2 | Q19–Q21 V/F busca e minimax | vários | ✅ |
| Lista U2 | Q22 árvore minimax + alfa-beta nas duas ordens | minimax, alfabeta | ✅ 🖼️ |
| aula-07 | 4 V/F de revisão HC/SA | hill, sa | ✅ |
| E1 | Q1 gulosa Erechim → POA · Q2 UCS · Q3 comparar | gulosa, ucs | ✅ 🖼️ |
| E1 | Q4 caixeiro viajante com AG | ag | ✅ 🖼️ |
| E1 | Q5–Q6 minimax + alfa-beta | minimax, alfabeta | ✅ + simulação HTML |
| P1 | Q1 drone · Q2 BFS×DFS · Q3 relacionar algoritmos | vários | ✅ |
| P1 | Q4 BFS Lugoj → Bucharest | bfs | 🖼️ resolver |
| P1 | Q5–Q6 SA · Q7 AG 2a+b²+3c+d=120 · Q8 alfa-beta | sa, ag, alfabeta | ✅ |
| P1 | Q9 aplicar ações (garagem/carro) | semantica | ✅ |
| aula-12 | Proposição ou não · avaliar P→Q · validade · Sócrates/Platão | proposicao, inferencia | parcial |
| aula-13 | Fly(P1,SFO,JFK) · plano das cargas · mundo dos blocos | semantica, strips | ✅ + PDDL |
| aula-14 | GraphPlan jantar surpresa | graphplan | ✅ |
| E2 | 5 problemas (escape room, Minecraft, robô, carta, lâmpada) | strips, pddl | aberto |
| aula-20 | Rei\|Copas, bolinhas, meningite, Taylor (3 versões) | condicional…laplace | ✅ |
| Lista U4 | Q1 spam "promoção" → P(spam\|promo) = 2/3 | bayes | 🧮 |
| Lista U4 | Q4 → 0,28/0,34 = **0,824** | bayes | 🧮 |
| Lista U4 | Q2, Q3, Q5, Q8 teoria · Q6, Q7 discursivas | apr-bayesiano, naive | a resolver |
| Lista U4 NB | Q1 tempo → **Chuva** (0,281 × 0,016) | naive | 🧮 |
| Lista U4 NB | Q2 emergência → **Saudável** (doente dá 0, bom caso para Laplace) | naive, laplace | 🧮 |
| aula-21 | Euclid/Manhattan/Minkowski A(1,2) B(4,6) · SMC/Jaccard · esportes k=1, 3 | distancias, knn | ✅ |
| Lista U5 | Q1 Minkowski 3 pares · Q2 SMC/Jaccard 12 bits (sim 0,417 / 0,3) | distancias, binarios | 🧮 |
| Lista U5 | Q3 KNN no gráfico | knn | 🖼️ |
| Lista U5 | Q4–Q7 teoria | distancias, knn, arvore | a resolver |
| Lista U5 | Q8 Gini = **0,48** · Q9 split = **0,367** (pai 0,469) | gini | 🧮 |
| Lista U5 | Q10 entropia = **0,81** · Q11 ganho = **0,189** | entropia | 🧮 |
| Lista U5 | Q12–Q16, Q18, Q20 árvores, regressão, gradiente, redes | vários | a resolver |
| Lista U5 | Q17 matriz → acc 0,833 · sens 0,8 · esp 0,85 · prec 0,727 · F1 0,762 | metricas | 🧮 |
| aula-24 | Gini split (6,6) → **0,371**, melhor que 0,5 | gini | 🧮 |
| P2 | Q1 spam "desconto + urgente" → P(spam) = **0,857** | naive | 🧮 |
| P2 | Q5 SMC/Jaccard U1-U2 0,5/0,25 · U1-U3 0,67/0,5 · U2-U3 0,5/0,25 → Jaccard | binarios | 🧮 |
| P2 | Q6 Gini A × B | gini | 🖼️ |
| P2 | Q2, Q3, Q4, Q7, Q8 discursivas | bias, qualidade, knn, redes | a resolver |
| E3 | Kaggle: KNN / árvore / Naive Bayes, 70/30, acurácia + matriz | knn, arvore, naive | trabalho (entrega 10/11/2026) |

---

## 6. Demos interativas que já existem (embutir no app)

| Arquivo | Tópico |
|---|---|
| `simulacao-busca-local-hc-sa.html` | hill, sa |
| `demo-poda-alfa-beta.html` | alfabeta |
| `jogo-da-velha-minimax.html` | minimax |
| `super-jogo-da-velha-minimax.html` | minimax (profundidade limitada) |
| `e1-simulacao-poda-alfa-beta.html` | E1 Q6 |
| `pddl-aula-13-aeroporto/` | strips, pddl |
| `pddl-aula-14-mundo-dos-blocos/` | strips, pddl |
| Links externos: vídeo ELIZA, Pathfinding Visualizer, PDDL Editor, vídeo MarI/O | — |

Todas as demos HTML funcionam sozinhas, sem scripts externos. Dá para abrir dentro do app (iframe).

**Demos novas que vou construir:** BFS/DFS/UCS/A* passo a passo no mapa da Romênia e no do RS (E1), heurísticas do 8-puzzle, roleta e crossover, tabela-verdade interativa, aplicar ações STRIPS, camadas do GraphPlan, calculadora de Bayes, Naive Bayes com e sem Laplace, KNN arrastando o ponto e mudando k e p, construtor de árvore com Gini/entropia, matriz de confusão.

---

## 7. Lacunas

1. **Aulas sem arquivo:** 10–11, 15–18, 22–23, 25–26. A aula 21 cita "Aulas 25 e 26: regressão, redes neurais, métricas", mas os slides não estão no Moodle. A lista 5 e a P2 cobram esses assuntos.
   → Vou escrever esses tópicos a partir da folha de fórmulas e das questões, marcados como **"conteúdo complementar (sem slide)"**.
2. **Figuras:** grafos, mapas e árvores dos exercícios são imagens nos PDFs (Romênia, RS, grafo S→G, árvore da Q22, rede n0–n20, gráfico KNN, divisões da P2). Na fase de conteúdo tiro as figuras das páginas e redesenho como grafos interativos.
3. **Itens do programa sem material:** ontologias, redes bayesianas, regras de associação, clustering, Q-learning. Ficam como nós "não visto em aula" no mapa (cinza).
4. **Lista U2 Q10** (8-puzzle com A*): o gabarito está em "arquivo separado", que não veio no download.
