# Benchmarkinator

**A comprehensive benchmark management system for hardware testing and comparison**

![Benchmarkinator](https://img.shields.io/badge/version-1.0.0-blue.svg)
![Docker](https://img.shields.io/badge/docker-ready-2496ED.svg?logo=docker)
![License](https://img.shields.io/badge/license-MIT-green.svg)

## 🎯 What is Benchmarkinator?

Benchmarkinator is a powerful tool designed for hardware enthusiasts, system builders, and performance testers who need to track, compare, and analyze benchmark results across different hardware configurations. Whether you're testing vintage hardware from the 90s or the latest components, Benchmarkinator helps you organize and visualize your performance data.

### 🌟 Key Features

- **📊 Modern Web Interface**: Clean, responsive dashboard with dark mode support
- **🔧 Hardware Management**: Comprehensive database of CPUs, GPUs, motherboards, RAM, and storage
- **⚡ Benchmark Tracking**: Record and compare results from any benchmark software
- **📈 Data Visualization**: Interactive charts and graphs for performance analysis
- **🔒 Secure Access**: Role-based authentication with API key protection
- **💾 Automated Backups**: Daily database backups with easy restoration
- **🌐 REST API**: Full programmatic access for integration and automation
- **📱 Mobile Friendly**: Responsive design works on all devices

## 🚀 Quick Start

### One-Command Setup

Get Benchmarkinator running in minutes:

```bash
./setup.sh
```

The setup script will guide you through:
- ✅ Secure credential generation
- ✅ Hardware data configuration
- ✅ Backup system setup
- ✅ Container building
- ✅ Application startup

### Access Your System

Once running, access Benchmarkinator at:
- **Web Interface**: http://localhost:4000
- **API Documentation**: http://localhost:12345/docs

## 🖥️ Web Interface Overview

### Dashboard
Your central command center featuring:
- **System Statistics**: Overview of hardware, benchmarks, and results
- **Recent Activity**: Latest benchmark runs and system changes
- **Quick Actions**: Fast access to common tasks
- **Performance Trends**: Visual indicators of system growth

### Hardware Components
Manage your hardware database:

#### CPUs
- **Brands**: Intel, AMD, and more
- **Families**: Core i7, Ryzen, Athlon, etc.
- **Models**: Specific processor models with clock speeds
- **Specifications**: Base clock, boost clock, core count, cache

#### GPUs
- **Manufacturers**: NVIDIA, AMD, 3DFX, and others
- **Models**: From vintage Voodoo cards to modern RTX series
- **VRAM**: Memory type and capacity tracking
- **Performance Tiers**: Classification for easy comparison

#### Motherboards
- **Chipsets**: Intel, AMD, and legacy chipset support
- **Form Factors**: ATX, micro-ATX, and vintage form factors
- **Socket Types**: CPU socket compatibility tracking

#### Memory & Storage
- **RAM Types**: SDRAM, DDR, DDR2, DDR3, DDR4, DDR5
- **Storage**: HDD, SSD, and legacy storage types
- **Capacity Tracking**: Size and speed specifications

### Test Systems
Create complete hardware configurations:

- **System Profiles**: Name and describe your test rigs
- **Component Selection**: Choose CPU, GPU, motherboard, RAM, storage
- **Operating Systems**: Track OS versions and configurations
- **Notes**: Add custom notes and specifications

### Benchmarks
Organize your testing suite:

- **Benchmark Types**: 3DMark, Prime95, custom tests, and more
- **Target Hardware**: Specify what each benchmark tests (CPU, GPU, system)
- **Categories**: Organize by type, era, or purpose
- **Documentation**: Add descriptions and testing procedures

### Results
View and analyze your performance data:

- **Result Entry**: Record scores with timestamps and notes
- **Comparison Tools**: Side-by-side performance analysis
- **Trend Analysis**: Track performance over time
- **Export Options**: Download data for external analysis

## 📊 Use Cases

### Vintage Hardware Testing
Perfect for retro computing enthusiasts:
- **90s Hardware**: Track performance of classic components
- **Legacy Benchmarks**: 3DMark99, Quake benchmarks, and more
- **Historical Comparison**: See how old hardware performs today
- **Collection Management**: Organize large hardware collections

### Modern System Building
Ideal for current hardware testing:
- **Component Comparison**: Compare CPUs, GPUs, and configurations
- **Overclocking Results**: Track performance gains from tuning
- **System Optimization**: Find the best configurations
- **Performance Validation**: Verify manufacturer claims

### Professional Testing
Suitable for system integrators and reviewers:
- **Client Documentation**: Track system performance for customers
- **Review Data**: Organize benchmark results for articles
- **Quality Assurance**: Ensure consistent performance across builds
- **Historical Records**: Maintain long-term performance databases

## 🔧 Advanced Features

### API Integration
Full REST API for automation and integration:

```bash
# Get all CPUs
curl -H "X-API-Key: YOUR_KEY" http://localhost:12345/api/cpu/

# Add a new benchmark result
curl -X POST -H "X-API-Key: YOUR_KEY" \
     -H "Content-Type: application/json" \
     -d '{"benchmark_id": 1, "config_id": 1, "result": 1500}' \
     http://localhost:12345/api/benchmark_results/
```

### Data Management
- **Import/Export**: CSV and JSON data exchange
- **Backup System**: Automated daily backups with retention
- **Restore Functionality**: Easy recovery from any backup point
- **Data Validation**: Ensure data integrity and consistency

### Customization
- **Hardware Eras**: Pre-loaded data for different time periods
- **Custom Fields**: Add your own specifications and notes
- **Flexible Configuration**: Adapt to your specific testing needs
- **Theme Support**: Light and dark mode interfaces

## 🛠️ Installation & Setup

### Prerequisites
- Docker and Docker Compose
- 2GB RAM minimum
- 5GB disk space

### Automated Installation
```bash
# Clone the repository
git clone https://github.com/your-repo/benchmarkinator.git
cd benchmarkinator

# Run the setup script
./setup.sh
```

### Manual Installation
```bash
# Copy environment template
cp env.example .env

# Edit configuration
nano .env

# Build and start
docker compose build
docker compose up -d
```

## 📚 Hardware Data

Benchmarkinator includes pre-loaded hardware data:

### Retro Era (up to 2005)
- Classic CPUs: Pentium, Athlon, Celeron
- Vintage GPUs: 3DFX Voodoo, early NVIDIA, ATI
- Legacy motherboards and chipsets
- Period-appropriate RAM and storage

### Extended Retro (up to 2008)
- Early dual-core processors
- DirectX 9/10 era graphics cards
- DDR2 memory systems
- SATA storage introduction

### Modern Era (current)
- Multi-core processors
- Modern graphics architectures
- DDR4/DDR5 memory
- NVMe storage systems

## 🔒 Security & Authentication

> **⚠️ IMPORTANT SECURITY NOTICE**
> 
> **This application is designed for personal LAN usage only. Do NOT expose it to the public internet.** The authentication system is frontend-based and not suitable for public deployment. Use only on trusted local networks.

### Web Interface
- **Admin Authentication**: Secure login with configurable credentials
- **Session Management**: Persistent login across browser sessions
- **Public Access**: Results page accessible without login
- **LAN-Only Design**: Intended for trusted local network environments

### API Security
- **API Key Authentication**: Secure programmatic access
- **Rate Limiting**: Protection against abuse
- **CORS Configuration**: Controlled cross-origin access
- **Local Network Only**: Not designed for public internet exposure

## 📈 Performance & Scalability

### Database
- **MySQL 8.4**: Robust, scalable database engine
- **Optimized Queries**: Fast data retrieval and analysis
- **Indexing**: Efficient search and filtering
- **Connection Pooling**: Optimal resource utilization

### Web Interface
- **React 18**: Modern, fast user interface
- **Responsive Design**: Works on all screen sizes
- **Progressive Loading**: Smooth user experience
- **Caching**: Reduced server load and faster responses

## 🆘 Support & Troubleshooting

### Common Issues

**Can't access the web interface?**
- Check if containers are running: `docker compose ps`
- Verify port 4000 is available
- Check firewall settings

**Database connection errors?**
- Ensure MySQL container is healthy: `docker compose logs benchmarkinator-db`
- Verify credentials in `.env` file
- Check database initialization

**Backup/restore issues?**
- Verify backup directory permissions
- Check available disk space
- Ensure containers are stopped during restore

### Getting Help
- **Documentation**: Check the `/docs` directory
- **API Reference**: Visit http://localhost:12345/docs
- **Logs**: Use `docker compose logs` for debugging
- **Issues**: Report problems on GitHub

## 🤝 Contributing

We welcome contributions! Whether you're:
- **Adding Hardware Data**: Submit new component databases
- **Improving Features**: Enhance existing functionality
- **Bug Fixes**: Help resolve issues
- **Documentation**: Improve guides and examples

### Development Setup
```bash
# Clone and setup
git clone https://github.com/your-repo/benchmarkinator.git
cd benchmarkinator
./setup.sh

# Development mode
docker compose -f docker-compose.dev.yml up -d
```

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Hardware Community**: Thanks to all the enthusiasts who provided hardware data
- **Open Source**: Built on amazing open source technologies
- **Contributors**: Everyone who has helped improve Benchmarkinator

---

**Ready to start tracking your hardware performance? Run `./setup.sh` and begin your benchmarking journey!** 🚀