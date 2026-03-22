import { Response } from 'express';
import { AuthenticatedRequest } from '../utils/auth';
export declare function getTemplates(req: AuthenticatedRequest, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
export declare function createTemplate(req: AuthenticatedRequest, res: Response): Promise<void>;
export declare function updateTemplate(req: AuthenticatedRequest, res: Response): Promise<void>;
export declare function deleteTemplate(req: AuthenticatedRequest, res: Response): Promise<void>;
