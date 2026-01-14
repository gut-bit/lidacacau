import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import path from 'path';
import fs from 'fs';

import { testConnection, db } from './db/drizzle';
import { jobs, serviceTypes, users } from './db/schema';
import { eq } from 'drizzle-orm';
import authRoutes from './routes/auth';
import usersRoutes from './routes/users';
import jobsRoutes from './routes/jobs';
import propertiesRoutes from './routes/properties';
import socialRoutes from './routes/social';
import cacauPrecosRoutes from './routes/cacauPrecos';
import communityRoutes from './routes/community';

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
app.use('/api/cacau-precos', cacauPrecosRoutes);
app.use('/api/community', communityRoutes);

// Serve generated videos for download
app.use('/videos', express.static(path.join(__dirname, '../attached_assets/generated_videos'), {
  setHeaders: (res, filePath) => {
    if (filePath.endsWith('.mp4')) {
      res.setHeader('Content-Type', 'video/mp4');
      res.setHeader('Content-Disposition', `attachment; filename="${path.basename(filePath)}"`);
    }
  }
}));

// Serve public pages (downloads, etc)
app.use('/public', express.static(path.join(__dirname, 'public')));

// Downloads page route
app.get('/downloads', (_req: Request, res: Response) => {
  res.sendFile(path.join(__dirname, 'public/downloads.html'));
});

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

// Share route for WhatsApp/Social Media preview with Open Graph meta tags
app.get('/share/demand/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const baseUrl = isProduction ? 'https://lidacacau.com' : `https://${process.env.REPLIT_DEV_DOMAIN || 'localhost:5000'}`;
    
    let title = 'Demanda de Trabalho';
    let description = 'Confira esta oportunidade de trabalho no LidaCacau';
    let imageUrl = `${baseUrl}/favicon.ico`;
    let offer = '';
    let location = '';
    
    if (dbConnected) {
      try {
        const [job] = await db
          .select({
            serviceTypeName: serviceTypes.name,
            locationText: jobs.locationText,
            offer: jobs.offer,
            quantity: jobs.quantity,
            producerName: users.name,
          })
          .from(jobs)
          .leftJoin(users, eq(jobs.producerId, users.id))
          .leftJoin(serviceTypes, eq(jobs.serviceTypeId, serviceTypes.id))
          .where(eq(jobs.id, id))
          .limit(1);
        
        if (job) {
          title = `${job.serviceTypeName || 'Trabalho'} - LidaCacau`;
          location = job.locationText || 'Uruara, PA';
          offer = job.offer ? `R$ ${parseFloat(job.offer).toFixed(2)}` : '';
          description = `${job.quantity || 1}x ${job.serviceTypeName || 'servico'} em ${location}${offer ? ` - ${offer}` : ''}. Publicado por ${job.producerName || 'Produtor'}`;
        }
      } catch (dbError) {
        console.error('[Share] DB query error:', dbError);
      }
    }
    
    const shareHtml = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${title}</title>
  
  <!-- Open Graph / Facebook / WhatsApp -->
  <meta property="og:type" content="website">
  <meta property="og:url" content="${baseUrl}/demand/${id}">
  <meta property="og:title" content="${title}">
  <meta property="og:description" content="${description}">
  <meta property="og:image" content="${imageUrl}">
  <meta property="og:site_name" content="LidaCacau">
  <meta property="og:locale" content="pt_BR">
  
  <!-- Twitter -->
  <meta name="twitter:card" content="summary">
  <meta name="twitter:title" content="${title}">
  <meta name="twitter:description" content="${description}">
  <meta name="twitter:image" content="${imageUrl}">
  
  <!-- Theme -->
  <meta name="theme-color" content="#F15A29">
  
  <style>
    body { 
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      background: linear-gradient(135deg, #F15A29 0%, #d14d22 100%);
      min-height: 100vh;
      margin: 0;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .card {
      background: white;
      border-radius: 16px;
      padding: 32px;
      max-width: 400px;
      margin: 20px;
      text-align: center;
      box-shadow: 0 10px 40px rgba(0,0,0,0.2);
    }
    .logo { width: 64px; height: 64px; margin-bottom: 16px; }
    h1 { color: #333; margin: 0 0 8px; font-size: 24px; }
    p { color: #666; margin: 0 0 24px; line-height: 1.5; }
    .offer { color: #7ED957; font-size: 28px; font-weight: 700; margin: 16px 0; }
    .location { color: #888; font-size: 14px; margin-bottom: 24px; }
    .btn {
      display: inline-block;
      background: #F15A29;
      color: white;
      text-decoration: none;
      padding: 16px 32px;
      border-radius: 12px;
      font-weight: 600;
      font-size: 16px;
      transition: transform 0.2s;
    }
    .btn:hover { transform: scale(1.05); }
    .brand { color: #F15A29; font-weight: 700; }
  </style>
  
  <script>
    // Auto-redirect to app after 2 seconds
    setTimeout(function() {
      window.location.href = '${baseUrl}/demand/${id}';
    }, 2000);
  </script>
</head>
<body>
  <div class="card">
    <img src="${imageUrl}" alt="LidaCacau" class="logo">
    <h1>${title.replace(' - LidaCacau', '')}</h1>
    ${offer ? `<div class="offer">${offer}</div>` : ''}
    ${location ? `<div class="location">${location}</div>` : ''}
    <p>${description}</p>
    <a href="${baseUrl}/demand/${id}" class="btn">Abrir no <span class="brand">LidaCacau</span></a>
  </div>
</body>
</html>`;
    
    res.setHeader('Content-Type', 'text/html');
    res.send(shareHtml);
  } catch (error) {
    console.error('[Share] Error:', error);
    res.redirect('/');
  }
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
