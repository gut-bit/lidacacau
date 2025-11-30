import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import path from 'path';
import fs from 'fs';

import authRoutes from './routes/auth';
import usersRoutes from './routes/users';
import jobsRoutes from './routes/jobs';
import propertiesRoutes from './routes/properties';
import socialRoutes from './routes/social';

const app = express();
const PORT = process.env.PORT || 5000;
const isProduction = process.env.NODE_ENV === 'production';

app.use(helmet());

app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? ['https://www.lidacacau.com', 'https://lidacacau.com']
    : '*',
  credentials: true,
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { error: 'Muitas requisicoes. Tente novamente em 15 minutos.' },
});
app.use('/api', limiter);

const authLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 5,
  message: { error: 'Muitas tentativas de login. Aguarde 1 minuto.' },
});
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/register', authLimiter);

app.use('/api/auth', authRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/jobs', jobsRoutes);
app.use('/api/properties', propertiesRoutes);
app.use('/api/social', socialRoutes);

app.get('/api/health', (_req: Request, res: Response) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error('[API Error]', err);
  res.status(500).json({ 
    error: 'Erro interno do servidor',
    message: isProduction ? undefined : err.message
  });
});

if (isProduction) {
  const distPath = path.join(__dirname, '..', 'dist');
  
  if (fs.existsSync(distPath)) {
    app.use(express.static(distPath));
    
    app.get('/{*splat}', (_req: Request, res: Response) => {
      const indexPath = path.join(distPath, 'index.html');
      if (fs.existsSync(indexPath)) {
        res.sendFile(indexPath);
      } else {
        res.status(404).send('App not found');
      }
    });
    
    app.use((_req: Request, res: Response) => {
      res.status(404).json({ error: 'Endpoint nao encontrado' });
    });
    
    console.log('[LidaCacau] Servindo arquivos estaticos de:', distPath);
  } else {
    console.warn('[LidaCacau] Pasta dist nao encontrada. Execute: npx expo export --platform web');
  }
} else {
  app.use((_req: Request, res: Response) => {
    res.status(404).json({ error: 'Endpoint nao encontrado' });
  });
}

app.listen(PORT, '0.0.0.0', () => {
  console.log(`[LidaCacau API] Servidor rodando na porta ${PORT}`);
  console.log(`[LidaCacau] Ambiente: ${isProduction ? 'Producao' : 'Desenvolvimento'}`);
});

export default app;
