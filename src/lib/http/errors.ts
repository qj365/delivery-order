export interface HTTPErrorInterface {
  statusCode: number;
  code?: number;
  message?: string;
  details?: string;
  tag?: string;
}
export class HTTPError extends Error {
  public statusCode: number;
  public code?: number;
  public message = "Internal Server Error";
  public details?: string;
  public tag?: string;
  constructor(json: HTTPErrorInterface, details?: string) {
    super(json.message || "Internal Server Error");

    Object.setPrototypeOf(this, new.target.prototype);

    this.statusCode = json.statusCode;
    this.code = json.code || json.statusCode;
    this.message = json.message || "Internal Server Error";
    this.details = details || json.details;
    this.tag = json.tag;

    Error.captureStackTrace(this);
  }
}

export { default as errors } from "../../../static/errors.json";
