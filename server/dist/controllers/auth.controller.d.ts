import { Response } from 'express';
import { AuthenticatedRequest } from '../utils/auth';
export declare function login(req: AuthenticatedRequest, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
export declare function logout(req: AuthenticatedRequest, res: Response): Promise<void>;
export declare function refreshToken(req: AuthenticatedRequest, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
export declare function getMe(req: AuthenticatedRequest, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
