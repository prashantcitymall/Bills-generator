#!/bin/bash

# Detect the Linux distribution
if [ -f /etc/os-release ]; then
    . /etc/os-release
    OS=$NAME
    echo "Detected OS: $OS"
else
    echo "Cannot detect OS, attempting generic installation"
    OS="Unknown"
fi

# Install Redis based on the detected OS
if [[ "$OS" == *"Amazon Linux"* ]]; then
    echo "Installing Redis on Amazon Linux..."
    sudo amazon-linux-extras install redis6 -y
elif [[ "$OS" == *"Ubuntu"* ]] || [[ "$OS" == *"Debian"* ]]; then
    echo "Installing Redis on Ubuntu/Debian..."
    sudo apt-get update
    sudo apt-get install -y redis-server
elif [[ "$OS" == *"CentOS"* ]] || [[ "$OS" == *"Red Hat"* ]] || [[ "$OS" == *"Fedora"* ]]; then
    echo "Installing Redis on CentOS/RHEL/Fedora..."
    sudo yum install -y epel-release
    sudo yum install -y redis
else
    echo "Attempting generic installation for unknown OS..."
    # Try apt-get first (Debian-based)
    if command -v apt-get &> /dev/null; then
        sudo apt-get update
        sudo apt-get install -y redis-server
    # Then try yum (Red Hat-based)
    elif command -v yum &> /dev/null; then
        sudo yum install -y epel-release
        sudo yum install -y redis
    else
        echo "ERROR: Could not determine how to install Redis on this system."
        echo "Please install Redis manually and then run the configuration steps."
        exit 1
    fi
fi

# Determine the service name (can be redis or redis-server depending on distribution)
if systemctl list-unit-files | grep -q redis-server.service; then
    REDIS_SERVICE="redis-server"
else
    REDIS_SERVICE="redis"
fi

echo "Using Redis service name: $REDIS_SERVICE"

# Start Redis and enable it to start on boot
sudo systemctl start $REDIS_SERVICE || echo "Failed to start Redis service"
sudo systemctl enable $REDIS_SERVICE || echo "Failed to enable Redis service on boot"

# Verify Redis is running
sudo systemctl status $REDIS_SERVICE || echo "Redis service status check failed"

# Test Redis connection
if command -v redis-cli &> /dev/null; then
    echo "Testing Redis connection..."
    redis-cli ping || echo "Redis ping failed"
else
    echo "redis-cli not found. Redis may not be installed correctly."
fi

# Configure Redis to accept connections from other hosts (optional, only if needed)
# By default, Redis only accepts connections from localhost
echo "\nBy default, Redis only accepts connections from localhost."
echo "If you need to allow remote connections, run the following commands:"

# Find the Redis configuration file
if [ -f /etc/redis/redis.conf ]; then
    REDIS_CONF="/etc/redis/redis.conf"
elif [ -f /etc/redis.conf ]; then
    REDIS_CONF="/etc/redis.conf"
else
    REDIS_CONF="not found"
fi

if [ "$REDIS_CONF" != "not found" ]; then
    echo "Redis configuration file: $REDIS_CONF"
    echo "sudo sed -i 's/bind 127.0.0.1/bind 0.0.0.0/' $REDIS_CONF"
    echo "sudo sed -i 's/protected-mode yes/protected-mode no/' $REDIS_CONF"
    echo "sudo systemctl restart $REDIS_SERVICE"
else
    echo "Redis configuration file not found at standard locations."
    echo "You may need to locate it manually to configure remote access."
fi

echo "\nRedis installation complete!"
echo "To verify Redis is working, run: redis-cli ping"
echo "You should see PONG as a response if Redis is working correctly."
