// Como você gosta de ver o texto. Vira variáveis CSS no <html>, então vale para o site todo.

export type Fonte = 'lexend' | 'atkinson' | 'serifa' | 'sistema'
export type Formato = 'arejado' | 'corrido'
/** no-texto = como sempre foi; respiro = espaço e fundo em volta; linha = as grandes ganham linha própria, centralizadas */
export type ModoFormula = 'no-texto' | 'respiro' | 'linha'
/** no-texto = "A → B → C" na frase; vertical = sequências com duas ou mais setas viram uma coluna de passos */
export type ModoSetas = 'no-texto' | 'vertical'
/** com as setas em coluna: de que lado da coluna de texto os passos ficam */
export type LadoSetas = 'esquerda' | 'centro' | 'direita'

export interface PrefLeitura {
  /** tamanho da letra do texto, em px */
  tamanho: number
  /** altura da linha (1.6 = apertado, 2.1 = bem solto) */
  entrelinha: number
  /** espaço entre um parágrafo e o seguinte, em em (1 = uma linha de letra) */
  paragrafo: number
  /** largura máxima da coluna, em rem */
  largura: number
  fonte: Fonte
  /** arejado = frases em parágrafos curtos e listas viram tópicos */
  formato: Formato
  /** menos movimento: animações curtas */
  calmo: boolean
  formulas: ModoFormula
  setas: ModoSetas
  setasLado: LadoSetas
}

export const LEITURA_PADRAO: PrefLeitura = {
  tamanho: 18,
  entrelinha: 1.85,
  paragrafo: 1,
  largura: 42,
  fonte: 'lexend',
  formato: 'arejado',
  calmo: false,
  formulas: 'linha',
  setas: 'no-texto',
  setasLado: 'esquerda',
}

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
export const PARAGRAFOS = [
  { valor: 0.5, nome: 'junto' },
  { valor: 1, nome: 'normal' },
  { valor: 1.6, nome: 'solto' },
  { valor: 2.4, nome: 'bem solto' },
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
  // antes acompanhava a entrelinha (1.85 × 0.55 ≈ 1em); agora é escolha própria
  r.setProperty('--leitura-respiro', `${p.paragrafo ?? 1}em`)
  document.documentElement.dataset.calmo = p.calmo ? 'sim' : 'nao'
  document.documentElement.dataset.setasLado = p.setasLado ?? 'esquerda'
}
