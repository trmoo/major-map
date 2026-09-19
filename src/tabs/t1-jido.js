/*! 전국 학과 지도 — © 2026 티쳐무 · 모든 권리 보유 */
// 탭 ① 계열 지도 —— 대(6) → 중(28) → 소(160) 를 파고들며 본다.
//
// ★ 이 분류는 우리가 지어낸 것이 아니다. 교육부 대학알리미 원자료에
//   「표준분류계열(대·중·소)」로 이미 들어 있는 값이다. 그래서 출처를 댈 수 있다.
//
// ⚠ 분류가 없는 줄(N.C.E.)은 지우지 않고 「분류 없음」으로 함께 보여 준다.
//   자율전공·광역모집이 대부분이라 오히려 요즘 입시에서 중요한 덩어리다.

import { h, b, comma, redraw } from '../lib/ui.js'
import {
  lead, card, row, cols, stat, note, caution, source, table, button, tag, empty,
} from '../lib/widgets.js'
import { bars } from '../lib/chart.js'
import { meta, 계열나무, 소분류줄, 없음 } from '../lib/data.js'
import { 지도주소, 이름의소분류 } from '../lib/place.js'
import { 학과열기 } from './t2-chatgi.js'

let 고른대 = ''
let 고른중 = ''
let 고른소 = ''

const 대찾기 = () => 계열나무.find((d) => d.이름 === 고른대) || null
const 중찾기 = () => (대찾기()?.자식 || []).find((m) => m.이름 === 고른중) || null

function 대계열카드() {
  return card('① 큰 갈래 — 표준분류계열(대)',
    h('p.dim', `전국 학부 학과 ${comma(meta.행수)}개를 여섯 갈래로 나눈 것입니다. 눌러서 파고드세요.`),
    h('div.row', ...계열나무.map((d) =>
      button(`${d.이름} ${comma(d.수)}`,
        () => { 고른대 = 고른대 === d.이름 ? '' : d.이름; 고른중 = ''; 고른소 = ''; redraw() },
        { 주요: 고른대 === d.이름 }))),
    bars(계열나무.map((d) => ({ 이름: d.이름, 값: d.수 })), { 얇게: true }))
}

function 중계열카드() {
  const 대 = 대찾기()
  if (!대) return null
  return card(`② 「${대.이름}」 안의 중간 갈래`,
    h('p.dim', `${대.자식.length}갈래 · 학과 ${comma(대.수)}개`),
    h('div.row', ...대.자식.map((m) =>
      button(`${m.이름} ${comma(m.수)}`,
        () => { 고른중 = 고른중 === m.이름 ? '' : m.이름; 고른소 = ''; redraw() },
        { 주요: 고른중 === m.이름, 평평: 고른중 !== m.이름 }))),
    bars(대.자식.slice(0, 14).map((m) => ({ 이름: m.이름, 값: m.수 })), { 얇게: true }))
}

function 소계열카드() {
  const 중 = 중찾기()
  if (!중) return null
  return card(`③ 「${중.이름}」 안의 작은 갈래`,
    h('p.dim', `${중.자식.length}갈래 · 학과 ${comma(중.수)}개. 작은 갈래 하나가 곧 「같은 학과 묶음」입니다.`),
    h('div.row', ...중.자식.map((sm) =>
      button(`${sm.이름} ${comma(sm.수)}`,
        () => { 고른소 = 고른소 === sm.이름 ? '' : sm.이름; redraw() },
        { 주요: 고른소 === sm.이름, 평평: 고른소 !== sm.이름 }))))
}

function 학과목록카드() {
  if (!고른소) return null
  const 줄들 = 소분류줄(고른소)
  if (!줄들.length) return empty('이 갈래에 학과가 없습니다.')
  // 이름별로 묶어 「몇 개 대학이 이 이름을 쓰는가」를 함께 보여 준다.
  const m = new Map()
  for (const r of 줄들) {
    if (!m.has(r.이름)) m.set(r.이름, new Set())
    m.get(r.이름).add(r.대학번호)
  }
  const 목록 = [...m.entries()].map(([이름, s]) => ({ 이름, 대학수: s.size }))
    .sort((a, b) => b.대학수 - a.대학수 || a.이름.localeCompare(b.이름, 'ko'))

  const 대표 = 고른소 === 없음 ? null : 목록.find((x) => 이름의소분류(x.이름) === 고른소)

  return card(`④ 「${고른소}」 갈래의 학과 이름 ${comma(목록.length)}종`,
    고른소 === 없음
      ? caution(b('이 덩어리는 표준분류가 없는 학과들입니다. '),
        '자유전공·광역모집처럼 여러 갈래를 아우르는 모집 단위가 대부분입니다. ',
        '한 갈래로 묶인 것이 아니라 ', b('분류할 수 없어 남은 것'), '이니 그렇게 읽어 주세요.')
      : row(h('p.dim', '같은 갈래인데 대학마다 이렇게 다르게 부릅니다. '
        + '이름을 누르면 그 학과를 자세히 볼 수 있습니다.'),
      // 이 갈래를 대표하는 이름으로 「같은 표준분류(소)」 기준 지도를 연다.
      // ⚠ 한 이름이 여러 분류에 걸치기도 해서, 그 이름의 대표 분류가 이 갈래인 것만 고른다.
      대표 ? button('📍 이 갈래 전체를 지도로', () => { location.hash = 지도주소(대표.이름, '소') }, { 주요: true }) : null),
    table(['학과 이름', '개설 대학', ''],
      목록.map((x) => [x.이름, `${x.대학수}곳`,
        button('자세히', () => 학과열기(x.이름), { 평평: true })]),
      { 정렬: ['left', 'right', 'right'], 높이: '420px', 좁게: true }))
}

function 화면() {
  return h('div',
    lead('계열 지도',
      h('p', '전국 학과를 ', b('큰 갈래 6 → 중간 갈래 28 → 작은 갈래 160'), '으로 파고들며 봅니다. ',
        '작은 갈래 하나가 곧 「이름은 달라도 같은 학과」 묶음입니다.')),
    고른대 || 고른중 || 고른소
      ? row(
        h('p.dim', '지금 보는 곳: ',
          tag(고른대 || '-', 'brand'),
          고른중 ? tag(고른중, 'brand') : null,
          고른소 ? tag(고른소, 'ok') : null),
        button('처음으로', () => { 고른대 = ''; 고른중 = ''; 고른소 = ''; redraw() }, { 평평: true }))
      : null,
    대계열카드(),
    중계열카드(),
    소계열카드(),
    학과목록카드(),
    note(b('이 분류는 우리가 지어낸 것이 아닙니다. '),
      '교육부 대학알리미가 학과마다 매겨 공시한 ', b('표준분류계열'), ' 값을 그대로 쓴 것입니다.'),
    source('학과 정보', meta.출처, meta.주의))
}

export default {
  id: 'jido',
  name: '계열 지도',
  icon: '🗺️',
  screens: [{ id: 'gyeyeol', name: '계열 지도', render: 화면 }],
}
