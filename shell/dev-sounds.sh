#!/usr/bin/env zsh

DEV_SOUNDS_DIR="${HOME}/.config/dev-sounds/sounds"
DEV_SOUNDS_VOLUME=0.1
DEV_SOUNDS_LONGRUN_THRESHOLD=30

# Commands that should never trigger sounds
DEV_SOUNDS_EXEMPT=(
  ls ll la l dir
  cd pushd popd
  pwd
  echo printf
  cat head tail less more
  clear reset
  true false
  which where whence type
  alias unalias
  export set unset
  source
  history fc
  fg bg jobs
  kill
  exit logout
  man help
  nvm
  devsound
)

devsound() {
  local sound_file="${DEV_SOUNDS_DIR}/${1}.mp3"
  if [[ -f "$sound_file" && "$(uname)" == "Darwin" ]]; then
    (afplay -v "$DEV_SOUNDS_VOLUME" "$sound_file" &>/dev/null &)
  fi
}

playsound() {
  {
    sleep "$DEV_SOUNDS_LONGRUN_THRESHOLD"
    local sound_file="${DEV_SOUNDS_DIR}/longrun.mp3"
    if [[ -f "$sound_file" ]]; then
      (afplay -v "$DEV_SOUNDS_VOLUME" "$sound_file" &>/dev/null &)
    fi
  } &!
  local longrun_pid=$!

  "$@"
  local exit_code=$?

  kill "$longrun_pid" 2>/dev/null

  if [[ $exit_code -eq 0 ]]; then
    devsound success
  else
    devsound error
  fi
  return $exit_code
}

# --- Automatic mode via zsh hooks ---

_devsound_cmd=""
_devsound_start=0
_devsound_longrun_pid=""

_devsound_is_exempt() {
  local base_cmd="${1%% *}"
  # Strip leading env vars, sudo, command, builtin, etc.
  while [[ "$base_cmd" == sudo || "$base_cmd" == command || "$base_cmd" == builtin || "$base_cmd" == noglob ]]; do
    shift_cmd="${1#*$base_cmd }"
    base_cmd="${shift_cmd%% *}"
  done
  for exempt in "${DEV_SOUNDS_EXEMPT[@]}"; do
    [[ "$base_cmd" == "$exempt" ]] && return 0
  done
  return 1
}

_devsound_preexec() {
  _devsound_cmd="$1"
  _devsound_start=$SECONDS

  if ! _devsound_is_exempt "$_devsound_cmd"; then
    {
      sleep "$DEV_SOUNDS_LONGRUN_THRESHOLD"
      local sound_file="${DEV_SOUNDS_DIR}/longrun.mp3"
      if [[ -f "$sound_file" ]]; then
        (afplay -v "$DEV_SOUNDS_VOLUME" "$sound_file" &>/dev/null &)
      fi
    } &!
    _devsound_longrun_pid=$!
  fi
}

_devsound_precmd() {
  local last_exit=$?

  # Kill longrun timer if still alive
  if [[ -n "$_devsound_longrun_pid" ]]; then
    kill "$_devsound_longrun_pid" 2>/dev/null
    _devsound_longrun_pid=""
  fi

  # Skip if no command was run or command is exempt
  [[ -z "$_devsound_cmd" ]] && return
  if _devsound_is_exempt "$_devsound_cmd"; then
    _devsound_cmd=""
    return
  fi

  _devsound_cmd=""

  if [[ $last_exit -eq 0 ]]; then
    devsound success
  else
    devsound error
  fi
}

autoload -Uz add-zsh-hook
add-zsh-hook preexec _devsound_preexec
add-zsh-hook precmd _devsound_precmd
