import { motion } from 'framer-motion'
import { useEffect, useMemo, useRef, useState, type KeyboardEvent, type ReactNode } from 'react'
import { calculoPorId, type PassoCalculo } from '../content/calculos'
import { topicoPorId } from '../content/topicos'
import {
  caixa,
  copiarFolha,
  esperado,
  folhaComConteudo,
  folhasDe,
  inserir,
  listaDe,
  mudarValor,
  novaFolha,
  novaLinha,
  novoDesenvolvimento,
  novoIdPeca,
  ondeEsta,
  proximoNome,
  removerPeca,
  type Desenvolvimento,
  type Folha,
  type Linha,
  type Lugar,
  type Op,
  type Peca,
} from '../lib/desenvolvimento'
import { conferir, diasAte } from '../lib/treino'
import { useMapa } from '../store/useMapa'
import { BotaoCalculadora } from './Calculadora'
import { Tex } from './FormulaAnimada'
import { Texto } from './Texto'

/** Troca entre resolver passo a passo (confere cada passo) e escrever o próprio desenvolvimento. */
export function TrocaModo({ id, livre }: { id: string; livre: boolean }) {
  const item = (ativo: boolean, href: string, texto: string, titulo: string) => (
    <a
      href={href}
      title={titulo}
      aria-current={ativo ? 'page' : undefined}
      className={`rounded-full px-3.5 py-1.5 text-sm transition ${ativo ? 'bg-[var(--cartao)] font-medium text-[var(--tinta-forte)] shadow-sm' : 'text-[var(--tinta-suave)] hover:text-[var(--tinta-forte)]'}`}
    >
      {texto}
    </a>
  )
  return (
    <div className="mt-4 inline-flex flex-wrap gap-1 rounded-full bg-[var(--papel-2)] p-1" role="navigation" aria-label="jeito de resolver">
      {item(!livre, `#/treino/${id}`, 'passo a passo', 'cada passo pede um número e confere na hora')}
      {item(livre, `#/treino/${id}/livre`, '✍ escrever meu desenvolvimento', 'você monta a conta do seu jeito; no fim, confere só as respostas')}
    </div>
  )
}

// ── editor ──────────────────────────────────────────────────────────

/** Onde entra a próxima peça. */
const Marca = () => <span className="mx-0.5 inline-block h-7 w-0.5 animate-pulse rounded bg-[var(--foco)] align-middle" aria-hidden />

interface Cursor {
  lugar: Lugar
  /** a peça depois da qual entra a próxima (null = no começo do lugar) */
  depois: string | null
}

const BINARIAS: Op[] = ['+', '−', '×', '÷', '=', '≈']
const TECLA_OP: Record<string, Op> = { '+': '+', '*': '×', '=': '=', '(': '(', ')': ')' }

function Ferramenta({ children, titulo, onClick, desligada }: { children: ReactNode; titulo: string; onClick: () => void; desligada?: boolean }) {
  return (
    <button
      type="button"
      title={titulo}
      aria-label={titulo}
      disabled={desligada}
      // não tira o foco da caixa em que você está escrevendo
      onPointerDown={(e) => e.preventDefault()}
      onClick={onClick}
      className="grid h-9 min-w-9 place-items-center rounded-xl bg-[var(--papel)] px-2 text-[15px] text-[var(--tinta-forte)] transition hover:bg-[var(--foco-claro)] hover:text-[var(--foco)] active:scale-95 disabled:opacity-35 disabled:hover:bg-[var(--papel)] disabled:hover:text-[var(--tinta-forte)]"
    >
      {children}
    </button>
  )
}

function Editor({ linhas, mudar }: { linhas: Linha[]; mudar: (f: (l: Linha[]) => Linha[]) => void }) {
  const primeira = linhas[0]
  const [cursor, setCursor] = useState<Cursor>(() => ({ lugar: { dono: primeira.id, lado: 'a' }, depois: primeira.a[primeira.a.length - 1]?.id ?? null }))
  /** caixa que deve ganhar o foco assim que aparecer na tela */
  const focar = useRef<string | null>(null)
  const setFocar = (id: string) => {
    focar.current = id
  }
  /** a área das linhas: fica com o foco quando o cursor não está numa caixa (depois de um ")" ou de sair de uma fração) */
  const area = useRef<HTMLOListElement>(null)
  const FORA = '__area__'

  useEffect(() => {
    if (!focar.current) return
    if (focar.current === FORA) area.current?.focus({ preventScroll: true })
    else {
      const el = document.getElementById(`cx-${focar.current}`) as HTMLInputElement | null
      if (el) {
        el.focus()
        el.setSelectionRange(el.value.length, el.value.length)
      } else area.current?.focus({ preventScroll: true }) // a peça antes não é caixa (operação, fração…)
    }
    focar.current = null
  })

  const linhaIds = useMemo(() => new Set(linhas.map((l) => l.id)), [linhas])
  const dentroDeEstrutura = !linhaIds.has(cursor.lugar.dono)

  /** Põe peças onde está o cursor e decide para onde ele vai. */
  const por = (novas: Peca[], foco: string | null, depois: Cursor | null) => {
    // cursor num lugar que não existe mais (linha apagada): escreve no fim da última linha
    const ultima = linhas[linhas.length - 1]
    const valido = listaDe(linhas, cursor.lugar) !== null
    const lugar = valido ? cursor.lugar : { dono: ultima.id, lado: 'a' as const }
    const apos = valido ? cursor.depois : (ultima.a[ultima.a.length - 1]?.id ?? null)
    mudar((ls) => inserir(ls, lugar, apos, novas))
    if (depois && !valido && depois.lugar.dono === cursor.lugar.dono) depois = { lugar, depois: depois.depois }
    if (depois) setCursor(depois)
    setFocar(foco ?? FORA)
  }
  const porCaixa = (v = '') => {
    const cx = caixa(v)
    por([cx], cx.id, { lugar: cursor.lugar, depois: cx.id })
  }
  const porOp = (op: Op) => {
    const p: Peca = { id: novoIdPeca(), t: 'op', v: op }
    if (op === ')') return por([p], null, { lugar: cursor.lugar, depois: p.id })
    const cx = caixa()
    por([p, cx], cx.id, { lugar: cursor.lugar, depois: cx.id })
  }
  const porFracao = () => {
    const a = caixa()
    const p: Peca = { id: novoIdPeca(), t: 'frac', a: [a], b: [caixa()] }
    por([p], a.id, { lugar: { dono: p.id, lado: 'a' }, depois: a.id })
  }
  const porDentro = (t: 'raiz' | 'pot') => {
    const a = caixa()
    const p: Peca = { id: novoIdPeca(), t, a: [a] }
    por([p], a.id, { lugar: { dono: p.id, lado: 'a' }, depois: a.id })
  }
  /** Sai da fração/raiz/potência: o cursor vai para logo depois dela. */
  const sair = () => {
    const onde = ondeEsta(linhas, cursor.lugar.dono)
    if (onde) setCursor({ lugar: onde.lugar, depois: cursor.lugar.dono })
    area.current?.focus({ preventScroll: true })
  }
  const apagar = (id = cursor.depois) => {
    if (!id) return
    const onde = ondeEsta(linhas, id)
    mudar((ls) => removerPeca(ls, id))
    if (onde) {
      setCursor({ lugar: onde.lugar, depois: onde.antes })
      setFocar(onde.antes ?? FORA)
    }
  }
  const linhaDoCursor = () => {
    let dono = cursor.lugar.dono
    for (;;) {
      if (linhaIds.has(dono)) return dono
      const onde = ondeEsta(linhas, dono)
      if (!onde) return linhas[linhas.length - 1].id
      dono = onde.lugar.dono
    }
  }
  const porLinha = () => {
    const nova = novaLinha()
    const depoisDe = linhaDoCursor()
    mudar((ls) => {
      const i = ls.findIndex((l) => l.id === depoisDe)
      return [...ls.slice(0, i + 1), nova, ...ls.slice(i + 1)]
    })
    setCursor({ lugar: { dono: nova.id, lado: 'a' }, depois: nova.a[0].id })
    setFocar(nova.a[0].id)
  }
  const apagarLinha = (id: string) => {
    mudar((ls) => (ls.length > 1 ? ls.filter((l) => l.id !== id) : [novaLinha()]))
    const outra = linhas.find((l) => l.id !== id)
    if (outra) setCursor({ lugar: { dono: outra.id, lado: 'a' }, depois: outra.a[outra.a.length - 1]?.id ?? null })
  }

  /** Atalhos dentro de uma caixa: + * = ( ) viram operação, ^ vira potência, Enter abre linha, ⌫ numa caixa vazia apaga. */
  const teclas = (p: Peca, e: KeyboardEvent<HTMLInputElement>) => {
    const el = e.currentTarget
    const noFim = el.selectionStart === el.value.length && el.selectionEnd === el.value.length
    const noComeco = el.selectionStart === 0 && el.selectionEnd === 0
    const caixas = () => [...document.querySelectorAll<HTMLInputElement>('[data-caixa]')]
    if (TECLA_OP[e.key] || (e.key === '-' && noFim && el.value !== '')) {
      e.preventDefault()
      porOp(TECLA_OP[e.key] ?? '−')
    } else if (e.key === '^') {
      e.preventDefault()
      porDentro('pot')
    } else if (e.key === 'Enter') {
      e.preventDefault()
      porLinha()
    } else if (e.key === 'Backspace' && el.value === '') {
      e.preventDefault()
      apagar(p.id)
    } else if (e.key === 'ArrowRight' && noFim) {
      const cs = caixas()
      const i = cs.indexOf(el)
      // última caixa de uma raiz, potência ou do denominador: sai da estrutura (no numerador, desce para o denominador)
      const onde = ondeEsta(linhas, p.id)
      if (onde && !linhaIds.has(onde.lugar.dono)) {
        const lista = listaDe(linhas, onde.lugar)
        const pai = ondeEsta(linhas, onde.lugar.dono)
        const paiPeca = pai && listaDe(linhas, pai.lugar)?.find((x) => x.id === onde.lugar.dono)
        const numerador = paiPeca?.t === 'frac' && onde.lugar.lado === 'a'
        if (lista?.[lista.length - 1]?.id === p.id && !numerador) {
          e.preventDefault()
          return sair()
        }
      }
      if (cs[i + 1]) {
        e.preventDefault()
        cs[i + 1].focus()
        cs[i + 1].setSelectionRange(0, 0)
      }
    } else if (e.key === 'ArrowLeft' && noComeco) {
      const cs = caixas()
      const i = cs.indexOf(el)
      if (i > 0) {
        e.preventDefault()
        cs[i - 1].focus()
      }
    }
  }

  /** Teclado quando o foco não está numa caixa: o que você digitar entra onde está o cursor. */
  const teclasFora = (e: KeyboardEvent<HTMLOListElement>) => {
    if ((e.target as HTMLElement).tagName === 'INPUT' || e.ctrlKey || e.metaKey || e.altKey) return
    const op = TECLA_OP[e.key] ?? (e.key === '-' ? '−' : e.key === '/' ? '÷' : undefined)
    if (op) {
      e.preventDefault()
      porOp(op)
    } else if (e.key === '^') {
      e.preventDefault()
      porDentro('pot')
    } else if (e.key === 'Enter') {
      e.preventDefault()
      porLinha()
    } else if (e.key === 'Backspace') {
      e.preventDefault()
      apagar()
    } else if (e.key.length === 1 && /[\p{L}\p{N},.%!]/u.test(e.key)) {
      e.preventDefault()
      porCaixa(e.key)
    }
  }

  const desenhar = (lista: Peca[], lugar: Lugar, pequeno: boolean): ReactNode => {
    const aqui = cursor.lugar.dono === lugar.dono && cursor.lugar.lado === lugar.lado
    const texto = pequeno ? 'text-sm' : 'text-lg'
    const pecas = lista.map((p) => {
      const selecionada = aqui && cursor.depois === p.id
      const marca = selecionada && p.t !== 'num' ? <Marca /> : null
      const escolher = () => setCursor({ lugar, depois: p.id })
      let corpo: ReactNode
      if (p.t === 'num') {
        corpo = (
          <input
            id={`cx-${p.id}`}
            data-caixa
            value={p.v}
            onChange={(e) => mudar((ls) => mudarValor(ls, p.id, e.target.value))}
            onFocus={escolher}
            onKeyDown={(e) => teclas(p, e)}
            autoComplete="off"
            spellCheck={false}
            aria-label="caixa de número"
            style={{ width: `${Math.max(2.2, p.v.length * 0.62 + 1.2)}em` }}
            className={`${texto} rounded-lg border bg-[var(--papel)] px-1 py-0.5 text-center tabular-nums text-[var(--tinta-forte)] outline-none transition focus:border-[var(--foco)] focus:ring-2 focus:ring-[var(--foco-claro)] ${p.v ? 'border-[var(--linha)]' : 'border-dashed border-[var(--tinta-suave)]/50'}`}
          />
        )
      } else if (p.t === 'op') {
        corpo = (
          <button
            type="button"
            onClick={escolher}
            title="clique para escrever depois daqui (ou apagar)"
            className={`${texto} rounded-md px-1 font-medium text-[var(--tinta-forte)] ${selecionada ? 'bg-[var(--foco-claro)]' : 'hover:bg-[var(--papel-2)]'}`}
          >
            {p.v}
          </button>
        )
      } else if (p.t === 'frac') {
        corpo = (
          <span className={`inline-flex flex-col items-center rounded-lg px-1 py-0.5 ${selecionada ? 'bg-[var(--foco-claro)]' : ''}`}>
            <span className="flex items-center gap-0.5">{desenhar(p.a, { dono: p.id, lado: 'a' }, pequeno)}</span>
            <button type="button" onClick={escolher} title="fração: clique para escrever depois dela" className="my-0.5 h-[3px] w-full min-w-8 rounded bg-[var(--tinta-forte)]" aria-label="traço da fração" />
            <span className="flex items-center gap-0.5">{desenhar(p.b, { dono: p.id, lado: 'b' }, pequeno)}</span>
          </span>
        )
      } else if (p.t === 'raiz') {
        corpo = (
          <span className={`inline-flex items-stretch rounded-lg ${selecionada ? 'bg-[var(--foco-claro)]' : ''}`}>
            <button type="button" onClick={escolher} title="raiz: clique para escrever depois dela" className={`${pequeno ? 'text-base' : 'text-2xl'} leading-none text-[var(--tinta-forte)]`}>
              √
            </button>
            <span className="flex items-center gap-0.5 border-t-2 border-[var(--tinta-forte)] px-1 pt-1">{desenhar(p.a, { dono: p.id, lado: 'a' }, pequeno)}</span>
          </span>
        )
      } else {
        corpo = (
          <span className={`-ml-0.5 inline-flex -translate-y-3 items-center gap-0.5 rounded-lg border border-dotted border-[var(--tinta-suave)]/40 px-0.5 ${selecionada ? 'bg-[var(--foco-claro)]' : ''}`}>
            <button type="button" onClick={escolher} title="expoente: clique para escrever depois dele" className="text-[10px] text-[var(--tinta-suave)]" aria-label="expoente">
              ^
            </button>
            {desenhar(p.a, { dono: p.id, lado: 'a' }, true)}
          </span>
        )
      }
      return (
        <span key={p.id} className="inline-flex items-center">
          {corpo}
          {marca}
        </span>
      )
    })
    return (
      <>
        {aqui && cursor.depois === null && <Marca />}
        {lista.length === 0 && (
          <button
            type="button"
            onClick={() => setCursor({ lugar, depois: null })}
            title="espaço vazio: clique e use a barra para pôr algo aqui"
            className={`${pequeno ? 'h-6 w-6' : 'h-8 w-8'} rounded-lg border border-dashed border-[var(--tinta-suave)]/50`}
            aria-label="espaço vazio"
          />
        )}
        {pecas}
      </>
    )
  }

  return (
    <div className="rounded-3xl border border-[var(--linha)] bg-[var(--cartao)] shadow-[var(--sombra)]">
      <div className="sticky top-[calc(env(safe-area-inset-top,0px)+3.25rem)] z-[9] flex flex-wrap gap-1 rounded-t-3xl border-b border-[var(--linha)] bg-[var(--cartao)]/95 p-2 backdrop-blur" role="toolbar" aria-label="ferramentas do desenvolvimento">
        <Ferramenta titulo="nova caixa de número" onClick={() => porCaixa()}>
          <span className="flex items-center gap-1 text-sm">
            <span className="inline-block h-4 w-5 rounded border border-dashed border-current" /> caixa
          </span>
        </Ferramenta>
        {BINARIAS.map((o) => (
          <Ferramenta key={o} titulo={`pôr ${o}`} onClick={() => porOp(o)}>
            {o}
          </Ferramenta>
        ))}
        <Ferramenta titulo="abre parêntese" onClick={() => porOp('(')}>
          (
        </Ferramenta>
        <Ferramenta titulo="fecha parêntese" onClick={() => porOp(')')}>
          )
        </Ferramenta>
        <Ferramenta titulo="fração (em cima e embaixo)" onClick={porFracao}>
          <span className="flex flex-col items-center text-[10px] leading-none">
            <span className="inline-block h-2 w-3 rounded-sm border border-current" />
            <span className="my-[2px] block h-px w-4 bg-current" />
            <span className="inline-block h-2 w-3 rounded-sm border border-current" />
          </span>
        </Ferramenta>
        <Ferramenta titulo="raiz quadrada" onClick={() => porDentro('raiz')}>
          √
        </Ferramenta>
        <Ferramenta titulo="potência (expoente)" onClick={() => porDentro('pot')}>
          <span>
            x<sup>n</sup>
          </span>
        </Ferramenta>
        <Ferramenta titulo="log na base 2" onClick={() => porOp('log₂')}>
          log₂
        </Ferramenta>
        <Ferramenta titulo="logaritmo natural" onClick={() => porOp('ln')}>
          ln
        </Ferramenta>
        <Ferramenta titulo="somatório" onClick={() => porOp('Σ')}>
          Σ
        </Ferramenta>
        <Ferramenta titulo="sair da fração, raiz ou potência (continuar depois dela)" onClick={sair} desligada={!dentroDeEstrutura}>
          <span className="text-sm">sair →</span>
        </Ferramenta>
        <Ferramenta titulo="apagar a peça marcada" onClick={() => apagar()} desligada={!cursor.depois}>
          ⌫
        </Ferramenta>
        <Ferramenta titulo="nova linha" onClick={porLinha}>
          <span className="text-sm">↵ linha</span>
        </Ferramenta>
      </div>

      <ol ref={area} tabIndex={-1} onKeyDown={teclasFora} className="space-y-1 p-3 outline-none sm:p-4" aria-label="linhas do desenvolvimento">
        {linhas.map((l, i) => (
          <li key={l.id} className="group flex items-start gap-2 rounded-2xl px-1 py-1.5 hover:bg-[var(--papel)]/60">
            <span className="mt-2 w-5 shrink-0 text-right text-xs tabular-nums text-[var(--tinta-suave)]">{i + 1}</span>
            <div className="flex min-h-10 min-w-0 flex-1 flex-wrap items-center gap-x-1 gap-y-3 overflow-x-auto py-1">{desenhar(l.a, { dono: l.id, lado: 'a' }, false)}</div>
            <button
              type="button"
              onClick={() => apagarLinha(l.id)}
              title="apagar esta linha"
              aria-label={`apagar a linha ${i + 1}`}
              className="mt-1.5 grid h-7 w-7 shrink-0 place-items-center rounded-full text-[var(--tinta-suave)] opacity-40 transition hover:bg-[var(--alerta-claro)] hover:text-[#c2410c] hover:opacity-100 group-hover:opacity-100"
            >
              ×
            </button>
          </li>
        ))}
      </ol>
      <p className="border-t border-[var(--linha)] px-4 py-2.5 text-xs leading-relaxed text-[var(--tinta-suave)]">
        Escreva o que quiser nas caixas (números, letras, P(A)…). Na caixa, <kbd>+</kbd> <kbd>*</kbd> <kbd>=</kbd> <kbd>(</kbd> <kbd>)</kbd> viram operação, <kbd>^</kbd> abre expoente, <kbd>Enter</kbd> abre linha, <kbd>⌫</kbd> numa caixa vazia apaga
        ela e <kbd>→</kbd> no fim pula para a próxima (ou sai da fração/raiz/expoente). Fora de uma caixa, é só digitar: o número entra numa caixa nova onde está a marca. O site não confere nada aqui: só as respostas finais, lá embaixo.
      </p>
    </div>
  )
}

// ── abas ────────────────────────────────────────────────────────────

/** As abas do desenvolvimento: clique para trocar, clique na aba aberta para renomear. */
function Abas({
  folhas,
  ativa,
  abrir,
  nova,
  copiar,
  renomear,
  apagar,
}: {
  folhas: Folha[]
  ativa: string
  abrir: (id: string) => void
  nova: () => void
  copiar: () => void
  renomear: (id: string, nome: string) => void
  apagar: (id: string) => void
}) {
  const [editando, setEditando] = useState<string | null>(null)
  const [confirmar, setConfirmar] = useState<string | null>(null)
  const aberta = folhas.find((f) => f.id === ativa)
  return (
    <div className="mb-2 flex flex-wrap items-center gap-1.5" role="tablist" aria-label="abas do desenvolvimento">
      {folhas.map((f) => {
        const eh = f.id === ativa
        if (editando === f.id) {
          return (
            <input
              key={f.id}
              autoFocus
              defaultValue={f.nome}
              maxLength={40}
              aria-label="nome da aba"
              onFocus={(e) => e.currentTarget.select()}
              onBlur={(e) => {
                const nome = e.currentTarget.value.trim()
                if (nome) renomear(f.id, nome)
                setEditando(null)
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') e.currentTarget.blur()
                if (e.key === 'Escape') setEditando(null)
              }}
              className="w-32 rounded-full border-2 border-[var(--foco)] bg-[var(--cartao)] px-3 py-1 text-sm text-[var(--tinta-forte)] outline-none"
            />
          )
        }
        return (
          <button
            key={f.id}
            type="button"
            role="tab"
            aria-selected={eh}
            onClick={() => (eh ? setEditando(f.id) : (abrir(f.id), setConfirmar(null)))}
            title={eh ? 'clique para renomear' : 'abrir esta aba'}
            className={`max-w-[12rem] truncate rounded-full px-3.5 py-1.5 text-sm transition ${eh ? 'bg-[var(--cartao)] font-medium text-[var(--tinta-forte)] shadow-sm ring-1 ring-[var(--linha)]' : 'bg-[var(--papel-2)] text-[var(--tinta-suave)] hover:text-[var(--tinta-forte)]'}`}
          >
            {f.nome}
          </button>
        )
      })}
      <button type="button" onClick={nova} title="nova aba em branco" className="rounded-full px-3 py-1.5 text-sm text-[var(--foco)] hover:bg-[var(--foco-claro)]">
        + aba
      </button>
      {aberta && folhaComConteudo(aberta) && (
        <button type="button" onClick={copiar} title="nova aba começando com uma cópia desta" className="rounded-full px-3 py-1.5 text-sm text-[var(--tinta-suave)] hover:bg-[var(--papel-2)] hover:text-[var(--tinta-forte)]">
          ⧉ copiar esta
        </button>
      )}
      {aberta && folhas.length > 1 && (
        <span className="ml-auto flex items-center gap-1.5 text-sm">
          {confirmar === aberta.id ? (
            <>
              <span className="text-[var(--tinta-suave)]">apagar “{aberta.nome}”?</span>
              <button type="button" className="rounded-full bg-[var(--alerta-claro)] px-3 py-1 text-[#c2410c]" onClick={() => (apagar(aberta.id), setConfirmar(null))}>
                apagar
              </button>
              <button type="button" className="text-[var(--tinta-suave)] hover:underline" onClick={() => setConfirmar(null)}>
                cancelar
              </button>
            </>
          ) : (
            <button
              type="button"
              title="apagar esta aba"
              className="rounded-full px-3 py-1 text-[var(--tinta-suave)] hover:bg-[var(--alerta-claro)] hover:text-[#c2410c]"
              onClick={() => (folhaComConteudo(aberta) ? setConfirmar(aberta.id) : apagar(aberta.id))}
            >
              apagar aba
            </button>
          )}
        </span>
      )}
    </div>
  )
}

// ── tela ────────────────────────────────────────────────────────────

function Resposta({
  passo,
  indice,
  valor,
  certo,
  mudar,
}: {
  passo: PassoCalculo
  indice: number
  valor: string
  certo: boolean | null | undefined
  mudar: (v: string) => void
}) {
  const [ver, setVer] = useState(false)
  const cor = certo === true ? 'var(--menta)' : certo === false ? 'var(--coral)' : 'var(--linha)'
  return (
    <div className="rounded-2xl border-2 bg-[var(--cartao)] p-4" style={{ borderColor: cor }}>
      <div className="flex items-start gap-2">
        <span className="mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full text-[11px] font-semibold text-white" style={{ background: certo == null ? 'var(--tinta-suave)' : cor }}>
          {certo === true ? '✓' : certo === false ? '✗' : indice + 1}
        </span>
        <div className="min-w-0 flex-1">
          <div className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--tinta-suave)]">{passo.rotulo}</div>
          {passo.opcoes ? (
            <div className="mt-2 flex flex-wrap gap-2">
              {passo.opcoes.map((o, i) => (
                <button
                  key={o}
                  type="button"
                  onClick={() => mudar(String(i))}
                  aria-pressed={valor === String(i)}
                  className={`rounded-xl border-2 px-3 py-1.5 text-sm transition ${valor === String(i) ? 'border-[var(--foco)] bg-[var(--foco-claro)] font-medium text-[var(--foco)]' : 'border-[var(--linha)] bg-[var(--papel)] text-[var(--tinta-forte)] hover:border-[var(--foco)]'}`}
                >
                  {o}
                </button>
              ))}
            </div>
          ) : (
            <input
              value={valor}
              onChange={(e) => mudar(e.target.value)}
              inputMode="decimal"
              autoComplete="off"
              placeholder={passo.porcento ? 'ex.: 25%' : passo.casas === 0 ? 'ex.: 7' : 'ex.: 0,367'}
              aria-label={`Resposta final: ${passo.rotulo}`}
              className="mt-2 w-full max-w-xs rounded-xl border-2 border-[var(--linha)] bg-[var(--papel)] px-3 py-2 text-lg tabular-nums text-[var(--tinta-forte)] outline-none focus:border-[var(--foco)]"
            />
          )}
          {certo === false && (
            <div className="mt-2">
              <button type="button" className="text-sm text-[var(--foco)] hover:underline" onClick={() => setVer(!ver)} aria-expanded={ver}>
                {ver ? '▾ esconder o esperado' : '▸ ver o esperado'}
              </button>
              {ver && (
                <div className="mt-2 space-y-2">
                  <p className="text-sm text-[var(--tinta-forte)]">
                    Esperado: <strong className="tabular-nums">{esperado(passo)}</strong>
                  </p>
                  {passo.conta && (
                    <div className="overflow-x-auto rounded-xl bg-[var(--papel-2)] px-3 py-2 text-[var(--tinta-forte)]">
                      <Tex latex={passo.conta} display />
                    </div>
                  )}
                  {passo.explicacao && (
                    <p className="text-sm leading-relaxed text-[var(--tinta)]">
                      <Texto>{passo.explicacao}</Texto>
                    </p>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

const novaSemente = () => 1 + Math.floor(Math.random() * 1e9)

export function DesenvolvimentoLivre({ id }: { id: string }) {
  const c = calculoPorId.get(id)!
  const progresso = useMapa((s) => s.calculos[id])
  const salvo = useMapa((s) => s.desenvolvimentos[id])
  const salvar = useMapa((s) => s.salvarDesenvolvimento)
  const registrar = useMapa((s) => s.registrarCalculo)
  // sem rascunho: primeira vez com os números do material, depois com números novos
  const [inicial, setInicial] = useState<Desenvolvimento>(() => {
    const seed = progresso?.tentativas.length ? novaSemente() : 0
    return novoDesenvolvimento(seed, c.gerar(seed).passos.length)
  })
  const d = salvo ?? inicial
  const inst = useMemo(() => c.gerar(d.seed), [c, d.seed])
  const [aviso, setAviso] = useState('')
  const [recomecar, setRecomecar] = useState(false)
  const [versao, setVersao] = useState(0)

  /** Muda o rascunho sempre a partir do que está salvo agora (duas mudanças seguidas não se perdem). */
  const mudarD = (f: (atual: Desenvolvimento) => Desenvolvimento) => salvar(id, f(useMapa.getState().desenvolvimentos[id] ?? d))
  const folhas = folhasDe(d)
  const ativa = folhas.find((f) => f.id === d.aba) ?? folhas[0]
  /** Muda as abas (e passa o rascunho antigo, de linhas soltas, para o formato com abas). */
  const mudarFolhas = (f: (fs: Folha[], aba: string) => { folhas: Folha[]; aba: string }) =>
    mudarD((x) => {
      const fs = folhasDe(x)
      const r = f(fs, fs.find((y) => y.id === x.aba)?.id ?? fs[0].id)
      return { ...x, linhas: undefined, folhas: r.folhas, aba: r.aba }
    })
  const mudarLinhas = (f: (l: Linha[]) => Linha[]) => mudarFolhas((fs, aba) => ({ folhas: fs.map((y) => (y.id === aba ? { ...y, linhas: f(y.linhas) } : y)), aba }))
  const novaAba = () =>
    mudarFolhas((fs) => {
      const nova = novaFolha(proximoNome(fs))
      return { folhas: [...fs, nova], aba: nova.id }
    })
  const copiarAba = () =>
    mudarFolhas((fs, aba) => {
      const orig = fs.find((y) => y.id === aba) ?? fs[0]
      const nova = copiarFolha(orig, `${orig.nome} (cópia)`.slice(0, 40))
      const i = fs.indexOf(orig)
      return { folhas: [...fs.slice(0, i + 1), nova, ...fs.slice(i + 1)], aba: nova.id }
    })
  const apagarAba = (id: string) =>
    mudarFolhas((fs, aba) => {
      const i = fs.findIndex((y) => y.id === id)
      const resto = fs.filter((y) => y.id !== id)
      return { folhas: resto, aba: aba === id ? resto[Math.max(0, i - 1)].id : aba }
    })
  const mudarResposta = (i: number, v: string) => {
    setAviso('')
    mudarD((x) => {
      const respostas = inst.passos.map((_, j) => (j === i ? v : (x.respostas[j] ?? '')))
      const conferido = x.conferido ? x.conferido.map((r, j) => (j === i ? null : r)) : undefined
      return { ...x, respostas, conferido }
    })
  }

  const conferirTudo = () => {
    const faltam = inst.passos.filter((_, i) => !(d.respostas[i] ?? '').trim())
    if (faltam.length) return setAviso(`Falta a resposta final de: ${faltam.map((p) => p.rotulo).join(', ')}.`)
    const r = inst.passos.map((p, i) => (p.opcoes ? Number(d.respostas[i]) === p.resposta : conferir(p, d.respostas[i])))
    const estranhos = inst.passos.filter((_, i) => r[i] === null)
    if (estranhos.length) return setAviso(`Não entendi o número em: ${estranhos.map((p) => p.rotulo).join(', ')}. Use vírgula ou ponto (0,367), fração (2/3) ou %.`)
    const ok = r as boolean[]
    setAviso('')
    if (!d.registrado) {
      registrar(id, {
        em: Date.now(),
        seed: d.seed,
        acertos: ok.filter(Boolean).length,
        total: ok.length,
        errados: inst.passos.filter((_, i) => !ok[i]).map((p) => p.rotulo),
      })
    }
    mudarD((x) => ({ ...x, conferido: ok, registrado: true }))
  }

  const comecarDeNovo = (novos: boolean) => {
    const seed = novos ? novaSemente() : d.seed
    const novo = novoDesenvolvimento(seed, c.gerar(seed).passos.length)
    salvar(id, null)
    setInicial(novo)
    setRecomecar(false)
    setAviso('')
    setVersao((v) => v + 1)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const conferido = d.conferido
  const tudoConferido = !!conferido && conferido.length === inst.passos.length && conferido.every((x) => x !== null)
  const acertos = conferido?.filter((x) => x === true).length ?? 0
  const perfeito = tudoConferido && acertos === inst.passos.length
  const dias = progresso ? diasAte(progresso, Date.now()) : 0
  const ultima = progresso?.tentativas[progresso.tentativas.length - 1]
  const quando = dias <= 1 ? 'amanhã' : `em ${dias} dias`

  return (
    <motion.main
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      className="mx-auto max-w-3xl px-4 pb-40 pt-6 sm:px-6"
    >
      <nav className="sticky top-[env(safe-area-inset-top,0px)] z-10 -mx-4 mb-6 flex items-center gap-2 bg-[var(--papel)]/90 px-4 py-2 backdrop-blur sm:-mx-6 sm:px-6">
        <a href="#/treino" className="botao-suave">
          ← treinos
        </a>
        <span className="ml-auto hidden text-xs text-[var(--tinta-suave)] sm:inline">salvo sozinho neste aparelho</span>
        <span className="ml-auto sm:ml-0">
          <BotaoCalculadora />
        </span>
      </nav>

      <p className="text-xs uppercase tracking-[0.16em] text-[var(--tinta-suave)]">{d.seed === 0 ? `números da ${c.fonte}` : `versão nova · baseada na ${c.fonte}`}</p>
      <h1 className="mt-1 text-3xl font-semibold text-[var(--tinta-forte)]">{c.titulo}</h1>
      <div className="mt-2 flex flex-wrap gap-1.5">
        {c.topicos.map((t) => (
          <a key={t} href={`#/t/${t}`} className="rounded-full bg-[var(--papel-2)] px-2.5 py-0.5 text-xs text-[var(--tinta)] hover:bg-[var(--linha)]">
            {topicoPorId.get(t)?.titulo}
          </a>
        ))}
      </div>
      <TrocaModo id={id} livre />

      <div className="mt-6 whitespace-pre-line rounded-3xl bg-[var(--foco-claro)] p-5 font-medium leading-relaxed text-[var(--tinta-forte)]">
        <Texto>{inst.enunciado}</Texto>
      </div>

      <section className="mt-6">
        <h2 className="mb-2 text-xs font-semibold uppercase tracking-[0.16em] text-[var(--tinta-suave)]">O que se pede</h2>
        <ol className="space-y-2">
          {inst.passos.map((p, i) => (
            <li key={i} className="flex gap-3 text-[var(--tinta-forte)]">
              <span className="mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full bg-[var(--papel-2)] text-xs font-semibold text-[var(--tinta)]">{i + 1}</span>
              <span className="fonte-leitura">
                <Texto>{p.pergunta}</Texto>
              </span>
            </li>
          ))}
        </ol>
      </section>

      <section className="mt-8">
        <h2 className="mb-2 text-xs font-semibold uppercase tracking-[0.16em] text-[var(--tinta-suave)]">Meu desenvolvimento</h2>
        <Abas
          folhas={folhas}
          ativa={ativa.id}
          abrir={(id) => mudarFolhas((fs) => ({ folhas: fs, aba: id }))}
          nova={novaAba}
          copiar={copiarAba}
          renomear={(id, nome) => mudarFolhas((fs, aba) => ({ folhas: fs.map((y) => (y.id === id ? { ...y, nome } : y)), aba }))}
          apagar={apagarAba}
        />
        <Editor key={`${versao}-${ativa.id}`} linhas={ativa.linhas} mudar={mudarLinhas} />
      </section>

      <section className="mt-8">
        <h2 className="mb-1 text-xs font-semibold uppercase tracking-[0.16em] text-[var(--tinta-suave)]">Respostas finais</h2>
        <p className="mb-3 text-sm text-[var(--tinta-suave)]">Escreva a resposta de cada item e confira tudo de uma vez. A primeira conferência conta para o treino; as seguintes só mostram ✓ e ✗.</p>
        <div className="space-y-3">
          {inst.passos.map((p, i) => (
            <Resposta key={`${versao}-${i}`} passo={p} indice={i} valor={d.respostas[i] ?? ''} certo={conferido?.[i]} mudar={(v) => mudarResposta(i, v)} />
          ))}
        </div>
        {aviso && (
          <p className="mt-3 text-sm text-[#c2410c]" role="status">
            {aviso}
          </p>
        )}
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <button className="botao-foco" onClick={conferirTudo}>
            conferir tudo
          </button>
          {!recomecar ? (
            <button className="botao-suave" onClick={() => setRecomecar(true)}>
              começar de novo
            </button>
          ) : (
            <span className="flex flex-wrap items-center gap-2 rounded-2xl bg-[var(--alerta-claro)] px-3 py-2 text-sm text-[var(--tinta-forte)]">
              Apaga o desenvolvimento e as respostas.
              <button className="botao-suave" onClick={() => comecarDeNovo(true)}>
                com outros números
              </button>
              <button className="botao-suave" onClick={() => comecarDeNovo(false)}>
                mesmos números
              </button>
              <button className="text-[var(--tinta-suave)] hover:underline" onClick={() => setRecomecar(false)}>
                cancelar
              </button>
            </span>
          )}
        </div>
      </section>

      {tudoConferido && (
        <motion.section
          initial={{ opacity: 0, scale: 0.97 }}
          animate={{ opacity: 1, scale: 1 }}
          className="mt-6 rounded-3xl p-6 text-center"
          style={{ background: perfeito ? 'var(--menta-claro)' : 'var(--alerta-claro)' }}
          role="status"
        >
          <p className="text-2xl font-semibold text-[var(--tinta-forte)]">
            {acertos} de {inst.passos.length} {acertos === 1 ? 'bate' : 'batem'} com o esperado
          </p>
          <p className="mt-1 text-[var(--tinta)]">
            {perfeito && !ultima?.errados.length
              ? `Ficou registrado. Volta ${quando} para fixar.`
              : perfeito
                ? `Agora bate tudo. No treino conta a primeira conferência (que teve erro em: ${ultima?.errados.join(', ')}), então ele volta ${quando}.`
                : `Ficou registrado na primeira conferência. Este treino volta ${quando}${ultima?.errados.length ? `; atenção em: ${ultima.errados.join(', ')}` : ''}. Pode corrigir e conferir de novo à vontade.`}
          </p>
          {inst.conclusao && perfeito && (
            <p className="mx-auto mt-4 max-w-md text-sm leading-relaxed text-[var(--tinta)]">
              <Texto>{inst.conclusao}</Texto>
            </p>
          )}
        </motion.section>
      )}
    </motion.main>
  )
}
