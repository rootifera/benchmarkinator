#!/usr/bin/env python3
"""Populate Benchmarkinator with deterministic demo hardware and results."""

from __future__ import annotations

import argparse
import json
import random
import sys
from datetime import datetime, timedelta, timezone
from pathlib import Path
from typing import Iterable

from sqlalchemy import delete
from sqlmodel import Session, select

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from database import engine, init_db
from models.benchmark import Benchmark, BenchmarkTarget
from models.benchmark_results import BenchmarkResult
from models.config import Config
from models.cpu import CPU, CPUBrand, CPUFamily
from models.disk import Disk
from models.gpu import GPU, GPUBrand, GPUManufacturer, GPUModel, GPUVRAMType
from models.motherboard import Motherboard, MotherboardChipset, MotherboardManufacturer
from models.oses import OS
from models.ram import RAM

DEMO_PREFIX = "Demo - "
DEMO_SERIAL_PREFIX = "DEMO-"


CPU_ROWS = [
    ("Intel", "486", "DX2", "66MHz", 1, 0.18),
    ("Intel", "Pentium", "P54C", "100MHz", 1, 0.28),
    ("Intel", "Pentium MMX", "MMX", "233MHz", 1, 0.40),
    ("AMD", "K6-2", "K6-2", "400MHz", 1, 0.52),
    ("Intel", "Pentium II", "Deschutes", "400MHz", 1, 0.58),
    ("Intel", "Pentium III", "Coppermine", "700MHz", 1, 0.72),
    ("AMD", "Athlon", "Thunderbird", "1000MHz", 1, 0.82),
    ("Intel", "Pentium 4", "Northwood", "2.4GHz", 1, 1.05),
    ("AMD", "Athlon 64", "ClawHammer", "3200+", 1, 1.20),
    ("Intel", "Core 2 Duo", "Conroe", "E6600 2.4GHz", 2, 1.55),
    ("Intel", "Core i7", "Bloomfield", "920 2.66GHz", 4, 2.10),
    ("AMD", "Ryzen", "Zen 2", "5 3600 3.6GHz", 6, 3.20),
]

GPU_ROWS = [
    ("Generic", "None", "VLB VGA", "1MB", "DRAM", 0.05),
    ("S3", "S3", "Trio64V+", "2MB", "DRAM", 0.08),
    ("Matrox", "Matrox", "Millennium II", "4MB", "WRAM", 0.12),
    ("3dfx", "3dfx", "Voodoo Graphics", "4MB", "EDO", 0.30),
    ("NVIDIA", "NVIDIA", "RIVA TNT2 M64", "32MB", "SDR", 0.44),
    ("Leadtek", "NVIDIA", "TNT2 Ultra", "32MB", "SDR", 0.58),
    ("ATI", "ATI", "Radeon 8500", "64MB", "DDR", 0.82),
    ("NVIDIA", "NVIDIA", "GeForce4 Ti 4200", "128MB", "DDR", 1.05),
    ("ATI", "ATI", "Radeon 9800 Pro", "128MB", "DDR", 1.25),
    ("NVIDIA", "NVIDIA", "GeForce 6800 GT", "256MB", "GDDR3", 1.55),
    ("NVIDIA", "NVIDIA", "GeForce 8800 GTX", "768MB", "GDDR3", 2.00),
    ("EVGA", "NVIDIA", "GeForce GTX 1080", "8GB", "GDDR5X", 3.20),
]

MOTHERBOARD_ROWS = [
    ("ASUS", "VL/I-486SV2GX4", "SiS 496"),
    ("Intel", "Advanced/EV", "Intel 430FX"),
    ("ASUS", "P5A", "ALI Aladdin V"),
    ("Abit", "BH6", "Intel 440BX"),
    ("Gigabyte", "GA-6BXC", "Intel 440BX"),
    ("ASUS", "A7V", "VIA KT133"),
    ("ASUS", "P4PE", "Intel 845PE"),
    ("MSI", "K8N Neo", "NVIDIA nForce3"),
    ("Gigabyte", "GA-965P-DS3", "Intel P965"),
    ("ASUS", "P6T Deluxe", "Intel X58"),
    ("MSI", "B450 Tomahawk Max", "AMD B450"),
]

RAM_ROWS = ["FPM 70ns", "EDO 60ns", "SDRAM PC100", "SDRAM PC133", "DDR 400", "DDR2 800", "DDR3 1600", "DDR4 3200"]
DISK_ROWS = ["420MB IDE HDD", "2.1GB IDE HDD", "20GB IDE HDD", "80GB IDE HDD", "160GB SATA HDD", "500GB SATA HDD", "Samsung 970 EVO 1TB"]
OS_ROWS = ["MS-DOS 6.22", "Windows 95 OSR2", "Windows 98 SE", "Windows 2000 SP4", "Windows XP SP3", "Windows 7 SP1", "Windows 10 22H2"]

BENCHMARK_ROWS = [
    ("CPU", "Dhrystone 2.1", False, 0.0),
    ("CPU", "Whetstone", False, 0.0),
    ("CPU", "SuperPi 1M", True, 0.45),
    ("CPU", "7-Zip Compression", False, 1.00),
    ("GPU", "Doom Timedemo", False, 0.0),
    ("GPU", "Quake Timedemo", False, 0.20),
    ("GPU", "Quake II Demo1", False, 0.45),
    ("GPU", "3DMark99", False, 0.40),
    ("GPU", "3DMark2000", False, 0.55),
    ("GPU", "3DMark2001 SE", False, 0.80),
    ("GPU", "3DMark03", False, 1.15),
    ("GPU", "AquaMark3", False, 1.05),
    ("Storage", "HD Tach Average Read", False, 0.30),
    ("Storage", "CrystalDiskMark Seq Read", False, 1.40),
]

SYSTEM_ROWS = [
    ("486 DX2 DOS Lab", 0, 0, 0, 0, 0, 0, "16MB", "MS-DOS baseline"),
    ("Pentium 100 Windows 95", 1, 1, 1, 1, 1, 1, "32MB", "Early Windows 95 reference"),
    ("Pentium MMX Matrox", 2, 2, 2, 2, 2, 2, "64MB", "Strong 2D card, light 3D"),
    ("K6-2 Voodoo", 3, 3, 2, 2, 3, 2, "128MB", "Glide-era gaming setup"),
    ("Pentium II 400 TNT2 M64", 4, 4, 3, 3, 4, 2, "128MB", "Budget AGP comparison"),
    ("Pentium III 700 TNT2 Ultra", 5, 5, 4, 3, 2, 3, "256MB", "Windows 98 high-end TNT2 run"),
    ("Athlon 1000 Radeon 8500", 6, 6, 5, 3, 3, 4, "512MB", "Early DirectX 8"),
    ("Pentium 4 Ti 4200", 7, 7, 6, 4, 4, 4, "512MB", "XP-era midrange"),
    ("Athlon 64 Radeon 9800 Pro", 8, 8, 7, 4, 4, 4, "1GB", "Fast AGP Windows XP"),
    ("Pentium 4 6800 GT", 7, 9, 6, 4, 4, 4, "1GB", "GPU-heavy P4 test"),
    ("Core 2 Duo 8800 GTX", 9, 10, 8, 5, 5, 5, "2GB", "Late XP/Windows 7 transition"),
    ("Core i7 920 GTX 1080", 10, 11, 9, 6, 6, 6, "12GB", "Deliberately mismatched modern GPU"),
    ("Ryzen 5 3600 GTX 1080", 11, 11, 10, 6, 6, 7, "32GB", "Modern reference"),
    ("Dual Pentium III Workstation", [5, 5], 5, 4, 4, 5, 2, "512MB", "Dual CPU demo system"),
    ("Dual Voodoo Test Bench", 3, [3, 3], 2, 2, 3, 2, "128MB", "Dual GPU demo system"),
]


def get_one(session: Session, model, *conditions):
    statement = select(model)
    for condition in conditions:
        statement = statement.where(condition)
    return session.exec(statement).first()


def get_or_create(session: Session, model, defaults: dict | None = None, **lookup):
    conditions = [getattr(model, key) == value for key, value in lookup.items()]
    existing = get_one(session, model, *conditions)
    if existing:
        return existing
    item = model(**lookup, **(defaults or {}))
    session.add(item)
    session.flush()
    return item


def reset_demo_data(session: Session) -> None:
    demo_configs = session.exec(select(Config).where(Config.name.startswith(DEMO_PREFIX))).all()
    demo_config_ids = [config.id for config in demo_configs if config.id is not None]
    if demo_config_ids:
        session.exec(delete(BenchmarkResult).where(BenchmarkResult.config_id.in_(demo_config_ids)))
        session.exec(delete(Config).where(Config.id.in_(demo_config_ids)))

    demo_benchmarks = session.exec(select(Benchmark).where(Benchmark.name.startswith(DEMO_PREFIX))).all()
    demo_benchmark_ids = [benchmark.id for benchmark in demo_benchmarks if benchmark.id is not None]
    if demo_benchmark_ids:
        session.exec(delete(BenchmarkResult).where(BenchmarkResult.benchmark_id.in_(demo_benchmark_ids)))
        session.exec(delete(Benchmark).where(Benchmark.id.in_(demo_benchmark_ids)))


def existing_user_data_count(session: Session) -> int:
    return (
        len(session.exec(select(Config).where(~Config.name.startswith(DEMO_PREFIX))).all())
        + len(session.exec(select(BenchmarkResult)).all())
    )


def as_list(value) -> list[int]:
    return value if isinstance(value, list) else [value]


def score_for(benchmark_name: str, cpu_power: float, gpu_power: float, disk_index: int, rng: random.Random) -> float:
    jitter = rng.uniform(0.92, 1.08)
    if benchmark_name == "Dhrystone 2.1":
        return round(6000 * cpu_power * jitter, 0)
    if benchmark_name == "Whetstone":
        return round(1700 * cpu_power * jitter, 0)
    if benchmark_name == "SuperPi 1M":
        return round((220 / max(cpu_power, 0.1)) * jitter, 2)
    if benchmark_name == "7-Zip Compression":
        return round(8200 * cpu_power * jitter, 0)
    if benchmark_name == "Doom Timedemo":
        return round(min(140, 32 + 95 * cpu_power) * jitter, 1)
    if benchmark_name == "Quake Timedemo":
        return round((18 + 75 * min(cpu_power, gpu_power + 0.35)) * jitter, 1)
    if benchmark_name == "Quake II Demo1":
        return round((22 + 105 * min(cpu_power, gpu_power + 0.2)) * jitter, 1)
    if benchmark_name == "3DMark99":
        return round(4700 * min(cpu_power * 0.85 + 0.15, gpu_power) * jitter, 0)
    if benchmark_name == "3DMark2000":
        return round(6800 * min(cpu_power, gpu_power) * jitter, 0)
    if benchmark_name == "3DMark2001 SE":
        return round(14500 * min(cpu_power * 0.95 + 0.1, gpu_power) * jitter, 0)
    if benchmark_name == "3DMark03":
        return round(10500 * min(cpu_power * 0.7 + 0.3, gpu_power) * jitter, 0)
    if benchmark_name == "AquaMark3":
        return round(52000 * min(cpu_power * 0.8 + 0.2, gpu_power) * jitter, 0)
    if benchmark_name == "HD Tach Average Read":
        return round((5 + disk_index * 9) * jitter, 1)
    if benchmark_name == "CrystalDiskMark Seq Read":
        return round((80 + disk_index * 155) * jitter, 0)
    return round(1000 * jitter, 0)


def benchmark_supported(benchmark_name: str, cpu_power: float, gpu_power: float, os_name: str, disk_index: int) -> bool:
    if benchmark_name in {"Dhrystone 2.1", "Whetstone", "Doom Timedemo"}:
        return True
    if benchmark_name == "SuperPi 1M":
        return os_name != "MS-DOS 6.22"
    if benchmark_name == "7-Zip Compression":
        return cpu_power >= 0.72 and os_name not in {"MS-DOS 6.22", "Windows 95 OSR2"}
    if benchmark_name in {"Quake Timedemo", "HD Tach Average Read"}:
        return cpu_power >= 0.28
    if benchmark_name == "Quake II Demo1":
        return cpu_power >= 0.40 and gpu_power >= 0.12
    if benchmark_name == "3DMark99":
        return cpu_power >= 0.40 and gpu_power >= 0.30 and os_name in {"Windows 98 SE", "Windows 2000 SP4", "Windows XP SP3"}
    if benchmark_name == "3DMark2000":
        return cpu_power >= 0.55 and gpu_power >= 0.44 and os_name in {"Windows 98 SE", "Windows 2000 SP4", "Windows XP SP3"}
    if benchmark_name == "3DMark2001 SE":
        return cpu_power >= 0.80 and gpu_power >= 0.82 and os_name in {"Windows 2000 SP4", "Windows XP SP3", "Windows 7 SP1"}
    if benchmark_name in {"3DMark03", "AquaMark3"}:
        return cpu_power >= 1.00 and gpu_power >= 1.05 and os_name in {"Windows XP SP3", "Windows 7 SP1", "Windows 10 22H2"}
    if benchmark_name == "CrystalDiskMark Seq Read":
        return disk_index >= 5 and os_name in {"Windows 7 SP1", "Windows 10 22H2"}
    return False


def seed_demo_data(session: Session, *, reset_demo: bool = False, append: bool = False) -> dict[str, int]:
    if reset_demo:
        reset_demo_data(session)
        session.flush()
    elif not append and existing_user_data_count(session) > 0:
        raise RuntimeError("Database is not empty. Use --append or --reset-demo.")

    cpu_brands = {name: get_or_create(session, CPUBrand, name=name) for name in sorted({row[0] for row in CPU_ROWS})}
    cpu_families = {}
    cpus = []
    for index, (brand_name, family_name, model, speed, cores, _power) in enumerate(CPU_ROWS, start=1):
        family = get_or_create(session, CPUFamily, name=family_name, cpu_brand_id=cpu_brands[brand_name].id)
        cpu_families[(brand_name, family_name)] = family
        serial = f"{DEMO_SERIAL_PREFIX}CPU-{index:03d}"
        cpu = get_one(session, CPU, CPU.serial == serial)
        if not cpu:
            cpu = CPU(model=model, speed=speed, core_count=cores, serial=serial, cpu_brand_id=cpu_brands[brand_name].id, cpu_family_id=family.id)
            session.add(cpu)
            session.flush()
        cpus.append(cpu)

    gpu_manufacturers = {name: get_or_create(session, GPUManufacturer, name=name) for name in sorted({row[0] for row in GPU_ROWS})}
    gpu_brands = {name: get_or_create(session, GPUBrand, name=name) for name in sorted({row[1] for row in GPU_ROWS})}
    vram_types = {name: get_or_create(session, GPUVRAMType, name=name) for name in sorted({row[4] for row in GPU_ROWS})}
    gpus = []
    for index, (manufacturer_name, brand_name, model_name, vram_size, vram_type_name, _power) in enumerate(GPU_ROWS, start=1):
        gpu_model = get_or_create(session, GPUModel, name=model_name, gpu_brand_id=gpu_brands[brand_name].id)
        serial = f"{DEMO_SERIAL_PREFIX}GPU-{index:03d}"
        gpu = get_one(session, GPU, GPU.serial == serial)
        if not gpu:
            gpu = GPU(
                vram_size=vram_size,
                serial=serial,
                gpu_manufacturer_id=gpu_manufacturers[manufacturer_name].id,
                gpu_brand_id=gpu_brands[brand_name].id,
                gpu_model_id=gpu_model.id,
                gpu_vram_type_id=vram_types[vram_type_name].id,
            )
            session.add(gpu)
            session.flush()
        gpus.append(gpu)

    motherboard_manufacturers = {name: get_or_create(session, MotherboardManufacturer, name=name) for name in sorted({row[0] for row in MOTHERBOARD_ROWS})}
    chipsets = {name: get_or_create(session, MotherboardChipset, name=name) for name in sorted({row[2] for row in MOTHERBOARD_ROWS})}
    motherboards = []
    for index, (manufacturer_name, model, chipset_name) in enumerate(MOTHERBOARD_ROWS, start=1):
        serial = f"{DEMO_SERIAL_PREFIX}MB-{index:03d}"
        board = get_one(session, Motherboard, Motherboard.serial == serial)
        if not board:
            board = Motherboard(
                model=model,
                manufacturer_id=motherboard_manufacturers[manufacturer_name].id,
                chipset_id=chipsets[chipset_name].id,
                serial=serial,
                notes="Demo seed motherboard",
            )
            session.add(board)
            session.flush()
        motherboards.append(board)

    ram_types = {name: get_or_create(session, RAM, name=name) for name in RAM_ROWS}
    disks = {name: get_or_create(session, Disk, name=name) for name in DISK_ROWS}
    oses = {name: get_or_create(session, OS, name=name) for name in OS_ROWS}

    targets = {target: get_or_create(session, BenchmarkTarget, name=target) for target, *_ in BENCHMARK_ROWS}
    benchmarks = {}
    for target_name, benchmark_name, lower_is_better, _minimum_power in BENCHMARK_ROWS:
        demo_name = f"{DEMO_PREFIX}{benchmark_name}"
        benchmark = get_one(
            session,
            Benchmark,
            Benchmark.name == demo_name,
            Benchmark.benchmark_target_id == targets[target_name].id,
        )
        if not benchmark:
            benchmark = Benchmark(name=demo_name, lower_is_better=lower_is_better, benchmark_target_id=targets[target_name].id)
            session.add(benchmark)
            session.flush()
        else:
            benchmark.lower_is_better = lower_is_better
        benchmarks[benchmark_name] = benchmark

    configs = []
    for name, cpu_indexes, gpu_indexes, board_index, disk_index, os_index, ram_index, ram_size, notes in SYSTEM_ROWS:
        cpu_ids = [cpus[index].id for index in as_list(cpu_indexes)]
        gpu_ids = [gpus[index].id for index in as_list(gpu_indexes)]
        config_name = f"{DEMO_PREFIX}{name}"
        config = get_one(session, Config, Config.name == config_name)
        values = {
            "cpu_id": cpu_ids[0],
            "cpu_quantity": len(cpu_ids),
            "cpu_component_ids": json.dumps(cpu_ids),
            "motherboard_id": motherboards[board_index].id,
            "gpu_id": gpu_ids[0],
            "gpu_quantity": len(gpu_ids),
            "gpu_component_ids": json.dumps(gpu_ids),
            "disk_id": disks[DISK_ROWS[disk_index]].id,
            "os_id": oses[OS_ROWS[os_index]].id,
            "ram_id": ram_types[RAM_ROWS[ram_index]].id,
            "ram_size": ram_size,
            "cpu_driver_version": "Demo CPU INF",
            "mb_chipset_driver_version": "Demo chipset package",
            "gpu_driver_version": "Demo display driver",
            "notes": notes,
        }
        if not config:
            config = Config(name=config_name, **values)
            session.add(config)
            session.flush()
        else:
            for key, value in values.items():
                setattr(config, key, value)
        configs.append((config, cpu_indexes, gpu_indexes, disk_index, OS_ROWS[os_index]))

    demo_config_ids = [config.id for config, *_ in configs]
    if demo_config_ids:
        session.exec(delete(BenchmarkResult).where(BenchmarkResult.config_id.in_(demo_config_ids)))
        session.flush()

    base_date = datetime(2026, 7, 1, 12, 0, tzinfo=timezone.utc)
    result_count = 0
    rng = random.Random(20260712)
    for system_index, (config, cpu_indexes, gpu_indexes, disk_index, os_name) in enumerate(configs):
        cpu_power = sum(CPU_ROWS[index][5] for index in as_list(cpu_indexes)) / len(as_list(cpu_indexes))
        if len(as_list(cpu_indexes)) > 1:
            cpu_power *= 1.45
        gpu_power = sum(GPU_ROWS[index][5] for index in as_list(gpu_indexes))
        if len(as_list(gpu_indexes)) > 1:
            gpu_power *= 0.82

        for benchmark_index, (target_name, benchmark_name, _lower_is_better, minimum_power) in enumerate(BENCHMARK_ROWS):
            if max(cpu_power, gpu_power) < minimum_power:
                continue
            if not benchmark_supported(benchmark_name, cpu_power, gpu_power, os_name, disk_index):
                continue

            score = score_for(benchmark_name, cpu_power, gpu_power, disk_index, rng)
            timestamp = base_date + timedelta(days=system_index, minutes=benchmark_index * 7)
            session.add(
                BenchmarkResult(
                    benchmark_id=benchmarks[benchmark_name].id,
                    config_id=config.id,
                    result=score,
                    timestamp=timestamp.isoformat().replace("+00:00", "Z"),
                    notes=f"Demo {target_name.lower()} run",
                )
            )
            result_count += 1

    session.commit()
    return {
        "cpus": len(cpus),
        "gpus": len(gpus),
        "motherboards": len(motherboards),
        "systems": len(configs),
        "benchmarks": len(benchmarks),
        "results": result_count,
    }


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Seed Benchmarkinator with deterministic demo data.")
    parser.add_argument("--append", action="store_true", help="Allow seeding when non-demo data already exists.")
    parser.add_argument("--reset-demo", action="store_true", help="Remove existing demo systems/results before seeding.")
    return parser.parse_args()


def main() -> int:
    args = parse_args()
    init_db()
    with Session(engine) as session:
        summary = seed_demo_data(session, reset_demo=args.reset_demo, append=args.append)

    print("[demo_data] Seed complete:")
    for key, value in summary.items():
        print(f"  {key}: {value}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
