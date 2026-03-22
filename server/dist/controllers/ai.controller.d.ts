import { Response } from 'express';
import { AuthenticatedRequest } from '../utils/auth';
export declare function chatCompletion(req: AuthenticatedRequest, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
