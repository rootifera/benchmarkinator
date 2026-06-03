import pytest
from fastapi import HTTPException
from starlette.requests import Request

from models.benchmark import Benchmark, BenchmarkTarget
from models.benchmark_results import BenchmarkResult
from models.config import Config
from models.cpu import CPU, CPUBrand, CPUFamily
from models.disk import Disk
from models.gpu import GPU, GPUBrand, GPUManufacturer, GPUModel, GPUVRAMType
from models.motherboard import Motherboard, MotherboardChipset, MotherboardManufacturer
from models.oses import OS
from models.ram import RAM
from routers import benchmark as benchmark_router
from routers import benchmark_results, config, cpu, disk, gpu, motherboard, oses, ram
from utils import auth


def _create_referenced_graph(db):
    cpu_brand = cpu.create_cpu_brand(CPUBrand(name="Intel"), db)
    cpu_family = cpu.create_cpu_family(
        CPUFamily(name="Core", cpu_brand_id=cpu_brand.id),
        db,
    )
    cpu_entry = cpu.create_cpu(
        CPU(
            model="i7-8700K",
            speed="3.7GHz",
            core_count=6,
            cpu_brand_id=cpu_brand.id,
            cpu_family_id=cpu_family.id,
        ),
        db,
    )

    gpu_manufacturer = gpu.create_gpu_manufacturer(GPUManufacturer(name="ASUS"), db)
    gpu_brand = gpu.create_gpu_brand(GPUBrand(name="NVIDIA"), db)
    gpu_model = gpu.create_gpu_model(
        GPUModel(name="GTX 1080", gpu_brand_id=gpu_brand.id),
        db,
    )
    gpu_vram_type = gpu.create_gpu_vram_type(GPUVRAMType(name="GDDR5X"), db)
    gpu_entry = gpu.create_gpu(
        GPU(
            vram_size="8GB",
            gpu_manufacturer_id=gpu_manufacturer.id,
            gpu_brand_id=gpu_brand.id,
            gpu_model_id=gpu_model.id,
            gpu_vram_type_id=gpu_vram_type.id,
        ),
        db,
    )

    motherboard_manufacturer = motherboard.create_manufacturer(
        MotherboardManufacturer(name="Gigabyte"),
        db,
    )
    motherboard_chipset = motherboard.create_chipset(
        MotherboardChipset(name="Z370"),
        db,
    )
    motherboard_entry = motherboard.create_motherboard(
        Motherboard(
            model="Z370 AORUS",
            manufacturer_id=motherboard_manufacturer.id,
            chipset_id=motherboard_chipset.id,
        ),
        db,
    )

    ram_entry = ram.create_ram(RAM(name="DDR4 3200"), db)
    disk_entry = disk.create_disk(Disk(name="Samsung 970 EVO 1TB"), db)
    os_entry = oses.create_os(OS(name="Windows 11"), db)

    config_entry = config.create_config(
        Config(
            name="Main rig",
            cpu_id=cpu_entry.id,
            motherboard_id=motherboard_entry.id,
            gpu_id=gpu_entry.id,
            disk_id=disk_entry.id,
            os_id=os_entry.id,
            ram_id=ram_entry.id,
            ram_size="32GB",
        ),
        db,
    )

    target = benchmark_router.create_benchmark_target(BenchmarkTarget(name="GPU"), db)
    benchmark = benchmark_router.create_benchmark(
        Benchmark(name="3DMark", benchmark_target_id=target.id, lower_is_better=False),
        db,
    )
    result = benchmark_results.create_benchmark_result(
        BenchmarkResult(benchmark_id=benchmark.id, config_id=config_entry.id, result=12345),
        db,
    )

    return {
        "benchmark": benchmark,
        "config": config_entry,
        "disk": disk_entry,
        "gpu": gpu_entry,
        "os": os_entry,
        "result": result,
        "target": target,
    }


def test_api_key_is_required():
    missing_key_request = Request({"type": "http", "headers": []})
    wrong_key_request = Request({"type": "http", "headers": [(b"x-api-key", b"wrong")]})
    good_key_request = Request({"type": "http", "headers": [(b"x-api-key", b"test-api-key")]})

    with pytest.raises(HTTPException) as missing:
        auth.authenticate(missing_key_request)
    assert missing.value.status_code == 401

    with pytest.raises(HTTPException) as wrong:
        auth.authenticate(wrong_key_request)
    assert wrong.value.status_code == 401

    assert auth.authenticate(good_key_request) is True


def test_referenced_records_return_conflict_on_delete(db):
    records = _create_referenced_graph(db)

    protected_deletes = [
        (disk.delete_disk, records["disk"].id),
        (gpu.delete_gpu, records["gpu"].id),
        (oses.delete_os, records["os"].id),
        (config.delete_config, records["config"].id),
        (benchmark_router.delete_benchmark, records["benchmark"].id),
        (benchmark_router.delete_benchmark_target, records["target"].id),
    ]

    for delete_func, record_id in protected_deletes:
        with pytest.raises(HTTPException) as exc:
            delete_func(record_id, db)
        assert exc.value.status_code == 409
        assert exc.value.detail


def test_benchmark_validates_target_id(db):
    with pytest.raises(HTTPException) as exc:
        benchmark_router.create_benchmark(
            Benchmark(name="Bad target", benchmark_target_id=9999, lower_is_better=False),
            db,
        )

    assert exc.value.status_code == 400
    assert exc.value.detail == "Invalid benchmark target"
