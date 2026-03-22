import { Response } from 'express';
import { AuthenticatedRequest } from '../utils/auth';
export declare function getDashboard(req: AuthenticatedRequest, res: Response): Promise<void>;
