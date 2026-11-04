import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { ETAPAS } from '../content/topicos'
import { responder, type Nota, type ProgressoCartao } from '../content/cartoes'
import type { ProgressoExercicio } from '../content/tipos'

export const ULTIMA_ETAPA = ETAPAS[ETAPAS.length - 1].pos

/** De onde veio a última mudança de etapa: a barra move o mapa, o mapa só atualiza a barra. */
export type OrigemEtapa = 'barra' | 'mapa'

export type CorPor = 'unidade' | 'nivel'
export type Tema = 'escuro' | 'claro'

const temaInicial = (): Tema => (typeof matchMedia !== 'undefined' && matchMedia('(prefers-color-scheme: light)').matches ? 'claro' : 'escuro')

interface EstadoMapa {
  selecionado: string | null
  hover: string | null
  etapa: number
  origemEtapa: OrigemEtapa
  corPor: CorPor
  tema: Tema
  /** esconde (fantasma) o que vem depois da etapa atual */
  revelar: boolean
  estudados: Record<string, true>
  exercicios: Record<string, ProgressoExercicio>
  cartoes: Record<string, ProgressoCartao>
  revisaoAberta: boolean

  selecionar: (id: string | null) => void
  setHover: (id: string | null) => void
  setEtapa: (etapa: number, origem: OrigemEtapa) => void
  setCorPor: (c: CorPor) => void
  alternarTema: () => void
  setRevelar: (r: boolean) => void
  alternarEstudado: (id: string) => void
  /** marca o exercício; repetir a mesma marca desmarca */
  marcarExercicio: (id: string, p: ProgressoExercicio) => void
  responderCartao: (id: string, nota: Nota, agora: number) => void
  zerarCartoes: () => void
  setRevisaoAberta: (a: boolean) => void
}

export const useMapa = create<EstadoMapa>()(
  persist(
    (set) => ({
      selecionado: null,
      hover: null,
      etapa: ULTIMA_ETAPA,
      origemEtapa: 'barra',
      corPor: 'unidade',
      tema: temaInicial(),
      revelar: false,
      estudados: {},
      exercicios: {},
      cartoes: {},
      revisaoAberta: false,

      selecionar: (id) => set({ selecionado: id }),
      setHover: (id) => set({ hover: id }),
      setEtapa: (etapa, origem) => set({ etapa, origemEtapa: origem }),
      setCorPor: (corPor) => set({ corPor }),
      alternarTema: () => set((s) => ({ tema: s.tema === 'escuro' ? 'claro' : 'escuro' })),
      setRevelar: (revelar) => set({ revelar }),
      alternarEstudado: (id) =>
        set((s) => {
          const estudados = { ...s.estudados }
          if (estudados[id]) delete estudados[id]
          else estudados[id] = true
          return { estudados }
        }),
      marcarExercicio: (id, p) =>
        set((s) => {
          const exercicios = { ...s.exercicios }
          if (exercicios[id] === p) delete exercicios[id]
          else exercicios[id] = p
          return { exercicios }
        }),
      responderCartao: (id, nota, agora) => set((s) => ({ cartoes: { ...s.cartoes, [id]: responder(s.cartoes[id], nota, agora) } })),
      zerarCartoes: () => set({ cartoes: {} }),
      setRevisaoAberta: (revisaoAberta) => set({ revisaoAberta }),
    }),
    {
      name: 'mapa-ia',
      // só o progresso e as preferências vão para o localStorage
      partialize: (s) => ({ etapa: s.etapa, corPor: s.corPor, tema: s.tema, revelar: s.revelar, estudados: s.estudados, exercicios: s.exercicios, cartoes: s.cartoes }),
    },
  ),
)
