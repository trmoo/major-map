/*! 전국 학과 지도 — © 2026 티쳐무 · 모든 권리 보유 */
// 소스 전수 문법 검사.
//
// ⚠ 왜 필요한가 —— 시험(npm test)은 화면(탭) 파일을 부르지 않는다.
//   그래서 탭 파일에 괄호 하나가 빠져도 시험은 통과하고 빌드에서야 터진다.
//   빌드 전에 이 검사를 먼저 돌린다.
//
//   npm run check:syntax

import { build } from 'esbuild'
import fs from 'node:fs'
import path from 'node:path'
import url from 'node:url'

const root = path.dirname(path.dirname(url.fileURLToPath(import.meta.url)))
const src = path.join(root, 'src')

function walk(dir) {
  const out = []
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name)
    if (e.isDirectory()) out.push(...walk(p))
    else if (e.name.endsWith('.js')) out.push(p)
  }
  return out
}

const files = walk(src).sort()
let bad = 0
for (const f of files) {
  try {
    await build({
      entryPoints: [f], bundle: false, write: false,
      format: 'esm', target: 'es2020', logLevel: 'silent',
    })
  } catch (err) {
    bad++
    console.error(`✗ ${path.relative(root, f)}`)
    for (const e of err.errors || []) {
      console.error(`    ${e.location?.line ?? '?'}줄: ${e.text}`)
    }
  }
}

// 화면 수명 규칙도 함께 지킨다
const RULES = [
  { 패턴: /window\s*\.\s*addEventListener\s*\(\s*['"]resize['"]/,
    말: "window.addEventListener('resize') 를 직접 쓰지 말 것 — ui.js 의 onResize() 를 쓴다",
    빼기: ['src/main.js', 'src/lib/ui.js'] },
  { 패턴: /(?<!screen)setInterval\s*\(/,
    말: 'setInterval 을 직접 쓰지 말 것 — ui.js 의 screenInterval() 을 쓴다',
    빼기: ['src/lib/ui.js'] },
  { 패턴: /\b(alert|confirm|prompt)\s*\(/,
    말: '브라우저 기본 창을 쓰지 말 것 — ui.js 의 say() 를 쓴다 (주소가 함께 보인다)',
    빼기: [] },
  { 패턴: /localStorage/,
    말: 'localStorage 를 쓰지 말 것 — 공용 PC 에 성적이 남는다. store.js(sessionStorage) 를 쓴다',
    빼기: [] },
  { 패턴: /(이름|학번|생년월일)\s*:\s*input\(/,
    말: '학생 이름·학번을 받는 칸을 만들지 말 것',
    빼기: [] },
]

for (const f of files) {
  const rel = path.relative(root, f).replace(/\\/g, '/')
  const text = fs.readFileSync(f, 'utf-8')
  const code = text.replace(/\/\*[\s\S]*?\*\/|(^|[^:])\/\/.*$/gm, '$1')
  for (const r of RULES) {
    if (r.빼기.includes(rel)) continue
    if (r.패턴.test(code)) { bad++; console.error(`✗ ${rel}\n    ${r.말}`) }
  }
}

if (bad) {
  console.error(`\n✗ ${bad}곳에 문제가 있습니다.`)
  process.exit(1)
}
console.log(`✓ 소스 ${files.length}개 문법·규칙 검사 통과`)
