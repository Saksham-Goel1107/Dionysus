# Back-of-the-Envelope Calculation

This document provides a concise, high-level estimation of the resource requirements and costs associated with running and scaling the Dionysus project on Vercel. These calculations are intended as a quick reference for planning and budgeting. For critical decisions, refine these estimates using detailed analytics and real usage data.

---

## 1. User & Traffic Assumptions

- **Active Users:** 1,000 (initial), scaling to 10,000+
- **Peak Concurrent Users:** 100 (initial), scaling to 1,000+
- **Average Requests per User per Day:** 50
- **Average Response Payload:** 50 KB

**Total Requests per Day (initial):**
```
1,000 users × 50 req/user = 50,000 requests/day
```

**Peak Hourly Requests (initial):**
```
50,000 / 24 ≈ 2,100 requests/hour ≈ 35 requests/minute
```

---

## 2. Bandwidth Estimation

**Outbound Data per Day:**
```
50,000 requests × 50 KB = 2.5 GB/day
2.5 GB × 30 ≈ 75 GB/month
```

- **Typical Vercel Free/Pro Bandwidth:** 100 GB (hobby), 1 TB (pro) per month included

---

## 3. Compute Estimate (Vercel Serverless Functions)

- **Edge/Serverless Functions:** Stateless, auto-scaling, billed per execution/time
- **Typical Cold Start:** <100ms (Node.js/Edge)
- **Execution Time/Request:** ~200ms (estimate, adjust for actual workload)

**Monthly Executions (initial):**
```
50,000 requests/day × 30 = 1,500,000 executions/month
```

- **Included on Vercel Pro:** 1 million serverless function executions/month
- **Incremental Cost:** $0.65 per 1M additional executions

---

## 4. Storage Estimate

- **User Data:** 10 KB/user × 10,000 users = 100 MB (external DB, e.g., PlanetScale/Supabase)
- **App Data (logs/media):** 10 GB/month (external storage, e.g., S3, Supabase Storage)

**Vercel Storage:** For assets, use Vercel’s built-in static hosting (CDN-backed) or external storage for larger files.

---

## 5. Cost Estimate (Vercel + Third-Party Services)

| Resource                   | Unit Cost                   | Quantity        | Subtotal    |
|----------------------------|-----------------------------|-----------------|-------------|
| Vercel Pro Plan            | $20/mo (includes 1M exec., 1TB bandwidth) | 1       | $20         |
| Additional Function Exec.  | $0.65 per 1M (over included) | 0.5            | ~$0.33      |
| DB (PlanetScale Starter)   | $0 (starter) / $29+ (scaling)| 1              | $0-29       |
| External Storage (S3/Supa) | $0.02/GB                    | 10 GB          | $0.20       |
| Backup/Security/Logging    | $5/mo (estimate)            | 1              | $5          |
| **Total (initial)**        |                             |                | **$25–55**  |

- Costs scale with usage (e.g., bandwidth over 1TB/month, more executions, larger DB/storage tiers).

---

## 6. Key Scaling Bottlenecks & Recommendations

- **Serverless Cold Start:** Minimize with Edge Functions or optimize function size.
- **Database Throughput:** Choose a scalable serverless DB (PlanetScale, Neon, Supabase).
- **Stateless Compute:** Vercel auto-scales, no manual server sizing needed.
- **Caching:** Use Vercel’s built-in cache headers, or deploy Redis via Upstash.
- **Media/Static Assets:** Serve via Vercel CDN or external (S3/Cloudflare R2) for larger files.
- **Monitoring:** Use Vercel Analytics and integrate external tools for deeper insights.

---

## 7. Summary Table

| Metric                  | Initial Estimate       | At 10x Scale          |
|-------------------------|-----------------------|-----------------------|
| Daily Active Users      | 1,000                 | 10,000                |
| Peak Concurrent Users   | 100                   | 1,000                 |
| Daily Requests          | 50,000                | 500,000               |
| Bandwidth (GB/month)    | 75                    | 750                   |
| Serverless Executions   | 1.5M/month            | 15M/month             |
| Monthly Cloud Cost (\$) | 25–55                 | 100–200+              |

---

## 8. Assumptions & Caveats

- Estimates are based on Vercel Pro pricing (July 2025). Free tier is viable for hobby/dev use but not production.
- Database, storage, and other integrations are costed at entry level; scale as needed.
- Real-world performance depends on code, DB schema, and actual traffic patterns.
- Security, monitoring, and backups should be reviewed for production readiness.
- Review and update as usage or architecture evolves.

---

## 9. References

- [Vercel Pricing](https://vercel.com/pricing)
- [PlanetScale Pricing](https://planetscale.com/pricing)
- [Supabase Pricing](https://supabase.com/pricing)
- [Back-of-the-Envelope Calculations for Engineers](https://www.joelonsoftware.com/2001/12/11/back-to-basics/)

---

_Last updated: 2025-07-28_
