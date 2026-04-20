"""
conftest.py — runs before every pytest session.
Adds the repo root to sys.path so both `backend/app` and `ai_pipeline` are importable
regardless of which directory pytest is launched from.
"""
import sys
import os

# Repo root = one level above backend/
REPO_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
BACKEND_DIR = os.path.abspath(os.path.dirname(__file__))

# Insert at front so our code takes priority over installed packages
if REPO_ROOT not in sys.path:
    sys.path.insert(0, REPO_ROOT)

if BACKEND_DIR not in sys.path:
    sys.path.insert(0, BACKEND_DIR)