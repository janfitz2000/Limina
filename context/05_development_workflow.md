
# Development Workflow

This document describes the development workflow for the LIMINA project. The project uses a **Docker-only** development environment, which means that you do not need to install Node.js, npm, or any other dependencies on your local machine. Everything runs inside Docker containers.

## 1. Prerequisites

- **Docker Desktop**: You must have Docker Desktop installed and running on your machine. This provides both Docker and Docker Compose.
- **Git**: You need Git to clone the repository.

## 2. Getting Started: The `dev.sh` Script

The `dev.sh` script is the main entry point for managing the development environment. It is a wrapper around `docker-compose` that simplifies common tasks.

### Starting the Environment

To start all the services, including the two Next.js applications, Supabase, PostgreSQL, Redis, and MailHog, run:

```bash
./dev.sh
```

This will pull the necessary Docker images and start all the containers in detached mode.

### Accessing the Applications

Once the environment is running, you can access the different services at the following URLs:

- **Main Platform**: `http://localhost:3000`
- **Price Tracker**: `http://localhost:3001`
- **Supabase Studio**: `http://localhost:3002`
- **MailHog (Email Testing)**: `http://localhost:8025`

### Other `dev.sh` Commands

- **`./dev.sh stop`**: Stops all running services.
- **`./dev.sh restart`**: Restarts all services.
- **`./dev.sh logs`**: Tails the logs for all services.
- **`./dev.sh logs <service-name>`**: Tails the logs for a specific service (e.g., `platform`, `tracker`).

## 3. Running Commands: The `cli.sh` Script

The `cli.sh` script is a powerful utility that allows you to run commands *inside* the running Docker containers. This is how you should run all your development tasks, such as installing dependencies, running tests, and linting.

### Syntax

The basic syntax is `./cli.sh <service-name> <command>`.

### Examples

- **Install npm dependencies for the main platform**:
  ```bash
  ./cli.sh platform npm install
  ```

- **Run the test suite for the price tracker**:
  ```bash
  ./cli.sh tracker npm test
  ```

- **Lint the main platform codebase**:
  ```bash
  ./cli.sh platform npm run lint
  ```

- **Open an interactive shell inside the platform container**:
  ```bash
  ./cli.sh platform bash
  ```

- **Access the PostgreSQL database shell**:
  ```bash
  ./cli.sh db
  ```

## 4. Seeding the Database

The `limina-platform-new` application includes a script for seeding the database with realistic test data. To run it, use the `cli.sh` script:

```bash
./cli.sh platform npm run seed:test
```

This will populate the database with merchants, products, customers, and buy orders, which is essential for testing the application's features.

## 6. Quality Assurance & Deployment

To ensure a high-quality product and a smooth path to production, we will adhere to the following processes.

### Quality Assurance

- **Unit & Integration Testing**: Every new feature must be accompanied by a comprehensive suite of tests written in Jest. The `cli.sh` script should be used to run these tests within the Docker environment.
- **End-to-End (E2E) Testing**: We will use a framework like Cypress or Playwright to automate E2E tests for our critical user flows, such as creating a buy order or a price alert.
- **Code Reviews**: All code must be submitted as a pull request and reviewed by at least one other team member before being merged into the main branch.
- **Continuous Integration (CI)**: We will use GitHub Actions (as defined in `.github/workflows`) to automatically run our tests and linting checks on every pull request.

### Deployment

- **Staging Environment**: We will maintain a staging environment that is a mirror of our production setup. All code will be deployed to staging for final testing before being released to production.
- **Production Deployment**: We will use a CI/CD pipeline to automate our deployments. The pipeline will:
    1.  Build the production Docker images for our applications.
    2.  Push the images to a container registry (e.g., Docker Hub, AWS ECR).
    3.  Deploy the new images to our production environment (e.g., on AWS, Vercel, or DigitalOcean).
- **Database Migrations**: Database migrations will be handled carefully. For production, we will use a tool like `flyway` or Supabase's built-in migration tools to apply schema changes in a controlled and reversible manner.
- **Monitoring & Alerting**: We will use a service like Sentry or Datadog to monitor our production applications for errors and performance issues. We will set up alerts to notify us of any critical problems.
