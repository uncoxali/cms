import { Response } from 'express';
import { AuthenticatedRequest } from '../utils/auth';
export declare function getUsers(req: AuthenticatedRequest, res: Response): Promise<void>;
export declare function getUser(req: AuthenticatedRequest, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
export declare function createUser(req: AuthenticatedRequest, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
export declare function updateUser(req: AuthenticatedRequest, res: Response): Promise<void>;
export declare function deleteUser(req: AuthenticatedRequest, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
