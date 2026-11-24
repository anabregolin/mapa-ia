import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { ETAPAS } from '../content/topicos'
import { responder, type Nota as NotaCartao, type ProgressoCartao } from '../content/cartoes'
import type { ProgressoExercicio } from '../content/tipos'
import { agendar, type ProgressoCalculo, type TentativaCalculo } from '../lib/treino'
import { INTERVALOS_PADRAO, MINUTOS_PADRAO, proximaRevisita, type Revisita } from '../lib/revisita'
import { LEITURA_PADRAO, type PrefLeitura } from '../lib/leitura'
import { CORES_PADRAO, type CorMarca, type Marca } from '../lib/marcas'
import { ABAS_PADRAO, GERAL, novaAba, type Aba } from '../lib/abas'
import { PARADO, POMODORO_PADRAO, type EstadoPomodoro, type PrefPomodoro } from '../lib/pomodoro'
import type { Certeza, HistQuestao, ResultadoTeste } from '../lib/teste'
import { novoId, type Bloco, type PaginaCaderno } from '../lib/caderno'
import type { Desenvolvimento } from '../lib/desenvolvimento'

export interface Nota {
  texto: string
  em: number
  /** sai da lista de anotações (continua no tópico); dá para desarquivar */
  arquivada?: boolean
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

export interface PrefEstudo {
  /** teste de abertura antes de ler um tópico novo (o antigo "pré-teste") */
  preteste: boolean
  /** questões no teste de fechamento e no geral da aba (máx. 15) */
  questoesTeste: number
  /** nos cartões, escrever a resposta antes de virar */
  escreverCartao: boolean
  /** minutos de leitura até o "pare e relembre" */
  minutosLembrete: number
  /** voltas depois de estudar, em dias (frações = horas) */
  intervalos: number[]
}
export const ESTUDO_PADRAO: PrefEstudo = { preteste: true, questoesTeste: 10, escreverCartao: true, minutosLembrete: MINUTOS_PADRAO, intervalos: INTERVALOS_PADRAO }
export const MAX_QUESTOES = 15

/** Sua resposta escrita numa questão discursiva e os pontos que você marcou como cobertos. */
export interface RespostaAberta {
  texto: string
  marcados: number[]
  em: number
}

/**
 * O que você disse sobre um cartão depois de responder. Fica guardado para melhorar os cartões depois
 * (inclusive por uma IA): o que escreveu, o que faltou e se o cartão está grande ou confuso demais.
 */
export interface FeedbackCartao {
  em: number
  /** o que você escreveu antes de virar (o último) */
  escrito: string
  /** marcações: o que faltou na sua resposta e o que há de errado com o cartão */
  faltou: ('ideia-central' | 'detalhe' | 'formula' | 'exemplo' | 'confundi')[]
  /** o cartão pede coisa demais e devia virar dois ou mais */
  dividir: boolean
  /** o cartão está confuso ou mal escrito */
  confuso: boolean
  comentario: string
  /** quantas vezes você deu feedback neste cartão */
  n: number
}

/** Tempo de estudo com o tópico aberto e você ativa na página. */
export interface TempoTopico {
  ms: number
  em: number
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
  mostrarExtras: boolean
  /** histórico dos treinos de cálculo */
  calculos: Record<string, ProgressoCalculo>
  /** desenvolvimento livre de cada treino de cálculo (o rascunho que você monta) */
  desenvolvimentos: Record<string, Desenvolvimento>
  /** anotações livres por tópico */
  notas: Record<string, Nota>
  /** quando cada tópico entendido volta para uma olhada */
  revisitas: Record<string, Revisita>
  quadro: Postit[]
  palavrasFlutuantes: boolean
  /** como você gosta de ver o texto */
  leitura: PrefLeitura
  estudo: PrefEstudo
  /** resultado do pré-teste de cada tópico (o chute antes de ler) */
  pretestes: Record<string, { acertos: number; total: number; em: number }>
  /** trechos marcados com marca-texto */
  marcas: Marca[]
  /** o objetivo de cada cor do marca-texto */
  coresMarca: CorMarca[]
  pomodoroPref: PrefPomodoro
  pomodoro: EstadoPomodoro
  /** cartão do pomodoro aberto na tela (só fecha quando você comprime) */
  pomodoroAberto: boolean
  /** abas da trilha por prova/exercício/trabalho (a "Geral" não entra aqui) */
  abas: Aba[]
  abaAtual: string
  /** explicação Feynman de cada tópico: o texto e o que você conferiu ao reler/reouvir */
  feynman: Record<string, Feynman>
  /** páginas de slide fixadas em cada tópico: "arquivo#página" */
  slidesFixados: Record<string, string[]>
  /** histórico de cada questão dos testes */
  questoes: Record<string, HistQuestao>
  /** último resultado de cada teste: "t:<tópico>:abertura", "t:<tópico>:fechamento", "aba:<id>" */
  testes: Record<string, ResultadoTeste>
  /** suas respostas às discursivas */
  abertas: Record<string, RespostaAberta>
  feedbackCartoes: Record<string, FeedbackCartao>
  tempo: Record<string, TempoTopico>
  /** páginas do caderno */
  caderno: PaginaCaderno[]
  /** última página aberta (para onde vai o "levar para o caderno") */
  paginaAtual: string | null

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
  setMostrarExtras: (m: boolean) => void
  registrarCalculo: (id: string, t: TentativaCalculo) => void
  salvarDesenvolvimento: (id: string, d: Desenvolvimento | null) => void
  salvarNota: (id: string, texto: string) => void
  revisitar: (id: string, lembrou: boolean) => void
  alternarPalavras: () => void
  adicionarPostit: (p: Omit<Postit, 'id'>) => string
  atualizarPostit: (id: string, mudanca: Partial<Postit>) => void
  removerPostit: (id: string) => void
  restaurarPostit: (p: Postit) => void
  arquivarNota: (id: string, arquivada: boolean) => void
  /** devolve uma anotação apagada (o "desfazer") */
  restaurarNota: (id: string, n: Nota) => void
  restaurarMarca: (m: Marca) => void
  setLeitura: (mudanca: Partial<PrefLeitura>) => void
  setEstudo: (mudanca: Partial<PrefEstudo>) => void
  registrarPreteste: (id: string, acertos: number, total: number) => void
  responderQuestao: (id: string, certa: boolean, certeza: Certeza) => void
  registrarTeste: (chave: string, r: ResultadoTeste) => void
  salvarAberta: (id: string, texto: string, marcados: number[]) => void
  darFeedbackCartao: (id: string, fb: Omit<FeedbackCartao, 'em' | 'n'>) => void
  somarTempo: (id: string, ms: number) => void
  adicionarMarca: (m: Omit<Marca, 'id' | 'em' | 'nota'>) => string
  atualizarMarca: (id: string, mudanca: Partial<Pick<Marca, 'cor' | 'nota' | 'tags' | 'arquivada'>>) => void
  removerMarca: (id: string) => void
  setObjetivoCor: (id: CorMarca['id'], objetivo: string) => void
  setPomodoroPref: (mudanca: Partial<PrefPomodoro>) => void
  setPomodoro: (e: EstadoPomodoro) => void
  setPomodoroAberto: (a: boolean) => void
  setAbaAtual: (id: string) => void
  criarAba: (nome: string) => string
  editarAba: (id: string, mudanca: Partial<Pick<Aba, 'nome' | 'descricao'>>) => void
  removerAba: (id: string) => void
  alternarTopicoNaAba: (aba: string, topico: string) => void
  restaurarAbasPadrao: () => void
  salvarFeynman: (id: string, mudanca: Partial<Feynman>) => void
  alternarSlide: (topico: string, pagina: string) => void
  criarPagina: (p?: Partial<Pick<PaginaCaderno, 'titulo' | 'assunto' | 'blocos'>>) => string
  editarPagina: (id: string, mudanca: Partial<Pick<PaginaCaderno, 'titulo' | 'assunto'>>) => void
  removerPagina: (id: string) => void
  restaurarPagina: (p: PaginaCaderno) => void
  setPaginaAtual: (id: string | null) => void
  /** põe o bloco na página (no fim, ou na posição dada) e devolve o id */
  adicionarBloco: (pagina: string, b: Omit<Bloco, 'id'> & { id?: string }, posicao?: number) => string
  editarBloco: (pagina: string, bloco: string, mudanca: Partial<Pick<Bloco, 'texto'>>) => void
  removerBloco: (pagina: string, bloco: string) => void
  moverBloco: (pagina: string, bloco: string, para: number) => void
}

export interface Feynman {
  texto: string
  /** itens da lista de conferência marcados */
  conferido: Record<string, true>
  /** onde travou ao explicar: é o que falta estudar */
  travei?: string
  em: number
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
      mostrarExtras: false,
      calculos: {},
      desenvolvimentos: {},
      notas: {},
      revisitas: {},
      quadro: [],
      palavrasFlutuantes: true,
      leitura: LEITURA_PADRAO,
      estudo: ESTUDO_PADRAO,
      pretestes: {},
      questoes: {},
      testes: {},
      abertas: {},
      feedbackCartoes: {},
      tempo: {},
      marcas: [],
      coresMarca: CORES_PADRAO,
      pomodoroPref: POMODORO_PADRAO,
      pomodoro: PARADO,
      pomodoroAberto: false,
      abas: ABAS_PADRAO,
      abaAtual: GERAL,
      feynman: {},
      slidesFixados: {},
      caderno: [],
      paginaAtual: null,

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
          // entendeu agora: a primeira olhada de volta recomeça a contar
          if (estudados[id]) revisitas[id] = { em: Date.now(), n: 0 }
          return { estudados, revisitas }
        }),
      alternarVoltar: (id) => set((s) => ({ voltar: alternar(s.voltar, id) })),
      aprofundar: (id, camada) =>
        set((s) => {
          if (camada <= (s.profundidade[id] ?? -1)) return s
          // passou da primeira camada: conta como estudado hoje e entra na fila de relembrar
          const revisitas = camada >= 1 && !s.revisitas[id] ? { ...s.revisitas, [id]: { em: Date.now(), n: 0 } } : s.revisitas
          return { profundidade: { ...s.profundidade, [id]: camada }, revisitas }
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
      setMostrarExtras: (mostrarExtras) => set({ mostrarExtras }),
      registrarCalculo: (id, t) => set((s) => ({ calculos: { ...s.calculos, [id]: agendar(s.calculos[id], t) } })),
      salvarDesenvolvimento: (id, d) =>
        set((s) => {
          const desenvolvimentos = { ...s.desenvolvimentos }
          if (d) desenvolvimentos[id] = { ...d, em: Date.now() }
          else delete desenvolvimentos[id]
          return { desenvolvimentos }
        }),
      salvarNota: (id, texto) =>
        set((s) => {
          const notas = { ...s.notas }
          if (texto.trim()) notas[id] = { ...s.notas[id], texto, em: Date.now() }
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
      arquivarNota: (id, arquivada) =>
        set((s) => {
          const n = s.notas[id]
          if (!n) return s
          const nova: Nota = { ...n }
          if (arquivada) nova.arquivada = true
          else delete nova.arquivada
          return { notas: { ...s.notas, [id]: nova } }
        }),
      restaurarNota: (id, n) => set((s) => ({ notas: { ...s.notas, [id]: n } })),
      restaurarMarca: (m) => set((s) => (s.marcas.some((x) => x.id === m.id) ? s : { marcas: [...s.marcas, m] })),
      setLeitura: (mudanca) => set((s) => ({ leitura: { ...s.leitura, ...mudanca } })),
      setEstudo: (mudanca) => set((s) => ({ estudo: { ...s.estudo, ...mudanca } })),
      registrarPreteste: (id, acertos, total) => set((s) => ({ pretestes: { ...s.pretestes, [id]: { acertos, total, em: Date.now() } } })),
      responderQuestao: (id, certa, certeza) =>
        set((s) => {
          const h = s.questoes[id] ?? { acertos: 0, erros: 0, em: 0, ultimaCerta: false }
          const novo: HistQuestao = {
            acertos: h.acertos + (certa ? 1 : 0),
            erros: h.erros + (certa ? 0 : 1),
            em: Date.now(),
            ultimaCerta: certa,
            errosComCerteza: (h.errosComCerteza ?? 0) + (!certa && certeza === 'certeza' ? 1 : 0),
          }
          return { questoes: { ...s.questoes, [id]: novo } }
        }),
      registrarTeste: (chave, r) => set((s) => ({ testes: { ...s.testes, [chave]: r } })),
      salvarAberta: (id, texto, marcados) => set((s) => ({ abertas: { ...s.abertas, [id]: { texto, marcados, em: Date.now() } } })),
      darFeedbackCartao: (id, fb) =>
        set((s) => ({ feedbackCartoes: { ...s.feedbackCartoes, [id]: { ...fb, em: Date.now(), n: (s.feedbackCartoes[id]?.n ?? 0) + 1 } } })),
      somarTempo: (id, ms) =>
        set((s) => (ms <= 0 ? s : { tempo: { ...s.tempo, [id]: { ms: (s.tempo[id]?.ms ?? 0) + ms, em: Date.now() } } })),
      adicionarMarca: (m) => {
        const id = `m${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`
        set((s) => ({ marcas: [...s.marcas, { ...m, id, nota: '', em: Date.now() }] }))
        return id
      },
      atualizarMarca: (id, mudanca) => set((s) => ({ marcas: s.marcas.map((m) => (m.id === id ? { ...m, ...mudanca } : m)) })),
      removerMarca: (id) => set((s) => ({ marcas: s.marcas.filter((m) => m.id !== id) })),
      setObjetivoCor: (id, objetivo) => set((s) => ({ coresMarca: s.coresMarca.map((c) => (c.id === id ? { ...c, objetivo } : c)) })),
      setPomodoroPref: (mudanca) => set((s) => ({ pomodoroPref: { ...s.pomodoroPref, ...mudanca } })),
      setPomodoro: (pomodoro) => set({ pomodoro }),
      setPomodoroAberto: (pomodoroAberto) => set({ pomodoroAberto }),
      setAbaAtual: (abaAtual) => set({ abaAtual }),
      criarAba: (nome) => {
        const a = novaAba(nome)
        set((s) => ({ abas: [...s.abas, a], abaAtual: a.id }))
        return a.id
      },
      editarAba: (id, mudanca) => set((s) => ({ abas: s.abas.map((a) => (a.id === id ? { ...a, ...mudanca } : a)) })),
      removerAba: (id) => set((s) => ({ abas: s.abas.filter((a) => a.id !== id), abaAtual: s.abaAtual === id ? GERAL : s.abaAtual })),
      alternarTopicoNaAba: (aba, topico) =>
        set((s) => ({
          abas: s.abas.map((a) => (a.id !== aba ? a : { ...a, topicos: a.topicos.includes(topico) ? a.topicos.filter((t) => t !== topico) : [...a.topicos, topico] })),
        })),
      // devolve as abas do programa como eram; as que você criou continuam
      restaurarAbasPadrao: () => set((s) => ({ abas: [...ABAS_PADRAO, ...s.abas.filter((a) => !a.padrao)] })),
      alternarSlide: (topico, pagina) =>
        set((s) => {
          const atual = s.slidesFixados[topico] ?? []
          const novo = atual.includes(pagina) ? atual.filter((p) => p !== pagina) : [...atual, pagina]
          return { slidesFixados: { ...s.slidesFixados, [topico]: novo } }
        }),
      criarPagina: (p) => {
        const id = novoId('pg')
        set((s) => ({ caderno: [...s.caderno, { id, titulo: p?.titulo ?? '', assunto: p?.assunto ?? '', blocos: p?.blocos ?? [], em: Date.now() }], paginaAtual: id }))
        return id
      },
      editarPagina: (id, mudanca) => set((s) => ({ caderno: s.caderno.map((p) => (p.id === id ? { ...p, ...mudanca, em: Date.now() } : p)) })),
      removerPagina: (id) => set((s) => ({ caderno: s.caderno.filter((p) => p.id !== id), paginaAtual: s.paginaAtual === id ? null : s.paginaAtual })),
      restaurarPagina: (p) => set((s) => ({ caderno: [...s.caderno.filter((x) => x.id !== p.id), p] })),
      setPaginaAtual: (paginaAtual) => set({ paginaAtual }),
      adicionarBloco: (pagina, b, posicao) => {
        const id = b.id ?? novoId('b')
        set((s) => ({
          caderno: s.caderno.map((p) => {
            if (p.id !== pagina) return p
            const blocos = [...p.blocos]
            blocos.splice(posicao ?? blocos.length, 0, { ...b, id })
            return { ...p, blocos, em: Date.now() }
          }),
        }))
        return id
      },
      editarBloco: (pagina, bloco, mudanca) =>
        set((s) => ({ caderno: s.caderno.map((p) => (p.id !== pagina ? p : { ...p, em: Date.now(), blocos: p.blocos.map((b) => (b.id === bloco ? { ...b, ...mudanca } : b)) })) })),
      removerBloco: (pagina, bloco) => set((s) => ({ caderno: s.caderno.map((p) => (p.id !== pagina ? p : { ...p, em: Date.now(), blocos: p.blocos.filter((b) => b.id !== bloco) })) })),
      moverBloco: (pagina, bloco, para) =>
        set((s) => ({
          caderno: s.caderno.map((p) => {
            if (p.id !== pagina) return p
            const de = p.blocos.findIndex((b) => b.id === bloco)
            if (de < 0 || para < 0 || para >= p.blocos.length) return p
            const blocos = [...p.blocos]
            const [b] = blocos.splice(de, 1)
            blocos.splice(para, 0, b)
            return { ...p, blocos, em: Date.now() }
          }),
        })),
      salvarFeynman: (id, mudanca) =>
        set((s) => {
          const atual = s.feynman[id] ?? { texto: '', conferido: {}, em: 0 }
          return { feynman: { ...s.feynman, [id]: { ...atual, ...mudanca, em: Date.now() } } }
        }),
    }),
    {
      name: 'mapa-ia',
      version: 2,
      // v0 → v1: tópicos entendidos antes de existir a revisita começam a contar a partir de hoje
      migrate: (salvo, versao) => {
        const e = salvo as Partial<EstadoMapa>
        if (versao < 1 && e.estudados) {
          const agora = Date.now()
          e.revisitas = Object.fromEntries(Object.keys(e.estudados).map((id) => [id, { em: agora, n: 0 }]))
        }
        // v1 → v2: o relembrar passa a valer para todo tópico lido (não só os marcados como entendidos)
        if (versao < 2 && e.profundidade) {
          const agora = Date.now()
          const revisitas = { ...(e.revisitas ?? {}) }
          for (const [id, camada] of Object.entries(e.profundidade)) if (camada >= 1 && !revisitas[id]) revisitas[id] = { em: agora, n: 0 }
          e.revisitas = revisitas
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
        desenvolvimentos: s.desenvolvimentos,
        notas: s.notas,
        revisitas: s.revisitas,
        quadro: s.quadro,
        palavrasFlutuantes: s.palavrasFlutuantes,
        leitura: s.leitura,
        estudo: s.estudo,
        pretestes: s.pretestes,
        marcas: s.marcas,
        coresMarca: s.coresMarca,
        pomodoroPref: s.pomodoroPref,
        pomodoro: s.pomodoro,
        pomodoroAberto: s.pomodoroAberto,
        abas: s.abas,
        abaAtual: s.abaAtual,
        feynman: s.feynman,
        slidesFixados: s.slidesFixados,
        questoes: s.questoes,
        testes: s.testes,
        abertas: s.abertas,
        feedbackCartoes: s.feedbackCartoes,
        tempo: s.tempo,
        caderno: s.caderno,
        paginaAtual: s.paginaAtual,
      }),
      // preferências novas que o navegador ainda não tem ganham o valor padrão
      merge: (salvo, atual) => {
        const s = salvo as Partial<EstadoMapa>
        return { ...atual, ...s, leitura: { ...LEITURA_PADRAO, ...s.leitura }, estudo: { ...ESTUDO_PADRAO, ...s.estudo }, pomodoroPref: { ...POMODORO_PADRAO, ...s.pomodoroPref }, pomodoro: { ...PARADO, ...s.pomodoro } }
      },
    },
  ),
)
