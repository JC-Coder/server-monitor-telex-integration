#!/bin/bash

# Function to print colored output
print_message() {
    GREEN='\033[0;32m'
    BLUE='\033[0;34m'
    RED='\033[0;31m'
    NC='\033[0m' # No Color
    
    case $1 in
        "info")
            echo -e "${BLUE}INFO: ${NC}$2"
            ;;
        "success")
            echo -e "${GREEN}SUCCESS: ${NC}$2"
            ;;
        "error")
            echo -e "${RED}ERROR: ${NC}$2"
            ;;
    esac
}

# Function to check if a command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --channel-id)
            CHANNEL_ID="$2"
            shift
            shift
            ;;
        *)
            print_message "error" "Unknown argument: $1"
            exit 1
            ;;
    esac
done

# Check if channel ID is provided
if [ -z "$CHANNEL_ID" ]; then
    print_message "error" "Channel ID is required. Usage: $0 --channel-id <channel-id>"
    exit 1
fi

# Detect OS
if [ -f /etc/os-release ]; then
    . /etc/os-release
    OS=$NAME
else
    OS=$(uname -s)
fi

print_message "info" "Detected OS: $OS"

# Install Node.js if not present
if ! command_exists node; then
    print_message "info" "Node.js not found. Installing Node.js..."
    
    case $OS in
        "Ubuntu" | "Debian GNU/Linux")
            # Install Node.js using NodeSource
            curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
            sudo apt-get install -y nodejs
            ;;
        "CentOS Linux" | "Red Hat Enterprise Linux")
            # Install Node.js using NodeSource
            curl -fsSL https://rpm.nodesource.com/setup_18.x | sudo bash -
            sudo yum install -y nodejs
            ;;
        "Darwin")
            # Install Node.js using Homebrew
            if ! command_exists brew; then
                /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
            fi
            brew install node@18
            ;;
        *)
            print_message "error" "Unsupported operating system: $OS"
            exit 1
            ;;
    esac
    
    print_message "success" "Node.js installed successfully"
fi

# Verify Node.js installation
NODE_VERSION=$(node --version)
print_message "info" "Node.js version: $NODE_VERSION"

# Install npm if not present (should be installed with Node.js, but just in case)
if ! command_exists npm; then
    print_message "error" "npm not found. Please install npm manually."
    exit 1
fi

# Create service directory
INSTALL_DIR="/opt/telex-server-monitor"
sudo mkdir -p $INSTALL_DIR

# Install the Telex Server Monitor package
print_message "info" "Installing Telex Server Monitor..."
sudo npm install -g telex-server-monitor-sdk

# Find the actual path of the telex-server-monitor executable
MONITOR_PATH=$(which telex-server-monitor)
if [ -z "$MONITOR_PATH" ]; then
    print_message "error" "Could not find telex-server-monitor executable"
    exit 1
fi

print_message "info" "Found telex-server-monitor at: $MONITOR_PATH"

# Ensure executable permissions
sudo chmod +x "$MONITOR_PATH"

# Run setup command to initialize configuration
print_message "info" "Setting up Telex Server Monitor..."
"$MONITOR_PATH" setup --channel-id "$CHANNEL_ID"

# Create configuration directory
sudo mkdir -p /etc/telex-server-monitor

# Create the service configuration
print_message "info" "Creating service configuration..."

# Create systemd service file
if [ -d "/etc/systemd/system" ]; then
    cat << EOF | sudo tee /etc/systemd/system/telex-server-monitor.service
[Unit]
Description=Telex Server Monitor
After=network.target

[Service]
Type=simple
User=root
ExecStart=$MONITOR_PATH start
Restart=always
RestartSec=10
Environment=NODE_ENV=production
WorkingDirectory=/opt/telex-server-monitor

[Install]
WantedBy=multi-user.target
EOF

    # Reload systemd and enable/start service
    sudo systemctl daemon-reload
    sudo systemctl enable telex-server-monitor
    sudo systemctl start telex-server-monitor
    
    print_message "success" "Service installed and started"
    
    # Check service status
    sudo systemctl status telex-server-monitor --no-pager

elif [ -d "/Library/LaunchDaemons" ]; then
    # macOS service configuration
    cat << EOF | sudo tee /Library/LaunchDaemons/com.telex.server-monitor.plist
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>Label</key>
    <string>com.telex.server-monitor</string>
    <key>ProgramArguments</key>
    <array>
        <string>/usr/local/bin/telex-server-monitor</string>
        <string>start</string>
    </array>
    <key>RunAtLoad</key>
    <true/>
    <key>KeepAlive</key>
    <true/>
    <key>StandardErrorPath</key>
    <string>/var/log/telex-server-monitor.err</string>
    <key>StandardOutPath</key>
    <string>/var/log/telex-server-monitor.log</string>
    <key>EnvironmentVariables</key>
    <dict>
        <key>NODE_ENV</key>
        <string>production</string>
    </dict>
</dict>
</plist>
EOF

    # Load and start the service
    sudo launchctl load -w /Library/LaunchDaemons/com.telex.server-monitor.plist
    
    print_message "success" "Service installed and started"
else
    print_message "error" "Could not detect systemd or launchd. Please set up the service manually."
    exit 1
fi

# Create log directories
sudo mkdir -p /var/log/telex-server-monitor

print_message "success" "Telex Server Monitor installation completed successfully!"
print_message "info" "You can check the status using: telex-server-monitor status"
print_message "info" "View logs in /var/log/telex-server-monitor.log" 
