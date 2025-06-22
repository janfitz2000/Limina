#!/bin/bash

# Docker CLI helper for development commands
# Usage: ./docker-cli.sh [command] [args...]

set -e

CONTAINER_NAME="limina-app"

case "$1" in
    "install")
        echo "📦 Installing dependencies in container..."
        docker compose exec app npm install --legacy-peer-deps
        ;;
    "build")
        echo "🔨 Building app in container..."
        docker compose exec app npm run build
        ;;
    "lint")
        echo "🔍 Running linter in container..."
        docker compose exec app npm run lint
        ;;
    "shell")
        echo "🐚 Opening shell in app container..."
        docker compose exec app sh
        ;;
    "logs")
        echo "📋 Following app logs..."
        docker compose logs -f app
        ;;
    "restart")
        echo "🔄 Restarting app container..."
        docker compose restart app
        ;;
    "rebuild")
        echo "🏗️  Rebuilding app container..."
        docker compose up --build -d app
        ;;
    "exec")
        shift
        echo "⚡ Executing: $@"
        docker compose exec app "$@"
        ;;
    *)
        echo "Usage: $0 {install|build|lint|shell|logs|restart|rebuild|exec}"
        echo ""
        echo "Commands:"
        echo "  install  - Install npm dependencies"
        echo "  build    - Build the Next.js app"
        echo "  lint     - Run ESLint"
        echo "  shell    - Open shell in container"
        echo "  logs     - Follow application logs"
        echo "  restart  - Restart app container"
        echo "  rebuild  - Rebuild app container"
        echo "  exec     - Execute arbitrary command in container"
        ;;
esac