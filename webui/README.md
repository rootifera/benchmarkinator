# Benchmarkinator Web UI

A modern React-based web interface for the Benchmarkinator benchmark management system.

The same source is built in two modes for Docker Compose:
- `admin`: management UI for hardware, benchmarks, test systems, and results
- `public`: read-only results and dedicated test-system comparison pages

## Features

- **Dashboard**: Overview of system statistics and quick actions
- **Hardware Management**: Manage CPUs, GPUs, motherboards, RAM, and disks
- **Benchmarks**: Create and manage benchmark tests
- **Results**: View and analyze benchmark results with charts
- **Configurations**: Build complete hardware configurations
- **Responsive Design**: Works on desktop and mobile devices
- **Modern UI**: Built with Tailwind CSS and Lucide React icons

## Prerequisites

- Node.js 22+ and npm
- Running Benchmarkinator API backend (default: http://localhost:12345)

## Installation

1. Navigate to the webui directory:
   ```bash
   cd webui
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm start
   ```

The development server opens at http://localhost:4000.

## Configuration

By default the web UI calls `/api`, which is proxied to the backend by the production nginx config. For local development against a separate backend, set `VITE_API_BASE_URL` or `VITE_API_BASE_PATH`.

Set `VITE_APP_MODE=public` to build or run the read-only public UI. The default is `admin`.

Public mode routes:

- `/`: dashboard
- `/results`: searchable benchmark results
- `/systems`: searchable test-system catalog
- `/systems/:id`: dedicated system profile and comparison view

## API Authentication

The web UI requires an API key to authenticate with your backend. The default development key is:
```
benchmarkinator-dev-key-2024
```

You can change this in your backend's environment variables.

## Building for Production

To create a production build:

```bash
npm run build
```

Build the public UI locally with:

```bash
VITE_APP_MODE=public npm run build
```

Run the public UI locally with:

```bash
VITE_APP_MODE=public npm run dev
```

The built files will be in the `dist/` directory.

## Development

- **Vite**: Fast development server and production build
- **React 19**: Modern React with hooks and functional components
- **Tailwind CSS 4**: Utility-first CSS framework integrated through Vite
- **Lucide React**: Beautiful, customizable icons
- **Recharts**: Composable charting library for React
- **Axios**: HTTP client for API requests

## Project Structure

```
webui/
├── public/                 # Static assets
├── src/
│   ├── components/        # Reusable UI components
│   ├── contexts/          # React contexts (auth, etc.)
│   ├── pages/            # Page components
│   ├── index.css         # Tailwind CSS theme and component styles
│   ├── App.jsx           # Main app component
│   └── index.jsx         # Entry point
├── package.json           # Dependencies and scripts
└── vite.config.js         # Vite, React, and Tailwind plugin configuration
```

## Troubleshooting

- **API Connection Issues**: Ensure your backend is running and accessible
- **Authentication Errors**: Verify your API key is correct
- **Build Errors**: Make sure all dependencies are installed with `npm install`

## Contributing

Feel free to submit issues and enhancement requests!
