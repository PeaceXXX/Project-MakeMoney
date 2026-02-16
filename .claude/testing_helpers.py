"""
Testing utilities for the Claude Agent Harness System.
Provides helper functions for running and validating tests.
"""
import json
import subprocess
import sys
from pathlib import Path
from typing import Dict, List, Optional, Any


class FeatureValidator:
    """Validates that features are properly implemented and tested."""

    def __init__(self, project_root: Path):
        self.project_root = project_root
        self.feature_list_path = project_root / ".claude" / "feature_list.json"

    def load_feature_list(self) -> Dict[str, Any]:
        """Load the feature list from JSON file."""
        with open(self.feature_list_path, "r") as f:
            return json.load(f)

    def get_feature_by_id(self, feature_id: str) -> Optional[Dict[str, Any]]:
        """Get a specific feature by its ID."""
        feature_list = self.load_feature_list()
        for feature in feature_list["features"]:
            if feature["id"] == feature_id:
                return feature
        return None

    def get_next_feature(self) -> Optional[Dict[str, Any]]:
        """Get the next feature to implement (highest priority not passing)."""
        feature_list = self.load_feature_list()
        # Filter features that are not passing
        remaining = [f for f in feature_list["features"] if not f["passes"]]
        if not remaining:
            return None
        # Sort by priority (lowest number first)
        return sorted(remaining, key=lambda x: x["priority"])[0]

    def count_completed(self) -> int:
        """Count how many features are completed."""
        feature_list = self.load_feature_list()
        return sum(1 for f in feature_list["features"] if f["passes"])

    def count_remaining(self) -> int:
        """Count how many features are remaining."""
        feature_list = self.load_feature_list()
        return sum(1 for f in feature_list["features"] if not f["passes"])

    def mark_feature_passing(self, feature_id: str) -> bool:
        """Mark a feature as passing and save the feature list."""
        feature_list = self.load_feature_list()
        for feature in feature_list["features"]:
            if feature["id"] == feature_id:
                feature["passes"] = True
                with open(self.feature_list_path, "w") as f:
                    json.dump(feature_list, f, indent=2)
                return True
        return False


class TestRunner:
    """Runs tests for backend and frontend."""

    def __init__(self, project_root: Path):
        self.project_root = project_root
        self.backend_dir = project_root / "backend"
        self.frontend_dir = project_root / "frontend"

    def run_backend_tests(self, verbose: bool = False) -> subprocess.CompletedProcess:
        """Run backend tests using pytest."""
        cmd = ["pytest"]
        if verbose:
            cmd.append("-v")
        result = subprocess.run(
            cmd,
            cwd=self.backend_dir,
            capture_output=True,
            text=True
        )
        return result

    def run_frontend_tests(self, verbose: bool = False) -> subprocess.CompletedProcess:
        """Run frontend tests using Jest."""
        cmd = ["npm", "test", "--", "--passWithNoTests"]
        if verbose:
            cmd.append("--verbose")
        result = subprocess.run(
            cmd,
            cwd=self.frontend_dir,
            capture_output=True,
            text=True
        )
        return result

    def run_e2e_tests(self, headless: bool = True) -> subprocess.CompletedProcess:
        """Run end-to-end tests using Playwright."""
        cmd = ["npx", "playwright", "test"]
        if headless:
            cmd.extend(["--headed=false"])
        result = subprocess.run(
            cmd,
            cwd=self.frontend_dir,
            capture_output=True,
            text=True
        )
        return result


class GitHelper:
    """Helper functions for git operations."""

    def __init__(self, project_root: Path):
        self.project_root = project_root

    def get_recent_commits(self, count: int = 10) -> List[str]:
        """Get the most recent commit messages."""
        result = subprocess.run(
            ["git", "log", "--oneline", f"-{count}"],
            cwd=self.project_root,
            capture_output=True,
            text=True
        )
        return result.stdout.strip().split("\n") if result.stdout.strip() else []

    def get_git_status(self) -> Dict[str, Any]:
        """Get the current git status."""
        result = subprocess.run(
            ["git", "status", "--porcelain"],
            cwd=self.project_root,
            capture_output=True,
            text=True
        )
        modified = []
        untracked = []
        for line in result.stdout.strip().split("\n"):
            if line.startswith(" M") or line.startswith("M "):
                modified.append(line[3:].strip())
            elif line.startswith("??"):
                untracked.append(line[3:].strip())

        return {
            "has_changes": len(modified) + len(untracked) > 0,
            "modified": modified,
            "untracked": untracked
        }

    def get_last_commit_message(self) -> Optional[str]:
        """Get the last commit message."""
        result = subprocess.run(
            ["git", "log", "-1", "--pretty=%B"],
            cwd=self.project_root,
            capture_output=True,
            text=True
        )
        return result.stdout.strip() if result.stdout.strip() else None

    def is_clean_state(self) -> bool:
        """Check if the repository is in a clean state."""
        status = self.get_git_status()
        return not status["has_changes"]


class ProgressLogger:
    """Helper for updating the progress log file."""

    def __init__(self, project_root: Path):
        self.project_root = project_root
        self.progress_file = project_root / ".claude" / "claude-progress.txt"

    def add_session_entry(self, session_num: int, agent_type: str,
                         objective: str, tasks_completed: List[str],
                         feature_completed: Optional[str] = None) -> None:
        """Add a new session entry to the progress log."""
        from datetime import datetime

        timestamp = datetime.now().strftime("%Y-%m-%d")

        entry = f"""
===============================================
SESSION {session_num} - [Date: {timestamp}]
Agent: {agent_type}
Objective: {objective}

Tasks Completed:
"""

        for task in tasks_completed:
            entry += f"- {task}\n"

        if feature_completed:
            entry += f"\nFeature Completed: {feature_completed}"

        entry += "\n" + "=" * 50 + "\n"

        with open(self.progress_file, "a") as f:
            f.write(entry)


def print_feature_status(feature_validator: FeatureValidator) -> None:
    """Print a summary of feature completion status."""
    total = len(feature_validator.load_feature_list()["features"])
    completed = feature_validator.count_completed()
    remaining = feature_validator.count_remaining()

    print(f"\n{'='*50}")
    print("FEATURE STATUS")
    print(f"{'='*50}")
    print(f"Total: {total}")
    print(f"Completed: {completed} ({completed/total*100:.1f}%)")
    print(f"Remaining: {remaining} ({remaining/total*100:.1f}%)")

    next_feature = feature_validator.get_next_feature()
    if next_feature:
        print(f"\nNext Feature: {next_feature['id']}")
        print(f"Description: {next_feature['description']}")
        print(f"Priority: {next_feature['priority']}")
    else:
        print("\nAll features are completed!")

    print(f"{'='*50}\n")


if __name__ == "__main__":
    # Example usage
    project_root = Path(__file__).parent.parent

    feature_validator = FeatureValidator(project_root)
    test_runner = TestRunner(project_root)
    git_helper = GitHelper(project_root)

    # Print feature status
    print_feature_status(feature_validator)

    # Print git status
    print("Git Status:")
    status = git_helper.get_git_status()
    print(f"  Clean state: {git_helper.is_clean_state()}")
    print(f"  Modified files: {status['modified']}")
    print(f"  Untracked files: {status['untracked']}")
