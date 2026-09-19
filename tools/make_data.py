# -*- coding: utf-8 -*-
"""전국 학과 지도 — 자료 만들기.

  source/키워드별 학과정보.xlsx  →  src/data/major.json

★ 원자료
  교육부 「대학알리미 키워드별 학과정보」 (공공데이터포털 15119002)
  이용허락범위 : 공공저작물 제1유형(출처표시). 그래서 이 앱은 공개 배포할 수 있다.

⚠ 대학원(일반·특수·전문)은 뺀다 — 고교 진학 상담용이라 학부만 본다.
⚠ 표준분류계열이 없는 줄(N.C.E.)은 지우지 않는다. 「분류 없음」으로 남겨
  화면에서 「모른다」고 밝힌다. 자율전공·광역모집이 대부분이라 오히려 중요하다.

★ 소재지는 **학과(줄)마다** 담는다 (2026-09-19, 위치 지도 화면).
  대학 하나에 캠퍼스가 여럿이면 줄마다 소재지가 다르다 — 성균관대 본교의
  학과 79개 중 37개는 수원, 연세대 본교 119개 중 36개는 인천 연수구다.
  그래서 대학표가 아니라 줄에 「자리」 번호를 붙인다. 이런 대학이 46곳이다.
⚠ 「학교지역」(본부가 있는 곳)과 「소재지」(그 학과가 있는 곳)는 다르다.
  위치는 반드시 「소재지」·「소재지(상세)」로 잡는다.
⚠ 원자료가 광주와 전남을 「전남광주」 하나로 적는다. 지도에서는 둘이 다른 시·도라
  「구」로 끝나면 광주, 아니면 전남으로 가른다(전남에는 「구」가 없다).
"""
import json
import os
import sys

import openpyxl

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
SRC = os.path.join(ROOT, 'source', '키워드별 학과정보.xlsx')
OUT = os.path.join(ROOT, 'src', 'data', 'major.json')

# 학부 과정만. (대학원은 뺀다)
학부종류 = {
    '대학교', '전문대학', '교육대학', '산업대학', '기능대학',
    '사이버대학(대학)', '사이버대학(전문대학)', '방송통신대학', '각종학교(대학)',
}

# 열 차례 (원본 머리글 그대로)
C_학과명, C_학교명, C_구분, C_종류 = 1, 2, 3, 4
C_지역, C_소재지, C_상세, C_설립 = 5, 6, 7, 8
C_주야, C_특성, C_상태 = 9, 10, 11
C_대, C_중, C_소 = 12, 13, 14

NCE = '분류 없음'


def say(msg):
    print(msg)


def 계열정리(v):
    """N.C.E / N.C.E. 를 「분류 없음」으로 바꾼다."""
    s = str(v or '').strip()
    return NCE if (not s or s.startswith('N.C.E')) else s


# ⚠ 이름 정규화(「간호학과」→「간호」)는 **자바스크립트 쪽에서만** 한다
#   (`src/lib/data.js` 의 `이름열쇠()`). 두 언어에 같은 규칙을 두면 반드시 어긋난다.
#   여기서 미리 만들어 담으면 자료가 150KB 커지기도 한다.


def 시도가르기(시도, 시군구):
    """「전남광주」를 광주·전남으로 가른다. 전남에는 구가 없고 광주에는 구만 있다."""
    if 시도 != '전남광주':
        return 시도
    return '광주' if 시군구.endswith('구') else '전남'


def run():
    if not os.path.exists(SRC):
        say(f'✗ 원자료가 없습니다: {SRC}')
        sys.exit(1)

    wb = openpyxl.load_workbook(SRC, read_only=True, data_only=True)
    ws = wb[wb.sheetnames[0]]
    it = ws.iter_rows(values_only=True)
    head = next(it)
    if str(head[C_학과명]).strip() != '학과명':
        say(f'✗ 열 차례가 다릅니다. 2열이 「학과명」이어야 하는데 「{head[C_학과명]}」입니다.')
        sys.exit(1)

    전체 = 0
    대학표, 대학색인 = [], {}
    대계열, 중계열, 소계열 = [], [], []
    주야표, 특성표, 상태표, 구분표 = [], [], [], []
    rows = []
    자리표, 자리색인 = [], {}
    대학자리 = {}   # 대학 번호 → Counter((시도, 시군구, 본부지역과같은가))

    이름표, 이름색인 = [], {}

    def idx2(표, 색인, 값):
        """되풀이되는 값을 번호로 바꾼다. 학과명 16,221번 → 8,161종."""
        if 값 not in 색인:
            색인[값] = len(표)
            표.append(값)
        return 색인[값]

    def idx(표, 값):
        return idx2(표, {v: i for i, v in enumerate(표)}, 값)

    for r in it:
        if not r or not r[C_학과명]:
            continue
        전체 += 1
        종류 = str(r[C_종류] or '').strip()
        if 종류 not in 학부종류:
            continue

        학교 = str(r[C_학교명] or '').strip()
        구분 = str(r[C_구분] or '').strip()
        키 = (학교, 구분)
        if 키 not in 대학색인:
            대학색인[키] = len(대학표)
            대학표.append([
                학교, 구분, 종류,
                str(r[C_지역] or '').strip(),
                str(r[C_상세] or '').strip(),
                str(r[C_설립] or '').strip(),
            ])
        u = 대학색인[키]

        시군구 = str(r[C_상세] or '').strip()
        시도 = 시도가르기(str(r[C_소재지] or '').strip(), 시군구)
        자리 = idx2(자리표, 자리색인, (시도, 시군구))
        같은곳 = str(r[C_소재지] or '').strip() == str(r[C_지역] or '').strip()
        대학자리.setdefault(u, {})
        대학자리[u][(시군구, 같은곳)] = 대학자리[u].get((시군구, 같은곳), 0) + 1

        이름 = str(r[C_학과명] or '').strip()
        rows.append([
            idx2(이름표, 이름색인, 이름), u,
            idx(대계열, 계열정리(r[C_대])),
            idx(중계열, 계열정리(r[C_중])),
            idx(소계열, 계열정리(r[C_소])),
            idx(주야표, str(r[C_주야] or '').strip()),
            idx(특성표, str(r[C_특성] or '').strip()),
            idx(상태표, str(r[C_상태] or '').strip()),
            자리,
        ])

    # 대학의 대표 소재지 = 본부 지역 안에서 학과가 가장 많은 시·군·구.
    # ⚠ 첫 줄 값을 그냥 쓰면 연세대가 「서울 연수구」, 유원대가 「충북 아산시」처럼
    #   있지도 않은 곳이 된다(예전에 실제로 그렇게 나왔다).
    for u, 셈 in 대학자리.items():
        대표 = max(셈.items(), key=lambda kv: (kv[0][1], kv[1]))[0][0]
        대학표[u][4] = 대표

    data = {
        'meta': {
            '이름': '전국 대학 학과 정보 (학부)',
            '출처': '교육부 「대학알리미 키워드별 학과정보」 (공공데이터포털)',
            '이용허락': '공공저작물 제1유형(출처표시)',
            '주의': '대학원은 뺐고 학부만 담았습니다. 학과명은 입시의 「모집단위」와 다릅니다.',
            '원본행수': 전체,
            '행수': len(rows),
            '대학수': len(대학표),
            '열': ['학과명(번호)', '대학', '계열대', '계열중', '계열소', '주야', '특성', '상태', '자리'],
            '자리열': ['시도', '시군구'],
            '대학열': ['학교명', '구분', '학교종류', '지역', '소재지', '설립구분'],
        },
        'univ': 대학표,
        'daeg': 대계열, 'jung': 중계열, 'so': 소계열,
        'juya': 주야표, 'teuk': 특성표, 'sangtae': 상태표,
        'name': 이름표,
        'place': [list(x) for x in 자리표],
        'rows': ['	'.join(str(x) for x in r) for r in rows],
    }

    os.makedirs(os.path.dirname(OUT), exist_ok=True)
    with open(OUT, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, separators=(',', ':'))

    크기 = os.path.getsize(OUT)
    say('── 만들어진 자료 ──')
    say(f'  원본            {전체:,}행 (대학원 포함)')
    say(f'  학부만          {len(rows):,}행')
    say(f'  대학(캠퍼스별)   {len(대학표):,}곳')
    say(f'  학과명 종류      {len(이름표):,}종')
    say(f'  계열            대 {len(대계열)} · 중 {len(중계열)} · 소 {len(소계열)}')
    say(f'  자리(시군구)     {len(자리표)}곳')
    say(f'  major.json      {크기:,}바이트')


if __name__ == '__main__':
    run()
