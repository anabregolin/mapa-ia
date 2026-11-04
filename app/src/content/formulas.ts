import type { Formula, Passo } from './tipos'

const L = String.raw

// Os passos seguem sempre: montagem → substituição → resultado (às vezes com conta intermediária).
const passo = (rotulo: string, latex: string, explicacao?: string): Passo => ({ rotulo, latex, explicacao })

export const FORMULAS: Formula[] = [
  // ── U2 · Agentes e busca ─────────────────────────────────────────
  {
    id: 'f.estados',
    nome: 'Número de estados',
    latex: L`|S| = 2^n`,
    topicos: ['u2.tipos-problema'],
    variaveis: [{ simbolo: 'n', descricao: 'número de variáveis binárias do estado' }],
    exemplo: {
      titulo: 'Aspirador de pó: posição (A/B) + sujeira em A + sujeira em B',
      fonte: { arquivo: 'aula-02b' },
      passos: [
        passo('montagem', L`|S| = 2^n`),
        passo('substituição', L`|S| = 2^3`, '3 variáveis com 2 valores cada'),
        passo('resultado', L`|S| = 8`),
      ],
    },
  },
  {
    id: 'f.complex',
    nome: 'Complexidade da busca',
    latex: L`\text{BFS: } O(b^d) \qquad \text{Minimax: } O(b^m) \qquad \alpha\beta: O(b^{m/2})`,
    topicos: ['u2.criterios', 'u2.bfs', 'u2.minimax', 'u2.alfabeta'],
    variaveis: [
      { simbolo: 'b', descricao: 'fator de ramificação' },
      { simbolo: 'd', descricao: 'profundidade da solução mais rasa' },
      { simbolo: 'm', descricao: 'profundidade máxima da árvore' },
    ],
    exemplo: {
      titulo: 'Xadrez: b ≈ 35, m ≈ 40',
      fonte: { arquivo: 'aulas-08-09' },
      passos: [
        passo('montagem', L`b^m \quad \text{vs.} \quad b^{m/2}`),
        passo('substituição', L`35^{40} \quad \text{vs.} \quad 35^{20}`),
        passo('resultado', L`\approx 5{,}8\times10^{61} \quad \text{vs.} \quad \approx 7{,}6\times10^{30}`, 'a poda, no melhor caso, corta o expoente pela metade'),
      ],
    },
  },
  {
    id: 'f.tsp',
    nome: 'Rotas do caixeiro viajante',
    latex: L`\text{rotas} = \frac{(n-1)!}{2}`,
    topicos: ['u2.otimizacao'],
    variaveis: [{ simbolo: 'n', descricao: 'número de cidades' }],
    exemplo: {
      titulo: '10 cidades',
      fonte: { arquivo: 'aula-06' },
      passos: [
        passo('montagem', L`\frac{(n-1)!}{2}`),
        passo('substituição', L`\frac{9!}{2} = \frac{362\,880}{2}`),
        passo('resultado', L`181\,440 \text{ rotas}`),
      ],
    },
    aviso: 'O slide diz 9!/2 = 118.440, mas a conta dá 181.440.',
  },
  {
    id: 'f.admissivel',
    nome: 'Heurística admissível',
    latex: L`h(n) \le h^*(n)`,
    topicos: ['u2.admissivel'],
    variaveis: [
      { simbolo: 'h(n)', descricao: 'estimativa da heurística' },
      { simbolo: 'h^*(n)', descricao: 'custo real até o objetivo' },
    ],
    exemplo: {
      titulo: 'Linha reta nunca é mais longa que a estrada',
      passos: [
        passo('montagem', L`h_{\text{reta}}(n) \le h^*_{\text{estrada}}(n)`),
        passo('resultado', L`\Rightarrow h_{\text{reta}} \text{ é admissível}`),
      ],
    },
  },
  {
    id: 'f.consistente',
    nome: 'Heurística consistente',
    latex: L`h(n) \le c(n, a, n') + h(n')`,
    topicos: ['u2.admissivel'],
    variaveis: [
      { simbolo: "c(n,a,n')", descricao: "custo de ir de n a n' pela ação a" },
      { simbolo: "n'", descricao: 'sucessor de n' },
    ],
    exemplo: {
      titulo: "h(n) = 5, custo 2, h(n') = 4",
      passos: [
        passo('montagem', L`h(n) \le c(n,a,n') + h(n')`),
        passo('substituição', L`5 \le 2 + 4`),
        passo('resultado', L`5 \le 6 \;\checkmark`, 'a desigualdade triangular vale'),
      ],
    },
  },
  {
    id: 'f.gulosa',
    nome: 'Busca gulosa',
    latex: L`f(n) = h(n)`,
    topicos: ['u2.gulosa'],
    exemplo: {
      titulo: 'Romênia, saindo de Arad',
      fonte: { arquivo: 'aulas-04-05' },
      passos: [
        passo('montagem', L`f(n) = h_{\text{reta}}(n)`),
        passo('substituição', L`f(\text{Sibiu}) = 253,\; f(\text{Timisoara}) = 329,\; f(\text{Zerind}) = 374`),
        passo('resultado', L`\text{escolhe Sibiu} \to \text{Fagaras} \to \text{Bucharest} = 450`, 'chega, mas 450 > 418: não é ótima'),
      ],
    },
  },
  {
    id: 'f.astar',
    nome: 'A*',
    latex: L`f(n) = g(n) + h(n)`,
    topicos: ['u2.astar'],
    variaveis: [
      { simbolo: 'g(n)', descricao: 'custo já percorrido' },
      { simbolo: 'h(n)', descricao: 'estimativa do que falta' },
    ],
    exemplo: {
      titulo: 'Romênia: expandindo Sibiu',
      fonte: { arquivo: 'aulas-04-05' },
      passos: [
        passo('montagem', L`f(\text{Rimnicu}) = g + h`),
        passo('substituição', L`f(\text{Rimnicu}) = (140 + 80) + 193`),
        passo('conta', L`f(\text{Rimnicu}) = 413 \;<\; 415 = f(\text{Fagaras})`, 'Fagaras: 239 + 176 = 415, então Rimnicu é expandido primeiro'),
        passo('resultado', L`\text{Arad} \to \text{Sibiu} \to \text{Rimnicu} \to \text{Pitesti} \to \text{Bucharest} = 418`, 'caminho ótimo'),
      ],
    },
  },
  {
    id: 'f.wastar',
    nome: 'Weighted A*',
    latex: L`f(n) = g(n) + w \cdot h(n)`,
    topicos: ['u2.wastar'],
    variaveis: [{ simbolo: 'w', descricao: 'peso da heurística' }],
    exemplo: {
      titulo: 'O mesmo nó com pesos diferentes (g = 220, h = 193)',
      passos: [
        passo('w = 0', L`f = 220 + 0 \cdot 193 = 220`, 'só g: busca de custo uniforme'),
        passo('w = 1', L`f = 220 + 1 \cdot 193 = 413`, 'A* normal'),
        passo('w = 2', L`f = 220 + 2 \cdot 193 = 606`, 'h pesa mais: fica mais guloso'),
      ],
    },
  },
  {
    id: 'f.sa',
    nome: 'Aceitação no Simulated Annealing',
    latex: L`P = e^{\Delta E / T}, \quad \Delta E = f(x') - f(x)`,
    topicos: ['u2.sa'],
    variaveis: [
      { simbolo: L`\Delta E`, descricao: 'variação do valor (negativa = vizinho pior)' },
      { simbolo: 'T', descricao: 'temperatura' },
    ],
    exemplo: {
      titulo: 'Vizinho 10 pontos pior (ΔE = −10) em temperaturas diferentes',
      fonte: { arquivo: 'aula-06', paginas: '58' },
      passos: [
        passo('montagem', L`P = e^{-10 / T}`),
        passo('T = 100', L`P = e^{-0{,}1} \approx 0{,}905`, 'quente: aceita quase sempre'),
        passo('T = 10', L`P = e^{-1} \approx 0{,}368`),
        passo('T = 1', L`P = e^{-10} \approx 0{,}00005`, 'frio: quase nunca aceita, vira Hill Climbing'),
      ],
    },
  },
  {
    id: 'f.roleta',
    nome: 'Seleção por roleta',
    latex: L`p_i = \frac{\text{fitness}_i}{\sum_j \text{fitness}_j}`,
    topicos: ['u2.ag.selecao'],
    exemplo: {
      titulo: 'A = 10, B = 20, C = 30, D = 40',
      fonte: { arquivo: 'lista-unidade-2-gabarito', paginas: '10' },
      passos: [
        passo('montagem', L`p_A = \frac{f_A}{f_A + f_B + f_C + f_D}`),
        passo('substituição', L`p_A = \frac{10}{10 + 20 + 30 + 40} = \frac{10}{100}`),
        passo('resultado', L`p_A = 10\%,\; p_B = 20\%,\; p_C = 30\%,\; p_D = 40\%`),
      ],
    },
  },
  {
    id: 'f.fitness-eq',
    nome: 'Fitness para equações',
    latex: L`\text{fitness} = \frac{1}{1 + |\text{alvo} - \text{resultado}|}`,
    topicos: ['u2.ag'],
    exemplo: {
      titulo: '5x + y² + w + z³ = 185, cromossomo (4, 7, 10, 5)',
      fonte: { arquivo: 'lista-unidade-2-gabarito', paginas: '11' },
      passos: [
        passo('montagem', L`\text{resultado} = 5x + y^2 + w + z^3`),
        passo('substituição', L`5\cdot4 + 7^2 + 10 + 5^3 = 20 + 49 + 10 + 125 = 204`),
        passo('erro', L`|185 - 204| = 19`),
        passo('resultado', L`\text{fitness} = \frac{1}{1 + 19} = 0{,}05`),
      ],
    },
  },
  {
    id: 'f.alfabeta',
    nome: 'Condição de poda',
    latex: L`\text{poda se } \alpha \ge \beta`,
    topicos: ['u2.alfabeta'],
    variaveis: [
      { simbolo: L`\alpha`, descricao: 'melhor valor garantido para MAX' },
      { simbolo: L`\beta`, descricao: 'melhor valor garantido para MIN' },
    ],
    exemplo: {
      titulo: 'MAX já tem 5; um nó MIN encontra uma folha 3',
      passos: [
        passo('montagem', L`\alpha = 5,\; \beta = +\infty`),
        passo('substituição', L`\text{folha } 3 \Rightarrow \beta = 3`),
        passo('resultado', L`\alpha = 5 \ge \beta = 3 \Rightarrow \text{poda os outros filhos}`, 'MIN vai dar ≤ 3, então MAX nunca escolhe esse ramo'),
      ],
    },
  },

  // ── U4 · Probabilidade ───────────────────────────────────────────
  {
    id: 'f.prob',
    nome: 'Complemento',
    latex: L`P(\neg X) = 1 - P(X), \quad 0 \le P(X) \le 1`,
    topicos: ['u4.prob-basica'],
    exemplo: {
      titulo: 'Não tirar 6 em um dado',
      passos: [
        passo('montagem', L`P(\neg 6) = 1 - P(6)`),
        passo('substituição', L`P(\neg 6) = 1 - \tfrac{1}{6}`),
        passo('resultado', L`P(\neg 6) = \tfrac{5}{6}`),
      ],
    },
  },
  {
    id: 'f.conjunta',
    nome: 'Conjunta (independentes)',
    latex: L`P(A \cap B) = P(A) \cdot P(B)`,
    topicos: ['u4.conjunta'],
    exemplo: {
      titulo: 'Dois dados, os dois dão 6',
      fonte: { arquivo: 'aula-20' },
      passos: [
        passo('montagem', L`P(6 \cap 6) = P(6) \cdot P(6)`),
        passo('substituição', L`\tfrac{1}{6} \cdot \tfrac{1}{6}`),
        passo('resultado', L`\tfrac{1}{36}`),
      ],
    },
  },
  {
    id: 'f.produto',
    nome: 'Regra do produto',
    latex: L`P(A \cap B) = P(B \mid A) \cdot P(A)`,
    topicos: ['u4.condicional'],
    exemplo: {
      titulo: 'Rei de Copas em um baralho de 52',
      fonte: { arquivo: 'aula-20' },
      passos: [
        passo('montagem', L`P(\text{Rei} \cap \text{Copas}) = P(\text{Rei} \mid \text{Copas}) \cdot P(\text{Copas})`),
        passo('substituição', L`\tfrac{1}{13} \cdot \tfrac{13}{52}`, 'há 1 rei entre as 13 cartas de copas'),
        passo('resultado', L`\tfrac{1}{52}`),
      ],
    },
  },
  {
    id: 'f.bayes',
    nome: 'Teorema de Bayes',
    latex: L`P(A \mid B) = \frac{P(B \mid A)\, P(A)}{P(B)}`,
    topicos: ['u4.bayes'],
    variaveis: [
      { simbolo: 'P(A)', descricao: 'priori' },
      { simbolo: 'P(B|A)', descricao: 'verossimilhança' },
      { simbolo: 'P(B)', descricao: 'evidência' },
      { simbolo: 'P(A|B)', descricao: 'posteriori' },
    ],
    exemplo: {
      titulo: 'Meningite (M) dado rigidez no pescoço (R)',
      fonte: { arquivo: 'aula-20', paginas: '50-54' },
      passos: [
        passo('montagem', L`P(M \mid R) = \frac{P(R \mid M)\, P(M)}{P(R)}`),
        passo('substituição', L`P(M \mid R) = \frac{0{,}5 \cdot \frac{1}{50\,000}}{\frac{1}{20}}`),
        passo('conta', L`= 0{,}5 \cdot 0{,}00002 \cdot 20`),
        passo('resultado', L`P(M \mid R) = 0{,}0002 = 0{,}02\%`, 'mesmo com o sintoma, meningite continua rara'),
      ],
    },
  },
  {
    id: 'f.map',
    nome: 'Máximo a posteriori (MAP)',
    latex: L`\hat{c} = \arg\max_{c_k} P(c_k \mid x)`,
    topicos: ['u4.apr-bayesiano'],
    exemplo: {
      titulo: 'Taylor é masculino ou feminino? (9 pessoas, 3 Taylors)',
      fonte: { arquivo: 'aula-20', paginas: '79-85' },
      passos: [
        passo('montagem', L`P(c \mid \text{taylor}) = \frac{P(\text{taylor} \mid c)\, P(c)}{P(\text{taylor})}`),
        passo('masculino', L`\frac{\frac14 \cdot \frac49}{\frac39} \approx 0{,}33`),
        passo('feminino', L`\frac{\frac25 \cdot \frac59}{\frac39} \approx 0{,}67`),
        passo('resultado', L`\arg\max \Rightarrow \text{feminino}`),
      ],
    },
  },
  {
    id: 'f.naive',
    nome: 'Naive Bayes',
    latex: L`P(c \mid x_1, \dots, x_m) \propto P(c) \prod_{i=1}^{m} P(x_i \mid c)`,
    topicos: ['u4.naive'],
    exemplo: {
      titulo: 'Taylor, 22 anos, EUA',
      fonte: { arquivo: 'aula-20', paginas: '105-106' },
      passos: [
        passo('montagem', L`P(c)\cdot P(\text{taylor}\mid c)\cdot P(22\mid c)\cdot P(\text{EUA}\mid c)`),
        passo('feminino', L`\tfrac59 \cdot \tfrac25 \cdot \tfrac05 \cdot \tfrac15 = 0`, 'nenhuma mulher de 22 anos no conjunto: zera tudo'),
        passo('masculino', L`\tfrac49 \cdot \tfrac14 \cdot \tfrac14 \cdot \tfrac24 \approx 0{,}014`),
        passo('resultado', L`\Rightarrow \text{masculino}`),
      ],
    },
  },
  {
    id: 'f.laplace',
    nome: 'Suavização de Laplace',
    latex: L`P(x_i \mid c) = \frac{\text{contagem}(x_i, c) + 1}{\text{contagem}(c) + k}`,
    topicos: ['u4.laplace'],
    variaveis: [{ simbolo: 'k', descricao: 'número de valores distintos do atributo' }],
    exemplo: {
      titulo: 'Taylor, 22, EUA com Laplace (k = 7 nomes, 9 idades, 3 países)',
      fonte: { arquivo: 'aula-20', paginas: '113-115' },
      passos: [
        passo('montagem', L`P(22 \mid \text{fem}) = \frac{0 + 1}{5 + 9} = \frac{1}{14}`, 'o zero vira 1/14'),
        passo('feminino', L`\tfrac59 \cdot \tfrac{3}{12} \cdot \tfrac{1}{14} \cdot \tfrac{2}{8} \approx 0{,}0025`),
        passo('masculino', L`\tfrac49 \cdot \tfrac{2}{11} \cdot \tfrac{2}{13} \cdot \tfrac{3}{7} \approx 0{,}0053`),
        passo('resultado', L`\Rightarrow \text{masculino, mas feminino não é mais } 0`),
      ],
    },
  },

  // ── U5 · KNN ─────────────────────────────────────────────────────
  {
    id: 'f.euclid',
    nome: 'Distância euclidiana',
    latex: L`d(x, y) = \sqrt{\sum_{i=1}^{n} (x_i - y_i)^2}`,
    topicos: ['u5.distancias', 'u2.heur-exemplos'],
    exemplo: {
      titulo: 'A = (1, 2), B = (4, 6)',
      fonte: { arquivo: 'aula-21' },
      passos: [
        passo('montagem', L`d = \sqrt{(x_1-y_1)^2 + (x_2-y_2)^2}`),
        passo('substituição', L`d = \sqrt{(1-4)^2 + (2-6)^2} = \sqrt{9 + 16}`),
        passo('resultado', L`d = \sqrt{25} = 5`),
      ],
    },
  },
  {
    id: 'f.manhattan',
    nome: 'Distância Manhattan',
    latex: L`d(x, y) = \sum_{i=1}^{n} |x_i - y_i|`,
    topicos: ['u5.distancias', 'u2.heur-exemplos'],
    exemplo: {
      titulo: 'A = (1, 2), B = (4, 6)',
      fonte: { arquivo: 'aula-21' },
      passos: [
        passo('montagem', L`d = |x_1-y_1| + |x_2-y_2|`),
        passo('substituição', L`d = |1-4| + |2-6| = 3 + 4`),
        passo('resultado', L`d = 7`),
      ],
    },
  },
  {
    id: 'f.minkowski',
    nome: 'Distância de Minkowski',
    latex: L`d(x, y) = \left(\sum_{i=1}^{n} |x_i - y_i|^p\right)^{1/p}`,
    topicos: ['u5.distancias'],
    variaveis: [{ simbolo: 'p', descricao: '1 = Manhattan, 2 = Euclidiana, ∞ = maior diferença' }],
    exemplo: {
      titulo: 'A = (1, 2), B = (4, 6), p = 3',
      fonte: { arquivo: 'aula-21' },
      passos: [
        passo('montagem', L`d = \left(|1-4|^3 + |2-6|^3\right)^{1/3}`),
        passo('substituição', L`d = (27 + 64)^{1/3} = 91^{1/3}`),
        passo('resultado', L`d \approx 4{,}498`),
      ],
    },
  },
  {
    id: 'f.mink-norm',
    nome: 'Minkowski normalizada',
    latex: L`d(x, y) = \left(\frac{\sum_k \delta_k |x_k - y_k|^p}{\sum_k \delta_k}\right)^{1/p}`,
    topicos: ['u5.distancias', 'u5.qualidade'],
    variaveis: [{ simbolo: L`\delta_k`, descricao: '1 se o atributo k é conhecido nos dois, 0 se falta em algum' }],
    exemplo: {
      titulo: 'x = (1, ?, 4), y = (2, 3, 6), p = 2',
      passos: [
        passo('montagem', L`\delta = (1, 0, 1)`, 'o segundo atributo falta em x'),
        passo('substituição', L`d = \left(\frac{|1-2|^2 + |4-6|^2}{2}\right)^{1/2} = \left(\frac{5}{2}\right)^{1/2}`),
        passo('resultado', L`d \approx 1{,}581`),
      ],
    },
  },
  {
    id: 'f.smc',
    nome: 'Simple Matching Coefficient',
    latex: L`SMC = \frac{m_{11} + m_{00}}{m_{01} + m_{10} + m_{11} + m_{00}}`,
    topicos: ['u5.binarios'],
    exemplo: {
      titulo: 'm₀₀ = 7, m₁₁ = 0, m₁₀ = 1, m₀₁ = 2',
      fonte: { arquivo: 'aula-21', paginas: '51' },
      passos: [
        passo('montagem', L`SMC = \frac{m_{11} + m_{00}}{m_{01} + m_{10} + m_{11} + m_{00}}`),
        passo('substituição', L`SMC = \frac{0 + 7}{2 + 1 + 0 + 7}`),
        passo('resultado', L`SMC = 0{,}7`, 'parece parecido só porque os dois têm muitos zeros'),
      ],
    },
  },
  {
    id: 'f.jaccard',
    nome: 'Coeficiente de Jaccard',
    latex: L`J = \frac{m_{11}}{m_{01} + m_{10} + m_{11}}`,
    topicos: ['u5.binarios'],
    exemplo: {
      titulo: 'Mesmos vetores do SMC',
      fonte: { arquivo: 'aula-21', paginas: '57' },
      passos: [
        passo('montagem', L`J = \frac{m_{11}}{m_{01} + m_{10} + m_{11}}`),
        passo('substituição', L`J = \frac{0}{2 + 1 + 0}`),
        passo('resultado', L`J = 0`, 'nenhum 1 em comum: não são nada parecidos'),
      ],
    },
  },
  {
    id: 'f.knn',
    nome: 'Decisão do KNN',
    latex: L`\hat{y} = \text{moda}\{y_{(1)}, \dots, y_{(k)}\} \quad\text{ou}\quad \hat{y} = \tfrac{1}{k}\sum_{i=1}^{k} y_{(i)}`,
    topicos: ['u5.knn'],
    exemplo: {
      titulo: 'k = 3 vizinhos mais próximos',
      fonte: { arquivo: 'aula-21' },
      passos: [
        passo('montagem', L`\text{vizinhos} = \{\text{futebol}, \text{futebol}, \text{basquete}\}`),
        passo('resultado', L`\hat{y} = \text{futebol}`, 'voto da maioria (2 × 1)'),
      ],
    },
  },

  // ── U5 · Árvores ─────────────────────────────────────────────────
  {
    id: 'f.gini',
    nome: 'Índice Gini do nó',
    latex: L`\text{Gini}(t) = 1 - \sum_j p(j \mid t)^2`,
    topicos: ['u5.gini'],
    exemplo: {
      titulo: 'Nó com 3 da classe 1 e 3 da classe 2',
      fonte: { arquivo: 'aula-24', paginas: '50' },
      passos: [
        passo('montagem', L`\text{Gini} = 1 - (p_1^2 + p_2^2)`),
        passo('substituição', L`\text{Gini} = 1 - \left(\left(\tfrac36\right)^2 + \left(\tfrac36\right)^2\right)`),
        passo('resultado', L`\text{Gini} = 1 - 0{,}5 = 0{,}5`, 'o máximo para 2 classes; nó (0, 6) dá 0'),
      ],
    },
  },
  {
    id: 'f.gini-split',
    nome: 'Gini da divisão',
    latex: L`\text{Gini}_{\text{split}} = \sum_{i=1}^{k} \frac{n_i}{n}\, \text{Gini}(i)`,
    topicos: ['u5.gini'],
    exemplo: {
      titulo: 'Pai (6, 6) → N1 (5, 2) e N2 (1, 4)',
      fonte: { arquivo: 'aula-24', paginas: '56' },
      passos: [
        passo('N1', L`1 - \left(\left(\tfrac57\right)^2 + \left(\tfrac27\right)^2\right) = \tfrac{20}{49} \approx 0{,}408`),
        passo('N2', L`1 - \left(\left(\tfrac15\right)^2 + \left(\tfrac45\right)^2\right) = \tfrac{8}{25} = 0{,}32`),
        passo('substituição', L`\tfrac{7}{12} \cdot 0{,}408 + \tfrac{5}{12} \cdot 0{,}32`),
        passo('resultado', L`\text{Gini}_{\text{split}} \approx 0{,}371 < 0{,}5`, 'menor que o pai: a divisão é boa'),
      ],
    },
  },
  {
    id: 'f.entropia',
    nome: 'Entropia',
    latex: L`E(t) = -\sum_j p(j \mid t) \log_2 p(j \mid t)`,
    topicos: ['u5.entropia'],
    exemplo: {
      titulo: 'Nó com 1 positivo e 3 negativos',
      passos: [
        passo('montagem', L`E = -\left(p_+ \log_2 p_+ + p_- \log_2 p_-\right)`),
        passo('substituição', L`E = -\left(\tfrac14 \log_2 \tfrac14 + \tfrac34 \log_2 \tfrac34\right)`),
        passo('conta', L`E = 0{,}5 + 0{,}311`),
        passo('resultado', L`E \approx 0{,}811`, 'máximo é log₂ c (= 1 para 2 classes)'),
      ],
    },
  },
  {
    id: 'f.ganho',
    nome: 'Ganho de informação',
    latex: L`\text{Ganho} = E(\text{pai}) - \sum_{i=1}^{k} \frac{n_i}{n}\, E(i)`,
    topicos: ['u5.entropia'],
    exemplo: {
      titulo: 'Pai (6, 6) → N1 (5, 2) e N2 (1, 4)',
      passos: [
        passo('pai', L`E(\text{pai}) = 1`, 'meio a meio'),
        passo('filhos', L`E(N_1) \approx 0{,}863,\quad E(N_2) \approx 0{,}722`),
        passo('substituição', L`1 - \left(\tfrac{7}{12} \cdot 0{,}863 + \tfrac{5}{12} \cdot 0{,}722\right) = 1 - 0{,}804`),
        passo('resultado', L`\text{Ganho} \approx 0{,}196`),
      ],
    },
  },

  // ── U5 · Complementar ────────────────────────────────────────────
  {
    id: 'f.regressao',
    nome: 'Regressão linear',
    latex: L`f(x) = \beta_0 + \sum_{i=1}^{n} \beta_i x_i`,
    topicos: ['u5.regressao'],
    exemplo: {
      titulo: 'β₀ = 2, β₁ = 3, x = 4',
      passos: [
        passo('montagem', L`f(x) = \beta_0 + \beta_1 x`),
        passo('substituição', L`f(4) = 2 + 3 \cdot 4`),
        passo('resultado', L`f(4) = 14`),
      ],
    },
  },
  {
    id: 'f.metricas',
    nome: 'Métricas da matriz de confusão',
    latex: L`\text{Sens} = \frac{VP}{VP+FN} \quad \text{Esp} = \frac{VN}{VN+FP} \quad \text{Prec} = \frac{VP}{VP+FP} \quad F_1 = 2\,\frac{\text{Prec}\cdot\text{Sens}}{\text{Prec}+\text{Sens}}`,
    topicos: ['u5.metricas'],
    exemplo: {
      titulo: 'Lista 5, Q17: VP = 80, FN = 20, FP = 30, VN = 170',
      fonte: { arquivo: 'lista-unidade-5' },
      passos: [
        passo('acurácia', L`\frac{80 + 170}{300} \approx 0{,}833`),
        passo('sensibilidade', L`\frac{80}{80 + 20} = 0{,}8`),
        passo('especificidade', L`\frac{170}{170 + 30} = 0{,}85`),
        passo('precisão', L`\frac{80}{80 + 30} \approx 0{,}727`),
        passo('F1', L`2 \cdot \frac{0{,}727 \cdot 0{,}8}{0{,}727 + 0{,}8} \approx 0{,}762`),
      ],
    },
  },
]

export const formulasDoTopico = (id: string) => FORMULAS.filter((f) => f.topicos.includes(id))
