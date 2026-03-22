import { Response } from 'express';
import { AuthenticatedRequest } from '../utils/auth';
export declare function getTrash(req: AuthenticatedRequest, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
export declare function emptyTrash(req: AuthenticatedRequest, res: Response): Promise<void>;
export declare function restoreItem(req: AuthenticatedRequest, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
export declare function permanentDelete(req: AuthenticatedRequest, res: Response): Promise<void>;
