# ADR 001: Adoption of the Service Layer Pattern

## Status
Proposed (April 2026)

## Context
As LEAD Frontier transitions from a solo MVP to a multi-developer platform, our business logic is currently tightly coupled with the Next.js framework (specifically Server Actions). This creates several long-term risks:
1.  **Testability:** Logic in Server Actions is difficult to test in isolation without mocking the entire Next.js runtime.
2.  **Reusability:** Business rules (e.g., student matching, approval workflows) cannot be easily reused by future mobile applications (React Native) or background cron jobs.
3.  **Scalability:** As the organization grows, the "Server Action" files will become bloated and difficult to maintain.

## Decision
We will adopt the **Service Layer Pattern**.

1.  **Isolation:** All database queries and core business logic will be moved to dedicated service files in `lib/services/`.
2.  **Domain Driven:** Services will be organized by domain (e.g., `EventService`, `MemberService`).
3.  **Controllers:** Next.js Server Actions and API Routes will act as "thin controllers" that only handle authentication, input validation (Zod), and calling the appropriate service.

## Consequences
- **Positive:** Unit tests can run against pure logic, significantly improving development speed and reliability.
- **Positive:** Our core intellectual property is decoupled from the web framework.
- **Negative:** Slightly more boilerplate code initially (creating both a Service and a Server Action).
- **Compliance:** 100% test coverage is now mandatory for these service files.
