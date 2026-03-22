import { Response } from 'express';
import { AuthenticatedRequest } from '../utils/auth';
export declare function exportData(req: AuthenticatedRequest, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
export declare function importData(req: AuthenticatedRequest, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
