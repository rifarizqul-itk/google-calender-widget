const { OAuth2Client } = require('google-auth-library');
const http = require('http');
const path = require('path');
const { existsSync, readFileSync, writeFileSync, readdirSync, unlinkSync } = require('fs');
const { app, shell } = require('electron');

const SCOPES = [
    'https://www.googleapis.com/auth/calendar.readonly',
    'https://www.googleapis.com/auth/calendar.events'
];

class AuthService {
    constructor() {
        this.oauth2Client = null;
        this.credentialsPath = null;
        this.tokenPath = null;
        this.activeServer = null;
        this.initPaths();
        this.initOAuthClient();
    }

    initPaths() {
        const appData = process.env.APPDATA;
        const localAppData = process.env.LOCALAPPDATA;

        // Candidate directories to look for client_secret*.json
        const candidateDirs = [
            path.resolve(__dirname, '..', '..'),
            process.resourcesPath,
            process.cwd(),
            localAppData ? path.join(localAppData, 'Programs', 'google-calender-widget', 'resources') : null,
            localAppData ? path.join(localAppData, 'Programs', 'google-calender-widget') : null,
            appData ? path.join(appData, 'google-calender-widget') : null
        ].filter(Boolean);

        for (const dir of candidateDirs) {
            try {
                if (existsSync(dir)) {
                    const files = readdirSync(dir);
                    const secretFile = files.find(f => f.startsWith('client_secret') && f.endsWith('.json'));
                    if (secretFile) {
                        this.credentialsPath = path.join(dir, secretFile);
                        break;
                    }
                }
            } catch {}
        }

        // Candidate paths for google_tokens.json (including installed widget AppData)
        const tokenCandidates = [];
        try {
            const userData = app.getPath('userData');
            if (userData) tokenCandidates.push(path.join(userData, 'google_tokens.json'));
        } catch {}

        if (appData) {
            tokenCandidates.push(path.join(appData, 'google-calender-widget', 'google_tokens.json'));
            tokenCandidates.push(path.join(appData, 'p32929.google-calender-widget', 'google_tokens.json'));
        }
        tokenCandidates.push(path.join(process.cwd(), 'google_tokens.json'));

        // Pick existing token file or default to first candidate
        const existingToken = tokenCandidates.find(p => existsSync(p));
        this.tokenPath = existingToken || tokenCandidates[0] || path.join(process.cwd(), 'google_tokens.json');
    }

    loadCredentials() {
        if (!this.credentialsPath || !existsSync(this.credentialsPath)) {
            throw new Error('File client_secret.json tidak ditemukan di root folder project.');
        }

        const raw = readFileSync(this.credentialsPath, 'utf8');
        const parsed = JSON.parse(raw);
        const creds = parsed.installed || parsed.web;

        if (!creds || !creds.client_id || !creds.client_secret) {
            throw new Error('Format client_secret.json tidak valid.');
        }

        return creds;
    }

    initOAuthClient() {
        try {
            const creds = this.loadCredentials();
            this.oauth2Client = new OAuth2Client(
                creds.client_id,
                creds.client_secret,
                'http://127.0.0.1:54321'
            );

            // Auto-save refreshed tokens
            this.oauth2Client.on('tokens', (tokens) => {
                this.saveTokens(tokens);
            });

            // Load saved tokens if exist
            if (existsSync(this.tokenPath)) {
                try {
                    const savedTokens = JSON.parse(readFileSync(this.tokenPath, 'utf8'));
                    this.oauth2Client.setCredentials(savedTokens);
                } catch {
                    // Ignore corrupted token file
                }
            }
        } catch (error) {
            console.warn('[AuthService] Init warning:', error.message);
        }
    }

    saveTokens(newTokens) {
        try {
            let existing = {};
            if (existsSync(this.tokenPath)) {
                try {
                    existing = JSON.parse(readFileSync(this.tokenPath, 'utf8'));
                } catch {
                    existing = {};
                }
            }

            const merged = { ...existing, ...newTokens };
            writeFileSync(this.tokenPath, JSON.stringify(merged, null, 2), 'utf8');
            const { logger } = require('../utils/logger');
            logger.info('AuthService', 'Google OAuth tokens saved successfully to disk.');
        } catch (error) {
            const { logger } = require('../utils/logger');
            logger.error('AuthService', 'Error saving tokens to disk:', error);
        }
    }

    isAuthenticated() {
        if (!this.oauth2Client) return false;
        const credentials = this.oauth2Client.credentials;
        return Boolean(credentials && (credentials.access_token || credentials.refresh_token));
    }

    async getAuthenticatedClient() {
        if (!this.oauth2Client) {
            this.initOAuthClient();
        }

        if (!this.isAuthenticated()) {
            throw new Error('Belum terotentikasi. Silakan login ke Google Calendar terlebih dahulu.');
        }

        return this.oauth2Client;
    }

    loginWithBrowser() {
        return new Promise((resolve, reject) => {
            if (!this.oauth2Client) {
                try {
                    this.initOAuthClient();
                } catch (e) {
                    return reject(e);
                }
            }

            if (this.activeServer) {
                try { this.activeServer.close(); } catch {}
                this.activeServer = null;
            }

            this.activeServer = http.createServer();
            let authTimeout = null;

            const cleanupServer = () => {
                if (authTimeout) {
                    clearTimeout(authTimeout);
                    authTimeout = null;
                }
                if (this.activeServer) {
                    try { this.activeServer.close(); } catch {}
                    this.activeServer = null;
                }
            };

            // 5-minute timeout to avoid lingering background TCP sockets
            authTimeout = setTimeout(() => {
                cleanupServer();
                reject(new Error('Waktu otorisasi Google login habis (batas waktu 5 menit).'));
            }, 5 * 60 * 1000);

            this.activeServer.on('error', (err) => {
                cleanupServer();
                reject(err);
            });

            // Listen on port 0 to allow OS to allocate any free ephemeral port
            this.activeServer.listen(0, '127.0.0.1', () => {
                const address = this.activeServer.address();
                const serverPort = address.port;
                const redirectUri = `http://127.0.0.1:${serverPort}`;
                this.oauth2Client.redirectUri = redirectUri;

                const authUrl = this.oauth2Client.generateAuthUrl({
                    access_type: 'offline',
                    scope: SCOPES,
                    prompt: 'consent',
                    redirect_uri: redirectUri
                });

                this.activeServer.on('request', async (req, res) => {
                    try {
                        const reqUrl = new URL(req.url, redirectUri);
                        const code = reqUrl.searchParams.get('code');
                        const error = reqUrl.searchParams.get('error');

                        if (error) {
                            res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
                            res.end(`
                                <div style="font-family: sans-serif; text-align: center; padding: 50px; background: #12141d; color: #ff5e5e;">
                                    <h2>❌ Login Dibatalkan atau Gagal</h2>
                                    <p>${error}</p>
                                    <p>Silakan tutup tab ini dan coba lagi dari widget.</p>
                                </div>
                            `);
                            cleanupServer();
                            return reject(new Error(`OAuth Error: ${error}`));
                        }

                        if (code) {
                            const { tokens } = await this.oauth2Client.getToken({
                                code,
                                redirect_uri: redirectUri
                            });

                            this.oauth2Client.setCredentials(tokens);
                            this.saveTokens(tokens);

                            res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
                            res.end(`
                                <div style="font-family: sans-serif; text-align: center; padding: 50px; background: #0f172a; color: #f8fafc;">
                                    <h1 style="color: #38bdf8;">✨ Login Berhasil!</h1>
                                    <p style="font-size: 16px; color: #94a3b8;">Google Calendar kamu sekarang sudah terhubung dengan Desktop Widget.</p>
                                    <p style="font-size: 14px; margin-top: 20px;">Silakan tutup tab browser ini dan kembali ke desktop kamu.</p>
                                </div>
                            `);

                            setTimeout(() => {
                                cleanupServer();
                            }, 1000);

                            console.log('[AuthService] OAuth login successful on port:', serverPort);
                            resolve(tokens);
                        }
                    } catch (err) {
                        res.writeHead(500, { 'Content-Type': 'text/plain' });
                        res.end('Authentication failed: ' + err.message);
                        cleanupServer();
                        reject(err);
                    }
                });

                console.log(`[AuthService] Listening on ${redirectUri} for OAuth callback...`);
                shell.openExternal(authUrl);
            });
        });
    }

    logout() {
        if (this.oauth2Client) {
            this.oauth2Client.setCredentials({});
        }

        if (this.tokenPath && existsSync(this.tokenPath)) {
            try {
                unlinkSync(this.tokenPath);
                console.log('[AuthService] Tokens removed on logout.');
            } catch (err) {
                console.warn('[AuthService] Error deleting token file:', err.message);
            }
        }
        return true;
    }
}

const authService = new AuthService();
module.exports = { authService, AuthService };
