# Design Doc: LEAD Frontier Engineering Standards & Team Evolution

**Status:** Draft / For Review  
**Author:** AI Engineering Agent (on behalf of Director of Digital Transformation)  
**Date:** April 2026

---

## 1. Executive Summary

This document outlines the transition of the LEAD Frontier platform from a solo-developed MVP to a professional, scalable, and resilient engineering organization. We are adopting best standards to ensure high availability, operational excellence, and clear pathways for team growth.

## 2. Technical Architecture: The Service Layer

To move beyond simple CRUD and prepare for complex data analytics and integrations, we are decoupling our business logic from our transport layer (Next.js).

### 2.1 Pattern: Service Objects
All database interactions, RLS policy logic, and business rules will be encapsulated in **Service Objects**.

*   **Location:** `lib/services/[domain].service.ts`
*   **Responsibility:** Data validation, Supabase queries, business calculations.
*   **Decoupling:** Services must be able to run in unit tests without a Next.js request context.

### 2.2 Pattern: Thin Server Actions
Server Actions will act as controllers.

*   **Location:** `lib/actions/[domain]/*.ts`
*   **Responsibility:** Session validation, Zod input parsing, calling services, and Next.js-specific behaviors (`revalidatePath`).

## 3. Operational Excellence: Environment Strategy

We are moving to a **Migration-Led Infrastructure** model to eliminate manual configuration errors.

### 3.1 Environments
1.  **Local:** Supabase CLI + Docker. Schema changes start here.
2.  **Staging:** Dedicated Supabase project. Connected to Vercel Preview branches.
3.  **Production:** Dedicated Supabase project. Connected to Vercel `main` branch.

### 3.2 Database Lifecycle
*   **NO Manual Changes:** Production and Staging tables/policies are NEVER modified via the Supabase Dashboard.
*   **Migrations:** All changes are committed as `.sql` files in `supabase/migrations`.
*   **Automated Sync:** GitHub Actions applies migrations to Staging on PR creation, and to Production on merge to `main`.

## 4. Quality & Reliability: The Definition of Done (DoD)

To maintain speed while ensuring stability, we implement a **Hybrid Testing Strategy**.

### 4.1 Mandatory Quality Gates
1.  **TypeScript & Linting:** Zero errors allowed in CI.
2.  **Service Unit Tests (Vitest):** 100% coverage for all files in `lib/services/*`.
3.  **Code Review:** Every Pull Request requires at least one approval (CTO or Peer).

### 4.2 Recommended Quality Gates
1.  **E2E Smoke Tests (Playwright):** Automated testing of the critical student registration path.
2.  **Performance Budgets:** Monitoring Core Web Vitals via Vercel Analytics.

## 5. Team Evolution & Roles

As we transition to a CTO-led organization, we will hire for the following roles in order of priority:

1.  **Product Engineer (Full-Stack):** Generalist focused on rapid UI iteration and Service Layer implementation.

2.  **Backend/Data Engineer:** Specialist focused on PostgreSQL performance, complex RLS policies, and matching algorithms.
3.  **DevOps/SRE (Future):** Specialist focused on infrastructure automation and advanced observability.

## 6. Observability & Secrets

*   **Error Tracking:** Initially lean (Vercel Logs), with a planned transition to **Sentry** for full-stack error reporting and session replays.
*   **Secrets:** Manual management via Vercel/Supabase environment variables for now; migrate to a Secret Manager (e.g., Infisical) upon hire of the 3rd engineer.

---

## 7. Next Steps for Implementation (Planning only)

1.  Initialize **Supabase CLI** and pull the current production schema as the base migration.
2.  Setup **Vitest** and create the first service unit tests.
3.  Configure **GitHub Branch Protection** to enforce the new quality gates.
4.  Refactor one core domain (e.g., `Events`) to the Service Layer pattern as a reference implementation.
