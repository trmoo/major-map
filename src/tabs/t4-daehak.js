/*! 전국 학과 지도 — © 2026 티쳐무 · 모든 권리 보유 */
// 탭 ④ 대학별 보기 —— 대학 하나를 고르면 개설 학과 전부와 계열 분포를 본다.
//
// 상담에서 「이 대학에 무슨 과가 있어요?」를 바로 답하는 화면이다.
//
// ⚠ 여기 나오는 것은 **공시된 학과·전공**이고 그 해 실제로 뽑는 모집단위와 다르다.
//   폐과·신설이 섞여 있으므로 상태 칸을 함께 보여 준다.

import { h, b, comma, redraw, uniq } from '../lib/ui.js'
import {
  lead, card, row, cols, stat, note, source, table, input, button, tag, empty,
} from '../lib/widgets.js'
import { ratioBar } from '../lib/chart.js'
import { meta, 대학찾기, 대학줄, 모든대학, 없음 } from '../lib/data.js'
import { 학과열기 } from './t2-chatgi.js'

let 찾기 = ''
let 고른번호 = null

/** 학과가 많은 순으로 미리 보여 줄 대학 몇 곳 */
const 큰대학 = 모든대학.slice()
  .sort((a, b) => 대학줄(b.번호).length - 대학줄(a.번호).length)
  .slice(0, 12)

function 고르기카드() {
  const 결과 = 찾기.trim() ? 대학찾기(찾기) : []
  return card('대학 고르기',
    row(
      input(찾기, (v) => { 찾기 = v }, { 라벨: '대학 이름', 안내: '예: 가천 · 서울 · 경북', 다시그리기: true }),
      button('찾기', () => redraw(), { 주요: true }),
      찾기 ? button('지우기', () => { 찾기 = ''; redraw() }, { 평평: true }) : null),
    찾기.trim()
      ? (결과.length
        ? h('div.row', ...결과.map((u) =>
          button(`${u.표시} (${대학줄(u.번호).length})`,
            () => { 고른번호 = u.번호; redraw() },
            { 주요: 고른번호 === u.번호, 평평: 고른번호 !== u.번호 })))
        : empty('그런 이름의 대학이 없습니다.'))
      : h('div',
        h('p.dim', '학과가 많은 대학 12곳입니다. 다른 대학은 이름으로 찾으세요.'),
        h('div.row', ...큰대학.map((u) =>
          button(`${u.표시} (${대학줄(u.번호).length})`,
            () => { 고른번호 = u.번호; redraw() },
            { 주요: 고른번호 === u.번호, 평평: 고른번호 !== u.번호 })))))
}

function 자세히카드() {
  if (고른번호 === null) return null
  const u = 모든대학[고른번호]
  const 줄들 = 대학줄(고른번호)
  if (!u || !줄들.length) return empty('학과 정보가 없습니다.')

  // 계열 분포
  const 계열 = new Map()
  for (const r of 줄들) 계열.set(r.대, (계열.get(r.대) || 0) + 1)
  const 분포 = [...계열.entries()].sort((a, b) => b[1] - a[1])

  // 중분류로 묶어 보여 준다 (소분류는 너무 잘게 갈린다)
  const 중별 = new Map()
  for (const r of 줄들) {
    if (!중별.has(r.중)) 중별.set(r.중, [])
    중별.get(r.중).push(r)
  }
  const 묶음 = [...중별.entries()].sort((a, b) => b[1].length - a[1].length)

  return h('div',
    card(u.표시,
      cols(4,
        stat('개설 학과', `${comma(줄들.length)}개`),
        stat('학교종류', u.학교종류),
        stat('지역', `${u.지역} ${u.소재지}`.trim()),
        stat('설립', u.설립구분)),
      h('h4', '계열 분포'),
      ratioBar(분포.map(([이름, 값]) => ({ 이름, 값 })), { 값글: (p) => `${p.이름} ${p.값}` }),
      h('div.row', ...분포.map(([g, n]) => tag(`${g} ${n}`, 'brand')))),

    ...묶음.map(([중, rs]) => card(`${중 === 없음 ? 없음 : 중} — ${rs.length}개`,
      table(['학과', '표준분류(소)', '주야', '상태', ''],
        rs.slice()
          .sort((a, b) => a.이름.localeCompare(b.이름, 'ko'))
          .map((r) => [
            r.이름,
            r.소 === 없음 ? h('span.dim', 없음) : r.소,
            r.주야 === '주간' ? h('span.dim', '주간') : tag(r.주야, 'warn'),
            r.상태 === '기존' ? h('span.dim', '기존') : tag(r.상태, 'warn'),
            button('갈래 보기', () => 학과열기(r.이름), { 평평: true }),
          ]),
        { 정렬: ['left', 'left', 'left', 'left', 'right'], 좁게: true }))),
  )
}

function 화면() {
  return h('div',
    lead('대학별 보기',
      h('p', '대학 하나를 고르면 ', b('공시된 학과 전부'), '와 계열 분포를 봅니다. ',
        '「이 대학에 무슨 과가 있나요」에 바로 답할 수 있습니다.')),
    고르기카드(),
    자세히카드(),
    note(b('⚠ 공시된 학과이지 그 해 모집단위가 아닙니다. '),
      '신설·변경·통합된 학과가 섞여 있어 상태 칸을 함께 보여 줍니다. ',
      '실제 모집 여부와 인원은 그 대학 모집요강을 확인하세요.'),
    source('학과 정보', meta.출처, meta.주의))
}

export default {
  id: 'daehak',
  name: '대학별 보기',
  icon: '🏫',
  screens: [{ id: 'byul', name: '대학별 보기', render: 화면 }],
}
