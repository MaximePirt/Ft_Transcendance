#!/bin/sh

echo "Injecting runtime environment variables..."

API_URL="${VITE_API_URL:-/api}"

# Ensure the config file exists
CONFIG_FILE="/usr/share/nginx/html/env-config.js"
touch $CONFIG_FILE

# Write the config
echo "window.env = {" > $CONFIG_FILE
echo "  API_URL: \"${API_URL}\"," >> $CONFIG_FILE
echo "};" >> $CONFIG_FILE

echo "Configuration injected into $CONFIG_FILE"

# Standard nginx entrypoint will take over from here to start nginx

