/*! 전국 학과 지도 — © 2026 티쳐무 · 모든 권리 보유 */
// 아주 작은 시험 도구. 밖에서 아무것도 받아 오지 않는다.

let 통과 = 0
let 실패 = []
let 지금묶음 = ''

export function 묶음(name) { 지금묶음 = name }

export function 확인(what, got, want) {
  const g = JSON.stringify(got)
  const w = JSON.stringify(want)
  if (g === w) { 통과++; return true }
  실패.push({ 묶음: 지금묶음, 무엇: what, 나온것: g, 나와야할것: w })
  return false
}

export function 참이어야(what, got) {
  if (got) { 통과++; return true }
  실패.push({ 묶음: 지금묶음, 무엇: what, 나온것: JSON.stringify(got), 나와야할것: 'true' })
  return false
}

export function 거의(what, got, want, 허용 = 0.005) {
  if (typeof got === 'number' && Math.abs(got - want) <= 허용) { 통과++; return true }
  실패.push({ 묶음: 지금묶음, 무엇: what, 나온것: String(got), 나와야할것: `${want} ±${허용}` })
  return false
}

export function 결과() { return { 통과, 실패 } }

export function 끝내기() {
  const total = 통과 + 실패.length
  if (실패.length) {
    console.log(`\n✗ ${실패.length}가지 실패 (전체 ${total}가지)\n`)
    for (const f of 실패.slice(0, 60)) {
      console.log(`  [${f.묶음}] ${f.무엇}`)
      console.log(`      나온 것     : ${f.나온것}`)
      console.log(`      나와야 할 것 : ${f.나와야할것}`)
    }
    if (실패.length > 60) console.log(`  … 그 밖에 ${실패.length - 60}가지`)
    process.exit(1)
  }
  console.log(`\n✓ ${total}가지 모두 통과`)
}
