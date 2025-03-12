// add a default setting for the monitoring

"metrics": {
"cpu": true,
"memory": true,
"disk": true
},
"thresholds": {
"cpu": 85,
"memory": 85,
"disk": 90
},
"frequency": 300,

// clean up logs every week so that the logs directory does not grow too much

// during setup, automatically create the entry on the server to ensure that the monitoring agent is auto restarted if it crashes or if server is restarted

// add cron job that runs every 1 hour to check if token would expire soon , e.g 1 day before expiry

the part where we give them a url they send it to there and then we forward it to telex

user url -> my url -> telex url

get token on enablement

talk to someone (vicradeon) about the auth between integration and settings

implement tool calling with mastra to enable users chat with the ai to get metrics etc.

// installation flow

1. user installs the integration and then on any channel then he run the /setup-monitoring command
2. user will receive a url script that contain the "channel-id" , the url will be a curl url (installation script) with instruction so user will run the curl on their server (vps - aws or digital ocean), the url will then download and install all necessary package and setup the monitoring agent and also start it
3. the integration will register the monitoring agent

// ensure to support versioning for sdk and the integration

curl --location 'https://5lldpsml-3002.uks1.devtunnels.ms/webhook' \
--header 'Content-Type: application/json' \
--data '{
"message": "hello",
"channel_id": "01950eec-97c4-7f92-bda8-62c7264209b3"
}'
