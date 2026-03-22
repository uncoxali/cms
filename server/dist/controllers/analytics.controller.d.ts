import { Response } from 'express';
import { AuthenticatedRequest } from '../utils/auth';
export declare function getAnalytics(req: AuthenticatedRequest, res: Response): Promise<void>;
