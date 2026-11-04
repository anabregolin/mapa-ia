// Revisão: lista números citados no conteúdo que não aparecem no texto extraído do Moodle.
// Não é erro automático: cada número da lista precisa ser conferido à mão. Uso: node scripts/numeros-sem-fonte.mjs
import fs from 'node:fs'
import { createServer } from 'vite'
const v = await createServer({ root: process.cwd(), logLevel: 'error', server: { middlewareMode: true }, appType: 'custom' })
const ld = (p) => v.ssrLoadModule(p)
const { TOPICOS } = await ld('/src/content/topicos.ts')
const { EXPLICACOES } = await ld('/src/content/explicacoes.ts')
const { FORMULAS } = await ld('/src/content/formulas.ts')
const { EXERCICIOS } = await ld('/src/content/exercicios.ts')
await v.close()
const dir = '../extraido/limpo/'
const corpus = fs.readdirSync(dir).map((f) => fs.readFileSync(dir + f, 'utf8')).join('\n').replace(/\s+/g, ' ')
const normal = (n) => n.replace(/\./g, '').replace(',', '.')
const numsCorpus = new Set([...corpus.matchAll(/\d[\d.,]*\d|\d/g)].map((m) => normal(m[0].replace(/[.,]$/, ''))))
const textos = []
for (const t of TOPICOS) textos.push([t.id + ' resumo', t.resumo])
for (const [id, c] of Object.entries(EXPLICACOES)) for (const [k, s] of Object.entries(c)) textos.push([`${id} ${k}`, s])
for (const f of FORMULAS) { textos.push([f.id, f.latex]); f.exemplo?.passos.forEach((p, i) => textos.push([`${f.id} ex${i}`, `${p.rotulo} ${p.latex} ${p.explicacao ?? ''}`])) }
for (const x of EXERCICIOS) {
  // exercícios com figura redesenhada já são conferidos pelo npm run checar
  if (x.demo) continue
  for (const k of ['enunciado', 'resposta']) x[k] && textos.push([`${x.id} ${k}`, x[k]])
  x.passos?.forEach((p, i) => textos.push([`${x.id} p${i}`, `${p.texto} ${p.latex ?? ''}`]))
}
const faltam = new Map()
for (const [onde, s] of textos) {
  const limpo = s.replace(/\{,\}/g, ',').replace(/\\,/g, '.').replace(/\\[a-zA-Z]+|[{}^_]/g, ' ')
  for (const m of limpo.matchAll(/\d[\d.,]*\d|\d/g)) {
    const n = normal(m[0])
    if (n.replace('.', '').length < 3 || numsCorpus.has(n)) continue // ignora números curtos (1, 2, 0,5…)
    if (!faltam.has(n)) faltam.set(n, [])
    faltam.get(n).push(onde)
  }
}
console.log(`${faltam.size} números sem correspondência no texto extraído:`)
for (const [n, ondes] of faltam) console.log(n.padEnd(10), [...new Set(ondes)].join(', '))
