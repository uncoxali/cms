import { Response } from 'express';
import { AuthenticatedRequest } from '../utils/auth';
export declare function getSettings(req: AuthenticatedRequest, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
export declare function updateSettings(req: AuthenticatedRequest, res: Response): Promise<void>;
export declare function getSeoSettings(req: AuthenticatedRequest, res: Response): Promise<void>;
export declare function updateSeoSettings(req: AuthenticatedRequest, res: Response): Promise<void>;
