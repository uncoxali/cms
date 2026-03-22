import { Response } from 'express';
import { AuthenticatedRequest } from '../utils/auth';
export declare function getWebhooks(req: AuthenticatedRequest, res: Response): Promise<void>;
export declare function getWebhook(req: AuthenticatedRequest, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
export declare function createWebhook(req: AuthenticatedRequest, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
export declare function updateWebhook(req: AuthenticatedRequest, res: Response): Promise<void>;
export declare function deleteWebhook(req: AuthenticatedRequest, res: Response): Promise<void>;
export declare function testWebhook(req: AuthenticatedRequest, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
export declare function getWebhookLogs(req: AuthenticatedRequest, res: Response): Promise<void>;
