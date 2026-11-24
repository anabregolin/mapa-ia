import { AnimatePresence, motion } from 'framer-motion'
import { useEffect, useMemo, useRef, useState } from 'react'
import { CALCULOS, calculoPorId, type Calculo, type PassoCalculo } from '../content/calculos'
import { topicoPorId } from '../content/topicos'
import { unidade } from '../lib/trilha'
import { conferir, diasAte, paraHoje, pontosFracos, situacao, type SituacaoCalculo } from '../lib/treino'
import { useMapa } from '../store/useMapa'
import { Tex } from './FormulaAnimada'
import { Texto } from './Texto'
import { BotaoCalculadora } from './Calculadora'
import { TrocaModo } from './Desenvolvimento'
import { temConteudo } from '../lib/desenvolvimento'

const ROTULO_SITUACAO: Record<SituacaoCalculo, { texto: string; cor: string; fundo: string }> = {
  novo: { texto: 'novo', cor: 'var(--tinta-suave)', fundo: 'var(--papel-2)' },
  refazer: { texto: 'refazer', cor: '#c2410c', fundo: '#ffe9e1' },
  revisar: { texto: 'revisar hoje', cor: 'var(--foco)', fundo: 'var(--foco-claro)' },
  'em-dia': { texto: 'em dia', cor: 'var(--menta)', fundo: 'var(--menta-claro)' },
}

function Situacao({ s, dias }: { s: SituacaoCalculo; dias?: number }) {
  const r = ROTULO_SITUACAO[s]
  return (
    <span className="shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium" style={{ color: r.cor, background: r.fundo }}>
      {s === 'em-dia' && dias !== undefined ? `volta em ${dias} ${dias === 1 ? 'dia' : 'dias'}` : r.texto}
    </span>
  )
}

/** Quantos treinos pedem atenção hoje (para o selo da trilha). */
export function useTreinosHoje() {
  const calculos = useMapa((s) => s.calculos)
  return useMemo(() => paraHoje(calculos, Date.now()).length, [calculos])
}

/** Linha de um treino: usada na tela de treino e na camada "Praticar" do tópico. */
export function LinhaTreino({ c, compacta = false }: { c: Calculo; compacta?: boolean }) {
  const p = useMapa((s) => s.calculos[c.id])
  const rascunho = useMapa((s) => temConteudo(s.desenvolvimentos[c.id]) && !s.desenvolvimentos[c.id].conferido)
  const agora = Date.now()
  const s = situacao(p, agora)
  const ultima = p?.tentativas[p.tentativas.length - 1]
  const fracos = pontosFracos(p)
  return (
    <a
      href={`#/treino/${c.id}`}
      className="flex items-center gap-3 rounded-2xl border border-[var(--linha)] bg-[var(--cartao)] px-4 py-3 transition hover:-translate-y-0.5 hover:shadow-[var(--sombra)]"
    >
      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-[var(--foco-claro)] text-base">🧮</span>
      <span className="min-w-0 flex-1">
        <span className="block font-medium text-[var(--tinta-forte)]">{c.titulo}</span>
        <span className="block text-xs text-[var(--tinta-suave)]">
          {c.fonte}
          {ultima && ` · última: ${ultima.acertos}/${ultima.total}`}
          {rascunho && <span className="text-[var(--foco)]"> · ✍ desenvolvimento em andamento</span>}
        </span>
        {!compacta && fracos.length > 0 && <span className="mt-0.5 block text-xs text-[#c2410c]">você costuma errar: {fracos.join(', ')}</span>}
      </span>
      <Situacao s={s} dias={p && s === 'em-dia' ? diasAte(p, agora) : undefined} />
    </a>
  )
}

export function TelaTreino() {
  const calculos = useMapa((s) => s.calculos)
  const hoje = paraHoje(calculos, Date.now())
  const feitos = CALCULOS.filter((c) => calculos[c.id]?.tentativas.length).length
  const porUnidade = useMemo(() => {
    const m = new Map<string, Calculo[]>()
    for (const c of CALCULOS) {
      const u = topicoPorId.get(c.topicos[0])!.unidade
      m.set(u, [...(m.get(u) ?? []), c])
    }
    return [...m.entries()]
  }, [])

  return (
    <motion.main
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      className="mx-auto max-w-2xl px-4 pb-24 pt-6 sm:px-6"
    >
      <nav className="mb-8 flex items-center gap-2">
        <a href="#/" className="botao-suave">
          ← trilha
        </a>
      </nav>
      <h1 className="text-3xl font-semibold text-[var(--tinta-forte)]">Treino de cálculo</h1>
      <p className="mt-2 text-[var(--tinta-suave)]">
        Dá para resolver passo a passo (cada passo confere na hora) ou escrever seu próprio desenvolvimento e conferir só as respostas no fim. Errou algum? O treino volta amanhã, com outros números. Acertou tudo? Ele volta cada vez mais espaçado (1, 3, 7, 14, 30 dias).
      </p>
      <p className="mt-3 text-sm text-[var(--tinta)]">
        <strong className="text-[var(--tinta-forte)]">{feitos}</strong> de {CALCULOS.length} já feitos pelo menos uma vez
      </p>

      {hoje.length > 0 && (
        <section className="mt-8">
          <h2 className="mb-3 text-xs font-semibold uppercase tracking-[0.16em] text-[#c2410c]">Para hoje · {hoje.length}</h2>
          <div className="space-y-2">
            {hoje.map((c) => (
              <LinhaTreino key={c.id} c={c} />
            ))}
          </div>
        </section>
      )}

      {porUnidade.map(([u, lista]) => (
        <section key={u} className="mt-8">
          <h2 className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-[var(--tinta-suave)]">
            <span className="h-2 w-2 rounded-full" style={{ background: unidade(u as never).cor }} />
            {unidade(u as never).titulo}
          </h2>
          <div className="space-y-2">
            {lista.map((c) => (
              <LinhaTreino key={c.id} c={c} />
            ))}
          </div>
        </section>
      ))}
    </motion.main>
  )
}

// ── resolver ────────────────────────────────────────────────────────

interface Resposta {
  texto: string
  /** acertou de primeira */
  deCara: boolean
  /** como terminou o passo */
  fim: 'acertou' | 'acertou-depois' | 'revelou'
}

function CartaoPasso({
  passo,
  indice,
  ativo,
  resposta,
  aoTerminar,
}: {
  passo: PassoCalculo
  indice: number
  ativo: boolean
  resposta?: Resposta
  aoTerminar: (r: Resposta) => void
}) {
  const [texto, setTexto] = useState('')
  const [errou, setErrou] = useState(false)
  const [aviso, setAviso] = useState('')
  const [dica, setDica] = useState(false)
  const entrada = useRef<HTMLInputElement>(null)
  const cartao = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!ativo) return
    cartao.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
    entrada.current?.focus({ preventScroll: true })
  }, [ativo])

  const enviar = () => {
    const ok = conferir(passo, texto)
    if (ok === null) return setAviso('Não entendi esse número. Use vírgula ou ponto (0,367), fração (2/3) ou %.')
    setAviso('')
    if (ok) aoTerminar({ texto, deCara: !errou, fim: errou ? 'acertou-depois' : 'acertou' })
    else setErrou(true)
  }

  const escolher = (i: number) => aoTerminar({ texto: passo.opcoes![i], deCara: i === passo.resposta, fim: i === passo.resposta ? 'acertou' : 'revelou' })

  const certoTexto = passo.opcoes ? passo.opcoes[passo.resposta] : null
  const feito = !!resposta
  const cor = !resposta ? 'var(--linha)' : resposta.deCara ? 'var(--menta)' : 'var(--coral)'

  return (
    <motion.div
      ref={cartao}
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: 'easeOut' }}
      className="rounded-3xl border-2 bg-[var(--cartao)] p-5 shadow-[var(--sombra)]"
      style={{ borderColor: ativo ? 'var(--foco)' : cor }}
    >
      <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-[var(--tinta-suave)]">
        <span className="grid h-6 w-6 place-items-center rounded-full text-[11px] text-white" style={{ background: ativo ? 'var(--foco)' : cor }}>
          {resposta ? (resposta.deCara ? '✓' : '✗') : indice + 1}
        </span>
        {passo.rotulo}
      </div>
      <p className="fonte-leitura text-[var(--tinta-forte)]">
        <Texto>{passo.pergunta}</Texto>
      </p>

      {ativo && !passo.opcoes && (
        <div className="mt-4">
          <form
            className="flex flex-wrap gap-2"
            onSubmit={(e) => {
              e.preventDefault()
              enviar()
            }}
          >
            <input
              ref={entrada}
              value={texto}
              onChange={(e) => {
                setTexto(e.target.value)
                setAviso('')
              }}
              inputMode="decimal"
              autoComplete="off"
              placeholder={passo.porcento ? 'ex.: 25%' : passo.casas === 0 ? 'ex.: 7' : 'ex.: 0,367'}
              aria-label={`Resposta: ${passo.rotulo}`}
              className="min-w-0 flex-1 rounded-2xl border-2 border-[var(--linha)] bg-[var(--papel)] px-4 py-2.5 text-lg text-[var(--tinta-forte)] outline-none focus:border-[var(--foco)]"
            />
            <button type="submit" className="botao-foco">
              conferir
            </button>
          </form>
          <AnimatePresence>
            {(errou || aviso) && (
              <motion.p initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="mt-2 text-sm text-[#c2410c]" role="status">
                {aviso || 'Ainda não bateu. Tenta de novo, pede uma dica ou vê a conta.'}
              </motion.p>
            )}
          </AnimatePresence>
          <div className="mt-3 flex flex-wrap gap-2 text-sm">
            {passo.dica && (
              <button className="botao-suave" onClick={() => setDica((d) => !d)}>
                💡 {dica ? 'esconder dica' : 'dica'}
              </button>
            )}
            <button className="botao-suave" onClick={() => aoTerminar({ texto: '—', deCara: false, fim: 'revelou' })}>
              não sei, mostrar a conta
            </button>
          </div>
          {dica && passo.dica && (
            <p className="mt-3 rounded-2xl bg-[var(--alerta-claro)] px-4 py-2.5 text-sm text-[var(--tinta)]">
              <Texto>{passo.dica}</Texto>
            </p>
          )}
        </div>
      )}

      {ativo && passo.opcoes && (
        <div className="mt-4 flex flex-wrap gap-2">
          {passo.opcoes.map((o, i) => (
            <button key={o} className="botao-suave text-base" onClick={() => escolher(i)}>
              {o}
            </button>
          ))}
        </div>
      )}

      {feito && (
        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} transition={{ duration: 0.35 }} className="overflow-hidden">
          <p className="mt-3 text-sm">
            {resposta.fim === 'revelou' && resposta.texto === '—' ? (
              <span className="text-[var(--tinta-suave)]">Sem problema: veja a conta e tente de novo amanhã.</span>
            ) : resposta.deCara ? (
              <span className="font-medium text-[var(--menta)]">Isso! Você respondeu {resposta.texto}.</span>
            ) : resposta.fim === 'acertou-depois' ? (
              <span className="font-medium text-[#c2410c]">Acertou na segunda: {resposta.texto}. Conta como erro, para voltar amanhã.</span>
            ) : (
              <span className="font-medium text-[#c2410c]">
                Você escolheu {resposta.texto}; o certo é {certoTexto}.
              </span>
            )}
          </p>
          {passo.conta && (
            <div className="mt-3 overflow-x-auto rounded-2xl bg-[var(--papel-2)] px-4 py-3 text-[var(--tinta-forte)]">
              <Tex latex={passo.conta} display />
            </div>
          )}
          {passo.explicacao && (
            <p className="mt-3 text-sm leading-relaxed text-[var(--tinta)]">
              <Texto>{passo.explicacao}</Texto>
            </p>
          )}
        </motion.div>
      )}
    </motion.div>
  )
}

export function ResolverCalculo({ id }: { id: string }) {
  const c = calculoPorId.get(id)!
  const progresso = useMapa((s) => s.calculos[id])
  const registrar = useMapa((s) => s.registrarCalculo)
  // primeira vez: números do material; depois, números novos
  const [seed, setSeed] = useState(() => (progresso?.tentativas.length ? 1 + Math.floor(Math.random() * 1e9) : 0))
  const [respostas, setRespostas] = useState<Resposta[]>([])
  const [rodada, setRodada] = useState(0)
  const inst = useMemo(() => c.gerar(seed), [c, seed])
  const fim = respostas.length === inst.passos.length
  const acertos = respostas.filter((r) => r.deCara).length
  const registrado = useRef(false)

  useEffect(() => {
    if (!fim || registrado.current) return
    registrado.current = true
    registrar(id, {
      em: Date.now(),
      seed,
      acertos,
      total: inst.passos.length,
      errados: inst.passos.filter((_, i) => !respostas[i].deCara).map((p) => p.rotulo),
    })
  }, [fim, acertos, id, inst, registrar, respostas, seed])

  const recomecar = (novos: boolean) => {
    registrado.current = false
    setRespostas([])
    setRodada((r) => r + 1)
    if (novos) setSeed(1 + Math.floor(Math.random() * 1e9))
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const perfeito = fim && acertos === inst.passos.length
  const ultima = progresso?.tentativas[progresso.tentativas.length - 1]
  const dias = progresso ? diasAte(progresso, Date.now()) : 0

  return (
    <motion.main
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      className="mx-auto max-w-2xl px-4 pb-32 pt-6 sm:px-6"
    >
      <nav className="sticky top-[env(safe-area-inset-top,0px)] z-10 -mx-4 mb-6 flex items-center gap-2 bg-[var(--papel)]/90 px-4 py-2 backdrop-blur sm:-mx-6 sm:px-6">
        <a href="#/treino" className="botao-suave">
          ← treinos
        </a>
        <BotaoCalculadora />
        <div className="ml-auto flex gap-1" aria-label={`${respostas.length} de ${inst.passos.length} passos`}>
          {inst.passos.map((_, i) => (
            <span
              key={i}
              className="h-2 w-5 rounded-full transition-colors"
              style={{ background: respostas[i] ? (respostas[i].deCara ? 'var(--menta)' : 'var(--coral)') : i === respostas.length ? 'var(--foco)' : 'var(--linha)' }}
            />
          ))}
        </div>
      </nav>

      <p className="text-xs uppercase tracking-[0.16em] text-[var(--tinta-suave)]">
        {seed === 0 ? `números da ${c.fonte}` : `versão nova · baseada na ${c.fonte}`}
      </p>
      <h1 className="mt-1 text-3xl font-semibold text-[var(--tinta-forte)]">{c.titulo}</h1>
      <div className="mt-2 flex flex-wrap gap-1.5">
        {c.topicos.map((t) => (
          <a key={t} href={`#/t/${t}`} className="rounded-full bg-[var(--papel-2)] px-2.5 py-0.5 text-xs text-[var(--tinta)] hover:bg-[var(--linha)]">
            {topicoPorId.get(t)?.titulo}
          </a>
        ))}
      </div>

      <TrocaModo id={id} livre={false} />

      <div className="mt-6 whitespace-pre-line rounded-3xl bg-[var(--foco-claro)] p-5 font-medium leading-relaxed text-[var(--tinta-forte)]">
        <Texto>{inst.enunciado}</Texto>
      </div>

      <div className="mt-5 space-y-4" key={rodada}>
        {inst.passos.slice(0, respostas.length + 1).map((p, i) => (
          <CartaoPasso key={`${seed}-${i}`} passo={p} indice={i} ativo={i === respostas.length} resposta={respostas[i]} aoTerminar={(r) => setRespostas((rs) => [...rs, r])} />
        ))}
      </div>

      {fim && (
        <motion.section
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2, type: 'spring', stiffness: 200, damping: 20 }}
          className="mt-6 rounded-3xl p-6 text-center"
          style={{ background: perfeito ? 'var(--menta-claro)' : 'var(--alerta-claro)' }}
        >
          <p className="text-4xl">{perfeito ? '🎉' : '💪'}</p>
          <p className="mt-2 text-2xl font-semibold text-[var(--tinta-forte)]">
            {acertos} de {inst.passos.length} de primeira
          </p>
          <p className="mt-1 text-[var(--tinta)]">
            {perfeito
              ? `Volta ${dias <= 1 ? 'amanhã' : `em ${dias} dias`} para fixar.`
              : `Ficou registrado. Este treino volta amanhã com outros números${ultima?.errados.length ? `; atenção em: ${ultima.errados.join(', ')}` : ''}.`}
          </p>
          {inst.conclusao && (
            <p className="mx-auto mt-4 max-w-md text-sm leading-relaxed text-[var(--tinta)]">
              <Texto>{inst.conclusao}</Texto>
            </p>
          )}
          <div className="mt-5 flex flex-wrap justify-center gap-2">
            <button className="botao-foco" onClick={() => recomecar(true)}>
              refazer com outros números
            </button>
            <button className="botao-suave" onClick={() => recomecar(false)}>
              mesmos números
            </button>
            <a className="botao-suave" href="#/treino">
              outros treinos
            </a>
          </div>
        </motion.section>
      )}
    </motion.main>
  )
}

export const treinoExiste = (id: string) => calculoPorId.has(id)
