#!/bin/bash

# Benchmarkinator Database Backup Script
# This script creates automated backups of the MySQL database

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
RETENTION_DAYS=${BACKUP_RETENTION_DAYS:-30}
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="benchmarkinator_backup_$TIMESTAMP.sql"

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

# Create backup directory if it doesn't exist
mkdir -p "$BACKUP_DIR"

print_status "Starting database backup..."
print_status "Database: $MYSQL_DATABASE"
print_status "User: $MYSQL_USER"
print_status "Backup file: $BACKUP_FILE"
print_status "Backup directory: $BACKUP_DIR"

# Check if MySQL container is running
if ! docker ps | grep -q "benchmarkinator-db"; then
    print_error "MySQL container 'benchmarkinator-db' is not running!"
    print_error "Please start the benchmarkinator services first: docker compose up -d"
    exit 1
fi

# Create the backup
print_status "Creating database backup..."
if docker exec benchmarkinator-db mysqldump \
    -u "$MYSQL_USER" \
    -p"$MYSQL_PASSWORD" \
    --single-transaction \
    --routines \
    --triggers \
    --events \
    --hex-blob \
    --complete-insert \
    --add-drop-table \
    --add-locks \
    --disable-keys \
    --extended-insert \
    --quick \
    --lock-tables=false \
    "$MYSQL_DATABASE" > "$BACKUP_DIR/$BACKUP_FILE"; then
    
    print_success "Database backup created successfully: $BACKUP_FILE"
    
    # Compress the backup
    print_status "Compressing backup..."
    if gzip "$BACKUP_DIR/$BACKUP_FILE"; then
        print_success "Backup compressed: $BACKUP_FILE.gz"
        BACKUP_FILE="$BACKUP_FILE.gz"
    else
        print_warning "Failed to compress backup, keeping uncompressed version"
    fi
    
    # Get backup file size
    backup_size=$(du -h "$BACKUP_DIR/$BACKUP_FILE" | cut -f1)
    print_success "Backup size: $backup_size"
    
else
    print_error "Failed to create database backup!"
    exit 1
fi

# Clean up old backups
print_status "Cleaning up backups older than $RETENTION_DAYS days..."
deleted_count=0

# Find and delete old backup files
while IFS= read -r -d '' file; do
    if rm "$file"; then
        deleted_count=$((deleted_count + 1))
        print_status "Deleted old backup: $(basename "$file")"
    fi
done < <(find "$BACKUP_DIR" -name "benchmarkinator_backup_*.sql*" -type f -mtime +$RETENTION_DAYS -print0)

if [ $deleted_count -eq 0 ]; then
    print_status "No old backups to clean up"
else
    print_success "Cleaned up $deleted_count old backup(s)"
fi

# Show backup summary
print_status "Backup Summary:"
echo "  Backup file: $BACKUP_FILE"
echo "  Location: $BACKUP_DIR/$BACKUP_FILE"
echo "  Size: $backup_size"
echo "  Retention: $RETENTION_DAYS days"
echo "  Timestamp: $(date)"

# List all current backups
backup_count=$(find "$BACKUP_DIR" -name "benchmarkinator_backup_*.sql*" -type f | wc -l)
print_status "Total backups in directory: $backup_count"

# Show recent backups
print_status "Recent backups:"
ls -laht "$BACKUP_DIR"/benchmarkinator_backup_*.sql* 2>/dev/null | head -5 || print_warning "No backup files found"

print_success "Backup process completed successfully!"

# Optional: Send notification (uncomment if you want email notifications)
# if command -v mail >/dev/null 2>&1; then
#     echo "Benchmarkinator backup completed successfully at $(date)" | mail -s "Backup Success" admin@yourdomain.com
# fi
