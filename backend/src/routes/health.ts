import { Router, Request, Response } from 'express';

export const healthRouter = Router();

healthRouter.get('/', (req: Request, res: Response) => {
  res.json({
    status: 'ok',
    app: 'RepAI Personal Backend',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    uptimeSeconds: Math.floor(process.uptime())
  });
});
