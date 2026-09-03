/*! 전국 학과 지도 — © 2026 티쳐무 · 모든 권리 보유 */
// 탭 ③ 이름 비교 —— 같은 것을 대학마다 얼마나 다르게 부르는가.
//
// 「간호학과 / 간호학부 / 간호전공 / 간호대학」처럼 이름만 다른 학과를 한 줄로 모은다.
// 학생이 원서를 쓸 때 「내가 찾던 학과가 여기서는 이 이름이구나」를 알게 하는 화면이다.
//
// ⚠ 이 묶음은 **어림**이다. 괄호와 「학과·학부·전공」 꼬리를 떼고 어간을 견줄 뿐이라
//   「국제학부」와 「국제통상학부」처럼 뜻이 다른 것이 섞일 수 있다.
//   그래서 화면에 그렇게 밝히고, 표준분류가 갈리는 뭉치에는 표를 붙여 알린다.

import { h, b, comma, redraw, uniq } from '../lib/ui.js'
import {
  lead, card, row, cols, stat, note, caution, source, table, input, button, tag, empty,
} from '../lib/widgets.js'
import { meta, 이름뭉치, 열쇠줄, 없음 } from '../lib/data.js'
import { 학과열기 } from './t2-chatgi.js'

let 찾기 = ''
let 최소이름 = 3

// 한 번만 만들어 둔다 (5,947 열쇠를 훑으므로 화면을 그릴 때마다 하면 느리다)
let 뭉치들 = null
const 모든뭉치 = () => (뭉치들 || (뭉치들 = 이름뭉치(2)))

/** 뭉치의 대표 이름 — 가장 짧은 이름을 쓴다. 내부 열쇠는 사람이 읽기에 이상하다. */
const 대표 = (b2) => b2.이름들[0]

function 목록카드() {
  const q = 찾기.trim()
  const 목록 = 모든뭉치()
    .filter((x) => x.이름들.length >= 최소이름)
    .filter((x) => !q || x.이름들.some((n) => n.includes(q)))
    .slice(0, 300)

  return card('같은 것을 다르게 부르는 학과',
    row(
      input(찾기, (v) => { 찾기 = v }, { 라벨: '이름으로 좁히기', 안내: '예: 간호 · 컴퓨터 · 경영', 다시그리기: true }),
      button('찾기', () => redraw(), { 주요: true }),
      찾기 ? button('지우기', () => { 찾기 = ''; redraw() }, { 평평: true }) : null),
    h('div.row',
      h('span.field-label', '이름이 몇 가지 이상인 것만'),
      ...[2, 3, 5, 10].map((n) =>
        button(`${n}종 이상`, () => { 최소이름 = n; redraw() },
          { 주요: 최소이름 === n, 평평: 최소이름 !== n }))),
    목록.length
      ? table(['대표 이름', '이름 가짓수', '개설 대학', '실제 이름들'],
        목록.map((x) => [
          대표(x),
          `${x.이름들.length}종`,
          `${x.대학수}곳`,
          h('div.row', ...x.이름들.slice(0, 14).map((n) =>
            button(n, () => 학과열기(n), { 평평: true })),
            x.이름들.length > 14 ? h('span.dim', `… 그 밖 ${x.이름들.length - 14}종`) : null),
        ]),
        { 정렬: ['left', 'right', 'right', 'left'], 높이: '560px', 좁게: true })
      : empty('그런 이름이 없습니다.'),
    h('p.dim', `${comma(목록.length)}뭉치를 보여 줍니다`
      + (목록.length >= 300 ? ' (많아서 300개까지만 보여 줍니다).' : '.')))
}

function 요약카드() {
  const all = 모든뭉치()
  const 이름많은 = all.filter((x) => x.이름들.length >= 10).length
  const 최대 = all[0]
  return card('한눈에',
    cols(4,
      stat('이름이 갈린 뭉치', `${comma(all.length)}개`),
      stat('10종 이상 갈린 뭉치', `${comma(이름많은)}개`),
      stat('가장 많이 갈린 것', 최대 ? `${대표(최대)} ${최대.이름들.length}종` : '-'),
      stat('전체 학과 이름', `${comma(meta.행수)}개`)),
    caution(b('이 묶음은 어림입니다. '),
      '괄호와 「학과·학부·전공·계열」 꼬리를 떼고 어간이 같은 것을 모았을 뿐이라, ',
      '뜻이 다른 학과가 섞일 수 있습니다. ',
      b('갈래를 정확히 보려면 ① 계열 지도나 ② 학과 찾기의 「표준분류」 쪽을 쓰세요.')))
}

function 화면() {
  return h('div',
    lead('이름 비교',
      h('p', '같은 학과인데 대학마다 부르는 이름이 다릅니다. ',
        b('「간호학과 / 간호학부 / 간호전공 / 간호대학」'), '처럼요. ',
        '학생이 찾던 학과를 다른 이름으로 놓치지 않게 모아 두었습니다.')),
    요약카드(),
    목록카드(),
    source('학과 정보', meta.출처, meta.주의))
}

export default {
  id: 'ireum',
  name: '이름 비교',
  icon: '🔤',
  screens: [{ id: 'bigyo', name: '이름 비교', render: 화면 }],
}
