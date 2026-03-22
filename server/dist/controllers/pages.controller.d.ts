import { Response } from 'express';
import { AuthenticatedRequest } from '../utils/auth';
export declare function getPages(req: AuthenticatedRequest, res: Response): Promise<void>;
export declare function getPage(req: AuthenticatedRequest, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
export declare function createPage(req: AuthenticatedRequest, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
export declare function updatePage(req: AuthenticatedRequest, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
export declare function deletePage(req: AuthenticatedRequest, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
