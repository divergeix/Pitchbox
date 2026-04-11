import { CosmosClient, Database, Container } from '@azure/cosmos';

let client: CosmosClient | null = null;
let database: Database | null = null;

function getClient(): CosmosClient {
  if (!client) {
    const endpoint = process.env.COSMOS_ENDPOINT!;
    const key = process.env.COSMOS_KEY!;
    client = new CosmosClient({ endpoint, key });
  }
  return client;
}

function getDatabase(): Database {
  if (!database) {
    const dbName = process.env.COSMOS_DATABASE || 'pitchbox-db';
    database = getClient().database(dbName);
  }
  return database;
}

export function getUsersContainer(): Container {
  return getDatabase().container('users');
}

export function getUsageContainer(): Container {
  return getDatabase().container('usage');
}

export interface UserRecord {
  id: string;
  email: string;
  passwordHash: string;
  plan: 'free' | 'pro';
  createdAt: string;
  razorpayCustomerId?: string;
  razorpaySubscriptionId?: string;
  paymentHistory: Array<{
    orderId: string;
    paymentId: string;
    amount: number;
    currency: string;
    status: string;
    timestamp: string;
  }>;
}

export interface UsageRecord {
  id: string;
  userId: string;
  date: string;
  scans: number;
  drafts: number;
}

export async function findUserByEmail(email: string): Promise<UserRecord | null> {
  const container = getUsersContainer();
  const { resources } = await container.items
    .query({ query: 'SELECT * FROM c WHERE c.email = @email', parameters: [{ name: '@email', value: email.toLowerCase() }] })
    .fetchAll();
  return resources[0] || null;
}

export async function createUser(user: UserRecord): Promise<UserRecord> {
  const container = getUsersContainer();
  const { resource } = await container.items.create(user);
  return resource as UserRecord;
}

export async function updateUser(id: string, email: string, updates: Partial<UserRecord>): Promise<void> {
  const container = getUsersContainer();
  const existing = await findUserByEmail(email);
  if (existing) {
    await container.item(id, email).replace({ ...existing, ...updates });
  }
}

export async function getOrCreateUsage(userId: string, date: string): Promise<UsageRecord> {
  const container = getUsageContainer();
  const id = `${userId}_${date}`;
  try {
    const { resource } = await container.item(id, userId).read<UsageRecord>();
    if (resource) return resource;
  } catch {}

  const record: UsageRecord = { id, userId, date, scans: 0, drafts: 0 };
  const { resource } = await container.items.create(record);
  return resource as UsageRecord;
}

export async function incrementUsage(userId: string, field: 'scans' | 'drafts'): Promise<UsageRecord> {
  const date = new Date().toISOString().split('T')[0];
  const usage = await getOrCreateUsage(userId, date);
  usage[field]++;
  const container = getUsageContainer();
  const { resource } = await container.item(usage.id, userId).replace(usage);
  return resource as UsageRecord;
}
