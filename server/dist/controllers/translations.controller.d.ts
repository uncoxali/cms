import { Response } from 'express';
import { AuthenticatedRequest } from '../utils/auth';
export declare function getTranslations(req: AuthenticatedRequest, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
export declare function createOrUpdateTranslation(req: AuthenticatedRequest, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
export declare function deleteTranslation(req: AuthenticatedRequest, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
