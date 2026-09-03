/*! 전국 학과 지도 — © 2026 티쳐무 · 모든 권리 보유 */
// 자료를 읽고, 학과를 「같은 갈래」로 묶는다. 이 앱의 심장이다.
//
// ★ 원자료 —— 교육부 「대학알리미 키워드별 학과정보」(공공데이터포털)
//   공공저작물 제1유형(출처표시)이라 이 앱은 공개 배포할 수 있다.
//   tools/make_data.py 가 src/data/major.json 을 만든다.
//
// ★ 「유사 학과」를 잇는 두 가지 방법 —— 둘 다 보여 주고 어느 쪽인지 밝힌다.
//   ① 표준분류계열 (대 6 → 중 28 → 소 160)
//      원자료에 이미 들어 있다. 우리가 지어낸 것이 아니라 **출처가 분명하다.**
//      「간호학과·간호학부·간호전공·간호대학」이 소분류 「간호학」 하나로 묶인다.
//   ② 이름 열쇠
//      괄호와 「학과/학부/전공」 어미를 떼어 어간이 같은 것끼리 묶는다.
//      분류가 없는 11.8%(자율전공·광역모집)도 이쪽으로는 묶인다.
//
// ⚠ 학과명은 입시의 **모집단위와 다르다.** 대학이 실제로 뽑는 단위는
//   「인문계열」·「자유전공학부」처럼 학과를 묶은 이름일 때가 많다.
//   이 앱은 그 사실을 화면에 밝힌다. 합격 가능성을 말하지 않는다.

import raw from '../data/major.json'

const 분류없음 = '분류 없음'

// ── 줄 펴기 ─────────────────────────────────────────────────
// 자료는 자리를 아끼려고 번호로 담겨 있다. 한 번만 펴서 쓴다.
const 줄들 = raw.rows.map((line, i) => {
  const p = line.split('\t')
  return {
    번호: i,
    이름: raw.name[+p[0]],
    대학번호: +p[1],
    대: raw.daeg[+p[2]],
    중: raw.jung[+p[3]],
    소: raw.so[+p[4]],
    주야: raw.juya[+p[5]],
    특성: raw.teuk[+p[6]],
    상태: raw.sangtae[+p[7]],
  }
})

const 대학들 = raw.univ.map((u, i) => ({
  번호: i, 학교명: u[0], 구분: u[1], 학교종류: u[2],
  지역: u[3], 소재지: u[4], 설립구분: u[5],
  // 본교가 아니면 이름에 캠퍼스를 붙여 준다 (같은 이름이 여럿이라 헷갈린다)
  표시: u[1] === '본교' ? u[0] : `${u[0]} (${u[1]})`,
}))

for (const r of 줄들) r.대학 = 대학들[r.대학번호]

// ── 이름 열쇠 ───────────────────────────────────────────────
// ⚠ 「학」·「과」 한 글자를 떼면 「컴퓨터공학」이 「컴퓨터공」이 된다.
//   반드시 덩어리로만 뗀다. 시험이 이것을 지킨다.
const 꼬리들 = ['학과', '학부', '전공', '계열', '학군', '과정', '대학', '학교', '과']
const 괄호 = /[（(][^)）]*[)）]/g
const 기호 = /[\s·・‧ㆍ／/,\-_~∙]/g

/** 대학마다 다르게 부르는 이름을 한 덩어리로 묶는 열쇠 */
export function 이름열쇠(name) {
  let s = String(name ?? '').replace(괄호, '').replace(기호, '').trim()
  // 「간호학부간호학전공」처럼 두 겹으로 붙은 이름이 있어 두 번까지 뗀다.
  for (let n = 0; n < 2; n += 1) {
    const t = 꼬리들.find((x) => s.length > x.length && s.endsWith(x))
    if (!t) break
    s = s.slice(0, -t.length)
  }
  return s.toUpperCase()
}

for (const r of 줄들) r.열쇠 = 이름열쇠(r.이름)

// ── 묶어 두기 ───────────────────────────────────────────────
function 묶기(키뽑기) {
  const m = new Map()
  for (const r of 줄들) {
    const k = 키뽑기(r)
    if (!m.has(k)) m.set(k, [])
    m.get(k).push(r)
  }
  return m
}

const 소별 = 묶기((r) => r.소)
const 중별 = 묶기((r) => r.중)
const 대별 = 묶기((r) => r.대)
const 열쇠별 = 묶기((r) => r.열쇠)
const 대학별 = 묶기((r) => r.대학번호)

export const meta = raw.meta
export const 모든줄 = 줄들
export const 모든대학 = 대학들
export const 없음 = 분류없음

export const 계열나무 = (() => {
  const 대목록 = [...대별.keys()].sort((a, b) => 대별.get(b).length - 대별.get(a).length)
  return 대목록.map((대) => {
    const 안 = 대별.get(대)
    const 중집합 = [...new Set(안.map((r) => r.중))]
    return {
      이름: 대, 수: 안.length,
      자식: 중집합.map((중) => {
        const 안2 = 안.filter((r) => r.중 === 중)
        const 소집합 = [...new Set(안2.map((r) => r.소))]
        return {
          이름: 중, 수: 안2.length,
          자식: 소집합.map((소) => ({ 이름: 소, 수: 안2.filter((r) => r.소 === 소).length }))
            .sort((a, b) => b.수 - a.수),
        }
      }).sort((a, b) => b.수 - a.수),
    }
  })
})()

/** 소분류 하나에 묶인 줄들 */
export const 소분류줄 = (소) => 소별.get(소) || []
/** 중분류 하나에 묶인 줄들 */
export const 중분류줄 = (중) => 중별.get(중) || []
/** 이름 열쇠 하나에 묶인 줄들 */
export const 열쇠줄 = (k) => 열쇠별.get(k) || []
/** 대학 하나의 학과들 */
export const 대학줄 = (i) => 대학별.get(i) || []

export const 소분류목록 = [...소별.keys()]
export const 열쇠목록 = [...열쇠별.keys()]

// ── 찾기 ────────────────────────────────────────────────────
/**
 * 학과 이름으로 찾는다. 같은 이름이 여러 대학에 있으므로 **이름 단위로** 묶어 돌려준다.
 * @returns [{이름, 열쇠, 소, 중, 대, 대학수, 줄들}]
 */
export function 학과찾기(말, 최대 = 60) {
  const q = String(말 ?? '').trim()
  if (!q) return []
  const qk = 이름열쇠(q)
  const 이름별 = new Map()
  for (const r of 줄들) {
    if (!r.이름.includes(q) && !(qk && r.열쇠.includes(qk))) continue
    if (!이름별.has(r.이름)) 이름별.set(r.이름, [])
    이름별.get(r.이름).push(r)
  }
  const out = [...이름별.entries()].map(([이름, rs]) => ({
    이름, 열쇠: rs[0].열쇠, 소: rs[0].소, 중: rs[0].중, 대: rs[0].대,
    대학수: new Set(rs.map((r) => r.대학번호)).size,
    줄들: rs,
  }))
  // 딱 맞는 이름 → 개설 대학이 많은 순
  out.sort((a, b) => {
    const ae = a.이름 === q ? 0 : 1
    const be = b.이름 === q ? 0 : 1
    return ae - be || b.대학수 - a.대학수 || a.이름.localeCompare(b.이름, 'ko')
  })
  return out.slice(0, 최대)
}

/** 대학 이름으로 찾는다 */
export function 대학찾기(말, 최대 = 40) {
  const q = String(말 ?? '').trim()
  if (!q) return []
  return 대학들.filter((u) => u.학교명.includes(q))
    .sort((a, b) => 대학줄(b.번호).length - 대학줄(a.번호).length)
    .slice(0, 최대)
}

/**
 * 이 학과와 「같은 갈래」인 학과들.
 * ⚠ 두 가지 근거를 **따로** 돌려준다. 섞으면 어느 쪽 근거인지 알 수 없어진다.
 */
export function 이웃학과(줄) {
  const 분류 = 줄.소 === 분류없음
    ? []
    : [...new Set(소분류줄(줄.소).map((r) => r.이름))].filter((n) => n !== 줄.이름)
  const 이름 = [...new Set(열쇠줄(줄.열쇠).map((r) => r.이름))].filter((n) => n !== 줄.이름)
  return {
    분류기준: 분류.sort((a, b) => a.localeCompare(b, 'ko')),
    이름기준: 이름.sort((a, b) => a.localeCompare(b, 'ko')),
    // 두 방법이 모두 「같다」고 한 것 — 가장 믿을 만하다
    둘다: 분류.filter((n) => 이름.includes(n)),
  }
}

/** 이름 열쇠별 뭉치 — 「이름 비교」 화면이 쓴다 */
export function 이름뭉치(최소대학 = 2) {
  const out = []
  for (const [k, rs] of 열쇠별) {
    if (!k) continue
    const 이름들 = [...new Set(rs.map((r) => r.이름))]
    if (이름들.length < 2) continue
    const 대학수 = new Set(rs.map((r) => r.대학번호)).size
    if (대학수 < 최소대학) continue
    out.push({ 열쇠: k, 이름들: 이름들.sort((a, b) => a.length - b.length), 대학수, 줄수: rs.length })
  }
  return out.sort((a, b) => b.이름들.length - a.이름들.length || b.대학수 - a.대학수)
}

/** 통계 한 줌 */
export function 통계() {
  const 지역 = new Map()
  for (const u of 대학들) 지역.set(u.지역, (지역.get(u.지역) || 0) + 대학줄(u.번호).length)
  const 종류 = new Map()
  for (const u of 대학들) 종류.set(u.학교종류, (종류.get(u.학교종류) || 0) + 1)
  const 분류없는수 = 줄들.filter((r) => r.소 === 분류없음).length
  return {
    줄수: 줄들.length,
    대학수: 대학들.length,
    이름종류: new Set(줄들.map((r) => r.이름)).size,
    열쇠종류: 열쇠별.size,
    분류없는수,
    분류없는비율: (분류없는수 / 줄들.length) * 100,
    지역: [...지역.entries()].sort((a, b) => b[1] - a[1]),
    종류: [...종류.entries()].sort((a, b) => b[1] - a[1]),
    계열: 계열나무.map((d) => [d.이름, d.수]),
  }
}
