import { Fragment, useMemo } from 'react'
import { useMapa } from '../store/useMapa'
import { Tex } from './FormulaAnimada'

/** Texto corrido com $latex$ inline e **negrito**. */
export function Texto({ children }: { children: string }) {
  const partes = children.split(/(\$[^$]+\$|\*\*[^*]+\*\*)/g)
  return (
    <>
      {partes.map((p, i) => {
        if (p.startsWith('$') && p.endsWith('$') && p.length > 2) return <Tex key={i} latex={p.slice(1, -1)} />
        if (p.startsWith('**') && p.endsWith('**')) return <strong key={i} className="font-semibold text-[var(--tinta-forte)]">{p.slice(2, -2)}</strong>
        return <Fragment key={i}>{p}</Fragment>
      })}
    </>
  )
}

type Bloco = { tipo: 'p'; texto: string } | { tipo: 'lista'; intro: string; itens: string[] }

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
  for (const f of frases(texto)) {
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

/** Texto de estudo: respeita a preferência "arejado" ou "corrido". */
export function TextoLeitura({ children, className = '' }: { children: string; className?: string }) {
  const formato = useMapa((s) => s.leitura.formato)
  const blocos = useMemo(() => (formato === 'arejado' ? arejar(children) : [{ tipo: 'p' as const, texto: children }]), [children, formato])
  return (
    <div className={`fonte-leitura texto-arejado ${className}`}>
      {blocos.map((b, i) =>
        b.tipo === 'p' ? (
          <p key={i}>
            <Texto>{b.texto}</Texto>
          </p>
        ) : (
          <div key={i}>
            <p>
              <Texto>{b.intro}</Texto>
            </p>
            <ul className="lista-leitura">
              {b.itens.map((it, k) => (
                <li key={k}>
                  <Texto>{it}</Texto>
                </li>
              ))}
            </ul>
          </div>
        ),
      )}
    </div>
  )
}
