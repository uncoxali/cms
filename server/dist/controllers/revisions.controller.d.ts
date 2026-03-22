import { Response } from 'express';
import { AuthenticatedRequest } from '../utils/auth';
export declare function getRevisions(req: AuthenticatedRequest, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
export declare function createRevision(req: AuthenticatedRequest, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
export declare function getRevision(req: AuthenticatedRequest, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
export declare function deleteRevision(req: AuthenticatedRequest, res: Response): Promise<void>;
