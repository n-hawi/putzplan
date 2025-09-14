# Putzplan Docker Setup

## Quick Start with Docker Compose

1. **Build and start the container:**
   ```bash
   docker-compose up -d
   ```

2. **Access your application:**
   - Open your browser and go to: `http://your-raspberry-pi-ip:3000`
   - Or locally: `http://localhost:3000`

3. **Stop the container:**
   ```bash
   docker-compose down
   ```

## Manual Docker Commands

### Build the image:
```bash
docker build -t putzplan .
```

### Run the container:
```bash
docker run -d \
  --name putzplan-app \
  -p 3000:3000 \
  -v $(pwd)/tasks.json:/usr/src/app/tasks.json \
  --restart unless-stopped \
  putzplan
```

### View logs:
```bash
docker logs putzplan-app
```

### Stop and remove:
```bash
docker stop putzplan-app
docker rm putzplan-app
```

## Raspberry Pi Specific Notes

- The Docker image uses `node:18-alpine` which is ARM-compatible
- Data persistence is handled through volume mounting
- The application will be accessible on port 3000
- Health checks ensure the container restarts if the app fails

## Data Persistence

- `tasks.json` is mounted as a volume to persist your tasks
- If you want to backup your tasks, just copy the `tasks.json` file

## Network Access

To access from other devices on your network, make sure:
1. Your Raspberry Pi firewall allows port 3000
2. Use your Pi's IP address: `http://192.168.1.xxx:3000`

## Auto-start on Boot

The `restart: unless-stopped` policy ensures the container starts automatically when your Raspberry Pi boots up.
