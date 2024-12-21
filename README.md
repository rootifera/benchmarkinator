
# Benchmarkinator - A Benchmark Management Tool

Benchmarkinator is a simple tool for managing benchmarks. It allows you to create hardware configurations, add benchmarks, and store results. You can later view and compare these results.

## What is Benchmarkinator?

Benchmarkinator consists of three main components:

- **Backend**: A FastAPI Python application
- **Database**: MySQL
- **Frontend**: Tooljet

I used Tooljet for the frontend because I don’t have the skills to create a web UI, and I don’t have anyone with enough free time to help. If you think this tool would be useful and feel like building a frontend, feel free to contribute — I’d be happy to help however I can.

## Why was Benchmarkinator created?

I have a large collection of computer hardware (mostly from the 90s) that I enjoy testing. However, I often run a test, see the score, nod in satisfaction, and then move on. I decided it would be better to save these results and compare them over time. You can certainly use this application with more recent hardware too.

## Getting Started

Starting the application is simple:

```bash
docker compose up -d
```

Once everything is up and running, access the application at:

```
http://YOUR_DOCKER_HOST_IP/applications/benchmarkinator-webadmin
```

In the future, I plan to set up a proper reverse proxy for Tooljet. However, since this application is designed for local (LAN) use and lacks authentication, I think it’s acceptable for now to access it this way. (I’m not lazy — I’m just done with frontend work for now!)

You can also access the Swagger UI for the API container at:

```
http://YOUR_DOCKER_HOST_IP:12345/docs
```

## How to Use

The logic of the application is straightforward, but bear with me as I explain the process. The workflow involves creating hardware configurations, adding benchmarks, and then saving the results.

### Step 1: Create Hardware Configurations

To create configurations, you’ll need to specify a CPU, GPU, Motherboard, RAM, Disk, and OS. For example:

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

These configurations represent the PCs on which you’ll run benchmarks.

### Step 2: Add Benchmarks

Next, you can add benchmarks to the system:

- **Benchmark**: 3DMark99 (Target: GPU)
- **Benchmark**: 3DMark2000 (Target: GPU)
- **Benchmark**: Prime95 (Target: CPU)

### Step 3: Run Benchmarks and Enter Results

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

As you accumulate results, you’ll be able to compare them in various ways. For example, you can filter by CPU and view performance across different setups. The same can be done for GPUs, hardware configurations, or CPU & GPU combinations.

> **Note**: This is a homemade application, and I take no responsibility for any damage caused by its use. However, if you manage to cause an issue, let me know — it would make for a funny story!

If you think you can improve the frontend, feel free to reach out.

## TODO

- I will provide SQL files to give you a starting point with CPU Brands, Families, GPU Brands, Manufacturers, Models, etc. These will save you time by allowing you to select from a list.
- I have tested backups, but I still need to test the restore process.

## FAQ

**Q**: This could have been an Excel sheet. Why did you make something like this?  
**A**: I thought it would be simpler to make a dedicated tool. I was wrong.

**Q**: Your code isn’t great, and I’m sure most of it is from ChatGPT. What kind of developer are you?  
**A**: I’m not really a developer — I’m a Linux/Cloud infrastructure guy with basic programming skills. If you can improve the code, feel free to contribute.

**Q**: Can I take the code, make it better, and share it?  
**A**: Sure! As long as the result is a good benchmark management tool, I’m happy with that.

**Q**: Wait, did you realize the `benchmarkinator-web` container is over 5GB?  
**A**: Yes, I’m aware. Until I come up with a better solution, this is what I can offer. Apologies for the size!
