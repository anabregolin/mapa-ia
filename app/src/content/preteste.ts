// Pré-teste: 1 a 2 perguntas de chute antes de ler um tópico novo.
// Errar aqui é esperado. Tentar responder antes de estudar deixa a leitura mais atenta
// ("efeito do pré-teste", Richland, Kornell & Kao, 2009).
// As perguntas são montadas a partir do próprio conteúdo: a opção certa vem deste tópico,
// as erradas vêm de tópicos vizinhos da mesma unidade.

import { FORMULAS, formulasDoTopico } from './formulas'
import { TOPICOS, topicoPorId } from './topicos'

export interface PerguntaPre {
  enunciado: string
  /** 'tex' = opções são fórmulas em LaTeX */
  tipo: 'texto' | 'tex'
  opcoes: string[]
  certa: number
  /** dito depois de responder */
  depois: string
}

/** embaralha sempre do mesmo jeito para o mesmo tópico (assim a resposta não muda se recarregar) */
export function embaralhar<T>(itens: T[], semente: string): T[] {
  let h = 2166136261
  for (const c of semente) h = Math.imul(h ^ c.charCodeAt(0), 16777619)
  const r = [...itens]
  for (let i = r.length - 1; i > 0; i--) {
    h = Math.imul(h ^ (h >>> 13), 1274126177)
    const j = Math.abs(h) % (i + 1)
    ;[r[i], r[j]] = [r[j], r[i]]
  }
  return r
}

function montar(enunciado: string, tipo: PerguntaPre['tipo'], certa: string, erradas: string[], depois: string, semente: string): PerguntaPre {
  const opcoes = embaralhar([certa, ...erradas], semente)
  return { enunciado, tipo, opcoes, certa: opcoes.indexOf(certa), depois }
}

export function pretestePara(id: string): PerguntaPre[] {
  const tp = topicoPorId.get(id)
  if (!tp) return []
  const perguntas: PerguntaPre[] = []

  // 1) qual frase descreve o tópico: as erradas são do mesmo grupo primeiro, depois da mesma unidade
  const outros = TOPICOS.filter((o) => o.id !== id && o.unidade === tp.unidade && o.resumo !== tp.resumo)
  const candidatos = [...outros.filter((o) => o.grupo === tp.grupo), ...embaralhar(outros.filter((o) => o.grupo !== tp.grupo), id)]
  const erradas = candidatos.slice(0, 2)
  if (erradas.length === 2)
    perguntas.push(
      montar(`Chute: qual destas frases você acha que descreve "${tp.titulo}"?`, 'texto', tp.resumo, erradas.map((o) => o.resumo), `As outras falam de ${erradas.map((o) => `"${o.titulo}"`).join(' e ')}.`, id),
    )

  // 2) qual fórmula aparece aqui
  const minhas = formulasDoTopico(id)
  if (minhas.length) {
    const f = minhas[0]
    const alheias = embaralhar(
      FORMULAS.filter((o) => !o.topicos.some((t) => t === id) && o.topicos.some((t) => topicoPorId.get(t)?.unidade === tp.unidade)),
      id + 'f',
    ).slice(0, 2)
    if (alheias.length === 2)
      perguntas.push(montar(`E qual destas fórmulas você acha que aparece aqui?`, 'tex', f.latex, alheias.map((o) => o.latex), `É a fórmula "${f.nome}". As outras são ${alheias.map((o) => `"${o.nome}"`).join(' e ')}.`, id + 'f'))
  }
  return perguntas
}
