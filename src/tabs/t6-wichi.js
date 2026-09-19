/*! 전국 학과 지도 — © 2026 티쳐무 · 모든 권리 보유 */
// 탭 ③ 위치 지도 —— 이 학과가 전국 어느 대학에 있는지 지도에 찍는다.
//   (파일 번호가 t6 인 것은 나중에 더한 탭이라서다. 탭 차례는 main.js 의 TABS 가 정한다.)
//
// 상담에서 「우리 지역에도 이 학과가 있나요?」·「수도권 밖에는 어디 있나요?」에
// 한눈에 답하는 화면이다. 학과를 고르지 않으면 전국 대학 분포가 나온다.
//
// ★ 기준을 **섞지 않는다** (학과 찾기 화면과 같은 원칙).
//   「이 이름 그대로 / 이름이 비슷한 학과 / 같은 표준분류(소)」 셋 가운데 하나를 고르고,
//   단추마다 대학 수를 적어 「넓히면 이만큼 는다」를 보여 준다.
//
// ⚠ 점은 **캠퍼스의 정확한 위치가 아니라 시·군·구의 대표 위치**다. 화면에 밝힌다.
// ⚠ 수도권은 점이 겹쳐 전국 지도에서는 빼고, 옆 「수도권 확대」 지도에만 찍는다.
// ⚠ 주소(#wichi/hakgwa?q=…&by=…)를 그대로 알려 주면 같은 지도가 열린다.
//   주소를 바꿀 때 history.replaceState 를 쓴다 — location.hash 를 바꾸면
//   hashchange 가 화면을 한 번 더 그린다.

import { h, b, comma, redraw, uniq } from '../lib/ui.js'
import {
  lead, card, row, cols, stat, note, caution, source, table, input, button, tag, empty, pillGroup,
} from '../lib/widgets.js'
import { ratioBar } from '../lib/chart.js'
import { meta, 학과찾기, 모든대학, 없음 } from '../lib/data.js'
import {
  지도meta, 전국틀, 수도권틀, 섬상자, 시도경계, 독도자리, 울릉도자리,
  학교갈래목록, 기본학교갈래, 기준목록, 이름의소분류,
  지도줄, 기준별대학수, 점으로묶기, 점반지름, 시도별, 권역별, 광역시인가,
  지도주소, 지도주소읽기,
} from '../lib/place.js'
import { 학과열기 } from './t2-chatgi.js'
import { 대학열기 } from './t4-daehak.js'

let 검색어 = ''
let 고른이름 = ''
let 기준 = '이름'
let 갈래들 = [...기본학교갈래]
let 고른점 = ''
let 읽은주소 = ''

// ── 주소 ─────────────────────────────────────────────────────
function 주소에서읽기() {
  if (location.hash === 읽은주소) return
  읽은주소 = location.hash
  const 주소 = 지도주소읽기(location.hash)
  if (!주소) return
  검색어 = 주소.이름
  고른이름 = 주소.이름
  기준 = 주소.기준
  고른점 = ''
}

function 주소에쓰기() {
  const 새주소 = 지도주소(고른이름, 기준)
  if (location.hash !== 새주소) history.replaceState(null, '', 새주소)
  읽은주소 = location.hash
}

function 바꾸기(fn) {
  fn()
  주소에쓰기()
  redraw()
}

// ── SVG ──────────────────────────────────────────────────────
const NS = 'http://www.w3.org/2000/svg'
function sv(tag, attrs = {}, ...kids) {
  const el = document.createElementNS(NS, tag)
  for (const [k, v] of Object.entries(attrs)) {
    if (v === null || v === undefined || v === false) continue
    if (k.startsWith('on') && typeof v === 'function') el.addEventListener(k.slice(2), v)
    else el.setAttribute(k, v)
  }
  for (const c of kids.flat()) if (c) el.append(c instanceof Node ? c : document.createTextNode(String(c)))
  return el
}

// 권역마다 옅은 색. 광역시는 같은 색을 조금 짙게.
const 바탕색 = {
  수도권: ['#dbe7f3', '#c3d7ec'],
  강원: ['#dfeed8', '#cbe3c0'],
  충청: ['#ece3f3', '#dccbea'],
  호남: ['#f4ead5', '#ead8b4'],
  영남: ['#f6e0da', '#edc8be'],
  제주: ['#e4e6ee', '#d2d6e3'],
}

/**
 * 지도 하나를 그린다.
 * @param opt.틀     viewBox 로 보여 줄 곳 {x, y, 너비, 높이}
 * @param opt.명목   화면에서 대략 몇 px 너비로 보일지 — 점·글자 크기를 px 로 맞추는 데 쓴다
 * @param opt.점들   이 학과가 있는 곳
 * @param opt.빈점들 대학은 있지만 이 학과는 없는 곳
 */
function 지도(opt) {
  const { 틀, 점들, 빈점들 = [] } = opt
  const k = 틀.너비 / opt.명목            // px 1 이 지도 칸으로 얼마인가
  const el = sv('svg', {
    viewBox: `${틀.x} ${틀.y} ${틀.너비} ${틀.높이}`, width: '100%', class: 'wmap',
    role: 'img', 'aria-label': opt.설명,
  })
  // 바다
  el.append(sv('rect', { x: 틀.x, y: 틀.y, width: 틀.너비, height: 틀.높이, class: 'wmap-sea' }))

  // 시·도
  for (const s of 시도경계) {
    const 색 = (바탕색[s.권역] || ['#eee', '#ddd'])[s.광역시 ? 1 : 0]
    el.append(sv('path', { d: s.본토, fill: 색, class: 'wmap-sido' }, sv('title', {}, s.정식)))
  }

  // 울릉도·독도 상자
  if (opt.섬) {
    const 상 = 섬상자
    el.append(sv('rect', { x: 상.x - 4, y: 상.y - 14, width: 상.너비 + 8, height: 상.높이 + 22,
      class: 'wmap-inset', rx: 3 }))
    el.append(sv('text', { x: 상.x, y: 상.y - 4, class: 'wmap-small', 'font-size': 10 * k }, '울릉도·독도'))
    // 섬이 작아서 흰 테두리를 두르면 사라진다 — 짙은 색에 회색 테두리로 그린다.
    for (const s of 시도경계) if (s.섬) el.append(sv('path', { d: s.섬, class: 'wmap-island' }))
    el.append(sv('circle', { cx: 독도자리[0], cy: 독도자리[1], r: 2.2 * k, class: 'wmap-dokdo' }))
    el.append(sv('text', { x: 독도자리[0], y: 독도자리[1] + 12 * k, 'text-anchor': 'middle',
      class: 'wmap-small', 'font-size': 9.5 * k }, '독도'))
    el.append(sv('text', { x: 울릉도자리[0], y: 울릉도자리[1] + 13 * k, 'text-anchor': 'middle',
      class: 'wmap-small', 'font-size': 9.5 * k }, '울릉도'))
  }

  // 수도권 상자 (전국 지도에서만)
  if (opt.수도권상자) {
    const q = 수도권틀
    el.append(sv('rect', { x: q.x, y: q.y, width: q.너비, height: q.높이, class: 'wmap-capbox', rx: 2 }))
    el.append(sv('text', { x: q.x + q.너비 / 2, y: q.y - 5 * k, 'text-anchor': 'middle',
      class: 'wmap-caplabel', 'font-size': 12 * k }, opt.수도권상자))
  }

  // 시·도 이름 (광역시는 점과 겹치므로 조금 아래에)
  for (const s of 시도경계) {
    if (opt.이름표거르기 && !opt.이름표거르기(s)) continue
    const 작게 = s.광역시
    const [x, y] = s.이름표
    el.append(sv('text', {
      x, y: 작게 && opt.광역시아래 ? y + 16 * k : y, 'text-anchor': 'middle',
      class: `wmap-label${작게 ? ' wmap-label-sm' : ''}`, 'font-size': (작게 ? 11 : 14) * k,
    }, s.이름))
  }

  // 대학은 있지만 이 학과는 없는 곳
  for (const p of 빈점들) {
    el.append(sv('circle', { cx: p.좌표[0], cy: p.좌표[1], r: 2.6 * k, class: 'wmap-empty' },
      sv('title', {}, `${p.이름표} — 대학 ${p.대학.size}곳, 이 학과는 없음`)))
  }

  // 점 이름이 서로·다른 점과 겹치면 읽을 수 없다(서울 도심은 구가 빽빽하다).
  // 큰 점부터 오른쪽 → 왼쪽 순서로 자리를 찾아보고, 둘 다 겹치면 이름을 뺀다.
  // 빠진 이름은 점에 마우스를 올리거나 눌러서 본다.
  const 반지름 = (n) => 점반지름(n) * k
  const 막힘 = 점들.map((p) => {
    const r = 반지름(p.대학.size)
    return [p.좌표[0] - r, p.좌표[1] - r, p.좌표[0] + r, p.좌표[1] + r]
  })
  const 겹치나 = (a, 자기) => 막힘.some((m, i) => i !== 자기
    && a[0] < m[2] && a[2] > m[0] && a[1] < m[3] && a[3] > m[1])
  const 이름자리 = (p, i) => {
    const r = 반지름(p.대학.size)
    const 글 = 10.5 * k
    const 너비 = p.이름표.length * 글 * 1.02
    for (const 쪽 of [1, -1]) {
      const x = 쪽 > 0 ? p.좌표[0] + r + 2.5 * k : p.좌표[0] - r - 2.5 * k - 너비
      const 상자 = [x, p.좌표[1] - 글 * 0.6, x + 너비, p.좌표[1] + 글 * 0.6]
      if (!겹치나(상자, i)) { 막힘.push(상자); return { x, 쪽 } }
    }
    return null
  }

  // 이 학과가 있는 곳 — 큰 점을 먼저 그려 작은 점이 위에 오게 한다
  for (const [i, p] of 점들.entries()) {
    const n = p.대학.size
    const r = 반지름(n)
    const 골랐나 = 고른점 === p.열쇠
    const 고르기 = () => 바꾸기(() => { 고른점 = 골랐나 ? '' : p.열쇠 })
    const g = sv('g', {
      class: `wmap-pt${골랐나 ? ' on' : ''}${opt.전체 ? ' all' : ''}`, tabindex: 0, role: 'button',
      'aria-label': `${p.이름표} 대학 ${n}곳`,
      onclick: 고르기,
      onkeydown: (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); 고르기() } },
    },
    sv('title', {}, `${p.이름표}${광역시인가(p.시도) || p.시도 === p.이름표 ? '' : ` (${p.시도})`} — 대학 ${n}곳`),
    sv('circle', { cx: p.좌표[0], cy: p.좌표[1], r }),
    n >= 2 ? sv('text', { x: p.좌표[0], y: p.좌표[1], 'text-anchor': 'middle', 'dominant-baseline': 'central',
      'font-size': Math.min(r * 1.05, 15 * k) }, String(n)) : null)
    const 자리 = opt.점이름 ? 이름자리(p, i) : null
    if (자리) {
      g.append(sv('text', { x: 자리.x, y: p.좌표[1], 'dominant-baseline': 'central',
        class: 'wmap-ptname', 'font-size': 10.5 * k }, p.이름표))
    }
    el.append(g)
  }
  return el
}

// ── 카드 ─────────────────────────────────────────────────────
function 고르기카드() {
  const 결과 = 검색어.trim() && 검색어 !== 고른이름 ? 학과찾기(검색어, 16) : []
  return card('학과 고르기',
    row(
      input(검색어, (v) => { 검색어 = v },
        { 라벨: '학과 이름', 안내: '예: 컴퓨터공학과 · 간호 · 물리치료 · 항공', 다시그리기: true }),
      고른이름 ? button('전국 대학 전체 보기', () => 바꾸기(() => {
        검색어 = ''; 고른이름 = ''; 고른점 = ''
      }), { 평평: true }) : null),
    결과.length
      ? h('div',
        h('p.dim', '하나를 누르면 지도에 찍힙니다. (괄호 안은 개설 대학 수)'),
        h('div.row', ...결과.map((x) => button(`${x.이름} (${x.대학수})`,
          () => 바꾸기(() => { 검색어 = x.이름; 고른이름 = x.이름; 고른점 = '' }), { 평평: true }))))
      : (검색어.trim() && 검색어 !== 고른이름 ? empty('그런 이름의 학과가 없습니다. 낱말 일부만 쳐 보세요.') : null),
    고른이름 ? 기준고르기() : h('p.dim', '학과를 고르지 않으면 ', b('전국 대학 분포'), '가 나옵니다.'))
}

function 기준고르기() {
  const 수 = 기준별대학수(고른이름, 갈래들)
  const 소 = 이름의소분류(고른이름)
  return h('div',
    h('p', '지금 보는 학과: ', b(`「${고른이름}」`),
      소 && 소 !== 없음 ? h('span.dim', `  · 표준분류(소) ${소}`) : h('span.dim', '  · 표준분류 없음')),
    pillGroup(기준목록.map((g) => ({ 값: g.값, 이름: `${g.이름} ${수[g.값]}곳` })), 기준,
      (v) => { 기준 = v; 고른점 = ''; 주소에쓰기() }),
    기준 === '열쇠'
      ? caution(b('이름이 비슷한 학과는 어림입니다. '),
        '괄호와 「학과·학부·전공」 꼬리를 떼고 견준 것이라 뜻이 다른 학과가 섞일 수 있습니다.')
      : null,
    기준 === '소' && (!소 || 소 === 없음)
      ? caution(b('이 학과는 표준분류가 없어 이 기준으로는 묶지 않습니다. '),
        '묶으면 자유전공·광역모집이 통째로 한 학과가 됩니다.')
      : null,
    기준 !== '이름' && 수[기준]
      ? h('p.dim', '어떤 이름들이 들어 있는지는 ',
        button('학과 찾기에서 보기', () => 학과열기(고른이름), { 평평: true }))
      : null)
}

function 갈래카드() {
  return row(
    h('span.field-label', '학교 종류'),
    ...학교갈래목록.map((g) => {
      const 켬 = 갈래들.includes(g.값)
      return h(`button.pill${켬 ? '.on' : ''}`, {
        type: 'button', 'aria-pressed': 켬 ? 'true' : 'false',
        onclick: () => 바꾸기(() => {
          갈래들 = 켬 ? 갈래들.filter((x) => x !== g.값) : [...갈래들, g.값]
          고른점 = ''
        }),
      }, `${켬 ? '✓ ' : ''}${g.이름}`)
    }))
}

function 고른곳카드(점들전국, 점들자세히) {
  const p = 점들전국.find((x) => x.열쇠 === 고른점) || 점들자세히.find((x) => x.열쇠 === 고른점)
  if (!p) {
    const 많은곳 = 점들자세히.slice(0, 8)
    return h('div.wmap-side',
      h('h4', '점을 눌러 보세요'),
      h('p.dim', '그곳에 있는 대학과 학과 이름이 여기에 나옵니다.'),
      많은곳.length
        ? h('div', h('p.dim', '대학이 많은 곳:'),
          h('div.row', ...많은곳.map((x) => button(`${x.시도 === x.이름표 ? x.이름표 : `${x.시도} ${x.이름표}`} ${x.대학.size}`,
            () => 바꾸기(() => { 고른점 = x.열쇠 }), { 평평: true }))))
        : null)
  }
  const 대학들 = [...p.대학.entries()]
    .map(([번호, 줄들]) => ({ u: 모든대학[번호], 줄들 }))
    .sort((a, b2) => a.u.표시.localeCompare(b2.u.표시, 'ko'))
  const 여러구 = p.시군구들.size > 1
  return h('div.wmap-side',
    h('div.wmap-sidehead',
      h('h4', `📍 ${p.이름표 === p.시도 ? p.이름표 : `${p.시도} ${p.이름표}`} — 대학 ${대학들.length}곳`),
      button('닫기', () => 바꾸기(() => { 고른점 = '' }), { 평평: true })),
    table(['대학', '학과'],
      대학들.map(({ u, 줄들 }) => [
        h('div',
          button(u.표시, () => 대학열기(u.번호), { 평평: true }),
          h('div.dim', u.학교종류, 여러구 ? ` · ${uniq(줄들.map((r) => r.시군구)).join('·')}` : '')),
        h('div', ...uniq(줄들.map((r) => r.이름)).map((n) => tag(n, 'brand'))),
      ]),
      { 정렬: ['left', 'left'], 높이: '430px', 좁게: true }))
}

function 지도카드() {
  const 줄들 = 지도줄(고른이름, 기준, 갈래들)
  const 전체 = !고른이름
  const 수도권인가 = (p) => p.시도 === '서울' || p.시도 === '인천' || p.시도 === '경기'

  const 점들전국 = 점으로묶기(줄들, '전국')
  const 점들자세히 = 점으로묶기(줄들, '자세히')
  const 빈전국 = 전체 ? [] : 점으로묶기(지도줄('', '이름', 갈래들), '전국')
    .filter((p) => !점들전국.some((x) => x.열쇠 === p.열쇠))
  const 빈자세히 = 전체 ? [] : 점으로묶기(지도줄('', '이름', 갈래들), '자세히')
    .filter((p) => !점들자세히.some((x) => x.열쇠 === p.열쇠))

  const 대학수 = new Set(줄들.map((r) => r.대학번호)).size
  const 수도권수 = new Set(줄들.filter((r) => ['서울', '인천', '경기'].includes(r.시도)).map((r) => r.대학번호)).size
  const 밖수 = new Set(줄들.filter((r) => !['서울', '인천', '경기'].includes(r.시도)).map((r) => r.대학번호)).size
  const 권역 = 권역별(줄들)

  if (!줄들.length) {
    return card('지도',
      갈래카드(),
      empty(갈래들.length ? '고른 기준·학교 종류에 해당하는 대학이 없습니다.' : '학교 종류를 하나 이상 켜 주세요.'))
  }

  const 전국지도 = 지도({
    틀: 전국틀, 명목: 560, 섬: true, 광역시아래: true,
    점들: 점들전국.filter((p) => !수도권인가(p)),
    빈점들: 빈전국.filter((p) => !수도권인가(p)),
    수도권상자: `수도권 ${수도권수}곳 → 확대 지도`,
    이름표거르기: (s) => !['서울', '인천', '경기'].includes(s.이름),
    전체,
    설명: `전국 지도. ${고른이름 || '전체 대학'} — 대학 ${대학수}곳`,
  })
  const 수도권지도 = 지도({
    틀: 수도권틀, 명목: 440,
    점들: 점들자세히.filter(수도권인가),
    빈점들: 빈자세히.filter(수도권인가),
    이름표거르기: (s) => ['서울', '인천', '경기'].includes(s.이름),
    점이름: !전체,
    전체,
    설명: `수도권 확대 지도 — 대학 ${수도권수}곳`,
  })

  return h('div',
    card(고른이름 ? `「${고른이름}」 ${기준 === '이름' ? '' : `· ${기준목록.find((g) => g.값 === 기준).이름} `}— 전국 ${대학수}곳` : `전국 대학 분포 — ${대학수}곳`,
      갈래카드(),
      cols(4,
        stat('대학·캠퍼스', `${comma(대학수)}곳`),
        stat('학과(공시 단위)', `${comma(줄들.length)}개`),
        stat('수도권', `${comma(수도권수)}곳`, '서울·인천·경기'),
        stat('수도권 밖', `${comma(밖수)}곳`, '비수도권 캠퍼스')),
      h('div.wmap-grid',
        h('div.wmap-main',
          전국지도,
          h('p.wmap-legend',
            h('span.wmap-key.wmap-key-on', ''), 전체 ? ' 대학이 있는 곳' : ' 이 학과가 있는 곳',
            '  (숫자 = 대학 수)',
            전체 ? null : h('span', '   ', h('span.wmap-key.wmap-key-off', ''), ' 대학은 있지만 이 학과는 없는 곳'))),
        h('div.wmap-right',
          h('div.wmap-capwrap', h('div.wmap-captitle', '수도권 확대'), 수도권지도),
          고른곳카드(점들전국, 점들자세히))),
      h('h4', '권역별 대학 수'),
      ratioBar(권역.filter((x) => x.수).map((x) => ({ 이름: x.권역, 값: x.수 })), { 값글: (p) => `${p.이름} ${p.값}` }),
      h('div.row', ...권역.map((x) => tag(`${x.권역} ${x.수}`, x.수 ? 'brand' : ''))),
      h('p.dim', '캠퍼스가 두 권역에 걸친 대학은 두 곳 모두에서 셉니다.')),
    시도표카드(줄들))
}

function 시도표카드(줄들) {
  const 표 = 시도별(줄들)
  return card('시·도별 목록',
    h('p.dim', '대학 이름을 누르면 그 대학의 학과 전부를 봅니다(대학별 보기).'),
    table(['시·도', '권역', '대학', ''],
      표.map(({ 시도, 권역, 대학 }) => [
        b(시도), 권역, `${대학.size}곳`,
        h('div.row.wmap-chips', ...[...대학.keys()]
          .map((번호) => 모든대학[번호])
          .sort((a, b2) => a.표시.localeCompare(b2.표시, 'ko'))
          .map((u) => h('button.wmap-chip', { type: 'button', onclick: () => 대학열기(u.번호) },
            u.표시))),
      ]),
      { 정렬: ['left', 'left', 'right', 'left'], 좁게: true }))
}

function 화면() {
  주소에서읽기()
  return h('div',
    lead('학과 위치 지도',
      h('p', '학과를 고르면 ', b('전국 어느 대학에 있는지'), ' 지도에 찍습니다. ',
        '「우리 지역에도 있나요?」·「수도권 밖에는 어디 있나요?」에 한눈에 답할 수 있습니다.')),
    고르기카드(),
    지도카드(),
    note(b('📍 점은 캠퍼스의 정확한 위치가 아닙니다. '),
      '그 학과가 있는 ', b('시·군·구의 대표 위치(시청·군청·구청 부근)'), '에 찍었습니다. ',
      '위치는 대학 본부가 아니라 ', b('그 학과가 있는 캠퍼스'), '의 소재지로 잡았습니다 — ',
      '예를 들어 캠퍼스가 서울과 수원에 있는 대학은 학과마다 다른 곳에 찍힙니다. ',
      '원격대학(사이버·방송통신)은 어디서나 수업을 들으므로 기본으로 뺐습니다.'),
    note(b('⚠ 학과명은 입시의 「모집단위」와 다릅니다. '),
      '실제로 학생을 뽑는 단위는 여러 학과를 묶은 이름일 때가 많습니다. ',
      '지원할 때는 반드시 그 대학의 모집요강을 확인하세요.'),
    source('지도', `시·도 경계 — ${지도meta.경계출처}. 시·군·구 위치 — 시청·군청·구청 부근의 위경도를 적은 것.`,
      지도meta.경계주의),
    source('학과 정보', meta.출처, meta.주의))
}

export default {
  id: 'wichi',
  name: '위치 지도',
  icon: '📍',
  screens: [{ id: 'hakgwa', name: '학과 위치 지도', render: 화면 }],
}
