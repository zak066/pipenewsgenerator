# Pipe Link Generator - Documentazione Progetto

## Panoramica
Applicazione desktop cross-platform per generare file promozionali con marchi di pipe. Permette di gestire marchi, creare messaggi personalizzati in italiano e inglese, e inviare direttamente via WhatsApp.

---

## Stack Tecnologico
- **Runtime**: Electron 41+
- **Frontend**: React 19 + TypeScript 5
- **Database**: SQLite (better-sqlite3)
- **UI**: TailwindCSS 4
- **Build**: electron-builder

---

## Struttura Progetto

```
pipe-link-generator/
├── electron/           # Backend Electron
│   ├── main.cjs       # Entry point, IPC handlers
│   ├── preload.cjs    # Context bridge
│   ├── database.cjs   # SQLite operations
│   ├── bitly.cjs      # Bit.ly API integration
│   └── fileGenerator.cjs
├── src/               # Frontend React
│   ├── App.tsx        # Componente principale
│   ├── main.tsx       # Entry point
│   └── index.css      # Stili Tailwind
├── repository/        # File dati originali
├── release/           # Build output
└── package.json
```

---

## Database Schema

### Tabella: marchi
```sql
CREATE TABLE marchi (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  nome TEXT NOT NULL,
  link_ita TEXT,
  link_eng TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

### Tabella: templates
```sql
CREATE TABLE templates (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  nome TEXT NOT NULL,
  header_ita TEXT,
  header_eng TEXT,
  footer_ita TEXT,
  footer_eng TEXT,
  is_default INTEGER DEFAULT 0
);
```

### Tabella: settings
```sql
CREATE TABLE settings (
  key TEXT PRIMARY KEY,
  value TEXT
);
```

---

## Funzionalità

### 1. Gestione Marchi
- Lista marchi con ricerca e filtro
- Selezione multipla con checkbox
- Aggiunta/Modifica/Eliminazione marchi
- Test dei link (verifica funzionamento)
- Generazione link bit.ly automatica
- Esportazione lista marchi (ITA + ENG)

### 2. Editor Template
- Header e footer personalizzabili (ITA/ENG)
- Anteprima in tempo reale
- Salvataggio nel database

### 3. Generazione File
- Selezione marchi da includere
- Riordinamento drag & drop
- Anteprima ITA e ENG
- Download file .txt separati
- Invio diretto via WhatsApp

### 4. Impostazioni
- Configurazione API token bit.ly
- Configurazione API token TinyURL
- Numero WhatsApp per invio messaggi
- **Backup e ripristino database**

### 4.1 Backup Database
- Esportazione del database in file SQL
- Scelta della posizione di salvataggio tramite dialog di sistema
- File nominato con timestamp (`pipe-link-backup-YYYY-MM-DDTHH-MM-SS.sql`)
- Dump completo di tutte le tabelle (marchi, templates, settings)

### 4.2 Ripristino Database
- Selezione file SQL da ripristinare
- Validazione che il file contenga un backup valido (header "-- Backup Pipe Link Generator")
- Conferma richiesta prima di sovrascrivere
- Sostituzione completa dei dati esistenti

---

## Formato File Output

### pipe-ita.txt / pipe-en.txt
```
{header}

_marchio1_
{link}

_marchio2_
{link}

{footer}
```

---

## Installazione e Build

### Prerequisiti
- Node.js 18+
- npm 9+

### Comandi
```bash
# Installazione dipendenze
npm install

# Sviluppo
npm run dev

# Build Linux
npm run build:linux

# Build Windows
npm run build:win

# Build macOS
npm run build:mac
```

### Build Output
- Linux: `release/Pipe Link Generator-1.0.0.AppImage`
- Windows: `release/Pipe Link Generator-1.0.0.exe`
- macOS: `release/Pipe Link Generator-1.0.0.dmg`

---

## API IPC

| Handler | Descrizione |
|---------|-------------|
| `get-marchi` | Restituisce tutti i marchi |
| `add-marchio` | Aggiunge un nuovo marchio |
| `update-marchio` | Modifica un marchio |
| `delete-marchio` | Elimina un marchio |
| `generate-bitly` | Genera link short bit.ly |
| `test-link` | Verifica se un link funziona |
| `get-settings` | Restituisce le impostazioni |
| `set-setting` | Salva un'impostazione |
| `get-templates` | Restituisce i template |
| `save-templates` | Salva i template |
| `generate-files` | Genera il contenuto dei file |
| `save-file` | Salva file su disco |
| `export-marchi` | Esporta tutti i marchi |
| `backup-database` | Crea backup del database |
| `restore-database` | Ripristina da backup |

---

## Key Features ✅
- [x] Cross-platform (Windows, Mac, Linux)
- [x] Database locale SQLite
- [x] Gestione marchi (CRUD)
- [x] Selezione multipla marchi
- [x] Editor template personalizzabile
- [x] Generazione file .txt (ITA + ENG)
- [x] Integrazione API bit.ly
- [x] Test link (verifica funzionamento)
- [x] Esportazione lista marchi
- [x] Drag & drop riordinamento
- [x] Anteprima messaggi
- [x] Invio WhatsApp
- [x] Backup e ripristino database

---

## Note
- Il database viene creato automaticamente nella cartella dati utente
- I template vengono inizializzati con valori predefiniti al primo avvio
- Se i link ENG sono mancanti, vengono reimportati automaticamente
- Per resettare il database, eliminare il file `.db` e riavviare l'app