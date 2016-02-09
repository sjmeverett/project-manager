
export class NotFoundError extends Error {
  constructor(message) {
    super(message);
    this.code = "1001";
    this.status = "404";
  }
};
