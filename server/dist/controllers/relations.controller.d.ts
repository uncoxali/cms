import { Response } from 'express';
import { AuthenticatedRequest } from '../utils/auth';
export declare function getRelations(req: AuthenticatedRequest, res: Response): Promise<void>;
export declare function createRelation(req: AuthenticatedRequest, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
export declare function deleteRelation(req: AuthenticatedRequest, res: Response): Promise<void>;
