import type { Demo, Exercicio, StatusExercicio } from './tipos'

const L = String.raw

const e = (id: string, fonte: string, questao: string, topicos: string[], status: StatusExercicio, extra: Partial<Exercicio> = {}): Exercicio => ({
  id,
  fonte,
  questao,
  topicos,
  status,
  ...extra,
})

// Base: ESTRUTURA.md §5 + texto das listas e provas (extraido/limpo/).
// Os ids são estáveis: o progresso salvo no navegador depende deles.
export const EXERCICIOS: Exercicio[] = [
  // ── U2 ────────────────────────────────────────────────────────────
  e('a02b-ambientes', 'aula-02b', 'Drone e 6 ambientes (cruzadinha, xadrez…): classificar', ['u2.ambientes'], 'gabarito'),
  e('a02b-aspirador', 'aula-02b', 'Aspirador: estado único, conformidade, contingência', ['u2.tipos-problema'], 'gabarito'),
  e('a02b-modelar', 'aula-02b', 'Modelar um problema do dia a dia', ['u2.formulacao'], 'aberto', {
    dica: 'Use os 5 itens da formulação: estado inicial, ações, função sucessora, teste de objetivo e custo.',
  }),
  e('l2-q1-2', 'Lista U2', 'Q1 ambientes · Q2 colorir mapa, macaco e bananas', ['u2.ambientes', 'u2.formulacao'], 'gabarito'),
  e('l2-q3-7', 'Lista U2', 'Q3–Q7 critérios, BFS/DFS, A*', ['u2.criterios', 'u2.bfs', 'u2.dfs', 'u2.astar'], 'gabarito'),
  e('l2-q8', 'Lista U2', 'Q8.1–8.6 grafo S→G com BFS, UCS, gulosa, A*', ['u2.bfs', 'u2.ucs', 'u2.gulosa', 'u2.astar'], 'gabarito', {
    figura: true,
    demo: 'd.sg',
    enunciado: 'Grafo de S até G (há dois nós G, ambos objetivo). Custos: S–A 2, S–B 1, S–C 4, A–D 2, A–E 5, B–F 6, C–H 2, D–G 5, E–G 2, F–G 1, H–G 3. Heurística: S 6, A 4, B 3, C 5, D 6, E 1, F 0,5, H 2, G 0.',
    dica: 'BFS testa o objetivo ao gerar; UCS, gulosa e A* testam ao tirar da fronteira. Empates: ordem alfabética.',
    passos: [
      { texto: '8.1 BFS: expande S (gera A, B, C), A (gera D, E), B (F), C (H), D → gera G. Caminho S→A→D→G, custo 9 → (d).' },
      { texto: '8.2 UCS: sai sempre o menor $g$. Ordem de expansão: S (0), B (1), A (2), C (4), D (4), H (6), F (7), E (7); G sai com $g = 8$ via S→B→F→G → (b).', latex: L`g(\text{S}\to\text{B}\to\text{F}\to\text{G}) = 1 + 6 + 1 = 8` },
      { texto: '8.3 Gulosa: menor $h$. De S vai para B (h = 3), depois F (h = 0,5), depois G → S→B→F→G (a).' },
      { texto: '8.4 A*: menor $f = g + h$. Expande S, B ($f = 4$), A ($f = 6$), F ($f = 7{,}5$) e E ($f = 8$, empata com G e entrou antes); por E, G teria $g = 9$, que não melhora o 8. G sai com $f = 8$ → S→B→F→G (a).', latex: L`f(\text{F}) = 7 + 0{,}5 = 7{,}5 \qquad f(\text{G via F}) = 8 + 0 = 8` },
      { texto: '8.5 Com $h = 0$ para todos, $f = g$: o A* vira busca de custo uniforme → (c).' },
      { texto: '8.6 Se $h$ superestima em alguns nós ela deixa de ser admissível e o A* pode perder a otimalidade → (c).' },
    ],
    resposta: '8.1 (d) S→A→D→G · 8.2 (b) custo 8 · 8.3 (a) · 8.4 (a) S→B→F→G · 8.5 (c) · 8.6 (c)',
  }),
  e('l2-q9-10', 'Lista U2', 'Q9 gulosa × A* · Q10 8-puzzle com A*', ['u2.gulosa', 'u2.astar', 'u2.heur-exemplos'], 'conferido', {
    enunciado: 'Q10: 8-puzzle com estado inicial 2 8 3 / 1 6 4 / 7 _ 5 e objetivo 1 2 3 / 8 _ 4 / 7 6 5. Use A* com $g(n)$ = profundidade e $h(n)$ = peças fora do lugar.',
    dica: 'Q9: as duas usam a mesma $h$, mas só o A* soma o custo já pago. Q10: conte as peças fora do lugar (sem contar o espaço) em cada filho.',
    passos: [
      { texto: 'Q9: a gulosa olha só $h(n)$, é rápida mas pode escolher caminhos caros e não é ótima. O A* usa $f = g + h$; com $h$ admissível ele é ótimo. Mais robusto: A*.' },
      { texto: 'Q10, início: 2, 8, 1 e 6 estão fora do lugar.', latex: L`f = 0 + 4 = 4` },
      { texto: 'Espaço sobe (troca com o 6): 2 8 3 / 1 _ 4 / 7 6 5. Os outros filhos têm $f = 6$.', latex: L`f = 1 + 3 = 4` },
      { texto: 'Espaço sobe de novo (troca com o 8): 2 _ 3 / 1 8 4 / 7 6 5. Empata com mover para a esquerda (2 8 3 / _ 1 4 / 7 6 5), também $f = 5$; seguimos o ramo que leva ao objetivo.', latex: L`f = 2 + 3 = 5` },
      { texto: 'Espaço vai para a esquerda (troca com o 2): _ 2 3 / 1 8 4 / 7 6 5.', latex: L`f = 3 + 2 = 5` },
      { texto: 'Espaço desce (troca com o 1): 1 2 3 / _ 8 4 / 7 6 5.', latex: L`f = 4 + 1 = 5` },
      { texto: 'Espaço vai para a direita (troca com o 8): objetivo.', latex: L`f = 5 + 0 = 5` },
    ],
    resposta: 'Q9: A* (gulosa não é ótima). Q10: 5 movimentos do espaço: cima, cima, esquerda, baixo, direita.',
  }),
  e('l2-q11', 'Lista U2', 'Q11 Hill Climbing n18 → n0 com reinício', ['u2.hill'], 'gabarito', {
    figura: true,
    demo: 'd.hill',
    dica: 'Hill Climbing só olha os vizinhos do nó atual e para quando nenhum é melhor. n3 está colado na estrela, mas não tem aresta até ela.',
    passos: [
      { texto: 'n18: vizinhos n13, n17, n19. O mais perto de n0 é n13.' },
      { texto: 'n13: vizinhos n8, n12, n14, n18. Vai para n8.' },
      { texto: 'n8: vizinhos n3, n7, n9, n13. Vai para n3.' },
      { texto: 'n3: vizinhos n2, n4, n8, todos mais longe que n3. **Mínimo local**: reinício aleatório.' },
      { texto: 'Reinício em n19: n19 → n14 → n9 → n4 → n3, preso de novo.' },
      { texto: 'O gabarito segue com n6 → n1 → n0. Na figura, porém, n7 está mais perto de n0 do que n1, então de n6 o algoritmo iria para n7 → n2 → n3. Só começando em n1 ou n5 se chega a n0. Confira na figura animada.' },
    ],
    resposta: 'n18→n13→n8→n3 (mínimo local); reinícios até cair perto da estrela (n1 ou n5) → n0',
  }),
  e('l2-q12-13', 'Lista U2', 'Q12–Q13 Hill Climbing × Simulated Annealing', ['u2.hill', 'u2.sa'], 'gabarito'),
  e('l2-q17', 'Lista U2', 'Q17 roleta com A=10, B=20, C=30, D=40 (V/F)', ['u2.ag.selecao'], 'gabarito', {
    enunciado: 'População com fitness A = 10, B = 20, C = 30, D = 40 e seleção por roleta. Classifique as afirmações em V ou F.',
    dica: 'A probabilidade de cada um é o seu fitness dividido pela soma.',
    passos: [
      { texto: 'Soma dos fitness:', latex: L`10 + 20 + 30 + 40 = 100` },
      { texto: 'Probabilidades:', latex: L`p_A = 10\%,\; p_B = 20\%,\; p_C = 30\%,\; p_D = 40\%` },
      { texto: '"C é maior que A + B": falso, é **igual** (30% = 10% + 20%).' },
      { texto: '"Multiplicar todos por 2 muda as probabilidades": falso, a razão não muda.' },
      { texto: '"A roleta garante o melhor": falso, é probabilística.' },
      { texto: L`"Com um novo E de fitness 40, D diminui": verdadeiro, a soma vira 140 e $p_D = 40/140 \approx 28{,}6\%$.` },
    ],
    resposta: 'V, V, F (é igual), F, F, V, V',
  }),
  e('l2-q18', 'Lista U2', 'Q18 AG para 5x + y² + w + z³ = 185', ['u2.ag', 'u2.ag.selecao', 'u2.ag.crossover', 'u2.ag.mutacao'], 'gabarito', {
    enunciado: 'Modele um algoritmo genético para achar inteiros (x, y, w, z) com 5x + y² + w + z³ = 185: codificação, fitness, seleção, operadores e população inicial.',
    dica: 'O cromossomo pode ser o próprio vetor (x, y, w, z). O fitness precisa ser máximo quando o erro é zero.',
    passos: [
      { texto: 'Codificação: um gene inteiro por variável, cromossomo $(x, y, w, z)$.' },
      { texto: 'Fitness pelo erro:', latex: L`\text{erro} = |185 - (5x + y^2 + w + z^3)|, \quad \text{fitness} = \frac{1}{1 + \text{erro}}` },
      { texto: 'Exemplo $(4, 7, 10, 5)$:', latex: L`20 + 49 + 10 + 125 = 204 \Rightarrow \text{erro} = 19 \Rightarrow \text{fitness} = 0{,}05` },
      { texto: 'População do gabarito: fitness 0,05; 0,017; 0,036; 0,031 (soma 0,134). Roleta: 37,3%, 12,7%, 26,8%, 23,2%.' },
      { texto: 'Operadores: crossover de 1 ponto no meio (2 genes de cada pai) e mutação aleatória de um gene.' },
    ],
    resposta: 'Cromossomo (x, y, w, z), fitness = 1/(1 + |185 − resultado|), roleta, crossover de 1 ponto, mutação de 1 gene.',
  }),
  e('l2-q14-16', 'Lista U2', 'Q14–Q16 fitness, mutação, crossover', ['u2.ag', 'u2.ag.crossover', 'u2.ag.mutacao'], 'gabarito'),
  e('l2-q19-21', 'Lista U2', 'Q19–Q21 V/F de busca e minimax', ['u2.criterios', 'u2.minimax'], 'gabarito'),
  e('l2-q22', 'Lista U2', 'Q22 árvore minimax + alfa-beta nas duas ordens', ['u2.minimax', 'u2.alfabeta'], 'gabarito', {
    figura: true,
    demo: 'd.arvore-q22',
    enunciado: 'A (MAX) tem filhos B, C, D (MIN); cada um tem três filhos MAX: E, F, G | H, I, J | K, L, M. Folhas: E (3, 12), F (5), G (2, 9), H (6), I (1, 4), J (8), K (7, 2), L (10), M (0, 6, 5).',
    dica: 'A ordem dos filhos não muda o valor minimax, só a quantidade de podas.',
    passos: [
      { texto: 'Nível MAX: E = 12, F = 5, G = 9 · H = 6, I = 4, J = 8 · K = 7, L = 10, M = 6.' },
      { texto: 'Nível MIN: B = min(12, 5, 9) = 5 · C = min(6, 4, 8) = 4 · D = min(7, 10, 6) = 6.' },
      { texto: 'Raiz: A = max(5, 4, 6) = 6. Jogada: A ⇒ D ⇒ M.' },
      { texto: L`Alfa-beta da esquerda para a direita: depois de B, $\alpha = 5$. Em C, H dá 6 e I dá 4, então $\beta = 4 \le \alpha = 5$: **J é podado**. Em D nada é podado. Total: 1 poda.` },
      { texto: L`Raiz da direita para a esquerda (D, C, B): D = 6 dá $\alpha = 6$. Em C, H = 6 já faz $\beta = 6 \le 6$: **I e J podados**. Em B, E = 12 e F = 5 fazem $\beta = 5 \le 6$: **G podado**. Total: 3 podas.` },
    ],
    resposta: 'A = 6 (A⇒D⇒M) · 1 poda (J) na ordem normal, 3 (I, J, G) com a raiz invertida',
  }),
  e('a07-vf', 'aula-07', '4 V/F de revisão de HC e SA', ['u2.hill', 'u2.sa'], 'gabarito'),
  e('e1-q1-3', 'E1', 'Q1 gulosa Erechim → POA · Q2 UCS · Q3 comparar', ['u2.gulosa', 'u2.ucs'], 'gabarito', {
    figura: true,
    demo: 'd.rs',
    dica: 'Gulosa: menor $h$ (tabela de distâncias em linha reta até Porto Alegre). UCS: menor custo acumulado $g$.',
    passos: [
      { texto: 'Q1 gulosa: Erechim (h = 286) gera Passo Fundo (229) e Vacaria (172). Vai para Vacaria.' },
      { texto: 'Vacaria gera Caxias do Sul (96), Passo Fundo e Torres (163). Vai para Caxias, que gera Porto Alegre (0). Porto Alegre sai da fronteira.', latex: L`209 + 113 + 123 = 445\ \text{km}` },
      { texto: 'Q2 custo uniforme: Erechim (0) → Passo Fundo (82) → Vacaria (209) → Ijuí (253) → Lajeado (262) → Caxias (322) → Porto Alegre sai com 378.', latex: L`82 + 180 + 116 = 378\ \text{km}` },
      { texto: 'Q3: a gulosa expandiu menos nós (4 contra 7), mas achou um caminho 67 km mais longo. A UCS é ótima; a gulosa não.' },
    ],
    resposta: 'gulosa: Erechim→Vacaria→Caxias→POA, 445 km · UCS: Erechim→Passo Fundo→Lajeado→POA, 378 km (ótimo)',
  }),
  e('e1-q4', 'E1', 'Q4 caixeiro viajante com AG', ['u2.ag', 'u2.otimizacao'], 'gabarito', {
    figura: true,
    dica: 'Fitness = soma das distâncias da rota (menor é melhor). Depois do crossover, corrija cidades repetidas para a rota continuar válida.',
    passos: [
      { texto: 'Fitness dos pais: C1 = (C, E, B, D, A, C) vale 22 e C2 = (C, B, D, E, A, C) vale 19.' },
      { texto: 'Crossover de um ponto depois do 2º gene: F1 = (C, E | D, E, A, C) e F2 = (C, B | B, D, A, C) repetem cidades. Trocando a repetida pela que falta: F1 = (C, E, D, B, A, C) e F2 = (C, B, E, D, A, C).' },
      { texto: 'Mutação por troca dos genes 2 e 3: F1 = (C, D, E, B, A, C) e F2 = (C, E, B, D, A, C).' },
      { texto: 'Fitness dos filhos:', latex: L`f(F1) = 5 + 1 + 4 + 1 + 7 = 18 \qquad f(F2) = 5 + 4 + 2 + 4 + 7 = 22` },
    ],
    resposta: 'F1 = 18 (melhor que os pais) · F2 = 22 (igual a C1)',
  }),
  e('e1-q5-6', 'E1', 'Q5–Q6 minimax + alfa-beta', ['u2.minimax', 'u2.alfabeta'], 'gabarito', {
    figura: true,
    demo: 'd.arvore-e1',
    passos: [
      { texto: 'Q5, ramo esquerdo: os MAX valem 1, 2 (de 2 e −5) e 8 (de 0, −6 e 8). O MIN escolhe 1.' },
      { texto: 'Ramo direito: o MIN interno vale −2 (de 5, −2, 9); o MAX vale max(−3, −2, −1) = −1; o MIN acima também −1.' },
      { texto: 'Raiz MAX: max(1, −1) = 1.' },
      { texto: L`Q6 com poda, esquerda para a direita. No MAX que vale 2: o MIN acima já tem $\beta = 1$; depois do 2, $\alpha = 2 \ge \beta$: **−5 podado**.` },
      { texto: L`No MIN de −6 (dentro do MAX que tem 0): entra com $\alpha = 0$; depois do −6, $\beta = -6 \le 0$: **o 0 é podado**.` },
      { texto: L`Lado direito: a raiz já garante $\alpha = 1$. No MIN de 5, −2, 9: depois do −2, $\beta = -2 \le \alpha = 1$: **9 podado**.` },
    ],
    resposta: 'raiz = 1 · podados: −5, o 0 abaixo de −6 e o 9',
  }),
  e('p1-q1', 'P1', 'Q1 classificar o ambiente do drone de entrega', ['u2.ambientes'], 'gabarito', {
    enunciado: 'Agente de entrega com drone: entrega pacotes numa cidade, desviando de obstáculos e ajustando a rota em tempo real. Classifique observabilidade, determinismo, episodicidade, dinamismo e discretização.',
    dica: 'Pense no que o drone não consegue ver, no vento e nos pedestres.',
    passos: [
      { texto: 'Não vê a cidade inteira → **parcialmente observável**.' },
      { texto: 'Vento e obstáculos imprevistos → **estocástico**.' },
      { texto: 'Cada manobra afeta as próximas → **sequencial**.' },
      { texto: 'O mundo muda enquanto ele decide → **dinâmico**.' },
      { texto: 'Posição e velocidade são reais → **contínuo**.' },
    ],
    resposta: 'PO, Estocástico, Sequencial, Dinâmico, Contínuo',
  }),
  e('p1-q2', 'P1', 'Q2 BFS × DFS (múltipla escolha)', ['u2.bfs', 'u2.dfs', 'u2.criterios'], 'gabarito', {
    dica: 'Qual das duas guarda a fronteira inteira na memória?',
    passos: [
      { texto: '(A) falsa: a DFS gasta **menos** memória, $O(bm)$.' },
      { texto: '(B) falsa: a BFS é completa mesmo em espaço infinito, se $b$ for finito.' },
      { texto: '(C) falsa: a DFS não é ótima.' },
      { texto: '(D) verdadeira: a BFS guarda todos os nós da fronteira, $O(b^d)$.' },
    ],
    resposta: '(D)',
  }),
  e('p1-q3', 'P1', 'Q3 relacionar algoritmos e definições', ['u2.hill', 'u2.sa', 'u2.ag', 'u2.minimax', 'u2.astar'], 'gabarito', {
    resposta: 'Minimax = jogos de 2 jogadores · A* = pathfinding · SA = sucessor aleatório · AG = Darwin · HC = sem estratégia para escapar de máximos locais',
  }),
  e('p1-q4', 'P1', 'Q4 BFS de Lugoj até Bucharest', ['u2.bfs'], 'resolver', {
    enunciado: 'Um agente precisa ir de Lugoj a Bucharest. Use BFS, mostre as expansões a cada nível e o caminho encontrado.',
    dica: 'Abra a demo "Busca no mapa da Romênia", escolha BFS e origem Lugoj.',
    passos: [
      { texto: 'Nível 0: Lugoj. Vizinhos em ordem alfabética: Mehadia, Timisoara.' },
      { texto: 'Nível 1 → 2: Mehadia gera Drobeta; Timisoara gera Arad.' },
      { texto: 'Nível 2 → 3: Drobeta gera Craiova; Arad gera Sibiu e Zerind.' },
      { texto: 'Nível 3 → 4: Craiova gera Pitesti e Rimnicu Vilcea; Sibiu gera Fagaras e Oradea.' },
      { texto: 'Nível 4: Pitesti gera **Bucharest** (objetivo testado ao gerar).' },
    ],
    resposta: 'Lugoj → Mehadia → Drobeta → Craiova → Pitesti → Bucharest (5 passos, 504 km). Se Timisoara vier antes de Mehadia, sai Lugoj → Timisoara → Arad → Sibiu → Fagaras → Bucharest (5 passos, 679 km). Os dois valem: BFS só garante o menor número de passos.',
  }),
  e('p1-q5-6', 'P1', 'Q5–Q6 Simulated Annealing (múltipla escolha)', ['u2.sa'], 'gabarito', {
    passos: [
      { texto: 'Q5: a vantagem é aceitar, às vezes, movimentos piores para escapar de ótimos locais → (B).' },
      { texto: 'Q6: resfriar rápido demais faz o SA virar Hill Climbing cedo e aumenta o risco de ficar preso → (A).' },
    ],
    resposta: 'Q5 (B) · Q6 (A)',
  }),
  e('p1-q7', 'P1', 'Q7 AG 2a + b² + 3c + d = 120: crossover e mutação', ['u2.ag.crossover', 'u2.ag.mutacao'], 'gabarito', {
    enunciado: 'A = (3, 5, 2, 4) e B = (6, 1, 7, 2). Crossover de 1 ponto após o primeiro gene, gerando F_AB e F_BA. Mutação no 4º gene de F_AB, que recebe 9.',
    dica: 'F_AB começa com o 1º gene de A e segue com o resto de B.',
    passos: [
      { texto: 'Corte após o 1º gene:', latex: L`A = (3 \mid 5, 2, 4), \quad B = (6 \mid 1, 7, 2)` },
      { texto: 'Troca das caudas:', latex: L`F_{AB} = (3, 1, 7, 2), \quad F_{BA} = (6, 5, 2, 4)` },
      { texto: 'Mutação do 4º gene de $F_{AB}$:', latex: L`F_{AB} = (3, 1, 7, 9)` },
    ],
    resposta: 'F_AB = (3, 1, 7, 9) e F_BA = (6, 5, 2, 4)',
  }),
  e('p1-q8', 'P1', 'Q8 poda alfa-beta (múltipla escolha)', ['u2.alfabeta'], 'gabarito', {
    resposta: '(C): ignora ramos que não podem influenciar a decisão. Não muda o valor final e não poda só folhas.',
  }),
  e('p1-q9', 'P1', 'Q9 aplicar EntrarNaGaragem → Ligar(Carro)', ['u3.semantica'], 'gabarito', {
    enunciado: 'Estado inicial: Em(Jardim) ∧ PortaFechada(Garagem) ∧ ChaveComigo ∧ CarroDesligado(Garagem) ∧ CombustivelCheio(Carro). Aplique EntrarNaGaragem e depois Ligar(Carro).',
    dica: "s' = (s − remoções) ∪ adições. O que a ação não menciona continua igual.",
    passos: [
      { texto: 'EntrarNaGaragem: pré-condições Em(Jardim), ChaveComigo e PortaFechada(Garagem) valem. Remove Em(Jardim) e PortaFechada(Garagem), adiciona Em(Garagem).' },
      { texto: 'Estado 1: Em(Garagem) ∧ ChaveComigo ∧ CarroDesligado(Garagem) ∧ CombustivelCheio(Carro).' },
      { texto: 'Ligar(Carro): pré-condições Em(Garagem), CombustivelCheio(Carro) e CarroDesligado(Garagem) valem. Remove CarroDesligado(Garagem).' },
    ],
    resposta: 'Em(Garagem) ∧ ChaveComigo ∧ CombustivelCheio(Carro)',
  }),

  // ── U3 ────────────────────────────────────────────────────────────
  e('a12-logica', 'aula-12', 'Proposição ou não · avaliar P→Q · validade · Sócrates/Platão', ['u3.proposicao', 'u3.inferencia'], 'resolver', {
    dica: 'Perguntas, ordens e frases com variável livre não são proposições. P → Q só é falso com P = V e Q = F.',
  }),
  e('a13-strips', 'aula-13', 'Fly(P1,SFO,JFK) · plano das cargas · mundo dos blocos', ['u3.semantica', 'u3.strips'], 'gabarito'),
  e('a14-graphplan', 'aula-14', 'GraphPlan do jantar surpresa', ['u3.graphplan'], 'gabarito', {
    enunciado: 'S₀ = {lixo, mãosLimpas, silêncio}, objetivo {jantar, presente, ¬lixo}. Ações: cozinhar (pré mãosLimpas → jantar), embrulhar (pré silêncio → presente), carregarLixo (→ ¬lixo, ¬mãosLimpas), jogarLixo (→ ¬lixo, ¬silêncio).',
    dica: 'Procure, no nível de ação 1, quais pares de ações apagam a pré-condição uma da outra.',
    passos: [
      { texto: 'Nível A₁: cozinhar, embrulhar, carregarLixo, jogarLixo (e as ações de persistência).' },
      { texto: 'Mutex por interferência: carregarLixo × cozinhar (apaga mãosLimpas) e jogarLixo × embrulhar (apaga silêncio).' },
      { texto: 'No nível S₁ os três objetivos aparecem, então tenta-se a extração regressiva.' },
      { texto: 'Para ¬lixo é preciso carregarLixo ou jogarLixo, e cada uma é mutex com a ação que gera um dos outros objetivos: carregarLixo × cozinhar e jogarLixo × embrulhar. Nenhuma combinação serve no nível 1.' },
      { texto: 'Falha no nível 1 → expande o nível 2 e extrai de novo: cozinhar e embrulhar num passo, depois carregarLixo (ou jogarLixo) no seguinte.' },
    ],
    resposta: 'Plano em 2 passos: {cozinhar, embrulhar} e depois {carregarLixo}',
  }),
  e('e2', 'E2', '5 problemas: escape room, Minecraft, robô, carta, lâmpada', ['u3.strips', 'u3.pddl'], 'aberto'),

  // ── U4 ────────────────────────────────────────────────────────────
  e('a20-exemplos', 'aula-20', 'Rei|Copas, bolinhas, meningite, Taylor (3 versões)', ['u4.condicional', 'u4.bayes', 'u4.naive', 'u4.laplace'], 'gabarito', {
    dica: 'As versões do Taylor estão resolvidas passo a passo nas fórmulas MAP, Naive Bayes e Laplace.',
  }),
  e('l4-q1', 'Lista U4', 'Q1 spam com a palavra "promoção"', ['u4.bayes', 'u4.prob-basica'], 'conferido', {
    enunciado: '6 e-mails: 3 spam (2 com "promoção") e 3 não spam (1 com "promoção"). Calcule as prioris, as condicionais e P(spam | promoção).',
    dica: 'Conte dentro de cada classe para as condicionais.',
    passos: [
      { texto: 'Prioris:', latex: L`P(S) = \tfrac36 = 0{,}5, \quad P(\neg S) = \tfrac36 = 0{,}5` },
      { texto: 'Condicionais:', latex: L`P(\text{promo} \mid S) = \tfrac23, \quad P(\text{promo} \mid \neg S) = \tfrac13` },
      { texto: 'Evidência:', latex: L`P(\text{promo}) = \tfrac23 \cdot 0{,}5 + \tfrac13 \cdot 0{,}5 = 0{,}5` },
      { texto: 'Bayes:', latex: L`P(S \mid \text{promo}) = \frac{\frac23 \cdot 0{,}5}{0{,}5} = \frac23` },
    ],
    resposta: 'P(spam | promoção) = 2/3 ≈ 0,667',
  }),
  e('l4-q2-3', 'Lista U4', 'Q2–Q3 priori e verossimilhança (múltipla escolha)', ['u4.bayes'], 'conferido', {
    resposta: 'Q2 (D) probabilidade a priori · Q3 (A) probabilidade dos dados dada a hipótese',
  }),
  e('l4-q4', 'Lista U4', 'Q4 P(spam | promoção) com P(spam) = 0,4', ['u4.bayes'], 'conferido', {
    enunciado: 'P(spam) = 0,4; P(promo | spam) = 0,7; P(promo | não spam) = 0,1. Calcule P(spam | promo).',
    dica: 'P(promo) não foi dado: calcule pela probabilidade total.',
    passos: [
      { texto: 'Numerador:', latex: L`0{,}7 \cdot 0{,}4 = 0{,}28` },
      { texto: 'Evidência:', latex: L`P(\text{promo}) = 0{,}28 + 0{,}1 \cdot 0{,}6 = 0{,}34` },
      { texto: 'Bayes:', latex: L`\frac{0{,}28}{0{,}34} \approx 0{,}824` },
    ],
    resposta: '≈ 0,824 (82,4%)',
  }),
  e('l4-q5', 'Lista U4', 'Q5 V/F sobre aprendizado bayesiano', ['u4.apr-bayesiano'], 'conferido', {
    passos: [
      { texto: 'V: hipóteses diferentes continuam plausíveis, com probabilidades diferentes.' },
      { texto: 'V: novos dados podem subir a probabilidade de uma hipótese pouco provável.' },
      { texto: 'F: o objetivo não é eliminar a incerteza, é quantificá-la e atualizá-la.' },
      { texto: 'F: "jamais" está errado; com evidência suficiente ela pode virar a mais provável.' },
      { texto: 'V: Bayes é o mecanismo de atualização. V: a mais provável é a MAP.' },
      { texto: 'V: com mais evidência a priori pesa menos. F: não assume uma única hipótese correta.' },
      { texto: 'V: trabalha com distribuições. F: hipóteses empatadas ainda podem ser usadas (ex.: média ponderada).' },
    ],
    resposta: 'V, V, F, F, V, V, V, F, V, F',
  }),
  e('l4-q6-7', 'Lista U4', 'Q6–Q7 discursivas: Naive Bayes em texto; bayesiano × Naive Bayes', ['u4.apr-bayesiano', 'u4.naive'], 'resolver', {
    dica: 'Q6: vantagens = rápido, pouco dado, muitos atributos; limitações = independência irreal e frequência zero. Q7: Naive Bayes é um caso do aprendizado bayesiano com a hipótese extra de independência condicional.',
  }),
  e('l4-q8', 'Lista U4', 'Q8 afirmações sobre Naive Bayes', ['u4.naive'], 'conferido', {
    passos: [
      { texto: 'I verdadeira: a independência vira produto.' },
      { texto: 'II falsa: usa o Teorema de Bayes.' },
      { texto: 'III verdadeira: funciona bem na prática, ex. spam.' },
      { texto: 'IV falsa: estima as probabilidades das classes.' },
    ],
    resposta: '(C) I e III',
  }),
  e('l4nb-q1', 'Lista U4 NB', 'Q1 previsão do tempo: Nuvens = Sim, Umidade = Alta, Vento = Forte', ['u4.naive'], 'conferido', {
    enunciado: '8 dias: 4 de Chuva (1, 4, 6, 8) e 4 de Sol (2, 3, 5, 7). Classifique o dia 9 com Nuvens = Sim, Umidade Alta = Sim e Vento Forte = Sim.',
    dica: 'Conte cada atributo só dentro dos dias de cada classe.',
    passos: [
      { texto: 'Chuva: nuvens 4/4, umidade 3/4, vento 3/4.', latex: L`0{,}5 \cdot 1 \cdot 0{,}75 \cdot 0{,}75 \approx 0{,}281` },
      { texto: 'Sol: nuvens 1/4, umidade 2/4, vento 1/4.', latex: L`0{,}5 \cdot 0{,}25 \cdot 0{,}5 \cdot 0{,}25 \approx 0{,}016` },
    ],
    resposta: 'Chuva (0,281 × 0,016)',
  }),
  e('l4nb-q2', 'Lista U4 NB', 'Q2 emergência: Febre = Sim, Tosse = Não, Dor de cabeça = Sim', ['u4.naive', 'u4.laplace'], 'conferido', {
    enunciado: '8 pacientes: Doentes 1, 4, 6, 7 e Saudáveis 2, 3, 5, 8. Classifique Febre = Sim, Tosse = Não, Dor de Cabeça = Sim.',
    dica: 'Algum doente tem tosse = Não?',
    passos: [
      { texto: 'Doente: febre 3/4, tosse = não 0/4, dor 3/4.', latex: L`0{,}5 \cdot 0{,}75 \cdot 0 \cdot 0{,}75 = 0` },
      { texto: 'Saudável: febre 1/4, tosse = não 3/4, dor 1/4.', latex: L`0{,}5 \cdot 0{,}25 \cdot 0{,}75 \cdot 0{,}25 \approx 0{,}023` },
      { texto: 'Com Laplace ($k = 2$ em cada atributo) o empate aparece:', latex: L`\text{D: } 0{,}5 \cdot \tfrac46 \cdot \tfrac16 \cdot \tfrac46 = \tfrac{8}{216} \quad \text{S: } 0{,}5 \cdot \tfrac26 \cdot \tfrac46 \cdot \tfrac26 = \tfrac{8}{216}` },
    ],
    resposta: 'Saudável sem Laplace (o zero elimina Doente). Com Laplace as duas classes empatam em 8/216 ≈ 0,037.',
  }),

  // ── U5 ────────────────────────────────────────────────────────────
  e('a21-exemplos', 'aula-21', 'Euclid/Manhattan/Minkowski A(1,2) B(4,6) · SMC/Jaccard · esportes k=1, 3', ['u5.distancias', 'u5.binarios', 'u5.knn'], 'gabarito'),
  e('l5-q1', 'Lista U5', 'Q1 Minkowski p = 1, 2, 3 em três pares de pontos', ['u5.distancias'], 'conferido', {
    enunciado: 'A(2,3)–B(5,7), C(1,4)–D(6,2), E(3,5)–F(7,9). Calcule Minkowski com p = 1, 2 e 3 e discuta.',
    dica: 'Primeiro ache |Δx| e |Δy| de cada par; depois só muda o expoente.',
    passos: [
      { texto: 'A–B: Δ = (3, 4) → p=1: 7 · p=2: 5 · p=3: 4,498' },
      { texto: 'C–D: Δ = (5, 2) → p=1: 7 · p=2: 5,385 · p=3: 5,104' },
      { texto: 'E–F: Δ = (4, 4) → p=1: 8 · p=2: 5,657 · p=3: 5,040' },
      { texto: L`A–B e C–D empatam em Manhattan (7), mas com $p$ maior C–D fica mais longe porque tem uma diferença grande (5). Quanto maior o $p$, mais a maior diferença domina; com $p \to \infty$ sobra só ela.` },
    ],
    resposta: 'A–B: 7 / 5 / 4,498 · C–D: 7 / 5,385 / 5,104 · E–F: 8 / 5,657 / 5,040',
  }),
  e('l5-q2', 'Lista U5', 'Q2 SMC e Jaccard com 12 bits', ['u5.binarios'], 'conferido', {
    enunciado: 'x¹ = [1 0 0 1 1 0 1 0 1 1 1 0], x² = [0 1 0 0 1 1 0 0 1 0 1 1]. Calcule a dissimilaridade com SM e Jaccard.',
    dica: 'Conte as 4 combinações posição a posição.',
    passos: [
      { texto: 'Contagens:', latex: L`m_{11} = 3,\; m_{00} = 2,\; m_{10} = 4,\; m_{01} = 3` },
      { texto: 'SMC:', latex: L`\frac{3 + 2}{12} \approx 0{,}417 \Rightarrow \text{dissimilaridade} \approx 0{,}583` },
      { texto: 'Jaccard:', latex: L`\frac{3}{3 + 4 + 3} = 0{,}3 \Rightarrow \text{dissimilaridade} = 0{,}7` },
    ],
    resposta: 'Similaridade SMC 0,417 / Jaccard 0,3 → dissimilaridade 0,583 / 0,7',
  }),
  e('l5-q3', 'Lista U5', 'Q3 KNN no gráfico (k = 1 e k = 3)', ['u5.knn'], 'conferido', {
    figura: true,
    demo: 'd.knn',
    enunciado: 'Classifique o ponto novo (5, 2) com KNN e distância euclidiana, para k = 1 e k = 3.',
    passos: [
      { texto: 'O mais próximo é (6, 2), da classe vermelha:', latex: L`d = \sqrt{(6-5)^2 + (2-2)^2} = 1` },
      { texto: 'k = 1 → classe vermelha.' },
      { texto: 'Os próximos são (4, 1) e (6, 3), ambos azuis:', latex: L`d = \sqrt{1^2 + 1^2} = \sqrt{2} \approx 1{,}41` },
      { texto: 'k = 3 → 2 azuis × 1 vermelho → classe azul. O resultado muda com k.' },
    ],
    resposta: 'k = 1: vermelha · k = 3: azul',
  }),
  e('l5-q4-7', 'Lista U5', 'Q4–Q7 Manhattan, k, Minkowski, árvores (múltipla escolha)', ['u5.distancias', 'u5.knn', 'u5.arvore'], 'conferido', {
    passos: [
      { texto: 'Q4: Manhattan serve para deslocamento em linhas e colunas → (B).' },
      { texto: 'Q5 (incorreta): $k$ não precisa ser igual ao número de classes → (C).' },
      { texto: 'Q6: Minkowski generaliza Manhattan e Euclidiana → (C).' },
      { texto: 'Q7: I e III verdadeiras; árvores são supervisionadas, não de clustering → (C).' },
    ],
    resposta: 'Q4 (B) · Q5 (C) · Q6 (C) · Q7 (C)',
  }),
  e('l5-q8', 'Lista U5', 'Q8 Gini de 12 Sim e 8 Não', ['u5.gini'], 'conferido', {
    passos: [{ texto: 'Proporções 0,6 e 0,4:', latex: L`1 - (0{,}6^2 + 0{,}4^2) = 1 - 0{,}52 = 0{,}48` }],
    resposta: '(C) 0,48',
  }),
  e('l5-q9', 'Lista U5', 'Q9 Gini da divisão: pai (10, 6) → (8, 2) e (2, 4)', ['u5.gini'], 'conferido', {
    dica: 'Calcule o Gini de cada filho e faça a média ponderada pelo tamanho.',
    passos: [
      { texto: 'Pai:', latex: L`1 - \left(\left(\tfrac{10}{16}\right)^2 + \left(\tfrac{6}{16}\right)^2\right) \approx 0{,}469` },
      { texto: 'Filho 1 (8, 2):', latex: L`1 - (0{,}8^2 + 0{,}2^2) = 0{,}32` },
      { texto: 'Filho 2 (2, 4):', latex: L`1 - \left(\left(\tfrac13\right)^2 + \left(\tfrac23\right)^2\right) \approx 0{,}444` },
      { texto: 'Divisão:', latex: L`\tfrac{10}{16} \cdot 0{,}32 + \tfrac{6}{16} \cdot 0{,}444 \approx 0{,}367` },
    ],
    resposta: '0,367 (menor que 0,469 do pai: boa divisão)',
  }),
  e('l5-q10', 'Lista U5', 'Q10 entropia de 6 positivos e 2 negativos', ['u5.entropia'], 'conferido', {
    passos: [{ texto: 'Proporções 0,75 e 0,25:', latex: L`-(0{,}75 \log_2 0{,}75 + 0{,}25 \log_2 0{,}25) = 0{,}311 + 0{,}5 \approx 0{,}81` }],
    resposta: '(C) 0,81',
  }),
  e('l5-q11', 'Lista U5', 'Q11 ganho de informação: (8, 8) → (6, 2) e (2, 6)', ['u5.entropia'], 'conferido', {
    passos: [
      { texto: 'Entropia do pai: 1 (meio a meio).' },
      { texto: 'Cada grupo (6, 2) ou (2, 6) tem entropia ≈ 0,811.' },
      { texto: 'Ganho:', latex: L`1 - \left(\tfrac{8}{16} \cdot 0{,}811 + \tfrac{8}{16} \cdot 0{,}811\right) \approx 0{,}189` },
    ],
    resposta: '≈ 0,189',
  }),
  e('l5-q12-13', 'Lista U5', 'Q12–Q13 árvores e regressão (múltipla escolha)', ['u5.arvore', 'u5.regressao'], 'conferido', {
    passos: [
      { texto: 'Q12: I, III e IV certas. II errada (árvores sofrem overfitting) e V errada (não precisam normalizar) → (A).' },
      { texto: 'Q13: salário é contínuo, então regressão linear. I, III e IV certas → (B).' },
    ],
    resposta: 'Q12 (A) · Q13 (B)',
  }),
  e('l5-q14', 'Lista U5', 'Q14 gradiente descendente oscilando', ['u5.gradiente'], 'conferido', {
    dica: 'O código está correto. Qual hiperparâmetro controla o tamanho do passo?',
    resposta: 'Taxa de aprendizado alta demais: cada passo passa do mínimo e o custo sobe e desce. Reduzir η resolve.',
  }),
  e('l5-q15-16', 'Lista U5', 'Q15–Q16 treino/teste e regressão logística', ['u5.treino-teste', 'u5.regressao', 'u5.gradiente'], 'conferido', {
    passos: [
      { texto: 'Q15: acertar 100% do treino não garante nada em dados novos → (C).' },
      { texto: 'Q16: I, II e III certas; IV errada, probabilidade pede regressão logística → (B).' },
    ],
    resposta: 'Q15 (C) · Q16 (B)',
  }),
  e('l5-q17', 'Lista U5', 'Q17 matriz de confusão', ['u5.metricas'], 'conferido', {
    enunciado: 'Real positivo: 80 previstos positivos e 20 negativos. Real negativo: 30 previstos positivos e 170 negativos. Calcule acurácia, erro, sensibilidade, especificidade, precisão e F1.',
    dica: 'VP = 80, FN = 20, FP = 30, VN = 170.',
    passos: [
      { texto: 'Acurácia e erro:', latex: L`\frac{80 + 170}{300} \approx 0{,}833, \quad \text{erro} \approx 0{,}167` },
      { texto: 'Sensibilidade e especificidade:', latex: L`\frac{80}{100} = 0{,}8, \quad \frac{170}{200} = 0{,}85` },
      { texto: 'Precisão:', latex: L`\frac{80}{110} \approx 0{,}727` },
      { texto: 'F1:', latex: L`2 \cdot \frac{0{,}727 \cdot 0{,}8}{0{,}727 + 0{,}8} \approx 0{,}762` },
    ],
    resposta: 'acc 0,833 · erro 0,167 · sens 0,8 · esp 0,85 · prec 0,727 · F1 0,762',
  }),
  e('l5-q18', 'Lista U5', 'Q18 validação piora enquanto o treino melhora', ['u5.redes-neurais', 'u5.fitting'], 'conferido', {
    resposta: '(C) I e III: é overfitting; usar parada antecipada pela validação (early stopping).',
  }),
  e('l5-q20', 'Lista U5', 'Q20 fluxo de aprendizagem de uma rede neural', ['u5.redes-neurais', 'u5.gradiente'], 'resolver', {
    dica: 'Quatro etapas, nessa ordem: forward pass → loss → backpropagation → gradiente descendente.',
  }),
  e('a24-gini', 'aula-24', 'Gini da divisão (6,6) → (5,2) e (1,4)', ['u5.gini'], 'conferido', {
    dica: 'Está resolvido passo a passo na fórmula "Gini da divisão".',
    resposta: '0,371, melhor que 0,5',
  }),
  e('p2-q1', 'P2', 'Q1 spam com "desconto" e "urgente"', ['u4.naive'], 'conferido', {
    enunciado: '5 mensagens: Spam 1 e 5 (as duas com desconto e urgente); Não spam 2 (urgente), 3 (desconto), 4 (nenhuma). Classifique uma mensagem com "desconto" e "urgente".',
    dica: 'Prioris 2/5 e 3/5. Conte cada palavra dentro de cada classe.',
    passos: [
      { texto: 'Condicionais:', latex: L`P(d \mid S) = P(u \mid S) = 1, \quad P(d \mid \neg S) = P(u \mid \neg S) = \tfrac13` },
      { texto: 'Produtos:', latex: L`S: 0{,}4 \cdot 1 \cdot 1 = 0{,}4 \qquad \neg S: 0{,}6 \cdot \tfrac13 \cdot \tfrac13 \approx 0{,}067` },
      { texto: 'Normalizando:', latex: L`P(S \mid d, u) = \frac{0{,}4}{0{,}4 + 0{,}067} \approx 0{,}857` },
    ],
    resposta: 'Spam, com P ≈ 0,857',
  }),
  e('p2-q5', 'P2', 'Q5 SMC e Jaccard entre três usuários', ['u5.binarios'], 'conferido', {
    enunciado: 'U1 = 110010, U2 = 000011, U3 = 100110 (funcionalidades A–F). Calcule SMC e Jaccard nos três pares e diga qual coeficiente usar.',
    dica: 'Usar ou não uma funcionalidade é binário simétrico ou assimétrico?',
    passos: [
      { texto: 'U1–U2: $m_{11}=1, m_{00}=2, m_{10}=2, m_{01}=1$ → SMC 0,5 · J 0,25' },
      { texto: 'U1–U3: $m_{11}=2, m_{00}=2, m_{10}=1, m_{01}=1$ → SMC 0,667 · J 0,5' },
      { texto: 'U2–U3: $m_{11}=1, m_{00}=2, m_{10}=1, m_{01}=2$ → SMC 0,5 · J 0,25' },
      { texto: 'Dois usuários que **não** usam uma funcionalidade não ficam parecidos por isso: o atributo é assimétrico, então Jaccard.' },
    ],
    resposta: 'U1-U2 0,5/0,25 · U1-U3 0,67/0,5 · U2-U3 0,5/0,25 → usar Jaccard',
  }),
  e('p2-q6', 'P2', 'Q6 Gini da divisão A × B', ['u5.gini'], 'conferido', {
    figura: true,
    enunciado: 'Nó pai com 13 exemplos da classe 1 e 8 da classe 2. Divisão A: filhos (9, 2) e (4, 6). Divisão B: filhos (8, 1) e (5, 7). Qual divisão é melhor pelo índice de Gini?',
    dica: 'Gini de cada filho, depois a média ponderada pelo tamanho de cada filho. Melhor divisão = menor Gini.',
    passos: [
      { texto: 'Pai:', latex: L`1 - \left(\tfrac{13}{21}\right)^2 - \left(\tfrac{8}{21}\right)^2 \approx 0{,}4717` },
      { texto: 'Divisão A:', latex: L`G(9,2) = 1 - \left(\tfrac{9}{11}\right)^2 - \left(\tfrac{2}{11}\right)^2 \approx 0{,}2975 \qquad G(4,6) = 1 - 0{,}4^2 - 0{,}6^2 = 0{,}48` },
      { texto: 'Média ponderada de A:', latex: L`\tfrac{11}{21}\cdot 0{,}2975 + \tfrac{10}{21}\cdot 0{,}48 \approx 0{,}3844` },
      { texto: 'Divisão B:', latex: L`G(8,1) = 1 - \left(\tfrac{8}{9}\right)^2 - \left(\tfrac{1}{9}\right)^2 \approx 0{,}1975 \qquad G(5,7) = 1 - \left(\tfrac{5}{12}\right)^2 - \left(\tfrac{7}{12}\right)^2 \approx 0{,}4861` },
      { texto: 'Média ponderada de B:', latex: L`\tfrac{9}{21}\cdot 0{,}1975 + \tfrac{12}{21}\cdot 0{,}4861 \approx 0{,}3624` },
      { texto: 'B tem o menor Gini (0,3624 < 0,3844), ou seja, maior ganho em relação ao pai.' },
    ],
    resposta: 'Divisão B (Gini 0,3624 contra 0,3844 de A)',
  }),
  e('p2-discursivas', 'P2', 'Q2, Q3, Q4, Q7 discursivas (bias, dados, KNN, backprop)', ['u5.bias', 'u5.qualidade', 'u5.knn', 'u5.redes-neurais'], 'resolver', {
    dica: 'Q3 é múltipla escolha: (e). As outras estão cobertas nas explicações de bias indutivo, KNN e redes neurais.',
  }),
  e('e3', 'E3', 'Kaggle: KNN / árvore / Naive Bayes, 70/30, acurácia + matriz', ['u5.knn', 'u5.arvore', 'u4.naive', 'u5.treino-teste'], 'trabalho', { resposta: 'entrega em 10/11/2026' }),
]

export const DEMOS: Demo[] = [
  { id: 'd.romenia', titulo: 'Busca no mapa da Romênia', topicos: ['u2.bfs', 'u2.dfs', 'u2.ucs', 'u2.gulosa', 'u2.astar', 'u2.formulacao', 'u2.heuristica'], url: 'busca:romenia', componente: true },
  { id: 'd.rs', titulo: 'E1: busca no mapa do RS', topicos: ['u2.gulosa', 'u2.ucs', 'u2.astar'], url: 'busca:rs', componente: true },
  { id: 'd.sg', titulo: 'Lista U2 Q8: grafo S → G', topicos: ['u2.bfs', 'u2.ucs', 'u2.gulosa', 'u2.astar', 'u2.heuristica'], url: 'busca:sg', componente: true },
  { id: 'd.arvore-q22', titulo: 'Minimax e alfa-beta passo a passo (Q22)', topicos: ['u2.minimax', 'u2.alfabeta'], url: 'arvore:l2-q22', componente: true },
  { id: 'd.arvore-e1', titulo: 'Minimax e alfa-beta passo a passo (E1)', topicos: ['u2.minimax', 'u2.alfabeta'], url: 'arvore:e1', componente: true },
  { id: 'd.hill', titulo: 'Hill Climbing na rede da Q11', topicos: ['u2.hill'], url: 'hill', componente: true },
  { id: 'd.knn', titulo: 'KNN: arraste o ponto (lista 5, Q3)', topicos: ['u5.knn', 'u5.distancias'], url: 'knn', componente: true },
  { id: 'd.hc-sa', titulo: 'Simulação HC e SA', topicos: ['u2.hill', 'u2.sa'], url: 'demos/simulacao-busca-local-hc-sa.html' },
  { id: 'd.alfabeta', titulo: 'Demonstração da poda alfa-beta', topicos: ['u2.alfabeta'], url: 'demos/demo-poda-alfa-beta.html' },
  { id: 'd.velha', titulo: 'Jogo da velha (minimax)', topicos: ['u2.minimax'], url: 'demos/jogo-da-velha-minimax.html' },
  { id: 'd.super-velha', titulo: 'Super jogo da velha (profundidade limitada)', topicos: ['u2.minimax'], url: 'demos/super-jogo-da-velha-minimax.html' },
  { id: 'd.e1-alfabeta', titulo: 'E1 Q6: poda alfa-beta da turma', topicos: ['u2.alfabeta'], url: 'demos/e1-simulacao-poda-alfa-beta.html' },
  { id: 'd.eliza', titulo: 'Vídeo: ELIZA, o primeiro chatbot', topicos: ['u1.historia'], url: 'https://www.youtube.com/watch?v=RMK9AphfLco', externa: true },
  { id: 'd.pathfinding', titulo: 'Pathfinding Visualizer', topicos: ['u2.bfs', 'u2.dfs', 'u2.astar', 'u2.gulosa'], url: 'https://pathfinding-visualizer.ivan-sem.com/en', externa: true },
  { id: 'd.pddl-editor', titulo: 'PDDL Editor', topicos: ['u3.pddl'], url: 'https://editor.planning.domains/', externa: true },
]

export const exerciciosDoTopico = (id: string) => EXERCICIOS.filter((x) => x.topicos.includes(id))
export const demosDoTopico = (id: string) => DEMOS.filter((d) => d.topicos.includes(id))

/** Exercício "praticável": tem passos ou resposta para conferir. */
export const temResolucao = (x: Exercicio) => !!(x.passos?.length || x.resposta)
