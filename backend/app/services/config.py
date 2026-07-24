import os

from dotenv import load_dotenv

load_dotenv()


def _seconds(name: str, default: int, minimum: int = 1) -> int:
    try:
        return max(int(os.getenv(name, default)), minimum)
    except ValueError:
        return default


ANALYSIS_TIMEOUT = _seconds("ANALYSIS_TIMEOUT", 900)  # 15 minutes
LLM_TIMEOUT = _seconds("LLM_TIMEOUT", 90)
CLONE_TIMEOUT = _seconds("CLONE_TIMEOUT", 120)
STALE_JOB_TIMEOUT = _seconds("STALE_JOB_TIMEOUT", 1800)  # 30 minutes
JOB_RETENTION_TIMEOUT = _seconds("JOB_RETENTION_TIMEOUT", 3600)
JOB_CLEANUP_INTERVAL = _seconds("JOB_CLEANUP_INTERVAL", 60)
