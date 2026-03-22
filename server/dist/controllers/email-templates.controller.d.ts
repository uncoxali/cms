import { Response } from 'express';
import { AuthenticatedRequest } from '../utils/auth';
export declare function getEmailTemplates(req: AuthenticatedRequest, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
export declare function getEmailTemplate(req: AuthenticatedRequest, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
export declare function createEmailTemplate(req: AuthenticatedRequest, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
export declare function updateEmailTemplate(req: AuthenticatedRequest, res: Response): Promise<void>;
export declare function deleteEmailTemplate(req: AuthenticatedRequest, res: Response): Promise<void>;
