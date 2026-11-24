import { Fragment, useMemo, type CSSProperties } from 'react'
import type { ModoFormula } from '../lib/leitura'
import { useMapa } from '../store/useMapa'
import { Tex } from './FormulaAnimada'

/** tamanho aproximado na tela: cada \comando vira um símbolo, chaves e espaços não contam */
const tamanhoVisivel = (t: string) => t.replace(/\\[a-zA-Z]+/g, 'x').replace(/[{}\s_^]|\\[,;! ]/g, '').length

/** fórmula "com conta" (merece linha própria) e não só um símbolo como $k$, $b \approx 35$ ou $T \to 0$ */
export const formulaGrande = (latex: string) => {
  const t = latex.trim()
  // "= 0,5" ou "\approx 3" sozinhos continuam a frase de antes: ficam no texto
  if (/^(=|\\approx|\\leq|\\geq|\\ge|\\le|<|>)/.test(t)) return false
  const n = tamanhoVisivel(t)
  if (/\\frac|\\sum|\\prod|\\sqrt/.test(t)) return n >= 6
  if (/=|\\approx|\\equiv|\\leq|\\geq|\\leftarrow/.test(t)) return n >= 9
  return n > 18
}

/** a seta fica grudada na palavra de antes: a linha pode quebrar depois dela, nunca antes */
const grudarSetas = (s: string) => s.replace(/ (→|⇒|↔)/g, '\u00a0$1')

/** Texto corrido com $latex$ inline e **negrito**. `formulas` muda só o texto de estudo (ver TextoLeitura). */
export function Texto({ children, formulas = 'no-texto' }: { children: string; formulas?: ModoFormula }) {
  const partes = children.split(/(\$[^$]+\$|\*\*[^*]+\*\*)/g)
  return (
    <>
      {partes.map((p, i) => {
        if (p.startsWith('$') && p.endsWith('$') && p.length > 2) {
          const latex = p.slice(1, -1)
          if (formulas === 'linha' && formulaGrande(latex)) {
            // a pontuação logo depois vai junto com a fórmula, senão a próxima linha começa com ". Por isso"
            const pont = partes[i + 1]?.match(/^[.,;:!?]/)?.[0]
            if (pont) partes[i + 1] = partes[i + 1].slice(1).replace(/^\s+/, '')
            return (
              <span key={i} className="formula-bloco">
                <Tex latex={pont ? `${latex}\\text{${pont}}` : latex} display />
              </span>
            )
          }
          if (formulas !== 'no-texto')
            return (
              <span key={i} className="formula-respiro">
                <Tex latex={latex} />
              </span>
            )
          return <Tex key={i} latex={latex} />
        }
        if (p.startsWith('**') && p.endsWith('**')) return <strong key={i} className="font-semibold text-[var(--tinta-forte)]">{grudarSetas(p.slice(2, -2))}</strong>
        return <Fragment key={i}>{grudarSetas(p)}</Fragment>
      })}
    </>
  )
}

/* ───────────── setas em coluna ───────────── */

type Pedaco = { tipo: 'texto'; s: string } | { tipo: 'cadeia'; intro: string; passos: string[] }

/** divide por " → " sem cortar o que está entre $…$ ou **…** */
function porSetas(f: string): string[] {
  const guardados: string[] = []
  // parênteses também: "(Arad → Sibiu → … = 450)" é um aparte, não uma cadeia
  const protegido = f.replace(/\$[^$]+\$|\*\*[^*]+\*\*|\([^()]*\)/g, (m) => `\u0001${guardados.push(m) - 1}\u0001`)
  return protegido.split(/\s+→\s+/).map((x) => x.replace(/\u0001(\d+)\u0001/g, (_, i) => guardados[Number(i)]))
}

/** frases com duas ou mais setas viram uma cadeia de passos; o resto continua texto */
function separarCadeias(texto: string): Pedaco[] {
  const out: Pedaco[] = []
  for (const f of frases(texto)) {
    const partes = porSetas(f)
    // "dados → modelo; depois, modelo → resposta" são duas ideias, não uma cadeia: fica na frase
    if (partes.length < 3 || partes.slice(0, -1).some((x) => x.includes('; '))) {
      const ant = out[out.length - 1]
      if (ant?.tipo === 'texto') ant.s += ' ' + f
      else out.push({ tipo: 'texto', s: f })
      continue
    }
    // "Ciclo: percepção → …": o que vem antes dos dois-pontos é a introdução, não um passo
    let intro = ''
    const dp = partes[0].lastIndexOf(': ')
    if (dp >= 0) {
      intro = partes[0].slice(0, dp + 1)
      partes[0] = partes[0].slice(dp + 2)
    } else {
      // sem dois-pontos ("a BFS acha Arad → Sibiu → …"): o 1º passo tem o tamanho do 2º, o resto é introdução.
      // é um palpite; se errar, a frase só fica com uma introdução mais curta ou mais longa
      const palavras = partes[0].split(' ')
      const n = Math.min(3, Math.max(1, partes[1].split(' ').length))
      if (palavras.length >= n + 3) {
        intro = palavras.slice(0, -n).join(' ')
        partes[0] = palavras.slice(-n).join(' ')
      }
    }
    out.push({ tipo: 'cadeia', intro, passos: partes })
  }
  return out
}

function Cadeia({ intro, passos, formulas }: { intro: string; passos: string[]; formulas: ModoFormula }) {
  return (
    <div>
      {intro && (
        <p>
          <Texto formulas={formulas}>{intro}</Texto>
        </p>
      )}
      <ol className="cadeia-setas">
        {passos.map((p, i) => (
          <li key={i}>
            <Texto formulas={formulas}>{p}</Texto>
          </li>
        ))}
      </ol>
    </div>
  )
}

/** um parágrafo de estudo: com as setas em coluna, as frases-cadeia saem do parágrafo */
function Paragrafo({ texto, formulas, vertical }: { texto: string; formulas: ModoFormula; vertical: boolean }) {
  const pedacos = useMemo(() => (vertical ? separarCadeias(texto) : null), [texto, vertical])
  if (!pedacos || pedacos.every((p) => p.tipo === 'texto'))
    return (
      <p>
        <Texto formulas={formulas}>{texto}</Texto>
      </p>
    )
  return (
    <>
      {pedacos.map((p, i) =>
        p.tipo === 'texto' ? (
          <p key={i}>
            <Texto formulas={formulas}>{p.s}</Texto>
          </p>
        ) : (
          <Cadeia key={i} intro={p.intro} passos={p.passos} formulas={formulas} />
        ),
      )}
    </>
  )
}

type Bloco =
  | { tipo: 'p'; texto: string }
  | { tipo: 'lista'; intro: string; itens: string[] }
  | { tipo: 'comparacao'; itens: { rotulo: string; partes: string[] }[] }

/**
 * "Rótulo: conteúdo." com rótulo curto (até 3 palavras). Só conta como item de comparação se
 * o conteúdo tem seta ("dados + regras → saída") ou o rótulo está em negrito ("**Torneio**: …").
 * Assim "Na definição da aula: …" ou "Exemplo: …" continuam texto corrido.
 */
function itemComparacao(f: string): { tipo: 'seta' | 'negrito'; rotulo: string; partes: string[] } | null {
  const m = f.match(/^((?:\*\*)?[A-ZÀ-Ý][^:$()]{0,38}?(?:\*\*)?): (.+)$/)
  if (!m) return null
  const rotulo = m[1]
  if (rotulo.replace(/\*\*/g, '').trim().split(/\s+/).length > 3) return null
  const resto = m[2].replace(/\.$/, '')
  if (resto.split(/;\s+/).length >= 3) return null // "Eixos: a; b; c" é lista, não comparação
  const tipo = /\s(→|⇒)\s/.test(resto) ? 'seta' : rotulo.includes('**') ? 'negrito' : null
  if (!tipo) return null
  // "dados → modelo; depois, modelo → resposta": o "depois" vira uma segunda linha do mesmo item
  return { tipo, rotulo: rotulo.replace(/\*\*/g, ''), partes: resto.split(/;\s+(?=(?:depois|então|em seguida)\b)/) }
}

/** Separa em frases sem quebrar o que está entre $…$. */
function frases(texto: string): string[] {
  const guardados: string[] = []
  const protegido = texto.replace(/\$[^$]+\$/g, (m) => `\u0000${guardados.push(m) - 1}\u0000`)
  return protegido
    .split(/(?<=[.!?])\s+(?=[A-ZÀ-Ý"(*\u00000-9])/)
    .map((f) => f.replace(/\u0000(\d+)\u0000/g, (_, i) => guardados[Number(i)]).trim())
    .filter(Boolean)
}

/**
 * Deixa o texto respirar: no máximo duas frases por parágrafo, e uma frase do tipo
 * "Eixos: a; b; c" vira uma lista. Não muda nenhuma palavra.
 */
export function arejar(texto: string): Bloco[] {
  const blocos: Bloco[] = []
  let atual: string[] = []
  const fecharParagrafo = () => {
    if (atual.length) blocos.push({ tipo: 'p', texto: atual.join(' ') })
    atual = []
  }
  const lista = frases(texto)
  for (let k = 0; k < lista.length; k++) {
    const f = lista[k]
    // duas ou mais frases seguidas no formato "Rótulo: …" (do mesmo tipo) viram uma comparação em tópicos
    const primeiro = itemComparacao(f)
    if (primeiro) {
      const grupo = [primeiro]
      while (k + grupo.length < lista.length) {
        const prox = itemComparacao(lista[k + grupo.length])
        if (!prox || prox.tipo !== primeiro.tipo) break
        grupo.push(prox)
      }
      if (grupo.length >= 2) {
        fecharParagrafo()
        blocos.push({ tipo: 'comparacao', itens: grupo.map(({ rotulo, partes }) => ({ rotulo, partes })) })
        k += grupo.length - 1
        continue
      }
    }
    const doisPontos = f.indexOf(': ')
    const itens = doisPontos > 0 ? f.slice(doisPontos + 2).split(/;\s+/) : []
    if (itens.length >= 3) {
      fecharParagrafo()
      const ultimo = itens.length - 1
      // tira o ponto final do último item e o "e" que às vezes abre o último
      itens[ultimo] = itens[ultimo].replace(/\.$/, '')
      blocos.push({ tipo: 'lista', intro: f.slice(0, doisPontos + 1), itens: itens.map((i) => i.replace(/^e\s+(?=\*\*)/, '')) })
      continue
    }
    atual.push(f)
    if (atual.length === 2) fecharParagrafo()
  }
  fecharParagrafo()
  return blocos
}

/** uma cor por item, para os lados da comparação não se misturarem */
const CORES_COMPARACAO = ['var(--foco)', 'var(--coral)', 'var(--menta)', 'var(--alerta)']

/** Texto de estudo: respeita as preferências de leitura (arejado/corrido, fórmulas, setas). */
export function TextoLeitura({ children, className = '' }: { children: string; className?: string }) {
  const { formato, formulas, setas } = useMapa((s) => s.leitura)
  const blocos = useMemo(() => (formato === 'arejado' ? arejar(children) : [{ tipo: 'p' as const, texto: children }]), [children, formato])
  const vertical = setas === 'vertical'
  return (
    <div className={`fonte-leitura texto-arejado ${className}`}>
      {blocos.map((b, i) =>
        b.tipo === 'p' ? (
          <Paragrafo key={i} texto={b.texto} formulas={formulas} vertical={vertical} />
        ) : b.tipo === 'comparacao' ? (
          <ul key={i} className="lista-comparacao">
            {b.itens.map((it, k) => (
              <li key={k} style={{ '--cor-item': CORES_COMPARACAO[k % CORES_COMPARACAO.length] } as CSSProperties}>
                <span className="rotulo-comparacao">{it.rotulo}</span>
                {it.partes.map((pt, j) => (
                  <span key={j} className="parte-comparacao">
                    <Texto formulas={formulas}>{pt}</Texto>
                  </span>
                ))}
              </li>
            ))}
          </ul>
        ) : (
          <div key={i}>
            <p>
              <Texto formulas={formulas}>{b.intro}</Texto>
            </p>
            <ul className="lista-leitura">
              {b.itens.map((it, k) => (
                <li key={k}>
                  <Texto formulas={formulas}>{it}</Texto>
                </li>
              ))}
            </ul>
          </div>
        ),
      )}
    </div>
  )
}
