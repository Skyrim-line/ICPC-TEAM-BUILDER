#!/bin/bash

# Step 1: Navigate to the Docker directory and bring down the containers
cd ~/capstone-project-2024-t3-9900W19AMeetingIsDestiny/backend/bin_docker/ICPC_backend
echo "Bringing down Docker containers..."
docker compose down

# Step 2: Fetch latest changes from origin in the root directory
cd /home/ubuntu/capstone-project-2024-t3-9900W19AMeetingIsDestiny
echo "Fetching latest changes from origin..."
#git fetch origin
git pull origin dev

# Step 3: Navigate to backend directory and execute make docker_save
cd /home/ubuntu/capstone-project-2024-t3-9900W19AMeetingIsDestiny/backend
echo "Executing make docker_save..."
sudo make clean
make docker_save

# Step 4: Navigate back to the Docker directory and bring up the containers
cd ~/capstone-project-2024-t3-9900W19AMeetingIsDestiny/backend/bin_docker/ICPC_backend
echo "Bringing up Docker containers..."
docker compose up -d

echo "Update completed!"
