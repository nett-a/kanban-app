import fs from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';

export const COLLECTIONS = ['users', 'workspaces', 'boards', 'lists', 'cards', 'comments', 'activities'];

/**
 * Minimal JSON-file database.
 *
 * The whole dataset lives in memory; every mutation calls `save()`, which
 * serialises writes through a promise chain and writes atomically
 * (temp file + rename) so a crash never leaves a half-written file.
 * Node's single-threaded event loop guarantees in-memory mutations don't race.
 */
class JsonDatabase {
  #file = null;
  #data = null;
  #writeChain = Promise.resolve();

  async init(file, { reset = false, seedFactory }) {
    this.#file = file;
    await fs.mkdir(path.dirname(file), { recursive: true });

    if (reset || !existsSync(file)) {
      this.#data = await seedFactory();
      await this.#write();
      return;
    }

    const raw = await fs.readFile(file, 'utf8');
    this.#data = JSON.parse(raw);
    for (const name of COLLECTIONS) this.#data[name] ??= [];
  }

  collection(name) {
    if (!this.#data) throw new Error('Database not initialised');
    if (!COLLECTIONS.includes(name)) throw new Error(`Unknown collection "${name}"`);
    return this.#data[name];
  }

  save() {
    this.#writeChain = this.#writeChain
      .then(() => this.#write())
      .catch((err) => console.error('[db] write failed:', err));
    return this.#writeChain;
  }

  /** Waits for pending writes (used on shutdown and in tests). */
  flush() {
    return this.#writeChain;
  }

  async #write() {
    const json = JSON.stringify(this.#data, null, 2);
    const tmp = `${this.#file}.${process.pid}.tmp`;
    await fs.writeFile(tmp, json, 'utf8');
    try {
      await fs.rename(tmp, this.#file);
    } catch (err) {
      // Windows can refuse the rename while another process (antivirus, editor) holds the file.
      if (err.code !== 'EPERM' && err.code !== 'EBUSY') throw err;
      await fs.writeFile(this.#file, json, 'utf8');
      await fs.rm(tmp, { force: true });
    }
  }
}

export const db = new JsonDatabase();
