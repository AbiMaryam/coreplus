"""Initialize git repo, add all files, and create initial commit using dulwich."""
import os
import subprocess
from dulwich import porcelain
from dulwich.objects import Blob, Tree, Commit
import time

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

# Initialize repo
repo = porcelain.init(ROOT)

# Set git identity (dulwich stores config differently, set via .git/config)
config_path = os.path.join(ROOT, ".git", "config")
with open(config_path, "a") as f:
    f.write('\n[user]\n    name = CorePlus Developer\n    email = coreplus@users.noreply.github.com\n')

# Create .gitignore to exclude node_modules, dist, .env
gitignore = """node_modules/
dist/
*.zip
.env
.env.local
.DS_Store
*.log
.vite/
supabase/.branches
supabase/.temp
__pycache__/
"""

with open(os.path.join(ROOT, ".gitignore"), "w") as f:
    f.write(gitignore)

# Stage all files (excluding gitignored)
porcelain.add(repo, ROOT)  # adds everything not ignored

# Create commit
porcelain.commit(
    repo,
    message=b"CorePlus v3.0 - SaaS extension with Supabase + AutoGoPay QRIS billing",
    author=b"CorePlus Developer <coreplus@users.noreply.github.com>",
    committer=b"CorePlus Developer <coreplus@users.noreply.github.com>",
)

print("Git repo initialized and committed successfully.")
print(f"Repository at: {ROOT}")
print("\nFiles staged:")
# List tracked files
for entry in repo.open_index():
    print(f"  {entry.path.decode()}")