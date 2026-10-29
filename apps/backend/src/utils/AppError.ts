/**
 * An error that carries the HTTP status it should be reported with.
 * Anything thrown that isn't an AppError is treated as an unexpected 500.
 */
export class AppError extends Error {
  constructor(
    public readonly statusCode: number,
    message: string
  ) {
    super(message);
    this.name = 'AppError';
  }
}
