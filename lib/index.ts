import { Client, Pool, type PoolClient, type QueryResult } from 'pg';
import { type DBConfig, DBError, type ObjectAny } from './types';

declare module 'pg' {
	interface ClientBase {
		[Symbol.dispose](): void;
	}
}

Client.prototype[Symbol.dispose] = function () {
	if ('release' in this) (this as PoolClient).release(true);
};

export let pool: Pool;

export async function init_pool(conf: DBConfig) {
	if (pool) return;
	const { auth } = conf;
	pool = new Pool({
		host: auth.host,
		port: auth.port,
		database: auth.database,
		user: auth.user,
		password: auth.password,
		max: conf.max,
	});

	pool.on('connect', () => console.log(`Connected to db: ${pool.totalCount}`));
	pool.on('remove', () => console.log(`Removed db connection: ${pool.totalCount}`));

	if (!conf.initial_script) return;
	console.time('[S0n1c DB] Init');
	const conn = await pool.connect();
	await query(conn, conf.initial_script);
	console.timeEnd('[S0n1c DB] Init');
}

export type { PoolClient } from 'pg';

export async function query<T extends ObjectAny, V = unknown>(
	conn: PoolClient,
	query: string,
	values: Array<V> = [],
): Promise<T[]> {
	let res: QueryResult<T>;
	try {
		res = await conn.query<T, typeof values>(query, values);
	} catch (e) {
		console.error(e);
		throw new DBError(
			500,
			`${e instanceof Error ? e.message : 'unknown error'}. ${
				'position' in (e as Record<string, unknown>)
					? `Error at position ${(e as Record<string, unknown>).position}`
					: ''
			}`,
		);
	}
	return res.rows;
}

export async function insert<T extends ObjectAny, V extends ObjectAny>(
	conn: PoolClient,
	table: string,
	data: T,
	conflict?: Array<keyof T>,
): Promise<V> {
	const keys = Object.keys(data);
	const values = Object.values(data);
	if (conflict?.length) {
		values.push(...Object.keys(data).map((k) => data[k]));
	}
	const res = await query<V>(
		conn,
		`insert into ${table} (${keys.join(', ')}) values (${keys.map((_, i) => `$${i + 1}`).join(', ')}) ${
			conflict?.length
				? `on conflict (${conflict.join(', ')}) do update set ${Object.keys(data)
						.map((k, i) => `${k} = $${i + 1 + keys.length}`)
						.join(', ')}`
				: ''
		} returning *`,
		values,
	);

	if (!res[0]) throw new DBError(500, 'No result');

	return res[0];
}

export async function update<
	T extends ObjectAny,
	Data extends Record<string, unknown>,
	V extends Record<string, unknown>,
>(
	conn: PoolClient,
	table: string,
	where: {
		[K in keyof T]: T[K];
	},
	data: Data,
): Promise<V> {
	const keys = Object.keys(data);
	const values = Object.values(data);
	const where_keys = Object.keys(where);
	const where_values = Object.values(where);
	const res = await query<V>(
		conn,
		`update ${table} set ${keys.map((k, i) => `${k} = $${i + 1}`).join(', ')} where ${where_keys
			.map((k, i) => `${k} = $${i + 1 + keys.length}`)
			.join(' and ')} returning *`,
		[...values, ...where_values],
	);

	if (!res[0]) throw new DBError(500, 'No result');

	return res[0];
}

export async function remove<T extends ObjectAny>(
	conn: PoolClient,
	table: string,
	where: {
		[K in keyof T]?: T[K];
	},
): Promise<void> {
	const keys = Object.keys(where);
	const values = Object.values(where);
	await query(conn, `delete from ${table} where ${keys.map((k, i) => `${k} = $${i + 1}`).join(' and ')}`, values);
}
