from pathlib import Path

from utils.hardware_loader import _iter_statements


def test_hardware_seed_files_include_standard_benchmark_targets():
    expected_targets = {"CPU", "GPU", "RAM", "System", "Storage"}
    sql_files = [
        Path("extras/sql/retro_hardware_2005.sql"),
        Path("extras/sql/retro_hardware_extended_2008.sql"),
        Path("extras/sql/modern_hardware.sql"),
    ]

    for sql_file in sql_files:
        statements = list(_iter_statements(sql_file.read_text(encoding="utf-8")))
        target_statements = [
            statement for statement in statements
            if statement.lower().startswith("insert into benchmarktarget")
        ]

        assert target_statements, f"{sql_file} does not seed benchmark targets"
        combined = "\n".join(target_statements)
        for target in expected_targets:
            assert f"'{target}'" in combined
