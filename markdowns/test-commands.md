// authenticate
npm run dev -- setup --channel-id 0195188a-ea11-7fa2-9469-6cd230993b6d

// start monitoring
npm run dev -- start

// stop monitoring
npm run dev -- stop

// check if monitoring is running
npm run dev -- status

// check logs
npm run dev -- logs

// integration cleanup script

sudo systemctl stop telex-server-monitor
sudo systemctl disable telex-server-monitor
sudo rm /etc/systemd/system/telex-server-monitor.service
sudo systemctl daemon-reload
