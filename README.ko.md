# KPI Kit

**숫자의 의미를 잃지 않으면서 빠르게 조립할 수 있는 오픈소스 React KPI·차트·테이블·필터·데이터 상태 키트입니다.**

[English](README.md) · [컴포넌트 목록](docs/component-map.md) · [데이터 규격](docs/kit-contract.md) · [사용법](docs/kit-usage.md) · [현재 상태](docs/status.md)

> **0.1.0-alpha.5 — 공개 알파 후보.** 이 저장소는 릴리스 상태를 과장하지 않습니다. clean install, 실제 lockfile 생성, 전체 TypeScript 검사, Vite production build, 브라우저 검증을 저장소 워크플로에서 실행한 뒤 이 리비전의 공개 알파 근거로 사용합니다. 안정판 표기는 검토된 lockfile과 `main`의 재검증까지 필요합니다.

## 왜 만들었나

많은 대시보드 스타터는 화면 모양부터 만듭니다. KPI Kit은 다음 의사결정 흐름을 먼저 고정합니다.

**범위 → KPI 의미 → 비교 → 시각화 → 상세 근거 → 데이터 상태**

BI 플랫폼을 만들려는 것이 아닙니다. 반복적으로 필요한 대시보드 부품을 빠르게 가져다 쓰되, 단위·비교 기준·누락·최신성·목표 의미를 숨기지 않는 소스 키트입니다.

계정, 백엔드, 데이터베이스, API 키, 텔레메트리, 유료 서비스가 필요하지 않습니다. 저장소의 예제 데이터는 모두 합성입니다.

## 포함된 구성

| 영역 | Alpha.5 |
| --- | --- |
| KPI | `MetricCard` 하나와 number, comparison, sparkline, target, status, compact 6패턴 |
| 차트 | Line, area, horizontal bar, vertical bar, grouped bar, stacked bar, waterfall, donut, bullet |
| 테이블 | 열 정의, 검색, 안정 정렬, 페이지 이동, 행/페이지 선택, 필터 결과 CSV, 선택 행 CSV |
| 컨트롤 | Button, Badge, Field, Checkbox, Switch, FilterChip, Tabs, Tooltip, DateRangeField, Dialog |
| 상태 | Loading, empty, error, partial coverage, stale data |
| 데이터 | 검증된 KPI 계약, 명시적 범위/단위/품질, 안전한 비교, 최신 요청만 적용하는 비동기 로더 |
| 작업대 | 한/영, 라이트/다크, 로컬 KPI JSON 가져오기, 실제 부품·코드 확인 |

차트 9개는 서로 다른 엔진 9개를 뜻하지 않습니다. 선/영역은 같은 시리즈 렌더러를, 그룹/누적 막대는 같은 멀티시리즈 계약을 공유합니다.

## 로컬 실행

Node 22.12+와 npm이 필요합니다.

```sh
npm install
npm run dev
```

Vite가 알려주는 주소를 엽니다. `/index.html`은 전체 작업대, `/kit.html`은 컴포넌트 작업대로 바로 들어가는 경로입니다.

첫 정상 설치에서는 실제 `package-lock.json`이 생성됩니다. 이 lockfile을 검토하고 커밋한 뒤 `npm ci`를 재현 가능한 설치 경로로 사용합니다. 가짜 lockfile은 넣지 않습니다.

## KPI 부품 사용 예

```tsx
import { MetricCard, validateMetricView } from './kit/index.js';
import './kit/styles.css';

const metric = validateMetricView(rawMetric);

export function Overview() {
  return (
    <section className="kk-root">
      <MetricCard metric={metric} pattern="comparison" />
    </section>
  );
}
```

컴포넌트가 임의의 원자료에서 KPI 의미를 추론하지는 않습니다. 업무 계산은 연결하는 애플리케이션이 책임지고, KPI Kit은 결과의 계약을 검증하고 표현합니다.

## 숫자 의미를 지키는 기본 규칙

- 누락은 0이 아닙니다.
- 일부 수집은 완전한 총합이 아닙니다.
- 완전성과 최신성은 서로 다른 상태입니다.
- %p 변화와 상대 % 변화는 다릅니다.
- 기준값 0을 무한대 증감률로 만들지 않습니다.
- 목표 달성과 이전 기간 대비 개선은 다른 판단입니다.
- 낮을수록 좋은 지표에서는 감소가 긍정적일 수 있습니다.
- 시계열 누락 구간을 선으로 이어 붙이지 않습니다.
- 누적 막대의 음수는 모호하게 그리지 않고 거부합니다.
- 워터폴의 변화값이 누락되면 기말값을 만들어내지 않습니다.

정확한 범위는 [데이터 규격](docs/kit-contract.md)을 확인하세요.

## 검증

```sh
npm run typecheck:core
npm run typecheck:kit
npm test
npm run check:repository
npm run verify
```

브라우저 검증은 Python과 Playwright가 필요합니다.

```sh
python -m pip install -r tests/requirements.txt
python -m playwright install chromium
npm run test:kit
```

GitHub 워크플로는 공개 저장소에서 실제 설치 경로를 검증하고 기술 증거를 짧은 기간 artifact로 보존합니다. 자동 배포나 npm 발행은 하지 않습니다.

## 범위

KPI Kit은 호스팅 분석 서비스, 회계 원장, 인증 시스템, 완전한 앱 디자인 시스템이 아닙니다. MIT 라이선스의 GitHub 소스입니다.

`package.json`의 `private: true`는 실수로 npm에 발행하는 것을 막기 위한 것이며 MIT 소스 라이선스를 제한하지 않습니다.

실제 고객 데이터와 자격증명은 `public/`, 소스, 스크린샷, 이슈, 테스트 데이터에 넣지 마세요.

기여 전에 [CONTRIBUTING](CONTRIBUTING.md), [SECURITY](SECURITY.md), [third-party notices](THIRD_PARTY_NOTICES.md), [MIT 라이선스](LICENSE)를 확인해 주세요.
