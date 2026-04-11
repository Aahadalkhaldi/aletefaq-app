# Aletefaq App

## Local setup

1. Clone the repository.
2. Install dependencies with `npm install`.
3. Copy `.env.example` to `.env.local` and set:

`VITE_SUPABASE_URL=`
`VITE_SUPABASE_ANON_KEY=`
`VITE_BASE44_APP_ID=`
`VITE_BASE44_APP_BASE_URL=`

4. Run the app locally with `npm run dev`.
5. Build for production with `npm run build`.

## Security notes

- Supabase credentials must come from environment variables only.
- In Codemagic, set `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` in the CI environment, not in the repository.
- `/admin` is protected by route guards and must only be reachable by users whose trusted profile role is `admin`.
- Frontend role checks are not sufficient alone. Database RLS policies must also be applied.
- Rotate the previously exposed Supabase anon key before production release.

## Tests

Run the authorization smoke checks with `npm run test`.
