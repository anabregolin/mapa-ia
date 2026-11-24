// Junta o progresso de dois aparelhos quando os dois mudaram desde a última sincronização.

type Estado = Record<string, unknown>

const objeto = (v: unknown): v is Record<string, unknown> => !!v && typeof v === 'object' && !Array.isArray(v)
const comId = (v: unknown): v is { id: string }[] => Array.isArray(v) && v.every((x) => objeto(x) && typeof x.id === 'string')
const em = (v: unknown) => (objeto(v) && typeof v.em === 'number' ? v.em : null)

/**
 * Junta dois estados sem perder nada que só um dos lados tem.
 * - profundidade: a camada mais funda; tempo de estudo: o maior total;
 * - dicionários (notas, cartões, revisitas…): todas as chaves; se as duas têm, vale a de "em" mais recente
 *   ou, sem data, a do lado que mudou por último;
 * - listas com id (post-its, marcas, abas): todos os ids; repetido, vale o lado mais recente;
 * - preferências soltas: o lado mais recente.
 * Limite conhecido: algo apagado num aparelho pode voltar, se o outro ainda tinha.
 */
export function juntar(aqui: Estado, la: Estado, aquiMaisNovo: boolean): Estado {
  const novo = aquiMaisNovo ? aqui : la
  const velho = aquiMaisNovo ? la : aqui
  const saida: Estado = { ...velho, ...novo }
  for (const k of Object.keys(saida)) {
    const a = novo[k]
    const b = velho[k]
    if (k === 'profundidade' && objeto(a) && objeto(b)) {
      const r: Record<string, number> = {}
      for (const id of new Set([...Object.keys(a), ...Object.keys(b)])) r[id] = Math.max(Number(a[id] ?? -1), Number(b[id] ?? -1))
      saida[k] = r
    } else if (k === 'tempo' && objeto(a) && objeto(b)) {
      // tempo de estudo: o maior total (os dois aparelhos partem do mesmo número depois de sincronizar)
      const r: Record<string, unknown> = { ...b, ...a }
      for (const id of Object.keys(b)) {
        const ma = objeto(a[id]) ? Number(a[id].ms) : -1
        const mb = objeto(b[id]) ? Number(b[id].ms) : -1
        if (mb > ma) r[id] = b[id]
      }
      saida[k] = r
    } else if (objeto(a) && objeto(b)) {
      // dicionário por tópico ou preferências: todas as chaves, o lado mais novo ganha, salvo "em" mais recente do outro
      const r: Record<string, unknown> = { ...b, ...a }
      for (const id of Object.keys(a)) {
        const ea = em(a[id])
        const eb = em(b[id])
        if (ea !== null && eb !== null && eb > ea) r[id] = b[id]
      }
      saida[k] = r
    } else if (comId(a) && comId(b)) {
      const ids = new Set(a.map((x) => x.id))
      saida[k] = [...a, ...b.filter((x) => !ids.has(x.id))]
    }
  }
  return saida
}
