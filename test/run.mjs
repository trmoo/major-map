/*! 전국 학과 지도 — © 2026 티쳐무 · 모든 권리 보유 */
// 시험 실행기.
//
// src/ 의 코드는 JSON 을 `import x from './x.json'` 으로 가져온다 (vite 방식).
// node 는 그대로 못 읽으므로 esbuild 로 한 번 묶은 뒤 돌린다.
//
//   npm test
//
// 시험 파일은 test/*.test.mjs 로 두면 자동으로 모아 돌린다.
// ★ 화면(탭) 파일마다 시험 파일을 따로 두면 여럿이 동시에 만들어도 부딪히지 않는다.

import { build } from 'esbuild'
import fs from 'node:fs'
import path from 'node:path'
import url from 'node:url'

const here = path.dirname(url.fileURLToPath(import.meta.url))
const root = path.dirname(here)
const tmp = path.join(root, 'node_modules', '.test-build')

const files = fs.readdirSync(here).filter((f) => f.endsWith('.test.mjs')).sort()
if (!files.length) {
  console.log('시험 파일이 없습니다 (test/*.test.mjs)')
  process.exit(0)
}

fs.mkdirSync(tmp, { recursive: true })
const entry = path.join(tmp, 'all.mjs')
fs.writeFileSync(entry, [
  ...files.map((f, i) => `import './../../test/${f}'`),
  `import { 끝내기 } from './../../test/harness.mjs'`,
  `끝내기()`,
].join('\n'), 'utf-8')

const out = path.join(tmp, 'bundle.mjs')
await build({
  entryPoints: [entry],
  bundle: true,
  format: 'esm',
  platform: 'node',
  target: 'node18',
  outfile: out,
  loader: { '.json': 'json', '.css': 'empty' },
  logLevel: 'warning',
})

console.log(`── 시험 ${files.length}묶음 ──`)
await import(url.pathToFileURL(out).href)
