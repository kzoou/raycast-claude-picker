import { List, ActionPanel, Action, showToast, Toast, getPreferenceValues, closeMainWindow } from "@raycast/api";
import { execSync } from "child_process";
import { readFileSync, existsSync } from "fs";
import { homedir } from "os";
import { useState, useEffect } from "react";

interface Preferences {
  projectsFile: string;
}

interface Project {
  name: string;
  path: string;
}

function loadProjects(filePath: string): Project[] {
  const expandedPath = filePath.replace(/^~/, homedir());

  if (!existsSync(expandedPath)) {
    return [];
  }

  const content = readFileSync(expandedPath, "utf-8");
  return content
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith("#"))
    .map((line) => {
      const expandedLine = line.replace(/^~/, homedir());
      const name = expandedLine.split("/").pop() || expandedLine;
      return { name, path: expandedLine };
    });
}

async function launchClaude(projectPath: string) {
  // Close Raycast first
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
  const preferences = getPreferenceValues<Preferences>();
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loaded = loadProjects(preferences.projectsFile);
    setProjects(loaded);
    setIsLoading(false);
  }, [preferences.projectsFile]);

  if (!isLoading && projects.length === 0) {
    return (
      <List>
        <List.EmptyView
          title="No projects found"
          description={`Add project paths to ${preferences.projectsFile}`}
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
