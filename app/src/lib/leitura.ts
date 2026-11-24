// Como você gosta de ver o texto. Vira variáveis CSS no <html>, então vale para o site todo.

export type Fonte = 'lexend' | 'atkinson' | 'serifa' | 'sistema'
export type Formato = 'arejado' | 'corrido'

export interface PrefLeitura {
  /** tamanho da letra do texto, em px */
  tamanho: number
  /** altura da linha (1.6 = apertado, 2.1 = bem solto) */
  entrelinha: number
  /** largura máxima da coluna, em rem */
  largura: number
  fonte: Fonte
  /** arejado = frases em parágrafos curtos e listas viram tópicos */
  formato: Formato
  /** menos movimento: sem palavras flutuando e animações curtas */
  calmo: boolean
}

export const LEITURA_PADRAO: PrefLeitura = { tamanho: 18, entrelinha: 1.85, largura: 42, fonte: 'lexend', formato: 'arejado', calmo: false }

export const FONTES: Record<Fonte, { nome: string; familia: string; nota: string }> = {
  lexend: { nome: 'Lexend', familia: "'Lexend Variable', 'Lexend', ui-sans-serif, system-ui, sans-serif", nota: 'letras largas, feita para ler sem cansar' },
  atkinson: { nome: 'Atkinson', familia: "'Atkinson Hyperlegible', ui-sans-serif, system-ui, sans-serif", nota: 'letras bem diferentes entre si (I, l, 1)' },
  serifa: { nome: 'Serifada', familia: "Charter, 'Bitstream Charter', 'Iowan Old Style', Georgia, serif", nota: 'jeito de livro' },
  sistema: { nome: 'Do sistema', familia: 'ui-sans-serif, system-ui, -apple-system, "Segoe UI", sans-serif', nota: 'a fonte padrão do seu computador' },
}

export const TAMANHOS = [16, 18, 20, 22]
export const ENTRELINHAS = [
  { valor: 1.6, nome: 'junto' },
  { valor: 1.85, nome: 'normal' },
  { valor: 2.1, nome: 'solto' },
]
export const LARGURAS = [
  { valor: 36, nome: 'estreita' },
  { valor: 42, nome: 'média' },
  { valor: 52, nome: 'larga' },
]

export function aplicarLeitura(p: PrefLeitura) {
  const r = document.documentElement.style
  r.setProperty('--leitura-tamanho', `${p.tamanho / 16}rem`)
  r.setProperty('--leitura-linha', String(p.entrelinha))
  r.setProperty('--leitura-largura', `${p.largura}rem`)
  r.setProperty('--leitura-fonte', FONTES[p.fonte].familia)
  // o espaço entre parágrafos acompanha a entrelinha
  r.setProperty('--leitura-respiro', `${(p.entrelinha * 0.55).toFixed(2)}em`)
  document.documentElement.dataset.calmo = p.calmo ? 'sim' : 'nao'
}
