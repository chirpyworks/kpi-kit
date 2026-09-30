/** Deterministic, synthetic demonstration records. These are never production results. */
import type { KitLocale, MetricDefinition, MetricView, Observation, Scope, SeriesPoint, Unit } from '../kit/contracts.js';
import type { DataColumn } from '../kit/core/table.js';
import { ratioOfSums } from '../kit/core/metrics.js';
import { isBusinessDate } from '../kit/core/validate.js';

export type DashboardKind = 'revenue' | 'customers' | 'operations';
export interface DateRange { start: string; end: string }
export interface DashboardMeta { kind: DashboardKind; title: string; description: string; question: string }
/** Values retain their source units: money in USD cents, rates as fractions, durations in ms. */
export interface DashboardRow {
  id: string;
  date: string;
  category: string;
  values: Readonly<Record<string, number>>;
}
export interface DashboardModel {
  kind: DashboardKind;
  range: DateRange;
  previousRange: DateRange | null;
  status: 'ready' | 'empty' | 'invalid';
  coverage: 'complete' | 'partial' | 'missing';
  message: string;
  previousAvailable: boolean;
  metrics: MetricView[];
  trend: SeriesPoint[];
  categories: SeriesPoint[];
  rows: DashboardRow[];
  columns: DataColumn<DashboardRow>[];
  trendTitle: string;
  trendUnit: string;
  categoriesTitle: string;
  categoriesUnit: string;
  tableTitle: string;
  methodology: string[];
  sourceLabel: string;
}

export const INITIAL_RANGE: Readonly<DateRange> = Object.freeze({ start: '2026-09-01', end: '2026-09-07' });
export const AVAILABLE_RANGE: Readonly<DateRange> = Object.freeze({ start: '2026-08-18', end: '2026-09-14' });
const DAY_MS = 86_400_000;
const REVISION = 'synthetic-daily-v1';
const MONEY: Unit = { kind: 'money', currency: 'USD', exponent: 2 };
const COUNT: Unit = { kind: 'count' };
const RATIO: Unit = { kind: 'ratio' };
const DURATION: Unit = { kind: 'duration', base: 'ms' };

interface DailyBase { readonly date: string; readonly category: string }
export interface RevenueDailyRecord extends DailyBase {
  readonly orders: number;
  readonly grossSalesCents: number;
  readonly refundedOrders: number;
  readonly refundsCents: number;
  readonly netSalesCents: number;
}
export interface CustomerDailyRecord extends DailyBase {
  readonly signups: number;
  readonly activated: number;
  readonly closed: number;
  readonly enabledAccountsEod: number;
}
export interface OperationsDailyRecord extends DailyBase {
  readonly arrivals: number;
  readonly completed: number;
  readonly failed: number;
  readonly attempted: number;
  readonly durationTotalMs: number;
  readonly backlogEod: number;
}

type CategoryLabel = { key: string; en: string; ko: string };
const categoryLabels: Record<DashboardKind, readonly CategoryLabel[]> = {
  revenue: [
    { key: 'web', en: 'Web store', ko: '웹 스토어' },
    { key: 'mobile', en: 'Mobile app', ko: '모바일 앱' },
    { key: 'partners', en: 'Partners', ko: '파트너' },
    { key: 'retail', en: 'Retail', ko: '오프라인 매장' },
  ],
  customers: [
    { key: 'organic', en: 'Organic search', ko: '자연 검색' },
    { key: 'paid', en: 'Paid search', ko: '유료 검색' },
    { key: 'referral', en: 'Referral', ko: '추천' },
    { key: 'direct', en: 'Direct', ko: '직접 방문' },
  ],
  operations: [
    { key: 'imports', en: 'Imports', ko: '가져오기' },
    { key: 'exports', en: 'Exports', ko: '내보내기' },
    { key: 'reports', en: 'Reports', ko: '리포트' },
    { key: 'sync', en: 'Sync', ko: '동기화' },
  ],
};

function offsetDate(date: string, days: number): string {
  return new Date(Date.parse(`${date}T00:00:00.000Z`) + days * DAY_MS).toISOString().slice(0, 10);
}
function dayCount(range: DateRange): number {
  return (Date.parse(range.end) - Date.parse(range.start)) / DAY_MS + 1;
}
function select<Row extends DailyBase>(records: readonly Row[], range: DateRange): Row[] {
  return records.filter(row => row.date >= range.start && row.date <= range.end);
}
function sum<Row>(records: readonly Row[], value: (row: Row) => number): number {
  return records.reduce((total, row) => total + value(row), 0);
}

function makeDailyData() {
  const revenue: RevenueDailyRecord[] = [];
  const customers: CustomerDailyRecord[] = [];
  const operations: OperationsDailyRecord[] = [];
  const accounts = [840, 390, 250, 180];
  const backlog = [24, 34, 16, 27];
  for (let day = 0; day < 28; day++) {
    const date = offsetDate(AVAILABLE_RANGE.start, day);
    const weekday = new Date(`${date}T00:00:00.000Z`).getUTCDay();
    const weekend = weekday === 0 || weekday === 6;
    const week = Math.floor(day / 7);
    for (let category = 0; category < 4; category++) {
      const orders = [32, 24, 15, 19][category] + (day * 3 + category * 7) % 13 + week * 3 - (weekend ? 8 : 0);
      const priceCents = [12400, 8700, 18600, 22400][category] + ((day + category * 3) % 5) * 175;
      const refundedOrders = (day + category) % 4 === 0 ? 2 : 1;
      const grossSalesCents = orders * priceCents;
      const refundsCents = refundedOrders * (priceCents - 500);
      revenue.push(Object.freeze({ date, category: categoryLabels.revenue[category].key, orders, grossSalesCents,
        refundedOrders, refundsCents, netSalesCents: grossSalesCents - refundsCents }));

      const signups = [43, 29, 17, 22][category] + (day * 7 + category * 11) % 17 + week * 3 - (weekend ? 12 : 0);
      const activated = Math.floor(signups * (0.46 + category * 0.035 + week * 0.009 + (day % 4) * 0.01));
      const closed = [5, 4, 2, 3][category] + (day + category) % 3;
      accounts[category] += signups - closed;
      customers.push(Object.freeze({ date, category: categoryLabels.customers[category].key, signups, activated,
        closed, enabledAccountsEod: accounts[category] }));

      const attempted = [245, 180, 133, 205][category] + (day * 17 + category * 23) % 83 + week * 13 - (weekend ? 35 : 0);
      const failed = Math.floor(attempted * (0.034 - week * 0.003 + ((day + category) % 3) * 0.001));
      const completed = attempted - failed;
      const arrivals = attempted + (day + category) % 7 - 2;
      const durationTotalMs = attempted * ([7200, 4300, 8800, 3100][category] - week * 180 + ((day + category) % 5) * 90);
      backlog[category] += arrivals - attempted;
      operations.push(Object.freeze({ date, category: categoryLabels.operations[category].key, arrivals, completed,
        failed, attempted, durationTotalMs, backlogEod: backlog[category] }));
    }
  }
  return Object.freeze({ revenue: Object.freeze(revenue), customers: Object.freeze(customers), operations: Object.freeze(operations) });
}

/** Three independent domains. Every card, chart and table uses these same daily records. */
export const SYNTHETIC_DAILY_DATA = makeDailyData();

export function dashboardMeta(locale: KitLocale): DashboardMeta[] {
  return locale === 'ko' ? [
    { kind: 'revenue', title: '매출', description: '주문·환불·판매 채널을 함께 확인하세요', question: '어떤 채널이 순매출을 만들고 있나요?' },
    { kind: 'customers', title: '고객', description: '신규 가입부터 활성화와 계정 변화를 확인하세요', question: '신규 가입이 실제 활성화로 이어지고 있나요?' },
    { kind: 'operations', title: '운영', description: '작업 처리량·실패·대기열을 확인하세요', question: '작업을 안정적으로 처리하고 있나요?' },
  ] : [
    { kind: 'revenue', title: 'Revenue', description: 'Follow orders, refunds and sales channels', question: 'Which channels are driving net sales?' },
    { kind: 'customers', title: 'Customers', description: 'Follow acquisition, activation and account growth', question: 'Are new signups turning into activated accounts?' },
    { kind: 'operations', title: 'Operations', description: 'Follow throughput, reliability and queue health', question: 'Are workflows completing reliably?' },
  ];
}

function definitions(kind: DashboardKind, ko: boolean): MetricDefinition[] {
  const metric = (id: string, title: string, description: string, unit: Unit, aggregate: MetricDefinition['aggregate'],
    polarity: MetricDefinition['polarity'], comparison: MetricDefinition['comparison'], target?: MetricDefinition['target']): MetricDefinition =>
    ({ id, title, description, unit, aggregate, polarity, comparison, ...(target ? { target } : {}) });
  if (kind === 'revenue') return [
    metric('net-sales', ko ? '순매출' : 'Net sales', ko ? '선택 기간 주문 금액에서 같은 주문의 환불 금액을 차감한 합계입니다. 세금·배송비는 제외합니다.' : 'Order value less refunds on those orders, summed over the selected period. Excludes tax and shipping.', MONEY, 'sum', 'higher-is-better', 'relative'),
    metric('orders', ko ? '결제 주문' : 'Paid orders', ko ? '선택 기간의 결제 완료 주문 수입니다. 환불된 주문도 포함합니다.' : 'Paid orders in the selected period, including orders subsequently refunded in this fixture.', COUNT, 'sum', 'higher-is-better', 'relative'),
    metric('average-order', ko ? '평균 순주문액' : 'Average net order', ko ? '순매출 합계 ÷ 결제 주문 합계입니다. 일별 평균의 평균이 아니며 센트 단위로 반올림합니다.' : 'Total net sales divided by total paid orders, rounded to the nearest cent. Never an average of daily averages.', MONEY, 'custom', 'neutral', 'relative'),
    metric('refund-rate', ko ? '주문 환불률' : 'Order refund rate', ko ? '환불 주문 합계 ÷ 결제 주문 합계입니다. 이 합성 데이터에서는 주문과 환불이 같은 날 발생합니다.' : 'Total refunded orders divided by total paid orders. Orders and their refunds occur on the same day in this synthetic fixture.', RATIO, 'ratio', 'lower-is-better', 'percentage-points', { value: 0.04, relation: 'at-most' }),
  ];
  if (kind === 'customers') return [
    metric('signups', ko ? '신규 가입' : 'New signups', ko ? '선택 기간 새로 생성된 계정의 합계입니다. 각 계정은 최초 유입 채널 하나에 속합니다.' : 'Accounts created in the selected period. Each account belongs to one first-acquisition channel.', COUNT, 'sum', 'higher-is-better', 'relative'),
    metric('activation-rate', ko ? '가입 당일 활성화율' : 'Same-day activation', ko ? '가입 당일 핵심 행동을 완료한 계정 합계 ÷ 같은 기간 신규 가입 합계입니다. 장기 리텐션 지표가 아닙니다.' : 'New accounts completing the key action on their signup day divided by all new accounts in the same period. This is not a retention measure.', RATIO, 'ratio', 'higher-is-better', 'percentage-points', { value: 0.6, relation: 'at-least' }),
    metric('closed-accounts', ko ? '해지 계정' : 'Closed accounts', ko ? '선택 기간 해지된 계정의 합계입니다. 신규 가입 코호트에 한정되지 않으며 해지율이 아닙니다.' : 'All account closures in the selected period, not restricted to the signup cohort. This count is not a churn rate.', COUNT, 'sum', 'lower-is-better', 'relative'),
    metric('enabled-accounts', ko ? '기말 유지 계정' : 'Enabled accounts at close', ko ? '선택 종료일의 미해지 계정 스냅샷입니다. 일별 스냅샷을 합산하지 않으며 활성 사용자 수가 아닙니다.' : 'Non-closed accounts at the end of the selected final day. Never sums daily snapshots and does not measure active users.', COUNT, 'last', 'higher-is-better', 'relative'),
  ];
  return [
    metric('completed-jobs', ko ? '완료 작업' : 'Completed jobs', ko ? '선택 기간 성공적으로 완료된 작업 합계입니다. 실패한 작업은 제외합니다.' : 'Jobs successfully completed in the selected period. Excludes failed attempts.', COUNT, 'sum', 'higher-is-better', 'relative'),
    metric('failure-rate', ko ? '작업 실패율' : 'Job failure rate', ko ? '실패 작업 합계 ÷ 전체 시도 작업 합계입니다. 시도 작업은 성공 + 실패입니다.' : 'Total failed jobs divided by total attempted jobs. Attempts equal completed plus failed jobs.', RATIO, 'ratio', 'lower-is-better', 'percentage-points', { value: 0.025, relation: 'at-most' }),
    metric('mean-duration', ko ? '평균 처리 시간' : 'Mean processing time', ko ? '모든 시도 작업의 처리 시간 합계 ÷ 시도 작업 합계입니다. 성공·실패를 모두 포함하며 분위수가 아닙니다.' : 'Total processing milliseconds divided by all attempted jobs, including failures. A weighted mean, not a percentile.', DURATION, 'custom', 'lower-is-better', 'relative', { value: 6000, relation: 'at-most' }),
    metric('backlog', ko ? '기말 대기 작업' : 'Queued jobs at close', ko ? '선택 종료일의 대기 작업 스냅샷입니다. 일별 스냅샷을 합산하지 않습니다.' : 'Queued jobs at the end of the selected final day. Never sums daily queue snapshots.', COUNT, 'last', 'lower-is-better', 'absolute', { value: 150, relation: 'at-most' }),
  ];
}

function makeColumns(kind: DashboardKind, ko: boolean): DataColumn<DashboardRow>[] {
  const number = (key: string, label: string, divisor = 1, digits?: number): DataColumn<DashboardRow> => ({
    id: key, label, align: 'end', value: row => digits === undefined ? row.values[key] / divisor : Number((row.values[key] / divisor).toFixed(digits)),
  });
  const common: DataColumn<DashboardRow>[] = [
    { id: 'date', label: ko ? '날짜 (UTC)' : 'Date (UTC)', value: row => row.date },
    { id: 'category', label: kind === 'operations' ? (ko ? '작업 유형' : 'Workflow') : (ko ? '채널' : 'Channel'), value: row => row.category },
  ];
  if (kind === 'revenue') return [...common,
    number('netSalesCents', ko ? '순매출 (USD)' : 'Net sales (USD)', 100, 2),
    number('orders', ko ? '결제 주문' : 'Paid orders'),
    number('refundsCents', ko ? '환불액 (USD)' : 'Refunds (USD)', 100, 2),
    number('refundedOrders', ko ? '환불 주문' : 'Refunded orders'),
  ];
  if (kind === 'customers') return [...common,
    number('signups', ko ? '신규 가입' : 'Signups'),
    number('activated', ko ? '가입 당일 활성화' : 'Same-day activated'),
    number('closed', ko ? '해지' : 'Closures'),
    number('enabledAccountsEod', ko ? '일말 유지 계정' : 'Enabled at day end'),
  ];
  return [...common,
    number('completed', ko ? '완료' : 'Completed'),
    number('failed', ko ? '실패' : 'Failed'),
    number('meanDurationMs', ko ? '평균 시간 (ms)' : 'Mean time (ms)', 1, 1),
    number('backlogEod', ko ? '일말 대기' : 'Queued at day end'),
  ];
}

function scope(kind: DashboardKind, range: DateRange): Scope {
  return { id: `${kind}-daily`, startDate: range.start, endDate: range.end, timeZone: 'UTC',
    segment: { dashboard: [kind], categories: categoryLabels[kind].map(category => category.key) }, revision: REVISION };
}

function observedMetrics(kind: DashboardKind, range: DateRange, ko: boolean): Observation[] {
  const records = select<DailyBase>(SYNTHETIC_DAILY_DATA[kind], range);
  const days = new Set(records.map(record => record.date)).size;
  const coverage = days === 0 ? 'missing' : days === dayCount(range) ? 'complete' : 'partial';
  const reason = ko ? `${dayCount(range)}일 중 ${days}일만 합성 데이터가 있습니다` : `Synthetic records cover ${days} of ${dayCount(range)} requested days`;
  const observe = (value: number | null, snapshot = false): Observation => {
    const missing = !days || value === null;
    return { value: missing ? null : value, quality: { coverage: missing ? 'missing' : coverage,
      freshness: 'unknown', ...(missing || coverage !== 'complete' ? { reasons: [snapshot && value === null
        ? (ko ? '요청한 종료일 스냅샷이 없습니다' : 'No snapshot exists on the requested final day') : reason] } : {}) } };
  };
  const ratio = (pairs: { numerator: number; denominator: number }[]): Observation => {
    const result = ratioOfSums(pairs);
    return { ...observe(result.value), numerator: result.numerator, denominator: result.denominator };
  };
  if (kind === 'revenue') {
    const data = select(SYNTHETIC_DAILY_DATA.revenue, range);
    const netSales = sum(data, row => row.netSalesCents);
    const orders = sum(data, row => row.orders);
    return [observe(netSales), observe(orders), observe(orders ? Math.round(netSales / orders) : null),
      ratio(data.map(row => ({ numerator: row.refundedOrders, denominator: row.orders })))];
  }
  if (kind === 'customers') {
    const data = select(SYNTHETIC_DAILY_DATA.customers, range);
    const final = data.filter(row => row.date === range.end);
    return [observe(sum(data, row => row.signups)), ratio(data.map(row => ({ numerator: row.activated, denominator: row.signups }))),
      observe(sum(data, row => row.closed)), observe(final.length ? sum(final, row => row.enabledAccountsEod) : null, true)];
  }
  const data = select(SYNTHETIC_DAILY_DATA.operations, range);
  const final = data.filter(row => row.date === range.end);
  const attempts = sum(data, row => row.attempted);
  return [observe(sum(data, row => row.completed)), ratio(data.map(row => ({ numerator: row.failed, denominator: row.attempted }))),
    observe(attempts ? sum(data, row => row.durationTotalMs) / attempts : null), observe(final.length ? sum(final, row => row.backlogEod) : null, true)];
}

export function buildDashboard(kind: DashboardKind, range: DateRange, locale: KitLocale): DashboardModel {
  const ko = locale === 'ko';
  const labels = categoryLabels[kind];
  const sourceLabel = ko ? '합성 데이터 · UTC 일별 기록 · 실제 운영 성과 아님' : 'Synthetic fixture · UTC daily records · not production results';
  const titles = kind === 'revenue'
    ? [ko ? '일별 순매출' : 'Daily net sales', 'USD', ko ? '채널별 순매출' : 'Net sales by channel', 'USD', ko ? '일별 주문·환불 내역' : 'Daily order and refund detail']
    : kind === 'customers'
      ? [ko ? '일별 신규 가입' : 'Daily new signups', ko ? '계정' : 'accounts', ko ? '채널별 신규 가입' : 'New signups by channel', ko ? '계정' : 'accounts', ko ? '일별 가입·계정 내역' : 'Daily acquisition and account detail']
      : [ko ? '일별 완료 작업' : 'Daily completed jobs', ko ? '작업' : 'jobs', ko ? '유형별 완료 작업' : 'Completed jobs by workflow', ko ? '작업' : 'jobs', ko ? '일별 작업 처리 내역' : 'Daily workflow detail'];
  const base: DashboardModel = { kind, range: { ...range }, previousRange: null, status: 'invalid', coverage: 'missing',
    message: '', previousAvailable: false, metrics: [], trend: [], categories: [], rows: [], columns: makeColumns(kind, ko),
    trendTitle: titles[0], trendUnit: titles[1], categoriesTitle: titles[2], categoriesUnit: titles[3], tableTitle: titles[4], sourceLabel,
    methodology: [
      ko ? '모든 카드·차트·표는 같은 합성 일별 기록을 사용합니다. 운영 성과나 업계 기준이 아닙니다.' : 'All cards, charts and rows use the same synthetic daily records. These are not production results or industry benchmarks.',
      ko ? '날짜는 UTC 기준으로 시작일·종료일을 포함합니다. 비교 기간은 직전의 동일 길이 기간입니다.' : 'Dates include both endpoints in UTC. Comparisons use the immediately preceding equal-length period.',
      ko ? '비율은 분자 합계 ÷ 분모 합계로 계산합니다. 기말 계정·대기열은 종료일 스냅샷만 사용합니다.' : 'Rates use summed numerators divided by summed denominators. Closing account and queue metrics use only the final-day snapshot.',
      kind === 'revenue'
        ? (ko ? '표의 금액 단위는 USD이며 CSV에도 열 이름에 단위를 표시합니다. 원본 금액은 정수 센트입니다.' : 'Table money values are in USD, with units retained in CSV headers. Source money values are integer cents.')
        : kind === 'customers'
          ? (ko ? '활성화는 가입 당일의 핵심 행동 완료를 뜻합니다. 기말 유지 계정은 미해지 계정이며 활성 사용자 수가 아닙니다.' : 'Activation means completing the key action on signup day. Enabled accounts are non-closed accounts, not active users.')
          : (ko ? '처리 시간은 성공·실패 작업을 모두 포함한 가중 평균입니다. 대기열은 유입에서 전체 시도를 차감하여 갱신됩니다.' : 'Processing time is weighted across completed and failed attempts. The queue changes by arrivals minus all attempts.'),
    ],
  };
  if (!isBusinessDate(range.start) || !isBusinessDate(range.end) || range.start > range.end || dayCount(range) > 366) {
    base.message = ko ? '올바른 시작일과 종료일을 선택하세요. 최대 조회 기간은 366일입니다.' : 'Choose valid dates in chronological order, with no more than 366 days.';
    return base;
  }
  const days = dayCount(range);
  const previousRange = { start: offsetDate(range.start, -days), end: offsetDate(range.start, -1) };
  // The display contract uses four-digit ISO years. An earlier unrepresentable comparison is unavailable.
  const validPrevious = isBusinessDate(previousRange.start) && isBusinessDate(previousRange.end);
  const currentRecords = select<DailyBase>(SYNTHETIC_DAILY_DATA[kind], range);
  const observedDays = new Set(currentRecords.map(row => row.date)).size;
  const coverage = observedDays === 0 ? 'missing' : observedDays === days ? 'complete' : 'partial';
  const previousAvailable = validPrevious && previousRange.start >= AVAILABLE_RANGE.start && previousRange.end <= AVAILABLE_RANGE.end;
  const current = observedMetrics(kind, range, ko);
  const previous = previousAvailable ? observedMetrics(kind, previousRange, ko) : null;
  const metrics = definitions(kind, ko).map((definition, index): MetricView => ({ definition, current: current[index], scope: scope(kind, range),
    sourceLabel, ...(previous ? { previous: previous[index], previousScope: scope(kind, previousRange) } : {}) }));
  const categoryName = (key: string) => labels.find(label => label.key === key)![locale];
  const primary = (records: readonly DashboardRow[]) => sum(records, row => row.values[kind === 'revenue' ? 'netSalesCents' : kind === 'customers' ? 'signups' : 'completed']) / (kind === 'revenue' ? 100 : 1);
  let rows: DashboardRow[];
  if (kind === 'revenue') rows = select(SYNTHETIC_DAILY_DATA.revenue, range).map(({ date, category, ...values }) =>
    ({ id: `${kind}:${date}:${category}`, date, category: categoryName(category), values }));
  else if (kind === 'customers') rows = select(SYNTHETIC_DAILY_DATA.customers, range).map(({ date, category, ...values }) =>
    ({ id: `${kind}:${date}:${category}`, date, category: categoryName(category), values }));
  else rows = select(SYNTHETIC_DAILY_DATA.operations, range).map(({ date, category, ...values }) =>
    ({ id: `${kind}:${date}:${category}`, date, category: categoryName(category), values: { ...values, meanDurationMs: values.durationTotalMs / values.attempted } }));
  const trend: SeriesPoint[] = observedDays ? Array.from({ length: days }, (_, index) => {
    const date = offsetDate(range.start, index);
    const daily = rows.filter(row => row.date === date);
    return { key: date, label: new Intl.DateTimeFormat(locale, { month: 'short', day: 'numeric', timeZone: 'UTC' }).format(new Date(`${date}T00:00:00.000Z`)), value: daily.length ? primary(daily) : null };
  }) : [];
  const categories: SeriesPoint[] = observedDays ? labels.map(label => ({ key: label.key, label: label[locale],
    value: primary(rows.filter(row => row.category === label[locale])) })) : [];
  let message = coverage === 'complete'
    ? (ko ? `${days}일 전체 데이터 · 합성 샘플` : `Complete ${days}-day coverage · synthetic sample`)
    : coverage === 'partial'
      ? (ko ? `${days}일 중 ${observedDays}일만 데이터가 있습니다. 부분 합계이며 기간 전체 값이 아닙니다.` : `Only ${observedDays} of ${days} days are available. Totals are partial, not full-period results.`)
      : (ko ? '선택 기간에 합성 데이터가 없습니다. 2026-08-18부터 2026-09-14 사이를 선택하세요.' : 'No synthetic records in this range. Select dates from 2026-08-18 through 2026-09-14.');
  if (!previousAvailable) message += ko ? ' 직전 동일 기간 데이터가 부족하여 비교할 수 없습니다.' : ' The previous equal-length period is unavailable because fixture coverage is insufficient.';
  return { ...base, previousRange: validPrevious ? previousRange : null, status: observedDays ? 'ready' : 'empty', coverage, message,
    previousAvailable, metrics, trend, categories, rows: rows.sort((a, b) => b.date.localeCompare(a.date)) };
}

/** Each tiny plot is computed independently in the same unit as its metric. */
export function metricHistories(model:DashboardModel,locale:KitLocale):Record<string,SeriesPoint[]> {
  const result:Record<string,SeriesPoint[]>={};
  for(const m of model.metrics)result[m.definition.id]=[];
  for(const day of model.trend) {
    const daily=buildDashboard(model.kind,{start:day.key,end:day.key},locale);
    for(const m of model.metrics)result[m.definition.id].push({key:day.key,label:day.label,value:daily.metrics.find(d=>d.definition.id===m.definition.id)?.current.value??null});
  }
  return result;
}
