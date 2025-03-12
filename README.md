# Telex Server Monitor

A server monitoring integration that helps system administrators track server health, detect anomalies, and receive alerts via the Telex platform. The integration consists of two main components:

1. An integration server that handles communication with Telex
2. A monitoring agent that runs on your server to collect metrics

## Features

- **Secure Communication**: Uses ZeroMQ for reliable messaging between the agent and integration server
- **System Metrics Monitoring**:
  - CPU usage and load averages
  - Number of CPU cores
  - More metrics coming in future versions
- **Real-time Alerts**: Instant notifications through Telex when thresholds are exceeded
- **Easy Installation**: Simple installation script for various operating systems
- **Centralized Configuration**: Manage all settings through the Telex platform
- **Cross-Platform Support**: Works on Linux, macOS, and other Unix-like systems

## Architecture

The system uses a distributed architecture:

- **Integration Server**: Runs on a standalone server (e.g., Render, Railway) and communicates with Telex
- **Monitoring Agent**: Runs on your server and sends metrics to the integration server
- **ZeroMQ**: Handles reliable communication between the agent and integration server

## Installation

### Option 1: Quick Install (Recommended)

1. In your Telex channel, run:

```bash
/setup-monitoring
```

2. Copy and run the installation command provided by Telex.

### Option 2: Manual Installation

```bash
npm install -g telex-server-monitor
```

Then configure the monitor:

```bash
telex-server-monitor setup --channel-id YOUR_CHANNEL_ID
```

## Usage

### Start Monitoring

```bash
telex-server-monitor start
```

### Check Status

```bash
telex-server-monitor status
```

### Stop Monitoring

```bash
telex-server-monitor stop
```

### Reset Configuration

```bash
telex-server-monitor reset
```

## Configuration

All configuration is managed through the Telex platform:

- **Metrics Collection**: Choose which metrics to monitor (CPU, Memory, Disk)
- **Alert Thresholds**: Set custom thresholds for alerts
- **Monitoring Frequency**: Configure how often metrics are collected
- **Channel Settings**: Specify which Telex channels receive alerts

## System Requirements

- Node.js v18 or higher
- Linux, macOS, or other Unix-like operating system
- Root/sudo access (for installation)
- Minimum 512MB RAM
- 100MB free disk space

## Logs

Logs are stored in `~/.telex-monitor/logs/`:

- `telex-monitor.log`: General logs
- `error.log`: Error logs only

## Development

### Prerequisites

- Node.js v18+
- npm v9+
- TypeScript 5.8+

### Building from Source

```bash
git clone https://github.com/JC-Coder/server-monitor-telex-integration.git
cd server-monitor-telex-integration
npm install
npm run build
```

### Running in Development Mode

Integration Server:

```bash
npm run dev:integration
```

Monitoring Agent:

```bash
npm run dev
```

## Architecture Diagram

```
┌─────────────┐         ┌─────────────┐         ┌─────────────┐
│   Your      │         │ Integration │         │   Telex     │
│   Server    │◄───────►│   Server    │◄───────►│  Platform   │
│             │   ZMQ   │             │   HTTP  │             │
└─────────────┘         └─────────────┘         └─────────────┘
```

## Contributing

Contributions are welcome! Please read our contributing guidelines for details.

## License

ISC

## Support

For support, please:

1. Check the [documentation](https://github.com/JC-Coder/server-monitor-telex-integration)
2. Open an issue on GitHub
3. Contact Telex support
