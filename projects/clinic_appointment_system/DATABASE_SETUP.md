# Database Setup Guide

## Prerequisites
- Docker and Docker Compose installed on your system

## Starting PostgreSQL with Docker (Recommended)

### Start the database
```bash
# Start PostgreSQL (and optionally pgAdmin)
docker-compose up -d

# Check if containers are running
docker-compose ps

# View logs
docker-compose logs -f postgres
```

The `docker-compose.yml` includes:
- **PostgreSQL 15** on port `5432`
- **pgAdmin** (optional) on port `5050` for database GUI management
  - Access at: http://localhost:5050
  - Email: `admin@clinic.com`
  - Password: `admin`

### Database Configuration
The database is automatically created with these credentials:
- **Host**: `localhost`
- **Port**: `5432`
- **Database**: `clinic_appointment_system`
- **User**: `postgres`
- **Password**: `postgres`

Your `.env` file is already configured:
```
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/clinic_appointment_system?schema=public"
```

## Alternative: Local PostgreSQL Installation

If you prefer to use Homebrew PostgreSQL instead of Docker:

### Start PostgreSQL as a service
```bash
brew services start postgresql@14
```

### Create the database manually
```bash
psql postgres -c "CREATE DATABASE clinic_appointment_system;"
```

## Running Prisma Migrations

After the database is running:

```bash
# Navigate to src directory (where prisma folder is)
cd src

# Generate Prisma Client
pnpm prisma generate

# Create and run the initial migration
pnpm prisma migrate dev --name init

# (Optional) Open Prisma Studio to view your database
pnpm prisma studio
```

## Managing Docker Containers

```bash
# Stop containers
docker-compose down

# Stop and remove volumes (WARNING: deletes all data)
docker-compose down -v

# Restart containers
docker-compose restart

# View container logs
docker-compose logs -f postgres
```

## Useful Database Commands

```bash
# Connect to PostgreSQL in Docker container
docker exec -it clinic_postgres psql -U postgres -d clinic_appointment_system

# Execute SQL directly
docker exec -it clinic_postgres psql -U postgres -d clinic_appointment_system -c "SELECT * FROM users LIMIT 5;"

# Create a database backup
docker exec clinic_postgres pg_dump -U postgres clinic_appointment_system > backup.sql

# Restore from backup
docker exec -i clinic_postgres psql -U postgres clinic_appointment_system < backup.sql
```
