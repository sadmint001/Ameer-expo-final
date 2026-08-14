# Architecture Overview

## Tech Stack

- **Framework**: React 19
- **Routing & SSR**: TanStack Router & TanStack Start
- **Styling**: Tailwind CSS v4 + Radix UI
- **Database / Backend**: Supabase
- **Payments**: Pesapal

## Folder Structure

- `src/components`: UI components, primarily based on Radix UI primitives.
- `src/routes`: File-based routing definitions using TanStack Router.
- `src/server`: Backend logic including Supabase admin client setup and API handlers for integrations like Pesapal.
- `supabase/migrations`: Database schema migrations.

## Key Workflows

### Registration & Payment Flow

1. User completes the multi-step registration form (`src/routes/register.tsx`).
2. If VIP pass is selected, a Pesapal order is initiated (`src/server/pesapal.ts`).
3. User is redirected to Pesapal to complete payment.
4. Pesapal sends an IPN (Instant Payment Notification) to `/api/ipn` to confirm the transaction.
5. The frontend polls `/api/registration` using the UUID returned from the callback URL to verify success.
6. A confirmation email is triggered upon success.
