# 머니그로우

투자로 자산을 불리기 위한 개인용 웹 도구입니다. 빌드 과정 없이 브라우저에서 바로 동작하는 정적 페이지로 구성되어 있습니다.

- 그냥 써보고 싶다면: `index.html`을 더블클릭해서 열면 바로 동작합니다 (이 기기에만 로컬 저장).
- PC와 폰에서 같은 기록을 실시간으로 보고 싶다면: 아래 "PC·폰 동기화 설정"을 따라 한 번만 설정하면 됩니다.

```bash
# 로컬 서버로 열기 (선택)
python3 -m http.server 8000
# http://localhost:8000 접속
```

## PC·폰 동기화 설정 (선택, 전부 무료)

기본 상태로는 각 기기 브라우저에만 따로 저장됩니다. 아래 두 가지를 설정하면 이메일 로그인으로 PC와 폰 기록이 실시간으로 동기화되고, 폰 홈화면에 앱처럼 설치할 수 있습니다. 가계부 앱들처럼 관계형 테이블(Postgres) 구조로 저장되는 [Supabase](https://supabase.com)를 사용합니다.

### 1) Supabase 프로젝트 만들기 (무료, 신용카드 불필요)

1. [supabase.com](https://supabase.com)에서 회원가입 후 "New project" 생성 (리전은 가까운 곳 선택)
2. 왼쪽 메뉴 **SQL Editor** → "New query"에 아래를 붙여넣고 실행 (사용자별 기록을 저장할 테이블 + 본인 데이터만 보이게 하는 보안 정책):
   ```sql
   create table user_data (
     user_id uuid primary key references auth.users(id) on delete cascade,
     data jsonb not null default '{}'::jsonb,
     updated_at timestamptz not null default now()
   );

   alter table user_data enable row level security;

   create policy "select own row" on user_data
     for select using (auth.uid() = user_id);
   create policy "insert own row" on user_data
     for insert with check (auth.uid() = user_id);
   create policy "update own row" on user_data
     for update using (auth.uid() = user_id);

   alter publication supabase_realtime add table user_data;
   ```
3. 왼쪽 메뉴 **Project Settings → API** 에서 "Project URL"과 "anon public" 키를 복사
4. 이 저장소의 `supabase-config.js` 파일에 두 값을 그대로 옮겨 적고 커밋·푸시합니다
5. 왼쪽 메뉴 **Authentication → URL Configuration** 에서 "Site URL"을 2단계에서 만들 GitHub Pages 주소(`https://<사용자명>.github.io/money/`)로 설정 (이메일 로그인 링크가 이 주소로 돌아오도록 하기 위함)

### 2) GitHub Pages로 배포하기

1. GitHub 저장소 → **Settings** → **Pages**
2. Source를 "Deploy from a branch"로 설정, Branch는 이 저장소의 기본 브랜치 + `/(root)` 선택 후 저장
3. 잠시 후 `https://<사용자명>.github.io/money/` 형태의 주소가 생성됩니다 — 이 주소를 위 1-5단계의 Site URL에 넣어주세요

### 3) 폰에 앱처럼 설치하기

1. 폰 브라우저(Android는 Chrome, iPhone은 Safari)로 위 GitHub Pages 주소를 엽니다
2. Android: 메뉴 → "홈 화면에 추가" / iPhone: 공유 버튼 → "홈 화면에 추가"
3. 홈 화면 아이콘을 눌러 실행하면 앱처럼 전체화면으로 열립니다
4. PC와 폰에서 각각 우측 상단에 **같은 이메일 주소**를 입력하고 "로그인 링크 받기"를 누른 뒤, 메일함에서 받은 링크를 눌러 로그인하면 기록이 실시간으로 동기화됩니다

> Supabase 무료(Free) 요금제 한도 안에서는 개인이 쓰기에 비용이 들지 않습니다. `supabase-config.js`의 값은 비밀키가 아니라 "어떤 프로젝트를 쓰는지" 알려주는 공개 식별자이며, 실제 데이터 보호는 Row Level Security 정책 + 이메일 로그인으로 이루어집니다.

## 기능

- **대시보드**: 투자 기록 탭에 입력한 내역을 총 평가금액/수익률/자산군별 비중으로 자동 집계. 순자산 추이 그래프, 목표 기반 투자 진행률, 목표 대비 실제 비중 리밸런싱 체크를 포함
- **복리 계산기**: 초기 투자금, 매달 적립금, 연 예상 수익률, 투자 기간을 입력하면 연도별 잔액 그래프와 최종 금액을 계산
- **포트폴리오 배분**: 안정형/중립형/공격형 예시 비중을 제공하고, 슬라이더로 직접 조정 가능. 원하는 비중을 "목표"로 저장하면 대시보드의 리밸런싱 체크에서 실제 비중과 비교됨
- **투자 기록**: 보유 자산(자산명/유형/매수금액/평가금액/매수일)을 추가·삭제하며 손익을 추적. 특정 자산 비중이 30% 이상이면 집중도 위험을 경고. CSV 내보내기/불러오기로 백업·이관 가능. 기본적으로 데이터는 브라우저 `localStorage`에만 저장되며 외부로 전송되지 않음 — 동기화를 설정한 경우에만 본인 계정으로 Supabase에 저장됨
- **환차익 계산**: 달러 표시 자산(해외주식 등)에 매수 시 환율을 입력하고, 전역 "현재 환율"을 설정하면 손익 중 환율 변동분(환차익)만 자동으로 분리해서 보여줌. 환전으로 산 달러든 해외주식 매도로 생긴 달러든 진입 환율만 알면 되므로 별도의 달러 현금 장부는 필요 없음
- **PC·폰 실시간 동기화 (선택)**: 이메일 로그인 후 여러 기기에서 같은 기록을 실시간으로 확인·수정 가능. 폰 홈 화면에 앱처럼 설치(PWA) 가능
- **학습 가이드**: 분산투자, 적립식 투자(DCA), 복리 효과, 리밸런싱, 세금 개요 등 핵심 개념과, 이 앱이 참고한 유명 자산관리 앱들의 기능 목록 정리
- **시장 정보**: 2026년 8월 기준 웹 검색으로 정리한 미국/국내 대표 ETF, 암호화폐 참고 자료 (출처 링크 포함)

### 참고한 앱들

토스·뱅크샐러드(순자산 추이, 통합 대시보드), Empower(리밸런싱 체크, 집중도 경고), Wealthfront Path(목표 기반 플래너), Betterment(자동 리밸런싱 개념), Quicken·Kubera·Sharesight(CSV 데이터 이동성)의 핵심 기능을 조사해, 계좌 자동 연동 없이 수동 입력 + 로컬 저장만으로 동작하도록 재구성했습니다.

## 주의사항

이 도구가 제공하는 계산기·예시 배분·시장 정보는 모두 **참고용**이며 투자 자문이 아닙니다. 실제 투자 결정 전에는 최신 시세와 공식 자료를 반드시 다시 확인하고, 본인의 판단과 책임 하에 진행하세요.
