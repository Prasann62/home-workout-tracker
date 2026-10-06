import { Request, Response, NextFunction } from 'express';

export function authMiddleware(req: Request, res: Response, next: NextFunction): void {
  // Allow health check endpoint to bypass auth
  if (req.path === '/health') {
    return next();
  }

  const expectedKey = process.env.API_KEY || 'repai_secret_key_change_me';

  // Check x-api-key header or Bearer token in Authorization header
  const apiKeyHeader = req.headers['x-api-key'] as string;
  let bearerToken: string | undefined;

  const authHeader = req.headers['authorization'];
  if (authHeader && authHeader.startsWith('Bearer ')) {
    bearerToken = authHeader.substring(7).trim();
  }

  const providedKey = apiKeyHeader || bearerToken;

  if (!providedKey || providedKey !== expectedKey) {
    res.status(401).json({
      error: 'Unauthorized',
      message: 'Missing or invalid API key header (x-api-key or Authorization Bearer token)'
    });
    return;
  }

  next();
}
