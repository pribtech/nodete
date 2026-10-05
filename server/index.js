// Copyright 2026 Jaroslav Peter Prib, Purveyor of Excellence. Licensed under the Apache License, Version 2.0 (see LICENSE).
import { Config } from './core/Config.js';
import { TEServer } from './core/TEServer.js';

const config = Config.load();
const port = Number(process.env.PORT ?? 8080);
const host = process.env.HOST ?? '0.0.0.0';

await new TEServer(config).listen(port, host);
console.log(`Technology Explorer ${config.versionString} listening on http://${host}:${port}/`);
