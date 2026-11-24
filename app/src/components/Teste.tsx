import { AnimatePresence, motion } from 'framer-motion'
import { useMemo, useState } from 'react'
import { embaralhar } from '../content/preteste'
import type { QAberta, QEscolha, QNumero, QVF, Questao } from '../content/questoes'
import { topicoPorId } from '../content/topicos'
import { abertaCerta, chaveTeste, forcaDoTopico, montarAbertura, montarFechamento, montarGeral, montarRelembrar, questoesPara, type Certeza, type Momento, type Opcoes, type ResultadoTeste } from '../lib/teste'
import { conferir } from '../lib/treino'
import { useMapa } from '../store/useMapa'
import { Tex } from './FormulaAnimada'
import { Texto } from './Texto'

const NIVEL = { 1: 'fácil', 2: 'médio', 3: 'difícil' } as const
const COR_NIVEL = { 1: 'var(--menta)', 2: 'var(--foco)', 3: 'var(--alerta)' } as const

const CERTEZAS: { id: Certeza; texto: string }[] = [
  { id: 'certeza', texto: 'Tenho certeza' },
  { id: 'acho', texto: 'Acho que é' },
  { id: 'chute', texto: 'Chutei' },
]

interface Resposta {
  certa: boolean
  certeza: Certeza
}

interface Props {
  questoes: Questao[]
  momento: Momento
  /** chave onde o resultado é guardado */
  chave: string
  titulo: string
  intro?: string
  /** chamado no fim (ou ao pular), com o resultado se houve respostas */
  terminar: (r: ResultadoTeste | null) => void
  /** pede outro sorteio de questões */
  refazer?: () => void
  textoFim?: string
}

/** Um teste: questões do fácil ao difícil, uma de cada vez, com explicação depois de cada resposta. */
export function Teste({ questoes, momento, chave, titulo, intro, terminar, refazer, textoFim }: Props) {
  const responderQuestao = useMapa((s) => s.responderQuestao)
  const registrarTeste = useMapa((s) => s.registrarTeste)
  const [atual, setAtual] = useState(0)
  const [respostas, setRespostas] = useState<Resposta[]>([])
  const [fim, setFim] = useState<ResultadoTeste | null>(null)

  if (!questoes.length) return null
  const abertura = momento === 'abertura'

  const responder = (q: Questao, certa: boolean, certeza: Certeza) => {
    responderQuestao(q.id, certa, certeza)
    setRespostas((r) => Object.assign([...r], { [atual]: { certa, certeza } }))
  }

  const fechar = () => {
    const porTopico: Record<string, [number, number]> = {}
    questoes.forEach((q, i) => {
      const r = respostas[i]
      if (!r) return
      const [a, t] = porTopico[q.topico] ?? [0, 0]
      porTopico[q.topico] = [a + (r.certa ? 1 : 0), t + 1]
    })
    const feitas = questoes.filter((_, i) => respostas[i])
    const res: ResultadoTeste = {
      em: Date.now(),
      acertos: respostas.filter((r) => r?.certa).length,
      total: feitas.length,
      porTopico,
      errados: questoes.filter((_, i) => respostas[i] && !respostas[i].certa).map((q) => q.id),
      confiantesErrados: questoes.filter((_, i) => respostas[i] && !respostas[i].certa && respostas[i].certeza === 'certeza').map((q) => q.id),
    }
    if (res.total) registrarTeste(chave, res)
    if (abertura) return terminar(res.total ? res : null)
    setFim(res)
  }

  const seguir = () => (atual < questoes.length - 1 ? setAtual(atual + 1) : fechar())
  const q = questoes[atual]
  const r = respostas[atual]

  return (
    <motion.section
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="mt-10 rounded-3xl border-2 border-dashed border-[var(--linha)] bg-[var(--cartao)] px-5 py-6 sm:px-8"
      aria-label={titulo}
    >
      {fim ? (
        <Resumo
          res={fim}
          questoes={questoes}
          refazer={
            refazer &&
            (() => {
              setFim(null)
              setAtual(0)
              setRespostas([])
              refazer()
            })
          }
          fechar={() => terminar(fim)}
          textoFim={textoFim}
        />
      ) : (
        <>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--tinta-suave)]">
              {titulo} · {atual + 1} de {questoes.length}
            </div>
            <button className="text-xs text-[var(--tinta-suave)] hover:underline" onClick={() => (respostas.some(Boolean) ? fechar() : terminar(null))}>
              {respostas.some(Boolean) ? 'parar aqui' : 'pular'}
            </button>
          </div>
          <Barra total={questoes.length} respostas={respostas} atual={atual} />
          {atual === 0 && !r && intro && <p className="mt-3 text-sm text-[var(--tinta-suave)]">{intro}</p>}

          <AnimatePresence mode="wait">
            <motion.div key={atual} initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -16 }} transition={{ duration: 0.18 }}>
              <div className="mt-5 flex flex-wrap items-center gap-2 text-[11px]">
                <span className="rounded-full px-2 py-0.5 font-semibold text-white" style={{ background: COR_NIVEL[q.nivel] }}>
                  {NIVEL[q.nivel]}
                </span>
                {momento === 'geral' && <span className="text-[var(--tinta-suave)]">{topicoPorId.get(q.topico)?.titulo}</span>}
                {q.fonte && <span className="text-[var(--tinta-suave)]">· {q.fonte}</span>}
              </div>
              <div className="fonte-leitura mt-2 whitespace-pre-line font-medium leading-relaxed text-[var(--tinta-forte)]">
                <Texto>{q.enunciado}</Texto>
              </div>
              {q.tipo === 'escolha' && <Escolha q={q} abertura={abertura} r={r} responder={(c, k) => responder(q, c, k)} />}
              {q.tipo === 'vf' && <VF q={q} abertura={abertura} r={r} responder={(c, k) => responder(q, c, k)} />}
              {q.tipo === 'numero' && <Numero q={q} abertura={abertura} r={r} responder={(c, k) => responder(q, c, k)} />}
              {q.tipo === 'aberta' && <Aberta q={q} r={r} responder={(c) => responder(q, c, 'acho')} />}

              {r && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-4">
                  <p className="text-sm font-semibold" style={{ color: r.certa ? 'var(--menta)' : 'var(--alerta)' }}>
                    {r.certa ? (r.certeza === 'chute' ? 'Certo, mas foi chute: vale rever.' : 'Certo!') : abertura ? 'Ainda não era para saber. Leia procurando isto.' : r.certeza === 'certeza' ? 'Errou com certeza: este é o erro que mais importa corrigir.' : 'Não foi dessa vez.'}
                  </p>
                  {q.explicacao && (
                    <p className="mt-1 text-sm leading-relaxed text-[var(--tinta)]">
                      <Texto>{q.explicacao}</Texto>
                    </p>
                  )}
                  <button className="botao-foco mt-4" onClick={seguir}>
                    {atual < questoes.length - 1 ? 'Próxima →' : abertura ? 'Agora sim, ler o tópico ↓' : 'Ver resultado'}
                  </button>
                </motion.div>
              )}
            </motion.div>
          </AnimatePresence>
        </>
      )}
    </motion.section>
  )
}

function Barra({ total, respostas, atual }: { total: number; respostas: Resposta[]; atual: number }) {
  return (
    <div className="mt-3 flex gap-1" aria-hidden>
      {Array.from({ length: total }, (_, i) => {
        const r = respostas[i]
        const cor = r ? (r.certa ? 'var(--menta)' : 'var(--alerta)') : i === atual ? 'var(--foco)' : 'var(--linha)'
        return <span key={i} className="h-1.5 flex-1 rounded-full" style={{ background: cor }} />
      })}
    </div>
  )
}

/** Botões de confiança: escolher um deles confirma a resposta. Na abertura, só "Responder". */
function Confirmar({ abertura, pronto, confirmar }: { abertura: boolean; pronto: boolean; confirmar: (c: Certeza) => void }) {
  if (abertura)
    return (
      <button className="botao-foco mt-4" disabled={!pronto} onClick={() => confirmar('chute')}>
        Responder
      </button>
    )
  return (
    <div className="mt-4">
      <div className="text-xs text-[var(--tinta-suave)]">{pronto ? 'Quão segura você está?' : 'Escolha uma resposta e diga quão segura você está.'}</div>
      <div className="mt-2 flex flex-wrap gap-2">
        {CERTEZAS.map((c) => (
          <button key={c.id} disabled={!pronto} onClick={() => confirmar(c.id)} className={c.id === 'certeza' ? 'botao-foco' : 'botao-suave'}>
            {c.texto}
          </button>
        ))}
      </div>
    </div>
  )
}

function Escolha({ q, abertura, r, responder }: { q: QEscolha; abertura: boolean; r?: Resposta; responder: (certa: boolean, c: Certeza) => void }) {
  const ordem = useMemo(() => embaralhar(q.opcoes.map((_, i) => i), q.id + q.enunciado.length), [q])
  const [marcada, setMarcada] = useState<number | null>(null)
  const respondeu = !!r
  return (
    <>
      <div className="mt-3 space-y-2">
        {ordem.map((i) => {
          const o = q.opcoes[i]
          const certa = i === 0
          const estilo = !respondeu
            ? marcada === i
              ? 'border-[var(--foco)] bg-[var(--foco-claro)]'
              : 'border-[var(--linha)] hover:border-[var(--foco)]'
            : certa
              ? 'border-[var(--menta)] bg-[var(--menta-claro)]'
              : i === marcada
                ? 'border-[var(--alerta)] bg-[var(--alerta-claro)]'
                : 'border-[var(--linha)] opacity-70'
          return (
            <button
              key={i}
              disabled={respondeu}
              onClick={() => setMarcada(i)}
              className={`block w-full overflow-x-auto rounded-2xl border-2 px-4 py-3 text-left text-[0.95em] leading-relaxed text-[var(--tinta)] transition-colors ${estilo}`}
            >
              <Texto>{o.texto}</Texto>
              {respondeu && certa && <span className="ml-2 font-semibold text-[var(--menta)]">← certa</span>}
              {respondeu && !certa && o.porque && (
                <span className="mt-1 block text-[0.88em] text-[var(--tinta-suave)]">
                  <Texto>{o.porque}</Texto>
                </span>
              )}
            </button>
          )
        })}
      </div>
      {!respondeu && <Confirmar abertura={abertura} pronto={marcada !== null} confirmar={(c) => responder(marcada === 0, c)} />}
    </>
  )
}

function VF({ q, abertura, r, responder }: { q: QVF; abertura: boolean; r?: Resposta; responder: (certa: boolean, c: Certeza) => void }) {
  const [marcas, setMarcas] = useState<(boolean | undefined)[]>([])
  const respondeu = !!r
  const pronto = q.afirmacoes.every((_, i) => marcas[i] !== undefined)
  return (
    <>
      <div className="mt-3 space-y-2">
        {q.afirmacoes.map((a, i) => {
          const m = marcas[i]
          const acertou = respondeu && m === a.v
          return (
            <div
              key={i}
              className={`rounded-2xl border-2 px-4 py-3 text-[0.95em] leading-relaxed ${respondeu ? (acertou ? 'border-[var(--menta)] bg-[var(--menta-claro)]' : 'border-[var(--alerta)] bg-[var(--alerta-claro)]') : 'border-[var(--linha)]'}`}
            >
              <div className="flex items-start gap-3">
                <div className="flex shrink-0 gap-1">
                  {[true, false].map((v) => (
                    <button
                      key={String(v)}
                      disabled={respondeu}
                      onClick={() => setMarcas((ms) => Object.assign([...ms], { [i]: v }))}
                      className={`h-8 w-8 rounded-full border-2 text-xs font-bold ${m === v ? 'border-[var(--foco)] bg-[var(--foco)] text-white' : 'border-[var(--linha)] text-[var(--tinta-suave)]'}`}
                      aria-label={v ? 'verdadeiro' : 'falso'}
                    >
                      {v ? 'V' : 'F'}
                    </button>
                  ))}
                </div>
                <div className="text-[var(--tinta)]">
                  <Texto>{a.texto}</Texto>
                  {respondeu && (
                    <span className="mt-1 block text-[0.88em] text-[var(--tinta-suave)]">
                      <strong>{a.v ? 'Verdadeira.' : 'Falsa.'}</strong> <Texto>{a.porque}</Texto>
                    </span>
                  )}
                </div>
              </div>
            </div>
          )
        })}
      </div>
      {!respondeu && <Confirmar abertura={abertura} pronto={pronto} confirmar={(c) => responder(q.afirmacoes.every((a, i) => marcas[i] === a.v), c)} />}
    </>
  )
}

function Numero({ q, abertura, r, responder }: { q: QNumero; abertura: boolean; r?: Resposta; responder: (certa: boolean, c: Certeza) => void }) {
  const [texto, setTexto] = useState('')
  const passo = { rotulo: '', pergunta: '', resposta: q.resposta, casas: q.casas, porcento: q.porcento }
  const valido = conferir(passo, texto) !== null
  const casas = q.casas ?? 3
  return (
    <>
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <input
          value={texto}
          disabled={!!r}
          onChange={(e) => setTexto(e.target.value)}
          inputMode="decimal"
          placeholder="ex.: 0,25 ou 1/4"
          className="w-40 rounded-xl border-2 border-[var(--linha)] bg-[var(--papel)] px-3 py-2 text-[var(--tinta-forte)] outline-none focus:border-[var(--foco)]"
        />
        {!r && texto && !valido && <span className="text-xs text-[var(--alerta)]">não entendi esse número</span>}
        {!r && <span className="text-xs text-[var(--tinta-suave)]">aceita vírgula, ponto, fração e %</span>}
      </div>
      {r && (
        <div className="mt-3 overflow-x-auto text-sm text-[var(--tinta)]">
          Resposta: <strong>{q.porcento ? `${q.resposta.toLocaleString('pt-BR', { maximumFractionDigits: casas })}%` : q.resposta.toLocaleString('pt-BR', { maximumFractionDigits: casas })}</strong>
          {q.conta && (
            <div className="mt-2">
              <Tex latex={q.conta} display />
            </div>
          )}
        </div>
      )}
      {!r && <Confirmar abertura={abertura} pronto={valido} confirmar={(c) => responder(!!conferir(passo, texto), c)} />}
    </>
  )
}

/** Discursiva: você escreve, depois marca o que a sua resposta cobriu e compara com a resposta-modelo. */
function Aberta({ q, r, responder }: { q: QAberta; r?: Resposta; responder: (certa: boolean) => void }) {
  const salva = useMapa((s) => s.abertas[q.id])
  const salvar = useMapa((s) => s.salvarAberta)
  const [texto, setTexto] = useState(salva?.texto ?? '')
  const [vendo, setVendo] = useState(false)
  const [marcados, setMarcados] = useState<number[]>(salva?.marcados ?? [])

  const alternar = (i: number) => setMarcados((m) => (m.includes(i) ? m.filter((x) => x !== i) : [...m, i]))

  return (
    <div className="mt-3">
      <textarea
        value={texto}
        onChange={(e) => setTexto(e.target.value)}
        onBlur={() => texto.trim() && salvar(q.id, texto, marcados)}
        rows={6}
        disabled={!!r}
        placeholder="Escreva como escreveria na prova. Fica guardado."
        className="fonte-leitura w-full rounded-2xl border-2 border-[var(--linha)] bg-[var(--papel)] px-4 py-3 text-[var(--tinta-forte)] outline-none focus:border-[var(--foco)]"
      />
      {salva && !vendo && !r && <div className="mt-1 text-xs text-[var(--tinta-suave)]">Sua resposta anterior foi carregada. Edite se quiser.</div>}
      {!vendo && !r && (
        <button className="botao-foco mt-3" disabled={!texto.trim()} onClick={() => (salvar(q.id, texto, marcados), setVendo(true))}>
          Conferir com o checklist
        </button>
      )}
      {(vendo || r) && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-4 space-y-4">
          <div>
            <div className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--tinta-suave)]">O que a sua resposta cobriu? Marque com honestidade.</div>
            <div className="mt-2 space-y-1.5">
              {q.pontos.map((p, i) => (
                <label key={i} className="flex cursor-pointer items-start gap-2 text-sm text-[var(--tinta)]">
                  <input type="checkbox" disabled={!!r} checked={marcados.includes(i)} onChange={() => alternar(i)} className="mt-1 accent-[var(--foco)]" />
                  <span>
                    <Texto>{p}</Texto>
                  </span>
                </label>
              ))}
            </div>
          </div>
          <div className="rounded-2xl bg-[var(--papel-2)] px-4 py-3">
            <div className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--tinta-suave)]">Resposta-modelo (minha, não é gabarito oficial)</div>
            <p className="fonte-leitura mt-1 text-[0.95em] leading-relaxed text-[var(--tinta)]">
              <Texto>{q.modelo}</Texto>
            </p>
          </div>
          {!r && (
            <button className="botao-foco" onClick={() => (salvar(q.id, texto, marcados), responder(abertaCerta(marcados.length, q.pontos.length)))}>
              Pronto ({marcados.length} de {q.pontos.length})
            </button>
          )}
        </motion.div>
      )}
    </div>
  )
}

function Resumo({ res, questoes, refazer, fechar, textoFim }: { res: ResultadoTeste; questoes: Questao[]; refazer?: () => void; fechar: () => void; textoFim?: string }) {
  const pct = res.total ? Math.round((res.acertos / res.total) * 100) : 0
  const fracos = Object.entries(res.porTopico)
    .filter(([, [a, t]]) => a / t < 0.7)
    .sort((x, y) => x[1][0] / x[1][1] - y[1][0] / y[1][1])
  const porId = new Map(questoes.map((q) => [q.id, q]))
  const recado = pct >= 85 ? 'Muito bom. Volte daqui a alguns dias para ver se ficou.' : pct >= 60 ? 'Bom caminho. Releia os pontos que errou antes de seguir.' : 'Ainda frágil. Vale reler a explicação e refazer com outras questões.'
  return (
    <div>
      <div className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--tinta-suave)]">resultado</div>
      <div className="mt-2 flex items-baseline gap-3">
        <span className="text-4xl font-bold text-[var(--tinta-forte)]">
          {res.acertos}/{res.total}
        </span>
        <span className="text-sm text-[var(--tinta-suave)]">{pct}%</span>
      </div>
      <p className="mt-2 text-sm text-[var(--tinta)]">{recado}</p>

      {res.confiantesErrados.length > 0 && (
        <div className="mt-4 rounded-2xl border-2 border-[var(--alerta)] bg-[var(--alerta-claro)] px-4 py-3 text-sm text-[var(--tinta)]">
          <strong>Errou com certeza ({res.confiantesErrados.length}):</strong> são as ideias erradas que você acha que sabe. Comece por elas.
          <ul className="mt-1 list-disc pl-5">
            {res.confiantesErrados.map((id) => (
              <li key={id}>
                <Texto>{resumir(porId.get(id)?.enunciado ?? id)}</Texto>
              </li>
            ))}
          </ul>
        </div>
      )}

      {fracos.length > 0 && Object.keys(res.porTopico).length > 1 && (
        <div className="mt-4 text-sm text-[var(--tinta)]">
          <strong>Tópicos para reforçar:</strong>{' '}
          {fracos.map(([id, [a, t]], i) => (
            <span key={id}>
              {i > 0 && ', '}
              <a className="underline decoration-dotted" href={`#/t/${id}`}>
                {topicoPorId.get(id)?.titulo ?? id}
              </a>{' '}
              ({a}/{t})
            </span>
          ))}
        </div>
      )}

      <div className="mt-5 flex flex-wrap gap-2">
        <button className="botao-foco" onClick={fechar}>
          {textoFim ?? 'Fechar'}
        </button>
        {refazer && (
          <button className="botao-suave" onClick={refazer}>
            Refazer com outras questões
          </button>
        )}
      </div>
    </div>
  )
}

/** primeira frase do enunciado, sem cortar dentro de $…$ */
function resumir(t: string) {
  const linha = t.split('\n').pop() ?? t
  return linha.length > 140 ? `${linha.slice(0, linha.lastIndexOf(' ', 137))}…` : linha
}

const semente = () => Date.now() % 1_000_000

function quando(em: number) {
  const dias = Math.floor((Date.now() - em) / 86_400_000)
  return dias <= 0 ? 'hoje' : dias === 1 ? 'ontem' : `há ${dias} dias`
}

/** Monta as questões uma vez (e de novo ao refazer), com o histórico e o limite das configurações. */
function TesteMontado({ montar, ...props }: Omit<Props, 'questoes' | 'refazer'> & { montar: (o: Opcoes) => Questao[] }) {
  const pegar = () => {
    const s = useMapa.getState()
    return montar({ max: s.estudo.questoesTeste, semente: semente(), historico: s.questoes, agora: Date.now() })
  }
  const [questoes, setQuestoes] = useState(pegar)
  return <Teste {...props} questoes={questoes} refazer={() => setQuestoes(pegar())} />
}

/** Abertura do tópico: até 3 questões antes de ler. Errar é esperado. */
export function TesteAbertura({ id, terminar }: { id: string; terminar: () => void }) {
  return (
    <TesteMontado
      montar={(o) => montarAbertura(id, o)}
      momento="abertura"
      chave={chaveTeste('abertura', id)}
      titulo="Antes de ler"
      intro="Mesmo sem saber: errar aqui é esperado."
      terminar={terminar}
    />
  )
}

/** Fim do tópico: o teste de fechamento, do fácil ao difícil, com a última nota. */
export function FecharTopico({ id }: { id: string }) {
  const ultimo = useMapa((s) => s.testes[chaveTeste('fechamento', id)])
  const max = useMapa((s) => s.estudo.questoesTeste)
  const [fazendo, setFazendo] = useState(false)
  const todas = questoesPara(id, 0)
  const temAberta = todas.some((q) => q.tipo === 'aberta')
  if (!todas.length) return null
  if (fazendo)
    return (
      <TesteMontado
        montar={(o) => montarFechamento(id, o)}
        momento="fechamento"
        chave={chaveTeste('fechamento', id)}
        titulo="Teste de fechamento"
        terminar={() => setFazendo(false)}
        textoFim="Voltar ao tópico"
      />
    )
  return (
    <div className="rounded-2xl border-2 border-dashed border-[var(--linha)] px-4 py-4 text-left">
      <div className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--tinta-suave)]">Fechar o tópico</div>
      <p className="mt-1 text-sm text-[var(--tinta)]">
        Sem olhar o texto: até {max} questões, do fácil ao difícil{temAberta ? ', com uma discursiva no fim' : ''}. As que você errou voltam primeiro da próxima vez.
      </p>
      <div className="mt-3 flex flex-wrap items-center gap-3">
        <button className="botao-foco" onClick={() => setFazendo(true)}>
          {ultimo ? 'Refazer o teste' : 'Fazer o teste'}
        </button>
        {ultimo && (
          <span className="text-xs text-[var(--tinta-suave)]">
            última vez: <strong className="text-[var(--tinta-forte)]">{ultimo.acertos}/{ultimo.total}</strong> {quando(ultimo.em)}
          </span>
        )}
      </div>
    </div>
  )
}

/** Teste geral de uma aba: questões de todos os tópicos dela, começando pelos mais fracos. */
export function TesteDaAba({ abaId, nome, topicos }: { abaId: string; nome: string; topicos: string[] }) {
  const ultimo = useMapa((s) => s.testes[chaveTeste('geral', abaId)])
  const max = useMapa((s) => s.estudo.questoesTeste)
  const [fazendo, setFazendo] = useState(false)
  if (!topicos.length) return null
  if (fazendo)
    return (
      <TesteMontado
        key={abaId}
        montar={(o) => {
          const hist = useMapa.getState().questoes
          return montarGeral(topicos, Object.fromEntries(topicos.map((t) => [t, forcaDoTopico(t, hist)])), o)
        }}
        momento="geral"
        chave={chaveTeste('geral', abaId)}
        titulo={`Teste geral · ${nome}`}
        terminar={() => setFazendo(false)}
        textoFim="Fechar"
      />
    )
  return (
    <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 rounded-2xl border border-[var(--linha)] bg-[var(--cartao)] px-4 py-3 text-sm">
      <span className="min-w-0 flex-1 text-[var(--tinta)]">
        <strong className="text-[var(--tinta-forte)]">Teste geral de {nome}</strong>
        <span className="block text-xs text-[var(--tinta-suave)]">
          {max} questões · {topicos.length} tópicos.
          {ultimo && (
            <>
              {' '}
              Última vez: <strong>{ultimo.acertos}/{ultimo.total}</strong> {quando(ultimo.em)}.
            </>
          )}
        </span>
      </span>
      {/* secundário: na trilha, o botão principal é o "continuar" */}
      <button className="botao-suave" onClick={() => setFazendo(true)}>
        {ultimo ? 'Refazer' : 'Começar'}
      </button>
    </div>
  )
}

/** Revisita: 3 questões sem olhar. O resultado decide se o tópico sobe um degrau ou recomeça. */
export function TesteRelembrar({ id, terminar }: { id: string; terminar: (r: ResultadoTeste | null) => void }) {
  return (
    <TesteMontado
      montar={(o) => montarRelembrar(id, o)}
      momento="relembrar"
      chave={chaveTeste('relembrar', id)}
      titulo="Relembrar"
      intro="Sem olhar o texto. Acertar 2 de 3 conta como lembrei."
      terminar={terminar}
      textoFim="Continuar"
    />
  )
}
