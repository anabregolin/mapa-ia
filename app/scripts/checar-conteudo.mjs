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
const { TERMOS } = await ld('/src/content/termos.ts')
const sem = (x) => x.replace(/\s+/g, '')
for (const [id, partes] of Object.entries(TERMOS)) {
  const f = FORMULAS.find((x) => x.id === id)
  if (!f) { erros.push(`termos de fórmula inexistente ${id}`); continue }
  const junto = partes.map((p) => (typeof p === 'string' ? p : p[0])).join('')
  if (sem(junto) !== sem(f.latex)) erros.push(`${id}: termos não formam a fórmula\n  ${junto}\n  ${f.latex}`)
  partes.forEach((p) => typeof p !== 'string' && tex(p[0], `${id} termo`))
}
const vistos = new Set()
for (const x of EXERCICIOS) {
  if (vistos.has(x.id)) erros.push(`id repetido ${x.id}`); vistos.add(x.id)
  x.topicos.forEach((t) => ids.has(t) || erros.push(`${x.id} tópico ${t}`))
  for (const campo of ['enunciado', 'dica', 'resposta']) if (x[campo]) inline(x[campo], `${x.id}.${campo}`)
  x.passos?.forEach((p, i) => { inline(p.texto, `${x.id} passo ${i}`); if (p.latex) tex(p.latex, `${x.id} passo ${i} latex`) })
}
DEMOS.forEach((d) => d.topicos.forEach((t) => ids.has(t) || erros.push(`${d.id} tópico ${t}`)))
const dids = new Set(DEMOS.map((d) => d.id))
EXERCICIOS.forEach((x) => x.demo && !dids.has(x.demo) && erros.push(`${x.id}: demo ${x.demo} não existe`))
// chaves das demos internas (lidas do registro, que é TSX)
const fs = await import('node:fs')
const internas = new Set([...fs.readFileSync('src/components/demos/index.tsx', 'utf8').matchAll(/^\s*'?([\w:-]+)'?: \(\) =>/gm)].map((m) => m[1]))
DEMOS.filter((d) => d.componente).forEach((d) => internas.has(d.url) || erros.push(`${d.id}: demo interna ${d.url} não registrada`))

// os motores das demos precisam bater com os gabaritos
const { GRAFOS_BUSCA, simular } = await ld('/src/lib/busca.ts')
const { ARVORES, executar, inverterRaiz, todosNos } = await ld('/src/lib/arvore.ts')
const { subir } = await ld('/src/lib/hill.ts')
const { knn, PONTOS_Q3, NOVO_Q3 } = await ld('/src/lib/knn.ts')
const espera = (onde, obtido, certo) => String(obtido) === String(certo) || erros.push(`${onde}: deu ${obtido}, gabarito ${certo}`)
const busca = (g, alg, origem) => { const q = simular(GRAFOS_BUSCA.find((x) => x.id === g), alg, origem); const s = q.at(-1).solucao; return [s.caminho.join('>'), s.g, q.filter((x) => x.expandido).length] }
espera('romênia A*', busca('romenia', 'astar', 'Arad'), 'Arad>Sibiu>Rimnicu Vilcea>Pitesti>Bucharest,418,6')
espera('romênia BFS Lugoj (P1 Q4)', busca('romenia', 'bfs', 'Lugoj').slice(1, 2), '504')
espera('E1 gulosa', busca('rs', 'gulosa', 'Erechim'), 'Erechim>Vacaria>Caxias do Sul>Porto Alegre,445,4')
espera('E1 UCS', busca('rs', 'ucs', 'Erechim'), 'Erechim>Passo Fundo>Lajeado>Porto Alegre,378,7')
espera('Q8 BFS', busca('sg', 'bfs', 'S')[0], 'S>A>D>G')
for (const a of ['ucs', 'gulosa', 'astar']) espera(`Q8 ${a}`, busca('sg', a, 'S').slice(0, 2), 'S>B>F>G,8')
const podas = (id, inv) => { const a = ARVORES.find((x) => x.id === id); const r = inv ? inverterRaiz(a.raiz) : a.raiz; const nome = new Map(todosNos(r).map((n) => [n.id, n.nome ?? n.valor])); const ev = executar(r, true); return [ev.at(-1).valor, ev.filter((e) => e.tipo === 'poda').flatMap((e) => e.diretos.map((d) => nome.get(d))).join('')] }
espera('Q22', podas('l2-q22', false), '6,J')
espera('Q22 invertida', podas('l2-q22', true), '6,IJG')
espera('E1 Q6', podas('e1', false), '1,-509')
espera('Q11 n18', subir('n18').at(-1).caminho.join('>'), 'n18>n13>n8>n3')
espera('Q11 n19', subir('n19').at(-1).caminho.join('>'), 'n19>n14>n9>n4>n3')
espera('L5 Q3 k=1', knn(PONTOS_Q3, NOVO_Q3, 1, 'euclidiana').classe, 2)
espera('L5 Q3 k=3', knn(PONTOS_Q3, NOVO_Q3, 3, 'euclidiana').classe, 1)
console.log(`demos ${DEMOS.length} (internas ${internas.size}) · gabaritos das demos conferidos`)
console.log(`tópicos ${TOPICOS.length} · explicações ${Object.keys(EXPLICACOES).length} · fórmulas ${FORMULAS.length} · calculadoras ${Object.keys(CALCULADORAS).length} · termo a termo ${Object.keys(TERMOS).length} · exercícios ${EXERCICIOS.length} (com passos ${EXERCICIOS.filter((x) => x.passos?.length).length})`)
if (erros.length) { console.error(erros.join("\n")); process.exitCode = 1 } else console.log("sem erros")


await v.close()
