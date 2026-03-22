import { Response } from 'express';
import { AuthenticatedRequest } from '../utils/auth';
export declare function getCollections(req: AuthenticatedRequest, res: Response): Promise<void>;
export declare function getCollection(req: AuthenticatedRequest, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
export declare function createCollection(req: AuthenticatedRequest, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
export declare function updateCollection(req: AuthenticatedRequest, res: Response): Promise<void>;
export declare function deleteCollection(req: AuthenticatedRequest, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
