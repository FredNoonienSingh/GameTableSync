import os
import subprocess
from flask import Blueprint, jsonify

sanity_bp = Blueprint("sanity", __name__)

def get_git_revision_hash() -> str:
    # 1. Try environment variable (best practice for Docker)
    commit = os.environ.get("GIT_COMMIT_HASH")
    if commit:
        return commit
    
    # 2. Fallback: Try git command if the .git folder is mounted/copied
    try:
        return subprocess.check_output(['git', 'rev-parse', '--short', 'HEAD']).decode('ascii').strip()
    except Exception:
        return "unknown"

@sanity_bp.route("/api/sanity", methods=["GET"])
def sanity_check():
    return jsonify({
        "status": "ok",
        "version": get_git_revision_hash()
    }), 200