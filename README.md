# Telex Server Monitor

A server monitoring agent that integrates with the Telex platform to track system metrics, detect issues, and send alerts.

## Features

- **Authentication**: Securely authenticate with Telex to fetch settings and API token
- **System Metrics**: Monitor CPU, memory, and disk usage
- **Alerting**: Send real-time alerts to Telex when thresholds are exceeded
- **Configuration**: Centralized configuration via Telex

## Installation

```bash
npm install -g telex-server-monitor
```

## Usage

### Setup

First, set up the monitor with your Telex credentials:

```bash
telex-server-monitor setup --email your.email@example.com --password your-password [--server-name "prod-server-1"]
```

This will:

- Authenticate with Telex to obtain an API token
- Store the token securely in `~/.telex-monitor/config.json`
- Fetch your monitoring settings from Telex
- Optionally set a custom server name (defaults to hostname)

### Start Monitoring

Start the monitoring process:

```bash
telex-server-monitor start
```

This will:

- Begin collecting metrics based on your Telex settings
- Send metrics to Telex for analysis
- Send alerts when thresholds are exceeded

### Stop Monitoring

Stop the monitoring process:

```bash
telex-server-monitor stop
```

### Reset Configuration

Reset all configuration:

```bash
telex-server-monitor reset
```

## Configuration

All configuration is managed through the Telex platform. Settings include:

- Metrics to monitor (CPU, memory, disk)
- Alert thresholds
- Monitoring frequency
- Channel IDs for alerts

## Logs

Logs are stored in `~/.telex-monitor/logs/`:

- `telex-monitor.log`: All logs
- `error.log`: Error logs only

## Development

### Building from source

```bash
git clone https://github.com/your-username/telex-server-monitor.git
cd telex-server-monitor
npm install
npm run build
```

### Running in development mode

```bash
npm run dev -- setup --email your.email@example.com --password your-password
npm run dev -- start
```

## License

ISC
