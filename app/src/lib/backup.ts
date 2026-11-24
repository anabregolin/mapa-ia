// Backup do progresso. Tudo do app mora no localStorage, na chave 'mapa-ia'.
// Três camadas de proteção:
// 1) arquivo .json que você baixa e guarda onde quiser (a única que sobrevive a limpar o navegador);
// 2) cópias automáticas no próprio navegador (uma por dia, as últimas 7, e uma antes de cada importação),
//    que protegem contra um erro do app ou uma importação errada, mas NÃO contra limpar os dados do site;
// 3) pedido ao navegador de armazenamento persistente, para ele não apagar sozinho quando faltar espaço.

const CHAVE = 'mapa-ia'
const CHAVE_COPIAS = 'mapa-ia:copias'
const CHAVE_ULTIMO = 'mapa-ia:ultimo-backup'
const MAX_COPIAS = 8

export interface Copia {
  em: number
  motivo: 'diaria' | 'antes de importar'
  /** o valor cru da chave 'mapa-ia' */
  dados: string
}

interface ArquivoBackup {
  app: 'mapa-ia'
  formato: 1
  salvoEm: string
  /** o valor da chave 'mapa-ia' já como objeto ({ state, version }) */
  dados: { state: Record<string, unknown>; version: number }
}

const ler = (k: string) => {
  try {
    return localStorage.getItem(k)
  } catch {
    return null
  }
}

export function lerCopias(): Copia[] {
  try {
    const c = JSON.parse(ler(CHAVE_COPIAS) ?? '[]')
    return Array.isArray(c) ? c : []
  } catch {
    return []
  }
}

function gravarCopias(copias: Copia[]) {
  // se faltar espaço, vai largando as mais velhas
  for (let lista = copias; lista.length; lista = lista.slice(1)) {
    try {
      localStorage.setItem(CHAVE_COPIAS, JSON.stringify(lista))
      return
    } catch {
      /* cheio: tenta com menos */
    }
  }
}

function guardarCopia(motivo: Copia['motivo']) {
  const dados = ler(CHAVE)
  if (!dados) return
  const copias = lerCopias()
  if (copias.at(-1)?.dados === dados) return
  gravarCopias([...copias, { em: Date.now(), motivo, dados }].slice(-MAX_COPIAS))
}

const mesmoDia = (a: number, b: number) => new Date(a).toDateString() === new Date(b).toDateString()

/** Chamar ao abrir o app: guarda a cópia do dia (se ainda não houver) e pede armazenamento persistente. */
export function aoAbrir() {
  const copias = lerCopias()
  const ultimaDiaria = copias.filter((c) => c.motivo === 'diaria').at(-1)
  if (!ultimaDiaria || !mesmoDia(ultimaDiaria.em, Date.now())) guardarCopia('diaria')
  navigator.storage?.persist?.().catch(() => {})
}

export async function armazenamentoPersistente(): Promise<boolean | null> {
  try {
    return (await navigator.storage?.persisted?.()) ?? null
  } catch {
    return null
  }
}

export function ultimoBackup(): number | null {
  const v = Number(ler(CHAVE_ULTIMO))
  return v > 0 ? v : null
}

/** true quando já há algo a perder (para não incomodar quem acabou de chegar) */
export function temProgresso(): boolean {
  try {
    const s = JSON.parse(ler(CHAVE) ?? '{}').state ?? {}
    return ['profundidade', 'notas', 'cartoes', 'quadro', 'calculos'].some((k) => {
      const v = s[k]
      return Array.isArray(v) ? v.length > 0 : v && Object.keys(v).length > 0
    })
  } catch {
    return false
  }
}

const doisDigitos = (n: number) => String(n).padStart(2, '0')

/** Baixa um arquivo .json com tudo. */
export function exportar() {
  const cru = ler(CHAVE)
  if (!cru) throw new Error('Ainda não há nada salvo para exportar.')
  const agora = new Date()
  const arquivo: ArquivoBackup = { app: 'mapa-ia', formato: 1, salvoEm: agora.toISOString(), dados: JSON.parse(cru) }
  const blob = new Blob([JSON.stringify(arquivo, null, 1)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `mapa-ia-backup-${agora.getFullYear()}-${doisDigitos(agora.getMonth() + 1)}-${doisDigitos(agora.getDate())}-${doisDigitos(agora.getHours())}h${doisDigitos(agora.getMinutes())}.json`
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
  try {
    localStorage.setItem(CHAVE_ULTIMO, String(agora.getTime()))
  } catch {
    /* sem espaço: o arquivo saiu do mesmo jeito */
  }
}

export interface Resumo {
  salvoEm: Date | null
  topicos: number
  notas: number
  cartoes: number
  postits: number
}

function resumir(state: Record<string, unknown>, salvoEm: Date | null): Resumo {
  const n = (v: unknown) => (Array.isArray(v) ? v.length : v && typeof v === 'object' ? Object.keys(v).length : 0)
  return { salvoEm, topicos: n(state.profundidade), notas: n(state.notas), cartoes: n(state.cartoes), postits: n(state.quadro) }
}

export function resumoAtual(): Resumo {
  try {
    return resumir(JSON.parse(ler(CHAVE) ?? '{}').state ?? {}, null)
  } catch {
    return resumir({}, null)
  }
}

/** Lê e confere um arquivo de backup. Não muda nada ainda. */
export async function lerArquivo(arquivo: File): Promise<{ resumo: Resumo; aplicar: () => void }> {
  let obj: Partial<ArquivoBackup>
  try {
    obj = JSON.parse(await arquivo.text())
  } catch {
    throw new Error('Esse arquivo não é um backup do Mapa de IA (não consegui ler o JSON).')
  }
  const dados = obj?.dados
  if (obj?.app !== 'mapa-ia' || !dados || typeof dados.state !== 'object' || dados.state === null || typeof dados.version !== 'number')
    throw new Error('Esse arquivo não é um backup do Mapa de IA.')
  return {
    resumo: resumir(dados.state, obj.salvoEm ? new Date(obj.salvoEm) : null),
    aplicar: () => {
      guardarCopia('antes de importar')
      localStorage.setItem(CHAVE, JSON.stringify(dados))
      location.reload()
    },
  }
}

/** Volta para uma cópia automática (guardando antes a situação de agora). */
export function restaurarCopia(c: Copia) {
  guardarCopia('antes de importar')
  localStorage.setItem(CHAVE, c.dados)
  location.reload()
}

export function resumoCopia(c: Copia): Resumo {
  try {
    return resumir(JSON.parse(c.dados).state ?? {}, new Date(c.em))
  } catch {
    return resumir({}, new Date(c.em))
  }
}
