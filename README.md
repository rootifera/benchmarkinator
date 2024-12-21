# Benchmarkinator -- A benchmark management tool

This is a fairly simple tool for managing benchmarks. You can create some hardware configurations, add benchmarks, and then add the results. Later you can see or compare results. 


## What?

The application (at the moment) is made from three parts. A FastAPI python application as backend, MySQL as database and tooljet for frontend. I had to use tooljet for frontend because I don't have the skills for creating a webUI and I don't have anyone with enough free time to help me (if you see this application would be useful for yourself or someone and feel like creating a FE please feel free to do so, I'm happy to help as much as I can). 

## Why?

I have a large collection of computer hardware (mainly from 90s). I enjoy testing them and see how they perform. But often I do a single test, I see the score, smile and nod and then move on. I decided it would be better to save these results and compare against each other. You can probably use this application for recent hardware too. 

## How to start

Staring the application is simple:

    docker compose up -d

And once everything is up and running you can access the application as

    http://YOUR_DOCKER_HOST_IP/applications/benchmarkinator-webadmin

Later I'm planning to put a proper reverse proxy container on front of the tooljet but I think since this application is made to be used locally (at least within your LAN) and not suitable for being public (there's no authentication), I thought it would be OK to use it like that. (I'm not lazy, I just had enough of the FE and I really hate it). 

I left the SwaggerUI for the API container and you should be able to access it via

    http://YOUR_DOCKER_HOST_IP:12345/docs


## How to use

This part is a little complicated but bear with me. Logic is fairly straight forward. We will create hardware configs, we will create benchmarks and then we will save our results. 

In order to create configs you will need to add CPU, GPU, Motherboard, RAM, Disk and OS. Let's have an example. 

    Config Name: MyRetroPC1
    CPU:  AMD Athlon XP 1500+ 
    GPU: ELSA NVIDIA TNT2 M64 32MB
    Motherboard: ECS K7S5A
    RAM Type: SDRAM
    RAM Size: 32MB
    DISK: IDE HDD 5400RPM
    OS: Win98

    Config Name: MyRetroPC2
    CPU:  Intel Pentium 4 1600Mhz 
    GPU: 3DFX Voodoo 3
    Motherboard: Gigabyte GA-8IK1100
    RAM Type: SDRAM
    RAM Size: 128MB
    DISK: IDE HDD 7200RPM
    OS: Win98

You can see the "hardware config" as a PC we can run benchmarks on. 

Next we would add benchmarks. 

    Benchmark: 3DMark99
    Target: GPU
    
    Benchmark: 3DMark2000
    Target: GPU
    
    Benchmark: Prime95
    Target: CPU

Finally we would run the benchmarks on the PC's and enter the results

    Benchmark: 3DMark2000
    Config: MyRetroPC1
    Result: 1521
    Date: 11/11/2024
    Notes: This is the average of 3 different runs.
    
    Benchmark: 3DMark2000
    Config: MyRetroPC2
    Result: 3712
    Date: 12/11/2024
    Notes: 2nd run crashed. 

Eventually you would have a database of each benchmark result for every config you created. You can filter results in different ways. For example you can select a CPU and see how it performed in different setups. You can do the same with GPUs, Configs or CPU&GPU combinations. 

As usual, this is a homemade application with no warranties. If you cause any damage with it to anyone or anything, it's not my responsibility but please tell me how did you manage causing an issue. Would be a funny story.

And if you think you can make a better FE, please let me know. 

## TODO:

- I will provide you with SQL files, so you can have some starting point. Probably CPU Brands and Family, GPU Brands, Manufacturers, Models etc. It would save you some time, so you can select stuff from the list and carry on.  
- I tested the backup but didn't test the restore yet. That needs to be done. 


## FAQ

Q: This could have been an Excel sheet. Why did you make something like that. \
A: I thought it would be simpler if I did that. I was wrong. 

Q: Your code sucks and probably most of it is from chatGPT. What kind of a developer are you?\
A: I'm not. I'm just a Linux/Cloud infra guy with basic programming skills. If you can make it better, the code is open.

Q: Can I take this code make it better and share?\
A: Sure, as long as we end up with a good benchmark manager tool, I absolutely don't care.

Q: Wait, did you realize the benchmarkinator-web container is 5GB+! 
A: Yeah, I know. I told you it's not the best. Until I figure out something better, this is what I can give you. Sorry!

