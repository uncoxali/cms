import { Response } from 'express';
import { AuthenticatedRequest } from '../utils/auth';
export declare function getItems(req: AuthenticatedRequest, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
export declare function getItem(req: AuthenticatedRequest, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
export declare function createItem(req: AuthenticatedRequest, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
export declare function updateItem(req: AuthenticatedRequest, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
export declare function deleteItem(req: AuthenticatedRequest, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
