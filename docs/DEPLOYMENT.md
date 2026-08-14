# Deployment Guide

## Environment Variables

The application requires the following environment variables to function correctly (as defined in `.env.example`):

- `PESAPAL_CONSUMER_KEY`: Key for Pesapal API access.
- `PESAPAL_CONSUMER_SECRET`: Secret for Pesapal API access.
- `PESAPAL_IPN_ID`: Instant Payment Notification ID from Pesapal.
- `PESAPAL_ENV`: Defines the Pesapal environment (`sandbox` or `production`).
- `PUBLIC_APP_URL`: The absolute URL where the app is hosted (e.g., `https://ameerexpo.com`).
- `SUPABASE_URL`: The project URL for Supabase.
- `SUPABASE_SERVICE_ROLE_KEY`: The secret service role key (Never expose to client).
- `RESEND_API_KEY`: Key for Resend email API.
- `ADMIN_NOTIFICATION_EMAIL`: Email address to receive notifications.

## Deployment Steps

1. Configure environment variables on your hosting provider. Ensure `PESAPAL_ENV` is set to `production`.
2. Run `npm run build` to generate the production build using Vite.
3. Deploy the resulting build assets in `dist/` depending on your hosting provider (e.g., Vercel, Netlify).
4. Apply database migrations to your production Supabase instance using `supabase db push` or by running the SQL scripts in `supabase/migrations/` directly.
