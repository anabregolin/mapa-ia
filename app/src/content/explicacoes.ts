import type { Camadas } from './tipos'

const L = String.raw

/**
 * Explicação de cada tópico em três camadas: intuição → definição → detalhe técnico.
 * Base: slides da cadeira (extraido/limpo/) e AIMA (Russell & Norvig), que é o livro-texto.
 * Texto aceita $latex$ inline.
 */
export const EXPLICACOES: Record<string, Camadas> = {
  // ── U1 · Visão Geral ──────────────────────────────────────────────
  'u1.historia': {
    intuicao: L`A IA não é nova: já teve várias ondas de empolgação e de decepção. Cada onda trocou a ideia de como fazer máquinas "pensarem".`,
    definicao: L`Marcos principais: Turing (1950) propõe o jogo da imitação; Dartmouth (1956) dá nome à área; Samuel faz um programa de damas que aprende; ELIZA (1966) simula um terapeuta; nos anos 70–80 vêm os sistemas especialistas (DENDRAL, MYCIN); depois, os "invernos da IA", quando as promessas não se cumprem e o dinheiro some.`,
    detalhe: L`O renascimento recente vem da soma de três coisas: GPUs (poder de cálculo), Big Data (dados para aprender) e algoritmos de redes profundas. Marcos: AlexNet (2012) na visão computacional, AlphaGo (2016) no Go, e os modelos GPT na linguagem.`,
    cuidado: L`Sistemas especialistas são IA simbólica (regras escritas à mão); AlexNet e GPT são IA que aprende com dados. Não confunda as duas épocas.`,
  },
  'u1.turing': {
    intuicao: L`Em vez de discutir o que é "pensar", Turing propôs um teste prático: se você conversa por texto e não consegue saber se do outro lado há uma pessoa ou uma máquina, a máquina passou.`,
    definicao: L`No jogo da imitação, um interrogador humano troca mensagens com um humano e com uma máquina, sem vê-los. A máquina passa se o interrogador não acerta qual é qual com frequência maior que o acaso.`,
    detalhe: L`O teste mede comportamento, não compreensão. Críticas: um programa pode enganar sem entender nada (ELIZA já enganava algumas pessoas), e LLMs atuais conversam muito bem mas ainda erram fatos básicos. Por isso a pergunta "faz sentido hoje?" aparece na aula.`,
  },
  'u1.subareas': {
    intuicao: L`IA é um guarda-chuva: cada subárea cuida de uma habilidade diferente que associamos à inteligência.`,
    definicao: L`Representação do conhecimento, raciocínio, planejamento, aprendizado de máquina, visão computacional, processamento de linguagem natural (PLN) e sistemas multiagentes.`,
    detalhe: L`A cadeira passa por várias delas: agentes e busca (U2), raciocínio lógico e planejamento (U3), raciocínio probabilístico (U4) e aprendizado de máquina (U5).`,
  },
  'u1.paradigma': {
    intuicao: L`Antes: um especialista escrevia as regras. Agora: mostramos exemplos e o computador descobre as regras sozinho.`,
    definicao: L`Mudança de paradigma da IA simbólica (regras, lógica) para a IA baseada em dados (aprendizado estatístico).`,
    detalhe: L`Regras funcionam bem quando o domínio é pequeno e bem definido, mas não escalam para coisas como reconhecer rostos ou entender linguagem. Aprender com dados escala, mas exige muitos exemplos e é menos explicável.`,
  },

  // ── U2 · Agentes ──────────────────────────────────────────────────
  'u2.agente': {
    intuicao: L`Um agente é qualquer coisa que percebe e age: um robô aspirador, um termostato, um bot de xadrez.`,
    definicao: L`Agente = arquitetura + programa. Percebe o ambiente por **sensores** e age por **atuadores**. A função do agente mapeia a sequência de percepções em uma ação.`,
    detalhe: L`Um agente racional escolhe a ação que maximiza a medida de desempenho esperada, dado o que percebeu. Quanto mais ele decide pela própria experiência (e não só pelo que o projetista embutiu), mais **autônomo** ele é.`,
  },
  'u2.tipos-agente': {
    intuicao: L`Alguns agentes só reagem ("se está sujo, aspira"); outros pensam no futuro ("o que me leva ao objetivo?").`,
    definicao: L`**Reativos**: reativo simples (regras condição→ação sobre a percepção atual) e reativo com modelo (guarda um estado interno do mundo). **Cognitivos**: baseado em objetivo, baseado em utilidade (escolhe o "melhor", não só o que atinge o objetivo) e com aprendizado.`,
    detalhe: L`O reativo simples só funciona bem se o ambiente for totalmente observável. O baseado em utilidade resolve conflitos entre objetivos (rápido × seguro) atribuindo um número a cada estado.`,
  },
  'u2.ambientes': {
    intuicao: L`O mesmo algoritmo pode ir bem num jogo de tabuleiro e mal no trânsito. O tipo de ambiente decide o que é difícil.`,
    definicao: L`Eixos: **totalmente × parcialmente observável**; **determinístico × estocástico**; **episódico × sequencial**; **estático × dinâmico**; **discreto × contínuo**; e **agente único × multiagente**.`,
    detalhe: L`Exemplos: cruzadinha é totalmente observável, determinística, sequencial, estática, discreta e de agente único. Táxi autônomo e drone de entrega são o pior caso: parcialmente observável, estocástico, sequencial, dinâmico, contínuo e multiagente.`,
    cuidado: L`Episódico quer dizer que cada decisão não afeta as próximas (ex.: classificar peças numa esteira). Xadrez é sequencial.`,
  },
  'u2.tipos-problema': {
    intuicao: L`Quanto menos o agente sabe sobre onde está, mais difícil o problema: ele precisa planejar para várias possibilidades.`,
    definicao: L`**Estado único**: o agente sabe o estado e as ações são determinísticas. **Conformidade** (sem sensores): não sabe onde está, raciocina sobre um conjunto de estados possíveis. **Contingência**: precisa perceber durante a execução porque o resultado das ações é incerto.`,
    detalhe: L`No aspirador de pó com 2 salas há $2 \cdot 2^2 = 8$ estados. Sem sensores, a sequência [Direita, Aspirar, Esquerda, Aspirar] limpa tudo a partir de qualquer estado: é uma solução por conformidade.`,
  },
  'u2.formulacao': {
    intuicao: L`Antes de procurar a solução, é preciso escrever o problema de um jeito que o computador entenda.`,
    definicao: L`Cinco componentes: **estado inicial**; **ações** possíveis; **função sucessora** $S(x)$ (o que cada ação produz); **teste de objetivo**; **custo do caminho** (soma dos custos de cada passo).`,
    detalhe: L`No mapa da Romênia: estado = cidade atual; inicial = Arad; ações = ir para uma cidade vizinha; objetivo = estar em Bucharest; custo = km da estrada. A escolha da representação (o que fica de fora) é uma **abstração**: ignora rádio, paisagem, combustível…`,
  },
  'u2.agente-resolvedor': {
    intuicao: L`O agente pensa uma vez, monta o plano inteiro e depois só executa, de olhos fechados.`,
    definicao: L`SIMPLE-PROBLEM-SOLVING-AGENT: atualiza o estado, formula objetivo e problema, chama a busca para obter uma sequência de ações e devolve uma ação por vez dessa sequência.`,
    detalhe: L`Funciona porque assume ambiente observável, determinístico e estático. Se o mundo muda no meio do caminho, o plano pode ficar errado (é um agente "de malha aberta").`,
  },

  // ── U2 · Busca não-informada ──────────────────────────────────────
  'u2.arvore-busca': {
    intuicao: L`Imagine todas as escolhas possíveis desenhadas como galhos. Buscar é decidir em que ordem abrir esses galhos.`,
    definicao: L`A raiz é o estado inicial. **Expandir** um nó = aplicar a função sucessora e gerar seus filhos. A **fronteira** guarda os nós gerados e ainda não expandidos. Cada estratégia de busca é só uma regra de qual nó da fronteira expandir primeiro.`,
    detalhe: L`Estado ≠ nó: o mesmo estado pode aparecer em vários nós (caminhos diferentes). Busca em **grafo** guarda os explorados para não repetir estados e evitar laços infinitos.`,
  },
  'u2.criterios': {
    intuicao: L`Para comparar algoritmos de busca, fazemos quatro perguntas: acha? acha o melhor? demora quanto? gasta quanta memória?`,
    definicao: L`**Completude**: encontra solução se existir. **Otimalidade**: encontra a de menor custo. **Tempo** e **espaço**: medidos com $b$ (fator de ramificação), $d$ (profundidade da solução mais rasa) e $m$ (profundidade máxima).`,
    detalhe: L`Resumo: BFS completa, ótima com custo unitário, tempo e espaço $O(b^d)$. DFS não completa (em espaço infinito), não ótima, tempo $O(b^m)$, espaço $O(bm)$. UCS completa e ótima. IDS completa, ótima com custo unitário, tempo $O(b^d)$, espaço $O(bd)$.`,
  },
  'u2.bfs': {
    intuicao: L`Como uma pedra na água: explora tudo a 1 passo, depois tudo a 2 passos, e assim por diante.`,
    definicao: L`Expande o nó mais raso primeiro usando uma **fila FIFO**. Os filhos entram no fim da fila.`,
    detalhe: L`Completa (se $b$ é finito) e ótima quando todos os passos custam igual. O problema é a memória: guarda a fronteira inteira, $O(b^d)$. Com $b = 10$ e $d = 12$ são $10^{12}$ nós.`,
    cuidado: L`"Ótima" aqui é em número de passos, não em km. No mapa da Romênia a BFS acha Arad → Sibiu → Fagaras → Bucharest (450 km), não o caminho de 418.`,
  },
  'u2.dfs': {
    intuicao: L`Como explorar um labirinto com a mão na parede: segue um corredor até o fim e só volta quando bate num beco.`,
    definicao: L`Expande o nó mais profundo primeiro usando uma **pilha LIFO**.`,
    detalhe: L`Memória $O(bm)$: só guarda o caminho atual e os irmãos não explorados. Mas não é ótima, e em espaços infinitos (ou com ciclos, sem controle de repetidos) pode nunca terminar.`,
  },
  'u2.ucs': {
    intuicao: L`Sempre expande o caminho mais barato até agora, como uma mancha de água que se espalha mais rápido pelas estradas curtas.`,
    definicao: L`Fila de prioridade ordenada por $g(n)$, o custo acumulado do início até $n$. O teste de objetivo é feito quando o nó é **expandido**, não quando é gerado.`,
    detalhe: L`Completa e ótima se todo custo for $\ge \epsilon > 0$. É o algoritmo de Dijkstra visto como busca. Com custos todos iguais vira a BFS.`,
    cuidado: L`Testar o objetivo na geração quebra a otimalidade da UCS: um caminho mais caro pode gerar o objetivo antes de um mais barato ser expandido.`,
  },
  'u2.dls-ids': {
    intuicao: L`DFS com um "freio": não desce além de L. IDS tenta L = 0, 1, 2… até achar.`,
    definicao: L`**Profundidade limitada** (DLS): DFS que corta em profundidade $L$. **Aprofundamento iterativo** (IDS): repete a DLS aumentando $L$ até encontrar a solução.`,
    detalhe: L`Parece desperdício refazer os níveis de cima, mas a maior parte dos nós está no último nível, então o custo total continua $O(b^d)$. Junta a memória da DFS, $O(bd)$, com a completude e otimalidade (custo unitário) da BFS.`,
  },

  // ── U2 · Busca informada ──────────────────────────────────────────
  'u2.heuristica': {
    intuicao: L`Um palpite de "quanto falta". No mapa, a distância em linha reta até o destino é um ótimo palpite.`,
    definicao: L`Função heurística $h(n)$: custo estimado do caminho mais barato de $n$ até um objetivo. $h(\text{objetivo}) = 0$.`,
    detalhe: L`A heurística é o conhecimento extra do problema que a busca não-informada não tem. Uma boa heurística reduz muito o número de nós expandidos.`,
  },
  'u2.admissivel': {
    intuicao: L`Uma heurística admissível é otimista: nunca diz que falta mais do que falta de verdade.`,
    definicao: L`**Admissível**: $h(n) \le h^*(n)$ para todo $n$, onde $h^*$ é o custo real. **Consistente** (monótona): $h(n) \le c(n,a,n') + h(n')$, uma desigualdade triangular.`,
    detalhe: L`Toda consistente é admissível. Com $h$ admissível, o A* em árvore é ótimo; com $h$ consistente, o A* em grafo também é. Entre duas admissíveis, a maior **domina**: expande menos nós.`,
  },
  'u2.heur-exemplos': {
    intuicao: L`Para inventar uma heurística, relaxe o problema: finja que algumas regras não existem e resolva a versão fácil.`,
    definicao: L`Distância em linha reta (mapa); Manhattan $|\Delta x| + |\Delta y|$ (grade sem diagonais); no 8-puzzle, $h_1$ = peças fora do lugar e $h_2$ = soma das distâncias Manhattan de cada peça.`,
    detalhe: L`No estado inicial clássico do 8-puzzle, $h_1 = 6$ e $h_2 = 14$. As duas são admissíveis, e $h_2 \ge h_1$ sempre, então $h_2$ domina e o A* expande menos nós com ela.`,
  },
  'u2.gulosa': {
    intuicao: L`Vai sempre para a cidade que parece mais perto do destino, sem olhar quanto já andou.`,
    definicao: L`Busca gulosa pela melhor escolha: fila de prioridade por $f(n) = h(n)$.`,
    detalhe: L`Costuma ser rápida, mas não é ótima (Arad → Sibiu → Fagaras → Bucharest = 450 > 418) nem completa em busca em árvore: de Iasi para Fagaras ela vai a Neamt, volta a Iasi, vai a Neamt… em laço.`,
  },
  'u2.astar': {
    intuicao: L`Junta o que já gastou com o que estima que falta: escolhe o caminho com o menor custo total previsto.`,
    definicao: L`Fila de prioridade por $f(n) = g(n) + h(n)$, onde $g$ é o custo real até $n$ e $h$ a estimativa até o objetivo.`,
    detalhe: L`Ótimo se $h$ for admissível (árvore) ou consistente (grafo), e nenhum outro algoritmo ótimo com a mesma $h$ expande menos nós. O problema é a memória: guarda todos os nós gerados, o que cresce exponencialmente.`,
    cuidado: L`Na Romênia, Bucharest aparece na fronteira com $f = 450$ (via Fagaras) antes da hora, mas o A* só para quando o objetivo sai da fila. Antes disso, Pitesti ($f = 417$) é expandido e acha o caminho de 418.`,
  },
  'u2.idastar': {
    intuicao: L`É o IDS com régua de custo: em vez de limitar a profundidade, limita o valor de $f$.`,
    definicao: L`Faz DFS cortando nós com $f(n) >$ limite. Se não acha, o novo limite é o menor $f$ que foi cortado.`,
    detalhe: L`Memória linear, como a DFS, e continua ótimo com $h$ admissível. Bom para quebra-cabeças grandes como o 15-puzzle, onde o A* estoura a memória.`,
  },
  'u2.wastar': {
    intuicao: L`Um botão que regula o quanto você confia na heurística: mais peso = mais rápido, mas talvez pior.`,
    definicao: L`$f(n) = g(n) + w \cdot h(n)$, com $w \ge 0$.`,
    detalhe: L`$w = 0$ vira busca de custo uniforme; $w = 1$ é o A*; $w \to \infty$ se comporta como a gulosa. Com $w > 1$ a solução custa no máximo $w$ vezes a ótima.`,
  },

  // ── U2 · Busca local ──────────────────────────────────────────────
  'u2.otimizacao': {
    intuicao: L`Às vezes não importa como você chegou, só onde chegou: a melhor rota do caixeiro, as rainhas sem se atacar.`,
    definicao: L`Problemas de otimização: o estado já é uma solução candidata e o objetivo é melhorar uma função de avaliação. A busca local guarda só o estado atual e se move para vizinhos.`,
    detalhe: L`O espaço explode: o caixeiro viajante com $n$ cidades tem $(n-1)!/2$ rotas (10 cidades → 181.440). Busca local usa memória constante e encontra soluções boas, embora sem garantia de ótimo.`,
  },
  'u2.hill': {
    intuicao: L`Subir um morro no nevoeiro: você só enxerga ao redor e sempre dá o passo que mais sobe.`,
    definicao: L`A cada passo vai para o melhor vizinho. Para quando nenhum vizinho é melhor.`,
    detalhe: L`Problemas: **máximo local** (pico que não é o mais alto), **platô** (tudo igual ao redor) e **encosta/cumeeira** (subida que exige andar de lado). Variações: reinício aleatório (repete de vários pontos), estocástico e de primeira escolha.`,
    cuidado: L`Hill Climbing não tem nenhum mecanismo para escapar de máximos locais. Essa é a diferença cobrada em prova contra o Simulated Annealing.`,
  },
  'u2.sa': {
    intuicao: L`Como o metal que esfria devagar para ficar resistente: no começo o algoritmo se mexe muito, até para pior; depois vai se acalmando.`,
    definicao: L`Escolhe um vizinho **aleatório**. Se é melhor ($\Delta E > 0$), aceita; se é pior, aceita com probabilidade $e^{\Delta E / T}$. A temperatura $T$ diminui ao longo do tempo.`,
    detalhe: L`$T$ alta → aceita quase tudo (exploração). $T \to 0$ → vira Hill Climbing. Se $T$ cair devagar o bastante, a probabilidade de achar o ótimo global tende a 1, mas fica caro.`,
    cuidado: L`Resfriar rápido demais aumenta o risco de ficar preso num máximo local (P1, Q6).`,
  },
  'u2.ag': {
    intuicao: L`Evolução por seleção natural: as soluções melhores têm mais filhos, os filhos misturam os pais e às vezes sofrem mutação.`,
    definicao: L`Cada **cromossomo** (indivíduo) codifica uma solução em **genes**. Uma **população** evolui por gerações: avalia o **fitness** → seleciona pais → crossover → mutação → nova população.`,
    detalhe: L`A modelagem é o trabalho: escolher a codificação (ex.: (x, y, w, z) para uma equação) e uma função fitness que diga o quão boa é a solução. Para equações, $\text{fitness} = 1/(1 + |\text{alvo} - \text{resultado}|)$ vale 1 quando acerta.`,
  },
  'u2.ag.selecao': {
    intuicao: L`Quem é melhor tem mais chance de ter filhos, mas os fracos não estão totalmente fora.`,
    definicao: L`**Roleta**: probabilidade proporcional ao fitness. **Torneio**: sorteia alguns e escolhe o melhor deles. **Rank**: ordena e dá probabilidade pela posição, não pelo valor.`,
    detalhe: L`Na roleta, multiplicar todos os fitness pelo mesmo número não muda nada, e o melhor indivíduo não tem garantia de ser escolhido. O rank evita que um "super-indivíduo" domine cedo demais.`,
  },
  'u2.ag.crossover': {
    intuicao: L`O filho pega um pedaço de cada pai.`,
    definicao: L`**1 ponto**: corta os dois pais na mesma posição e troca as caudas. **n pontos**: vários cortes. **Uniforme**: cada gene vem de um pai ao acaso. **Máscara**: uma sequência binária diz de qual pai vem cada gene.`,
    detalhe: L`Ex. (P1, Q7): A = (3, 5, 2, 4), B = (6, 1, 7, 2), corte após o 1º gene → $F_{AB} = (3, 1, 7, 2)$ e $F_{BA} = (6, 5, 2, 4)$.`,
  },
  'u2.ag.mutacao': {
    intuicao: L`Um erro de cópia raro que traz novidade para a população.`,
    definicao: L`Altera genes ao acaso com taxa $P_m$ (geralmente pequena).`,
    detalhe: L`Sem mutação a população pode perder diversidade e convergir cedo para uma solução ruim. Com mutação demais vira busca aleatória.`,
  },

  // ── U2 · Busca adversária ─────────────────────────────────────────
  'u2.teoria-jogos': {
    intuicao: L`Quando há outro jogador decidindo contra você, o melhor movimento depende do que ele vai fazer.`,
    definicao: L`**Soma zero**: o ganho de um é a perda do outro. **Informação perfeita**: todos veem o estado inteiro (xadrez sim, pôquer não). **Forma normal**: tabela de pagamentos; **forma extensiva**: árvore de jogadas.`,
    detalhe: L`Von Neumann formalizou a área: o teorema minimax é de 1928, e o livro com Morgenstern, que a aula situa nos anos 1940, popularizou a teoria. A estratégia de destruição mútua assegurada (MAD) da Guerra Fria é um exemplo histórico citado na aula.`,
  },
  'u2.nash': {
    intuicao: L`Um ponto em que ninguém ganha nada mudando sozinho de estratégia, mesmo que todos pudessem estar melhor juntos.`,
    definicao: L`**Estratégia dominante**: a melhor não importa o que o outro faça. **Equilíbrio de Nash**: combinação em que nenhum jogador melhora mudando só a sua estratégia. **Ótimo de Pareto**: não dá para melhorar alguém sem piorar outro.`,
    detalhe: L`No dilema do prisioneiro, confessar é dominante para os dois, então (confessa, confessa) é o equilíbrio de Nash, mas não é Pareto-ótimo: (cala, cala) seria melhor para ambos. Pedra-papel-tesoura não tem equilíbrio em estratégias puras.`,
  },
  'u2.forma-extensiva': {
    intuicao: L`Um jogo vira um problema de busca em que os níveis da árvore alternam entre você e o adversário.`,
    definicao: L`$S_0$ (estado inicial), PLAYER(s) (de quem é a vez), ACTIONS(s), RESULT(s, a), TERMINAL-TEST(s) e UTILITY(s, p) (valor final para o jogador p).`,
    detalhe: L`A utilidade só existe nos estados terminais (ex.: +1, 0, −1 no jogo da velha). Em jogos grandes corta-se a árvore numa profundidade e usa-se uma função de avaliação no lugar da utilidade.`,
  },
  'u2.minimax': {
    intuicao: L`Você assume que o adversário sempre joga o melhor para ele (o pior para você) e escolhe a jogada que garante o maior valor nesse cenário.`,
    definicao: L`Valor minimax: nas folhas, a utilidade; nos nós MAX, o **máximo** dos filhos; nos nós MIN, o **mínimo** dos filhos. MAX joga para o filho de maior valor.`,
    detalhe: L`É uma DFS completa na árvore: tempo $O(b^m)$, espaço $O(bm)$. No xadrez, $b \approx 35$ e $m \approx 40$ dá $35^{40} \approx 10^{61}$ nós: impossível sem cortes.`,
  },
  'u2.alfabeta': {
    intuicao: L`Se você já sabe que um ramo é pior do que algo que já tem, não precisa terminar de olhar esse ramo.`,
    definicao: L`$\alpha$ = melhor valor já garantido para MAX no caminho; $\beta$ = melhor (menor) já garantido para MIN. Quando $\alpha \ge \beta$, os filhos restantes do nó são **podados**.`,
    detalhe: L`Não muda o resultado do minimax, só evita trabalho. A ordem importa: com os melhores lances primeiro, o tempo cai para $O(b^{m/2})$, o que dobra a profundidade alcançável. Na ordem ruim não poda nada.`,
    cuidado: L`A poda não elimina só folhas: corta ramos inteiros que não podem influenciar a decisão (P1, Q8).`,
  },

  // ── U3 · Lógica ───────────────────────────────────────────────────
  'u3.agente-kb': {
    intuicao: L`Um agente que guarda o que sabe em frases e deduz coisas novas a partir delas.`,
    definicao: L`Ciclo: percepção → TELL (adiciona à base de conhecimento, KB) → ASK (inferência: o que fazer?) → ação.`,
    detalhe: L`A KB é escrita numa linguagem formal (lógica). A vantagem é ser declarativa: você diz o que é verdade, e o mecanismo de inferência descobre as consequências.`,
  },
  'u3.proposicao': {
    intuicao: L`Uma frase que dá para responder "verdadeiro" ou "falso".`,
    definicao: L`Proposição é uma sentença declarativa com valor-verdade definido. Não são proposições: perguntas ("Que horas são?"), ordens ("Feche a porta"), exclamações e sentenças abertas ("x > 3", sem saber x).`,
    detalhe: L`Proposições simples são representadas por letras (P, Q, R). As compostas se formam com conectivos.`,
  },
  'u3.operadores': {
    intuicao: L`São as "contas" da lógica: juntam frases verdadeiras ou falsas em frases maiores.`,
    definicao: L`$\neg P$ (não), $P \land Q$ (e), $P \lor Q$ (ou), $P \to Q$ (se… então), $P \leftrightarrow Q$ (se e somente se). Uma tabela-verdade lista o valor da fórmula para todas as combinações.`,
    detalhe: L`$P \to Q$ só é falsa quando $P$ é V e $Q$ é F. Com $n$ variáveis a tabela tem $2^n$ linhas. **Tautologia**: sempre V; **contradição**: sempre F.`,
    cuidado: L`Se P é falso, $P \to Q$ é verdadeiro, qualquer que seja Q. Isso confunde muita gente.`,
  },
  'u3.equivalencias': {
    intuicao: L`Jeitos diferentes de escrever a mesma coisa.`,
    definicao: L`De Morgan: $\neg(P \land Q) \equiv \neg P \lor \neg Q$ e $\neg(P \lor Q) \equiv \neg P \land \neg Q$. Também comutativa, associativa, distributiva, dupla negação e $P \to Q \equiv \neg P \lor Q$.`,
    detalhe: L`Duas fórmulas são equivalentes quando têm a mesma tabela-verdade. As equivalências servem para simplificar e para pôr fórmulas em forma normal antes de inferir.`,
  },
  'u3.inferencia': {
    intuicao: L`Regras seguras para tirar conclusões: se as premissas são verdadeiras, a conclusão também é.`,
    definicao: L`**Modus Ponens**: $P \to Q$, $P$ ⊢ $Q$. **Modus Tollens**: $P \to Q$, $\neg Q$ ⊢ $\neg P$. **Silogismo hipotético**: $P \to Q$, $Q \to R$ ⊢ $P \to R$. **Silogismo disjuntivo**: $P \lor Q$, $\neg P$ ⊢ $Q$.`,
    detalhe: L`Um argumento é **válido** se não existe linha da tabela-verdade com premissas todas V e conclusão F. Válido não quer dizer verdadeiro: premissas falsas podem gerar conclusões falsas num argumento válido.`,
    cuidado: L`"Afirmar o consequente" ($P \to Q$, $Q$ ⊢ $P$) é falácia, não Modus Ponens.`,
  },
  'u3.predicados': {
    intuicao: L`A lógica proposicional não fala de objetos. A de predicados fala: "todo homem é mortal".`,
    definicao: L`Predicados descrevem propriedades e relações de objetos: Homem(Sócrates), Pai(João, Ana). Quantificadores: $\forall x$ (para todo) e $\exists x$ (existe).`,
    detalhe: L`Exemplo clássico: $\forall x\, (\text{Homem}(x) \to \text{Mortal}(x))$ e Homem(Sócrates) ⊢ Mortal(Sócrates). Negação troca o quantificador: $\neg \forall x\, P(x) \equiv \exists x\, \neg P(x)$.`,
  },

  // ── U3 · Planejamento ─────────────────────────────────────────────
  'u3.plan-vs-busca': {
    intuicao: L`Busca cega testa ação por ação. Um planejador lê o objetivo e raciocina sobre quais ações o produzem.`,
    definicao: L`No exemplo de comprar um livro, há 10 bilhões de ISBNs, então uma busca que tenta Buy(x) para cada x é inviável. Um planejador olha o objetivo Have(livro) e vê que a ação Buy(x) tem efeito Have(x).`,
    detalhe: L`Planejamento usa representação **fatorada**: o estado é um conjunto de fatos, e as ações dizem quais fatos exigem e quais mudam. Isso permite heurísticas independentes do domínio.`,
  },
  'u3.classico': {
    intuicao: L`O mundo "de laboratório" em que o planejamento clássico funciona.`,
    definicao: L`Cinco suposições: ambiente **totalmente observável**, **determinístico**, **finito**, **estático** (só o agente muda o mundo) e **discreto**.`,
    detalhe: L`Fora dessas suposições entram planejamento com incerteza, contingente ou em tempo real.`,
  },
  'u3.strips': {
    intuicao: L`Uma linguagem simples para descrever o mundo como uma lista de fatos e cada ação como "precisa disto, liga aquilo, desliga aquilo".`,
    definicao: L`**Estado**: conjunção de literais positivos ground (sem variáveis e sem funções), ex.: At(P1, SFO). **Mundo fechado**: o que não está listado é falso. **Ação**: pré-condições + efeitos (lista de adição e lista de remoção).`,
    detalhe: L`Exemplo: Fly(p, from, to) com pré-condição At(p, from) ∧ Plane(p) ∧ Airport(from) ∧ Airport(to) e efeito ¬At(p, from) ∧ At(p, to). O objetivo pode ser parcial: só os fatos que importam.`,
  },
  'u3.esquemas': {
    intuicao: L`Uma ação genérica com espaços em branco que você preenche para obter uma ação concreta.`,
    definicao: L`Esquema de ação usa variáveis: Fly(p, from, to). Uma **instanciação** substitui variáveis por constantes: {p/P1, from/SFO, to/JFK} → Fly(P1, SFO, JFK).`,
    detalhe: L`Um esquema representa de uma vez muitas ações concretas (todas as combinações de aviões e aeroportos).`,
  },
  'u3.semantica': {
    intuicao: L`Aplicar uma ação = conferir se pode, apagar o que deixa de ser verdade e escrever o que passa a ser.`,
    definicao: L`A ação $a$ é aplicável em $s$ se $s$ satisfaz as pré-condições. O resultado é $s' = (s - \text{DEL}(a)) \cup \text{ADD}(a)$.`,
    detalhe: L`P1, Q9: em Em(Jardim) ∧ PortaFechada(Garagem) ∧ ChaveComigo ∧ CarroDesligado(Garagem) ∧ CombustívelCheio(Carro), EntrarNaGaragem remove Em(Jardim) e PortaFechada(Garagem) e adiciona Em(Garagem); depois Ligar(Carro) remove CarroDesligado(Garagem).`,
    cuidado: L`Fatos que a ação não menciona continuam iguais (ChaveComigo segue no estado). Esquecer de copiá-los é erro comum.`,
  },
  'u3.pddl': {
    intuicao: L`O "formato de arquivo" padrão para escrever problemas de planejamento e entregar a um planejador pronto.`,
    definicao: L`**domain.pddl**: tipos, predicados e ações (:parameters, :precondition, :effect). **problem.pddl**: objetos, :init (estado inicial) e :goal.`,
    detalhe: L`Separar domínio e problema permite reusar o mesmo domínio (ex.: mundo dos blocos) com vários problemas. Custos de ação usam a função (total-cost) e :metric minimize. Dá para testar no editor.planning.domains.`,
  },
  'u3.prog-regr': {
    intuicao: L`Planejar para frente (do que tenho até o que quero) ou para trás (do que quero até o que tenho).`,
    definicao: L`**Progressão** (forward): busca no espaço de estados a partir do inicial, aplicando ações aplicáveis. **Regressão** (backward): parte do objetivo e aplica ações **relevantes** (que produzem algum fato do objetivo e não desfazem outro).`,
    detalhe: L`A regressão costuma ter fator de ramificação menor porque só considera ações relevantes. As duas podem usar BFS, UCS ou A*. Plano de custo mínimo = busca de custo uniforme.`,
  },
  'u3.graphplan': {
    intuicao: L`Constrói camadas do que poderia ser verdade em cada passo, anota o que não pode acontecer junto, e depois procura o plano de trás para frente.`,
    definicao: L`O grafo alterna níveis de estado $S_i$ e de ação $A_i$. Relações **mutex** entre ações: efeitos inconsistentes, interferência (uma apaga a pré-condição da outra), necessidades concorrentes (pré-condições mutex). Entre literais: um é negação do outro, ou só são alcançados por ações mutex.`,
    detalhe: L`Expande níveis até todos os objetivos aparecerem sem mutex entre si; então faz **extração regressiva** do plano. Se falhar, expande mais um nível. No jantar surpresa ($S_0$ = {lixo, mãosLimpas, silêncio}, objetivo {jantar, presente, ¬lixo}), carregarLixo é mutex com cozinhar (apaga mãosLimpas) e jogarLixo é mutex com embrulhar (apaga silêncio), ambos por interferência.`,
  },

  // ── U4 · Incerteza ────────────────────────────────────────────────
  'u4.incerteza': {
    intuicao: L`No mundo real quase nada é certo. Em vez de "é verdade", o agente diz "acredito 80% que é verdade".`,
    definicao: L`IA clássica (lógica) trabalha com verdadeiro/falso; IA probabilística trabalha com **graus de crença** entre 0 e 1.`,
    detalhe: L`A IA clássica (busca, A*, planejamento) supõe estados conhecidos, ações determinísticas, ambiente observável e consequências previsíveis. No mundo real o sensor erra, você não sabe exatamente o estado atual, uma ação pode falhar e a informação é incompleta. O resumo da aula: na IA clássica o agente **sabe**; na probabilística o agente **acredita** e atualiza a crença com evidências.`,
  },
  'u4.prob-basica': {
    intuicao: L`Probabilidade = quantos casos favoráveis em relação ao total, quando tudo é igualmente provável.`,
    definicao: L`**Espaço amostral** $\Omega$: todos os resultados possíveis. **Evento**: subconjunto de $\Omega$ (há $2^{|\Omega|}$ eventos). Axiomas: $0 \le P(A) \le 1$, $P(\Omega) = 1$, e eventos disjuntos somam.`,
    detalhe: L`Consequência: $P(\neg A) = 1 - P(A)$ e $P(A \cup B) = P(A) + P(B) - P(A \cap B)$.`,
  },
  'u4.conjunta': {
    intuicao: L`A chance de duas coisas acontecerem juntas.`,
    definicao: L`$P(A \cap B)$. Se A e B são **independentes** (um não muda a chance do outro), $P(A \cap B) = P(A) \cdot P(B)$.`,
    detalhe: L`Dois dados: $P(6 \text{ e } 6) = 1/6 \cdot 1/6 = 1/36$. Tirar duas cartas sem reposição **não** é independente: a primeira muda o baralho para a segunda.`,
  },
  'u4.condicional': {
    intuicao: L`Probabilidade depois de saber alguma coisa: o espaço amostral encolhe para o que você já sabe.`,
    definicao: L`$P(A \mid B) = \dfrac{P(A \cap B)}{P(B)}$. Daí a **regra do produto**: $P(A \cap B) = P(A \mid B)\,P(B) = P(B \mid A)\,P(A)$.`,
    detalhe: L`$P(\text{Rei} \mid \text{Copas}) = 1/13$: sabendo que é copas, restam 13 cartas e só uma é rei.`,
  },
  'u4.bayes': {
    intuicao: L`Atualizar uma crença com uma evidência: o quanto a evidência é mais comum quando a hipótese é verdadeira.`,
    definicao: L`$P(H \mid E) = \dfrac{P(E \mid H)\,P(H)}{P(E)}$. Priori $P(H)$, verossimilhança $P(E \mid H)$, evidência $P(E)$, posteriori $P(H \mid E)$.`,
    detalhe: L`Meningite: $P(R \mid M) = 0{,}5$, $P(M) = 1/50.000$, $P(R) = 1/20$ → $P(M \mid R) = 0{,}0002$. Mesmo um sintoma "forte" não torna provável uma doença rara: a priori pesa muito. Quando $P(E)$ não é dado, calcula-se por $P(E) = \sum_h P(E \mid h) P(h)$.`,
    cuidado: L`$P(R \mid M)$ e $P(M \mid R)$ são coisas diferentes. Trocar uma pela outra é o erro mais comum.`,
  },
  'u4.apr-bayesiano': {
    intuicao: L`Aprender é começar com uma crença e ajustá-la a cada novo dado.`,
    definicao: L`Cada hipótese (classe) tem uma probabilidade; os dados atualizam essas probabilidades via Bayes. Classificação **MAP**: escolhe $\hat{c} = \arg\max_c P(c \mid x)$.`,
    detalhe: L`Como $P(x)$ é igual para todas as classes, basta comparar $P(x \mid c)\,P(c)$. Com muitos dados, a priori perde influência. Várias hipóteses podem continuar plausíveis, com probabilidades diferentes.`,
  },
  'u4.naive': {
    intuicao: L`Para não precisar de dados de todas as combinações de atributos, finge que os atributos não se influenciam (dada a classe) e multiplica.`,
    definicao: L`$P(c \mid x_1, \dots, x_m) \propto P(c) \prod_i P(x_i \mid c)$. Cada $P(x_i \mid c)$ é contado separadamente no conjunto de treino.`,
    detalhe: L`A independência quase nunca é verdade, mas o classificador funciona bem na prática (filtro de spam é o exemplo clássico): o que importa é qual classe tem o maior produto, não o valor exato. Treina rápido e lida bem com muitos atributos.`,
    cuidado: L`Um único $P(x_i \mid c) = 0$ zera a classe inteira. Por isso existe a suavização de Laplace.`,
  },
  'u4.laplace': {
    intuicao: L`Nunca diga "impossível" só porque não viu ainda: some 1 em todas as contagens.`,
    definicao: L`$P(x_i \mid c) = \dfrac{\text{contagem}(x_i, c) + 1}{\text{contagem}(c) + k}$, onde $k$ é o número de valores distintos do atributo.`,
    detalhe: L`No exemplo Taylor, 22, EUA: sem Laplace, feminino dá 0. Com Laplace, feminino ≈ 0,0025 e masculino ≈ 0,0053 (o slide trunca para 0,0024 e 0,0052; tanto faz, o vencedor é o mesmo). O resultado não mudou, mas o modelo ficou mais robusto.`,
    cuidado: L`O $k$ muda por atributo: 7 nomes, 9 idades e 3 países no exemplo da aula.`,
  },

  // ── U5 · Fundamentos ──────────────────────────────────────────────
  'u5.ml': {
    intuicao: L`Em vez de escrever a regra, você mostra exemplos com a resposta certa e o computador descobre a regra.`,
    definicao: L`Programação tradicional: dados + regras → saída. Aprendizado de máquina: dados + respostas → modelo; depois, modelo + dados novos → resposta. Na definição da aula: a área da IA que permite que sistemas aprendam automaticamente a partir de dados, sem serem programados explicitamente para cada situação.`,
    detalhe: L`O modelo aprendido é então usado em dados novos. Todo o desafio é generalizar: acertar casos que não estavam no treino.`,
  },
  'u5.paradigmas': {
    intuicao: L`Com gabarito, sem gabarito, ou aprendendo por recompensa.`,
    definicao: L`**Supervisionado**: dados rotulados; classificação (classe) ou regressão (número). **Não supervisionado**: sem rótulos; clustering, regras de associação, redução de dimensionalidade. **Por reforço**: o agente age e recebe recompensas.`,
    detalhe: L`**Semi-supervisionado**: poucos rótulos e muitos dados sem rótulo. **Auto-supervisionado**: o próprio dado gera o rótulo (ex.: prever a próxima palavra, como nos LLMs).`,
  },
  'u5.modelos': {
    intuicao: L`Cada família de algoritmos representa o conhecimento de um jeito.`,
    definicao: L`**Simbólicos**: regras e árvores (árvore de decisão). **Matemáticos/estatísticos**: equações com parâmetros (regressão, redes neurais). **Probabilísticos**: distribuições (Naive Bayes). **Baseados em instâncias (lazy)**: guardam os exemplos e comparam na hora (KNN).`,
    detalhe: L`Modelos "eager" fazem o trabalho no treino e são rápidos para prever; modelos "lazy" quase não treinam, mas são lentos para prever porque comparam com todos os exemplos.`,
  },
  'u5.fitting': {
    intuicao: L`Decorar a prova não é aprender a matéria. Um modelo também pode "decorar" o treino.`,
    definicao: L`**Underfitting**: modelo simples demais, erra no treino e no teste. **Overfitting**: modelo complexo demais, acerta o treino (até o ruído) e erra no teste. **Generalização**: ir bem em dados novos.`,
    detalhe: L`Na aula: underfitting = ruim no treino **e** no teste ("pouco aprendizado"); overfitting = excelente no treino e ruim no teste ("memorizou os dados", inclusive o ruído). Para árvores, a aula 24 cita a **poda** como remédio. Fora dos slides (vale saber, mas não é o foco da prova): o erro de validação sobe enquanto o de treino cai; outros remédios são mais dados, modelo mais simples, regularização e early stopping.`,
  },
  'u5.bias': {
    intuicao: L`Para generalizar, todo algoritmo precisa apostar em algo sobre o mundo. Sem aposta, nada a aprender.`,
    definicao: L`**Bias indutivo** é o conjunto de suposições que o algoritmo usa para escolher uma hipótese entre as muitas que explicam os dados.`,
    detalhe: L`KNN assume que exemplos próximos têm a mesma classe; Naive Bayes, que os atributos são independentes dada a classe; árvores preferem árvores pequenas; regressão linear, que a relação é uma reta. Biases diferentes vão melhor ou pior dependendo de quanto a suposição combina com os dados (P2, Q2).`,
  },
  'u5.atributos': {
    intuicao: L`Nem todo número é número: "nota 1 a 5" e "CEP" se tratam de jeitos diferentes.`,
    definicao: L`**Nominal** (categorias sem ordem: cor), **ordinal** (com ordem: baixo/médio/alto), **binário** (simétrico: os dois valores importam igual; assimétrico: só o 1 interessa, ex.: ter um sintoma), **intervalar** (diferença faz sentido, zero não: °C), **proporcional** (zero absoluto: idade, salário).`,
    detalhe: L`Discreto × contínuo é outro eixo. O tipo de atributo decide a distância e o pré-processamento: binário assimétrico pede Jaccard, não SMC.`,
  },
  'u5.qualidade': {
    intuicao: L`Lixo entra, lixo sai: o modelo só é tão bom quanto os dados.`,
    definicao: L`**Ruído**: erro aleatório na medição. **Outlier**: valor muito diferente dos outros (pode ser erro ou um caso raro de verdade). **Faltantes**: remover o registro, imputar média/mediana/moda, interpolar, prever por regressão ou métodos avançados (ex.: KNN).`,
    detalhe: L`Também conta: registros duplicados, formatos inconsistentes e erros de digitação. O pré-processamento vem **antes** do treino (P2, Q3).`,
  },

  // ── U5 · KNN ──────────────────────────────────────────────────────
  'u5.proximidade': {
    intuicao: L`Coisas parecidas estão perto. Similaridade e distância são dois lados da mesma moeda.`,
    definicao: L`Similaridade é alta quando os objetos se parecem; distância (dissimilaridade) é baixa. Uma distância métrica satisfaz: $d(x,y) \ge 0$; $d(x,y) = 0 \iff x = y$; simetria $d(x,y) = d(y,x)$; desigualdade triangular $d(x,z) \le d(x,y) + d(y,z)$.`,
    detalhe: L`É comum converter: dissimilaridade $= 1 - $ similaridade, quando a similaridade está entre 0 e 1.`,
  },
  'u5.distancias': {
    intuicao: L`Euclidiana é a régua em linha reta; Manhattan é andar pelas quadras de uma cidade.`,
    definicao: L`Minkowski: $d = \left(\sum |x_i - y_i|^p\right)^{1/p}$. $p = 1$ Manhattan, $p = 2$ Euclidiana, $p \to \infty$ a maior diferença entre coordenadas (Chebyshev).`,
    detalhe: L`Quanto maior o $p$, mais a maior diferença domina o resultado. A(1,2)–B(4,6): Manhattan 7, Euclidiana 5, $p = 3$ ≈ 4,498, $p = \infty$ = 4. Atributos em escalas diferentes precisam ser **normalizados** antes. **Minkowski normalizada** (aula 21, p. 40-43): com valores ausentes, ignora os atributos que faltam em algum dos dois pontos e divide pelo número de atributos usados. É uma alternativa à imputação.`,
  },
  'u5.binarios': {
    intuicao: L`Para vetores de 0 e 1: contar onde concordam. A dúvida é se "os dois não têm" deve contar como parecido.`,
    definicao: L`$SMC = \dfrac{m_{11} + m_{00}}{m_{00} + m_{01} + m_{10} + m_{11}}$ conta todas as concordâncias. $J = \dfrac{m_{11}}{m_{01} + m_{10} + m_{11}}$ ignora as concordâncias 0-0.`,
    detalhe: L`Use Jaccard para atributos assimétricos (sintomas, itens comprados, funcionalidades usadas): dois clientes que não compraram 1.000 produtos iguais não são "parecidos". No exemplo da aula, SMC = 0,7 mas Jaccard = 0.`,
  },
  'u5.knn': {
    intuicao: L`Diga-me com quem andas: a classe de um ponto novo é a da maioria dos seus vizinhos mais próximos.`,
    definicao: L`Precisa de três coisas: base de treino, medida de distância e o valor de $k$. Calcula a distância do exemplo novo a todos os de treino, ordena, pega os $k$ mais próximos e decide por **voto da maioria** (classificação) ou **média** dos valores (predição/regressão). Variante da aula: ponderar cada voto pela distância, para o vizinho mais perto pesar mais (o peso usual é $1/d$, mas o slide não fixa a fórmula).`,
    detalhe: L`$k$ pequeno → modelo flexível demais, sensível a ruído (overfitting); $k$ grande demais → olha quase todos os pontos (underfitting). Sensível à **escala**: normalize antes (re-escalar para 0–1 ou padronizar com média 0 e desvio 1). Também é sensível à medida de distância escolhida e a atributos irrelevantes. É **lazy**: não constrói modelo, então prever é caro em bases grandes. Sofre com a **maldição da dimensionalidade**: em muitas dimensões, todas as distâncias ficam parecidas. Fora dos slides: $k$ ímpar evita empate com 2 classes.`,
    cuidado: L`$k$ não tem relação com o número de classes (lista 5, Q5).`,
  },

  // ── U5 · Árvores ──────────────────────────────────────────────────
  'u5.arvore': {
    intuicao: L`Um fluxograma de perguntas: "tem nuvens? → a umidade é alta? → vai chover".`,
    definicao: L`Nós internos testam um atributo, ramos são os resultados do teste e folhas dão a classe (ou valor, na regressão). Cada caminho da raiz a uma folha é uma regra "se… então".`,
    detalhe: L`Vantagens (aula 24, p. 61): fácil de interpretar e explicar, captura relações não lineares e serve para classificação e regressão. Limitações: overfitting se a árvore for muito profunda (precisa de poda), e depende da qualidade dos dados. Várias árvores se ajustam aos mesmos dados, e achar a ótima é NP-difícil, por isso usam-se heurísticas gulosas (top-down). Fora dos slides: é instável (pouca mudança nos dados muda a árvore) e não precisa normalizar atributos.`,
  },
  'u5.hunt': {
    intuicao: L`Divide os dados por pergunta, de cima para baixo, até cada grupo ficar "puro".`,
    definicao: L`Algoritmo de Hunt: se todos os exemplos do nó são da mesma classe, vira folha; senão, escolhe o atributo que **mais reduz a incerteza** e divide; repete em cada filho.`,
    detalhe: L`Divisões: binária, múltipla (um ramo por valor) ou por limiar em atributos contínuos ($x \le 30$). Para escolher o atributo, a aula usa o **índice Gini** e a **entropia** (ganho de informação). A estratégia é gulosa: escolhe a melhor divisão agora, sem voltar atrás.`,
  },
  'u5.gini': {
    intuicao: L`Mede a chance de errar se você rotular um exemplo ao acaso, de acordo com a proporção das classes no nó.`,
    definicao: L`$\text{Gini}(t) = 1 - \sum_j p(j \mid t)^2$. Para uma divisão: $\text{Gini}_{split} = \sum_i \frac{n_i}{n}\,\text{Gini}(i)$.`,
    detalhe: L`Mínimo 0 (nó puro). Máximo $1 - 1/c$ ($= 0{,}5$ com 2 classes meio a meio). Escolhe-se a divisão de **menor** Gini. Ex.: pai (6,6) com Gini 0,5 → filhos (5,2) e (1,4) dão 0,371: melhorou.`,
  },
  'u5.entropia': {
    intuicao: L`Mede a "surpresa" média: um nó todo de uma classe não surpreende (0); meio a meio surpreende ao máximo (1).`,
    definicao: L`$E(t) = -\sum_j p_j \log_2 p_j$. **Ganho de informação** $= E(\text{pai}) - \sum_i \frac{n_i}{n} E(i)$.`,
    detalhe: L`Máximo $\log_2 c$. Escolhe-se o atributo de **maior** ganho. A ideia vem da teoria da informação de Shannon. Fora dos slides: o ganho favorece atributos com muitos valores (um ID único dá ganho máximo e é inútil), e a razão de ganho corrige isso.`,
  },

  // ── U5 · Complementar ─────────────────────────────────────────────
  'u5.treino-teste': {
    intuicao: L`Não se corrige a prova com as mesmas questões dadas como exercício.`,
    definicao: L`Separa-se o conjunto em **treino** (ajusta o modelo) e **teste** (mede a generalização), ex.: 70/30 no E3. Uma parte de **validação** pode ser usada para escolher hiperparâmetros.`,
    detalhe: L`100% de acerto no treino não garante nada em dados novos (lista 5, Q15). O teste nunca pode ser usado para ajustar o modelo. Validação cruzada (k-fold) usa os dados melhor quando são poucos.`,
  },
  'u5.metricas': {
    intuicao: L`Acurácia sozinha engana: um modelo que diz "não tem câncer" para todo mundo acerta 99% se só 1% tem.`,
    definicao: L`Matriz de confusão: VP, FN (positivos reais), FP, VN (negativos reais). Acurácia $= (VP+VN)/\text{total}$; erro $= 1 -$ acurácia; sensibilidade (recall) $= VP/(VP+FN)$; especificidade $= VN/(VN+FP)$; precisão $= VP/(VP+FP)$; $F_1 = 2\,\frac{P \cdot R}{P + R}$.`,
    detalhe: L`Sensibilidade: dos doentes, quantos achei. Precisão: dos que disse doentes, quantos eram. Em diagnóstico prioriza-se sensibilidade; em spam, precisão (não jogar e-mail bom fora). F1 equilibra os dois.`,
    cuidado: L`Confira se as linhas da matriz são o valor real ou o previsto antes de calcular.`,
  },
  'u5.regressao': {
    intuicao: L`Ajustar uma reta (ou curva) que passe o mais perto possível dos pontos, para prever números.`,
    definicao: L`**Linear**: $f(x) = \beta_0 + \sum \beta_i x_i$, prevê um valor contínuo (salário, preço). **Logística**: aplica a sigmoide $\sigma(z) = 1/(1 + e^{-z})$ e prevê a **probabilidade** de uma classe (inadimplente ou não).`,
    detalhe: L`Os $\beta$ são escolhidos para minimizar o erro (ex.: soma dos quadrados dos resíduos). Apesar do nome, a regressão logística é usada para **classificação** (lista 5, Q13 e Q16).`,
  },
  'u5.gradiente': {
    intuicao: L`Descer uma montanha no escuro: tateia a inclinação e dá um passo para baixo, várias vezes.`,
    definicao: L`Atualização: $\theta \leftarrow \theta - \eta\, \nabla J(\theta)$, onde $J$ é a função de custo e $\eta$ a **taxa de aprendizado**.`,
    detalhe: L`$\eta$ grande demais → passa do mínimo e o erro **oscila** ou diverge (lista 5, Q14). $\eta$ pequena demais → converge muito devagar. Variações: em lote, estocástico (um exemplo por vez) e mini-batch.`,
  },
  'u5.redes-neurais': {
    intuicao: L`Camadas de "neurônios" simples que, juntas, aprendem funções complicadas ajustando pesos a partir dos erros.`,
    definicao: L`Cada neurônio faz soma ponderada + função de ativação. Treino: **forward pass** (calcula a saída) → **loss** (mede o erro) → **backpropagation** (calcula o gradiente do erro em relação a cada peso, da saída para a entrada, pela regra da cadeia) → **gradiente descendente** (atualiza os pesos).`,
    detalhe: L`Redes grandes tendem a overfitting: se o erro de validação começa a subir enquanto o de treino cai, pare (**early stopping**, lista 5, Q18). Backpropagation é usado no treino de redes multicamadas, em aprendizado supervisionado (P2, Q7).`,
  },
}
