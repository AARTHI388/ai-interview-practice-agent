import os
import logging
from typing import Optional

logger = logging.getLogger(__name__)

def load_prompt(name: str) -> str:
    base_dir = os.path.dirname(os.path.abspath(__file__))
    path = os.path.join(base_dir, f"{name}.txt")
    with open(path, "r", encoding="utf-8") as f:
        return f.read()
