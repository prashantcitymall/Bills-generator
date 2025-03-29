#!/bin/bash

# Install Redis on Amazon Linux 2
sudo amazon-linux-extras install redis6 -y

# Start Redis and enable it to start on boot
sudo systemctl start redis
sudo systemctl enable redis

# Verify Redis is running
sudo systemctl status redis

# Configure Redis to accept connections from other hosts (optional, only if needed)
# By default, Redis only accepts connections from localhost
# Uncomment and modify the following lines if you need remote access

# sudo sed -i 's/bind 127.0.0.1/bind 0.0.0.0/' /etc/redis/redis.conf
# sudo sed -i 's/protected-mode yes/protected-mode no/' /etc/redis/redis.conf
# sudo systemctl restart redis

echo "Redis installation complete!"
