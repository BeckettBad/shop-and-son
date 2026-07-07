#!/usr/bin/env node
import { createServer } from 'node:http';
import { randomBytes } from 'node:crypto';
import { createInterface } from 'node:readline/promises';
import { stdin as input, stdout as output } from 'node:process';

const SPOTIFY_AUTHORIZE_URL = 'https://accounts.spotify.com/authorize';
const SPOTIFY_TOKEN_URL = 'https://accounts.spotify.com/api/token';
const REDIRECT_URI = 'http://127.0.0.1:8888/callback';
const SCOPE = 'user-read-playback-state';

const rl = createInterface({ input, output });

try {
  const clientId = await readRequiredValue('SPOTIFY_CLIENT_ID', 'Spotify client ID');
  const clientSecret = await readRequiredValue('SPOTIFY_CLIENT_SECRET', 'Spotify client secret');
  const state = randomBytes(16).toString('hex');

  const authorizeUrl = new URL(SPOTIFY_AUTHORIZE_URL);
  authorizeUrl.search = new URLSearchParams({
    response_type: 'code',
    client_id: clientId,
    scope: SCOPE,
    redirect_uri: REDIRECT_URI,
    state,
  }).toString();

  const code = await waitForCallback(state, authorizeUrl);
  const refreshToken = await exchangeCodeForRefreshToken({ code, clientId, clientSecret });

  console.log('\nRefresh token received.');
  console.log('Set it as a Cloudflare Worker secret:');
  console.log('\n  wrangler secret put SPOTIFY_REFRESH_TOKEN\n');
  console.log(refreshToken);
} finally {
  rl.close();
}

async function readRequiredValue(envName, promptLabel) {
  const existing = process.env[envName];
  if (existing) {
    return existing;
  }

  const value = (await rl.question(`${promptLabel}: `)).trim();
  if (!value) {
    throw new Error(`${envName} is required.`);
  }

  return value;
}

function waitForCallback(expectedState, authorizeUrl) {
  return new Promise((resolve, reject) => {
    const server = createServer((request, response) => {
      const requestUrl = new URL(request.url || '/', REDIRECT_URI);

      if (requestUrl.pathname !== '/callback') {
        response.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
        response.end('Not found.');
        return;
      }

      const error = requestUrl.searchParams.get('error');
      const code = requestUrl.searchParams.get('code');
      const state = requestUrl.searchParams.get('state');

      if (error) {
        response.writeHead(400, { 'Content-Type': 'text/plain; charset=utf-8' });
        response.end('Spotify returned an authorization error. You may close this tab.');
        server.close();
        reject(new Error(`Spotify authorization error: ${error}`));
        return;
      }

      if (!code || state !== expectedState) {
        response.writeHead(400, { 'Content-Type': 'text/plain; charset=utf-8' });
        response.end('Invalid authorization response. You may close this tab.');
        server.close();
        reject(new Error('Invalid authorization response.'));
        return;
      }

      response.writeHead(200, { 'Content-Type': 'text/plain; charset=utf-8' });
      response.end('Spotify authorization complete. You may close this tab.');
      server.close();
      resolve(code);
    });

    server.on('error', reject);
    server.listen(8888, '127.0.0.1', () => {
      console.log('Open this URL while logged into the store Spotify account:\n');
      console.log(authorizeUrl.toString());
      console.log('\nWaiting for Spotify to redirect to http://127.0.0.1:8888/callback ...');
    });
  });
}

async function exchangeCodeForRefreshToken({ code, clientId, clientSecret }) {
  const response = await fetch(SPOTIFY_TOKEN_URL, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString('base64')}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      redirect_uri: REDIRECT_URI,
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Token exchange failed: ${response.status} ${text}`);
  }

  const data = await response.json();
  if (!data.refresh_token) {
    throw new Error('Spotify did not return a refresh token.');
  }

  return data.refresh_token;
}
