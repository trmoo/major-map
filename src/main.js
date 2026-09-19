/*! 전국 학과 지도 — © 2026 티쳐무 · 모든 권리 보유 */
// 화면 길잡이 (라우터).
//
// 탭 = 대단원, 알약 = 화면. 주소 해시(#chatgi/hakgwa)로 화면을 바로 열 수 있어
// 「이 화면 보세요」라고 주소만 알려 주면 된다.
//
// ⚠ 화면 파일에서 window.addEventListener('resize') 나 setInterval 을 직접 쓰지 말 것.
//   lib/ui.js 의 onResize()·screenInterval() 을 쓴다. 안 그러면 탭을 오갈 때마다 쌓인다.

import './style.css'
import { h, b, beginScreen, setRedraw } from './lib/ui.js'
import { meta } from './lib/data.js'

import TAB_JIDO from './tabs/t1-jido.js'
import TAB_CHATGI from './tabs/t2-chatgi.js'
import TAB_WICHI from './tabs/t6-wichi.js'
import TAB_IREUM from './tabs/t3-ireum.js'
import TAB_DAEHAK from './tabs/t4-daehak.js'
import TAB_ANNAE from './tabs/t5-annae.js'

export const TABS = [TAB_JIDO, TAB_CHATGI, TAB_WICHI, TAB_IREUM, TAB_DAEHAK, TAB_ANNAE]

let now = { tab: TABS[0].id, screen: TABS[0].screens[0].id }

function findTab(id) { return TABS.find((t) => t.id === id) || TABS[0] }
function findScreen(tab, id) { return tab.screens.find((s) => s.id === id) || tab.screens[0] || null }

function readHash() {
  const m = /^#([a-z0-9-]+)(?:\/([a-z0-9-]+))?/.exec(location.hash || '')
  if (!m) return null
  const tab = TABS.find((t) => t.id === m[1])
  if (!tab || !tab.screens.length) return null
  const scr = m[2] ? tab.screens.find((s) => s.id === m[2]) : null
  return { tab: tab.id, screen: (scr || tab.screens[0]).id }
}

export function go(tabId, screenId) {
  const tab = findTab(tabId)
  const scr = findScreen(tab, screenId)
  if (!scr) return
  now = { tab: tab.id, screen: scr.id }
  const want = `#${tab.id}/${scr.id}`
  if (location.hash !== want) { location.hash = want; return }   // hashchange 가 그린다
  draw()
}

// ── 그리기 ─────────────────────────────────────────────────
function drawHeader() {
  document.getElementById('top').replaceChildren(
    h('div.top-inner',
      h('div.brand',
        h('span.brand-mark', '🗺️'),
        h('div',
          h('div.brand-name', '전국 학과 지도'),
          h('div.brand-sub', `전국 ${meta.대학수}개 대학 ${meta.행수.toLocaleString('ko-KR')}개 학과를 갈래로 묶어 봅니다`))),
      h('div.top-right',
        h('button.btn.btn-flat', {
          type: 'button', onclick: () => { go('annae', 'jaryo') },
        }, '❔ 이 앱에 대하여'))),
    h('nav.tabs',
      ...TABS.map((tb, i) => h('button.tab' + (tb.id === now.tab ? '.on' : ''), {
        type: 'button', onclick: () => go(tb.id),
      },
        h('span.tab-no', String(i + 1)),
        h('span.tab-icon', tb.icon),
        h('span.tab-name', tb.name)))),
  )
}

function drawPills() {
  const tab = findTab(now.tab)
  const el = document.getElementById('pills')
  if (tab.screens.length < 2) { el.replaceChildren(); return }
  el.replaceChildren(...tab.screens.map((s) =>
    h('button.spill' + (s.id === now.screen ? '.on' : ''), {
      type: 'button', onclick: () => go(tab.id, s.id),
    }, s.name)))
}

function drawScreen() {
  const tab = findTab(now.tab)
  const scr = findScreen(tab, now.screen)
  const host = document.getElementById('screen')
  beginScreen()
  host.replaceChildren()
  if (!scr) return
  try {
    const out = scr.render()
    host.append(out instanceof Node ? out : h('div', String(out ?? '')))
  } catch (err) {
    console.error(err)
    host.append(h('div.note.note-warn',
      h('b', '화면을 그리지 못했습니다. '),
      h('p', String(err && err.message ? err.message : err)),
      h('p.dim', '브라우저 콘솔(F12)에 자세한 내용이 있습니다.')))
  }
}

function drawFooter() {
  document.getElementById('foot').replaceChildren(
    h('div.foot-inner',
      h('p.foot-copy',
        '전국 학과 지도 · © 2026 티쳐무 · 모든 권리 보유 — 학교 진학 지도 목적으로만 이용해 주세요.'),
      h('p.foot-note',
        '학과 정보의 원자료는 교육부 ', b('「대학알리미」'), ' 공공데이터입니다(공공저작물 제1유형 — 출처표시). ',
        '지도의 시·도 경계는 통계청(KOSTAT) 행정구역경계(2013)입니다. ',
        '이 앱은 이름·학번을 받지 않으며 서버가 없습니다.')))
}

// 머리말과 알약 줄이 둘 다 sticky 라, 머리말 높이를 재어 --top-h 로 넘겨 준다.
function syncTopHeight() {
  const top = document.getElementById('top')
  if (top) document.documentElement.style.setProperty('--top-h', `${top.offsetHeight}px`)
}

function draw() {
  drawHeader()
  drawPills()
  drawScreen()
  drawFooter()
  const scr = findScreen(findTab(now.tab), now.screen)
  document.title = `${scr ? scr.name : findTab(now.tab).name} · 전국 학과 지도`
  requestAnimationFrame(syncTopHeight)
}

window.addEventListener('resize', syncTopHeight)
setRedraw(drawScreen)
window.addEventListener('hashchange', () => {
  const hit = readHash()
  if (hit) { now = hit; draw() }
})

const start = readHash()
if (start) now = start
else location.hash = `#${now.tab}/${now.screen}`
draw()
