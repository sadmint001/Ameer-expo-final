# Security Policy

## Secrets Management

Several critical secrets are used by the application and must remain strictly confidential:

- **Supabase Service Role Key**
- **Pesapal Consumer Secret**
- **Resend API Key**

These secrets must **only** be stored in environment variables (e.g., via the hosting provider's dashboard) and accessed via server-side code (e.g., inside `src/server/`).

### Important Rules

1. Never commit `.env` files to the repository.
2. Never prefix secret environment variables with `PUBLIC_` or `VITE_`, as this will expose them in the client bundle.
3. Database access from the client should only be done using the Supabase anonymous key with properly configured Row Level Security (RLS) policies.
