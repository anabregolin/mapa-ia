// Banco de questões da P2 (unidades 4 e 5), escrito à mão a partir da apostila, das listas e da P2 de 2026/1.
// Nível 1 = lembrar/reconhecer · 2 = aplicar/calcular · 3 = analisar, explicar, pegadinha de prova.
// Não são questões oficiais: as que vieram da prova ou das listas dizem a fonte; as outras são "estilo da prova".
// Em múltipla escolha, a opção certa é escrita primeiro e embaralhada na hora de mostrar.

const L = String.raw

export type Nivel = 1 | 2 | 3

interface Base {
  id: string
  topico: string
  nivel: Nivel
  /** de onde veio; sem fonte = escrita no estilo da prova */
  fonte?: string
  /** dito depois de responder; aceita $latex$ e **negrito** */
  explicacao: string
}

export interface QEscolha extends Base {
  tipo: 'escolha'
  enunciado: string
  /** a primeira é a certa; cada errada diz por que está errada */
  opcoes: { texto: string; porque?: string }[]
}

export interface QVF extends Base {
  tipo: 'vf'
  enunciado: string
  afirmacoes: { texto: string; v: boolean; porque: string }[]
}

export interface QNumero extends Base {
  tipo: 'numero'
  enunciado: string
  resposta: number
  casas?: number
  porcento?: boolean
  /** a conta, em LaTeX */
  conta?: string
}

export interface QAberta extends Base {
  tipo: 'aberta'
  enunciado: string
  /** o que a correção procura; você marca o que a sua resposta tinha */
  pontos: string[]
  modelo: string
}

export type Questao = QEscolha | QVF | QNumero | QAberta

const contagem = new Map<string, number>()
const novoId = (topico: string) => {
  const n = (contagem.get(topico) ?? 0) + 1
  contagem.set(topico, n)
  return `${topico}#${n}`
}

type Extra = { fonte?: string }

const esc = (topico: string, nivel: Nivel, enunciado: string, certa: string, erradas: [string, string][], explicacao: string, x: Extra = {}): QEscolha => ({
  id: novoId(topico),
  tipo: 'escolha',
  topico,
  nivel,
  enunciado,
  opcoes: [{ texto: certa }, ...erradas.map(([texto, porque]) => ({ texto, porque }))],
  explicacao,
  ...x,
})

const vf = (topico: string, nivel: Nivel, enunciado: string, afirmacoes: [string, boolean, string][], x: Extra = {}): QVF => ({
  id: novoId(topico),
  tipo: 'vf',
  topico,
  nivel,
  enunciado,
  afirmacoes: afirmacoes.map(([texto, v, porque]) => ({ texto, v, porque })),
  explicacao: '',
  ...x,
})

const num = (
  topico: string,
  nivel: Nivel,
  enunciado: string,
  resposta: number,
  conta: string,
  explicacao: string,
  x: Extra & { casas?: number; porcento?: boolean } = {},
): QNumero => ({ id: novoId(topico), tipo: 'numero', topico, nivel, enunciado, resposta, conta, explicacao, ...x })

const abe = (topico: string, nivel: Nivel, enunciado: string, pontos: string[], modelo: string, x: Extra = {}): QAberta => ({
  id: novoId(topico),
  tipo: 'aberta',
  topico,
  nivel,
  enunciado,
  pontos,
  modelo,
  explicacao: '',
  ...x,
})

const NAO_VISTO = 'programa da disciplina (não visto em aula)'

export const QUESTOES: Questao[] = [
  // ── U4 · Incerteza ────────────────────────────────────────────────
  esc('u4.incerteza', 1, 'Qual é a diferença central entre a IA clássica e a IA probabilística, como a aula resume?',
    'Na clássica o agente **sabe** (verdadeiro/falso); na probabilística ele **acredita**, com graus entre 0 e 1, e atualiza a crença com evidências.',
    [
      ['A probabilística abandona a lógica.', 'Ela continua usando lógica; só troca verdadeiro/falso por graus de crença.'],
      ['A clássica só serve para jogos.', 'Busca, A* e planejamento são IA clássica e vão muito além de jogos.'],
      ['A probabilística sempre encontra a resposta ótima.', 'Ela lida com incerteza; não promete o ótimo.'],
    ],
    'A frase da aula: na IA clássica o agente sabe; na probabilística o agente acredita e atualiza a crença.'),
  vf('u4.incerteza', 2, 'Quais situações quebram as suposições da IA clássica?', [
    ['O sensor do robô às vezes lê errado.', true, 'Observação com ruído é incerteza.'],
    ['Mandar o robô andar 1 m faz ele andar 0,9 m algumas vezes.', true, 'Ação não determinística.'],
    ['No xadrez, o agente vê todas as peças do tabuleiro.', false, 'Isso é ambiente observável e determinístico: a IA clássica dá conta.'],
    ['O agente não sabe exatamente em que estado está.', true, 'Estado parcialmente observável.'],
  ]),
  esc('u4.incerteza', 2, 'Um agente acredita 0,3 que vai chover e então vê nuvens carregadas. O que a IA probabilística faz?',
    'Atualiza a crença usando a evidência (pelo Teorema de Bayes).',
    [
      ['Passa a considerar "vai chover" verdadeiro.', 'A evidência aumenta a crença, mas não vira certeza: o agente continua acreditando, não sabendo.'],
      ['Mantém 0,3, porque a crença já foi definida.', 'Atualizar com evidência é justamente o ponto da IA probabilística.'],
    ],
    'Crença + evidência → crença atualizada. É o que a unidade inteira faz, até o Naive Bayes.'),

  // ── U4 · Probabilidade básica ────────────────────────────────────
  num('u4.prob-basica', 1, 'Um dado honesto é lançado. Qual a probabilidade de sair um número par?', 0.5, L`\{2, 4, 6\} \Rightarrow \tfrac{3}{6} = 0{,}5`,
    'Casos favoráveis sobre casos possíveis, porque todos os resultados são igualmente prováveis.'),
  num('u4.prob-basica', 2, 'Quantos eventos existem num espaço amostral com 4 resultados?', 16, L`2^{|\Omega|} = 2^4 = 16`,
    'Um evento é qualquer subconjunto de $\\Omega$, incluindo o vazio e o próprio $\\Omega$.', { casas: 0 }),
  num('u4.prob-basica', 2, L`$P(A) = 0{,}5$, $P(B) = 0{,}4$ e $P(A \cap B) = 0{,}2$. Quanto vale $P(A \cup B)$?`, 0.7, L`0{,}5 + 0{,}4 - 0{,}2 = 0{,}7`,
    'Subtrai a interseção porque ela foi contada duas vezes.'),
  esc('u4.prob-basica', 3, L`Qual destas atribuições **não** pode ser uma distribuição de probabilidade para $\Omega = \{a, b, c\}$?`,
    L`$P(a) = 0{,}5$, $P(b) = 0{,}4$, $P(c) = 0{,}2$`,
    [
      [L`$P(a) = 1$, $P(b) = 0$, $P(c) = 0$`, 'Soma 1 e todos entre 0 e 1: é válida, mesmo com zeros.'],
      [L`$P(a) = P(b) = P(c) = 1/3$`, 'Equiprovável e soma 1: é válida.'],
      [L`$P(a) = 0{,}2$, $P(b) = 0{,}2$, $P(c) = 0{,}6$`, 'Soma 1: é válida.'],
    ],
    L`A soma dá 1,1. Pelos axiomas, $P(\Omega) = 1$.`),
  vf('u4.prob-basica', 2, 'Verdadeiro ou falso?', [
    [L`$P(\neg A) = 1 - P(A)$`, true, 'Consequência direta dos axiomas.'],
    [L`Se A e B são disjuntos, $P(A \cup B) = P(A) + P(B)$.`, true, 'É um dos axiomas.'],
    [L`$P(A \cup B) = P(A) + P(B)$ sempre.`, false, 'Só sem interseção; no geral, subtrai $P(A \\cap B)$.'],
    ['Um evento muito provável pode ter probabilidade 1,2.', false, 'Probabilidade fica sempre entre 0 e 1.'],
  ]),

  // ── U4 · Conjunta e independência ────────────────────────────────
  num('u4.conjunta', 1, 'Dois dados honestos são lançados. Qual a probabilidade de sair 6 nos dois?', 1 / 36, L`\tfrac16 \cdot \tfrac16 = \tfrac{1}{36} \approx 0{,}028`,
    'Os dados são independentes: multiplica.'),
  esc('u4.conjunta', 2, L`Quando vale $P(A \cap B) = P(A) \cdot P(B)$?`,
    'Quando A e B são independentes.',
    [
      ['Sempre.', 'Só com independência. Tirar duas cartas sem reposição é o contraexemplo da aula.'],
      ['Quando A e B são disjuntos.', 'Disjuntos (com probabilidade > 0) são o oposto: se um acontece, o outro tem chance 0, então $P(A \\cap B) = 0 \\ne P(A)P(B)$.'],
    ],
    'Independente = saber de um não muda a chance do outro.'),
  num('u4.conjunta', 3, 'Baralho de 52 cartas. Tiram-se duas cartas **sem reposição**. Qual a probabilidade de as duas serem ases?', (4 / 52) * (3 / 51),
    L`\tfrac{4}{52} \cdot \tfrac{3}{51} = \tfrac{12}{2652} \approx 0{,}0045`,
    'Não são independentes: depois do primeiro ás, sobram 3 ases em 51 cartas. É a regra do produto com condicional.', { casas: 4 }),
  esc('u4.conjunta', 3, L`$P(A) = 0{,}3$, $P(B) = 0{,}5$ e $P(A \cap B) = 0{,}15$. Então A e B são:`,
    L`Independentes, porque $0{,}3 \cdot 0{,}5 = 0{,}15$.`,
    [
      [L`Dependentes, porque $P(A \cap B) \ne 0$.`, 'Interseção diferente de zero não indica dependência. O teste é comparar com o produto.'],
      ['Disjuntos.', 'Disjuntos teriam $P(A \\cap B) = 0$.'],
    ],
    L`Teste de independência: $P(A \cap B) = P(A)P(B)$, ou equivalente, $P(A \mid B) = P(A)$.`),

  // ── U4 · Condicional ─────────────────────────────────────────────
  num('u4.condicional', 1, 'Num baralho de 52 cartas, qual a probabilidade de uma carta ser rei, sabendo que é de copas?', 1 / 13, L`P(\text{Rei} \mid \text{Copas}) = \tfrac{1}{13} \approx 0{,}077`,
    'Saber que é copas encolhe o espaço para 13 cartas; só uma é rei.'),
  num('u4.condicional', 2, L`$P(A \cap B) = 0{,}12$ e $P(B) = 0{,}4$. Quanto vale $P(A \mid B)$?`, 0.3, L`\tfrac{0{,}12}{0{,}4} = 0{,}3`, 'Definição de condicional.'),
  num('u4.condicional', 2, L`$P(B) = 0{,}5$ e $P(A \mid B) = 0{,}6$. Quanto vale $P(A \cap B)$?`, 0.3, L`P(A \mid B)\,P(B) = 0{,}6 \cdot 0{,}5 = 0{,}3`, 'Regra do produto.'),
  num('u4.condicional', 3, 'Numa turma, 60% estudou. Dos que estudaram, 90% passou; dos que não estudaram, 40% passou. Qual a probabilidade de um aluno sorteado ter passado?', 0.7,
    L`0{,}6 \cdot 0{,}9 + 0{,}4 \cdot 0{,}4 = 0{,}54 + 0{,}16 = 0{,}70`,
    L`Probabilidade total: soma $P(\text{passou} \mid h)\,P(h)$ para cada caso. É o mesmo cálculo do denominador $P(E)$ de Bayes.`),
  esc('u4.condicional', 2, L`Em $P(A \mid B)$, o que muda em relação a $P(A)$?`,
    'O espaço amostral encolhe para os casos em que B aconteceu.',
    [
      ['A e B passam a ser independentes.', 'Condicionar não cria independência; se A e B forem independentes, $P(A \\mid B) = P(A)$.'],
      [L`Multiplica-se $P(A)$ por $P(B)$.`, 'Isso é a conjunta de eventos independentes, não a condicional.'],
    ],
    L`$P(A \mid B) = P(A \cap B) / P(B)$: dentro de B, qual fração também é A.`),

  // ── U4 · Bayes ───────────────────────────────────────────────────
  esc('u4.bayes', 1, L`Em $P(H \mid E) = \dfrac{P(E \mid H)\,P(H)}{P(E)}$, o termo $P(E \mid H)$ é:`,
    'a verossimilhança',
    [
      ['a priori', 'A priori é $P(H)$, a crença antes de ver a evidência.'],
      ['a posteriori', 'A posteriori é $P(H \\mid E)$, o resultado.'],
      ['a evidência', 'A evidência é $P(E)$, o denominador.'],
    ],
    'Verossimilhança: o quanto a evidência é comum quando a hipótese é verdadeira.'),
  num('u4.bayes', 2, L`Meningite: $P(R \mid M) = 0{,}5$, $P(M) = 1/50.000$ e $P(R) = 1/20$. Quanto vale $P(M \mid R)$?`, 0.0002,
    L`\frac{0{,}5 \cdot \frac{1}{50000}}{\frac{1}{20}} = 0{,}5 \cdot \frac{20}{50000} = 0{,}0002`,
    'A priori minúscula domina: mesmo com rigidez no pescoço, meningite continua raríssima.', { casas: 4, fonte: 'aula 20' }),
  esc('u4.bayes', 2, 'Um teste detecta 99% das pessoas doentes. Você testou positivo. Qual a chance de estar doente?',
    'Não dá para saber sem a priori (quão rara é a doença) e a taxa de falso positivo.',
    [
      ['99%', 'Esse é $P(+ \\mid D)$, não $P(D \\mid +)$. Trocar as condicionais é o erro mais comum de Bayes.'],
      ['1%', 'Também não sai só do 99%; falta a priori e o falso positivo.'],
    ],
    L`$P(D \mid +) = \dfrac{P(+ \mid D)P(D)}{P(+)}$: precisa de $P(D)$ e de $P(+ \mid \neg D)$ para calcular $P(+)$.`),
  num('u4.bayes', 3, L`Uma doença atinge 1% das pessoas. O teste dá positivo em 90% dos doentes e em 10% dos saudáveis. Qual a probabilidade de estar doente dado que testou positivo?`,
    (0.9 * 0.01) / (0.9 * 0.01 + 0.1 * 0.99),
    L`\frac{0{,}9 \cdot 0{,}01}{0{,}9 \cdot 0{,}01 + 0{,}1 \cdot 0{,}99} = \frac{0{,}009}{0{,}108} \approx 0{,}083`,
    L`O denominador é a probabilidade total de dar positivo: doentes que dão positivo + saudáveis que dão positivo. Como saudáveis são 99%, a maior parte dos positivos é falso positivo.`),
  abe('u4.bayes', 3, 'No exemplo da meningite, a rigidez de nuca aparece em 50% dos doentes. Explique por que, mesmo assim, quem tem rigidez quase nunca tem meningite.',
    [
      L`$P(R \mid M)$ e $P(M \mid R)$ são coisas diferentes`,
      'a priori $P(M)$ é minúscula (1 em 50.000)',
      'a rigidez é comum por outros motivos: $P(R) = 1/20$',
      'a posteriori é proporcional a verossimilhança × priori: a priori pequena puxa o resultado para baixo',
    ],
    L`$P(R \mid M) = 0{,}5$ diz quantos doentes têm rigidez, mas a pergunta é quantos com rigidez estão doentes, $P(M \mid R)$. Pelo Teorema de Bayes, $P(M \mid R) = P(R \mid M)P(M)/P(R) = 0{,}5 \cdot (1/50.000) / (1/20) = 0{,}0002$. A meningite é tão rara (priori 1/50.000) e a rigidez tão comum por outras causas ($P(R) = 1/20$) que quase todos os casos de rigidez vêm de outros motivos.`),

  // ── U4 · Aprendizado bayesiano ───────────────────────────────────
  esc('u4.apr-bayesiano', 1, 'O que a classificação MAP escolhe?',
    L`A classe de maior probabilidade a posteriori, $\arg\max_c P(c \mid x)$.`,
    [
      [L`A classe de maior priori $P(c)$.`, 'Ignora a evidência $x$; só faria sentido sem dados.'],
      [L`A classe de maior verossimilhança $P(x \mid c)$.`, 'Isso é máxima verossimilhança (ML), que ignora a priori.'],
    ],
    'MAP = maximum a posteriori.'),
  esc('u4.apr-bayesiano', 2, L`Por que dá para ignorar $P(x)$ ao comparar classes?`,
    'Porque é o mesmo denominador para todas as classes: não muda qual é a maior.',
    [
      [L`Porque $P(x)$ vale sempre 1.`, '$P(x)$ é a probabilidade da evidência; quase nunca é 1.'],
      ['Porque x é independente da classe.', 'Se fosse, x não ajudaria a classificar.'],
    ],
    L`Compara-se $P(x \mid c)\,P(c)$. Para ter a probabilidade de verdade, normaliza no fim (divide pela soma).`),
  vf('u4.apr-bayesiano', 2, 'Sobre o aprendizado bayesiano:', [
    ['Com muitos dados, a priori perde influência.', true, 'A verossimilhança acumulada passa a dominar.'],
    ['No fim do aprendizado, só uma hipótese continua possível.', false, 'Várias continuam plausíveis, com probabilidades diferentes.'],
    ['Os dados atualizam a probabilidade de cada hipótese via Bayes.', true, 'É a definição.'],
    ['Naive Bayes é um caso particular de aprendizado bayesiano.', true, 'Com a hipótese extra de independência condicional.'],
  ]),
  abe('u4.apr-bayesiano', 3, 'Explique a diferença entre Aprendizado Bayesiano e o algoritmo Naive Bayes, destacando o objetivo de cada abordagem, o papel do Teorema de Bayes nos dois e a hipótese adicional do Naive Bayes.',
    [
      'aprendizado bayesiano: abordagem geral de atualizar a probabilidade das hipóteses com os dados',
      'Naive Bayes: um algoritmo de classificação específico, que escolhe a classe de maior posteriori',
      'nos dois, o Teorema de Bayes transforma priori + verossimilhança em posteriori',
      'hipótese extra do Naive: atributos condicionalmente independentes dada a classe',
      L`por isso $P(x \mid c)$ vira um produto de $P(x_i \mid c)$, fácil de estimar com poucos dados`,
    ],
    L`O **aprendizado bayesiano** é a abordagem geral: cada hipótese tem uma probabilidade e os dados a atualizam pelo Teorema de Bayes, $P(h \mid D) \propto P(D \mid h)P(h)$. O objetivo é chegar às hipóteses mais prováveis dados os dados. O **Naive Bayes** é um algoritmo de classificação que aplica essa ideia: escolhe a classe de maior posteriori. Para isso assume que os atributos são **condicionalmente independentes dada a classe**, o que faz $P(x_1, \dots, x_m \mid c)$ virar $\prod_i P(x_i \mid c)$. Cada termo é contado separado no treino, então funciona com poucos dados, mesmo a suposição sendo quase sempre falsa.`,
    { fonte: 'Lista U4, Q7' }),

  // ── U4 · Naive Bayes ─────────────────────────────────────────────
  esc('u4.naive', 1, 'Qual suposição torna o Naive Bayes "ingênuo"?',
    'Os atributos são independentes entre si, dada a classe.',
    [
      ['As classes são igualmente prováveis.', 'As prioris $P(c)$ são estimadas dos dados; não precisam ser iguais.'],
      ['Os atributos são independentes da classe.', 'Se fossem, não ajudariam a classificar. A independência é entre atributos, dentro de cada classe.'],
      ['Todo atributo tem distribuição normal.', 'Isso é uma variante (Naive Bayes gaussiano), não a suposição central.'],
    ],
    L`É isso que permite trocar $P(x_1, \dots, x_m \mid c)$ por $\prod_i P(x_i \mid c)$.`),
  vf('u4.naive', 2, 'Sobre o Naive Bayes:', [
    [L`Transforma $P(x_1, \dots, x_m \mid c)$ num produto de termos simples.`, true, 'Por causa da independência condicional.'],
    ['Não usa o Teorema de Bayes.', false, 'Usa: é Bayes com a hipótese de independência.'],
    ['Costuma classificar bem mesmo quando a independência é falsa.', true, 'O que importa é qual classe tem o maior produto, não o valor exato.'],
    [L`Um único $P(x_i \mid c) = 0$ zera a classe inteira.`, true, 'Produto com zero dá zero; daí a suavização de Laplace.'],
  ], { fonte: 'Lista U4, Q8 (adaptada)' }),
  num('u4.naive', 2, L`$P(S) = 0{,}4$, $P(\text{oferta} \mid S) = 0{,}5$, $P(\text{grátis} \mid S) = 0{,}6$; $P(\neg S) = 0{,}6$, $P(\text{oferta} \mid \neg S) = 0{,}1$, $P(\text{grátis} \mid \neg S) = 0{,}2$. Com Naive Bayes, qual a probabilidade de uma mensagem com "oferta" e "grátis" ser spam?`,
    0.12 / 0.132,
    L`S: 0{,}4 \cdot 0{,}5 \cdot 0{,}6 = 0{,}12 \quad \neg S: 0{,}6 \cdot 0{,}1 \cdot 0{,}2 = 0{,}012 \quad \frac{0{,}12}{0{,}132} \approx 0{,}909`,
    'Multiplica priori pelas condicionais em cada classe e normaliza dividindo pela soma. Igual à Q1 da P2.'),
  abe('u4.naive', 3, 'Quais são as principais vantagens e limitações do Naive Bayes em classificação de texto, como filtro de spam?',
    [
      'vantagem: treina e classifica rápido (só contagens)',
      'vantagem: funciona com poucos dados de treino',
      'vantagem: lida bem com muitos atributos (cada palavra é um atributo)',
      'limitação: a independência entre palavras é irreal (perde ordem e contexto)',
      'limitação: palavra nunca vista numa classe zera o produto → usar Laplace',
    ],
    'Vantagens: o treino é só contar frequências, então é rápido e precisa de pouco dado; lida bem com milhares de atributos (uma palavra por atributo); e na prática classifica bem, porque só importa qual classe tem o maior produto. Limitações: assume que as palavras são independentes dada a classe, o que é falso ("não" + "gostei" muda o sentido) e perde a ordem; as probabilidades saem exageradas (perto de 0 ou 1); e uma palavra que nunca apareceu numa classe zera aquela classe, o que exige suavização de Laplace.',
    { fonte: 'Lista U4, Q6' }),
  esc('u4.naive', 3, 'Num problema com atributos muito correlacionados, o Naive Bayes deu 0,97 para a classe A e 0,03 para B. O que é mais confiável?',
    'A escolha da classe A (a ordem), mais do que o valor 0,97.',
    [
      ['O valor 0,97 em si.', 'Com atributos correlacionados, o produto conta a mesma evidência várias vezes e empurra o valor para os extremos.'],
      ['Nenhum dos dois: o modelo não serve.', 'Na prática ele costuma acertar a classe mesmo com a independência violada.'],
    ],
    'O Naive Bayes é bom classificador e mau estimador de probabilidade.'),

  // ── U4 · Laplace ─────────────────────────────────────────────────
  esc('u4.laplace', 1, 'Para que serve a suavização de Laplace?',
    'Para uma contagem zero não zerar a probabilidade da classe inteira.',
    [
      ['Para normalizar atributos em escalas diferentes.', 'Isso é normalização, usada no KNN.'],
      ['Para reduzir o número de atributos.', 'Laplace não remove atributos; só ajusta contagens.'],
    ],
    'Soma 1 em todas as contagens: nada fica "impossível" só porque não apareceu no treino.'),
  num('u4.laplace', 2, 'O atributo Cor tem 3 valores possíveis. Na classe Sim (8 exemplos), Cor = Azul apareceu 0 vezes. Quanto vale $P(\\text{Azul} \\mid \\text{Sim})$ com Laplace?', 1 / 11,
    L`\frac{0 + 1}{8 + 3} = \frac{1}{11} \approx 0{,}091`,
    'Numerador +1; denominador + k, onde k = número de valores do atributo.'),
  esc('u4.laplace', 2, 'No exemplo da aula (Taylor, 22, EUA), qual é o $k$ usado para o atributo idade?',
    '9, o número de idades distintas na base.',
    [
      ['2, o número de classes.', 'k conta os valores do atributo, não as classes.'],
      ['1, sempre.', 'O +1 vai no numerador; no denominador soma-se k.'],
      ['O número de exemplos da classe.', 'Esse é contagem(c), a outra parte do denominador.'],
    ],
    'Na aula: 7 nomes, 9 idades e 3 países. O k muda por atributo.', { fonte: 'aula 20' }),
  vf('u4.laplace', 3, 'Sobre a suavização de Laplace:', [
    ['Com Laplace, nenhuma probabilidade condicional fica zero.', true, 'Todo numerador tem pelo menos 1.'],
    ['O k é o mesmo para todos os atributos.', false, 'k é o número de valores de cada atributo.'],
    ['Soma-se 1 só nas contagens que deram zero.', false, 'Soma-se 1 em todas, senão as probabilidades não somariam 1.'],
    ['Dentro de uma classe, as probabilidades de um atributo continuam somando 1.', true, L`Os numeradores ganham $k$ no total, e o denominador também.`],
  ]),

  // ── U4 · Redes bayesianas (não vistas em aula) ───────────────────
  esc('u4.redes-bayes', 1, 'O que uma rede bayesiana representa?',
    'Variáveis como nós de um grafo dirigido sem ciclos; as arestas são dependências diretas e cada nó tem a tabela P(nó | pais).',
    [
      ['Uma rede neural treinada com o Teorema de Bayes.', 'Nome parecido, ideia diferente: não há neurônios nem pesos.'],
      ['Um grafo de distâncias entre exemplos.', 'Isso lembra KNN, não redes bayesianas.'],
    ],
    'A rede codifica a distribuição conjunta de forma compacta: cada variável só depende dos pais.', { fonte: NAO_VISTO }),
  esc('u4.redes-bayes', 2, 'O programa cita inferência exata e aproximada em redes bayesianas. Qual a diferença?',
    'A exata calcula a probabilidade certa (ex.: enumeração), mas pode ficar cara; a aproximada estima por amostragem.',
    [
      ['A exata usa dados; a aproximada não usa.', 'As duas consultam a mesma rede; mudam o jeito de calcular.'],
      ['A aproximada é sempre melhor.', 'É mais barata em redes grandes, mas tem erro de estimativa.'],
    ],
    'Inferência = calcular P(consulta | evidência) a partir da rede.', { fonte: NAO_VISTO }),

  // ── U5 · O que é ML ──────────────────────────────────────────────
  esc('u5.ml', 1, 'Qual esquema descreve o aprendizado de máquina?',
    'Dados + respostas → modelo; depois, modelo + dados novos → resposta.',
    [
      ['Regras + dados → respostas.', 'Essa é a programação tradicional.'],
      ['Modelo + regras → dados.', 'Não descreve nenhum dos dois.'],
    ],
    'Em ML a regra é aprendida a partir de exemplos, não escrita à mão.'),
  esc('u5.ml', 2, 'Qual é o grande desafio do aprendizado de máquina?',
    'Generalizar: acertar casos que não estavam no treino.',
    [
      ['Acertar 100% do treino.', 'Isso pode ser só decoreba (overfitting).'],
      ['Treinar o mais rápido possível.', 'Velocidade importa, mas não é o desafio central.'],
    ],
    'Todo o resto da unidade (treino/teste, overfitting, bias indutivo) gira em torno de generalizar.'),
  esc('u5.ml', 2, 'Qual destes problemas **menos** precisa de aprendizado de máquina?',
    'Calcular o imposto a partir de uma tabela de alíquotas fixa e conhecida.',
    [
      ['Reconhecer spam pelo conteúdo do e-mail.', 'A regra é difícil de escrever e há muitos exemplos rotulados: bom caso para ML.'],
      ['Prever se um cliente vai cancelar o plano.', 'Padrão escondido em dados históricos: típico de ML.'],
    ],
    'Quando a regra é conhecida e exata, basta programar.'),

  // ── U5 · Paradigmas ──────────────────────────────────────────────
  esc('u5.paradigmas', 1, 'Prever o preço de um apartamento a partir da área e do bairro é:',
    'Supervisionado, regressão.',
    [
      ['Supervisionado, classificação.', 'A saída é um número contínuo, não uma classe.'],
      ['Não supervisionado.', 'Os dados têm o rótulo (preço).'],
      ['Por reforço.', 'Não há agente agindo e recebendo recompensa.'],
    ],
    'Com rótulo = supervisionado; rótulo numérico = regressão.'),
  esc('u5.paradigmas', 2, 'Agrupar clientes por comportamento de compra, sem saber os grupos antes, é:',
    'Não supervisionado (clustering).',
    [
      ['Supervisionado, classificação.', 'Não há classe conhecida para aprender.'],
      ['Por reforço.', 'Não há recompensa.'],
    ],
    'Sem rótulos, o algoritmo procura estrutura nos dados.'),
  esc('u5.paradigmas', 2, 'Um modelo de linguagem aprendendo a prever a próxima palavra em textos da internet é:',
    'Auto-supervisionado: o próprio texto fornece o rótulo.',
    [
      ['Supervisionado com rótulos feitos por pessoas.', 'Ninguém rotulou: a próxima palavra já está no texto.'],
      ['Não supervisionado puro, sem nenhum alvo.', 'Há um alvo (a próxima palavra); ele só não foi dado por pessoas.'],
    ],
    'É o exemplo da aula para auto-supervisionado.'),
  vf('u5.paradigmas', 2, 'Classifique:', [
    ['Um robô aprendendo a andar por tentativa e recompensa é aprendizado por reforço.', true, 'Agente + ação + recompensa.'],
    ['Regras de associação ("quem compra pão compra leite") são supervisionadas.', false, 'Não há rótulo; são não supervisionadas.'],
    ['Semi-supervisionado usa poucos rótulos e muitos dados sem rótulo.', true, 'Definição da aula.'],
    ['Classificação prevê um valor contínuo.', false, 'Classificação prevê classe; regressão prevê número.'],
  ]),

  // ── U5 · Tipos de modelo ─────────────────────────────────────────
  esc('u5.modelos', 1, 'O KNN é um modelo:',
    'Baseado em instâncias (lazy).',
    [
      ['Simbólico.', 'Simbólicos são regras e árvores.'],
      ['Probabilístico.', 'O probabilístico da matéria é o Naive Bayes.'],
      ['Matemático, com pesos treinados.', 'O KNN não ajusta parâmetros; guarda os exemplos.'],
    ],
    'Guarda os exemplos e compara na hora de prever.'),
  esc('u5.modelos', 2, 'Qual a diferença entre modelos lazy e eager?',
    'Lazy quase não treina e é lento para prever; eager faz o trabalho no treino e prevê rápido.',
    [
      ['Lazy é menos preciso que eager.', 'A diferença é quando o trabalho acontece, não a precisão.'],
      ['Eager guarda todos os exemplos.', 'Quem guarda os exemplos é o lazy (KNN).'],
    ],
    'KNN é lazy; árvore, Naive Bayes e redes são eager.'),
  vf('u5.modelos', 2, 'Classifique cada modelo:', [
    ['Árvore de decisão é simbólica.', true, 'Representa o conhecimento como regras.'],
    ['Regressão linear é matemática/estatística.', true, 'Equação com parâmetros.'],
    ['Naive Bayes é baseado em instâncias.', false, 'É probabilístico.'],
    ['Redes neurais são simbólicas.', false, 'São matemáticas: pesos e funções.'],
  ]),

  // ── U5 · Under × overfitting ─────────────────────────────────────
  esc('u5.fitting', 1, 'Um modelo tem 99% de acerto no treino e 60% no teste. Isso é:',
    'Overfitting.',
    [
      ['Underfitting.', 'Underfitting vai mal no treino também.'],
      ['Generalização boa.', 'A queda grande no teste mostra que ele decorou o treino.'],
    ],
    'Excelente no treino e ruim no teste = memorizou, inclusive o ruído.'),
  esc('u5.fitting', 1, 'Um modelo tem 55% no treino e 52% no teste, num problema em que se espera bem mais. Isso é:',
    'Underfitting.',
    [
      ['Overfitting.', 'Overfitting iria muito bem no treino.'],
      ['Ótima generalização, porque treino e teste estão parecidos.', 'Parecidos, mas os dois ruins: o modelo aprendeu pouco.'],
    ],
    'Ruim no treino e no teste = modelo simples demais.'),
  esc('u5.fitting', 2, 'Durante o treino de uma rede, o erro de validação começa a subir enquanto o de treino continua caindo. O que fazer?',
    'Parar o treino nesse ponto (early stopping).',
    [
      ['Treinar mais épocas.', 'Vai piorar a generalização: o modelo continua decorando.'],
      ['Aumentar a taxa de aprendizado.', 'Não ataca a causa (overfitting).'],
    ],
    'É o sinal clássico de overfitting.', { fonte: 'Lista U5, Q18' }),
  vf('u5.fitting', 3, 'Verdadeiro ou falso?', [
    ['Poda em árvore de decisão combate overfitting.', true, 'Citada na aula 24.'],
    ['KNN com k = 1 tende a overfitting.', true, 'Segue cada ponto, inclusive o ruído.'],
    ['Mais dados de treino costumam reduzir o overfitting.', true, 'Fica mais difícil decorar.'],
    ['Underfitting se resolve deixando o modelo mais simples.', false, 'É o contrário: underfitting pede modelo mais complexo (ou atributos melhores).'],
  ]),
  abe('u5.fitting', 3, 'Explique a diferença entre underfitting e overfitting e como reconhecer cada um.',
    [
      'underfitting: modelo simples demais, erra no treino e no teste',
      'overfitting: modelo complexo demais, acerta o treino (até o ruído) e erra no teste',
      'reconhece comparando o desempenho no treino e no teste/validação',
      'um remédio para cada: mais complexidade para under; poda/early stopping/mais dados para over',
    ],
    'No **underfitting** o modelo é simples demais e não captura o padrão: vai mal no treino e no teste. No **overfitting** ele é complexo demais e decora o treino, inclusive o ruído: vai muito bem no treino e mal no teste. Reconhece-se comparando o erro de treino com o de teste ou validação: os dois altos = under; treino baixo e teste alto = over. Para underfitting, usar um modelo mais expressivo ou atributos melhores; para overfitting, poda (árvores), parada antecipada, modelo mais simples ou mais dados.'),

  // ── U5 · Bias indutivo ───────────────────────────────────────────
  esc('u5.bias', 1, 'Bias indutivo é:',
    'O conjunto de suposições que o algoritmo usa para escolher uma hipótese entre as muitas que explicam os dados.',
    [
      ['Um erro causado por dados desbalanceados.', 'Isso é viés nos dados, outra coisa.'],
      [L`O termo $\beta_0$ da regressão linear.`, 'Esse "bias" é o intercepto; nome igual, ideia diferente.'],
      ['O erro de treino do modelo.', 'Erro de treino é medido; bias indutivo é uma suposição.'],
    ],
    'Sem alguma aposta sobre o mundo, não há como preferir uma hipótese que generalize.'),
  esc('u5.bias', 2, 'Qual é o bias indutivo do KNN?',
    'Exemplos próximos tendem a ter a mesma classe.',
    [
      ['Os atributos são independentes dada a classe.', 'Esse é o do Naive Bayes.'],
      ['Árvores menores são melhores.', 'Esse é o das árvores de decisão.'],
      ['A relação entre entrada e saída é uma reta.', 'Esse é o da regressão linear.'],
    ],
    'Cada algoritmo aposta em algo diferente.'),
  esc('u5.bias', 2, 'O programa da unidade 5 fala em "espaço de hipóteses". O que é?',
    'O conjunto de todos os modelos que o algoritmo consegue representar (todas as retas, todas as árvores…).',
    [
      ['O conjunto de dados de treino.', 'Os dados escolhem uma hipótese dentro do espaço; não são o espaço.'],
      ['As classes possíveis do problema.', 'Classes são a saída; hipóteses são funções da entrada para a saída.'],
    ],
    'O bias indutivo limita esse espaço (regressão linear só considera retas) ou define preferências dentro dele (árvores menores primeiro).'),
  abe('u5.bias', 3, 'O que é bias indutivo em Aprendizado de Máquina? Explique o conceito e discuta como diferentes biases indutivos podem influenciar o desempenho de algoritmos aplicados ao mesmo conjunto de dados.',
    [
      'definição: suposições que o algoritmo usa para generalizar além dos exemplos vistos',
      'é necessário: muitas hipóteses explicam o treino; sem bias não há como escolher',
      'exemplo de bias: KNN (vizinhos próximos têm a mesma classe)',
      'outro exemplo: Naive Bayes (independência) ou árvore (prefere árvores pequenas) ou regressão linear (reta)',
      'no mesmo dataset, vai melhor o algoritmo cuja suposição combina com a estrutura dos dados',
      'exemplo concreto de quando um bias falha (ex.: atributos muito dependentes no Naive Bayes, fronteira não linear numa reta)',
    ],
    'Bias indutivo é o conjunto de suposições que um algoritmo usa para escolher, entre as muitas hipóteses que explicam os dados de treino, aquela que vai usar para prever casos novos. Ele é necessário: sem nenhuma suposição, não há motivo para preferir uma hipótese que generalize. Cada algoritmo tem o seu: o KNN supõe que exemplos próximos têm a mesma classe; o Naive Bayes, que os atributos são independentes dada a classe; a árvore de decisão prefere árvores pequenas; a regressão linear supõe uma relação linear. No mesmo conjunto de dados, o desempenho depende de quanto a suposição combina com a estrutura real: se a fronteira entre classes é curva, uma reta erra (underfitting) e o KNN vai melhor; se os atributos estão em escalas diferentes ou há muitos irrelevantes, a suposição de proximidade do KNN falha; se os atributos são muito dependentes, o Naive Bayes perde qualidade.',
    { fonte: 'P2 2026/1, Q2 (1 ponto)' }),

  // ── U5 · Tipos de atributo ───────────────────────────────────────
  esc('u5.atributos', 1, 'Temperatura em °C é um atributo:',
    'Intervalar.',
    [
      ['Proporcional.', '0 °C não é ausência de temperatura; 20 °C não é "o dobro" de 10 °C.'],
      ['Ordinal.', 'Além da ordem, a diferença entre valores tem significado.'],
      ['Nominal.', 'Tem ordem e diferenças com sentido.'],
    ],
    'Intervalar: a diferença faz sentido, o zero não é absoluto.'),
  esc('u5.atributos', 1, 'Escolaridade (fundamental, médio, superior) é um atributo:',
    'Ordinal.',
    [
      ['Nominal.', 'Há uma ordem natural.'],
      ['Intervalar.', 'A "distância" entre médio e superior não é medida.'],
    ],
    'Categorias com ordem.'),
  esc('u5.atributos', 2, 'Ter ou não um sintoma raro é um atributo:',
    'Binário assimétrico.',
    [
      ['Binário simétrico.', 'Os dois valores não importam igual: o que interessa é ter o sintoma.'],
      ['Ordinal.', 'Só há dois valores e o interesse está no 1.'],
    ],
    'Binário assimétrico pede Jaccard, não SMC, na hora de medir similaridade.'),
  vf('u5.atributos', 2, 'Classifique:', [
    ['Salário é proporcional.', true, 'Zero é ausência de salário; 4 mil reais é o dobro de 2 mil.'],
    ['CEP é numérico, então é proporcional.', false, 'CEP é um código: nominal.'],
    ['Cor do carro é nominal.', true, 'Categorias sem ordem.'],
    ['Nota de satisfação de 1 a 5 é ordinal.', true, 'Tem ordem, mas a distância entre notas não é garantida.'],
  ]),

  // ── U5 · Qualidade dos dados ─────────────────────────────────────
  esc('u5.qualidade', 2, 'Uma equipe vai treinar um modelo de inadimplência e encontrou valores ausentes, registros duplicados, formas diferentes de escrever a mesma informação e erros de digitação. Qual é a alternativa mais adequada?',
    'Problemas de qualidade podem comprometer o aprendizado, então é preciso pré-processar antes do treino.',
    [
      ['Algoritmos modernos aprendem padrões complexos, então o impacto é mínimo.', 'Lixo entra, lixo sai: nenhum algoritmo corrige dado ruim sozinho.'],
      ['Com exemplos suficientes, dá para pular a preparação.', 'Volume não corrige duplicata nem erro de digitação.'],
      ['Duplicados e padronização devem ser tratados depois do treino.', 'O pré-processamento vem antes do treino.'],
      ['Preparar dados só importa no aprendizado supervisionado.', 'Clustering também sofre com dado sujo.'],
    ],
    'Gabarito da prova: (e).', { fonte: 'P2 2026/1, Q3' }),
  esc('u5.qualidade', 1, 'Um registro tem idade = 250 anos. Isso é:',
    'Um outlier, quase certamente erro de digitação.',
    [
      ['Ruído normal da medição.', 'Ruído é pequeno e aleatório; 250 anos é impossível.'],
      ['Um valor faltante.', 'O valor existe; só está errado.'],
    ],
    'Outlier pode ser erro ou um caso raro de verdade; aqui é erro.'),
  vf('u5.qualidade', 2, 'Sobre qualidade dos dados:', [
    ['Imputar a média é uma forma de tratar valores faltantes.', true, 'Assim como mediana, moda, interpolação ou KNN.'],
    ['Todo outlier deve ser removido.', false, 'Alguns são casos raros verdadeiros e informativos (ex.: fraude).'],
    ['Ruído é um erro aleatório na medição.', true, 'Definição da aula.'],
    ['O pré-processamento é feito depois de treinar.', false, 'Vem antes.'],
  ]),
  esc('u5.qualidade', 3, 'A coluna "renda" tem 40% de valores faltando e poucos clientes milionários. Qual imputação simples é a melhor?',
    'Mediana.',
    [
      ['Média.', 'Os milionários puxam a média para cima.'],
      ['Remover todos os registros com faltante.', 'Perderia 40% da base.'],
      ['Moda.', 'Renda é contínua; a moda quase não tem sentido.'],
    ],
    'A mediana resiste a outliers.'),

  // ── U5 · Clustering, associação, Q-learning (não vistos em aula) ─
  esc('u5.clustering', 1, 'Clustering é:',
    'Agrupar exemplos parecidos sem rótulos conhecidos.',
    [
      ['Classificar exemplos em classes já conhecidas.', 'Isso é classificação (supervisionado).'],
      ['Prever um valor numérico.', 'Isso é regressão.'],
    ],
    'Não supervisionado: o algoritmo descobre os grupos.', { fonte: NAO_VISTO }),
  esc('u5.clustering', 2, 'No k-means, a cada passo:',
    'Cada ponto vai para o centróide mais próximo; depois cada centróide vira a média dos seus pontos; repete até estabilizar.',
    [
      ['Os k vizinhos mais próximos votam na classe.', 'Isso é KNN, que é supervisionado.'],
      ['Os grupos são definidos por limiares, como numa árvore.', 'O k-means usa distância aos centróides.'],
    ],
    'O k do k-means é o número de grupos; o do KNN é o número de vizinhos.', { fonte: NAO_VISTO }),
  num('u5.associacao', 2, 'Em 10 compras, 5 têm pão e 4 têm pão e leite. Qual a confiança da regra pão → leite?', 0.8,
    L`\text{conf} = \frac{\text{suporte}(\text{pão} \cap \text{leite})}{\text{suporte}(\text{pão})} = \frac{4}{5} = 0{,}8`,
    'O suporte da regra é 4/10 = 0,4; a confiança é a condicional P(leite | pão).', { fonte: NAO_VISTO }),
  esc('u5.associacao', 1, 'Regras de associação procuram:',
    'Itens que costumam aparecer juntos (ex.: quem compra pão compra leite).',
    [
      ['Uma classe para cada cliente.', 'Isso é classificação.'],
      ['A distância entre clientes.', 'Isso é similaridade (KNN, clustering).'],
    ],
    'Medidas: suporte (frequência) e confiança (condicional).', { fonte: NAO_VISTO }),
  esc('u5.qlearning', 1, 'No aprendizado por reforço, o agente aprende:',
    'Uma política (que ação tomar em cada estado), por tentativa e erro, buscando maximizar a recompensa acumulada.',
    [
      ['A classe de cada exemplo rotulado.', 'Não há rótulos; há recompensas.'],
      ['Grupos de estados parecidos.', 'Isso seria clustering.'],
    ],
    'Agente, ambiente, ação, recompensa.', { fonte: NAO_VISTO }),
  esc('u5.qlearning', 2, 'No Q-learning, o que é Q(s, a)?',
    'A recompensa acumulada esperada ao fazer a ação a no estado s e agir bem dali em diante.',
    [
      ['A recompensa imediata da ação a.', 'Q inclui o futuro, não só o agora.'],
      ['A probabilidade de ir de s para outro estado.', 'Isso é a transição do MDP.'],
    ],
    L`Atualização: $Q(s,a) \leftarrow Q(s,a) + \alpha\,[r + \gamma \max_{a'} Q(s',a') - Q(s,a)]$.`, { fonte: NAO_VISTO }),

  // ── U5 · Similaridade e distância ────────────────────────────────
  esc('u5.proximidade', 1, 'Se a similaridade entre dois objetos é alta, a distância entre eles é:',
    'Baixa.',
    [['Alta.', 'São lados opostos: parecido = perto.'], ['Não há relação.', 'Uma é o inverso da outra.']],
    'Distância também se chama dissimilaridade.'),
  num('u5.proximidade', 1, 'Uma similaridade (entre 0 e 1) vale 0,7. Qual a dissimilaridade?', 0.3, L`1 - 0{,}7 = 0{,}3`, 'Conversão da aula.'),
  vf('u5.proximidade', 2, 'Propriedades de uma distância métrica:', [
    [L`$d(x,y) \ge 0$`, true, 'Não negatividade.'],
    [L`$d(x,y) = d(y,x)$`, true, 'Simetria.'],
    [L`$d(x,z) \le d(x,y) + d(y,z)$`, true, 'Desigualdade triangular.'],
    [L`Pode valer $d(x,y) = 0$ com $x \ne y$.`, false, 'Distância zero só entre o objeto e ele mesmo.'],
  ]),

  // ── U5 · Distâncias ──────────────────────────────────────────────
  num('u5.distancias', 1, 'Distância de Manhattan entre (1, 2) e (4, 6)?', 7, L`|1-4| + |2-6| = 3 + 4 = 7`, 'Soma das diferenças absolutas (p = 1).', { casas: 2 }),
  num('u5.distancias', 2, 'Distância Euclidiana entre (1, 1) e (7, 9)?', 10, L`\sqrt{6^2 + 8^2} = \sqrt{100} = 10`, 'p = 2.', { casas: 2 }),
  num('u5.distancias', 2, 'Distância com p → ∞ (Chebyshev) entre (1, 5, 2) e (4, 1, 3)?', 4, L`\max(3, 4, 1) = 4`, 'A maior diferença entre coordenadas.', { casas: 2 }),
  esc('u5.distancias', 2, 'Por que normalizar os atributos antes de calcular distâncias?',
    'Porque um atributo de escala grande (salário) dominaria um de escala pequena (idade).',
    [
      ['Para a distância ficar sempre entre 0 e 1.', 'Pode ser efeito colateral, mas o objetivo é equilibrar os atributos.'],
      ['Porque a Euclidiana não aceita números grandes.', 'Aceita; o problema é o peso desigual.'],
    ],
    'Re-escalar para 0–1 ou padronizar (média 0, desvio 1).'),
  esc('u5.distancias', 3, 'O que acontece quando o p da Minkowski aumenta?',
    'A maior diferença entre coordenadas pesa cada vez mais, até ser a única que conta (p → ∞).',
    [
      ['Todas as coordenadas passam a pesar igual.', 'É o contrário: a maior domina.'],
      ['A distância aumenta sempre.', 'Ela diminui ou se mantém: Manhattan ≥ Euclidiana ≥ Chebyshev.'],
    ],
    'A(1,2)–B(4,6): Manhattan 7, Euclidiana 5, p = 3 ≈ 4,498, p = ∞ = 4.'),

  // ── U5 · SMC × Jaccard ───────────────────────────────────────────
  num('u5.binarios', 2, 'x = 1 0 0 1 1 e y = 1 1 0 0 1. Quanto vale o SMC?', 0.6,
    L`m_{11} = 2,\ m_{00} = 1,\ m_{10} = 1,\ m_{01} = 1 \Rightarrow \frac{2 + 1}{5} = 0{,}6`, 'Conta todas as concordâncias, inclusive 0-0.'),
  num('u5.binarios', 2, 'x = 1 0 0 1 1 e y = 1 1 0 0 1. Quanto vale o Jaccard?', 0.5,
    L`\frac{m_{11}}{m_{01} + m_{10} + m_{11}} = \frac{2}{1 + 1 + 2} = 0{,}5`, 'Ignora as posições 0-0.'),
  esc('u5.binarios', 2, 'Para comparar clientes pelos produtos que compraram num catálogo de 5.000 itens, qual coeficiente usar?',
    'Jaccard, porque ignora os produtos que nenhum dos dois comprou.',
    [
      ['SMC, porque usa toda a informação.', 'Os milhares de 0-0 fariam quaisquer dois clientes parecerem iguais.'],
      ['Tanto faz, os dois dão o mesmo resultado.', 'Só dão igual se não houver 0-0.'],
    ],
    'Atributo binário assimétrico → Jaccard. É a justificativa da P2, Q5b.', { fonte: 'P2 2026/1, Q5b (adaptada)' }),
  esc('u5.binarios', 3, 'Entre dois vetores binários, SMC = 0,9 e Jaccard = 0. O que isso diz?',
    'Eles concordam quase só nos zeros: não têm nenhum 1 em comum.',
    [
      ['São quase idênticos.', 'Só se os zeros forem informativos; Jaccard = 0 mostra que não compartilham nenhum 1.'],
      ['Houve erro de conta: os dois deveriam ser próximos.', 'Podem divergir muito; é exatamente o exemplo da aula (SMC 0,7, Jaccard 0).'],
    ],
    L`$m_{11} = 0$ zera o Jaccard; muitos $m_{00}$ inflam o SMC.`),

  // ── U5 · KNN ─────────────────────────────────────────────────────
  esc('u5.knn', 1, 'Do que o KNN precisa para classificar um exemplo novo?',
    'Base de treino, uma medida de distância e o valor de k.',
    [
      ['Pesos treinados por gradiente descendente.', 'O KNN não treina pesos.'],
      ['Uma árvore construída antes.', 'Não há modelo construído: é lazy.'],
    ],
    'Calcula a distância a todos, pega os k mais próximos e vota.'),
  esc('u5.knn', 2, 'Usar k = 1 no KNN tende a:',
    'Overfitting: a decisão segue cada ponto, inclusive o ruído.',
    [
      ['Underfitting.', 'Com k = 1 o modelo é flexível demais, não rígido.'],
      ['Não mudar nada.', 'k é o principal hiperparâmetro do KNN.'],
    ],
    'k pequeno = sensível a ruído; k grande demais = underfitting.'),
  esc('u5.knn', 2, 'Se k for igual ao número de exemplos de treino, o KNN:',
    'Prevê sempre a classe majoritária: underfitting.',
    [
      ['Acerta tudo.', 'Todo exemplo novo recebe o mesmo voto.'],
      ['Vira um Naive Bayes.', 'Não há relação.'],
    ],
    'Olhar todo mundo é o mesmo que não olhar a vizinhança.'),
  vf('u5.knn', 2, 'Sobre o KNN:', [
    ['k deve ser igual ao número de classes.', false, 'k não tem relação com o número de classes (lista 5, Q5).'],
    ['É um algoritmo lazy.', true, 'Não constrói modelo.'],
    ['Prever numa base grande é caro.', true, 'Calcula a distância para todos os exemplos.'],
    ['Não é afetado pela escala dos atributos.', false, 'É muito afetado: normalize antes.'],
  ]),
  esc('u5.knn', 3, 'Distâncias do ponto novo: A(+) 1,0; B(−) 1,5; C(+) 2,0; D(−) 2,2; E(−) 2,5. Quais as classes previstas com k = 3 e com k = 5 (voto simples)?',
    '+ com k = 3 e − com k = 5.',
    [
      ['+ nos dois casos.', 'Com k = 5 entram D e E: 2 votos + contra 3 votos −.'],
      ['− nos dois casos.', 'Com k = 3: A e C são +, só B é −.'],
      ['− com k = 3 e + com k = 5.', 'Invertido.'],
    ],
    'Mudar k muda a resposta: por isso k se escolhe por validação.'),
  abe('u5.knn', 3, 'O KNN é conhecido pela simplicidade, mas tem limitações. Explique as limitações, discutindo como a escolha de k e os dados utilizados influenciam o desempenho.',
    [
      'custo alto para prever: lazy, compara com todos os exemplos',
      'sensível à escala dos atributos → normalizar',
      'sensível a atributos irrelevantes e à maldição da dimensionalidade',
      'sensível à medida de distância escolhida',
      'k pequeno → sensível a ruído/outliers (overfitting)',
      'k grande → fronteira suave demais, puxa para a classe majoritária (underfitting)',
      'k é escolhido por validação (e ímpar evita empate com 2 classes)',
    ],
    'O KNN não constrói modelo (é lazy): para cada previsão calcula a distância a todos os exemplos, o que fica caro em bases grandes. Depende muito dos dados: atributos em escalas diferentes distorcem a distância (precisa normalizar), atributos irrelevantes atrapalham, e em muitas dimensões todas as distâncias ficam parecidas (maldição da dimensionalidade). A medida de distância também muda o resultado. Quanto ao k: k pequeno (k = 1) segue cada ponto e fica sensível a ruído e outliers, o que é overfitting; k grande demais olha pontos distantes e tende à classe majoritária, o que é underfitting. O k deve ser escolhido por validação, e um k ímpar evita empate com duas classes.',
    { fonte: 'P2 2026/1, Q4 (1 ponto)' }),

  // ── U5 · Árvores ─────────────────────────────────────────────────
  esc('u5.arvore', 1, 'Numa árvore de decisão, as folhas:',
    'Dão a classe (ou o valor, na regressão).',
    [
      ['Testam um atributo.', 'Isso são os nós internos.'],
      ['Guardam os exemplos de treino para comparar depois.', 'Isso lembra o KNN.'],
    ],
    'Cada caminho da raiz a uma folha é uma regra "se… então".'),
  vf('u5.arvore', 2, 'Sobre árvores de decisão:', [
    ['Cada caminho da raiz a uma folha é uma regra se… então.', true, 'Por isso são fáceis de interpretar.'],
    ['Só servem para classificação.', false, 'Também fazem regressão.'],
    ['Uma árvore muito profunda tende a overfitting.', true, 'Daí a poda.'],
    ['Achar a árvore ótima é fácil, por isso se testa todas.', false, 'É NP-difícil: usam-se heurísticas gulosas.'],
  ]),
  esc('u5.arvore', 2, 'Qual vantagem das árvores de decisão a aula destaca?',
    'São fáceis de interpretar e explicar.',
    [
      ['Nunca sofrem overfitting.', 'Sofrem, se ficarem profundas.'],
      ['Não dependem da qualidade dos dados.', 'A aula lista isso como limitação.'],
    ],
    'Também capturam relações não lineares.', { fonte: 'aula 24' }),

  // ── U5 · Hunt ────────────────────────────────────────────────────
  esc('u5.hunt', 1, 'Quando o algoritmo de Hunt transforma um nó em folha?',
    'Quando todos os exemplos do nó são da mesma classe.',
    [
      ['Quando o nó tem exatamente 2 exemplos.', 'O critério é pureza, não tamanho.'],
      ['Depois de 3 níveis.', 'Não há profundidade fixa no algoritmo básico.'],
    ],
    'Nó puro = folha; senão, divide de novo.'),
  esc('u5.hunt', 2, 'A estratégia do algoritmo de Hunt é:',
    'Gulosa e de cima para baixo: escolhe a melhor divisão agora e não volta atrás.',
    [
      ['Exaustiva: testa todas as árvores possíveis.', 'Inviável; o problema é NP-difícil.'],
      ['De baixo para cima, juntando folhas.', 'Hunt começa na raiz e divide.'],
    ],
    'Por isso pode não achar a árvore ótima.'),
  esc('u5.hunt', 2, 'Como dividir pelo atributo contínuo "idade"?',
    'Por um limiar, ex.: idade ≤ 30 e idade > 30.',
    [
      ['Um ramo para cada idade distinta.', 'Gera ramos demais e não generaliza.'],
      ['Não dá: árvores só usam atributos categóricos.', 'Usam contínuos com limiares.'],
    ],
    'Testam-se vários limiares e escolhe-se o de menor Gini ou maior ganho.'),

  // ── U5 · Gini ────────────────────────────────────────────────────
  num('u5.gini', 1, 'Gini de um nó com 5 exemplos de uma classe e 5 de outra?', 0.5, L`1 - (0{,}5^2 + 0{,}5^2) = 0{,}5`, 'Máximo para 2 classes.'),
  num('u5.gini', 2, 'Gini de um nó com 3 exemplos da classe C1 e 1 da C2?', 0.375, L`1 - (0{,}75^2 + 0{,}25^2) = 1 - 0{,}625 = 0{,}375`, 'Proporções ao quadrado, somadas, menos de 1.'),
  num('u5.gini', 3, 'Nó pai (6, 6). A divisão gera os filhos (4, 0) e (2, 6). Qual o Gini da divisão?', 0.25,
    L`\text{Gini}(4,0) = 0 \quad \text{Gini}(2,6) = 1 - (0{,}25^2 + 0{,}75^2) = 0{,}375 \quad \tfrac{4}{12} \cdot 0 + \tfrac{8}{12} \cdot 0{,}375 = 0{,}25`,
    'Média dos filhos ponderada pelo tamanho. Caiu de 0,5 para 0,25: boa divisão.'),
  esc('u5.gini', 2, 'Entre duas divisões possíveis, qual a árvore escolhe?',
    'A de menor Gini da divisão.',
    [
      ['A de maior Gini.', 'Gini mede impureza: quanto menor, mais puros os filhos.'],
      ['A que gera mais filhos.', 'O critério é pureza, não número de ramos.'],
    ],
    'Na P2, Q6: B (0,3624) vence A (0,3844).'),
  num('u5.gini', 2, 'Qual o valor máximo do Gini com 3 classes?', 2 / 3, L`1 - \tfrac{1}{c} = 1 - \tfrac13 \approx 0{,}667`, 'Atingido quando as 3 classes estão em partes iguais.'),

  // ── U5 · Entropia ────────────────────────────────────────────────
  num('u5.entropia', 1, 'Entropia de um nó com 4 exemplos de cada classe?', 1, L`-2 \cdot 0{,}5 \log_2 0{,}5 = 1`, 'Meio a meio: máximo com 2 classes.'),
  num('u5.entropia', 2, 'Entropia de um nó com 3 exemplos de uma classe e 1 de outra?', -(0.75 * Math.log2(0.75) + 0.25 * Math.log2(0.25)),
    L`-(0{,}75 \log_2 0{,}75 + 0{,}25 \log_2 0{,}25) = 0{,}311 + 0{,}5 \approx 0{,}811`, 'Use $\\log_2$.'),
  num('u5.entropia', 3, 'Pai (4, 4). Um atributo divide em (3, 1) e (1, 3). Qual o ganho de informação?', 1 + (0.75 * Math.log2(0.75) + 0.25 * Math.log2(0.25)),
    L`1 - \left(\tfrac48 \cdot 0{,}811 + \tfrac48 \cdot 0{,}811\right) \approx 0{,}189`, 'Entropia do pai menos a média ponderada dos filhos.'),
  esc('u5.entropia', 2, 'Usando entropia, qual atributo a árvore escolhe?',
    'O de maior ganho de informação.',
    [
      ['O de maior entropia nos filhos.', 'Entropia alta = mais mistura, o contrário do que se quer.'],
      ['O de menor ganho.', 'Ganho é a redução de incerteza: quanto maior, melhor.'],
    ],
    'Com Gini escolhe-se o menor; com ganho, o maior. Cuidado para não inverter.'),
  esc('u5.entropia', 3, 'Por que o atributo "ID do cliente" teria ganho de informação máximo e mesmo assim seria péssimo?',
    'Cada filho fica com um exemplo só (puro), mas a regra não generaliza para clientes novos.',
    [
      ['Porque IDs têm entropia zero.', 'São os filhos que ficam com entropia zero, por terem um exemplo cada.'],
      ['Porque o ganho de informação não aceita números.', 'O problema é a quantidade de valores, não o tipo.'],
    ],
    'O ganho favorece atributos com muitos valores; a razão de ganho corrige isso (fora dos slides).'),

  // ── U5 · Treino e teste ──────────────────────────────────────────
  esc('u5.treino-teste', 1, 'Para que serve o conjunto de teste?',
    'Medir a generalização em dados que o modelo nunca viu.',
    [
      ['Ajustar os pesos do modelo.', 'Isso é o treino.'],
      ['Escolher hiperparâmetros.', 'Isso é a validação; o teste não pode influenciar o ajuste.'],
    ],
    'Ex.: 70/30 no E3.'),
  num('u5.treino-teste', 1, 'Base de 1.000 exemplos, divisão 70/30. Quantos exemplos ficam no teste?', 300, L`0{,}3 \cdot 1000 = 300`, '70% treino, 30% teste.', { casas: 0 }),
  esc('u5.treino-teste', 2, 'Escolher o k do KNN olhando a acurácia no conjunto de teste é:',
    'Um erro: o teste passa a participar do ajuste e deixa de medir a generalização. Use validação.',
    [
      ['O jeito certo de escolher k.', 'O teste fica "contaminado" e a acurácia final sai otimista.'],
      ['Indiferente, porque k não é um peso.', 'Hiperparâmetro também é ajuste.'],
    ],
    'Treino ajusta, validação escolhe, teste só mede no fim.'),
  esc('u5.treino-teste', 2, 'Um modelo acertou 100% no treino. Isso garante bom desempenho em dados novos?',
    'Não: pode ser overfitting; só o teste mostra a generalização.',
    [['Sim: se acertou tudo, aprendeu.', 'Pode ter decorado.'], ['Sim, se o treino for grande.', 'Ajuda, mas não garante.']],
    'Lista 5, Q15.', { fonte: 'Lista U5, Q15' }),
  abe('u5.treino-teste', 3, 'No trabalho final, seu grupo comparou modelos com diferentes hiperparâmetros. Escolha um modelo (exceto KNN) e responda: qual modelo e dataset; um hiperparâmetro alterado; como ele afetou os resultados (métricas, overfitting, underfitting, tempo); e o que você mudaria hoje.',
    [
      'nome do modelo e do dataset do trabalho',
      'um hiperparâmetro concreto (ex.: profundidade máxima da árvore, número de camadas/neurônios, taxa de aprendizado)',
      'efeito com números: acurácia/F1 de treino e de teste antes e depois',
      'leitura do efeito: aumentou ou reduziu overfitting/underfitting, ou o tempo',
      'o que mudaria hoje, com justificativa (ex.: validação cruzada, normalizar, outra métrica)',
    ],
    'Esta resposta só você tem: é sobre o seu trabalho. Escreva agora, com os números reais, para não depender de memória na prova. Exemplo de estrutura: "Árvore de decisão no dataset X. Variamos a profundidade máxima de 3 a 15. Com 3, treino 78% e teste 76% (underfitting); com 15, treino 100% e teste 71% (overfitting); o melhor foi 6, com 84% e 82%. Hoje eu escolheria a profundidade por validação cruzada em vez de olhar o teste."',
    { fonte: 'P2 2026/1, Q8 (2 pontos)' }),

  // ── U5 · Métricas ────────────────────────────────────────────────
  num('u5.metricas', 2, 'VP = 40, FN = 10, FP = 20, VN = 130. Qual a sensibilidade (recall)?', 0.8, L`\frac{40}{40 + 10} = 0{,}8`, 'Dos positivos reais, quantos achei.'),
  num('u5.metricas', 2, 'VP = 40, FN = 10, FP = 20, VN = 130. Qual a precisão?', 40 / 60, L`\frac{40}{40 + 20} \approx 0{,}667`, 'Dos que eu disse positivos, quantos eram.'),
  num('u5.metricas', 3, 'VP = 40, FN = 10, FP = 20, VN = 130. Qual o F1?', (2 * (40 / 60) * 0.8) / (40 / 60 + 0.8),
    L`2 \cdot \frac{0{,}667 \cdot 0{,}8}{0{,}667 + 0{,}8} \approx 0{,}727`, 'Média harmônica de precisão e sensibilidade.'),
  esc('u5.metricas', 2, 'Num exame de câncer, qual métrica se prioriza?',
    'Sensibilidade: não deixar doente passar.',
    [['Precisão.', 'Um falso positivo vai para outro exame; um falso negativo fica sem tratamento.'], ['Acurácia.', 'Engana quando a doença é rara.']],
    'Custo do falso negativo é alto.'),
  esc('u5.metricas', 2, 'Num filtro de spam, qual métrica se prioriza?',
    'Precisão: não mandar e-mail bom para o spam.',
    [['Sensibilidade.', 'Deixar passar um spam incomoda menos que perder um e-mail importante.'], ['Especificidade sozinha.', 'Ajuda, mas a aula cita precisão.']],
    'Custo do falso positivo é alto.'),
  num('u5.metricas', 3, 'Numa base com 1% de positivos, um modelo responde sempre "negativo". Qual a sensibilidade dele?', 0, L`\frac{VP}{VP + FN} = \frac{0}{0 + FN} = 0`,
    'Acurácia de 99% e sensibilidade 0: por isso acurácia sozinha engana.', { casas: 2 }),

  // ── U5 · Regressão ───────────────────────────────────────────────
  esc('u5.regressao', 1, 'A regressão logística é usada para:',
    'Classificação: prevê a probabilidade de uma classe.',
    [['Prever valores contínuos, como salário.', 'Isso é a linear.'], ['Agrupar dados.', 'Isso é clustering.']],
    'O nome engana (lista 5, Q13 e Q16).'),
  num('u5.regressao', 2, 'Quanto vale a sigmoide em z = 0?', 0.5, L`\sigma(0) = \frac{1}{1 + e^0} = \frac12`, 'Ponto de corte usual entre as classes.'),
  num('u5.regressao', 2, 'Um modelo linear é f(x) = 2 + 3x. Qual a previsão para x = 4?', 14, L`2 + 3 \cdot 4 = 14`, '$\\beta_0 = 2$, $\\beta_1 = 3$.', { casas: 2 }),
  vf('u5.regressao', 2, 'Sobre regressão:', [
    ['A linear prevê um valor contínuo.', true, 'Ex.: preço.'],
    ['A logística devolve um número entre 0 e 1.', true, 'Por causa da sigmoide.'],
    [L`Os $\beta$ são escolhidos para minimizar o erro.`, true, 'Ex.: soma dos quadrados dos resíduos.'],
    ['A logística prevê salário.', false, 'Salário é contínuo: linear.'],
  ]),

  // ── U5 · Gradiente ───────────────────────────────────────────────
  esc('u5.gradiente', 2, 'No treino, o erro oscila e não converge. A causa mais provável é:',
    'Taxa de aprendizado alta demais.',
    [['Taxa de aprendizado baixa demais.', 'Baixa demais deixa lento, mas não oscila.'], ['Poucos atributos.', 'Não explica a oscilação.']],
    'Os passos passam do mínimo de um lado para o outro.', { fonte: 'Lista U5, Q14' }),
  num('u5.gradiente', 2, L`$\theta = 2$, $\eta = 0{,}1$ e o gradiente vale 4. Qual o novo $\theta$?`, 1.6, L`2 - 0{,}1 \cdot 4 = 1{,}6`, 'Anda contra o gradiente.'),
  esc('u5.gradiente', 1, L`Por que há um sinal de menos em $\theta \leftarrow \theta - \eta \nabla J$?`,
    'Para andar contra o gradiente, na direção em que o custo diminui.',
    [['Para o custo aumentar.', 'O gradiente aponta para onde o custo sobe; queremos descer.'], ['É só convenção, tanto faz.', 'Com +, o custo subiria.']],
    'Descer a montanha.'),
  vf('u5.gradiente', 3, 'Sobre o gradiente descendente:', [
    ['A versão estocástica usa um exemplo por vez.', true, 'Atualiza a cada exemplo.'],
    ['O mini-batch usa todo o conjunto a cada passo.', false, 'Isso é o "em lote"; mini-batch usa pedaços.'],
    ['Uma taxa pequena demais converge devagar.', true, 'Passos minúsculos.'],
    ['Sempre encontra o mínimo global.', false, 'Pode parar num mínimo local.'],
  ]),

  // ── U5 · Redes neurais ───────────────────────────────────────────
  esc('u5.redes-neurais', 1, 'O que um neurônio artificial calcula?',
    'Uma soma ponderada das entradas, passada por uma função de ativação.',
    [['A distância até os vizinhos.', 'Isso é KNN.'], ['A probabilidade de cada classe por contagem.', 'Isso é Naive Bayes.']],
    'Os pesos são o que a rede aprende.'),
  esc('u5.redes-neurais', 2, 'Qual a ordem do ciclo de treino de uma rede neural?',
    'Forward pass → loss → backpropagation → gradiente descendente.',
    [
      ['Backpropagation → forward pass → loss → gradiente.', 'Sem saída calculada não há erro para propagar.'],
      ['Loss → forward pass → gradiente → backpropagation.', 'O gradiente descendente usa o que o backprop calculou; vem depois.'],
    ],
    'Calcula a saída, mede o erro, calcula o gradiente de cada peso, atualiza os pesos.'),
  esc('u5.redes-neurais', 2, 'O que o backpropagation calcula?',
    'O gradiente do erro em relação a cada peso, da saída para a entrada, pela regra da cadeia.',
    [
      ['A saída da rede.', 'Isso é o forward pass.'],
      ['Os novos pesos diretamente.', 'Quem atualiza é o gradiente descendente, usando o gradiente do backprop.'],
    ],
    'Backprop responde "quanto cada peso contribuiu para o erro".'),
  abe('u5.redes-neurais', 3, 'Uma rede neural multicamadas para reconhecimento facial ajusta os pesos após cada previsão para reduzir o erro. Explique o papel do backpropagation nesse processo e em que contexto ele é usado.',
    [
      'depois do forward pass, a loss mede o erro da previsão',
      'backprop calcula o gradiente do erro em relação a cada peso',
      'faz isso da saída para a entrada, camada por camada, pela regra da cadeia',
      'o gradiente descendente usa esses gradientes para atualizar os pesos',
      'contexto: treino de redes multicamadas, em aprendizado supervisionado (há saída esperada)',
    ],
    'Na fase de treino, a rede faz o forward pass, calcula a saída e a função de perda mede o erro em relação à resposta esperada. O **backpropagation** calcula quanto cada peso contribuiu para esse erro: o gradiente da perda em relação a cada peso, começando pela camada de saída e voltando camada por camada pela regra da cadeia. Com esses gradientes, o gradiente descendente atualiza os pesos na direção que reduz o erro. Ele é usado no **treinamento de redes neurais multicamadas**, em **aprendizado supervisionado**, porque precisa da saída correta para calcular o erro.',
    { fonte: 'P2 2026/1, Q7 (1 ponto)' }),
  abe('u5.redes-neurais', 3, 'Uma rede multicamadas fez uma previsão incorreta. Descreva o fluxo de aprendizagem a partir desse erro, explicando o papel do forward pass, da loss function, do backpropagation e do gradiente descendente.',
    [
      'forward pass: a entrada passa pelas camadas e gera a previsão',
      'loss: compara a previsão com o valor real e dá um número de erro',
      'backpropagation: calcula o gradiente da loss para cada peso, da saída para a entrada',
      'gradiente descendente: atualiza cada peso no sentido contrário ao gradiente, com a taxa de aprendizado',
      'o ciclo se repete até o erro ficar pequeno (ou a validação parar de melhorar)',
    ],
    L`1) **Forward pass**: a observação entra na rede, cada neurônio faz soma ponderada + ativação, e a última camada produz a previsão. 2) **Loss function**: compara a previsão com o valor real e transforma o erro num número (ex.: erro quadrático ou entropia cruzada). 3) **Backpropagation**: usando a regra da cadeia, calcula o gradiente da loss em relação a cada peso, começando pela saída e voltando até a primeira camada. 4) **Gradiente descendente**: atualiza cada peso, $w \leftarrow w - \eta\,\partial L / \partial w$, na direção que diminui o erro. O ciclo se repete com os próximos exemplos ou épocas até a loss ficar pequena ou a validação parar de melhorar.`,
    { fonte: 'Lista U5, Q20' }),
  // ── Nível 3 que faltavam (auditoria de cobertura) ─────────────────
  // Ficam no fim do banco para não mudar o id das questões antigas (o histórico usa o id).
  esc('u4.incerteza', 3, 'Um robô aspirador usa A* num mapa da casa. Na prática, as rodas às vezes patinam e o sensor de obstáculo às vezes falha. Por que o A* sozinho deixa de ser suficiente?',
    'O A* supõe ações determinísticas e estado conhecido; com ação que falha e sensor que erra, o robô não sabe exatamente onde está nem onde a ação vai levar, então precisa raciocinar com graus de crença.',
    [
      ['Porque a heurística deixa de ser admissível.', 'Admissibilidade é sobre a estimativa de custo, não sobre sensor ou ação incertos.'],
      ['Porque o A* não funciona em mapas com obstáculos.', 'Funciona: obstáculo é só uma aresta a menos no grafo.'],
      ['Porque o mapa da casa é grande demais para o A*.', 'O problema não é tamanho, é incerteza.'],
    ],
    'As quatro suposições da IA clássica que a aula lista: estado conhecido, ação determinística, ambiente observável e consequências previsíveis. Aqui caem duas.'),
  vf('u4.incerteza', 3, 'Um agente acredita 0,8 que a porta está aberta. Avalie:', [
    ['Para a IA probabilística, ele acredita; ele não sabe que a porta está aberta.', true, 'Crença entre 0 e 1, não verdadeiro/falso.'],
    ['Se ele olhar e vir a porta aberta, a crença sobe; um sensor que erra impede que ela vá a 1 com uma leitura só.', true, 'A evidência atualiza a crença, mas o sensor também é incerto.'],
    ['Crença 0,8 quer dizer que a porta fica aberta 80% do tempo.', false, 'É o grau de crença do agente agora, dado o que ele sabe; não uma frequência da porta.'],
    ['Na IA clássica, esse agente trataria "porta aberta" como verdadeiro ou falso.', true, 'É exatamente a diferença da aula.'],
  ]),

  num('u4.redes-bayes', 3, L`Rede Chuva → Grama molhada. $P(C) = 0{,}2$, $P(G \mid C) = 0{,}9$ e $P(G \mid \neg C) = 0{,}1$. A grama está molhada. Qual a probabilidade de ter chovido?`,
    (0.9 * 0.2) / (0.9 * 0.2 + 0.1 * 0.8),
    L`P(C \mid G) = \frac{0{,}9 \cdot 0{,}2}{0{,}9 \cdot 0{,}2 + 0{,}1 \cdot 0{,}8} = \frac{0{,}18}{0{,}26} \approx 0{,}69`,
    'É Bayes numa rede de dois nós: a rede dá P(G | C) na direção da seta, e a consulta pede a direção contrária. O denominador soma os dois jeitos de a grama molhar.',
    { fonte: NAO_VISTO, casas: 2 }),
  num('u4.redes-bayes', 3, 'Cinco variáveis binárias em cadeia: A → B → C → D → E. Quantos números a rede precisa guardar (contando um por linha de tabela, como P(B | A) e P(B | ¬A))?', 9,
    L`A: 1 \quad B, C, D, E: 2 \text{ cada} \quad 1 + 4 \cdot 2 = 9 \qquad \text{(a conjunta completa pediria } 2^5 - 1 = 31\text{)}`,
    'Cada nó só precisa de uma probabilidade para cada combinação dos pais. É por isso que a rede é compacta: com poucos pais por nó, cresce de forma linear, não exponencial.',
    { fonte: NAO_VISTO, casas: 0 }),

  esc('u5.ml', 3, 'Um filtro de spam acertou 100% dos e-mails do treino e 60% dos e-mails novos. O que isso mostra?',
    'O modelo não generalizou: decorou o treino. O número que importa é o dos e-mails novos.',
    [
      ['Está ótimo: 100% no treino prova que ele aprendeu a regra.', 'Acertar o que já viu pode ser só decoreba (overfitting).'],
      ['O problema é falta de regras escritas à mão.', 'Em ML a regra é aprendida; escrever regras é voltar à programação tradicional.'],
      ['60% é aceitável porque o treino é o que conta.', 'É o contrário: o desafio do ML é acertar o que não estava no treino.'],
    ],
    'Generalizar é o desafio central da unidade. A diferença grande entre treino e teste é o sinal clássico de overfitting.'),
  abe('u5.ml', 3, 'Explique a diferença entre programação tradicional e aprendizado de máquina, dê um exemplo em que ML é a melhor escolha e um em que não vale a pena usar.',
    [
      'tradicional: dados + regras → saída (a regra é escrita por alguém)',
      'ML: dados + respostas → modelo; o modelo é aplicado a dados novos',
      'exemplo bom para ML: a regra é difícil de escrever e há muitos exemplos (spam, rosto, cancelamento)',
      'exemplo ruim para ML: a regra é conhecida e exata (imposto por tabela, conversão de unidades)',
      'menciona que o objetivo é generalizar para casos novos',
    ],
    'Na **programação tradicional**, alguém escreve as regras e o programa aplica: dados + regras → saída. No **aprendizado de máquina**, o sistema recebe dados com as respostas certas e descobre a regra sozinho (dados + respostas → modelo); depois, o modelo é usado em dados novos. ML vale a pena quando a regra é difícil de escrever, mas há muitos exemplos, como detectar spam. Não vale quando a regra é conhecida e exata, como calcular imposto por uma tabela de alíquotas: basta programar. O desafio do ML é **generalizar**: acertar casos que não estavam no treino.'),

  esc('u5.paradigmas', 3, 'Um banco tem 1 milhão de transações; só 2 mil foram conferidas por um analista e marcadas como fraude ou não. O modelo é treinado com as 2 mil marcadas **e** com o resto sem marcação. Qual o paradigma?',
    'Semi-supervisionado.',
    [
      ['Supervisionado.', 'Seria, se usasse só as 2 mil rotuladas; aqui usa também as sem rótulo.'],
      ['Não supervisionado.', 'Há rótulos, ainda que poucos.'],
      ['Auto-supervisionado.', 'Lá o rótulo sai do próprio dado (ex.: próxima palavra); aqui o rótulo veio de uma pessoa.'],
    ],
    'Poucos rótulos + muitos dados sem rótulo = semi-supervisionado. A pegadinha é confundir com auto-supervisionado.'),
  vf('u5.paradigmas', 3, 'Avalie:', [
    ['O mesmo problema (ex.: fraude) pode ser atacado como supervisionado ou não supervisionado, dependendo de haver rótulos.', true, 'Sem rótulos, dá para procurar transações "estranhas" (anomalias) sem saber quais são fraude.'],
    ['Se a saída é um número inteiro, como "quantidade de filhos", é classificação.', false, 'Costuma ser tratado como regressão: é uma quantidade, com ordem e distância.'],
    ['No aprendizado por reforço, ninguém diz qual era a ação certa; o agente só recebe recompensa.', true, 'É a diferença para o supervisionado.'],
    ['Clustering precisa saber de antemão quais são os grupos.', false, 'Se soubesse, seria classificação.'],
  ]),

  esc('u5.modelos', 3, 'Um app precisa classificar milhares de pedidos por segundo, e a base de treino tem 10 milhões de exemplos. Por que o KNN é uma má escolha aqui?',
    'Ele é lazy: cada previsão compara o pedido com os exemplos guardados, então prever fica lento.',
    [
      ['Porque o treino do KNN demoraria demais.', 'O KNN quase não treina: só guarda os exemplos. O custo está na hora de prever.'],
      ['Porque o KNN piora com mais dados.', 'Mais exemplos costumam ajudar a acurácia; o problema é o tempo de cada previsão.'],
      ['Porque o KNN é simbólico e difícil de interpretar.', 'O KNN é baseado em instâncias, não simbólico.'],
    ],
    'Lazy: treino barato, previsão cara. Eager (árvore, Naive Bayes, redes): treino caro, previsão rápida.'),
  esc('u5.modelos', 3, 'Um banco precisa explicar ao cliente por que o crédito foi negado. Que tipo de modelo facilita isso?',
    'Simbólico, como uma árvore de decisão: a decisão é uma regra "se… então" que dá para ler.',
    [
      ['Uma rede neural, porque é a mais precisa.', 'Os pesos não viram uma explicação legível; e precisão não é o que se pede.'],
      ['Qualquer um, porque todos explicam a decisão do mesmo jeito.', 'Cada família representa o conhecimento de um jeito; só a simbólica vira regra legível.'],
    ],
    'É a vantagem que a aula 24 destaca para as árvores: fáceis de interpretar e explicar.'),

  esc('u5.atributos', 3, 'Ano de nascimento (1990, 2000, …) é um atributo:',
    'Intervalar.',
    [
      ['Proporcional.', 'Idade é proporcional; ano não: o ano 0 não é "ausência de tempo", e 2000 não é o dobro de 1000.'],
      ['Ordinal.', 'Além da ordem, a diferença (10 anos) tem significado exato.'],
      ['Nominal.', 'Tem ordem e diferença com sentido.'],
    ],
    'Mesma lógica do °C: diferença faz sentido, o zero é convenção. A pegadinha é confundir com idade.'),
  esc('u5.atributos', 3, 'Um analista codificou cor do carro como vermelho = 1, azul = 2, verde = 3 e usou distância euclidiana. Qual é o problema?',
    'Cor é nominal: os números criam uma ordem e distâncias que não existem (verde fica "mais longe" de vermelho do que azul).',
    [
      ['Nenhum: depois de virar número, qualquer distância serve.', 'O número é só um código; a distância entre códigos não significa nada.'],
      ['Só a escala: basta normalizar entre 0 e 1.', 'Normalizar mantém a ordem falsa.'],
      ['Cor deveria ser tratada como ordinal.', 'Cores não têm ordem natural.'],
    ],
    'O tipo do atributo decide a distância. Para nominal, compara-se igual/diferente (ou cada cor vira um atributo binário).'),

  esc('u5.clustering', 3, 'Você rodou o k-means duas vezes nos mesmos dados, com k = 3, e os grupos saíram diferentes. Por quê?',
    'O resultado depende dos centróides iniciais, que são sorteados; o k-means pode parar em soluções diferentes (ótimos locais).',
    [
      ['É erro: o k-means sempre dá o mesmo resultado.', 'Só dá o mesmo se começar dos mesmos centróides.'],
      ['Porque os rótulos dos dados mudaram entre as execuções.', 'Clustering não usa rótulos.'],
      ['Porque k = 3 está errado; com o k certo, o resultado seria sempre igual.', 'Mesmo com um bom k, o início sorteado muda o resultado.'],
    ],
    'Na prática, roda-se várias vezes e fica-se com o agrupamento de menor distância total aos centróides.', { fonte: NAO_VISTO }),

  num('u5.associacao', 3, 'Em 100 compras, 40 têm fralda, 30 têm cerveja e 12 têm as duas. Qual a confiança de **cerveja → fralda**? (atenção à direção)', 0.4,
    L`\text{conf}(\text{cerveja} \to \text{fralda}) = \frac{12}{30} = 0{,}4 \qquad \text{(a outra direção daria } \tfrac{12}{40} = 0{,}3\text{)}`,
    'A confiança divide pelo suporte do lado esquerdo da regra. Trocar a direção muda o resultado: é a mesma armadilha de P(A | B) ≠ P(B | A).',
    { fonte: NAO_VISTO, casas: 2 }),
  esc('u5.associacao', 3, 'A regra pão → café tem confiança 0,8. Mas 85% de todas as compras têm café. A regra é boa?',
    'Não muito: quem compra pão leva café um pouco menos que a média (0,8 < 0,85). A confiança alta vem de café ser comum, não do pão.',
    [
      ['Sim: confiança 0,8 é alta.', 'Só parece. É preciso comparar com a frequência do café sozinho.'],
      ['Sim, porque o suporte do café é alto.', 'Isso explica a confiança alta, mas não mostra relação com o pão.'],
    ],
    L`Essa comparação se chama **lift**: $0{,}8 / 0{,}85 \approx 0{,}94$. Abaixo de 1, o pão não aumenta a chance de café. (Lift vai além do programa.)`, { fonte: NAO_VISTO }),

  num('u5.qlearning', 3, L`$Q(s,a) = 2$, $\alpha = 0{,}5$, $\gamma = 0{,}9$. O agente faz a ação, ganha $r = 1$ e chega em $s'$, onde o maior Q é 4. Qual o novo $Q(s,a)$?`, 3.3,
    L`2 + 0{,}5\,[\,1 + 0{,}9 \cdot 4 - 2\,] = 2 + 0{,}5 \cdot 2{,}6 = 3{,}3`,
    'O termo entre colchetes é a surpresa: quanto a estimativa nova (recompensa + futuro descontado) difere da antiga. A taxa α decide quanto andar nessa direção.',
    { fonte: NAO_VISTO, casas: 2 }),
  esc('u5.qlearning', 3, 'Desde o primeiro passo, o agente sempre escolhe a ação de maior Q. Qual o risco?',
    'Ele nunca explora: pode ficar preso numa ação razoável e nunca descobrir uma melhor. Por isso se usa ε-greedy (às vezes uma ação aleatória).',
    [
      ['Nenhum: escolher o maior Q é sempre ótimo.', 'Só quando Q já está bem estimado; no começo os valores são chutes.'],
      ['O Q diverge para infinito.', 'Divergir não é o problema aqui; o problema é parar de aprender sobre as outras ações.'],
    ],
    'É o dilema exploração × aproveitamento.', { fonte: NAO_VISTO }),

  esc('u5.proximidade', 3, L`Em uma dimensão, alguém propõe $d(a,b) = (a - b)^2$. Com $x = 0$, $y = 1$ e $z = 2$, que propriedade de métrica falha?`,
    L`Desigualdade triangular: $d(x,z) = 4 > d(x,y) + d(y,z) = 1 + 1$.`,
    [
      ['Simetria.', L`$(a-b)^2 = (b-a)^2$: é simétrica.`],
      ['Não negatividade.', 'Um quadrado nunca é negativo.'],
      [L`$d(x,y) = 0 \iff x = y$.`, 'O quadrado só zera quando a = b.'],
    ],
    'Por isso a distância euclidiana tira a raiz no fim: o quadrado da distância não é uma métrica.'),
  esc('u5.proximidade', 3, 'A distância euclidiana entre dois clientes deu 7. Alguém calcula a similaridade como 1 − 7 = −6. Qual o erro?',
    'A conversão "1 − valor" só vale para medidas entre 0 e 1; a distância teria de ser normalizada antes.',
    [
      ['Nenhum: similaridade negativa quer dizer clientes opostos.', 'Nessa conversão, o resultado deveria ficar entre 0 e 1.'],
      ['Deveria ser 7 − 1 = 6.', 'Continua sem escala; e distância maior daria similaridade maior, o que é o contrário.'],
    ],
    'Na aula: dissimilaridade = 1 − similaridade quando a similaridade está entre 0 e 1.'),

  esc('u5.arvore', 3, 'Uma árvore com 30 níveis teve 100% de acerto no treino e 65% no teste. O que fazer?',
    'Podar ou limitar a profundidade: a árvore decorou o treino (overfitting).',
    [
      ['Aumentar a profundidade para acertar também o teste.', 'Piora: mais níveis = mais decoreba.'],
      ['Normalizar os atributos.', 'Árvores não dependem da escala dos atributos; isso não muda nada.'],
      ['Trocar Gini por entropia.', 'Os dois costumam escolher divisões parecidas; não resolvem a profundidade.'],
    ],
    'A limitação que a aula 24 cita: overfitting se a árvore for muito profunda, daí a poda.'),
  abe('u5.arvore', 3, 'Por que não se encontra a árvore de decisão ótima testando todas as árvores possíveis? O que se faz no lugar, e qual o preço disso?',
    [
      'muitas árvores se ajustam aos mesmos dados; o número delas explode',
      'achar a ótima é NP-difícil (inviável testar todas)',
      'usa-se uma heurística gulosa, de cima para baixo (Hunt)',
      'escolhe a melhor divisão naquele nó (Gini ou ganho de informação) e não volta atrás',
      'preço: pode não achar a árvore ótima, mas é rápido e costuma dar uma boa árvore',
    ],
    'Vários formatos de árvore se ajustam aos mesmos dados, e o número de árvores possíveis cresce de forma explosiva com os atributos. Achar a ótima é **NP-difícil**. Por isso usa-se uma **heurística gulosa, de cima para baixo** (algoritmo de Hunt): em cada nó, escolhe a divisão que mais reduz a impureza (Gini ou entropia) e segue, sem voltar atrás. O preço é que a árvore final **pode não ser a ótima**: uma divisão que parece pior agora poderia levar a uma árvore melhor depois. Em troca, o algoritmo é rápido e costuma dar bons resultados.'),

  esc('u5.hunt', 3, 'Um atributo "ID do cliente" (um valor diferente para cada cliente) aparece como a melhor divisão pelo ganho de informação. Por quê, e o que há de errado?',
    'Cada ramo fica com um cliente só, então todos os filhos ficam puros (ganho máximo); mas a regra não serve para nenhum cliente novo.',
    [
      ['O ganho seria zero, porque ID é nominal.', 'É o contrário: a divisão múltipla por ID deixa tudo puro e dá o maior ganho possível.'],
      ['Não há nada errado: pureza máxima é o objetivo.', 'Pureza no treino com um exemplo por folha é decoreba, não generalização.'],
      ['O Gini não deixaria isso acontecer.', 'O Gini também zera em filhos puros; o problema é da divisão em muitos ramos.'],
    ],
    'Divisões com muitos ramos pequenos favorecem pureza falsa. É overfitting dentro de um único nó.'),
  esc('u5.hunt', 3, 'Um nó tem 4 exemplos com valores iguais em todos os atributos, mas 2 são "sim" e 2 são "não". O que o algoritmo faz?',
    'Nenhuma divisão consegue separá-los, então o nó vira folha com a classe da maioria (no empate, por alguma regra de desempate).',
    [
      ['Divide de novo até ficar puro.', 'Não há atributo que separe exemplos idênticos: dividiria para sempre.'],
      ['Descarta os 4 exemplos.', 'Eles continuam valendo; só não dá para separar.'],
      ['Cria uma folha "sim" e outra "não" no mesmo nó.', 'Uma folha dá uma resposta só.'],
    ],
    'É o caso especial do Hunt: além de "nó puro", ele para quando não há mais como dividir. Mostra que dados com ruído não ficam 100% puros. (Caso clássico do algoritmo; não tenho certeza de que aparece nos slides.)'),

  num('u5.regressao', 3, L`Regressão logística com $z = -3 + 0{,}5x$. Qual a probabilidade prevista para $x = 10$?`, 1 / (1 + Math.exp(-2)),
    L`z = -3 + 0{,}5 \cdot 10 = 2 \qquad \sigma(2) = \frac{1}{1 + e^{-2}} \approx 0{,}88`,
    'Primeiro a parte linear (z), depois a sigmoide. Como z > 0, a probabilidade passa de 0,5: classe positiva.',
    { casas: 2 }),
  num('u5.regressao', 3, L`Regressão logística com $z = -4 + 2x$ e corte em 0,5. A partir de que valor de $x$ o exemplo é classificado como positivo?`, 2,
    L`\sigma(z) \ge 0{,}5 \iff z \ge 0 \iff -4 + 2x \ge 0 \iff x \ge 2`,
    'A fronteira entre as classes é onde z = 0. Não é preciso calcular nenhuma exponencial.',
    { casas: 2 }),
  esc('u5.regressao', 3, 'A regressão logística devolveu 0,7 para um cliente, num modelo de inadimplência. O que isso quer dizer?',
    'O modelo estima 70% de chance de o cliente ser inadimplente; com corte 0,5, ele é classificado como inadimplente.',
    [
      ['O cliente deve 70% do valor do empréstimo.', 'Isso seria ler a saída como valor contínuo, o que é coisa da linear.'],
      ['O modelo acerta 70% das previsões.', 'Isso seria acurácia, que se mede no conjunto de teste, não em um cliente.'],
      ['O cliente está 70% inadimplente.', 'Inadimplência é sim/não; o 0,7 é a probabilidade da classe.'],
    ],
    'Logística → probabilidade de classe. O corte (0,5 por padrão) transforma a probabilidade em classe.'),
]

export const questoesDoTopico = (id: string) => QUESTOES.filter((q) => q.topico === id)
export const questaoPorId = new Map(QUESTOES.map((q) => [q.id, q]))
