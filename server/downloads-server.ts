import express from 'express';
import path from 'path';
import fs from 'fs';

const app = express();
const PORT = 3001;

// Serve videos with download headers
app.use('/videos', express.static(path.join(__dirname, '../attached_assets/generated_videos'), {
  setHeaders: (res, filePath) => {
    if (filePath.endsWith('.mp4')) {
      res.setHeader('Content-Type', 'video/mp4');
    }
  }
}));

// Also serve the main intro video from assets
app.use('/assets/videos', express.static(path.join(__dirname, '../assets/videos')));

// Downloads page
app.get('/', (_req, res) => {
  res.sendFile(path.join(__dirname, 'public/downloads.html'));
});

// List all available videos as JSON
app.get('/api/videos', (_req, res) => {
  const videosDir = path.join(__dirname, '../attached_assets/generated_videos');
  try {
    const files = fs.readdirSync(videosDir).filter(f => f.endsWith('.mp4'));
    const videos = files.map(f => ({
      name: f,
      url: `/videos/${f}`,
      downloadUrl: `/videos/${f}?download=true`
    }));
    res.json({ videos });
  } catch (error) {
    res.json({ videos: [], error: 'Could not list videos' });
  }
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Downloads server running at http://localhost:${PORT}`);
  console.log(`Access videos at http://localhost:${PORT}/videos/`);
});
