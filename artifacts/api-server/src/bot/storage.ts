import {
  readFileSync,
  writeFileSync,
  existsSync,
  mkdirSync,
} from "node:fs";
import { join } from "node:path";

const DATA_DIR = join(process.cwd(), "data");
const WARNS_FILE = join(DATA_DIR, "warns.json");

export interface Warn {
  id: string;
  reason: string;
  moderatorId: string;
  date: string;
}

interface WarnsStore {
  [userId: string]: Warn[];
}

function ensureDir(): void {
  if (!existsSync(DATA_DIR)) {
    mkdirSync(DATA_DIR, { recursive: true });
  }
}

function load(): WarnsStore {
  ensureDir();
  if (!existsSync(WARNS_FILE)) return {};
  try {
    return JSON.parse(readFileSync(WARNS_FILE, "utf-8")) as WarnsStore;
  } catch {
    return {};
  }
}

function save(data: WarnsStore): void {
  ensureDir();
  writeFileSync(WARNS_FILE, JSON.stringify(data, null, 2), "utf-8");
}

export function addWarn(
  userId: string,
  reason: string,
  moderatorId: string,
): Warn {
  const store = load();
  if (!store[userId]) store[userId] = [];
  const warn: Warn = {
    id: `${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    reason,
    moderatorId,
    date: new Date().toLocaleDateString("es-ES", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    }),
  };
  store[userId].push(warn);
  save(store);
  return warn;
}

export function getUserWarns(userId: string): Warn[] {
  const store = load();
  return store[userId] ?? [];
}

export function deleteWarn(userId: string, warnId: string): boolean {
  const store = load();
  if (!store[userId]?.length) return false;
  const before = store[userId].length;
  store[userId] = store[userId].filter((w) => w.id !== warnId);
  if (store[userId].length !== before) {
    save(store);
    return true;
  }
  return false;
}
