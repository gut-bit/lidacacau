import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import path from 'path';
import fs from 'fs';

import { testConnection, db } from './db/drizzle';
import authRoutes from './routes/auth';
import usersRoutes from './routes/users';
import jobsRoutes from './routes/jobs';
import propertiesRoutes from './routes/properties';
import socialRoutes from './routes/social';

const app = express();
const PORT = parseInt(process.env.PORT || '5000', 10);
const isProduction = process.env.NODE_ENV === 'production';

let dbConnected = false;

app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginEmbedderPolicy: false,
}));

app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? ['https://www.lidacacau.com', 'https://lidacacau.com', 'https://lidacacau.replit.app']
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

app.get('/api/health', async (_req: Request, res: Response) => {
  res.json({ 
    status: dbConnected ? 'ok' : 'degraded',
    database: dbConnected ? 'connected' : 'disconnected',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    env: {
      hasDbUrl: !!process.env.DATABASE_URL,
      hasSessionSecret: !!process.env.SESSION_SECRET,
      nodeEnv: process.env.NODE_ENV || 'not set'
    }
  });
});

app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error('[API Error]', err);
  res.status(500).json({ 
    error: 'Erro interno do servidor',
    message: isProduction ? undefined : err.message
  });
});

const staticPath = path.join(__dirname, '..', 'static-build');

if (fs.existsSync(staticPath)) {
  console.log('[LidaCacau] Servindo arquivos estaticos de:', staticPath);
  
  app.use(express.static(staticPath, {
    maxAge: isProduction ? '1d' : 0,
    etag: true,
  }));
  
  app.use((req: Request, res: Response) => {
    if (req.path.startsWith('/api')) {
      res.status(404).json({ error: 'API endpoint nao encontrado' });
      return;
    }
    
    const indexPath = path.join(staticPath, 'index.html');
    if (fs.existsSync(indexPath)) {
      res.sendFile(indexPath);
    } else {
      res.status(404).send('App not found - index.html missing');
    }
  });
} else {
  console.warn('[LidaCacau] AVISO: Pasta static-build nao encontrada!');
  console.warn('[LidaCacau] Execute: node scripts/build-web.js');
  
  app.use((_req: Request, res: Response) => {
    res.status(503).json({ 
      error: 'App em manutencao',
      message: 'Arquivos estaticos nao encontrados. Tente novamente em alguns minutos.'
    });
  });
}

async function startServer() {
  console.log('[LidaCacau] Iniciando servidor...');
  console.log('[LidaCacau] DATABASE_URL presente:', !!process.env.DATABASE_URL);
  console.log('[LidaCacau] SESSION_SECRET presente:', !!process.env.SESSION_SECRET);
  console.log('[LidaCacau] NODE_ENV:', process.env.NODE_ENV);
  
  try {
    dbConnected = await testConnection();
    if (dbConnected) {
      console.log('[LidaCacau] Banco de dados conectado com sucesso');
    } else {
      console.warn('[LidaCacau] Banco de dados nao conectado - usando modo offline');
    }
  } catch (error) {
    console.error('[LidaCacau] Erro ao conectar banco de dados:', error);
  }
  
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[LidaCacau API] Servidor rodando na porta ${PORT}`);
    console.log(`[LidaCacau] Ambiente: ${isProduction ? 'Producao' : 'Desenvolvimento'}`);
    console.log(`[LidaCacau] Banco de dados: ${dbConnected ? 'Conectado' : 'Desconectado'}`);
  });
}

startServer();

export default app;
