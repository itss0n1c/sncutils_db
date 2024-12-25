export type Awaitable<T> = T | Promise<T>;

export class DBError extends Error {
	status: number;
	constructor(status: number, message: string) {
		super(message);
		this.status = status;
		this.name = 'DBError';
	}
}

interface DBConfigAuth {
	/** The host of the database */
	host?: string;
	/** The port of the database */
	port?: number;
	/** The name of the database */
	database?: string;
	/** The username of the database */
	user?: string;
	/** The password of the database */
	password: string | (() => Awaitable<string>);
}

export interface DBConfig {
	/** The authentication details for the database */
	auth: DBConfigAuth;
	/** The maximum number of connections to the database */
	max?: number;
	/** The initial script to run when connecting to the database */
	initial_script?: string;
}

// biome-ignore lint/suspicious/noExplicitAny: an object where the values can be anything
export type ObjectAny = Record<string, any>;
