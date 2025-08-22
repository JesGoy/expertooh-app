import type { ElementRecordRepository, ElementRecordFilters, ElementRecordListResult } from '../ports/ElementRecordRepository';

export class ListElementRecords {
  constructor(private readonly deps: { repo: ElementRecordRepository }) {}

  async execute(filters: ElementRecordFilters): Promise<ElementRecordListResult> {
    const page = Math.max(1, filters.page ?? 1);
    const pageSize = Math.min(100, Math.max(1, filters.pageSize ?? 20));
    return this.deps.repo.list({ ...filters, page, pageSize });
  }
}
