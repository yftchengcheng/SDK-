import dayjs from 'dayjs';

/**
 * 日期范围快捷选项（Element Plus daterange shortcuts）
 *
 * 复用：数据看板（src/views/dashboard/Index.vue）+ 报表（src/components/report/ReportFilter.vue）
 * EP 会把 shortcuts 自动渲染在日期面板的左侧
 */
export interface DateShortcut {
  text: string;
  value: () => [string, string];
}

const today = (): string => dayjs().format('YYYY-MM-DD');
const offset = (n: number): string => dayjs().subtract(n, 'day').format('YYYY-MM-DD');

export const dateShortcuts: DateShortcut[] = [
  {
    text: '今天',
    value: () => [today(), today()],
  },
  {
    text: '昨天',
    value: () => [offset(1), offset(1)],
  },
  {
    text: '近 7 天',
    value: () => [offset(6), today()],
  },
  {
    text: '近 30 天',
    value: () => [offset(29), today()],
  },
  {
    text: '本月',
    value: () => [dayjs().startOf('month').format('YYYY-MM-DD'), today()],
  },
  {
    text: '上月',
    value: () => [
      dayjs().subtract(1, 'month').startOf('month').format('YYYY-MM-DD'),
      dayjs().subtract(1, 'month').endOf('month').format('YYYY-MM-DD'),
    ],
  },
];

/**
 * 把 dateRange 预设枚举 + 自定义起止 → 实际 [start, end] 日期
 * （与后端 report-aggregate.ts 的 dateRangeOf 行为对齐）
 */
export function resolveDateRange(
  dateRange: 'today' | 'yesterday' | '7d' | '30d' | 'month' | 'lastMonth' | 'custom',
  customStart?: string,
  customEnd?: string,
): [string, string] {
  switch (dateRange) {
    case 'today':
      return [today(), today()];
    case 'yesterday':
      return [offset(1), offset(1)];
    case '7d':
      return [offset(6), today()];
    case '30d':
      return [offset(29), today()];
    case 'month':
      return [dayjs().startOf('month').format('YYYY-MM-DD'), today()];
    case 'lastMonth':
      return [
        dayjs().subtract(1, 'month').startOf('month').format('YYYY-MM-DD'),
        dayjs().subtract(1, 'month').endOf('month').format('YYYY-MM-DD'),
      ];
    case 'custom':
      if (customStart && customEnd) return [customStart, customEnd];
      return [offset(6), today()];
    default:
      return [offset(6), today()];
  }
}
