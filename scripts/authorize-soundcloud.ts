import { config } from 'dotenv';
config({ path: '.env.local', override: true });
import express from 'express';
import fetch from 'node-fetch';
import path from 'path';
import fs from 'fs';
import { spawn } from 'child_process';

const CLIENT_ID = process.env.SOUNDCLOUD_CLIENT_ID;
const CLIENT_SECRET = process.env.SOUNDCLOUD_CLIENT_SECRET;
const DEFAULT_REDIRECT_URI = 'http://localhost:3001/soundcloud/callback';
const REDIRECT_URI = process.env.SOUNDCLOUD_REDIRECT_URI ?? DEFAULT_REDIRECT_URI;
const PORT = Number(new URL(REDIRECT_URI).port || 3001);

if (!CLIENT_ID || !CLIENT_SECRET) {
  console.error('❌ SOUNDCLOUD_CLIENT_ID et SOUNDCLOUD_CLIENT_SECRET doivent être définis dans .env.local');
  process.exit(1);
}

function openBrowser(url: string) {
  const platform = process.platform;
  let command: string;
  let args: string[] = [];

  if (platform === 'darwin') {
    command = 'open';
    args = [url];
  } else if (platform === 'win32') {
    command = 'cmd';
    args = ['/c', 'start', '""', url];
  } else {
    command = 'xdg-open';
    args = [url];
  }

  const child = spawn(command, args, { stdio: 'ignore', detached: true });
  child.unref();
}

function updateEnvVar(key: string, value: string) {
  const envPath = path.join(process.cwd(), '.env.local');
  let content = '';
  try {
    content = fs.readFileSync(envPath, 'utf8');
  } catch {
    // ignore missing file; we'll create it
  }

  const lines = content.split(/\r?\n/).filter(line => line.length > 0);
  const newLine = `${key}=${value}`;
  let updated = false;
  const result = lines.map(line => {
    if (line.startsWith(`${key}=`)) {
      updated = true;
      return newLine;
    }
    return line;
  });
  if (!updated) {
    result.push(newLine);
  }
  fs.writeFileSync(envPath, result.join('\n') + '\n', 'utf8');
  console.log(`✅ ${key} mis à jour dans .env.local`);
  process.env[key] = value;
}

async function exchangeCode(code: string) {
  const params = new URLSearchParams({
    client_id: CLIENT_ID!,
    client_secret: CLIENT_SECRET!,
    grant_type: 'authorization_code',
    redirect_uri: REDIRECT_URI,
    code,
  });

  const response = await fetch('https://api.soundcloud.com/oauth2/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: params,
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`SoundCloud a renvoyé ${response.status}: ${text}`);
  }

  return response.json() as Promise<{
    access_token: string;
    refresh_token?: string;
    expires_in: number;
    scope?: string;
    token_type: string;
  }>;
}

function writeTokensJson(refreshToken: string) {
  const tokensPath = path.join(process.cwd(), 'src/lib/soundcloud/tokens.json');
  const dir = path.dirname(tokensPath);
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(tokensPath, JSON.stringify({ refresh_token: refreshToken }, null, 2), 'utf8');
  console.log('✅ src/lib/soundcloud/tokens.json mis à jour');
}

async function regenerateCache() {
  return new Promise<void>((resolve, reject) => {
    const cmd = spawn('node', ['scripts/debug-soundcloud.cjs'], {
      stdio: 'inherit',
      env: {
        ...process.env,
        DOTENV_CONFIG_PATH: '.env.local',
      },
    });

    cmd.on('exit', code => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`scripts/debug-soundcloud.cjs s'est terminé avec le code ${code}`));
      }
    });
  });
}

async function main() {
  const app = express();

  const authUrl = new URL('https://soundcloud.com/connect');
  authUrl.searchParams.set('client_id', CLIENT_ID!);
  authUrl.searchParams.set('response_type', 'code');
  authUrl.searchParams.set('scope', 'playback');
  authUrl.searchParams.set('redirect_uri', REDIRECT_URI);

  console.log('ℹ️  Serveur de callback SoundCloud en cours de démarrage...');
  const server = app.listen(PORT, () => {
    console.log(`↪️  En attente du callback sur ${REDIRECT_URI}`);
    console.log(`🔗 URL d'autorisation : ${authUrl.toString()}`);
    try {
      openBrowser(authUrl.toString());
      console.log('🌐 Ouverture de la page d’autorisation dans le navigateur...');
    } catch (error) {
      console.log('⚠️ Impossible d’ouvrir automatiquement le navigateur, ouvrez manuellement l’URL ci-dessus.');
    }
  });

  app.get('/soundcloud/callback', async (req, res) => {
    const { code, error, error_description: errorDescription } = req.query as Record<string, string | undefined>;

    if (error) {
      console.error('❌ Erreur renvoyée par SoundCloud:', error, errorDescription);
      res.status(400).send(`<h1>Erreur SoundCloud</h1><p>${errorDescription ?? error}</p>`);
      server.close();
      process.exit(1);
    }

    if (!code) {
      res.status(400).send('<h1>Code manquant</h1>');
      return;
    }

    try {
      const tokens = await exchangeCode(code);
      updateEnvVar('SOUNDCLOUD_ACCESS_TOKEN', tokens.access_token);
      if (tokens.refresh_token) {
        updateEnvVar('SOUNDCLOUD_REFRESH_TOKEN', tokens.refresh_token);
        writeTokensJson(tokens.refresh_token);
      }

      res.send('<h1>Autorisation réussie ✔️</h1><p>Vous pouvez fermer cet onglet.</p>');
      server.close();

      if (process.argv.includes('--refresh-data')) {
        console.log('\n🛠  Regénération du cache podcasts...');
        await regenerateCache();
      }

      console.log('\n✅ Flux d’autorisation terminé. Token rafraîchi et sauvegardé.');
      process.exit(0);
    } catch (err) {
      console.error('❌ Impossible d’échanger le code:', err);
      res.status(500).send(`<h1>Erreur</h1><p>${(err as Error).message}</p>`);
      server.close();
      process.exit(1);
    }
  });
}

main().catch(err => {
  console.error('❌ Erreur inattendue:', err);
  process.exit(1);
});
