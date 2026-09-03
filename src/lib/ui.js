/*! 전국 학과 지도 — © 2026 티쳐무 · 모든 권리 보유 */
// 화면을 만드는 기본 도구.
//
// ★ 화면 수명 관리 (다른 앱에서 실제로 겪은 문제)
//   탭을 옮기면 화면은 지워지지만, 그 화면이 window 에 걸어 둔 resize 리스너와
//   setInterval 은 살아남아 오갈 때마다 쌓인다.
//   그래서 화면 파일에서는 window.addEventListener('resize', …) 나 setInterval 을
//   직접 쓰지 말고 아래 onResize() · screenInterval() 을 쓸 것.

// ── 요소 만들기 ────────────────────────────────────────────
/**
 * h('div.card', {onclick}, '글자', 다른요소, …)
 * 첫 인자는 태그 이름에 .클래스 와 #아이디 를 붙여 쓸 수 있다.
 *
 * ⚠ 자식 자리에 HTML 태그를 문자열로 넣지 말 것 — 글자 그대로 나온다.
 *   굵게 쓰려면 h('b', '글자') 를, 꼭 HTML 이 필요하면 {html: '…'} 를 쓴다.
 */
export function h(sel, ...rest) {
  const m = /^([a-zA-Z][\w-]*)?((?:[.#][\w-]+)*)$/.exec(sel)
  if (!m) throw new Error(`h(): 이해 못 할 선택자 「${sel}」`)
  const el = document.createElement(m[1] || 'div')
  for (const token of m[2].match(/[.#][\w-]+/g) || []) {
    if (token[0] === '.') el.classList.add(token.slice(1))
    else el.id = token.slice(1)
  }
  let children = rest
  if (rest.length && isPlainObject(rest[0])) {
    applyProps(el, rest[0])
    children = rest.slice(1)
  }
  append(el, children)
  return el
}

function isPlainObject(v) {
  return v && typeof v === 'object' && !(v instanceof Node) && !Array.isArray(v)
}

function applyProps(el, props) {
  for (const [k, v] of Object.entries(props)) {
    if (v === null || v === undefined || v === false) continue
    if (k === 'html') el.innerHTML = v
    else if (k === 'style' && typeof v === 'object') Object.assign(el.style, v)
    else if (k === 'class') el.className = [el.className, v].filter(Boolean).join(' ')
    else if (k.startsWith('on') && typeof v === 'function') {
      el.addEventListener(k.slice(2).toLowerCase(), v)
    } else if (k in el && k !== 'list') el[k] = v
    else el.setAttribute(k, v === true ? '' : v)
  }
}

function append(el, children) {
  for (const c of children.flat(6)) {
    if (c === null || c === undefined || c === false || c === '') continue
    el.append(c instanceof Node ? c : document.createTextNode(String(c)))
  }
}

export const t = (s) => document.createTextNode(String(s))
export const frag = (...kids) => { const f = document.createDocumentFragment(); append(f, kids); return f }

// 자주 쓰는 것들
export const b = (...k) => h('b', ...k)
export const mono = (...k) => h('code.mono', ...k)
export const em = (...k) => h('em', ...k)

// ── 화면 수명 ──────────────────────────────────────────────
let screenTokens = { resize: [], timers: [] }

/** 새 화면을 그리기 바로 전에 부른다. 앞 화면이 남긴 리스너·타이머를 걷어 낸다. */
export function beginScreen() {
  for (const fn of screenTokens.resize) window.removeEventListener('resize', fn)
  for (const id of screenTokens.timers) clearInterval(id)
  screenTokens = { resize: [], timers: [] }
}

/** 화면이 살아 있는 동안만 도는 resize 리스너 */
export function onResize(fn) {
  window.addEventListener('resize', fn)
  screenTokens.resize.push(fn)
  return fn
}

/** 화면이 살아 있는 동안만 도는 타이머 */
export function screenInterval(fn, ms) {
  const id = setInterval(fn, ms)
  screenTokens.timers.push(id)
  return id
}

// ── 화면 다시 그리기 ───────────────────────────────────────
// 이 앱은 「무엇을 누르면 화면을 통째로 다시 그리는」 구조다.
// 그러면 상태 관리가 단순해지는 대신 스크롤 위치와 펼쳐 둔 <details> 가 날아간다.
// redraw() 가 그 둘을 지켜 준다. 화면 파일에서 직접 innerHTML='' 하지 말 것.
let _redrawFn = null

export function setRedraw(fn) { _redrawFn = fn }

export function redraw() {
  if (!_redrawFn) return
  const host = document.getElementById('screen')
  const scrollY = window.scrollY
  const open = new Set()
  if (host) {
    host.querySelectorAll('details[data-k]').forEach((d) => { if (d.open) open.add(d.dataset.k) })
  }
  _redrawFn()
  requestAnimationFrame(() => {
    const now = document.getElementById('screen')
    if (now) now.querySelectorAll('details[data-k]').forEach((d) => {
      if (open.has(d.dataset.k)) d.open = true
    })
    window.scrollTo(0, scrollY)
  })
}

// ── 숫자·글자 다루기 ───────────────────────────────────────
export const fmt = (n, d = 2) =>
  (n === null || n === undefined || n === '' || Number.isNaN(Number(n)))
    ? '-' : Number(n).toFixed(d).replace(/\.?0+$/, (s) => (s.includes('.') ? '' : s))

export const comma = (n) =>
  (n === null || n === undefined || n === '') ? '-' : Number(n).toLocaleString('ko-KR')

export const pct = (a, b, d = 1) => (!b ? '-' : `${((a / b) * 100).toFixed(d)}%`)

/** 한국어 조사. 이름이 자료에서 오므로 문장을 미리 못 정한다. */
export function josa(word, pair) {
  const [withBat, without] = pair.split('/')
  const s = String(word ?? '').replace(/\([^)]*\)\s*$/, '').trim()
  const last = s.charCodeAt(s.length - 1)
  if (Number.isNaN(last)) return without
  let hasBatchim
  if (last >= 0xac00 && last <= 0xd7a3) hasBatchim = (last - 0xac00) % 28 !== 0
  else if (last >= 0x30 && last <= 0x39) hasBatchim = ![2, 4, 5, 9].includes(last - 0x30)
  else return without
  return hasBatchim ? withBat : without
}

export const 을를 = (w) => josa(w, '을/를')
export const 이가 = (w) => josa(w, '이/가')
export const 은는 = (w) => josa(w, '은/는')
export const 과와 = (w) => josa(w, '과/와')

// ── 그 밖 ──────────────────────────────────────────────────
export const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v))
export const uniq = (arr) => [...new Set(arr)]

export function groupBy(arr, key) {
  const m = new Map()
  for (const x of arr) {
    const k = typeof key === 'function' ? key(x) : x[key]
    if (!m.has(k)) m.set(k, [])
    m.get(k).push(x)
  }
  return m
}

/** 글자 안에 찾는 말이 들어 있는가 (띄어쓰기·대소문자 무시) */
export function has(hay, needle) {
  if (!needle) return true
  return String(hay ?? '').replace(/\s/g, '').toLowerCase()
    .includes(String(needle).replace(/\s/g, '').toLowerCase())
}

/** 브라우저 기본 alert 대신 쓰는 알림 (주소가 함께 보이는 것을 막는다) */
export function say(msg, kind = 'info') {
  const old = document.getElementById('toast')
  if (old) old.remove()
  const el = h(`div#toast.toast.toast-${kind}`, msg)
  document.body.append(el)
  setTimeout(() => el.classList.add('show'), 10)
  setTimeout(() => { el.classList.remove('show'); setTimeout(() => el.remove(), 300) }, 2600)
}

/**
 * 앱 자체 팝업 상자.
 *
 * ⚠ 브라우저 기본 `alert`·`confirm` 을 쓰지 않는 까닭 —— 크롬이
 *   「…에 삽입된 페이지 내용:」 처럼 주소를 함께 붙여 보여 준다. 상담 중에 보기 흉하다.
 *   (tools/check-syntax.mjs 가 기본 창을 막고 있다)
 *
 * @param {string} title 제목
 * @param {object} opt   {닫기글, 단추: [{글, 주요, 누르면(close)}]}
 * @param {...Node} body 내용
 * @returns {Function} 닫는 함수
 */
export function modal(title, opt = {}, ...body) {
  const old = document.getElementById('modal-back')
  if (old) old.remove()

  const close = () => {
    document.removeEventListener('keydown', onKey)
    const el = document.getElementById('modal-back')
    if (el) el.remove()
  }
  const onKey = (e) => { if (e.key === 'Escape') close() }

  const 단추들 = (opt.단추 || []).map((b2) =>
    h(`button.btn${b2.주요 ? '.btn-primary' : ''}`, {
      type: 'button', onclick: () => b2.누르면 && b2.누르면(close),
    }, b2.글))

  const back = h('div#modal-back.modal-back', {
    onclick: (e) => { if (e.target.id === 'modal-back') close() },
  }, h('div.modal', { role: 'dialog', 'aria-modal': 'true' },
    h('div.modal-head',
      h('h3.modal-title', title),
      h('button.modal-x', { type: 'button', title: '닫기', onclick: close }, '✕')),
    h('div.modal-body', ...body),
    h('div.modal-foot', ...단추들,
      h('button.btn', { type: 'button', onclick: close }, opt.닫기글 || '닫기'))))

  document.body.append(back)
  document.addEventListener('keydown', onKey)
  requestAnimationFrame(() => {
    const b3 = back.querySelector('.btn-primary') || back.querySelector('.btn')
    if (b3) b3.focus()
  })
  return close
}

/** 글자를 클립보드로 */
export async function copy(text, okMsg = '복사했습니다') {
  try {
    await navigator.clipboard.writeText(text)
    say(okMsg, 'ok')
  } catch {
    const ta = h('textarea', { value: text, style: { position: 'fixed', top: '-1000px' } })
    document.body.append(ta); ta.select()
    try { document.execCommand('copy'); say(okMsg, 'ok') } catch { say('복사하지 못했습니다', 'warn') }
    ta.remove()
  }
}
