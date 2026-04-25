import express from 'express';
import { extractStyles } from './extractor.js';
import { buildReport } from './report.js';

const app = express();
app.use(express.urlencoded({ extended: false }));

app.get('/', (_req, res) => {
  res.type('html').send(`<!doctype html><html lang="es"><head><meta charset="utf-8" />
<title>Style extractor</title>
<meta name="viewport" content="width=device-width,initial-scale=1" />
<style>
  body{margin:0;font:15px/1.5 system-ui,sans-serif;background:#0b0d10;color:#e7eaf0;display:grid;place-items:center;min-height:100vh}
  form{background:#11151b;border:1px solid #1f242c;border-radius:12px;padding:28px;width:min(540px,92vw)}
  h1{margin:0 0 6px;font-size:18px}
  p{color:#7d8aa1;margin:0 0 18px}
  input{width:100%;padding:10px 12px;border-radius:8px;border:1px solid #2a313b;background:#0b0d10;color:inherit;font:inherit}
  button{margin-top:14px;width:100%;padding:11px;border:0;border-radius:8px;background:#3b82f6;color:white;font:600 14px/1 system-ui;cursor:pointer}
  button:hover{background:#2563eb}
</style></head><body>
<form method="post" action="/extract">
  <h1>Extractor de estilos</h1>
  <p>Pega cualquier URL — abrimos la web con un Chromium real para esquivar bloqueos anti-bot.</p>
  <input name="url" type="url" required placeholder="https://www.insta360.com/es/" value="https://www.insta360.com/es/" />
  <button type="submit">Extraer</button>
</form></body></html>`);
});

app.post('/extract', async (req, res) => {
  const url = req.body.url;
  if (!url) return res.status(400).send('Falta url');
  try {
    const data = await extractStyles(url);
    res.type('html').send(buildReport(data));
  } catch (err) {
    res.status(500).type('text').send(`Error extrayendo: ${err.stack || err.message}`);
  }
});

const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`Style extractor en http://localhost:${port}`));
