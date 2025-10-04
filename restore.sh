#!/bin/bash

# Benchmarkinator Database Restore Script
# This script provides an interactive way to restore the database from backups

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
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

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKUP_DIR="$SCRIPT_DIR/backups"

# Check if .env file exists
if [ ! -f "$SCRIPT_DIR/.env" ]; then
    print_error ".env file not found in $SCRIPT_DIR"
    print_error "Please run this script from the benchmarkinator root directory or ensure .env exists."
    exit 1
fi

# Load environment variables from .env file
print_status "Loading configuration from .env file..."
source "$SCRIPT_DIR/.env"

# Validate required environment variables
required_vars=("MYSQL_DATABASE" "MYSQL_USER" "MYSQL_PASSWORD" "MYSQL_PORT")
for var in "${required_vars[@]}"; do
    if [ -z "${!var}" ]; then
        print_error "Required environment variable $var is not set in .env file"
        exit 1
    fi
done

# Check if backup directory exists
if [ ! -d "$BACKUP_DIR" ]; then
    print_error "Backup directory not found: $BACKUP_DIR"
    print_error "Please run the setup script first or create backups manually."
    exit 1
fi

# Find all backup files
backup_files=($(find "$BACKUP_DIR" -name "benchmarkinator_backup_*.sql*" -type f | sort -r))

if [ ${#backup_files[@]} -eq 0 ]; then
    print_error "No backup files found in $BACKUP_DIR"
    print_error "Please create some backups first using backup.sh"
    exit 1
fi

print_status "Found ${#backup_files[@]} backup file(s):"
echo ""

# Display backup files with numbers
for i in "${!backup_files[@]}"; do
    backup_file="${backup_files[$i]}"
    filename=$(basename "$backup_file")
    
    # Extract date from filename (format: benchmarkinator_backup_YYYYMMDD_HHMMSS.sql[.gz])
    if [[ $filename =~ benchmarkinator_backup_([0-9]{8})_([0-9]{6})\.sql ]]; then
        date_part="${BASH_REMATCH[1]}"
        time_part="${BASH_REMATCH[2]}"
        # Format date as DD.MM.YYYY
        formatted_date="${date_part:6:2}.${date_part:4:2}.${date_part:0:4}"
        # Format time as HH:MM:SS
        formatted_time="${time_part:0:2}:${time_part:2:2}:${time_part:4:2}"
        display_date="$formatted_date $formatted_time"
    else
        display_date="Unknown date"
    fi
    
    # Get file size
    if [ -f "$backup_file" ]; then
        file_size=$(du -h "$backup_file" | cut -f1)
    else
        file_size="Unknown"
    fi
    
    # Check if compressed
    if [[ $filename == *.gz ]]; then
        compression="(compressed)"
    else
        compression=""
    fi
    
    printf "%02d - %s %s %s\n" $((i+1)) "$display_date" "$file_size" "$compression"
done

echo ""
print_warning "IMPORTANT: This will completely replace your current database!"
print_warning "Make sure to backup your current data if needed."
echo ""

# Get user selection
while true; do
    echo "Enter the number of the backup to restore (1-${#backup_files[@]}) or 'q' to quit:"
    read -r selection
    
    if [ "$selection" = "q" ] || [ "$selection" = "Q" ]; then
        print_status "Restore cancelled by user."
        exit 0
    fi
    
    # Validate selection
    if [[ "$selection" =~ ^[0-9]+$ ]] && [ "$selection" -ge 1 ] && [ "$selection" -le "${#backup_files[@]}" ]; then
        selected_index=$((selection-1))
        selected_backup="${backup_files[$selected_index]}"
        break
    else
        print_error "Invalid selection. Please enter a number between 1 and ${#backup_files[@]} or 'q' to quit."
    fi
done

# Confirm selection
selected_filename=$(basename "$selected_backup")
print_warning "You selected: $selected_filename"
echo "Are you sure you want to restore this backup? (yes/no)"
read -r confirmation

if [[ ! "$confirmation" =~ ^[Yy][Ee][Ss]$ ]]; then
    print_status "Restore cancelled by user."
    exit 0
fi

print_status "Starting restore process..."

# Stop API and WebUI containers to prevent data corruption
print_status "Stopping API and WebUI containers..."
if docker ps | grep -q "benchmarkinator-api"; then
    if docker stop benchmarkinator-api benchmarkinator-webui 2>/dev/null; then
        print_success "Containers stopped successfully"
    else
        print_warning "Failed to stop some containers, continuing anyway..."
    fi
else
    print_status "API and WebUI containers are not running"
fi

# Check if MySQL container is running
if ! docker ps | grep -q "benchmarkinator-db"; then
    print_error "MySQL container 'benchmarkinator-db' is not running!"
    print_error "Please start the database first: docker compose up -d benchmarkinator-db"
    exit 1
fi

# Prepare the backup file for restoration
restore_file="$selected_backup"
if [[ "$selected_backup" == *.gz ]]; then
    print_status "Decompressing backup file..."
    temp_file="/tmp/restore_$(basename "$selected_backup" .gz)"
    if gunzip -c "$selected_backup" > "$temp_file"; then
        restore_file="$temp_file"
        print_success "Backup decompressed successfully"
    else
        print_error "Failed to decompress backup file!"
        exit 1
    fi
fi

# Drop and recreate database
print_status "Preparing database for restore..."
print_warning "This will delete all existing data in the database!"

# Drop all tables (safer than dropping the entire database)
print_status "Dropping existing tables..."
docker exec benchmarkinator-db mysql -u "$MYSQL_USER" -p"$MYSQL_PASSWORD" -e "
    SET FOREIGN_KEY_CHECKS = 0;
    DROP TABLE IF EXISTS benchmarkresult, benchmark, benchmarktarget, config, os, disk, ram, motherboard, motherboardchipset, motherboardmanufacturer, gpu, gpumodel, gpuvramtype, gpubrand, gpumanufacturer, cpu, cpufamily, cpubrand, settings;
    SET FOREIGN_KEY_CHECKS = 1;
" "$MYSQL_DATABASE" 2>/dev/null || print_warning "Some tables may not have existed"

# Restore the backup
print_status "Restoring database from backup..."
if docker exec -i benchmarkinator-db mysql -u "$MYSQL_USER" -p"$MYSQL_PASSWORD" "$MYSQL_DATABASE" < "$restore_file"; then
    print_success "Database restored successfully!"
else
    print_error "Failed to restore database!"
    # Clean up temp file if it was created
    if [ "$restore_file" != "$selected_backup" ] && [ -f "$restore_file" ]; then
        rm -f "$restore_file"
    fi
    exit 1
fi

# Clean up temp file if it was created
if [ "$restore_file" != "$selected_backup" ] && [ -f "$restore_file" ]; then
    rm -f "$restore_file"
fi

# Restart API and WebUI containers
print_status "Starting API and WebUI containers..."
if docker compose up -d benchmarkinator-api benchmarkinator-webui; then
    print_success "Containers started successfully!"
else
    print_warning "Failed to start some containers. You may need to start them manually:"
    print_warning "docker compose up -d"
fi

# Show restore summary
print_success "Restore completed successfully!"
echo ""
print_status "Restore Summary:"
echo "  Restored from: $selected_filename"
echo "  Database: $MYSQL_DATABASE"
echo "  Timestamp: $(date)"
echo ""
print_status "Services status:"
echo "  Database: $(docker ps --filter name=benchmarkinator-db --format 'table {{.Status}}' | tail -n +2)"
echo "  API: $(docker ps --filter name=benchmarkinator-api --format 'table {{.Status}}' | tail -n +2)"
echo "  WebUI: $(docker ps --filter name=benchmarkinator-webui --format 'table {{.Status}}' | tail -n +2)"
echo ""
print_status "You can now access the web UI at: http://localhost:4000"
