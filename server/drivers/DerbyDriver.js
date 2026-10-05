import { DrdaDriver } from './DrdaDriver.js';

/**
 * Apache Derby's network server over DRDA, in JavaScript. Derby's server accepts only its own
 * client, so this one introduces itself as Derby's (product id DNC10170). A blank port is 1527.
 */
export class DerbyDriver extends DrdaDriver {
	get id() { return 'Derby'; }
	get defaultPort() { return 1527; }
	get dialect() { return { productId: 'DNC10170', packageName: 'SYSLH000' }; }
}
