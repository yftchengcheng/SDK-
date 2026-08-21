/**
 * 阶段 1.6: 前端字典缓存（**单一数据源**）
 *
 * 设计原则（AGENTS.md "字典表使用规范"）：
 * - 应用启动时异步 loadEnums() 拉取 /api/v1/dict/enum 全量
 * - TTL 5min，到期自动刷新（不阻塞 UI）
 * - getLabel(dict_code, value) 同步返回 label（业务代码无感）
 * - getOptions(dict_code) 同步返回 options 数组（form select 用）
 * - 数据库不可用时**降级**到 enum-labels.ts 本地常量（dictCache 为空时返回 null）
 *
 * ⚠️ 必须 singleton：整个应用 1 个实例
 */

type EnumRow = {
  dict_code: string;
  value: number;
  label: string;
  sort_order: number;
};

type PlacementFieldRow = {
  format: number;
  access_type: number;
  field_name: string;
  display_name: string;
  field_type: 'input' | 'select' | 'radio' | 'switch';
  required: boolean;
  options_json: Array<{ value: string | number | boolean; label: string }>;
  sort_order: number;
  note: string | null;
};

type AppFieldRow = {
  field_name: string;
  display_name: string;
  default_value: unknown;
  required: boolean;
  note: string | null;
  sort_order: number;
};

class DictCache {
  private enumMap = new Map<string, Map<string | number, string>>(); // dict_code -> (value -> label)
  private enumOptions = new Map<string, Array<{ value: string | number | boolean; label: string }>>();
  private placementFieldMap = new Map<string, PlacementFieldRow>(); // key: `${format}:${accessType}:${field_name}`
  private placementFieldList = new Map<string, PlacementFieldRow[]>(); // key: `${format}:${accessType}`
  private appFieldMap = new Map<string, AppFieldRow>();
  private appFieldLoading: Promise<void> | null = null;
  private lastLoad = 0;
  private loading: Promise<void> | null = null;
  private readonly TTL = 5 * 60 * 1000; // 5 min

  /** 应用启动时调用一次（main.ts / App.vue） */
  async loadEnums(force = false): Promise<void> {
    if (this.loading) return this.loading;
    if (!force && Date.now() - this.lastLoad < this.TTL && this.enumMap.size > 0) return;
    this.loading = (async () => {
      try {
        const res = await fetch('/api/v1/dict/enum', { credentials: 'include' });
        const json = await res.json();
        if (json?.code === 0 && Array.isArray(json.data?.items)) {
          this.applyEnums(json.data.items as EnumRow[]);
          this.lastLoad = Date.now();
        }
      } catch (e) {
        // 降级：保持本地常量生效（getLabel 返回 null 时回退 enum-labels.ts）
        console.warn('[dictCache] loadEnums failed, fallback to local enum-labels.ts', e);
      } finally {
        this.loading = null;
      }
    })();
    return this.loading;
  }

  /** 同步获取 label（**未命中时返回 null，调用方应 fallback 到 enum-labels.ts**） */
  getLabel(dictCode: string, value: string | number | boolean | null | undefined): string | null {
    if (value === null || value === undefined) return '--';
    const inner = this.enumMap.get(dictCode);
    if (!inner) return null;
    const key = typeof value === 'boolean' ? String(value) : value;
    return inner.get(key as string | number) ?? null;
  }

  /** 同步获取 options 数组 */
  getOptions(dictCode: string): Array<{ value: string | number | boolean; label: string }> {
    return this.enumOptions.get(dictCode) ?? [];
  }

  /** 异步加载 placement 字段定义（按 format + accessType） */
  async loadPlacementFieldDef(format: number, accessType: number): Promise<PlacementFieldRow[]> {
    const key = `${format}:${accessType}`;
    if (this.placementFieldList.has(key)) return this.placementFieldList.get(key) ?? [];
    try {
      const res = await fetch(
        `/api/v1/dict/placement-field-def?format=${format}&accessType=${accessType}`,
        { credentials: 'include' },
      );
      const json = await res.json();
      if (json?.code === 0 && Array.isArray(json.data?.items)) {
        const items = json.data.items as PlacementFieldRow[];
        this.placementFieldList.set(key, items);
        for (const row of items) {
          this.placementFieldMap.set(`${format}:${accessType}:${row.field_name}`, row);
        }
        return items;
      }
    } catch (e) {
      console.warn(`[dictCache] loadPlacementFieldDef ${key} failed`, e);
    }
    return [];
  }

  /** 同步获取 placement 字段定义（**未命中返回 null**） */
  getPlacementFieldDef(format: number, accessType: number, fieldName: string): PlacementFieldRow | null {
    return this.placementFieldMap.get(`${format}:${accessType}:${fieldName}`) ?? null;
  }

  /** 同步获取 placement 字段定义列表（**未命中返回 null**） */
  getPlacementFieldList(format: number, accessType: number): PlacementFieldRow[] | null {
    return this.placementFieldList.get(`${format}:${accessType}`) ?? null;
  }

  /** 异步加载 app 字段定义（带单例锁，保证只 fetch 一次） */
  async ensureAppFieldDefLoaded(): Promise<void> {
    if (this.appFieldMap.size > 0) return;
    if (this.appFieldLoading) return this.appFieldLoading;
    this.appFieldLoading = this.loadAppFieldDef().then(() => undefined).catch(() => undefined);
    return this.appFieldLoading;
  }

  /** 异步加载 app 字段定义 */
  async loadAppFieldDef(): Promise<AppFieldRow[]> {
    if (this.appFieldMap.size > 0) return Array.from(this.appFieldMap.values());
    try {
      const res = await fetch('/api/v1/dict/app-field-def', { credentials: 'include' });
      const json = await res.json();
      if (json?.code === 0 && Array.isArray(json.data?.items)) {
        const items = json.data.items as AppFieldRow[];
        for (const row of items) this.appFieldMap.set(row.field_name, row);
        return items;
      }
    } catch (e) {
      console.warn('[dictCache] loadAppFieldDef failed', e);
    }
    return [];
  }

  /** 同步获取 app 字段定义 */
  getAppFieldDef(fieldName: string): AppFieldRow | null {
    return this.appFieldMap.get(fieldName) ?? null;
  }

  private applyEnums(rows: EnumRow[]): void {
    this.enumMap.clear();
    this.enumOptions.clear();
    for (const row of rows) {
      if (!this.enumMap.has(row.dict_code)) {
        this.enumMap.set(row.dict_code, new Map());
        this.enumOptions.set(row.dict_code, []);
      }
      this.enumMap.get(row.dict_code)!.set(row.value, row.label);
      this.enumOptions.get(row.dict_code)!.push({ value: row.value, label: row.label });
    }
  }

  /** 强制刷新（管理员改完字典后调用） */
  invalidate(): void {
    this.lastLoad = 0;
    this.enumMap.clear();
    this.enumOptions.clear();
    this.placementFieldMap.clear();
    this.placementFieldList.clear();
    this.appFieldMap.clear();
  }
}

export const dictCache = new DictCache();
export type { PlacementFieldRow, AppFieldRow };
