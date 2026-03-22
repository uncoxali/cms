import { Response } from 'express';
import { AuthenticatedRequest } from '../utils/auth';
export declare function getRoles(req: AuthenticatedRequest, res: Response): Promise<void>;
export declare function getRole(req: AuthenticatedRequest, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
export declare function createRole(req: AuthenticatedRequest, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
export declare function updateRole(req: AuthenticatedRequest, res: Response): Promise<void>;
export declare function deleteRole(req: AuthenticatedRequest, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
export declare function getRolePermissions(req: AuthenticatedRequest, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
export declare function updateRolePermissions(req: AuthenticatedRequest, res: Response): Promise<void>;
