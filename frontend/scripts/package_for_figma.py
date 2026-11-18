"""Package this local prototype without dependencies, links, or credentials."""
from pathlib import Path
import os
import re
import sys
import tarfile

ROOT = Path(__file__).resolve().parents[1]
EXCLUDED = {
    "node_modules", ".git", ".next", ".nuxt", ".output", ".astro",
    ".svelte-kit", ".docusaurus", "dist", "build", "coverage", ".venv",
    "venv", "__pycache__", ".pytest_cache", ".turbo", ".cache", "_site",
}
LIFECYCLE = {f".figma/make/{name}" for name in ("install", "dev", "deploy-preview", "deploy")}
SECRET = re.compile(r"github_pat_[A-Za-z0-9_]{20,}|sk-(?:proj|ant)-[A-Za-z0-9_-]{20,}|AIza[A-Za-z0-9_-]{30,}")


def main():
    if len(sys.argv) != 2:
        raise SystemExit("Usage: py scripts/package_for_figma.py <archive-path>")
    destination = Path(sys.argv[1]).resolve()
    if destination.is_relative_to(ROOT):
        raise SystemExit("Archive must be outside the project")
    entries = []
    for directory, dirs, files in os.walk(ROOT, followlinks=False):
        dirs[:] = sorted(name for name in dirs if name not in EXCLUDED)
        for name in dirs:
            if (Path(directory) / name).is_symlink():
                raise SystemExit("Refusing directory link")
        for name in sorted(files):
            path = Path(directory) / name
            relative = path.relative_to(ROOT).as_posix()
            if path.is_symlink() or path.stat().st_nlink > 1:
                raise SystemExit(f"Refusing linked file: {relative}")
            if name.startswith(".env") or name in {".npmrc", ".netrc", "credentials.json"} or path.suffix in {".pem", ".key"}:
                raise SystemExit(f"Review potential credential file before packaging: {relative}")
            if path.suffix in {".js", ".jsx", ".ts", ".tsx", ".json", ".md", ".txt"}:
                if SECRET.search(path.read_text(encoding="utf-8")):
                    raise SystemExit(f"Review potential credential content: {relative}")
            entries.append((path, relative))
    if not LIFECYCLE.issubset({relative for _, relative in entries}):
        raise SystemExit("Missing required Figma lifecycle files")
    destination.parent.mkdir(parents=True, exist_ok=True)
    with tarfile.open(destination, "w:gz", format=tarfile.PAX_FORMAT) as archive:
        for path, relative in entries:
            info = archive.gettarinfo(str(path), arcname=relative)
            info.mode = 0o755 if relative in LIFECYCLE else 0o644
            with path.open("rb") as data:
                archive.addfile(info, data)
    with tarfile.open(destination, "r:gz") as archive:
        members = archive.getmembers()
        assert all(item.isfile() and not item.issym() and not item.islnk() for item in members)
        assert all(archive.getmember(name).mode == 0o755 for name in LIFECYCLE)
        assert archive.getmember("package.json")
        assert archive.getmember("package-lock.json")
        assert archive.getmember("index.html")
    print(f"Archive verified: {len(entries)} regular files; lifecycle mode 755; {destination.stat().st_size} bytes.")
    print(destination)


if __name__ == "__main__":
    main()
