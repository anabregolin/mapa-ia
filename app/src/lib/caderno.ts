// Caderno: páginas que você monta juntando o que já existe no app (post-its, cartões, marcas, slides,
// áudios, tópicos, trilhas...) com texto seu e fotos. Cada página tem um assunto, que agrupa as páginas.
// Os blocos que apontam para outra coisa (ref) mostram a versão atual dela: editar a marca muda no caderno também.

export type TipoBloco =
  | 'titulo'
  | 'texto'
  | 'postit'
  | 'cartao'
  | 'audio'
  | 'slide'
  | 'foto'
  | 'topico'
  | 'trilha'
  | 'palavras'
  | 'marca'
  | 'nota'
  | 'explicacao'

export interface Bloco {
  id: string
  tipo: TipoBloco
  /** texto seu: o conteúdo de "titulo"/"texto", a legenda de foto e slide */
  texto?: string
  /** para onde aponta: id do post-it, cartão, marca, gravação, foto, tópico, aba; "arquivo#página" no slide */
  ref?: string
}

export interface PaginaCaderno {
  id: string
  titulo: string
  /** agrupa as páginas na lista ("P2", "Busca", "Revisão final"...) */
  assunto: string
  blocos: Bloco[]
  em: number
}

export const novoId = (prefixo: string) => `${prefixo}${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`

export const SEM_ASSUNTO = 'sem assunto'
