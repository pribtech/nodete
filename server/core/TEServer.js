import express from 'express';
import session from 'express-session';
import { randomBytes } from 'node:crypto';
import { AppFiles } from './AppFiles.js';
import { ActionRegistry } from './ActionRegistry.js';
import { ActionRouter } from './ActionRouter.js';
import { IndexPage } from '../pages/IndexPage.js';

/** Files under db2te/ that must never be served as static content. */
const PRIVATE_PATHS = [/\.php$/i, /^\/connectionStore\//i, /^\/jar\//i];

/**
 * The Technology Explorer web server. Serves the existing front end from db2te/
 * and answers the same URLs the PHP version did (index.php, action.php), so the
 * browser code runs unchanged.
 */
export class TEServer {
	#config;
	#app;
	#log;

	constructor(config, { log = console, sessionSecret = process.env.TE_SESSION_SECRET, sessionStore } = {}) {
		this.#config = config;
		this.#log = log;
		const files = new AppFiles(config.appRoot);
		const registry = new ActionRegistry(undefined, files.resolve('./actions'));
		const router = new ActionRouter({ config, registry, files, log });
		this.#app = this.#buildApp({ files, router, sessionSecret, sessionStore });
	}

	get app() { return this.#app; }

	#buildApp({ files, router, sessionSecret, sessionStore }) {
		const app = express();
		app.disable('x-powered-by');
		app.set('query parser', 'extended');
		app.use(express.urlencoded({ extended: true, limit: '10mb' }));
		app.use(this.#session(sessionSecret, sessionStore));

		const indexPage = new IndexPage({ router });
		const renderIndex = (req, res) => indexPage.handle(req, res).catch((error) => this.#fail(res, error));
		app.get(['/', '/index.php'], renderIndex);
		app.all('/action.php', (req, res) => router.handle(req, res));

		app.use((req, res, next) => (PRIVATE_PATHS.some((p) => p.test(req.path)) ? res.sendStatus(404) : next()));
		app.use(express.static(files.root, { index: false, dotfiles: 'ignore' }));
		return app;
	}

	#session(secret, store) {
		if (!secret) this.#log.warn('TE_SESSION_SECRET not set: using a random secret, sessions end when the server restarts');
		return session({
			name: 'TESESSION',
			secret: secret || randomBytes(32).toString('hex'),
			resave: false,
			saveUninitialized: false,
			store,
			cookie: { httpOnly: true, sameSite: 'lax', secure: this.#config.get('FORCE_SECURE_CONNECTION') === true },
		});
	}

	#fail(res, error) {
		this.#log.error(error.stack ?? error);
		if (!res.headersSent) res.status(500).type('text/plain').send('Internal error, see server log');
	}

	listen(port = 8080, host = '0.0.0.0') {
		return new Promise((resolve) => {
			const server = this.#app.listen(port, host, () => resolve(server));
		});
	}
}
