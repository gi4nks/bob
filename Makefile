.PHONY: help install dev build start lint clean db-setup db-migrate db-studio feed db-clean

# Default target
help:
	@echo "Available commands:"
	@echo "  make install    - Install dependencies and generate Prisma client"
	@echo "  make dev        - Start the development server"
	@echo "  make build      - Build the application for production"
	@echo "  make start      - Start the production server"
	@echo "  make lint       - Run ESLint"
	@echo "  make db-setup   - Initialize database and run migrations"
	@echo "  make db-migrate - Create a new migration from schema changes"
	@echo "  make db-studio  - Open Prisma Studio GUI"
	@echo "  make feed       - Populates the database with complex test data"
	@echo "  make db-clean   - Wipes all data from the database"
	@echo "  make release    - Automatic version bump and changelog generation"
	@echo "  make patch      - Release a new patch version (0.0.x)"
	@echo "  make minor      - Release a new minor version (0.x.0)"
	@echo "  make major      - Release a new major version (x.0.0)"
	@echo "  make clean      - Remove build artifacts and node_modules"

install:
	npm install
	npx prisma generate

dev:
	npm run dev

build:
	npm run build

start:
	npm run start

lint:
	npm run lint

db-setup:
	npx prisma migrate dev

db-migrate:
	npx prisma migrate dev

db-studio:
	npx prisma studio

feed:
	npx prisma db seed

db-clean:
	npx prisma db push --force-reset
	npx prisma generate

release:
	npm run release

patch:
	npm run release:patch

minor:
	npm run release:minor

major:
	npm run release:major

clean:
	rm -rf .next node_modules out