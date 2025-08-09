import { PrismaClient } from '@prisma/client';

// Singleton pattern to avoid multiple instances in development
let readReplicaDb2: PrismaClient;

if (process.env.NODE_ENV === 'production') {
  readReplicaDb2 = new PrismaClient({
    datasources: {
      db: {
        url: process.env.READ_REPLICA_2_DATABASE_URL,
      },
    },
  });
} else {
  // @ts-ignore
  if (!global.readReplicaDb2) {
    // @ts-ignore
    global.readReplicaDb2 = new PrismaClient({
      datasources: {
        db: {
          url: process.env.READ_REPLICA_2_DATABASE_URL,
        },
      },
    });
  }
  // @ts-ignore
  readReplicaDb2 = global.readReplicaDb2;
}

export { readReplicaDb2 };
