#!/usr/bin/env bash
# UV-K1 Web CHIRP F4HWN – GitHub Pages ohne Settings-Dialog einrichten.
# Benötigt: GitHub CLI (gh) und Anmeldung als Repo-Administrator.
set -euo pipefail

OWNER="DE8MSH"
REPO="uvk1_web_chirp_f4hwn"
API="repos/${OWNER}/${REPO}/pages"
SITE="https://de8msh.github.io/uvk1_web_chirp_f4hwn/"

if ! command -v gh >/dev/null 2>&1; then
  echo "GitHub CLI fehlt. Auf Linux Mint installieren mit:"
  echo "  sudo apt update && sudo apt install gh"
  exit 1
fi

if ! gh auth status -h github.com >/dev/null 2>&1; then
  echo "Bitte mit dem GitHub-Konto DE8MSH anmelden:"
  gh auth login --hostname github.com --web --git-protocol https
fi

LOGIN="$(gh api user --jq .login)"
if [[ "${LOGIN,,}" != "${OWNER,,}" ]]; then
  echo "Achtung: Angemeldet als ${LOGIN}, erwartet ${OWNER}."
  echo "Bitte das Konto wechseln: gh auth switch -h github.com"
  exit 1
fi

echo "Prüfe bestehende GitHub-Pages-Konfiguration ..."
if gh api "${API}" >/dev/null 2>&1; then
  echo "Pages existiert. Stelle Branch 'main' und Root '/' ein ..."
  gh api --method PUT "${API}" \
    -f 'build_type=legacy' \
    -f 'source[branch]=main' \
    -f 'source[path]=/' >/dev/null
else
  echo "Aktiviere GitHub Pages aus Branch 'main' und Root '/' ..."
  gh api --method POST "${API}" \
    -f 'build_type=legacy' \
    -f 'source[branch]=main' \
    -f 'source[path]=/' >/dev/null
fi

echo "Prüfe GitHub Pages ..."
gh api "${API}" --jq '"Status: " + (.status // "unbekannt") + "\nURL: " + (.html_url // "noch nicht verfügbar")'
echo
echo "Spätere Website-Adresse: ${SITE}"
echo "Die Veröffentlichung kann einige Minuten beanspruchen."
