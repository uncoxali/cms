import { Response } from 'express';
import { AuthenticatedRequest } from '../utils/auth';
export declare function getEndpoints(_req: AuthenticatedRequest, res: Response): Promise<void>;
export declare function createEndpoint(req: AuthenticatedRequest, res: Response): Promise<void>;
export declare function updateEndpoint(req: AuthenticatedRequest, res: Response): Promise<void>;
export declare function deleteEndpoint(req: AuthenticatedRequest, res: Response): Promise<void>;
