/*! 전국 학과 지도 — © 2026 티쳐무 · 모든 권리 보유. */
// 빌드 설정
//  · base:'./'   — 상대 경로. GitHub Pages 하위 경로에서도 자원이 열린다.
//  · singlefile  — dist/index.html 한 파일. 인터넷 없이 더블클릭으로도 열린다.
//  · banner      — 압축해도 살아남게 /*! 로 시작한다 (legalComments:'inline' 과 짝).
import fs from 'node:fs'
import { defineConfig } from 'vite'
import { viteSingleFile } from 'vite-plugin-singlefile'

const BANNER =
  '/*! 전국 학과 지도 — © 2026 티쳐무 · 모든 권리 보유.\n' +
  ' * 학교 진학 지도 목적으로만 이용해 주세요. 무단 배포·상업적 이용을 금합니다.\n' +
  ' * 학과 정보의 원자료는 교육부 「대학알리미」 공공데이터입니다\n' +
  ' * (공공저작물 제1유형 — 출처표시). 지도의 시·도 경계는 통계청(KOSTAT)\n' +
  ' * 센서스용 행정구역경계(2013)입니다. LICENSE 참고. */'

export default defineConfig({
  base: './',
  plugins: [
    viteSingleFile({ removeViteModuleLoader: true }),
    {
      // 빌드가 끝나면 저작권 표시와 원자료 출처가 살아 있는지 스스로 검사한다.
      // ⚠ 이 검사를 빼지 말 것 — 압축 설정을 바꾸다 배너가 지워지기 쉽다.
      name: 'copyright-guard',
      closeBundle() {
        const p = 'dist/index.html'
        if (!fs.existsSync(p)) return
        const html = fs.readFileSync(p, 'utf-8')
        const n = (html.match(/티쳐무/g) || []).length
        if (n < 3) {
          throw new Error(`저작권 표시가 ${n}곳뿐이다. HTML 주석·스크립트 배너·화면 푸터가 있어야 한다.`)
        }
        if (!html.includes('대학알리미')) {
          throw new Error('원자료 출처(대학알리미) 표시가 빌드 결과에 없다.')
        }
        if (!html.includes('통계청')) {
          throw new Error('지도 경계 출처(통계청) 표시가 빌드 결과에 없다.')
        }
        console.log(`  ✓ 저작권 표시 ${n}곳 · 출처 표시 있음 · ${(html.length / 1024).toFixed(0)}KB`)
      },
    },
  ],
  esbuild: { legalComments: 'inline' },
  build: {
    target: 'es2020',
    assetsInlineLimit: 100000000,
    cssCodeSplit: false,
    rollupOptions: { output: { banner: BANNER } },
  },
})
