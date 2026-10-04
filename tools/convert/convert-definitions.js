#!/usr/bin/env node
/**
 * Converts the TE's XML definitions to JSON (see DefinitionConversion for what is converted).
 *
 *   node tools/convert/convert-definitions.js [--delete]
 *
 * Writes each <name>.json next to <name>.xml; with --delete the XML is removed afterwards.
 * Run it on an installation upgraded from the PHP version to bring over its saved
 * connections (connectionStore/connStore.xml) and any XML definitions added locally.
 */
import { Config } from '../../server/core/Config.js';
import { Messages } from '../../server/core/Messages.js';
import { DefinitionConversion } from './DefinitionConversion.js';

const remove = process.argv.includes('--delete');
const conversion = new DefinitionConversion({ config: Config.load({ env: {} }), messages: Messages.for('en_US') }).run({ remove });
console.log(conversion.report() + (remove ? '\n(XML removed)' : ''));
