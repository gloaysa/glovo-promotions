# Glovo Restaurant Promotion Scraper
## Usage
To start the server, run:

```bash
npm run build
npm run start
```

The server will listen on the specified port (default is 3501). You can access the API at http://localhost:3501/.
## API Reference
### POST /promotions

Scrapes promotions from the given restaurant URL.

Request body:

```json

{
"restaurantUrl": "https://glovoapp.com/es/en/madrid-sur/popeyes-leganes/",
"offers": "burger, pizza"
}
```
* restaurantUrl: URL of the restaurant from which to scrape promotions as you find it in [Glovo website](https://glovoapp.com). You don't need to login.
* offers: Comma-separated string of offers to filter. Use "all" to retrieve all promotions for that restaurant.

Responses:

    200 OK: Returns a string containing formatted promotion data.
    400 Bad Request: Error in input data.
    404 Not Found: No promotions found matching the criteria.

### Systemd Service Setup

To ensure your server runs continuously, even after a system reboot or crash, you can create a systemd service.

1. Create a service file: Create a new file named promotion_scraper.service in /etc/systemd/system/.

```ini
[Unit]
Description=Restaurant Promotion Scraper Service
After=network.target

[Service]
Environment=NODE_PORT=3501
Type=simple
User=<username>
ExecStart=/usr/bin/node /path/to/your/project/lib/index.js
Restart=on-failure

[Install]
WantedBy=multi-user.target
```
Replace <username> with your Linux username and /path/to/your/project/ with the actual path to your project directory.

2. Enable and start the service:

```bash
systemctl enable promotion_scraper.service
systemctl start promotion_scraper.service
systemctl status promotion_scraper.service
```

3. Check the logs of your service with:

```bash
journalctl -u promotion_scraper.service
```

From here, you can create a cron job to periodically scrape promotions from your favorite restaurants and send you an email or telegram notification with the results.

