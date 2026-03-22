import { Response } from 'express';
import { AuthenticatedRequest } from '../utils/auth';
export declare function getComments(req: AuthenticatedRequest, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
export declare function createComment(req: AuthenticatedRequest, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
export declare function updateComment(req: AuthenticatedRequest, res: Response): Promise<void>;
export declare function deleteComment(req: AuthenticatedRequest, res: Response): Promise<void>;
