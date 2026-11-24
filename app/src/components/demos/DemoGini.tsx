import { useState } from 'react'
import { contar, divisoes, entropia, fmt, FRAUDE, gini, ponderada, type Contagem, type Registro } from '../../lib/gini'
import { Mensagem, MolduraDemo, Rotulo } from './Passos'

// Você monta a árvore: escolhe um nó, olha a tabela de divisões e decide qual aplicar.
// "escolhas" guarda, para cada nó já dividido, o id da divisão usada. Nós: 'r', 'r.0', 'r.1.2'…

interface No {
  id: string
  rotulo: string
  registros: Registro[]
  pergunta?: string
  filhos: No[]
}

function montar(id: string, rotulo: string, registros: Registro[], escolhas: Record<string, string>): No {
  const d = divisoes(registros).find((x) => x.id === escolhas[id])
  return {
    id,
    rotulo,
    registros,
    pergunta: d?.pergunta,
    filhos: d ? d.ramos.map((r, i) => montar(`${id}.${i}`, r.rotulo, r.registros, escolhas)) : [],
  }
}

const achar = (no: No, id: string): No | undefined => (no.id === id ? no : no.filhos.map((f) => achar(f, id)).find(Boolean))

const COR_SIM = '#f87171'
const COR_NAO = '#60a5fa'

function Bolinhas({ c }: { c: Contagem }) {
  return (
    <span className="inline-flex flex-wrap gap-0.5" aria-label={`${c.sim} fraudaram, ${c.nao} não`}>
      {Array.from({ length: c.sim }, (_, i) => (
        <span key={'s' + i} className="h-2 w-2 rounded-full" style={{ background: COR_SIM }} />
      ))}
      {Array.from({ length: c.nao }, (_, i) => (
        <span key={'n' + i} className="h-2 w-2 rounded-full" style={{ background: COR_NAO }} />
      ))}
    </span>
  )
}

function CaixaNo({ no, sel, escolher }: { no: No; sel: string; escolher: (id: string) => void }) {
  const c = contar(no.registros)
  const puro = c.sim === 0 || c.nao === 0
  return (
    <div className="flex flex-col items-center">
      <button
        onClick={() => escolher(no.id)}
        className={`min-w-[7.5rem] rounded-lg border-2 px-2 py-1.5 text-left text-xs transition-colors ${
          sel === no.id ? 'border-violet-400 bg-violet-500/15' : 'border-slate-700 bg-slate-900 hover:border-slate-500'
        }`}
      >
        <div className="font-semibold text-slate-100">{no.rotulo}</div>
        <div className="my-1">
          <Bolinhas c={c} />
        </div>
        <div className="tabular-nums text-slate-300">
          {c.sim} sim · {c.nao} não
        </div>
        <div className="tabular-nums text-slate-400">
          Gini {fmt(gini(c))} · H {fmt(entropia(c))}
        </div>
        {!no.filhos.length && puro && <div className="mt-0.5 text-emerald-300">folha: {c.sim ? 'Sim' : 'Não'}</div>}
      </button>
      {no.pergunta && (
        <>
          <div className="h-3 w-px bg-slate-600" />
          <div className="rounded-md bg-slate-800 px-2 py-0.5 text-[11px] text-amber-200">{no.pergunta}</div>
          <div className="h-3 w-px bg-slate-600" />
          <div className="flex gap-2 border-t border-slate-600 pt-3">
            {no.filhos.map((f) => (
              <CaixaNo key={f.id} no={f} sel={sel} escolher={escolher} />
            ))}
          </div>
        </>
      )}
    </div>
  )
}

/** "1 − (3/10)² − (7/10)² = 0,420" */
const contaGini = (c: Contagem) => `1 − (${c.sim}/${c.n})² − (${c.nao}/${c.n})² = ${fmt(gini(c))}`
const contaEntropia = (c: Contagem) => {
  const t = (k: number) => (k ? `${k}/${c.n}·log₂(${k}/${c.n})` : null)
  const termos = [t(c.sim), t(c.nao)].filter(Boolean)
  return `−[${termos.join(' + ')}] = ${fmt(entropia(c))}`
}

export function DemoGini() {
  const [escolhas, setEscolhas] = useState<Record<string, string>>({})
  const [sel, setSel] = useState('r')
  const raiz = montar('r', 'Todos', FRAUDE, escolhas)
  const no = achar(raiz, sel) ?? raiz
  const c = contar(no.registros)
  const opcoes = divisoes(no.registros).map((d) => {
    const g = ponderada(d, gini)
    const h = ponderada(d, entropia)
    return { d, g, ganhoGini: gini(c) - g, ganho: entropia(c) - h }
  })
  const melhorGini = Math.min(...opcoes.map((o) => o.g))
  const melhorGanho = Math.max(...opcoes.map((o) => o.ganho))
  const empates = opcoes.filter((o) => Math.abs(o.g - melhorGini) < 1e-9).length
  const puro = c.sim === 0 || c.nao === 0

  const dividir = (idDiv: string) => {
    // trocar a divisão de um nó desfaz tudo o que estava embaixo dele
    setEscolhas((e) => ({ ...Object.fromEntries(Object.entries(e).filter(([k]) => !k.startsWith(no.id + '.'))), [no.id]: idDiv }))
  }
  const desfazer = () => setEscolhas((e) => Object.fromEntries(Object.entries(e).filter(([k]) => k !== no.id && !k.startsWith(no.id + '.'))))
  const usada = escolhas[no.id]

  return (
    <MolduraDemo
      principal={
        <>
          <div className="mb-2 flex flex-wrap items-center gap-3 text-xs text-slate-400">
            <span>
              <span className="mr-1 inline-block h-2 w-2 rounded-full" style={{ background: COR_SIM }} />
              fraudou
            </span>
            <span>
              <span className="mr-1 inline-block h-2 w-2 rounded-full" style={{ background: COR_NAO }} />
              não fraudou
            </span>
            <span>H = entropia</span>
            <button
              className="ml-auto rounded-md bg-tinta/10 px-2 py-1 text-slate-200"
              onClick={() => {
                setEscolhas({})
                setSel('r')
              }}
            >
              ↺ recomeçar
            </button>
          </div>
          <div className="overflow-x-auto rounded-lg bg-slate-950 p-3">
            <div className="flex min-w-max justify-center">
              <CaixaNo no={raiz} sel={no.id} escolher={setSel} />
            </div>
          </div>
          <p className="mt-2 text-xs text-slate-500">
            Clique num nó para escolhê-lo. Os 10 registros são os da tabela da aula 24 (p. 17): reembolso do IR, estado civil e renda; a classe é “fraudou?”.
          </p>
        </>
      }
      lateral={
        <>
          <div className="rounded-lg bg-tinta/5 px-3 py-2 text-xs text-slate-300">
            <Rotulo>Nó escolhido: {no.rotulo}</Rotulo>
            <div className="tabular-nums">Gini = {contaGini(c)}</div>
            <div className="mt-0.5 tabular-nums">H = {contaEntropia(c)}</div>
          </div>

          {puro ? (
            <Mensagem chave={no.id + 'puro'} sucesso>
              Nó puro: todos são “{c.sim ? 'fraudou' : 'não fraudou'}”. Gini e entropia valem 0, então o algoritmo de Hunt para aqui e o nó vira folha.
            </Mensagem>
          ) : opcoes.length === 0 ? (
            <Mensagem chave={no.id + 'sem'}>Nenhum atributo separa estes registros: eles são iguais em tudo menos na classe. Vira folha com a classe da maioria.</Mensagem>
          ) : (
            <div className="text-xs">
              <Rotulo>Como dividir este nó?</Rotulo>
              <div className="overflow-x-auto">
                <table className="w-full tabular-nums">
                  <thead className="text-slate-500">
                    <tr>
                      <th className="py-1 pr-2 text-left font-normal">pergunta</th>
                      <th className="px-1 text-right font-normal" title="Gini dos filhos, pesado pelo tamanho de cada um. Menor = melhor.">
                        Gini split
                      </th>
                      <th className="px-1 text-right font-normal" title="Entropia do pai menos a entropia média dos filhos. Maior = melhor.">
                        ganho
                      </th>
                      <th />
                    </tr>
                  </thead>
                  <tbody>
                    {opcoes.map((o) => (
                      <tr key={o.d.id} className={`border-t border-slate-800 ${usada === o.d.id ? 'bg-violet-500/15' : ''}`}>
                        <td className="py-1 pr-2 text-slate-200">{o.d.pergunta}</td>
                        <td className={`px-1 text-right ${Math.abs(o.g - melhorGini) < 1e-9 ? 'font-semibold text-emerald-300' : 'text-slate-300'}`}>{fmt(o.g)}</td>
                        <td className={`px-1 text-right ${Math.abs(o.ganho - melhorGanho) < 1e-9 ? 'font-semibold text-emerald-300' : 'text-slate-300'}`}>{fmt(o.ganho)}</td>
                        <td className="pl-1 text-right">
                          <button className="rounded bg-violet-500/80 px-1.5 py-0.5 text-white disabled:opacity-40" disabled={usada === o.d.id} onClick={() => dividir(o.d.id)}>
                            {usada === o.d.id ? 'usada' : 'dividir'}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="mt-2 text-slate-400">
                <span className="text-emerald-300">Verde</span> = a melhor por aquele critério. Gini split: menor é melhor. Ganho de informação: maior é melhor. Quase sempre os dois apontam a
                mesma divisão; quando não apontam, a prova diz qual critério usar.
              </p>
              {empates > 1 && (
                <p className="mt-2 text-amber-200/90">
                  Empate: {empates} divisões dão o mesmo Gini. Qualquer uma serve; o algoritmo pega a primeira que testar.
                  {no.id === 'r' &&
                    ' Repare: a árvore do slide (p. 18-25) começa por “reembolso”, que não é a melhor pelo Gini aqui. Ela serve para mostrar como a árvore funciona, e a p. 27 diz justamente que várias árvores se ajustam aos mesmos dados.'}
                </p>
              )}
              {usada && (
                <button className="mt-2 text-slate-400 underline hover:text-slate-200" onClick={desfazer}>
                  desfazer a divisão deste nó
                </button>
              )}
            </div>
          )}
          <p className="text-[11px] leading-snug text-slate-500">
            Gini split = Σ (nᵢ/n)·Gini(filho i). Ganho = H(pai) − Σ (nᵢ/n)·H(filho i). Os cortes de renda ficam no meio de dois valores vizinhos. Fonte: aula 24, p. 46-60.
          </p>
        </>
      }
    />
  )
}
