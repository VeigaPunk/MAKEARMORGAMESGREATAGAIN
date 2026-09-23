#!/usr/bin/env bash
# retry wrapper for sr2 long scenarios — chromium on this fleet box gets
# killed by other lanes' cleanups; retries are recorded, only the final
# PASS run counts.
set -u
SCEN="$1"; URL="$2"; LOG="$3"; EV="$4"; ATTEMPTS="${5:-4}"
for i in $(seq 1 "$ATTEMPTS"); do
  echo "[retry-wrapper] attempt $i/$ATTEMPTS scenario=$SCEN" | tee -a "$LOG"
  if node "$(dirname "$0")/sr2-shmup-driver.mjs" "$SCEN" "$URL" "$LOG" "$EV" --append; then
    echo "[retry-wrapper] PASS on attempt $i" | tee -a "$LOG"
    exit 0
  fi
  sleep 3
done
echo "[retry-wrapper] FAIL after $ATTEMPTS attempts" | tee -a "$LOG"
exit 1
