import time
import json

LOG_FILE = "telemetry_logs.jsonl"

def log_telemetry(pathway, prompt_len, response_len, latency, success=True):
    entry = {
        "timestamp": time.time(),
        "pathway": pathway,
        "latency_sec": round(latency, 4),
        "input_length": prompt_len,
        "output_length": response_len,
        "success": success
    }
    
    try:
        with open(LOG_FILE, "a") as f:
            f.write(json.dumps(entry) + "\n")
    except Exception as e:
        print(f"Telemetry logging failed: {e}")