# Dev Sounds

> Automatic sound effects for your VS Code / Cursor terminal — success chime, error alert, and long-running command notifications. Zero config, zero dependencies.

![VS Code](https://img.shields.io/badge/VS%20Code-1.93%2B-blue?logo=visualstudiocode&logoColor=white)
![Version](https://img.shields.io/badge/version-1.0.0-green)
![License](https://img.shields.io/badge/license-MIT-yellow)
![Platform](https://img.shields.io/badge/platform-macOS%20%7C%20Linux%20%7C%20Windows-lightgrey)

---

## Why?

Ever run a build, switch to the browser, and forget to check if it passed? Dev Sounds gives you instant audio feedback for every terminal command — no more staring at the terminal waiting.

- Command succeeded? **Success chime.**
- Command failed? **Error alert.**
- Command running over 30 seconds? **Notification ping** so you know it's still going.

Install and go. No configuration needed.

## Features

- **Automatic detection** — plays sounds after every terminal command based on exit code
- **Long-running alerts** — notification sound when a command exceeds a configurable threshold (default: 30s)
- **Task support** — plays sounds when VS Code tasks (build, test, etc.) complete
- **Custom sounds** — swap in your own MP3/WAV files via the command palette or settings
- **Exempt commands** — skip sounds for trivial commands like `ls`, `cd`, `echo`, `cat`
- **Status bar toggle** — one-click enable/disable from the status bar
- **Cross-platform** — native audio playback on macOS (`afplay`), Linux (`mpg123`/`paplay`), and Windows (PowerShell)
- **Zero dependencies** — no `node_modules`, no native binaries, just pure VS Code API + OS tools

## Demo

```
$ npm run build
✔ Build succeeded                    🔔 *success chime*

$ npm test
✖ 3 tests failed                     🔔 *error alert*

$ docker build -t myapp .
⏳ Running for 45s...                 🔔 *long-run notification*
```

## Installation

### From VSIX (sideload)

1. Download `dev-sounds-1.0.0.vsix` from the [latest release](https://github.com/himanshuain/custom-vscode-terminal-sounds-/releases)
2. Open VS Code or Cursor
3. `Cmd+Shift+P` → **Extensions: Install from VSIX...** → select the `.vsix` file

Or from the terminal:

```bash
code --install-extension dev-sounds-1.0.0.vsix
# For Cursor:
cursor --install-extension dev-sounds-1.0.0.vsix
```

### From Source

```bash
git clone https://github.com/himanshuain/custom-vscode-terminal-sounds-.git
cd custom-vscode-terminal-sounds-
npm install
npm run package
# Then install the generated .vsix file
```

## Commands

Open the Command Palette (`Cmd+Shift+P` / `Ctrl+Shift+P`):

| Command | Description |
|---|---|
| `Dev Sounds: Toggle On/Off` | Enable or disable all sounds |
| `Dev Sounds: Play Success Sound` | Preview the success sound |
| `Dev Sounds: Play Error Sound` | Preview the error sound |
| `Dev Sounds: Play Long-Run Sound` | Preview the long-run notification |
| `Dev Sounds: Choose Custom Success Sound` | Pick your own MP3/WAV file |
| `Dev Sounds: Choose Custom Error Sound` | Pick your own MP3/WAV file |
| `Dev Sounds: Choose Custom Long-Run Sound` | Pick your own MP3/WAV file |
| `Dev Sounds: Reset All Sounds to Default` | Revert to built-in sounds |

## Settings

Go to **Settings > Extensions > Dev Sounds** or edit `settings.json`:

| Setting | Default | Description |
|---|---|---|
| `devSounds.enabled` | `true` | Master toggle |
| `devSounds.volume` | `0.3` | Playback volume (0.0 – 1.0) |
| `devSounds.longRunThreshold` | `30` | Seconds before long-run sound triggers |
| `devSounds.successSoundPath` | `""` | Path to custom success sound (empty = built-in) |
| `devSounds.errorSoundPath` | `""` | Path to custom error sound (empty = built-in) |
| `devSounds.longRunSoundPath` | `""` | Path to custom long-run sound (empty = built-in) |
| `devSounds.exemptCommands` | `["ls", "cd", ...]` | Commands that never trigger sounds |
| `devSounds.enableForTasks` | `true` | Play sounds on VS Code task completion |

## Customizing Sounds

**Option 1 — Command Palette:**
Run `Dev Sounds: Choose Custom Success Sound` (or Error / Long-Run) and pick any MP3 or WAV file from your system.

**Option 2 — Settings:**
Set `devSounds.successSoundPath` to the absolute path of your audio file.

**Reset:**
Run `Dev Sounds: Reset All Sounds to Default` to revert to the built-in sounds.

## Architecture

```
dev-sounds-vscode/
├── package.json          # Extension manifest and configuration schema
├── src/
│   ├── extension.js      # Activation, commands, terminal & task hooks
│   └── soundPlayer.js    # Cross-platform audio playback (zero deps)
├── media/
│   ├── success.mp3       # Built-in success chime
│   ├── error.mp3         # Built-in error alert
│   ├── longrun.mp3       # Built-in long-run notification
│   └── icon.png          # Extension icon
├── CHANGELOG.md
└── LICENSE
```

### How It Works

1. **Activation** — The extension activates on VS Code startup and registers terminal shell execution listeners (VS Code 1.93+ API)
2. **Interception** — When a terminal command starts, a long-run timer begins. When it ends, the exit code determines which sound plays
3. **Playback** — Audio is played via platform-native CLI tools (`afplay` on macOS, `mpg123`/`paplay` on Linux, PowerShell on Windows) — no npm audio dependencies needed
4. **Tasks** — VS Code task completions are also monitored via `onDidEndTaskProcess`

## Platform Requirements

| Platform | Audio Backend | Notes |
|---|---|---|
| **macOS** | `afplay` (built-in) | Works out of the box |
| **Linux** | `mpg123` or `paplay` | Install via `sudo apt install mpg123` if needed |
| **Windows** | PowerShell `MediaPlayer` | Works out of the box |

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/my-feature`
3. Commit your changes: `git commit -m "Add my feature"`
4. Push to the branch: `git push origin feature/my-feature`
5. Open a Pull Request

## License

MIT License. See [LICENSE](LICENSE) for details.

---

Built for developers who multitask and forget to check their terminals.
