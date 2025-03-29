#!/bin/bash

# Redis installation script for Amazon Linux

echo "=== Step 1: Installing Redis using yum ==="
sudo yum update -y
sudo yum install -y epel-release
sudo yum install -y redis

echo "=== Step 2: Starting Redis service ==="
sudo systemctl start redis
sudo systemctl enable redis

echo "=== Step 3: Verifying Redis is running ==="
sudo systemctl status redis

echo "=== Step 4: Testing Redis connection ==="
if command -v redis-cli &> /dev/null; then
    echo "Testing Redis connection with PING command:"
    redis-cli ping
else
    echo "redis-cli not found. Redis may not be installed correctly."
fi

echo ""
echo "=== Redis installation complete! ==="
echo "To verify Redis is working, run: redis-cli ping"
echo "You should see PONG as a response if Redis is working correctly."

echo ""
echo "=== Redis Configuration (Optional) ==="
echo "By default, Redis only accepts connections from localhost."
echo "If you need to allow remote connections, run these commands:"
echo "sudo sed -i 's/bind 127.0.0.1/bind 0.0.0.0/' /etc/redis.conf"
echo "sudo sed -i 's/protected-mode yes/protected-mode no/' /etc/redis.conf"
echo "sudo systemctl restart redis"
