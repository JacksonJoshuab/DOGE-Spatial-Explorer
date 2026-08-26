import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { createPrivateKey, sign } from 'node:crypto';
import { isIP } from 'node:net';
import { extname, join, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = fileURLToPath(new URL('.', import.meta.url));
await loadLocalEnv();
const webRoot = join(here, '../Web');
const resourceRoot = join(here, '../Sources/EndlessEquatorCore/Resources');
const port = Number(process.env.PORT || 8787);
const allowedOrigins = new Set(
  (process.env.ALLOWED_ORIGINS || `http://localhost:${port}`)
    .split(',')
    .map(value => value.trim())
    .filter(Boolean)
);
const mapOrigins = new Set(
  (process.env.MAPKIT_ALLOWED_ORIGINS || '')
    .split(',')
    .map(value => value.trim())
    .filter(Boolean)
);
const trustProxy = process.env.TRUST_PROXY === 'true';
const openAIResponsesURL = process.env.OPENAI_RESPONSES_URL || 'https://api.openai.com/v1/responses';
const buckets = new Map();

const areas = (
  await Promise.all(
    ['areas-01.json', 'areas-02.json', 'areas-03.json'].map(async fileName =>
      JSON.parse(await readFile(join(resourceRoot, fileName), 'utf8'))
    )
  )
).flat();
const route = JSON.parse(await readFile(join(resourceRoot, 'route-plan.json'), 'utf8'));
const areasByID = new Map(areas.map(area => [area.id, area]));

const guideSchema = {
  type: 'object',
  additionalProperties: false,
  properties: {
    spokenLine: { type: 'string', maxLength: 260 },
    shortCard: { type: 'string', maxLength: 420 },
    facts: { type: 'array', items: { type: 'string' }, maxItems: 6 },
    warnings: { type: 'array', items: { type: 'string' }, maxItems: 6 },
    questionsToVerify: { type: 'array', items: { type: 'string' }, maxItems: 6 },
    sourceLabels: { type: 'array', items: { type: 'string' }, maxItems: 8 }
  },
  required: ['spokenLine', 'shortCard', 'facts', 'warnings', 'questionsToVerify', 'sourceLabels']
};

const server = createServer(async (req, res) => {
  try {
    applyHeaders(req, res);
    if (req.headers.origin && !allowedOrigins.has(req.headers.origin)) {
      return json(res, 403, { error: 'Origin not allowed' });
    }
    if (req.method === 'OPTIONS') {
      res.writeHead(204);
      return res.end();
    }

    const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
    if (url.pathname === '/health' && req.method === 'GET') {
      return json(res, 200, {
        ok: true,
        openAIConfigured: Boolean(process.env.OPENAI_API_KEY),
        mapKitConfigured: mapsConfigured()
      });
    }
    if (url.pathname === '/api/areas' && req.method === 'GET') return json(res, 200, areas);
    if (url.pathname === '/api/route' && req.method === 'GET') return json(res, 200, route);
    if (url.pathname === '/api/mapkit-token' && req.method === 'GET') {
      return await mapKitToken(req, res);
    }
    if (url.pathname === '/api/guide' && req.method === 'POST') {
      return await guide(req, res);
    }
    if (url.pathname.startsWith('/api/')) return json(res, 404, { error: 'API route not found' });
    if (req.method !== 'GET' && req.method !== 'HEAD') return json(res, 405, { error: 'Method not allowed' });
    return await staticFile(url.pathname, res, req.method === 'HEAD');
  } catch (error) {
    console.error({ event: 'request_error', name: error?.name || 'Error', statusCode: error?.statusCode || 500 });
    if (res.writableEnded || res.destroyed) return;
    return json(res, error?.statusCode || 500, {
      error: error?.statusCode ? 'Request rejected' : 'Server error'
    });
  }
});
server.listen(port, () => console.log(`Endless Equator gateway listening on http://localhost:${port}`));

function applyHeaders(req, res) {
  const origin = req.headers.origin;
  if (origin && allowedOrigins.has(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Vary', 'Origin');
  }
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader(
    'Content-Security-Policy',
    "default-src 'self'; script-src 'self' https://cdn.apple-mapkit.com; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob: https:; connect-src 'self' https://*.apple-mapkit.com https://*.maps.apple.com; worker-src 'self' blob:; child-src 'self' blob:; frame-ancestors 'self'; base-uri 'self'"
  );
  res.setHeader('Referrer-Policy', 'no-referrer');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  if (String(req.headers['x-forwarded-proto'] || '').split(',')[0].trim() === 'https') {
    res.setHeader('Strict-Transport-Security', 'max-age=31536000');
  }
}

async function guide(req, res) {
  requireJSON(req);
  rateLimit(req, 'guide', 30, 60_000);
  const body = await readJSON(req, 24_000);
  const area = areasByID.get(String(body.areaID || ''));
  if (!area) return json(res, 400, { error: 'Unknown area' });

  const safeInput = {
    areaID: area.id,
    areaName: area.name,
    verificationState: area.verificationState,
    canonicalSummary: area.summary,
    safetyNotes: area.safetyNotes,
    seasonalWeather: area.seasonalWeather,
    highwayRefs: area.highwayRefs,
    // A client-supplied maneuver is never trusted as verified route truth.
    currentManeuver: null,
    weatherSummary: clean(body.weatherSummary, 240),
    coarseContext: clean(body.coarseContext, 240),
    locale: clean(body.locale, 20) || 'en-US',
    question: clean(body.question, 800)
  };

  if (!process.env.OPENAI_API_KEY) return json(res, 200, fallbackGuide(area));

  try {
    const response = await fetch(openAIResponsesURL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: process.env.OPENAI_MODEL || 'gpt-5.6-sol',
        store: false,
        max_output_tokens: 800,
        input: [
          {
            role: 'developer',
            content: [
              {
                type: 'input_text',
                text: 'You are GONZO//0°, an original, warm Ecuador expedition guide. Be concise, culturally respectful and operationally conservative. Never invent trail access, closures, weather, medical facts, Rotary projects or permissions. Warnings precede colorful narration. You cannot alter the route and must tell riders to stop safely before interacting.'
              }
            ]
          },
          { role: 'user', content: [{ type: 'input_text', text: JSON.stringify(safeInput) }] }
        ],
        text: {
          format: {
            type: 'json_schema',
            name: 'expedition_guide',
            strict: true,
            schema: guideSchema
          }
        }
      }),
      signal: AbortSignal.timeout(18_000)
    });
    if (!response.ok) {
      console.error({ event: 'openai_error', status: response.status });
      return json(res, 200, fallbackGuide(area));
    }
    const data = await response.json();
    const outputText = extractOutputText(data);
    if (!outputText) return json(res, 200, fallbackGuide(area));
    const candidate = JSON.parse(outputText);
    return json(res, 200, groundedGuide(candidate, area));
  } catch (error) {
    console.error({ event: 'openai_unavailable', name: error?.name || 'Error' });
    return json(res, 200, fallbackGuide(area));
  }
}

function groundedGuide(candidate, area) {
  const fallback = fallbackGuide(area);
  const questions = Array.isArray(candidate?.questionsToVerify)
    ? candidate.questionsToVerify.map(value => clean(value, 240)).filter(Boolean).slice(0, 6)
    : fallback.questionsToVerify;
  return {
    spokenLine: clean(candidate?.spokenLine, 260) || fallback.spokenLine,
    shortCard: clean(candidate?.shortCard, 420) || fallback.shortCard,
    // Factual and safety fields are populated only from canonical records.
    facts: canonicalFacts(area),
    warnings: area.safetyNotes.slice(0, 6),
    questionsToVerify: questions.length ? questions : fallback.questionsToVerify,
    sourceLabels: ['Bundled expedition catalog', 'Local verification required']
  };
}

function canonicalFacts(area) {
  return [
    `Verification: ${area.verificationState}. ${area.verificationNote}`,
    `Highway references: ${area.highwayRefs.join(', ') || 'local verified route'}`,
    `September planning: ${area.seasonalWeather.september}`,
    `October planning: ${area.seasonalWeather.october}`
  ];
}

function fallbackGuide(area) {
  return {
    spokenLine: `Stop safely before reviewing ${area.name}. ${area.safetyNotes[0] || 'Verify local conditions.'}`,
    shortCard: area.summary,
    facts: canonicalFacts(area),
    warnings: area.safetyNotes.slice(0, 6),
    questionsToVerify: [
      'Is access open now?',
      'Has weather been checked today?',
      'Is the local host or guide confirmed?'
    ],
    sourceLabels: ['Bundled expedition catalog', 'Local verification required']
  };
}

async function mapKitToken(req, res) {
  rateLimit(req, 'mapkit', 60, 60_000);
  if (!mapsConfigured()) return json(res, 503, { error: 'MapKit JS token service is not configured' });
  const protocol = String(req.headers['x-forwarded-proto'] || 'http').split(',')[0].trim();
  const origin = req.headers.origin || `${protocol}://${req.headers.host}`;
  if (!mapOrigins.has(origin)) return json(res, 403, { error: 'Origin not allowed' });
  const now = Math.floor(Date.now() / 1000);
  const exp = now + 45 * 60;
  const header = { alg: 'ES256', kid: process.env.APPLE_MAPS_KEY_ID, typ: 'JWT' };
  const payload = {
    iss: process.env.APPLE_MAPS_TEAM_ID,
    iat: now,
    exp,
    scope: 'mapkit_js',
    origin
  };
  const unsigned = `${base64url(JSON.stringify(header))}.${base64url(JSON.stringify(payload))}`;
  const key = createPrivateKey(process.env.APPLE_MAPS_PRIVATE_KEY_PEM.replace(/\\n/g, '\n'));
  const signature = sign('sha256', Buffer.from(unsigned), { key, dsaEncoding: 'ieee-p1363' });
  return json(res, 200, { token: `${unsigned}.${signature.toString('base64url')}`, expiresAt: exp });
}

async function staticFile(pathname, res, headOnly = false) {
  const requested = pathname === '/' ? '/index.html' : pathname;
  const safe = normalize(requested).replace(/^(\.\.[/\\])+/, '');
  const path = join(webRoot, safe);
  if (!path.startsWith(webRoot)) return json(res, 403, { error: 'Forbidden' });
  try {
    const data = await readFile(path);
    res.writeHead(200, {
      'Content-Type': mime(path),
      'Cache-Control': extname(path) === '.html' ? 'no-cache' : 'public, max-age=300'
    });
    return res.end(headOnly ? undefined : data);
  } catch {
    const data = await readFile(join(webRoot, 'index.html'));
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-cache' });
    return res.end(headOnly ? undefined : data);
  }
}

function mapsConfigured() {
  return Boolean(
    process.env.APPLE_MAPS_TEAM_ID &&
      process.env.APPLE_MAPS_KEY_ID &&
      process.env.APPLE_MAPS_PRIVATE_KEY_PEM &&
      mapOrigins.size
  );
}

function extractOutputText(data) {
  if (typeof data.output_text === 'string') return data.output_text;
  for (const item of data.output || []) {
    for (const content of item.content || []) {
      if (content.type === 'output_text' && typeof content.text === 'string') return content.text;
    }
  }
  return null;
}

function requireJSON(req) {
  const mediaType = String(req.headers['content-type'] || '')
    .split(';')[0]
    .trim()
    .toLowerCase();
  if (mediaType !== 'application/json') {
    const error = new Error('Content type must be application/json');
    error.statusCode = 415;
    throw error;
  }
}

function clean(value, maximum) {
  return typeof value === 'string'
    ? value.replace(/[\u0000-\u001f]/g, ' ').trim().slice(0, maximum)
    : null;
}

function base64url(value) {
  return Buffer.from(value).toString('base64url');
}

function json(res, status, value) {
  if (res.writableEnded || res.destroyed) return;
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store'
  });
  res.end(JSON.stringify(value));
}

async function readJSON(req, limit) {
  let size = 0;
  const chunks = [];
  let tooLarge = false;
  for await (const chunk of req) {
    size += chunk.length;
    if (size > limit) {
      tooLarge = true;
      continue;
    }
    chunks.push(chunk);
  }
  if (tooLarge) {
    const error = new Error('Body too large');
    error.statusCode = 413;
    throw error;
  }
  try {
    return JSON.parse(Buffer.concat(chunks).toString('utf8') || '{}');
  } catch {
    const error = new Error('Invalid JSON');
    error.statusCode = 400;
    throw error;
  }
}

function clientAddress(req) {
  if (trustProxy) {
    const forwarded = String(req.headers['x-forwarded-for'] || '')
      .split(',')[0]
      .trim();
    if (isIP(forwarded)) return forwarded;
  }
  return req.socket.remoteAddress || 'unknown';
}

function rateLimit(req, namespace, maximum, windowMs) {
  const key = `${namespace}:${clientAddress(req)}`;
  const now = Date.now();
  const bucket = buckets.get(key) || { start: now, count: 0 };
  if (now - bucket.start > windowMs) {
    bucket.start = now;
    bucket.count = 0;
  }
  bucket.count += 1;
  buckets.set(key, bucket);
  if (bucket.count > maximum) {
    const error = new Error('Rate limited');
    error.statusCode = 429;
    throw error;
  }
}

function mime(path) {
  return (
    {
      '.html': 'text/html; charset=utf-8',
      '.js': 'text/javascript; charset=utf-8',
      '.css': 'text/css; charset=utf-8',
      '.json': 'application/json; charset=utf-8',
      '.webmanifest': 'application/manifest+json',
      '.svg': 'image/svg+xml',
      '.png': 'image/png'
    }[extname(path)] || 'application/octet-stream'
  );
}

async function loadLocalEnv() {
  try {
    const text = await readFile(join(here, '.env'), 'utf8');
    for (const raw of text.split(/\r?\n/)) {
      const line = raw.trim();
      if (!line || line.startsWith('#')) continue;
      const index = line.indexOf('=');
      if (index < 1) continue;
      const key = line.slice(0, index).trim();
      let value = line.slice(index + 1).trim();
      if (
        (value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))
      ) {
        value = value.slice(1, -1);
      }
      if (process.env[key] === undefined) process.env[key] = value;
    }
  } catch (error) {
    if (error.code !== 'ENOENT') throw error;
  }
}
