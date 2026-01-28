# TCL API Mirror

A simple API mirror for real-time data of the Lyon TCL (public transport) network.

## What is this?

This is a Node.js/TypeScript API that provides access to Lyon's public transportation data (TCL/Sytral network). It serves as a mirror for real-time traffic information and alerts.

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
- API endpoints: Check `/traffic` for traffic-related data

## License

See LICENSE.pdf