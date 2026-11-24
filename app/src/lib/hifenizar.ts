// Hifenização do texto de leitura. O texto é justificado (cada linha começa e termina na mesma margem);
// sem hifenizar, palavras longas abrem buracos entre as palavras, principalmente no celular.
// O CSS (`hyphens: auto`) resolve isso quando o navegador tem dicionário de português. Quando não tem
// (é o caso do Chromium no Linux), este arquivo põe hifens invisíveis (U+00AD) dentro das palavras:
// o navegador só os mostra quando a palavra quebra no fim da linha.
// Quem lê o texto da tela precisa ignorar esses hifens: o marca-texto (lib/marcas) e a cópia (abaixo).
import { hyphenateSync } from 'hyphen/pt'

export const HIFEN = '\u00AD'
const HIFENS = /\u00AD/g

/** onde hifenizar: o texto de leitura, menos campos, fórmulas, código e as linhas curtas da comparação */
const ALVO = '.fonte-leitura'
const FORA = 'input, textarea, button, code, pre, .katex, .formula-bloco, .lista-comparacao, [contenteditable], [data-sem-hifen]'

/** o navegador já hifeniza português sozinho? (mede uma palavra longa numa caixa estreita) */
function navegadorHifeniza(): boolean {
  const caixa = document.createElement('div')
  caixa.lang = 'pt-BR'
  caixa.setAttribute('aria-hidden', 'true')
  caixa.style.cssText = 'position:absolute;visibility:hidden;left:-9999px;top:0;width:3em;font-size:16px;line-height:20px;hyphens:manual;-webkit-hyphens:manual'
  caixa.textContent = 'explicitamente'
  document.body.appendChild(caixa)
  const sem = caixa.offsetHeight
  caixa.style.hyphens = 'auto'
  caixa.style.setProperty('-webkit-hyphens', 'auto')
  const com = caixa.offsetHeight
  caixa.remove()
  return com > sem
}

function deveHifenizar(no: Text) {
  const pai = no.parentElement
  return !!pai && !!pai.closest(ALVO) && !pai.closest(FORA)
}

function hifenizarNo(no: Text) {
  const cru = no.data
  if (cru.length < 5 || !deveHifenizar(no)) return
  const novo = hyphenateSync(cru.replace(HIFENS, ''), { hyphenChar: HIFEN })
  // só escreve se mudou: a própria escrita dispara o observador, e na segunda vez nada muda
  if (novo !== cru) no.data = novo
}

function hifenizarEm(raiz: Node) {
  if (raiz.nodeType === Node.TEXT_NODE) return hifenizarNo(raiz as Text)
  if (raiz.nodeType !== Node.ELEMENT_NODE) return
  const w = document.createTreeWalker(raiz, NodeFilter.SHOW_TEXT)
  for (let n = w.nextNode(); n; n = w.nextNode()) hifenizarNo(n as Text)
}

/** Ao copiar, tira os hifens invisíveis (senão eles vão junto para onde você colar). */
function aoCopiar(e: ClipboardEvent) {
  const sel = window.getSelection()
  if (!sel || sel.isCollapsed || !e.clipboardData) return
  const texto = sel.toString()
  if (!texto.includes(HIFEN)) return
  const caixa = document.createElement('div')
  for (let i = 0; i < sel.rangeCount; i++) caixa.appendChild(sel.getRangeAt(i).cloneContents())
  e.clipboardData.setData('text/plain', texto.replace(HIFENS, ''))
  e.clipboardData.setData('text/html', caixa.innerHTML.replace(HIFENS, ''))
  e.preventDefault()
}

let iniciado = false

export function iniciarHifenizacao() {
  if (iniciado || typeof document === 'undefined') return
  iniciado = true
  if (navegadorHifeniza()) return

  const pendentes = new Set<Node>()
  let quadro = 0
  const processar = () => {
    quadro = 0
    for (const n of pendentes) if (n.isConnected) hifenizarEm(n)
    pendentes.clear()
  }
  const obs = new MutationObserver((mudancas) => {
    for (const m of mudancas) {
      if (m.type === 'characterData') pendentes.add(m.target)
      else m.addedNodes.forEach((n) => pendentes.add(n))
    }
    if (pendentes.size && !quadro) quadro = requestAnimationFrame(processar)
  })
  obs.observe(document.body, { childList: true, subtree: true, characterData: true })
  hifenizarEm(document.body)
  document.addEventListener('copy', aoCopiar)
}
