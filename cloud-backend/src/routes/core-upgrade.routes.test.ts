import request from 'supertest';
import { afterEach, describe, expect, it } from 'vitest';
import { app } from '../server.js';
import { issueSession } from '../providers/session.js';
import { clearJetsonReplayCache, createJetsonRegistrationSignature, createJetsonTelemetrySignature } from '../providers/nvidiaEdge.js';

const originalFetch = globalThis.fetch;
const originalEnv = { ...process.env };

function restoreEnvironment() {
  for (const key of Object.keys(process.env)) if (!(key in originalEnv)) delete process.env[key];
  Object.assign(process.env, originalEnv);
  globalThis.fetch = originalFetch;
  clearJetsonReplayCache();
}

function bearer(provider: 'password' | 'apple' | 'microsoft' | 'meta' = 'password') {
  return `Bearer ${issueSession({ userId: `${provider}-user`, displayName: 'Route Tester', provider })}`;
}

afterEach(restoreEnvironment);

describe('core provider upgrade routes', () => {
  it('exposes the authenticated provider policy and cached model discovery endpoints', async () => {
    process.env.OPENAI_API_KEY = 'test-key';
    process.env.OPENAI_MODEL = 'gpt-test';
    process.env.OPENAI_ALLOWED_MODELS = 'gpt-test,gpt-safe';
    globalThis.fetch = async () => new Response(JSON.stringify({ data: [{ id: 'gpt-test' }, { id: 'gpt-safe' }] }));

    const policy = await request(app).get('/api/ai/providers/openai/policy').set('Authorization', bearer()).expect(200);
    expect(policy.body.policy.allowedModels).toEqual(['gpt-test', 'gpt-safe']);
    const models = await request(app).get('/api/ai/providers/openai/models').set('Authorization', bearer()).expect(200);
    expect(models.body).toMatchObject({ provider: 'openai', models: ['gpt-safe', 'gpt-test'] });
  });

  it('streams validated upstream AI events only for an authenticated configured provider', async () => {
    process.env.OPENAI_API_KEY = 'test-key';
    process.env.OPENAI_MODEL = 'gpt-test';
    globalThis.fetch = async () => new Response('data: {"delta":"hello"}\n\ndata: [DONE]\n\n', { status: 200 });
    const response = await request(app)
      .post('/api/ai/generate/stream')
      .set('Authorization', bearer())
      .send({ provider: 'openai', input: 'hello' })
      .expect('Content-Type', /text\/event-stream/)
      .expect(200);
    expect(response.text).toContain('data: {"delta":"hello"}');
  });

  it('issues a nonce and rejects an Apple sign-in that did not use the issued nonce', async () => {
    process.env.APPLE_CLIENT_ID = 'apple-client';
    const nonce = await request(app).post('/api/auth/nonce').send({ provider: 'apple' }).expect(200);
    expect(nonce.body.nonce).toHaveLength(43);
    await request(app).post('/api/auth/apple').send({ identityToken: 'not-used', nonce: 'wrong-nonce' }).expect(401);
  });

  it('reports Microsoft Graph readiness without returning a delegated access token', async () => {
    globalThis.fetch = async () => new Response(JSON.stringify({ id: 'm-1', displayName: 'Morgan', mail: 'morgan@example.com' }));
    const response = await request(app).post('/api/auth/microsoft/graph-readiness').send({ accessToken: 'delegated-secret' }).expect(200);
    expect(response.body).toMatchObject({ ready: true, profile: { id: 'm-1' } });
    expect(JSON.stringify(response.body)).not.toContain('delegated-secret');
  });

  it('stores Meta Quest capability metadata only for a verified Meta session', async () => {
    const response = await request(app)
      .post('/api/devices/register')
      .set('Authorization', bearer('meta'))
      .send({ name: 'Quest 3', platform: 'meta_quest', deviceId: 'quest-1', capabilities: ['passthrough', 'hand-tracking', 'passthrough'], sessionAttestation: { sessionId: 'session-1', runtimeVersion: '71', ignored: 'not-retained' } })
      .expect(201);
    expect(response.body.capabilities).toEqual(['passthrough', 'hand-tracking']);
    expect(response.body.sessionAttestation).toEqual({ sessionId: 'session-1', runtimeVersion: '71' });
  });

  it('accepts one signed Jetson telemetry event and rejects a replay', async () => {
    const now = Date.now();
    const secret = 'edge-test-secret';
    process.env.NVIDIA_JETSON_SHARED_SECRET = secret;
    const token = bearer();
    const registrationSignature = createJetsonRegistrationSignature('jetson-1', now, secret);
    const device = await request(app).post('/api/devices/register').set('Authorization', token).send({ name: 'Jetson Orin', platform: 'nvidia_jetson', deviceId: 'jetson-1', timestamp: now, signature: registrationSignature }).expect(201);
    const payload = { gpuTempC: 60.1, fps: 59.9 };
    const envelope = { deviceId: 'jetson-1', timestamp: now, nonce: 'route-test-nonce', payload, signature: createJetsonTelemetrySignature('jetson-1', now, 'route-test-nonce', payload, secret) };
    await request(app).post(`/api/devices/${device.body.id}/telemetry/jetson`).set('Authorization', token).send(envelope).expect(202);
    await request(app).post(`/api/devices/${device.body.id}/telemetry/jetson`).set('Authorization', token).send(envelope).expect(401);
  });
});
