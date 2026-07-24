from pathlib import Path


def scan_repository(repo_path: str):
    root = Path(repo_path)
    files = []
    directories = []
    IGNORE_DIRS = {
        ".git",
        "venv",
        "node_modules",
        "__pycache__",
        ".next",
        "dist",
        "build",
    }
    IMPORTANT_FILES = {
        "README.md",
        "package.json",
        "requirements.txt",
        "Dockerfile",
        "docker-compose.yml",
        ".gitignore",
        "pyproject.toml",
        "package-lock.json",
        "yarn.lock",
        "pnpm-lock.yaml",
    }
    important_files = []
    EXTENSIONS = {
        ".py": "Python",
        ".js": "JavaScript",
        ".ts": "TypeScript",
        ".tsx": "React/TypeScript",
        ".jsx": "React",
        ".cpp": "C++",
        ".java": "Java",
        ".go": "Go",
        ".rs": "Rust",
        ".rb": "Ruby",
        ".php": "PHP",
    }
    languages = set()
    FRAMEWORK_FILES = {
        "package.json": "Node.js",
        "requirements.txt": "Python",
        "pom.xml": "Java",
        "Gemfile": "Ruby",
        "go.mod": "Go",
        "Cargo.toml": "Rust",
        "composer.json": "PHP",
    }
    ENTRY_FILES = {
        "main.py",
        "app.py",
        "run.py",
        "server.py",
        "index.js",
        "index.ts",
        "App.jsx",
        "App.tsx",
    }
    frameworks = set()
    entry_points = []
    for item in root.rglob("*"):
        if any(part in IGNORE_DIRS for part in item.parts):
            continue
        if item.suffix in EXTENSIONS:
            languages.add(EXTENSIONS[item.suffix])
        if item.name in FRAMEWORK_FILES:
            frameworks.add(FRAMEWORK_FILES[item.name])
        if item.name in ENTRY_FILES:
            entry_points.append(str(item.relative_to(root)))
        if item.is_file():
            files.append(item)
            if item.name in IMPORTANT_FILES:
                important_files.append(item.name)
        elif item.is_dir():
            directories.append(item)
    return {
        "project_name": root.name,
        "important_files": important_files,
        "languages": sorted(languages),
        "total_files": len(files),
        "total_directories": len(directories),
        "frameworks": sorted(frameworks),
        "entry_points": entry_points,
    }
