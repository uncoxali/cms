import { Response } from 'express';
import { AuthenticatedRequest } from '../utils/auth';
export declare function getSchema(req: AuthenticatedRequest, res: Response): Promise<void>;
export declare function getCollectionSchema(req: AuthenticatedRequest, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
export declare function createCollection(req: AuthenticatedRequest, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
export declare function updateCollectionSchema(req: AuthenticatedRequest, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
export declare function deleteCollection(req: AuthenticatedRequest, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
