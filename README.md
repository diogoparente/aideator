# AppointMint

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
