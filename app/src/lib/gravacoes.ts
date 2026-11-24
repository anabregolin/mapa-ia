// Gravações da explicação (Feynman). Ficam no IndexedDB deste navegador:
// áudio é grande demais para o localStorage e não sai do computador.
// Não entram no backup em JSON; cada uma pode ser baixada como arquivo.

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
