# Your Web App

A modern web application built with Next.js 15.2.3, Supabase Auth, and shadcn UI components.

## Technologies

- [Next.js 15.2.3](https://nextjs.org) - The React framework for production
- [Supabase Auth](https://supabase.com/docs/guides/auth) - Authentication and authorization
- [shadcn UI](https://ui.shadcn.com) - High-quality UI components
- Custom sidebar implementation based on shadcn UI blocks example

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Authentication

This project uses Supabase Auth for secure authentication. Server-side routes are protected using `supabase.auth.getUser()` to validate authentication tokens.

## UI Components

All UI components are built using the shadcn UI library, providing a consistent and accessible interface. The sidebar implementation is custom-built using shadcn UI blocks as a foundation.

## Project Structure

The project follows the Next.js 15 App Router structure:

- `app/` - Application routes and layouts
- `components/` - Reusable UI components
- `lib/` - Utility functions and shared code
- `public/` - Static assets

## Learn More

To learn more about the technologies used in this project:

- [Next.js Documentation](https://nextjs.org/docs)
- [Supabase Documentation](https://supabase.com/docs)
- [shadcn UI Documentation](https://ui.shadcn.com)

## Deployment

Deploy your app using [Vercel](https://vercel.com) for the best Next.js experience.










grant usage on schema appointmint to authenticated;


GRANT SELECT, INSERT, UPDATE ON ALL TABLES IN SCHEMA "appointmint" TO authenticated;



-- Policy for users to select their own clicks records
CREATE POLICY "users_select_own_clicks" 
ON appointmint.clicks
FOR SELECT 
USING (auth.uid() = id);

-- Policy for users to insert their own clicks records
CREATE POLICY "users_insert_own_clicks" 
ON appointmint.clicks
FOR INSERT 
WITH CHECK (auth.uid() = id);

-- Policy for users to update their own clicks records
CREATE POLICY "users_update_own_clicks" 
ON appointmint.clicks
FOR UPDATE 
USING (auth.uid() = id);