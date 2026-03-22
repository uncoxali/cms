import { Response } from 'express';
import { AuthenticatedRequest } from '../utils/auth';
export declare function getFiles(req: AuthenticatedRequest, res: Response): Promise<void>;
export declare function getFile(req: AuthenticatedRequest, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
export declare function uploadFile(req: AuthenticatedRequest, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
export declare function updateFile(req: AuthenticatedRequest, res: Response): Promise<void>;
export declare function deleteFile(req: AuthenticatedRequest, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
export declare function viewFile(req: any, res: Response): Promise<void | Response<any, Record<string, any>>>;
export declare function migrateToDb(req: AuthenticatedRequest, res: Response): Promise<void>;
