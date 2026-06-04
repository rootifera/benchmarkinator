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
        "chipset": motherboard_chipset,
        "config": config_entry,
        "cpu": cpu_entry,
        "cpu_brand": cpu_brand,
        "cpu_family": cpu_family,
        "disk": disk_entry,
        "gpu": gpu_entry,
        "gpu_brand": gpu_brand,
        "gpu_manufacturer": gpu_manufacturer,
        "gpu_model": gpu_model,
        "gpu_vram_type": gpu_vram_type,
        "motherboard": motherboard_entry,
        "motherboard_manufacturer": motherboard_manufacturer,
        "os": os_entry,
        "ram": ram_entry,
        "result": result,
        "target": target,
    }


def test_api_key_is_required():
    missing_key_request = Request({"type": "http", "headers": []})
    wrong_key_request = Request({"type": "http", "headers": [(b"x-api-key", b"wrong")]})
    good_key_request = Request({"type": "http", "headers": [(b"x-api-key", b"test-api-key")]})
    token = auth.authenticate_credentials("admin", "test-password")
    token_request = Request({"type": "http", "headers": [(b"x-api-key", token.encode())]})
    bearer_request = Request({"type": "http", "headers": [(b"authorization", f"Bearer {token}".encode())]})
    tampered_request = Request({"type": "http", "headers": [(b"x-api-key", f"{token}x".encode())]})

    with pytest.raises(HTTPException) as missing:
        auth.authenticate(missing_key_request)
    assert missing.value.status_code == 401

    with pytest.raises(HTTPException) as wrong:
        auth.authenticate(wrong_key_request)
    assert wrong.value.status_code == 401

    assert auth.authenticate(good_key_request) is True
    assert auth.authenticate(token_request) is True
    assert auth.authenticate(bearer_request) is True

    with pytest.raises(HTTPException) as tampered:
        auth.authenticate(tampered_request)
    assert tampered.value.status_code == 401


def test_referenced_records_return_conflict_on_delete(db):
    records = _create_referenced_graph(db)

    protected_deletes = [
        (cpu.delete_cpu, records["cpu"].id),
        (cpu.delete_cpu_brand, records["cpu_brand"].id),
        (cpu.delete_cpu_family, records["cpu_family"].id),
        (disk.delete_disk, records["disk"].id),
        (gpu.delete_gpu, records["gpu"].id),
        (gpu.delete_gpu_brand, records["gpu_brand"].id),
        (gpu.delete_gpu_manufacturer, records["gpu_manufacturer"].id),
        (gpu.delete_gpu_model, records["gpu_model"].id),
        (gpu.delete_gpu_vram_type, records["gpu_vram_type"].id),
        (motherboard.delete_motherboard, records["motherboard"].id),
        (motherboard.delete_manufacturer, records["motherboard_manufacturer"].id),
        (motherboard.delete_chipset, records["chipset"].id),
        (oses.delete_os, records["os"].id),
        (ram.delete_ram, records["ram"].id),
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


def test_cpu_family_must_belong_to_selected_brand(db):
    intel = cpu.create_cpu_brand(CPUBrand(name="Intel"), db)
    amd = cpu.create_cpu_brand(CPUBrand(name="AMD"), db)
    ryzen = cpu.create_cpu_family(CPUFamily(name="Ryzen", cpu_brand_id=amd.id), db)

    with pytest.raises(HTTPException) as exc:
        cpu.create_cpu(
            CPU(
                model="Mismatched CPU",
                speed="3.0GHz",
                core_count=8,
                cpu_brand_id=intel.id,
                cpu_family_id=ryzen.id,
            ),
            db,
        )

    assert exc.value.status_code == 400
    assert exc.value.detail == "CPU family does not belong to the specified brand"


def test_compare_configs_can_filter_to_one_benchmark(db):
    records = _create_referenced_graph(db)
    config_1 = records["config"]
    benchmark_1 = records["benchmark"]
    config_2 = config.create_config(
        Config(
            name="Second rig",
            cpu_id=records["cpu"].id,
            motherboard_id=records["motherboard"].id,
            gpu_id=records["gpu"].id,
            disk_id=records["disk"].id,
            os_id=records["os"].id,
            ram_id=records["ram"].id,
            ram_size="32GB",
        ),
        db,
    )
    benchmark_2 = benchmark_router.create_benchmark(
        Benchmark(name="SuperPi", benchmark_target_id=records["target"].id, lower_is_better=True),
        db,
    )

    benchmark_results.create_benchmark_result(
        BenchmarkResult(benchmark_id=benchmark_1.id, config_id=config_2.id, result=120),
        db,
    )
    benchmark_results.create_benchmark_result(
        BenchmarkResult(benchmark_id=benchmark_2.id, config_id=config_1.id, result=10),
        db,
    )
    benchmark_results.create_benchmark_result(
        BenchmarkResult(benchmark_id=benchmark_2.id, config_id=config_2.id, result=8),
        db,
    )

    all_results = benchmark_results.compare_configs(config_1.id, config_2.id, db=db)
    filtered = benchmark_results.compare_configs(
        config_1.id,
        config_2.id,
        benchmark_id=benchmark_2.id,
        db=db,
    )

    assert {result["benchmark_id"] for result in all_results} == {benchmark_1.id, benchmark_2.id}
    assert [result["benchmark_id"] for result in filtered] == [benchmark_2.id]
    assert filtered[0]["benchmark_name"] == "SuperPi"
