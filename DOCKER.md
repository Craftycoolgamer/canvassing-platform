# Docker Setup for Canvassing Backend

This guide explains how to dockerize and deploy the Canvassing backend using Docker.

## 🐳 Docker Files Overview

### Core Files
- **`backend/Dockerfile`** - Development Dockerfile
- **`backend/Dockerfile.prod`** - Production-optimized Dockerfile
- **`backend/.dockerignore`** - Excludes unnecessary files from build
- **`docker-compose.yml`** - Development environment
- **`docker-compose.prod.yml`** - Production environment
- **`env.example`** - Environment variables template

## 🚀 Quick Start

### Development Environment

1. **Build and run with Docker Compose:**
```bash
# Build and start the backend
docker-compose up --build

# Run in background
docker-compose up -d --build

# View logs
docker-compose logs -f canvassing-backend
```

2. **Test the API:**
```bash
# Health check
curl http://localhost:3000/api/health

# Login (get JWT token)
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@canvassing.com","password":"admin123"}'
```

### Production Environment

1. **Set up environment variables:**
```bash
# Copy example file
cp env.example .env

# Edit .env with your production values
nano .env
```

2. **Deploy with production compose:**
```bash
# Build and start production services
docker-compose -f docker-compose.prod.yml up -d --build

# View logs
docker-compose -f docker-compose.prod.yml logs -f
```

## 🔧 Docker Commands

### Development

```bash
# Build the image
docker build -t canvassing-backend ./backend

# Run the container
docker run -p 3000:3000 canvassing-backend

# Run with environment variables
docker run -p 3000:3000 \
  -e ASPNETCORE_ENVIRONMENT=Development \
  -e JWT__SecretKey=your-secret-key \
  canvassing-backend

# Interactive shell
docker run -it --rm canvassing-backend /bin/bash
```

### Production

```bash
# Build production image
docker build -f backend/Dockerfile.prod -t canvassing-backend:prod ./backend

# Run production container
docker run -p 3000:3000 \
  -e ASPNETCORE_ENVIRONMENT=Production \
  -e JWT__SecretKey=your-production-secret \
  canvassing-backend:prod
```

### Docker Compose

```bash
# Start services
docker-compose up

# Start in background
docker-compose up -d

# Stop services
docker-compose down

# Rebuild and start
docker-compose up --build

# View logs
docker-compose logs -f

# Scale services
docker-compose up --scale canvassing-backend=3
```

## 🏗️ Multi-Stage Build

The production Dockerfile uses multi-stage builds:

1. **Build Stage**: Compiles the .NET application
2. **Publish Stage**: Creates optimized runtime package
3. **Final Stage**: Minimal runtime image with only necessary files

### Benefits:
- **Smaller Image**: Only runtime dependencies included
- **Security**: Non-root user execution
- **Performance**: Optimized for production
- **Caching**: Efficient layer caching

## 🔒 Security Features

### Container Security
- **Non-root User**: Application runs as `appuser`
- **Minimal Base Image**: Uses official .NET runtime
- **No Development Tools**: Production image excludes SDK
- **Health Checks**: Monitors application health

### Environment Security
- **Secret Management**: Use environment variables for secrets
- **JWT Configuration**: Secure token generation
- **Network Isolation**: Docker networks for service communication

## 📊 Monitoring & Health Checks

### Health Check Endpoint
```bash
# Check application health
curl http://localhost:3000/api/health
```

### Docker Health Checks
```bash
# View container health
docker ps

# Check health status
docker inspect canvassing-backend | grep Health -A 10
```

## 🗄️ Database Integration (Future)

When ready to add a database:

1. **Uncomment PostgreSQL service in docker-compose.prod.yml**
2. **Set environment variables in .env**
3. **Update connection strings in the application**

```yaml
# Example PostgreSQL service
postgres:
  image: postgres:15-alpine
  environment:
    POSTGRES_DB: ${POSTGRES_DB}
    POSTGRES_USER: ${POSTGRES_USER}
    POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
  volumes:
    - postgres_data:/var/lib/postgresql/data
```

## 🔄 CI/CD Integration

### GitHub Actions Example
```yaml
name: Build and Deploy
on:
  push:
    branches: [main]

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Build Docker image
        run: docker build -f backend/Dockerfile.prod -t canvassing-backend:latest ./backend
      - name: Push to registry
        run: |
          docker tag canvassing-backend:latest your-registry/canvassing-backend:latest
          docker push your-registry/canvassing-backend:latest
```

## 🐛 Troubleshooting

### Common Issues

1. **Port Already in Use:**
```bash
# Check what's using port 3000
netstat -tulpn | grep :3000

# Kill the process
sudo kill -9 <PID>
```

2. **Build Failures:**
```bash
# Clean Docker cache
docker system prune -a

# Rebuild without cache
docker-compose build --no-cache
```

3. **Permission Issues:**
```bash
# Fix file permissions
sudo chown -R $USER:$USER .

# Run with proper permissions
docker-compose up --build
```

4. **Environment Variables:**
```bash
# Check environment variables
docker-compose config

# Verify .env file
cat .env
```

### Debug Commands

```bash
# Enter running container
docker exec -it canvassing-backend /bin/bash

# View container logs
docker logs canvassing-backend

# Check container resources
docker stats canvassing-backend

# Inspect container
docker inspect canvassing-backend
```

## 📈 Performance Optimization

### Production Optimizations
- **Multi-stage Build**: Reduces image size
- **Layer Caching**: Efficient builds
- **Health Checks**: Automatic monitoring
- **Resource Limits**: Prevent resource exhaustion

### Resource Limits
```yaml
services:
  canvassing-backend:
    deploy:
      resources:
        limits:
          memory: 512M
          cpus: '0.5'
        reservations:
          memory: 256M
          cpus: '0.25'
```

## 🚀 Deployment Strategies

### Single Container
```bash
docker run -d -p 3000:3000 canvassing-backend:prod
```

### Docker Compose
```bash
docker-compose -f docker-compose.prod.yml up -d
```

### Kubernetes (Future)
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: canvassing-backend
spec:
  replicas: 3
  selector:
    matchLabels:
      app: canvassing-backend
  template:
    metadata:
      labels:
        app: canvassing-backend
    spec:
      containers:
      - name: backend
        image: canvassing-backend:prod
        ports:
        - containerPort: 3000
```

## 📝 Environment Variables

### Required Variables
- `JWT_SECRET_KEY`: Secret key for JWT signing
- `ASPNETCORE_ENVIRONMENT`: Development/Production
- `ASPNETCORE_URLS`: Application URL

### Optional Variables
- `JWT_ISSUER`: JWT issuer claim
- `JWT_AUDIENCE`: JWT audience claim
- `JWT_TOKEN_EXPIRATION_HOURS`: Access token lifetime
- `JWT_REFRESH_TOKEN_EXPIRATION_DAYS`: Refresh token lifetime

## 🔄 Updates and Maintenance

### Updating the Application
```bash
# Pull latest changes
git pull origin main

# Rebuild and restart
docker-compose down
docker-compose up --build -d
```

### Backup and Restore
```bash
# Backup data (when database is added)
docker-compose exec postgres pg_dump -U canvassing_user canvassing > backup.sql

# Restore data
docker-compose exec -T postgres psql -U canvassing_user canvassing < backup.sql
```

## 📚 Additional Resources

- [Docker Documentation](https://docs.docker.com/)
- [.NET Docker Images](https://hub.docker.com/_/microsoft-dotnet)
- [Docker Compose Documentation](https://docs.docker.com/compose/)
- [ASP.NET Core Docker](https://docs.microsoft.com/en-us/aspnet/core/host-and-deploy/docker/) 