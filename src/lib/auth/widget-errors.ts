export class WidgetAuthError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "WidgetAuthError";
  }
}
