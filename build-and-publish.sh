#!/bin/bash

# Script per build e pubblicazione su GitHub
# Uso: ./build-and-publish.sh [version]

set -e

# Colori per output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Versione corrente dal package.json
CURRENT_VERSION=$(node -p "require('./package.json').version")
NEW_VERSION=${1:-$CURRENT_VERSION}

echo -e "${YELLOW}========================================${NC}"
echo -e "${YELLOW}  Pipe Link Generator - Build & Publish${NC}"
echo -e "${YELLOW}========================================${NC}"
echo ""
echo "Versione attuale: $CURRENT_VERSION"
echo "Nuova versione: $NEW_VERSION"
echo ""

# Verifica che gh sia installato
if ! command -v gh &> /dev/null; then
    echo -e "${RED}Errore: GitHub CLI (gh) non installato${NC}"
    echo "Installalo da: https://github.com/cli/cli#installation"
    exit 1
fi

# Verifica che l'utente sia loggato su GitHub
if ! gh auth status &> /dev/null; then
    echo -e "${RED}Errore: Non sei loggato su GitHub${NC}"
    echo "Esegui: gh auth login"
    exit 1
fi

# Richiedi conferma
read -p "Procedere con la build e pubblicazione? (s/n) " -n 1 -r
echo ""
if [[ ! $REPLY =~ ^[Ss]$ ]]; then
    echo "Operazione annullata"
    exit 0
fi

echo ""
echo -e "${GREEN}1. Pulizia release folder...${NC}"
rm -rf release/*

echo ""
echo -e "${GREEN}2. Build Linux (AppImage)...${NC}"
npm run build:linux

echo ""
echo -e "${GREEN}3. Pubblicazione su GitHub...${NC}"

# Crea la release
RELEASE_FILE_LINUX=$(ls release/*.AppImage 2>/dev/null | head -1)

if [ -z "$RELEASE_FILE_LINUX" ]; then
    echo -e "${RED}Errore: Nessun file di release trovato${NC}"
    exit 1
fi

# Crea tag
git tag -a "v$NEW_VERSION" -m "Release v$NEW_VERSION"

# Push tag
git push origin "v$NEW_VERSION"

# Crea release su GitHub con file
echo "Upload Linux: $RELEASE_FILE_LINUX"
gh release create "v$NEW_VERSION" \
    --title "Release v$NEW_VERSION" \
    --notes "Build automatica del $(date '+%d/%m/%Y')" \
    "$RELEASE_FILE_LINUX"

echo ""
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}  Pubblicazione completata!${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo "Release creata: https://github.com/zak066/pipenewsgenerator/releases/tag/v$NEW_VERSION"
echo ""
echo "Note:"
echo "- Build Linux completata e pubblicata"
echo "- Per Windows: compila sulla tua macchina Windows con 'npm run build:win'"
echo "- Gli utenti riceveranno la notifica dell'aggiornamento per entrambe le piattaforme"