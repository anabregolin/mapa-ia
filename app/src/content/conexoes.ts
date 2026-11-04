import type { Conexao } from './tipos'

const p = (de: string, para: string, nota?: string): Conexao => ({ de, para, tipo: 'prereq', nota })
const s = (de: string, para: string, nota: string): Conexao => ({ de, para, tipo: 'parecido', nota })

/** Pré-requisitos: precisa de `de` para entender `para`. */
const PREREQ: Conexao[] = [
  p('u1.historia', 'u1.turing'),
  p('u1.historia', 'u1.paradigma'),
  p('u1.subareas', 'u1.paradigma'),

  p('u2.agente', 'u2.tipos-agente'),
  p('u2.agente', 'u2.ambientes'),
  p('u2.ambientes', 'u2.tipos-problema'),
  p('u2.agente', 'u2.formulacao'),
  p('u2.formulacao', 'u2.agente-resolvedor'),
  p('u2.formulacao', 'u2.arvore-busca'),

  p('u2.arvore-busca', 'u2.criterios'),
  p('u2.arvore-busca', 'u2.bfs'),
  p('u2.arvore-busca', 'u2.dfs'),
  p('u2.criterios', 'u2.bfs'),
  p('u2.criterios', 'u2.dfs'),
  p('u2.bfs', 'u2.ucs'),
  p('u2.dfs', 'u2.dls-ids'),
  p('u2.bfs', 'u2.dls-ids'),

  p('u2.formulacao', 'u2.heuristica'),
  p('u2.heuristica', 'u2.admissivel'),
  p('u2.heuristica', 'u2.heur-exemplos'),
  p('u2.heuristica', 'u2.gulosa'),
  p('u2.admissivel', 'u2.astar'),
  p('u2.ucs', 'u2.astar'),
  p('u2.astar', 'u2.idastar'),
  p('u2.dls-ids', 'u2.idastar', 'mesma ideia: aprofundamento iterativo'),
  p('u2.astar', 'u2.wastar'),

  p('u2.otimizacao', 'u2.hill'),
  p('u2.hill', 'u2.sa'),
  p('u2.hill', 'u2.ag'),
  p('u2.ag', 'u2.ag.selecao'),
  p('u2.ag', 'u2.ag.crossover'),
  p('u2.ag', 'u2.ag.mutacao'),

  p('u2.teoria-jogos', 'u2.nash'),
  p('u2.teoria-jogos', 'u2.forma-extensiva'),
  p('u2.arvore-busca', 'u2.forma-extensiva'),
  p('u2.forma-extensiva', 'u2.minimax'),
  p('u2.minimax', 'u2.alfabeta'),

  p('u3.agente-kb', 'u3.proposicao'),
  p('u3.proposicao', 'u3.operadores'),
  p('u3.operadores', 'u3.equivalencias'),
  p('u3.operadores', 'u3.inferencia'),
  p('u3.inferencia', 'u3.predicados'),
  p('u3.predicados', 'u3.ontologias'),

  p('u2.formulacao', 'u3.plan-vs-busca'),
  p('u3.plan-vs-busca', 'u3.classico'),
  p('u3.predicados', 'u3.strips'),
  p('u3.classico', 'u3.strips'),
  p('u3.strips', 'u3.esquemas'),
  p('u3.strips', 'u3.semantica'),
  p('u3.esquemas', 'u3.pddl'),
  p('u3.semantica', 'u3.prog-regr'),
  p('u3.pddl', 'u3.graphplan'),
  p('u3.prog-regr', 'u3.graphplan'),

  p('u4.incerteza', 'u4.prob-basica'),
  p('u4.prob-basica', 'u4.conjunta'),
  p('u4.conjunta', 'u4.condicional'),
  p('u4.condicional', 'u4.bayes'),
  p('u4.bayes', 'u4.apr-bayesiano'),
  p('u4.apr-bayesiano', 'u4.naive'),
  p('u4.naive', 'u4.laplace'),
  p('u4.bayes', 'u4.redes-bayes'),

  p('u5.ml', 'u5.paradigmas'),
  p('u5.ml', 'u5.modelos'),
  p('u5.ml', 'u5.fitting'),
  p('u5.ml', 'u5.bias'),
  p('u5.ml', 'u5.atributos'),
  p('u5.atributos', 'u5.qualidade'),
  p('u5.paradigmas', 'u5.clustering'),
  p('u5.paradigmas', 'u5.associacao'),
  p('u5.paradigmas', 'u5.qlearning'),
  p('u5.ml', 'u4.apr-bayesiano', 'Naive Bayes é um classificador supervisionado'),

  p('u5.atributos', 'u5.proximidade'),
  p('u5.proximidade', 'u5.distancias'),
  p('u5.atributos', 'u5.binarios'),
  p('u5.proximidade', 'u5.binarios'),
  p('u5.distancias', 'u5.knn'),

  p('u5.ml', 'u5.arvore'),
  p('u5.arvore', 'u5.hunt'),
  p('u5.hunt', 'u5.gini'),
  p('u5.hunt', 'u5.entropia'),

  p('u5.fitting', 'u5.treino-teste'),
  p('u5.treino-teste', 'u5.metricas'),
  p('u5.paradigmas', 'u5.regressao'),
  p('u5.regressao', 'u5.gradiente'),
  p('u5.gradiente', 'u5.redes-neurais'),
]

/** Ligações "parecido com": as mais legais de mostrar. */
const PARECIDO: Conexao[] = [
  s('u2.ucs', 'u2.astar', 'UCS = A* com h = 0'),
  s('u2.ucs', 'u2.wastar', 'UCS = Weighted A* com w = 0'),
  s('u2.gulosa', 'u2.wastar', 'gulosa = Weighted A* com w → ∞'),
  s('u2.gulosa', 'u2.dfs', 'as duas seguem um caminho sem olhar para trás'),
  s('u2.bfs', 'u2.ucs', 'BFS = UCS com todos os custos iguais a 1'),
  s('u2.sa', 'u2.hill', 'SA com T → 0 vira Hill Climbing'),
  s('u3.prog-regr', 'u2.ucs', 'plano de custo mínimo = busca de custo uniforme'),
  s('u3.graphplan', 'u3.prog-regr', 'a extração do plano é uma busca regressiva'),
  s('u2.heur-exemplos', 'u5.distancias', 'Manhattan e Euclidiana são Minkowski com p = 1 e p = 2'),
  s('u3.predicados', 'u5.arvore', 'cada caminho da árvore é uma regra "se… então"'),
  s('u5.arvore', 'u1.historia', 'regras "se… então" = sistemas especialistas'),
  s('u5.arvore', 'u2.arvore-busca', 'mesma estrutura, papéis diferentes (lista 5, Q7)'),
  s('u5.entropia', 'u1.historia', 'entropia vem de Shannon, um dos organizadores de Dartmouth'),
  s('u5.knn', 'u5.fitting', 'k pequeno → overfitting; k grande → underfitting'),
  s('u4.naive', 'u5.bias', 'Naive Bayes assume independência'),
  s('u5.knn', 'u5.bias', 'KNN assume que vizinhos são parecidos'),
  s('u5.qualidade', 'u5.knn', 'dá para imputar faltantes com KNN'),
  s('u5.atributos', 'u5.binarios', 'binário assimétrico → use Jaccard'),
  s('u4.apr-bayesiano', 'u1.historia', 'LLMs estimam P(próxima palavra | contexto)'),
  s('u2.ag', 'u5.redes-neurais', 'MarI/O evolui redes neurais com AG'),
  s('u2.ambientes', 'u2.teoria-jogos', 'ambiente multiagente = jogo'),
  s('u4.incerteza', 'u2.tipos-problema', 'contingência: o agente não sabe tudo de antemão'),
]

export const CONEXOES: Conexao[] = [...PREREQ, ...PARECIDO]
