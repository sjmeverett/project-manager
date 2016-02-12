
export class NotFoundError extends Error {
  constructor(message) {
    super(message);
    this.code = '1001';
    this.status = '404';
  }
};


export class ConflictError extends Error {
  constructor(message) {
    super(message);
    this.code = '1002';
    this.status = '409';
  }
};


export class BadRequestError extends Error {
  constructor(message) {
    super(message);
    this.code = '1003';
    this.status = '400';
  }
};


export class NotAuthenticatedError extends Error {
  constructor(message='You are not authenticated: please authenticate and try again.') {
    super(message);
    this.code = '1004';
    this.status = '401';
  }
};


export class NotAuthorisedError extends Error {
  constructor(message='You are not authorised from accessing this resource.') {
    super(message);
    this.code = '1005';
    this.status = '403';
  }
};
