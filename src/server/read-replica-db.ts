import { PrismaClient } from '@prisma/client';

// Singleton pattern to avoid multiple instances in development
let readReplicaDb: PrismaClient;

if (process.env.NODE_ENV === 'production') {
  readReplicaDb = new PrismaClient({
    datasources: {
      db: {
        url: process.env.READ_REPLICA_DATABASE_URL,
      },
    },
  });
} else {
  // @ts-ignore
  if (!global.readReplicaDb) {
    // @ts-ignore
    global.readReplicaDb = new PrismaClient({
      datasources: {
        db: {
          url: process.env.READ_REPLICA_DATABASE_URL,
        },
      },
    });
  }
  // @ts-ignore
  readReplicaDb = global.readReplicaDb;
}

export { readReplicaDb };
