import { Request, Response, NextFunction, RequestHandler } from "express";

export type AsyncHandler<
  P = any,
  ResBody = any,
  ReqBody = any,
  ReqQuery = any
> = RequestHandler<P, ResBody, ReqBody, ReqQuery>;

export interface TypedRequest<T = any> extends Request {
  body: T;
}
