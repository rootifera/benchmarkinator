# Authentication System

## Overview

The web UI implements a frontend-only authentication system that allows users to access protected functionality while keeping the Results page publicly accessible.

## Features

- **Public Access**: The `/results` page is accessible without authentication
- **Protected Routes**: All other pages require login
- **Login Screen**: Clean login interface with "See Results" option
- **Session Persistence**: Authentication state is maintained across browser sessions
- **Environment-based Credentials**: Credentials are configured via environment variables

## Configuration

### Setting Credentials

The authentication credentials are configured in the parent `.env` file:

```bash
# Web UI Authentication
WEBADMIN=admin
WEBPASSWORD=admin1234
```

### How It Works

1. **Build Time**: During Docker build, the credentials from the parent `.env` file are passed as build arguments
2. **React Environment**: The Dockerfile converts these to `REACT_APP_*` variables for React
3. **Runtime**: The web UI reads these variables to validate login attempts

### Docker Compose Integration

The `docker-compose.yml` passes the credentials as build arguments:

```yaml
benchmarkinator-webui:
  build:
    context: ./webui
    args:
      WEBADMIN: ${WEBADMIN}
      WEBPASSWORD: ${WEBPASSWORD}
```

## Security Notes

- **Frontend Only**: This is a simulated authentication system for demonstration purposes
- **No Backend Validation**: Credentials are validated only on the frontend
- **Production Use**: In a production environment, implement proper backend authentication
- **Environment Variables**: Credentials are embedded in the built JavaScript bundle

## Usage

### For Users

1. **View Results**: Navigate to `/results` or click "See Results" on the login page
2. **Access Protected Features**: Log in with the configured credentials
3. **Add/Edit Results**: Requires authentication
4. **Compare Systems**: Requires authentication

### For Developers

1. **Change Credentials**: Update the parent `.env` file
2. **Rebuild Container**: Run `docker-compose build benchmarkinator-webui`
3. **Restart Services**: Run `docker-compose up -d`

## Troubleshooting

### Credentials Not Working

1. Check the parent `.env` file has correct `WEBADMIN` and `WEBPASSWORD` values
2. Rebuild the web UI container: `docker-compose build benchmarkinator-webui`
3. Restart the services: `docker-compose up -d`

### Environment Variables Not Loading

1. Ensure the Dockerfile build args are correctly set
2. Verify the docker-compose.yml build configuration
3. Check that the parent `.env` file exists and is readable

### Login Issues

1. Clear browser local storage
2. Check browser console for errors
3. Verify the authentication service is working correctly
