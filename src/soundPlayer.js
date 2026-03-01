const { execFile } = require("child_process");
const os = require("os");
const fs = require("fs");

let activeProcess = null;

/**
 * Play an audio file at the given volume.
 * Uses platform-native CLI tools -- no npm dependencies.
 *
 * @param {string} filePath Absolute path to an MP3/WAV file
 * @param {number} volume   0.0 – 1.0
 */
function play(filePath, volume = 0.3) {
  if (!filePath || !fs.existsSync(filePath)) return;

  const platform = os.platform();

  if (platform === "darwin") {
    const proc = execFile(
      "afplay",
      ["-v", String(volume), filePath],
      () => {}
    );
    proc.unref();
    return proc;
  }

  if (platform === "linux") {
    const gain = String(Math.round(volume * 100));
    const proc = execFile("mpg123", ["-q", "--gain", gain, filePath], (err) => {
      if (err) {
        execFile("paplay", [filePath], () => {}).unref();
      }
    });
    proc.unref();
    return proc;
  }

  if (platform === "win32") {
    const script = `
      Add-Type -AssemblyName presentationCore
      $p = New-Object System.Windows.Media.MediaPlayer
      $p.Volume = ${volume}
      $p.Open([Uri]"${filePath.replace(/\\/g, "\\\\")}")
      $p.Play()
      Start-Sleep -Seconds 10
    `;
    const proc = execFile(
      "powershell",
      ["-NoProfile", "-Command", script],
      () => {}
    );
    proc.unref();
    return proc;
  }

  return null;
}

/**
 * Start a background timer that plays the longrun sound after `seconds`.
 * Returns an object with a `cancel()` method.
 */
function startLongRunTimer(filePath, volume, seconds) {
  const timeout = setTimeout(() => {
    activeProcess = play(filePath, volume);
  }, seconds * 1000);

  return {
    cancel() {
      clearTimeout(timeout);
      if (activeProcess) {
        try {
          activeProcess.kill();
        } catch (_) {}
        activeProcess = null;
      }
    },
  };
}

module.exports = { play, startLongRunTimer };
