# Welcome to your Lovable project

## Project info

**URL**: https://lovable.dev/projects/0618b2c6-61f2-4963-86c2-477715e1c918

## How can I edit this code?

There are several ways of editing your application.

**Use Lovable**

Simply visit the [Lovable Project](https://lovable.dev/projects/0618b2c6-61f2-4963-86c2-477715e1c918) and start prompting.

Changes made via Lovable will be committed automatically to this repo.

**Use your preferred IDE**

If you want to work locally using your own IDE, you can clone this repo and push changes. Pushed changes will also be reflected in Lovable.

The only requirement is having Node.js & npm installed - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)

Follow these steps:

```sh
# Step 1: Clone the repository using the project's Git URL.
git clone <YOUR_GIT_URL>

# Step 2: Navigate to the project directory.
cd <YOUR_PROJECT_NAME>

# Step 3: Install the necessary dependencies.
npm i

# Step 4: Start the development server with auto-reloading and an instant preview.
npm run dev
```

**Edit a file directly in GitHub**

- Navigate to the desired file(s).
- Click the "Edit" button (pencil icon) at the top right of the file view.
- Make your changes and commit the changes.

**Use GitHub Codespaces**

- Navigate to the main page of your repository.
- Click on the "Code" button (green button) near the top right.
- Select the "Codespaces" tab.
- Click on "New codespace" to launch a new Codespace environment.
- Edit files directly within the Codespace and commit and push your changes once you're done.

## What technologies are used for this project?

This project is built with:

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS
- Storybook

## Local setup

To run the project locally you will need a recent version of Node.js and npm. Once those are installed:

1. Clone the repository and install dependencies:

   ```sh
   git clone <YOUR_GIT_URL>
   cd <YOUR_PROJECT_NAME>
   npm install
   ```

2. Create a `.env` file in the project root and define the environment variables listed below.

3. Start the development server:

   ```sh
   npm run dev
   ```

The application will be available at `http://localhost:5173` by default.

## Available scripts

The following npm scripts are available:

| Script | Description |
| ------ | ----------- |
| `npm run dev` | Start the Vite development server with hot reloading. |
| `npm run build` | Create a production build. |
| `npm run build:dev` | Build using the development configuration. |
| `npm run preview` | Preview the production build locally. |
| `npm run lint` | Run ESLint on the codebase. |
| `npm test` | Run the test suite with Vitest. |
| `npm run test:coverage` | Run tests and generate a coverage report. |
| `npm run check` | Run linting and tests in a single command. |

## How can I deploy this project?

Simply open [Lovable](https://lovable.dev/projects/0618b2c6-61f2-4963-86c2-477715e1c918) and click on Share -> Publish.

## Testing

Run the unit test suite:

```sh
npm test
```

Generate a coverage report:

```sh
npm run test:coverage
```

## Local deployment

To create and preview a production build locally:

```sh
npm run build
npm run preview
```

## Can I connect a custom domain to my Lovable project?

Yes, you can!

To connect a domain, navigate to Project > Settings > Domains and click Connect Domain.

Read more here: [Setting up a custom domain](https://docs.lovable.dev/tips-tricks/custom-domain#step-by-step-guide)

## Environment variables

The app expects the following Supabase environment variables to be defined in a `.env` file:

```
VITE_SUPABASE_URL=<your-supabase-project-url>
VITE_SUPABASE_ANON_KEY=<your-supabase-anon-key>
```

When these variables are not provided the application falls back to a mock Supabase client which is intended only for local development and tests.

## Architecture

See [docs/architecture.md](docs/architecture.md) for a high-level diagram of the project's modules.

## Contributing

Guidelines for commits, linting, and tests are available in [CONTRIBUTING.md](CONTRIBUTING.md).

## Storybook

This project exposes its Tailwind + Radix UI component library through [Storybook](https://storybook.js.org/).

Run the documentation site locally:

```sh
npm run storybook
```

Build the static documentation output:

```sh
npm run build-storybook
```

