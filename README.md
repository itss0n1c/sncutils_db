# @sncutils/db
<a href="https://discord.gg/bMFPpxtMTe"><img src="https://img.shields.io/discord/977286501756968971?color=5865F2&logo=discord&logoColor=white" alt="Discord server" /></a>
<a href="https://www.npmjs.com/package/@sncutils/db"><img src="https://img.shields.io/npm/v/@sncutils/db?maxAge=3600" alt="npm version" /></a>
<a href="https://www.npmjs.com/package/@sncutils/db"><img src="https://img.shields.io/npm/dt/@sncutils/db.svg?maxAge=3600" alt="npm downloads" /></a>

### Setup and utilize postgresql database with ease.

## Installation

```zsh
% bun i @sncutils/db
```

## Basic Usage

```ts
import { init_pool, pool, query } from '@sncutils/db';

const initial_script = `
create table if not exists list (
	id int not null primary key,
	value text not null
);
`;

await init_pool({
	auth: {
		host: 'localhost',
		port: 5432,
		user: 'test',
		password: 'test',
		database: 'test',
	},
	initial_script,
	max: 1000, // maximum number of clients in the pool
});

async function get_some(ids: number[]) {
	// `using` automatically releases the connection once the block is exited
	using conn = await pool.connect(); 
	return query(conn, 'select * from list where id = any($1)', [ids]);
}

let list = await get_some([1, 2, 3]);
console.log(list);
```
