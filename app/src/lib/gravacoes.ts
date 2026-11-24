// Gravações da explicação (Feynman). Ficam no IndexedDB deste navegador:
// áudio é grande demais para o localStorage e não sai do computador.
// Entram no backup em JSON (lib/backup.ts) e cada uma também pode ser baixada como arquivo.
// As cópias automáticas no localStorage NÃO levam áudio: não cabe.

export interface Gravacao {
  id: string
  topico: string
  em: number
  /** segundos */
  duracao: number
  blob: Blob
}

const BANCO = 'mapa-ia-audio'
const LOJA = 'gravacoes'

function abrir(): Promise<IDBDatabase> {
  return new Promise((ok, erro) => {
    const r = indexedDB.open(BANCO, 1)
    r.onupgradeneeded = () => {
      const loja = r.result.createObjectStore(LOJA, { keyPath: 'id' })
      loja.createIndex('topico', 'topico')
    }
    r.onsuccess = () => ok(r.result)
    r.onerror = () => erro(r.error)
  })
}

async function pedir<T>(modo: IDBTransactionMode, fazer: (loja: IDBObjectStore) => IDBRequest): Promise<T> {
  const db = await abrir()
  return new Promise((ok, erro) => {
    const tx = db.transaction(LOJA, modo)
    const r = fazer(tx.objectStore(LOJA))
    tx.oncomplete = () => {
      db.close()
      ok(r.result as T)
    }
    tx.onerror = () => {
      db.close()
      erro(tx.error)
    }
  })
}

export const gravacoesDo = async (topico: string) =>
  (await pedir<Gravacao[]>('readonly', (l) => l.index('topico').getAll(topico))).sort((a, b) => b.em - a.em)

export const guardarGravacao = (g: Gravacao) => pedir<IDBValidKey>('readwrite', (l) => l.put(g))

export const apagarGravacao = (id: string) => pedir<undefined>('readwrite', (l) => l.delete(id))

export const extensao = (tipo: string) => (tipo.includes('ogg') ? 'ogg' : tipo.includes('mp4') ? 'm4a' : 'webm')

export const todasGravacoes = () => pedir<Gravacao[]>('readonly', (l) => l.getAll())

/** Guarda várias de uma vez (restaurar backup). Mesmo id = substitui; as outras ficam. */
export async function guardarVarias(gs: Gravacao[]) {
  if (!gs.length) return
  const db = await abrir()
  await new Promise<void>((ok, erro) => {
    const tx = db.transaction(LOJA, 'readwrite')
    const loja = tx.objectStore(LOJA)
    gs.forEach((g) => loja.put(g))
    tx.oncomplete = () => {
      db.close()
      ok()
    }
    tx.onerror = () => {
      db.close()
      erro(tx.error)
    }
  })
}
