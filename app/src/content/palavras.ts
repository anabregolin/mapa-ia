// Palavras-chave de cada tópico, para flutuarem ao redor do texto.
// Vêm de duas fontes: os termos em **negrito** das explicações (automático)
// e esta lista, escrita à mão só com termos que já aparecem no texto do tópico.
import { EXPLICACOES } from './explicacoes'
import { topicoPorId } from './topicos'

const EXTRAS: Record<string, string[]> = {
  'u1.historia': ['Turing 1950', 'Dartmouth 1956', 'ELIZA', 'sistemas especialistas'],
  'u1.turing': ['jogo da imitação', 'interrogador', 'acaso'],
  'u1.subareas': ['representação', 'raciocínio', 'planejamento', 'PLN', 'visão computacional'],
  'u1.paradigma': ['IA simbólica', 'IA baseada em dados', 'regras', 'aprendizado estatístico'],
  'u2.tipos-agente': ['objetivo', 'utilidade', 'aprendiz'],
  'u2.agente-resolvedor': ['formular objetivo', 'formular problema', 'busca', 'sequência de ações'],
  'u2.bfs': ['nó mais raso', 'completa', 'memória'],
  'u2.dfs': ['nó mais profundo', 'pouca memória'],
  'u2.ucs': ['g(n)', 'fila de prioridade', 'custo acumulado'],
  'u2.dls-ids': ['limite L', 'DLS', 'IDS'],
  'u2.heuristica': ['h(n)', 'estimativa', 'h(objetivo) = 0'],
  'u2.heur-exemplos': ['linha reta', 'Manhattan', '8-puzzle', 'peças fora do lugar'],
  'u2.gulosa': ['f(n) = h(n)', 'melhor escolha', 'não ótima'],
  'u2.astar': ['f = g + h', 'custo real', 'estimativa', 'admissível'],
  'u2.idastar': ['limite de f', 'DFS', 'menor f cortado'],
  'u2.wastar': ['peso w', 'mais rápido', 'pode perder a ótima'],
  'u2.otimizacao': ['busca local', 'vizinhos', 'função de avaliação', 'estado atual'],
  'u2.sa': ['temperatura T', 'ΔE', 'aceitar pior'],
  'u2.ag.mutacao': ['taxa Pm', 'gene', 'ao acaso'],
  'u2.forma-extensiva': ['S0', 'PLAYER', 'ACTIONS', 'RESULT', 'UTILITY'],
  'u2.minimax': ['MAX', 'MIN', 'utilidade'],
  'u2.alfabeta': ['α', 'β', 'α ≥ β'],
  'u3.agente-kb': ['KB', 'TELL', 'ASK', 'inferência'],
  'u3.proposicao': ['sentença declarativa', 'valor-verdade', 'sentença aberta'],
  'u3.operadores': ['¬ ∧ ∨', 'P → Q', 'tabela-verdade'],
  'u3.equivalencias': ['De Morgan', 'dupla negação', 'P → Q ≡ ¬P ∨ Q'],
  'u3.predicados': ['predicado', '∀ para todo', '∃ existe'],
  'u3.plan-vs-busca': ['objetivo', 'Buy(x)', 'Have(x)'],
  'u3.esquemas': ['variáveis', 'Fly(p, from, to)', 'constantes'],
  'u3.semantica': ['pré-condições', 'ADD', 'DEL', 'aplicável'],
  'u3.pddl': [':precondition', ':effect', ':init', ':goal'],
  'u3.graphplan': ['níveis S e A', 'interferência', 'efeitos inconsistentes'],
  'u4.incerteza': ['verdadeiro/falso', 'entre 0 e 1'],
  'u4.prob-basica': ['Ω', 'axiomas', 'disjuntos'],
  'u4.conjunta': ['P(A ∩ B)', 'P(A)·P(B)'],
  'u4.condicional': ['P(A | B)', 'dividir por P(B)'],
  'u4.bayes': ['priori', 'verossimilhança', 'evidência', 'posteriori'],
  'u4.apr-bayesiano': ['hipótese', 'crença', 'atualizar'],
  'u4.naive': ['independência', 'P(c)', 'produto', 'contagem'],
  'u4.laplace': ['+1', '+k', 'contagem zero'],
  'u5.ml': ['dados + respostas', 'tarefa T', 'medida P', 'experiência E'],
  'u5.bias': ['suposições', 'hipótese'],
  'u5.proximidade': ['similaridade', 'distância', 'simetria', 'desigualdade triangular'],
  'u5.distancias': ['Minkowski', 'Manhattan p=1', 'Euclidiana p=2', 'Chebyshev'],
  'u5.binarios': ['SMC', 'Jaccard', 'm11', 'ignora 0-0'],
  'u5.arvore': ['nó interno', 'ramo', 'folha', 'se… então'],
  'u5.hunt': ['mesma classe', 'folha', 'dividir'],
  'u5.gini': ['1 − Σp²', 'Gini split', 'pureza'],
  'u5.entropia': ['−Σ p log₂ p', 'pai − filhos'],
  'u5.metricas': ['VP FN FP VN', 'acurácia', 'precisão', 'recall', 'F1'],
  'u5.gradiente': ['θ', 'η', 'função de custo'],
}

const NEGRITO = /\*\*([^*$]+)\*\*/g

/** Até `max` palavras-chave do tópico, primeiro as do negrito. */
export function palavrasDoTopico(id: string, max = 7): string[] {
  const c = EXPLICACOES[id]
  const texto = c ? [c.intuicao, c.definicao, c.detalhe, c.cuidado ?? ''].join(' ') : (topicoPorId.get(id)?.resumo ?? '')
  const negrito = [...texto.matchAll(NEGRITO)].map((m) => m[1].trim()).filter((p) => p.length <= 40)
  const vistas = new Set<string>()
  const lista: string[] = []
  for (const p of [...negrito, ...(EXTRAS[id] ?? [])]) {
    const k = p.toLowerCase()
    if (!vistas.has(k)) {
      vistas.add(k)
      lista.push(p)
    }
  }
  return lista.slice(0, max)
}
