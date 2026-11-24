// Abas da trilha: recortes do conteúdo por prova, exercício ou trabalho.
// "Geral" é sempre a trilha inteira e não fica guardada aqui.
// As abas padrão seguem o programa da disciplina; dá para criar, renomear, apagar e mudar os tópicos.
import { TOPICOS } from '../content/topicos'

export interface Aba {
  id: string
  nome: string
  /** frase curta: o que a aba cobre */
  descricao: string
  topicos: string[]
  /** veio da divisão do programa (dá para "voltar ao padrão") */
  padrao?: boolean
}

const daUnidade = (...us: string[]) => TOPICOS.filter((t) => us.includes(t.unidade)).map((t) => t.id)
const dosGrupos = (...gs: string[]) => TOPICOS.filter((t) => gs.includes(t.grupo)).map((t) => t.id)

// E1/E2/E3: a partir das questões de cada trabalho (ESTRUTURA.md), mais o que elas pressupõem.
export const ABAS_PADRAO: Aba[] = [
  { id: 'p1', nome: 'P1', descricao: 'Prova 1 · unidades 1 a 3', topicos: daUnidade('u1', 'u2', 'u3'), padrao: true },
  { id: 'p2', nome: 'P2', descricao: 'Prova 2 · unidades 4 e 5', topicos: daUnidade('u4', 'u5'), padrao: true },
  {
    id: 'e1',
    nome: 'E1',
    descricao: 'Exercício 1 · busca, algoritmo genético, minimax',
    topicos: [
      'u2.formulacao',
      'u2.arvore-busca',
      'u2.criterios',
      'u2.ucs',
      'u2.heuristica',
      'u2.gulosa',
      'u2.astar',
      'u2.otimizacao',
      'u2.ag',
      'u2.ag.selecao',
      'u2.ag.crossover',
      'u2.ag.mutacao',
      'u2.forma-extensiva',
      'u2.minimax',
      'u2.alfabeta',
    ],
    padrao: true,
  },
  { id: 'e2', nome: 'E2', descricao: 'Exercício 2 · modelagem STRIPS e PDDL', topicos: ['u3.classico', 'u3.strips', 'u3.esquemas', 'u3.semantica', 'u3.pddl'], padrao: true },
  {
    id: 'e3',
    nome: 'E3',
    descricao: 'Trabalho 3 · KNN, árvore de decisão, Naive Bayes',
    topicos: [...dosGrupos('knn', 'arvores'), 'u4.bayes', 'u4.naive', 'u4.laplace', 'u5.atributos', 'u5.treino-teste', 'u5.metricas'],
    padrao: true,
  },
].map((a) => ({ ...a, topicos: a.topicos.filter((id) => TOPICOS.some((t) => t.id === id)) }))

export const GERAL = 'geral'

export const novaAba = (nome: string): Aba => ({ id: `a${Date.now().toString(36)}`, nome: nome.trim() || 'Nova aba', descricao: '', topicos: [] })
