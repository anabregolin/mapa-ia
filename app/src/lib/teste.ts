// Monta os testes de abertura (antes de ler), de fechamento (depois de ler) e o geral de uma aba.
// As questões vêm de três lugares: o banco escrito à mão (content/questoes), os treinos de cálculo
// (números sorteados a cada vez) e, para tópicos sem questão no banco (U1–U3), o pré-teste automático.
// Ordem sempre do fácil ao difícil. Questões que você errou, ou acertou faz tempo, têm prioridade.

import { calculosDoTopico } from '../content/calculos'
import { embaralhar, pretestePara } from '../content/preteste'
import { questoesDoTopico, type Nivel, type QEscolha, type QNumero, type Questao } from '../content/questoes'
import { DIA } from './treino'

export type Momento = 'abertura' | 'fechamento' | 'geral' | 'relembrar'
export type Certeza = 'certeza' | 'acho' | 'chute'

export interface HistQuestao {
  acertos: number
  erros: number
  em: number
  /** a última resposta foi certa? */
  ultimaCerta: boolean
  /** quantas vezes errou dizendo "tenho certeza": o erro mais perigoso */
  errosComCerteza?: number
}

export interface ResultadoTeste {
  em: number
  acertos: number
  total: number
  /** tópico → [acertos, total] */
  porTopico: Record<string, [number, number]>
  /** ids das questões erradas */
  errados: string[]
  /** errou com "tenho certeza" */
  confiantesErrados: string[]
}

export const chaveTeste = (momento: Momento, id: string) => (momento === 'geral' ? `aba:${id}` : `t:${id}:${momento}`)

/** Questões geradas na hora a partir dos treinos de cálculo: o último passo vira a pergunta. */
function doCalculo(topico: string, semente: number): Questao[] {
  return calculosDoTopico(topico).map((c, i) => {
    const inst = c.gerar(semente + i * 7919)
    const p = inst.passos[inst.passos.length - 1]
    const enunciado = `${inst.enunciado}\n\n${p.pergunta}`
    const base = { id: `calc:${c.id}`, topico, nivel: 3 as Nivel, fonte: `treino "${c.titulo}" (números sorteados)`, explicacao: p.explicacao ?? '' }
    if (p.opcoes) {
      const certa = p.opcoes[p.resposta]
      const q: QEscolha = { ...base, tipo: 'escolha', enunciado, opcoes: [{ texto: certa }, ...p.opcoes.filter((_, j) => j !== p.resposta).map((texto) => ({ texto }))] }
      return q
    }
    const q: QNumero = { ...base, tipo: 'numero', enunciado, resposta: p.resposta, casas: p.casas, porcento: p.porcento, conta: p.conta }
    return q
  })
}

/** Para tópicos sem questões no banco: as perguntas automáticas do pré-teste, como nível 1. */
function doPreteste(topico: string): Questao[] {
  return pretestePara(topico).map((p, i) => {
    const fmt = (s: string) => (p.tipo === 'tex' ? `$${s}$` : s)
    return {
      id: `pre:${topico}#${i + 1}`,
      tipo: 'escolha',
      topico,
      nivel: 1,
      enunciado: p.enunciado.replace(/^Chute: /, '').replace('você acha que ', ''),
      opcoes: [{ texto: fmt(p.opcoes[p.certa]) }, ...p.opcoes.filter((_, j) => j !== p.certa).map((o) => ({ texto: fmt(o) }))],
      explicacao: p.depois,
      fonte: 'gerada do conteúdo do tópico',
    }
  })
}

export function questoesPara(topico: string, semente: number): Questao[] {
  const banco = questoesDoTopico(topico)
  const calc = doCalculo(topico, semente)
  return banco.length ? [...banco, ...calc] : [...doPreteste(topico), ...calc]
}

/** quanto mais alto, mais a questão precisa aparecer */
function prioridade(h: HistQuestao | undefined, agora: number): number {
  if (!h) return 2
  if (!h.ultimaCerta) return 3 + (h.errosComCerteza ? 1 : 0)
  const dias = (agora - h.em) / DIA
  return dias > 3 ? 1 : 0
}

export interface Opcoes {
  max: number
  semente: number
  historico: Record<string, HistQuestao>
  agora: number
}

function ordenar(qs: Questao[], o: Opcoes, sal: string): Questao[] {
  const misturadas = embaralhar(qs, `${o.semente}:${sal}`)
  return misturadas.sort((a, b) => prioridade(o.historico[b.id], o.agora) - prioridade(o.historico[a.id], o.agora))
}

const porNivel = (qs: Questao[]) => [...qs].sort((a, b) => a.nivel - b.nivel)

/**
 * Abertura: até 3 questões em rampa (uma de cada nível, se houver), sem discursivas.
 * Errar é esperado: o objetivo é ler sabendo o que procurar.
 */
export function montarAbertura(topico: string, o: Opcoes): Questao[] {
  const qs = questoesPara(topico, o.semente).filter((q) => q.tipo !== 'aberta')
  const escolhidas: Questao[] = []
  for (const n of [1, 2, 3] as Nivel[]) {
    const q = ordenar(qs.filter((x) => x.nivel === n), o, `a${n}`)[0]
    if (q) escolhidas.push(q)
  }
  for (const q of ordenar(qs, o, 'resto')) if (escolhidas.length < Math.min(3, o.max) && !escolhidas.includes(q)) escolhidas.push(q)
  return porNivel(escolhidas.slice(0, Math.min(3, o.max)))
}

/**
 * Fechamento: até `max` questões do tópico, com no máximo uma discursiva no fim.
 * Garante pelo menos uma de nível 3 quando existe.
 */
export function montarFechamento(topico: string, o: Opcoes): Questao[] {
  const qs = questoesPara(topico, o.semente)
  const fechadas = ordenar(qs.filter((q) => q.tipo !== 'aberta'), o, 'f')
  const aberta = ordenar(qs.filter((q) => q.tipo === 'aberta'), o, 'fa')[0]
  const vagas = Math.max(1, o.max - (aberta ? 1 : 0))
  let escolhidas = fechadas.slice(0, vagas)
  const dificil = fechadas.find((q) => q.nivel === 3)
  if (dificil && !escolhidas.some((q) => q.nivel === 3)) escolhidas = [...escolhidas.slice(0, -1), dificil]
  return [...porNivel(escolhidas), ...(aberta && o.max > 1 ? [aberta] : [])]
}

/** Relembrar: 3 questões fechadas, de preferência as que você errou ou acertou faz tempo. */
export function montarRelembrar(topico: string, o: Opcoes): Questao[] {
  const qs = ordenar(questoesPara(topico, o.semente).filter((q) => q.tipo !== 'aberta'), o, 'r')
  return porNivel(qs.slice(0, 3))
}

/** No relembrar, lembrou = acertou pelo menos 2 de 3 (ou todas, se forem menos). */
export const lembrou = (r: ResultadoTeste) => r.total > 0 && r.acertos >= Math.min(2, r.total)

/**
 * Teste geral de uma aba: `max` questões espalhadas pelos tópicos, uma por tópico por rodada,
 * começando pelos tópicos mais fracos (`forca` baixa = mais fraco).
 */
export function montarGeral(topicos: string[], forca: Record<string, number>, o: Opcoes): Questao[] {
  const filas = new Map(topicos.map((t) => [t, ordenar(questoesPara(t, o.semente).filter((q) => q.tipo !== 'aberta'), o, t)]))
  const ordem = embaralhar(topicos, `${o.semente}:t`).sort((a, b) => (forca[a] ?? 0) - (forca[b] ?? 0))
  const escolhidas: Questao[] = []
  let rodada = 0
  while (escolhidas.length < o.max && rodada < 20) {
    let pegou = false
    for (const t of ordem) {
      const q = filas.get(t)?.[rodada]
      if (q && escolhidas.length < o.max) {
        escolhidas.push(q)
        pegou = true
      }
    }
    if (!pegou) break
    rodada++
  }
  return porNivel(escolhidas)
}

/** Força de 0 a 1 de um tópico, pelo histórico das questões dele (sem histórico = 0). */
export function forcaDoTopico(topico: string, historico: Record<string, HistQuestao>): number {
  const ids = Object.keys(historico).filter((id) => id.startsWith(`${topico}#`) || id.startsWith(`pre:${topico}#`))
  if (!ids.length) return 0
  const certas = ids.filter((id) => historico[id].ultimaCerta).length
  return certas / ids.length
}

/** A discursiva conta como certa quando a sua resposta cobriu pelo menos 60% dos pontos. */
export const abertaCerta = (marcados: number, total: number) => total > 0 && marcados / total >= 0.6
