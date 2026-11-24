// Fotos do caderno. Ficam no IndexedDB deste navegador (grandes demais para o localStorage)
// e entram no backup em JSON, como os áudios. Ao guardar, a foto é reduzida (lado maior 1600 px, JPEG)
// para não encher o navegador: uma foto de celular de 4 MB vira umas centenas de KB.

export interface Foto {
  id: string
  em: number
  nome: string
  blob: Blob
}

const BANCO = 'mapa-ia-fotos'
const LOJA = 'fotos'
const LADO_MAX = 1600

function abrir(): Promise<IDBDatabase> {
  return new Promise((ok, erro) => {
    const r = indexedDB.open(BANCO, 1)
    r.onupgradeneeded = () => r.result.createObjectStore(LOJA, { keyPath: 'id' })
    r.onsuccess = () => ok(r.result)
    r.onerror = () => erro(r.error)
  })
}

async function pedir<T>(modo: IDBTransactionMode, fazer: (loja: IDBObjectStore) => IDBRequest | void): Promise<T> {
  const db = await abrir()
  return new Promise((ok, erro) => {
    const tx = db.transaction(LOJA, modo)
    const r = fazer(tx.objectStore(LOJA))
    tx.oncomplete = () => {
      db.close()
      ok((r ? r.result : undefined) as T)
    }
    tx.onerror = () => {
      db.close()
      erro(tx.error)
    }
  })
}

export const lerFoto = (id: string) => pedir<Foto | undefined>('readonly', (l) => l.get(id))
export const apagarFoto = (id: string) => pedir<undefined>('readwrite', (l) => l.delete(id))
export const todasFotos = () => pedir<Foto[]>('readonly', (l) => l.getAll())
export const guardarFotos = (fs: Foto[]) => (fs.length ? pedir<undefined>('readwrite', (l) => fs.forEach((f) => l.put(f))) : Promise.resolve())

/** reduz se for grande; GIF e SVG ficam como vieram */
async function reduzir(arquivo: File): Promise<Blob> {
  if (!/^image\/(jpeg|png|webp|heic|heif)/.test(arquivo.type)) return arquivo
  try {
    const bmp = await createImageBitmap(arquivo)
    const escala = Math.min(1, LADO_MAX / Math.max(bmp.width, bmp.height))
    if (escala === 1 && arquivo.size < 600_000) return arquivo
    const c = document.createElement('canvas')
    c.width = Math.round(bmp.width * escala)
    c.height = Math.round(bmp.height * escala)
    const ctx = c.getContext('2d')!
    ctx.fillStyle = '#fff' // PNG transparente não fica preto no JPEG
    ctx.fillRect(0, 0, c.width, c.height)
    ctx.drawImage(bmp, 0, 0, c.width, c.height)
    bmp.close()
    const b = await new Promise<Blob | null>((ok) => c.toBlob(ok, 'image/jpeg', 0.85))
    return b && b.size < arquivo.size ? b : arquivo
  } catch {
    return arquivo // formato que o navegador não abre (HEIC no Chrome, por ex.): guarda como veio
  }
}

/** guarda a foto e devolve o id */
export async function guardarFoto(arquivo: File): Promise<string> {
  const id = `f${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`
  const blob = await reduzir(arquivo)
  await pedir<IDBValidKey>('readwrite', (l) => l.put({ id, em: Date.now(), nome: arquivo.name, blob } satisfies Foto))
  return id
}
