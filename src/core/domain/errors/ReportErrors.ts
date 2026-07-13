export class InvalidBrandReviewFilters extends Error {
  readonly code = 'INVALID_BRAND_REVIEW_FILTERS';

  constructor(message: string) {
    super(message);
    this.name = 'InvalidBrandReviewFilters';
  }
}
