const vscode = require("vscode");
const path = require("path");
const { play, startLongRunTimer } = require("./soundPlayer");

const MEDIA_DIR = path.join(__dirname, "..", "media");

/** @type {vscode.StatusBarItem} */
let statusBarItem;

/** @type {Map<object, { timer: ReturnType<typeof startLongRunTimer> }>} */
const activeExecutions = new Map();

function getConfig() {
  const cfg = vscode.workspace.getConfiguration("devSounds");
  return {
    enabled: cfg.get("enabled", true),
    volume: cfg.get("volume", 0.3),
    longRunThreshold: cfg.get("longRunThreshold", 30),
    successSound:
      cfg.get("successSoundPath", "") || path.join(MEDIA_DIR, "success.mp3"),
    errorSound:
      cfg.get("errorSoundPath", "") || path.join(MEDIA_DIR, "error.mp3"),
    longrunSound:
      cfg.get("longRunSoundPath", "") || path.join(MEDIA_DIR, "longrun.mp3"),
    exemptCommands: cfg.get("exemptCommands", []),
    enableForTasks: cfg.get("enableForTasks", true),
  };
}

function isExempt(commandLine, exemptList) {
  const baseCmd = commandLine.trim().split(/\s+/)[0];
  return exemptList.some((ex) => baseCmd === ex);
}

function updateStatusBar(enabled) {
  if (!statusBarItem) return;
  statusBarItem.text = enabled ? "$(unmute) Dev Sounds" : "$(mute) Dev Sounds";
  statusBarItem.tooltip = enabled
    ? "Dev Sounds: ON (click to toggle)"
    : "Dev Sounds: OFF (click to toggle)";
}

function playSuccess() {
  const cfg = getConfig();
  play(cfg.successSound, cfg.volume);
}

function playError() {
  const cfg = getConfig();
  play(cfg.errorSound, cfg.volume);
}

function playLongrun() {
  const cfg = getConfig();
  play(cfg.longrunSound, cfg.volume);
}

/**
 * @param {vscode.ExtensionContext} context
 */
function activate(context) {
  // Status bar
  statusBarItem = vscode.window.createStatusBarItem(
    vscode.StatusBarAlignment.Right,
    100
  );
  statusBarItem.command = "devSounds.toggle";
  updateStatusBar(getConfig().enabled);
  statusBarItem.show();
  context.subscriptions.push(statusBarItem);

  // ── Commands ──

  context.subscriptions.push(
    vscode.commands.registerCommand("devSounds.toggle", () => {
      const cfg = vscode.workspace.getConfiguration("devSounds");
      const current = cfg.get("enabled", true);
      cfg.update("enabled", !current, vscode.ConfigurationTarget.Global);
      updateStatusBar(!current);
      vscode.window.showInformationMessage(
        `Dev Sounds ${!current ? "enabled" : "disabled"}.`
      );
    })
  );

  context.subscriptions.push(
    vscode.commands.registerCommand("devSounds.playSuccess", playSuccess)
  );
  context.subscriptions.push(
    vscode.commands.registerCommand("devSounds.playError", playError)
  );
  context.subscriptions.push(
    vscode.commands.registerCommand("devSounds.playLongrun", playLongrun)
  );

  context.subscriptions.push(
    vscode.commands.registerCommand("devSounds.selectSuccessSound", () =>
      selectCustomSound("successSoundPath", "Select Success Sound")
    )
  );
  context.subscriptions.push(
    vscode.commands.registerCommand("devSounds.selectErrorSound", () =>
      selectCustomSound("errorSoundPath", "Select Error Sound")
    )
  );
  context.subscriptions.push(
    vscode.commands.registerCommand("devSounds.selectLongrunSound", () =>
      selectCustomSound("longRunSoundPath", "Select Long-Run Sound")
    )
  );

  context.subscriptions.push(
    vscode.commands.registerCommand("devSounds.resetSounds", async () => {
      const cfg = vscode.workspace.getConfiguration("devSounds");
      await cfg.update(
        "successSoundPath",
        undefined,
        vscode.ConfigurationTarget.Global
      );
      await cfg.update(
        "errorSoundPath",
        undefined,
        vscode.ConfigurationTarget.Global
      );
      await cfg.update(
        "longRunSoundPath",
        undefined,
        vscode.ConfigurationTarget.Global
      );
      vscode.window.showInformationMessage(
        "Dev Sounds: All sounds reset to defaults."
      );
    })
  );

  // ── Terminal shell execution hooks (VS Code 1.93+) ──

  if (vscode.window.onDidStartTerminalShellExecution) {
    context.subscriptions.push(
      vscode.window.onDidStartTerminalShellExecution((event) => {
        const cfg = getConfig();
        if (!cfg.enabled) return;

        const cmdLine =
          event.execution?.commandLine?.value ||
          event.execution?.commandLine ||
          "";
        if (typeof cmdLine === "string" && isExempt(cmdLine, cfg.exemptCommands))
          return;

        const timer = startLongRunTimer(
          cfg.longrunSound,
          cfg.volume,
          cfg.longRunThreshold
        );
        activeExecutions.set(event.execution, { timer });
      })
    );

    context.subscriptions.push(
      vscode.window.onDidEndTerminalShellExecution((event) => {
        const cfg = getConfig();

        const entry = activeExecutions.get(event.execution);
        if (entry) {
          entry.timer.cancel();
          activeExecutions.delete(event.execution);
        }

        if (!cfg.enabled) return;

        const cmdLine =
          event.execution?.commandLine?.value ||
          event.execution?.commandLine ||
          "";
        if (typeof cmdLine === "string" && isExempt(cmdLine, cfg.exemptCommands))
          return;

        if (event.exitCode === 0) {
          play(cfg.successSound, cfg.volume);
        } else if (event.exitCode !== undefined) {
          play(cfg.errorSound, cfg.volume);
        }
      })
    );
  }

  // ── Task completion hooks ──

  context.subscriptions.push(
    vscode.tasks.onDidEndTaskProcess((event) => {
      const cfg = getConfig();
      if (!cfg.enabled || !cfg.enableForTasks) return;

      if (event.exitCode === 0) {
        play(cfg.successSound, cfg.volume);
      } else if (event.exitCode !== undefined) {
        play(cfg.errorSound, cfg.volume);
      }
    })
  );

  // ── React to config changes ──

  context.subscriptions.push(
    vscode.workspace.onDidChangeConfiguration((event) => {
      if (event.affectsConfiguration("devSounds.enabled")) {
        updateStatusBar(getConfig().enabled);
      }
    })
  );
}

async function selectCustomSound(settingKey, dialogTitle) {
  const result = await vscode.window.showOpenDialog({
    canSelectMany: false,
    openLabel: dialogTitle,
    filters: { Audio: ["mp3", "wav", "ogg", "m4a"] },
  });

  if (result && result.length > 0) {
    const filePath = result[0].fsPath;
    await vscode.workspace
      .getConfiguration("devSounds")
      .update(settingKey, filePath, vscode.ConfigurationTarget.Global);
    vscode.window.showInformationMessage(
      `Dev Sounds: Updated to ${path.basename(filePath)}`
    );
    const cfg = getConfig();
    play(
      settingKey.includes("success")
        ? cfg.successSound
        : settingKey.includes("error")
          ? cfg.errorSound
          : cfg.longrunSound,
      cfg.volume
    );
  }
}

function deactivate() {
  for (const [, entry] of activeExecutions) {
    entry.timer.cancel();
  }
  activeExecutions.clear();
}

module.exports = { activate, deactivate };
