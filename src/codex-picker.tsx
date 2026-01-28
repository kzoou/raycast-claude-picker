import { List, ActionPanel, Action, showToast, Toast, closeMainWindow } from "@raycast/api";
import { execSync } from "child_process";
import { readFileSync, existsSync, readdirSync, statSync } from "fs";
import { homedir } from "os";
import { join } from "path";
import { useState, useEffect } from "react";

interface SessionIndex {
  entries?: Array<{
    projectPath?: string;
    modified?: string;
  }>;
}

interface Project {
  name: string;
  path: string;
  modified?: string;
}

function extractCwdFromJsonl(filePath: string): string | null {
  try {
    const content = readFileSync(filePath, "utf-8");
    const match = content.match(/"cwd":"([^"]+)"/);
    return match ? match[1] : null;
  } catch {
    return null;
  }
}

// Scan directory for CLAUDE.md files (up to specified depth)
function scanForClaudeMd(baseDir: string, seen: Set<string>, maxDepth: number = 3): Project[] {
  const projects: Project[] = [];

  function scan(dir: string, depth: number) {
    if (depth > maxDepth) return;

    try {
      const entries = readdirSync(dir, { withFileTypes: true });

      // Check if this directory has CLAUDE.md
      const hasClaudeMd = entries.some((e) => e.isFile() && e.name === "CLAUDE.md");

      if (hasClaudeMd && !seen.has(dir)) {
        seen.add(dir);
        const name = dir.split("/").pop() || dir;
        const stat = statSync(join(dir, "CLAUDE.md"));

        projects.push({
          name,
          path: dir,
          modified: stat.mtime.toISOString(),
        });
      }

      // Recurse into subdirectories
      for (const entry of entries) {
        if (entry.isDirectory() && !entry.name.startsWith(".") && entry.name !== "node_modules") {
          scan(join(dir, entry.name), depth + 1);
        }
      }
    } catch {
      // Skip inaccessible directories
    }
  }

  if (existsSync(baseDir)) {
    scan(baseDir, 1);
  }

  return projects;
}

function loadProjects(): Project[] {
  const projectsDir = join(homedir(), ".claude", "projects");
  const projects: Project[] = [];
  const seen = new Set<string>();

  // 1. Load from ~/.claude/projects/
  if (existsSync(projectsDir)) {
    try {
      const dirs = readdirSync(projectsDir, { withFileTypes: true });

      for (const dir of dirs) {
        if (!dir.isDirectory()) continue;

        const dirPath = join(projectsDir, dir.name);
        const indexPath = join(dirPath, "sessions-index.json");

        let projectPath: string | null = null;
        let latestModified: string | undefined;

        // Try sessions-index.json first
        if (existsSync(indexPath)) {
          try {
            const content = readFileSync(indexPath, "utf-8");
            const index: SessionIndex = JSON.parse(content);

            if (index.entries && index.entries.length > 0) {
              projectPath = index.entries[0].projectPath || null;

              // Find the most recent modified date
              for (const e of index.entries) {
                if (e.modified && (!latestModified || e.modified > latestModified)) {
                  latestModified = e.modified;
                }
              }
            }
          } catch {
            // Fall through to jsonl fallback
          }
        }

        // Fallback: read from .jsonl files
        if (!projectPath) {
          try {
            const files = readdirSync(dirPath);
            const jsonlFile = files.find((f) => f.endsWith(".jsonl"));
            if (jsonlFile) {
              projectPath = extractCwdFromJsonl(join(dirPath, jsonlFile));

              // Use file mtime as modified date
              if (projectPath) {
                const stat = statSync(join(dirPath, jsonlFile));
                latestModified = stat.mtime.toISOString();
              }
            }
          } catch {
            // Skip
          }
        }

        if (projectPath && !seen.has(projectPath) && existsSync(projectPath)) {
          seen.add(projectPath);
          const name = projectPath.split("/").pop() || projectPath;

          projects.push({
            name,
            path: projectPath,
            modified: latestModified,
          });
        }
      }
    } catch {
      // Continue to CLAUDE.md scan
    }
  }

  // 2. Scan ~/dev for CLAUDE.md files (catches old projects not in ~/.claude/projects/)
  const devDir = join(homedir(), "dev");
  const claudeMdProjects = scanForClaudeMd(devDir, seen);
  projects.push(...claudeMdProjects);

  // Sort by most recently modified
  projects.sort((a, b) => {
    if (!a.modified) return 1;
    if (!b.modified) return -1;
    return b.modified.localeCompare(a.modified);
  });

  return projects;
}

async function launchCodex(projectPath: string) {
  await closeMainWindow();

  const script = `
    tell application "Ghostty"
      activate
    end tell
    delay 0.3
    tell application "System Events"
      tell process "Ghostty"
        keystroke "t" using {command down}
      end tell
    end tell
    delay 0.3
    tell application "System Events"
      tell process "Ghostty"
        keystroke "cd \\"${projectPath}\\" && codex"
        delay 0.1
        key code 36
      end tell
    end tell
  `;

  try {
    execSync(`osascript -e '${script.replace(/'/g, "'\"'\"'")}'`);
  } catch (error) {
    showToast({ style: Toast.Style.Failure, title: "Failed to launch", message: String(error) });
  }
}

export default function Command() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loaded = loadProjects();
    setProjects(loaded);
    setIsLoading(false);
  }, []);

  if (!isLoading && projects.length === 0) {
    return (
      <List>
        <List.EmptyView
          title="No projects found"
          description="Use Claude Code in a project first"
        />
      </List>
    );
  }

  return (
    <List isLoading={isLoading} searchBarPlaceholder="Search projects...">
      {projects.map((project) => (
        <List.Item
          key={project.path}
          title={project.name}
          subtitle={project.path}
          actions={
            <ActionPanel>
              <Action title="Launch Codex" onAction={() => launchCodex(project.path)} />
            </ActionPanel>
          }
        />
      ))}
    </List>
  );
}
