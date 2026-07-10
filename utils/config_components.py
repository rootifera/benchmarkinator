import json


def component_ids(raw: str | None, fallback_id: int | None, fallback_quantity: int | None = 1) -> list[int]:
    if raw:
        try:
            values = json.loads(raw)
        except json.JSONDecodeError:
            values = None

        if isinstance(values, list):
            ids = []
            for value in values:
                try:
                    component_id = int(value)
                except (TypeError, ValueError):
                    continue
                if component_id > 0:
                    ids.append(component_id)
            return ids

    if fallback_id is None:
        return []

    quantity = max(int(fallback_quantity or 1), 1)
    return [int(fallback_id)] * quantity


def config_has_cpu(config, cpu_id: int) -> bool:
    return int(cpu_id) in component_ids(config.cpu_component_ids, config.cpu_id, config.cpu_quantity)


def config_has_gpu(config, gpu_id: int) -> bool:
    return int(gpu_id) in component_ids(config.gpu_component_ids, config.gpu_id, config.gpu_quantity)
