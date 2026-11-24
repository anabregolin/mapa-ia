// Auditoria de cobertura: para cada tópico, o que existe no app para estudá-lo.
// Serve para achar buracos antes da prova (tópico sem questão difícil, sem discursiva, sem slide…).

import { CARTOES } from '../content/cartoes'
import { calculosDoTopico } from '../content/calculos'
import { exerciciosDoTopico } from '../content/exercicios'
import { EXPLICACOES } from '../content/explicacoes'
import { questoesDoTopico } from '../content/questoes'
import { TOPICOS } from '../content/topicos'

export interface Cobertura {
  id: string
  titulo: string
  explicacao: boolean
  /** questões do banco, por nível [fácil, médio, difícil] */
  niveis: [number, number, number]
  abertas: number
  calculos: number
  cartoes: number
  exercicios: number
  semSlide: boolean
  naoVisto: boolean
  /** o que falta, em palavras */
  falta: string[]
}

export function cobertura(ids?: string[]): Cobertura[] {
  const lista = ids ? TOPICOS.filter((t) => ids.includes(t.id)) : TOPICOS
  return lista.map((t) => {
    const qs = questoesDoTopico(t.id)
    const niveis: [number, number, number] = [0, 0, 0]
    for (const q of qs) niveis[q.nivel - 1]++
    const abertas = qs.filter((q) => q.tipo === 'aberta').length
    const calculos = calculosDoTopico(t.id).length
    const c: Cobertura = {
      id: t.id,
      titulo: t.titulo,
      explicacao: !!EXPLICACOES[t.id],
      niveis,
      abertas,
      calculos,
      cartoes: CARTOES.filter((x) => x.topico === t.id).length,
      exercicios: exerciciosDoTopico(t.id).length,
      semSlide: !!t.semSlide,
      naoVisto: !!t.naoVisto,
      falta: [],
    }
    if (!c.explicacao) c.falta.push('sem explicação')
    if (!qs.length) c.falta.push('só questões automáticas')
    else if (!niveis[2] && !calculos) c.falta.push('sem questão difícil')
    if (c.semSlide) c.falta.push('sem slide próprio')
    if (c.naoVisto) c.falta.push('não visto em aula')
    return c
  })
}
