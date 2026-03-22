import { Response } from 'express';
import { AuthenticatedRequest } from '../utils/auth';
export declare function getRooms(req: AuthenticatedRequest, res: Response): Promise<void>;
export declare function createRoom(req: AuthenticatedRequest, res: Response): Promise<void>;
export declare function getMessages(req: AuthenticatedRequest, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
export declare function sendMessage(req: AuthenticatedRequest, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
