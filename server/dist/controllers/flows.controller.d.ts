import { Response } from 'express';
import { AuthenticatedRequest } from '../utils/auth';
export declare function getFlows(req: AuthenticatedRequest, res: Response): Promise<void>;
export declare function getFlow(req: AuthenticatedRequest, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
export declare function createFlow(req: AuthenticatedRequest, res: Response): Promise<void>;
export declare function updateFlow(req: AuthenticatedRequest, res: Response): Promise<void>;
export declare function deleteFlow(req: AuthenticatedRequest, res: Response): Promise<void>;
