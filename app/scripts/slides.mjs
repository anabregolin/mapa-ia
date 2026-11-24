// Renderiza as páginas dos PDFs das aulas como imagens para o app (só na sua máquina).
// Uso: node scripts/slides.mjs [prefixo ...]   ex.: node scripts/slides.mjs aula-19 aula-20
// Saída: public/slides/<arquivo>/<n>.jpg e public/slides/indice.json ({ arquivo: páginas })
// public/slides/ está no .gitignore: os slides são material da disciplina, não vão para o repositório.
import { execFileSync } from 'node:child_process'
import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs'
import { basename, join } from 'node:path'

const RAIZ = new URL('../..', import.meta.url).pathname
const ORIGEM = join(RAIZ, 'conteudo-moodle')
const DESTINO = join(RAIZ, 'app/public/slides')
const filtro = process.argv.slice(2)

const pdfs = readdirSync(ORIGEM, { recursive: true })
  .map(String)
  .filter((f) => /(^|\/)aulas?-[^/]*\.pdf$/.test(f))
  .filter((f) => !filtro.length || filtro.some((p) => basename(f).startsWith(p)))

mkdirSync(DESTINO, { recursive: true })
const arqIndice = join(DESTINO, 'indice.json')
const indice = existsSync(arqIndice) ? JSON.parse(readFileSync(arqIndice, 'utf8')) : {}

for (const f of pdfs) {
  const nome = basename(f, '.pdf')
  const pasta = join(DESTINO, nome)
  const paginas = Number(/Pages:\s+(\d+)/.exec(execFileSync('pdfinfo', [join(ORIGEM, f)], { encoding: 'utf8' }))[1])
  if (existsSync(join(pasta, `${paginas}.jpg`))) {
    console.log(`✓ ${nome} (já estava, ${paginas} p.)`)
    indice[nome] = paginas
    continue
  }
  mkdirSync(pasta, { recursive: true })
  process.stdout.write(`… ${nome} (${paginas} p.) `)
  execFileSync('pdftoppm', ['-jpeg', '-jpegopt', 'quality=72', '-scale-to-x', '1100', '-scale-to-y', '-1', join(ORIGEM, f), join(pasta, 'p')])
  // pdftoppm nomeia p-01.jpg / p-001.jpg; renomeia para 1.jpg, 2.jpg…
  for (const img of readdirSync(pasta)) {
    const m = /^p-0*(\d+)\.jpg$/.exec(img)
    if (m) execFileSync('mv', [join(pasta, img), join(pasta, `${m[1]}.jpg`)])
  }
  indice[nome] = paginas
  writeFileSync(arqIndice, JSON.stringify(indice, null, 1))
  console.log('ok')
}
writeFileSync(arqIndice, JSON.stringify(indice, null, 1))
