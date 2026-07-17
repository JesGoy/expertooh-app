export class InvalidComparisonFilters extends Error {
  readonly code = 'INVALID_COMPARISON_FILTERS';

  constructor(message: string) {
    super(message);
    this.name = 'InvalidComparisonFilters';
  }
}
