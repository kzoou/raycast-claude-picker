import { List, ActionPanel, Action, showToast, Toast, closeMainWindow } from "@raycast/api";
import { execSync } from "child_process";
import { readFileSync, existsSync, readdirSync } from "fs";
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

function loadProjects(): Project[] {
  const projectsDir = join(homedir(), ".claude", "projects");

  if (!existsSync(projectsDir)) {
    return [];
  }

  const projects: Project[] = [];
  const seen = new Set<string>();

  try {
    const dirs = readdirSync(projectsDir, { withFileTypes: true });

    for (const dir of dirs) {
      if (!dir.isDirectory()) continue;

      const indexPath = join(projectsDir, dir.name, "sessions-index.json");
      if (!existsSync(indexPath)) continue;

      try {
        const content = readFileSync(indexPath, "utf-8");
        const index: SessionIndex = JSON.parse(content);

        if (index.entries && index.entries.length > 0) {
          const entry = index.entries[0];
          const projectPath = entry.projectPath;

          if (projectPath && !seen.has(projectPath) && existsSync(projectPath)) {
            seen.add(projectPath);
            const name = projectPath.split("/").pop() || projectPath;

            // Find the most recent modified date across all entries
            let latestModified = entry.modified;
            for (const e of index.entries) {
              if (e.modified && (!latestModified || e.modified > latestModified)) {
                latestModified = e.modified;
              }
            }

            projects.push({
              name,
              path: projectPath,
              modified: latestModified,
            });
          }
        }
      } catch {
        // Skip invalid JSON files
      }
    }
  } catch {
    return [];
  }

  // Sort by most recently modified
  projects.sort((a, b) => {
    if (!a.modified) return 1;
    if (!b.modified) return -1;
    return b.modified.localeCompare(a.modified);
  });

  return projects;
}

async function launchClaude(projectPath: string) {
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
        keystroke "cd \\"${projectPath}\\" && claude"
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
              <Action title="Launch Claude" onAction={() => launchClaude(project.path)} />
            </ActionPanel>
          }
        />
      ))}
    </List>
  );
}
