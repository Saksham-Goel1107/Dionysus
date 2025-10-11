import { createTRPCRouter, protectedProcedure } from '@/server/api/trpc';
import { db } from '@/server/db';
import * as si from 'systeminformation';

export const statsRouter = createTRPCRouter({
  getSystemStats: protectedProcedure.query(async () => {
    const startTime = Date.now();

    try {
      const [cpu, mem, disk, network, temp, os, system] = await Promise.all([
        si.cpu(),
        si.mem(),
        si.fsSize(),
        si.networkStats(),
        si.cpuTemperature(),
        si.osInfo(),
        si.system(),
      ]);

      // Get current load for CPU usage
      const load = await si.currentLoad();

      // Database health check with timing
      const dbStartTime = Date.now();
      await db.user.count({ take: 1 });
      const dbResponseTime = Date.now() - dbStartTime;

      const responseTime = Date.now() - startTime;

      return {
        timing: {
          responseTime,
          dbResponseTime,
          timestamp: new Date().toISOString(),
        },
        cpu: {
          manufacturer: cpu.manufacturer,
          brand: cpu.brand,
          cores: cpu.cores,
          physicalCores: cpu.physicalCores,
          speed: cpu.speed,
          speedMax: cpu.speedMax,
          speedMin: cpu.speedMin,
          governor: cpu.governor,
          usage: load.currentLoad,
        },
        memory: {
          total: mem.total,
          free: mem.free,
          used: mem.used,
          active: mem.active,
          available: mem.available,
          buffcache: mem.buffcache,
          swaptotal: mem.swaptotal,
          swapused: mem.swapused,
          swapfree: mem.swapfree,
        },
        disk: disk.map((d: any) => ({
          fs: d.fs,
          type: d.type,
          size: d.size,
          used: d.used,
          available: d.available,
          use: d.use,
          mount: d.mount,
        })),
        network: network.map((n: any) => ({
          iface: n.iface,
          operstate: n.operstate,
          rx_bytes: n.rx_bytes,
          tx_bytes: n.tx_bytes,
          rx_dropped: n.rx_dropped,
          tx_dropped: n.tx_dropped,
          rx_errors: n.rx_errors,
          tx_errors: n.tx_errors,
        })),
        temperature: {
          main: temp.main,
          cores: temp.cores,
          max: temp.max,
        },
        os: {
          platform: os.platform,
          distro: os.distro,
          release: os.release,
          codename: os.codename,
          kernel: os.kernel,
          arch: os.arch,
          hostname: os.hostname,
          fqdn: os.fqdn,
        },
        system: {
          manufacturer: system.manufacturer,
          model: system.model,
          version: system.version,
          serial: system.serial,
          uuid: system.uuid,
          sku: system.sku,
        },
      };
    } catch (error) {
      throw new Error(`Failed to fetch system stats: ${error}`);
    }
  }),

  getHealthCheck: protectedProcedure.query(async () => {
    const startTime = Date.now();

    try {
      // Database connectivity check
      const dbStartTime = Date.now();
      const userCount = await db.user.count();
      const dbResponseTime = Date.now() - dbStartTime;

      // System health checks
      const [load, mem, disk] = await Promise.all([si.currentLoad(), si.mem(), si.fsSize()]);

      const totalResponseTime = Date.now() - startTime;

      // Determine health status
      const isHealthy =
        load.currentLoad < 80 && mem.available > mem.total * 0.1 && dbResponseTime < 1000;

      return {
        status: isHealthy ? 'healthy' : 'degraded',
        timestamp: new Date().toISOString(),
        responseTime: totalResponseTime,
        checks: {
          database: {
            status: dbResponseTime < 1000 ? 'healthy' : 'slow',
            responseTime: dbResponseTime,
            recordCount: userCount,
          },
          system: {
            status: load.currentLoad < 80 ? 'healthy' : 'high_load',
            cpuLoad: load.currentLoad,
            memoryAvailable: mem.available,
            memoryTotal: mem.total,
          },
          storage: {
            status: disk.every((d: any) => d.use < 90) ? 'healthy' : 'low_space',
            disks: disk.map((d: any) => ({
              mount: d.mount,
              usage: d.use,
              status: d.use < 90 ? 'healthy' : 'warning',
            })),
          },
        },
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        responseTime: Date.now() - startTime,
        error: error instanceof Error ? error.message : 'Unknown error',
        checks: {},
      };
    }
  }),
});
