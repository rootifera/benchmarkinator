#!/bin/bash

# Benchmarkinator Setup Script
# This script sets up the initial configuration for Benchmarkinator

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

generate_password() {
    local length=$1
    openssl rand -base64 $length | tr -d "=+/" | cut -c1-$length
}

generate_api_key() {
    openssl rand -hex 32
}

set_env_var() {
    local key=$1
    local value=$2
    local escaped_value=${value//\\/\\\\}
    escaped_value=${escaped_value//&/\\&}
    escaped_value=${escaped_value//|/\\|}
    sed -i "s|^${key}=.*|${key}=${escaped_value}|" .env
}

display_host_for_url() {
    local bind_address=$1
    if [ "$bind_address" = "127.0.0.1" ] || [ -z "$bind_address" ]; then
        echo "localhost"
    elif [ "$bind_address" = "0.0.0.0" ]; then
        local addresses
        addresses=$(hostname -I 2>/dev/null || true)
        for address in $addresses; do
            if [[ "$address" != 127.* ]] && [[ "$address" != "::1" ]]; then
                echo "$address"
                return
            fi
        done
        hostname -f 2>/dev/null || echo "localhost"
    else
        echo "$bind_address"
    fi
}

if [ -f ".env" ]; then
    print_error ".env file already exists!"
    print_warning "If you want to reconfigure, please delete the existing .env file first."
    exit 1
fi

print_status "Starting Benchmarkinator setup..."

if [ ! -f "env.example" ]; then
    print_error "env.example file not found!"
    print_error "Please run this script from the benchmarkinator root directory."
    exit 1
fi

print_status "Creating .env file from env.example..."
cp env.example .env

print_status "Generating secure random passwords and API key..."

MYSQL_PASSWORD=$(generate_password 32)
MYSQL_ROOT_PASSWORD=$(generate_password 32)
API_KEY=$(generate_api_key)
WEBPASSWORD=$(generate_password 16)

print_status "Updating .env file with generated credentials..."

set_env_var "MYSQL_PASSWORD" "$MYSQL_PASSWORD"
set_env_var "MYSQL_ROOT_PASSWORD" "$MYSQL_ROOT_PASSWORD"
set_env_var "API_KEY" "$API_KEY"
set_env_var "WEBPASSWORD" "$WEBPASSWORD"

print_success "Generated secure credentials:"
echo "  MySQL Password: $MYSQL_PASSWORD"
echo "  MySQL Root Password: $MYSQL_ROOT_PASSWORD"
echo "  API Key: $API_KEY"
echo "  Web Password: $WEBPASSWORD"
echo ""

print_status "Network and Public Access Configuration"
echo "MySQL host port [3306]:"
read -r mysql_port
mysql_port=${mysql_port:-3306}
set_env_var "MYSQL_PORT" "$mysql_port"

echo "API host port [12345]:"
read -r api_port
api_port=${api_port:-12345}
set_env_var "API_PORT" "$api_port"

echo "Admin UI bind address [0.0.0.0]:"
read -r admin_bind_address
admin_bind_address=${admin_bind_address:-0.0.0.0}
set_env_var "ADMIN_BIND_ADDRESS" "$admin_bind_address"

echo "Admin UI port [8001]:"
read -r admin_port
admin_port=${admin_port:-8001}
set_env_var "ADMIN_PORT" "$admin_port"

echo "Public UI bind address [0.0.0.0]:"
read -r public_bind_address
public_bind_address=${public_bind_address:-0.0.0.0}
set_env_var "PUBLIC_BIND_ADDRESS" "$public_bind_address"

echo "Public UI port [8002]:"
read -r public_port
public_port=${public_port:-8002}
set_env_var "PUBLIC_PORT" "$public_port"

echo "Will either UI be served through HTTPS by a reverse proxy such as BunkerWeb? (y/n)"
read -r use_https_proxy
if [[ $use_https_proxy =~ ^[Yy]$ ]]; then
    set_env_var "AUTH_COOKIE_SECURE" "true"
else
    set_env_var "AUTH_COOKIE_SECURE" "false"
fi

allowed_origins=""
echo "Allow direct browser access to the raw API from another origin? [n]:"
echo "Choose 'n' for normal admin/public or HAProxy use."
read -r add_origin

while [[ $add_origin =~ ^[Yy]$ ]]; do
    echo "Enter allowed origin, for example https://admin.example.com:"
    read -r origin

    if [ -n "$origin" ]; then
        if [ -n "$allowed_origins" ]; then
            allowed_origins="${allowed_origins},${origin}"
        else
            allowed_origins="$origin"
        fi
        print_status "Added origin: $origin"
    else
        print_warning "Blank origin skipped."
    fi

    echo "Add another allowed origin? (y/n)"
    read -r add_origin
done

set_env_var "ALLOWED_ORIGINS" "$allowed_origins"

if [[ $use_https_proxy =~ ^[Yy]$ ]] && [ -z "$allowed_origins" ]; then
    print_status "ALLOWED_ORIGINS left blank."
fi

ADMIN_URL_HOST=$(display_host_for_url "$admin_bind_address")
PUBLIC_URL_HOST=$(display_host_for_url "$public_bind_address")

echo ""

print_status "Hardware Data Configuration"
echo "Do you want to load hardware data? (y/n)"
read -r load_hardware

if [[ $load_hardware =~ ^[Yy]$ ]]; then
    print_status "Setting LOAD_HARDWARE_DATA=true"
    set_env_var "LOAD_HARDWARE_DATA" "true"
    
    echo ""
    echo "What hardware era would you like to load?"
    echo "1) retro (up to 2005)"
    echo "2) retroextended (up to 2008)"
    echo "3) modern (current hardware)"
    echo ""
    echo "Please select (1/2/3):"
    read -r era_choice
    
    case $era_choice in
        1)
            hardware_era="retro"
            ;;
        2)
            hardware_era="retroextended"
            ;;
        3)
            hardware_era="modern"
            ;;
        *)
            print_warning "Invalid selection. Defaulting to 'retro'."
            hardware_era="retro"
            ;;
    esac
    
    print_status "Setting HARDWARE_ERA=$hardware_era"
    set_env_var "HARDWARE_ERA" "$hardware_era"
else
    print_status "Hardware data loading disabled"
    set_env_var "LOAD_HARDWARE_DATA" "false"
fi

echo ""

print_status "Backup Configuration"
echo "Do you want to enable automatic database backups? (y/n)"
read -r enable_backups

if [[ $enable_backups =~ ^[Yy]$ ]]; then
    print_status "Setting up automatic backups..."
    
    if [ ! -f "backup.sh" ]; then
        print_error "backup.sh not found! Please ensure backup.sh exists in the current directory."
        exit 1
    fi
    
    chmod +x backup.sh
    
    mkdir -p backups
    
    cron_job="0 2 * * * $(pwd)/backup.sh"
    
    if crontab -l 2>/dev/null | grep -q "backup.sh"; then
        print_warning "Backup cron job already exists. Skipping cron setup."
    else
        (crontab -l 2>/dev/null; echo "$cron_job") | crontab -
        print_success "Added nightly backup cron job (runs at 2:00 AM daily)"
    fi
    
    print_success "Automatic backups enabled!"
    print_status "Backups will be stored in: $(pwd)/backups"
    print_status "Default retention: 30 days"
else
    print_status "Automatic backups disabled"
fi

echo ""

print_status "Building Docker containers..."
if docker compose build; then
    print_success "Docker containers built successfully!"
else
    print_error "Failed to build Docker containers!"
    print_warning "You can try building manually later with: docker compose build"
fi

echo ""
print_success "Setup completed successfully!"
echo ""
print_status "Your admin credentials:"
echo "  Username: admin"
echo "  Password: $WEBPASSWORD"
echo ""
print_warning "IMPORTANT: Save your generated credentials securely!"
echo "To change the admin password, edit WEBPASSWORD in .env and rebuild containers."
echo ""

# Ask if user wants to start the application
print_status "Application Startup"
echo "Do you want to start the Benchmarkinator application now? (y/n)"
read -r start_app

if [[ $start_app =~ ^[Yy]$ ]]; then
    print_status "Starting Benchmarkinator services..."
    if docker compose up -d; then
        print_success "Services started successfully!"
        echo ""
        print_status "Application is now running:"
        echo "  Admin UI: http://$ADMIN_URL_HOST:$admin_port"
        echo "  Public UI: http://$PUBLIC_URL_HOST:$public_port"
        echo "  API: http://localhost:$api_port"
        echo ""
        print_status "Login credentials:"
        echo "  Username: admin"
        echo "  Password: $WEBPASSWORD"
        echo ""
        print_status "To stop the services: docker compose down"
        print_status "To view logs: docker compose logs -f"
    else
        print_error "Failed to start services!"
        print_warning "You can try starting manually later with: docker compose up -d"
    fi
else
    print_status "Application not started."
    echo ""
    print_status "To start later:"
    echo "1. Start services: docker compose up -d"
    echo "2. Access admin UI: http://$ADMIN_URL_HOST:$admin_port"
    echo "3. Access public UI: http://$PUBLIC_URL_HOST:$public_port"
    echo "4. Login with: admin / $WEBPASSWORD"
fi

echo ""
print_status "To view your credentials later:"
echo "  grep -E '^(MYSQL_PASSWORD|MYSQL_ROOT_PASSWORD|API_KEY|WEBPASSWORD)=' .env"
