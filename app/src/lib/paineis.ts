// Qual painel lateral está aberto (Revisão, Anotações, Configurações ou Ajuda) e para onde as páginas cheias voltam.
// Não é salvo: ao recarregar, nenhum painel abre sozinho.
import { create } from 'zustand'

export type PainelId = 'revisao' | 'notas' | 'config' | 'ajuda'

export const usePainel = create<{
  aberto: PainelId | null
  /** na Ajuda: a seção que abre já expandida (ex.: 'trilha') */
  secaoAjuda: string | null
  abrir: (p: PainelId, secaoAjuda?: string) => void
  fechar: () => void
}>((set) => ({
  aberto: null,
  secaoAjuda: null,
  abrir: (aberto, secaoAjuda) => set({ aberto, secaoAjuda: secaoAjuda ?? null }),
  fechar: () => set({ aberto: null }),
}))

/* As páginas de revisão e de anotações voltam para onde você estava (um tópico, a trilha...). */
const CHEIAS = /^#\/?(revisao|anotacoes|quadro|caderno)(\/|$)/
let volta = CHEIAS.test(location.hash) ? '#/' : location.hash || '#/'

/** Chamado a cada troca de rota, com o endereço de onde se saiu. */
export function lembrarDeOnde(hashAnterior: string) {
  if (!CHEIAS.test(hashAnterior)) volta = hashAnterior || '#/'
}

export const voltarDasPaginas = () => {
  location.hash = volta
}

export type AbaRevisao = 'cartoes' | 'relembrar' | 'fracos' | 'explicar' | 'slides' | 'progresso'
export const ABAS_REVISAO: AbaRevisao[] = ['cartoes', 'relembrar', 'fracos', 'explicar', 'slides', 'progresso']

/** O nome e o ícone de cada jeito de revisar. Um nome só, usado em todo lugar: abas, títulos, painel e atalhos. */
export const NOMES_REVISAO: Record<AbaRevisao | 'treino', { icone: string; nome: string }> = {
  cartoes: { icone: '🗂', nome: 'Cartões' },
  relembrar: { icone: '⏱', nome: 'Relembrar' },
  fracos: { icone: '🎯', nome: 'Pontos fracos' },
  explicar: { icone: '🗣', nome: 'Explicar para alguém' },
  slides: { icone: '📌', nome: 'Slides fixados' },
  treino: { icone: '🧮', nome: 'Treino de cálculo' },
  progresso: { icone: '📊', nome: 'Seu progresso' },
}
