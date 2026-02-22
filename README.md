# TCL API Mirror

A simple API mirror for real-time data of the Lyon TCL (public transport) network.

## What is this?

This is a Node.js/TypeScript API that provides access to Lyon's public transportation data (TCL/Sytral network). It serves as a mirror for real-time traffic information and vehicle positions.

## Getting Started

### With Docker

1. Build and run the container:
```bash
docker build -t tcl-api-mirror .
docker run -p 3000:3000 tcl-api-mirror
```

### With npm

1. Install dependencies:
```bash
npm install
```

2. For development:
```bash
npm run dev
```

3. For production:
```bash
npm run build
npm start
```

## Usage

Once running, the API will be available at `http://localhost:3000`

- Health check: `GET /health`
- Traffic endpoints: `GET /traffic/alerts`, `GET /traffic/status`
- Vehicle monitoring endpoints: `GET /vehicle-monitoring/positions`, `GET /vehicle-monitoring/status`

## Realtime Streaming

### Traffic Alerts WebSocket

Endpoint: `localhost:3000/traffic/alerts/ws`

Client sends:
```json
{ "type": "subscribe", "lines": ["A", "B"] }
```

Server sends:
```json
{ "type": "welcome", "maxFavorites": 50 }
{ "type": "subscribed", "lines": ["A", "B"], "maxFavorites": 50, "truncated": false }
{ "type": "alert", "line": "A", "key": "...", "timestamp": "...", "alert": { ... } }
```

### Vehicle Positions SSE

Endpoint: `GET /vehicle-monitoring/positions/stream`

The server pushes updates as soon as fresh data is fetched. Events:
```
event: positions
data: {"count":123,"lastUpdated":"...","payload":{...}}

event: heartbeat
data: {}
```

## License

See LICENSE.pdf
