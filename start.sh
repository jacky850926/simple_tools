#!/bin/bash

# Check if Docker is installed
if ! command -v docker &> /dev/null
then
    echo "Docker could not be found. Please install Docker first."
    exit 1
fi

# Check if Docker Compose is installed (or docker compose command exists)
if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null
then
    echo "Docker Compose could not be found. Please install Docker Compose."
    exit 1
fi

echo "Building and starting the application..."
docker-compose up -d --build

echo "Application started! Access it at http://localhost:3002"
