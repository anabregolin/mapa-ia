import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { ETAPAS } from '../content/topicos'
import { responder, type Nota as NotaCartao, type ProgressoCartao } from '../content/cartoes'
import type { ProgressoExercicio } from '../content/tipos'
import { agendar, type ProgressoCalculo, type TentativaCalculo } from '../lib/treino'
import { proximaRevisita, type Revisita } from '../lib/revisita'

export interface Nota {
  texto: string
  em: number
}

export type CorPostit = 'sol' | 'menta' | 'foco' | 'coral' | 'papel'
export interface Postit {
  id: string
  x: number
  y: number
  texto: string
  cor: CorPostit
  /** tópico de onde a ideia veio (opcional) */
  topico?: string
}

export const ULTIMA_ETAPA = ETAPAS[ETAPAS.length - 1].pos

/** De onde veio a última mudança de etapa (usado pelo mapa de conexões). */
export type OrigemEtapa = 'barra' | 'mapa'
export type CorPor = 'unidade' | 'nivel'
export type Tema = 'escuro' | 'claro'

interface EstadoMapa {
  /** tópico aberto: espelha o endereço #/t/<id> */
  selecionado: string | null
  hover: string | null
  etapa: number
  origemEtapa: OrigemEtapa
  corPor: CorPor
  tema: Tema
  revelar: boolean
  /** tópicos marcados como "entendi" */
  estudados: Record<string, true>
  /** camada mais funda já aberta em cada tópico (0 = só abriu) */
  profundidade: Record<string, number>
  /** tópicos que você marcou para voltar depois */
  voltar: Record<string, true>
  /** último tópico aberto, para o "continuar de onde parei" */
  ultimo: string | null
  exercicios: Record<string, ProgressoExercicio>
  cartoes: Record<string, ProgressoCartao>
  revisaoAberta: boolean
  mostrarExtras: boolean
  /** histórico dos treinos de cálculo */
  calculos: Record<string, ProgressoCalculo>
  /** anotações livres por tópico */
  notas: Record<string, Nota>
  /** quando cada tópico entendido volta para uma olhada */
  revisitas: Record<string, Revisita>
  quadro: Postit[]
  palavrasFlutuantes: boolean

  /** abre um tópico (navega para #/t/<id>) ou volta para a trilha (null) */
  selecionar: (id: string | null) => void
  /** só sincroniza o estado com o endereço; quem navega é `selecionar` */
  _aoMudarRota: (id: string | null) => void
  setHover: (id: string | null) => void
  setEtapa: (etapa: number, origem: OrigemEtapa) => void
  setCorPor: (c: CorPor) => void
  alternarEstudado: (id: string) => void
  alternarVoltar: (id: string) => void
  aprofundar: (id: string, camada: number) => void
  marcarExercicio: (id: string, p: ProgressoExercicio) => void
  responderCartao: (id: string, nota: NotaCartao, agora: number) => void
  zerarCartoes: () => void
  setRevisaoAberta: (a: boolean) => void
  setMostrarExtras: (m: boolean) => void
  registrarCalculo: (id: string, t: TentativaCalculo) => void
  salvarNota: (id: string, texto: string) => void
  revisitar: (id: string, lembrou: boolean) => void
  alternarPalavras: () => void
  adicionarPostit: (p: Omit<Postit, 'id'>) => string
  atualizarPostit: (id: string, mudanca: Partial<Postit>) => void
  removerPostit: (id: string) => void
  restaurarPostit: (p: Postit) => void
}

const alternar = (r: Record<string, true>, id: string) => {
  const novo = { ...r }
  if (novo[id]) delete novo[id]
  else novo[id] = true
  return novo
}

export const useMapa = create<EstadoMapa>()(
  persist(
    (set) => ({
      selecionado: null,
      hover: null,
      etapa: ULTIMA_ETAPA,
      origemEtapa: 'barra',
      corPor: 'unidade',
      tema: 'claro',
      revelar: false,
      estudados: {},
      profundidade: {},
      voltar: {},
      ultimo: null,
      exercicios: {},
      cartoes: {},
      revisaoAberta: false,
      mostrarExtras: false,
      calculos: {},
      notas: {},
      revisitas: {},
      quadro: [],
      palavrasFlutuantes: true,

      selecionar: (id) => {
        location.hash = id ? `#/t/${id}` : '#/'
      },
      _aoMudarRota: (id) => set((s) => ({ selecionado: id, ultimo: id ?? s.ultimo, hover: null })),
      setHover: (id) => set({ hover: id }),
      setEtapa: (etapa, origem) => set({ etapa, origemEtapa: origem }),
      setCorPor: (corPor) => set({ corPor }),
      alternarEstudado: (id) =>
        set((s) => {
          const estudados = alternar(s.estudados, id)
          const revisitas = { ...s.revisitas }
          // entendeu agora: a primeira olhada de volta é daqui a 3 dias
          if (estudados[id]) revisitas[id] = { em: Date.now(), n: 0 }
          else delete revisitas[id]
          return { estudados, revisitas }
        }),
      alternarVoltar: (id) => set((s) => ({ voltar: alternar(s.voltar, id) })),
      aprofundar: (id, camada) => set((s) => (camada > (s.profundidade[id] ?? -1) ? { profundidade: { ...s.profundidade, [id]: camada } } : s)),
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
      setMostrarExtras: (mostrarExtras) => set({ mostrarExtras }),
      registrarCalculo: (id, t) => set((s) => ({ calculos: { ...s.calculos, [id]: agendar(s.calculos[id], t) } })),
      salvarNota: (id, texto) =>
        set((s) => {
          const notas = { ...s.notas }
          if (texto.trim()) notas[id] = { texto, em: Date.now() }
          else delete notas[id]
          return { notas }
        }),
      revisitar: (id, lembrou) => set((s) => ({ revisitas: { ...s.revisitas, [id]: proximaRevisita(s.revisitas[id], lembrou, Date.now()) } })),
      alternarPalavras: () => set((s) => ({ palavrasFlutuantes: !s.palavrasFlutuantes })),
      adicionarPostit: (p) => {
        const id = `p${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`
        set((s) => ({ quadro: [...s.quadro, { ...p, id }] }))
        return id
      },
      atualizarPostit: (id, mudanca) => set((s) => ({ quadro: s.quadro.map((p) => (p.id === id ? { ...p, ...mudanca } : p)) })),
      removerPostit: (id) => set((s) => ({ quadro: s.quadro.filter((p) => p.id !== id) })),
      restaurarPostit: (p) => set((s) => ({ quadro: [...s.quadro, p] })),
    }),
    {
      name: 'mapa-ia',
      version: 1,
      // v0 → v1: tópicos entendidos antes de existir a revisita começam a contar a partir de hoje
      migrate: (salvo, versao) => {
        const e = salvo as Partial<EstadoMapa>
        if (versao < 1 && e.estudados) {
          const agora = Date.now()
          e.revisitas = Object.fromEntries(Object.keys(e.estudados).map((id) => [id, { em: agora, n: 0 }]))
        }
        return e as EstadoMapa
      },
      // só o progresso e as preferências vão para o localStorage
      partialize: (s) => ({
        corPor: s.corPor,
        estudados: s.estudados,
        profundidade: s.profundidade,
        voltar: s.voltar,
        ultimo: s.ultimo,
        exercicios: s.exercicios,
        cartoes: s.cartoes,
        mostrarExtras: s.mostrarExtras,
        calculos: s.calculos,
        notas: s.notas,
        revisitas: s.revisitas,
        quadro: s.quadro,
        palavrasFlutuantes: s.palavrasFlutuantes,
      }),
    },
  ),
)
