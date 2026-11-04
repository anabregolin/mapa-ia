// Confere o conteúdo: ids que apontam para tópicos que existem, explicação para todo tópico
// visto em aula, ids de exercício únicos e todo o LaTeX renderizando no KaTeX. Uso: npm run checar
import { createServer } from 'vite'
const v = await createServer({ root: process.cwd(), logLevel: 'error', server: { middlewareMode: true }, appType: 'custom' })
const ld = (p) => v.ssrLoadModule(p)
const { TOPICOS } = await ld('/src/content/topicos.ts')
const { FORMULAS } = await ld('/src/content/formulas.ts')
const { CALCULADORAS } = await ld('/src/content/calculadoras.ts')
const { EXERCICIOS, DEMOS } = await ld('/src/content/exercicios.ts')
const { EXPLICACOES } = await ld('/src/content/explicacoes.ts')
const katex = (await import('katex')).default
const ids = new Set(TOPICOS.map((t) => t.id))
const erros = []
const tex = (s, onde) => { try { katex.renderToString(s, { throwOnError: true }) } catch (e) { erros.push(`${onde}: ${e.message.slice(0, 120)}`) } }
const inline = (txt, onde) => { if (/[\t\x08\f\v]/.test(txt)) erros.push(`${onde}: caractere de controle (barra perdida?)`); for (const m of txt.matchAll(/\$([^$]+)\$/g)) tex(m[1], onde) }
for (const k of Object.keys(EXPLICACOES)) if (!ids.has(k)) erros.push(`explicação sem tópico: ${k}`)
for (const t of TOPICOS) if (!t.naoVisto && !EXPLICACOES[t.id]) erros.push(`tópico sem explicação: ${t.id}`)
for (const [k, c] of Object.entries(EXPLICACOES)) for (const [campo, txt] of Object.entries(c)) inline(txt, `${k}.${campo}`)
const fids = new Set(FORMULAS.map((f) => f.id))
for (const f of FORMULAS) {
  tex(f.latex, f.id); f.variaveis?.forEach((x) => tex(x.simbolo, f.id + ' var')); f.exemplo?.passos.forEach((p, i) => tex(p.latex, `${f.id} passo ${i}`))
  f.topicos.forEach((t) => ids.has(t) || erros.push(`${f.id} tópico ${t}`))
}
for (const [k, c] of Object.entries(CALCULADORAS)) {
  if (!fids.has(k)) erros.push(`calculadora sem fórmula ${k}`)
  const r = c.calcular(Object.fromEntries(c.entradas.map((e) => [e.id, e.valor])))
  tex(r.conta, k + ' conta'); tex(r.resultado, k + ' resultado')
}
const vistos = new Set()
for (const x of EXERCICIOS) {
  if (vistos.has(x.id)) erros.push(`id repetido ${x.id}`); vistos.add(x.id)
  x.topicos.forEach((t) => ids.has(t) || erros.push(`${x.id} tópico ${t}`))
  for (const campo of ['enunciado', 'dica', 'resposta']) if (x[campo]) inline(x[campo], `${x.id}.${campo}`)
  x.passos?.forEach((p, i) => { inline(p.texto, `${x.id} passo ${i}`); if (p.latex) tex(p.latex, `${x.id} passo ${i} latex`) })
}
DEMOS.forEach((d) => d.topicos.forEach((t) => ids.has(t) || erros.push(`${d.id} tópico ${t}`)))
console.log(`tópicos ${TOPICOS.length} · explicações ${Object.keys(EXPLICACOES).length} · fórmulas ${FORMULAS.length} · calculadoras ${Object.keys(CALCULADORAS).length} · exercícios ${EXERCICIOS.length} (com passos ${EXERCICIOS.filter((x) => x.passos?.length).length})`)
if (erros.length) { console.error(erros.join("\n")); process.exitCode = 1 } else console.log("sem erros")


await v.close()
