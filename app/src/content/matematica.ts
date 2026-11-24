// "Me mostra a conta": mini-aulas de matemática básica.
// Cada aula aparece numa fórmula quando o símbolo dela está na fórmula ou no exemplo.

const L = String.raw

export interface AulaMat {
  id: string
  /** símbolo como aparece na fórmula */
  simbolo: string
  titulo: string
  /** a ideia em uma ou duas frases */
  ideia: string
  /** conta pequena, passo a passo */
  exemplo: { latex: string; nota?: string }[]
  /** quando a aula aparece */
  aparece: RegExp
}

export const AULAS: AulaMat[] = [
  {
    id: 'indice',
    simbolo: L`x_1`,
    titulo: 'Número pequeno embaixo',
    ideia: 'O número pequeno embaixo da letra é só um nome, não é conta. x₁ é "o primeiro x", x₂ é "o segundo x".',
    exemplo: [{ latex: L`x = (2,\ 5,\ 1)`, nota: 'uma lista de três valores' }, { latex: L`x_1 = 2 \qquad x_2 = 5 \qquad x_3 = 1` }],
    aparece: /_\{?[0-9ijk(]/,
  },
  {
    id: 'funcao',
    simbolo: L`f(n)`,
    titulo: 'Letra com parênteses',
    ideia: 'f(n) é o nome de uma conta que depende de n. Para usar, troque o n pelo valor e faça a conta.',
    exemplo: [{ latex: L`f(x) = 2x + 1`, nota: '2x quer dizer 2 vezes x' }, { latex: L`f(3) = 2 \cdot 3 + 1 = 7` }],
    aparece: /(?:^|[^a-z\\])[fghdE]\(/,
  },
  {
    id: 'ordem',
    simbolo: L`2 + 3 \cdot 4`,
    titulo: 'Qual conta fazer primeiro',
    ideia: 'A ordem é sempre: parênteses, depois potências e raízes, depois multiplicação e divisão, e por último soma e subtração.',
    exemplo: [{ latex: L`2 + 3 \cdot 4 = 2 + 12 = 14`, nota: 'e não 5 · 4 = 20' }, { latex: L`(2 + 3) \cdot 4 = 5 \cdot 4 = 20`, nota: 'o parêntese muda a ordem' }],
    aparece: /[+-].*(\\cdot|\^|\\frac)|(\\cdot|\^|\\frac).*[+-]/,
  },
  {
    id: 'multiplicacao',
    simbolo: L`a \cdot b`,
    titulo: 'Ponto no meio',
    ideia: 'O ponto no meio (·) é multiplicação, o mesmo que ×. Letras ou números colados, como 2x ou wh, também são multiplicação.',
    exemplo: [{ latex: L`3 \cdot 4 = 12` }, { latex: L`w \cdot h(n) \text{ com } w = 2,\ h(n) = 5 \;\Rightarrow\; 10` }],
    aparece: /\\cdot/,
  },
  {
    id: 'fracao',
    simbolo: L`\frac{a}{b}`,
    titulo: 'Fração',
    ideia: 'Uma fração é uma divisão: o número de cima dividido pelo de baixo. Quanto maior o de baixo, menor o resultado.',
    exemplo: [{ latex: L`\frac{6}{3} = 6 \div 3 = 2` }, { latex: L`\frac{1}{4} = 0{,}25`, nota: 'dividir 1 em 4 partes' }],
    aparece: /\\t?frac/,
  },
  {
    id: 'decimal',
    simbolo: L`0{,}25`,
    titulo: 'Decimal e porcentagem',
    ideia: 'Probabilidades costumam vir como números entre 0 e 1. Para virar porcentagem, ande a vírgula duas casas para a direita.',
    exemplo: [{ latex: L`0{,}25 = 25\% = \tfrac{1}{4}` }, { latex: L`0{,}905 \approx 90\%`, nota: 'quase sempre' }],
    aparece: /0\{,\}\d|\bP\(/,
  },
  {
    id: 'potencia',
    simbolo: L`a^n`,
    titulo: 'Potência (número pequeno em cima)',
    ideia: 'O número pequeno em cima diz quantas vezes multiplicar o de baixo por ele mesmo. Ao quadrado (²) é multiplicar por ele mesmo uma vez.',
    exemplo: [{ latex: L`2^3 = 2 \cdot 2 \cdot 2 = 8` }, { latex: L`(-3)^2 = (-3)\cdot(-3) = 9`, nota: 'ao quadrado nunca fica negativo' }],
    aparece: /\^(?!\{1\/)/,
  },
  {
    id: 'raiz',
    simbolo: L`\sqrt{a}`,
    titulo: 'Raiz',
    ideia: 'A raiz quadrada desfaz o "ao quadrado": √9 = 3 porque 3 · 3 = 9. Elevar a 1/2 é o mesmo que tirar a raiz quadrada, e elevar a 1/p é a raiz de grau p.',
    exemplo: [{ latex: L`\sqrt{25} = 5 \quad\text{porque}\quad 5 \cdot 5 = 25` }, { latex: L`25^{1/2} = \sqrt{25} = 5` }],
    aparece: /\\sqrt|\^\{1\/[0-9p]\}/,
  },
  {
    id: 'somatorio',
    simbolo: L`\sum`,
    titulo: 'Somatório (Σ)',
    ideia: 'Σ quer dizer "some tudo". O que está embaixo (i = 1) diz onde começa a contar, e o que está em cima (n) diz onde para.',
    exemplo: [{ latex: L`x = (2,\ 5,\ 1)` }, { latex: L`\sum_{i=1}^{3} x_i = x_1 + x_2 + x_3 = 2 + 5 + 1 = 8` }],
    aparece: /\\sum/,
  },
  {
    id: 'produtorio',
    simbolo: L`\prod`,
    titulo: 'Produtório (Π)',
    ideia: 'Π funciona como o Σ, mas multiplica em vez de somar.',
    exemplo: [{ latex: L`\prod_{i=1}^{3} x_i \text{ com } x = (0{,}5,\ 0{,}4,\ 0{,}5)` }, { latex: L`= 0{,}5 \cdot 0{,}4 \cdot 0{,}5 = 0{,}1`, nota: 'multiplicar números menores que 1 sempre diminui' }],
    aparece: /\\prod/,
  },
  {
    id: 'absoluto',
    simbolo: L`|a - b|`,
    titulo: 'Barras: valor absoluto',
    ideia: 'Barras em volta de uma conta tiram o sinal: o resultado fica sempre positivo. É a "distância", sem importar a direção.',
    exemplo: [{ latex: L`|2 - 5| = |-3| = 3` }, { latex: L`|5 - 2| = |3| = 3`, nota: 'dá o mesmo nos dois sentidos' }],
    aparece: /\|[^|]*-[^|]*\|/,
  },
  {
    id: 'tamanho',
    simbolo: L`|S|`,
    titulo: 'Barras em volta de um conjunto',
    ideia: 'Quando o que está entre as barras é um conjunto, |S| quer dizer "quantos elementos S tem".',
    exemplo: [{ latex: L`S = \{A, B, C\} \;\Rightarrow\; |S| = 3` }],
    aparece: /\|S\|/,
  },
  {
    id: 'fatorial',
    simbolo: L`n!`,
    titulo: 'Fatorial (!)',
    ideia: 'n! é multiplicar n por todos os números inteiros abaixo dele até 1. Cresce muito rápido.',
    exemplo: [{ latex: L`4! = 4 \cdot 3 \cdot 2 \cdot 1 = 24` }, { latex: L`10! = 3\,628\,800` }],
    aparece: /!/,
  },
  {
    id: 'cientifica',
    simbolo: L`a \times 10^n`,
    titulo: 'Número gigante (× 10 elevado)',
    ideia: '× 10ⁿ é um jeito curto de escrever números enormes: ande a vírgula n casas para a direita.',
    exemplo: [{ latex: L`7{,}6 \times 10^3 = 7\,600` }, { latex: L`10^{30} = 1 \text{ seguido de 30 zeros}` }],
    aparece: /\\times\s*10\^/,
  },
  {
    id: 'log',
    simbolo: L`\log_2`,
    titulo: 'Logaritmo na base 2',
    ideia: 'log₂ de um número responde à pergunta "2 elevado a quanto dá esse número?". Para números menores que 1, a resposta é negativa. Por isso a entropia tem um sinal de menos na frente: para o total ficar positivo.',
    exemplo: [{ latex: L`\log_2 8 = 3 \quad\text{porque}\quad 2^3 = 8` }, { latex: L`\log_2 1 = 0 \qquad \log_2 0{,}5 = -1` }],
    aparece: /\\log/,
  },
  {
    id: 'euler',
    simbolo: L`e^x`,
    titulo: 'O número e',
    ideia: 'e é um número fixo, mais ou menos 2,718 (como π ≈ 3,14). Elevado a 0 dá 1. Elevado a um número negativo dá algo entre 0 e 1, e quanto mais negativo, mais perto de zero.',
    exemplo: [{ latex: L`e^{0} = 1` }, { latex: L`e^{-1} \approx 0{,}368 \qquad e^{-10} \approx 0{,}00005` }],
    aparece: /(?:^|[^a-z\\])e\^/,
  },
  {
    id: 'desigualdade',
    simbolo: L`\le\ \ge`,
    titulo: 'Menor ou igual, maior ou igual',
    ideia: '≤ é "menor ou igual" e ≥ é "maior ou igual". A boca aberta do sinal fica virada para o lado maior.',
    exemplo: [{ latex: L`3 \le 5 \quad\checkmark \qquad 5 \le 5 \quad\checkmark \qquad 6 \le 5 \quad\times` }],
    aparece: /\\le|\\ge/,
  },
  {
    id: 'condicional',
    simbolo: L`P(A \mid B)`,
    titulo: 'Barra em pé: "dado que"',
    ideia: 'P(A | B) se lê "probabilidade de A dado B": a chance de A quando você já sabe que B aconteceu.',
    exemplo: [{ latex: L`P(\text{rei} \mid \text{copas}) = \tfrac{1}{13}`, nota: 'das 13 cartas de copas, 1 é rei' }],
    aparece: /\\mid/,
  },
  {
    id: 'logica',
    simbolo: L`\neg\ \cap`,
    titulo: 'Não, e',
    ideia: '¬X quer dizer "X não acontece". A ∩ B quer dizer "A e B acontecem ao mesmo tempo".',
    exemplo: [{ latex: L`P(\text{chuva}) = 0{,}3 \;\Rightarrow\; P(\neg\text{chuva}) = 1 - 0{,}3 = 0{,}7` }],
    aparece: /\\neg|\\cap/,
  },
  {
    id: 'proporcional',
    simbolo: L`\propto`,
    titulo: 'Proporcional (∝)',
    ideia: '∝ quer dizer "proporcional a": não é o valor final, mas serve para comparar quem é maior. Para virar probabilidade, divida cada um pela soma de todos.',
    exemplo: [{ latex: L`\text{sim} \propto 6 \qquad \text{não} \propto 2` }, { latex: L`P(\text{sim}) = \tfrac{6}{6+2} = 0{,}75`, nota: 'divide pela soma' }],
    aparece: /\\propto/,
  },
  {
    id: 'argmax',
    simbolo: L`\arg\max`,
    titulo: 'argmax',
    ideia: 'max devolve o maior valor; argmax devolve quem tem o maior valor.',
    exemplo: [{ latex: L`P(\text{sim}) = 0{,}7 \qquad P(\text{não}) = 0{,}3` }, { latex: L`\max = 0{,}7 \qquad \arg\max = \text{sim}` }],
    aparece: /\\arg\\max/,
  },
  {
    id: 'grego',
    simbolo: L`\alpha\ \beta\ \Delta`,
    titulo: 'Letras gregas',
    ideia: 'Letras gregas são só nomes de variáveis, como x ou y. O Δ (delta maiúsculo) costuma querer dizer "diferença": o valor depois menos o valor antes.',
    exemplo: [{ latex: L`\Delta E = E_{\text{depois}} - E_{\text{antes}} = 40 - 50 = -10`, nota: 'negativo: ficou pior' }],
    aparece: /\\alpha|\\beta|\\delta|\\Delta/,
  },
  {
    id: 'bigO',
    simbolo: L`O(\cdot)`,
    titulo: 'O grande',
    ideia: 'O(...) não é uma conta exata. Ele diz como o trabalho cresce quando o problema cresce, ignorando detalhes pequenos.',
    exemplo: [{ latex: L`O(b^d) \text{ com } b = 2:\quad d = 10 \to 1\,024 \qquad d = 20 \to 1\,048\,576` }],
    aparece: /O\(/,
  },
]

/** Aulas que ajudam a ler esta fórmula, na ordem do mais básico ao mais específico. */
export function aulasPara(latexes: string[]): AulaMat[] {
  const tudo = latexes.join(' ')
  return AULAS.filter((a) => a.aparece.test(tudo))
}
