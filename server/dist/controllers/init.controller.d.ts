import { Request, Response } from 'express';
export declare function checkInit(_req: Request, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
export declare function initializeDb(_req: Request, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
