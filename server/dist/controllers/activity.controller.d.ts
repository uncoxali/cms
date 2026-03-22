import { Response } from 'express';
import { AuthenticatedRequest } from '../utils/auth';
export declare function getActivity(req: AuthenticatedRequest, res: Response): Promise<void>;
export declare function createActivity(req: AuthenticatedRequest, res: Response): Promise<void>;
export declare function deleteActivity(req: AuthenticatedRequest, res: Response): Promise<void>;
export declare function clearActivity(req: AuthenticatedRequest, res: Response): Promise<void>;
