export type ElementRecordFilters = {
  page?: number;
  pageSize?: number;
  providerId?: number;
  typeId?: number;
  brandName?: string; // contains
  year?: number;
  month?: number;
  communeId?: number;
};

export type ElementRecordListItem = {
  id: number;
  capturedAt: Date | null;
  year: number | null;
  month: number | null;
  valueCLP: string | null; // numeric from DB may come as string
  areaM2: number | null;
  status: number | null;
  userAgent: string | null;
  photoUrl: string | null;
  notes: string | null;
  elementId: number;
  address: string | null;
  providerId: number | null;
  providerName: string | null;
  typeId: number | null;
  typeName: string | null;
  brandId: number | null;
  brandName: string | null;
  categoryId: number | null;
  categoryName: string | null;
  communeId: number | null;
  communeName: string | null;
  provinceName: string | null;
  regionName: string | null;
};

export type ElementRecordListResult = {
  items: ElementRecordListItem[];
  total: number;
  page: number;
  pageSize: number;
};

export interface ElementRecordRepository {
  list(filters: ElementRecordFilters): Promise<ElementRecordListResult>;
}

//Estos elementos en entities