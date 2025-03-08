**TELEX SERVER MONITOR V1.0**

**Basic Monitoring Setup**  
This version establishes the core monitoring functionality with essential system metrics and authentication.

**User Story:** As a system administrator, I want to monitor basic server metrics and authenticate with Telex so that I can receive alerts about critical system issues.

**Acceptance Criteria:**

- Users can authenticate with Telex using email and password to fetch an API token
- The agent collects and reports CPU, memory, and disk usage metrics
- Metrics are sent to Telex in a structured JSON format
- Users can start and stop monitoring via CLI commands

---

**TELEX SERVER MONITOR V1.1**  
**Process and Service Monitoring**  
This version adds the ability to monitor running processes and key services.

**User Story:** As a system administrator, I want to monitor specific services and processes so that I can detect crashes or excessive resource usage.

**Acceptance Criteria:**

- Users can configure which services to monitor via Telex settings
- The agent tracks the status of specified services (running, stopped, failed)
- The agent collects data on running processes (PID, name, CPU/memory usage)
- Service failures trigger alerts to Telex

---

**TELEX SERVER MONITOR V1.2**  
**Hardware Health Monitoring**  
This version introduces hardware health monitoring for supported systems.

**User Story:** As a system administrator, I want to monitor hardware health metrics so that I can detect potential hardware failures early.

**Acceptance Criteria:**

- The agent collects CPU temperature and fan speed (where supported)
- The agent collects disk health data via SMART (where supported)
- Critical hardware conditions trigger alerts to Telex
- The agent gracefully skips unsupported metrics without failing

---

**TELEX SERVER MONITOR V1.3**  
**Log Monitoring**  
This version adds the ability to monitor system logs for errors and critical events.

**User Story:** As a system administrator, I want to monitor system logs so that I can detect and respond to critical errors.

**Acceptance Criteria:**

- The agent monitors system logs (e.g., /var/log/syslog on Linux)
- Users can specify log paths and keywords via Telex settings
- The agent parses logs and summarizes error counts
- Critical log events trigger alerts to Telex

---

**TELEX SERVER MONITOR V1.4**  
**Uptime Tracking**  
This version introduces server uptime monitoring and unexpected reboot detection.

**User Story:** As a system administrator, I want to track server uptime so that I can detect unexpected reboots and ensure high availability.

**Acceptance Criteria:**

- The agent tracks server uptime since the last reboot
- Unexpected reboots trigger alerts to Telex
- Uptime data is included in periodic reports for AI analysis

---

**TELEX SERVER MONITOR V1.5**  
**Customizable Alert Thresholds**  
This version allows users to configure custom thresholds for alerts.

**User Story:** As a system administrator, I want to set custom thresholds for alerts so that I can receive notifications based on my specific needs.

**Acceptance Criteria:**

- Users can configure thresholds for CPU, memory, disk usage, and temperature via Telex settings
- Alerts are triggered when thresholds are exceeded
- Thresholds are fetched by the agent on startup
- Users can adjust thresholds without redeploying the agent
