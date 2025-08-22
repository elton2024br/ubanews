# Architecture

This project is organized into a few key modules:

```mermaid
flowchart TB
  subgraph UI
    src["src/"]
  end
  subgraph Shared
    shared["shared/"]
  end
  subgraph Backend
    supabase["supabase/"]
  end

  src --> shared
  src --> supabase
```

The `src/` directory contains the React application, `shared/` holds utilities and shared code, and `supabase/` defines database types and migrations.

On a high level, the runtime architecture looks like this:

```mermaid
flowchart LR
  user((Browser)) --> app[React App]
  app --> api[Supabase Client]
  api --> db[(Postgres DB)]
  shared[Shared Utilities] --> app
  shared --> api
```

User interactions go through the React application, which uses the Supabase client to communicate with the hosted Postgres database. Utility functions in `shared/` are imported by both the application and the client code to keep logic consistent across the stack.
