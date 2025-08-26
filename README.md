
# Benchmarkinator - A Benchmark Management API

Benchmarkinator is a simple tool for managing benchmarks. It allows you to create hardware configurations, add benchmarks, and store results. You can later view and compare these results through the REST API.

## What is Benchmarkinator?

Benchmarkinator consists of two main components:

- **Backend**: A FastAPI Python application
- **Database**: MySQL

This is now a pure API solution that provides REST endpoints for all benchmark management operations.

## Why was Benchmarkinator created?

I have a large collection of computer hardware (mostly from the 90s) that I enjoy testing. However, I often run a test, see the score, nod in satisfaction, and then move on. I decided it would be better to save these results and compare them over time. You can certainly use this application with more recent hardware too.

## Getting Started

Starting the application is simple:

```bash
docker compose up -d
```

Once everything is up and running, access the API at:

```
http://YOUR_DOCKER_HOST_IP:12345
```

You can access the Swagger UI for the API at:

```
http://YOUR_DOCKER_HOST_IP:12345/docs
```

## API Authentication

The API requires authentication using an API key. The default development key is `benchmarkinator-dev-key-2024`. Include this key in your requests using the `X-API-Key` header:

```bash
curl -H "X-API-Key: benchmarkinator-dev-key-2024" \
     http://YOUR_DOCKER_HOST_IP:12345/api/cpu/
```

**Note**: Change the API key in production by setting the `API_KEY` environment variable in docker-compose.yml.

## How to Use

The logic of the application is straightforward, but bear with me as I explain the process. The workflow involves creating hardware components, creating hardware configurations, adding benchmarks, and then saving the results.

### Step 1: Create Hardware Components

First, you'll need to create the individual hardware components:

```bash
# Create a CPU brand
curl -X POST "http://YOUR_DOCKER_HOST_IP:12345/api/cpu/brand/" \
     -H "X-API-Key: benchmarkinator-dev-key-2024" \
     -H "Content-Type: application/json" \
     -d '{"name": "AMD"}'

# Create a CPU family
curl -X POST "http://YOUR_DOCKER_HOST_IP:12345/api/cpu/family/" \
     -H "X-API-Key: benchmarkinator-dev-key-2024" \
     -H "Content-Type: application/json" \
     -d '{"name": "Athlon XP", "brand_id": 1}'

# Create a CPU
curl -X POST "http://YOUR_DOCKER_HOST_IP:12345/api/cpu/" \
     -H "X-API-Key: benchmarkinator-dev-key-2024" \
     -H "Content-Type: application/json" \
     -d '{"name": "Athlon XP 1500+", "family_id": 1, "base_clock": 1333}'
```

### Step 2: Create Hardware Configurations

To create configurations, you'll need to specify a CPU, GPU, Motherboard, RAM, Disk, and OS. For example:

**Config Name**: `MyRetroPC1`
- CPU: AMD Athlon XP 1500+
- GPU: ELSA NVIDIA TNT2 M64 32MB
- Motherboard: ECS K7S5A
- RAM Type: SDRAM
- RAM Size: 32MB
- Disk: IDE HDD 5400RPM
- OS: Win98

**Config Name**: `MyRetroPC2`
- CPU: Intel Pentium 4 1600MHz
- GPU: 3DFX Voodoo 3
- Motherboard: Gigabyte GA-8IK1100
- RAM Type: SDRAM
- RAM Size: 128MB
- Disk: IDE HDD 7200RPM
- OS: Win98

These configurations represent the PCs on which you'll run benchmarks.

### Step 3: Add Benchmarks

Next, you can add benchmarks to the system:

- **Benchmark**: 3DMark99 (Target: GPU)
- **Benchmark**: 3DMark2000 (Target: GPU)
- **Benchmark**: Prime95 (Target: CPU)

### Step 4: Run Benchmarks and Enter Results

Once your benchmarks are added, you can run them on your hardware configurations and enter the results:

**Benchmark**: 3DMark2000
- **Config**: MyRetroPC1
- **Result**: 1521
- **Date**: 11/11/2024
- **Notes**: This is the average of 3 different runs.

**Benchmark**: 3DMark2000
- **Config**: MyRetroPC2
- **Result**: 3712
- **Date**: 12/11/2024
- **Notes**: 2nd run crashed.

As you accumulate results, you'll be able to compare them in various ways. For example, you can filter by CPU and view performance across different setups. The same can be done for GPUs, hardware configurations, or CPU & GPU combinations.

> **Note**: This is a homemade application, and I take no responsibility for any damage caused by its use. However, if you manage to cause an issue, let me know — it would make for a funny story!

## API Endpoints

The application provides REST API endpoints for all operations:

- `/api/cpu` - CPU management
- `/api/gpu` - GPU management  
- `/api/motherboard` - Motherboard management
- `/api/ram` - RAM management
- `/api/disk` - Disk management
- `/api/oses` - Operating system management
- `/api/config` - Hardware configuration management
- `/api/benchmark` - Benchmark management
- `/api/benchmark_results` - Benchmark results management

## TODO

- SQL Import doesn't work. I need to fix that. 

## FAQ

**Q**: This could have been an Excel sheet. Why did you make something like this?  
**A**: I thought it would be simpler to make a dedicated tool. I was wrong.

**Q**: Your code isn't great, and I'm sure most of it is from ChatGPT. What kind of developer are you?  
**A**: I'm not really a developer — I'm a Linux/Cloud infrastructure guy with basic programming skills. If you can improve the code, feel free to contribute.

**Q**: Can I take the code, make it better, and share it?  
**A**: Sure! As long as the result is a good benchmark management tool, I'm happy with that.
