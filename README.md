# Pipe Link Generator

⚠️ **AVVISO IMPORTANTE - PROGRAMMA DI TEST** ⚠️

Questa applicazione è stata sviluppata esclusivamente per scopi di **testing e sviluppo**. 

**Si sconsiglia fortemente l'utilizzo in ambiente di produzione** in quanto:
- Potrebbe contenere bug non ancora individuati
- Non è stata testata approfonditamente
- Il supporto è limitato
- Potrebbe subire modifiche radicali senza preavviso

---

Applicazione desktop cross-platform per gestire e generare file promozionali con marchi di pipe.

---

## Caratteristiche

### Gestione Marchi
- **Visualizzazione**: Lista completa dei marchi con ricerca e filtro
- **Selezione multipla**: Checkbox per selezionare più marchi contemporaneamente
- **CRUD completo**: Aggiungi, modifica ed elimina marchi
- **Test link**: Verifica se i link funzionano correttamente
- **Generazione bit.ly**: Crea link corti automaticamente tramite API
- **Esportazione**: Esporta la lista dei marchi in file TXT (ITA/ENG)

### Editor Template
- **Header personalizzabile**: Messaggio promozionale iniziale (ITA/ENG)
- **Footer personalizzabile**: Messaggio finale con firma (ITA/ENG)
- **Anteprima**: Visualizzazione in tempo reale del template

### Generazione File
- **Selezione marchi**: Scegli quali marchi includere nel file
- **Riordinamento**: Drag & drop per modificare l'ordine dei marchi
- **Anteprima**: Visualizza il contenuto finale prima del download
- **Download**: Salva file pipe-ita.txt e pipe-en.txt

### Integrazione WhatsApp
- **Configurazione numero**: Imposta il numero WhatsApp nelle impostazioni
- **Invio diretto**: Invia il messaggio direttamente a WhatsApp Desktop o Web

### Aggiornamenti
- **Auto-update**: Controllo automatico nuove versioni su GitHub
- **Notifiche**: Avviso quando è disponibile una nuova versione
- **Installazione manuale**: L'utente conferma prima di aggiornare

---

## Requisiti

- Node.js 18+
- npm 9+

---

## Installazione

### Linux
```bash
npm install
npm run build:linux
```

Esegui il file `.AppImage` generato nella cartella `release/`.

### Windows
```bash
npm install
npm run build:win
```

Esegui il file `.exe` generato nella cartella `release/`.

### macOS
```bash
npm install
npm run build:mac
```

---

## Configurazione

### API Bit.ly
1. Vai su [bitly.com](https://bitly.com/a/oauth_apps)
2. Crea un'app per ottenere il token API
3. Inserisci il token nelle Impostazioni dell'app

### WhatsApp
1. Apri le Impostazioni
2. Inserisci il numero WhatsApp (con prefisso internazionale, es. 393401234567)
3. Salva le impostazioni

---

## Comandi

| Comando | Descrizione |
|---------|-------------|
| `npm run dev` | Avvia in modalità sviluppo |
| `npm run build` | Build frontend |
| `npm run build:linux` | Build per Linux |
| `npm run build:win` | Build per Windows |
| `npm run build:mac` | Build per macOS |

---

## Struttura Progetto

```
pipe-link-generator/
├── electron/           # Backend Electron
│   ├── main.cjs       # Entry point
│   ├── preload.cjs    # Context bridge
│   ├── database.cjs   # SQLite
│   ├── bitly.cjs      # API bit.ly
│   ├── fileGenerator.cjs
│   └── updater.cjs    # Auto-update
├── src/               # Frontend React
│   ├── App.tsx        # Componente principale
│   └── index.css      # Stili TailwindCSS
├── repository/        # File dati originali
└── release/           # Build output
```

---

## Tecnologie

- **Runtime**: Electron 41
- **Frontend**: React 19 + TypeScript
- **Database**: SQLite (better-sqlite3)
- **UI**: TailwindCSS 4
- **Build**: electron-builder

---

## License

MIT

---

## Pubblicazione Aggiornamenti

### Workflow Completo

1. **Aggiorna il codice** (se necessario)
   ```bash
   git add .
   git commit -m "Descrizione modifiche"
   git push origin master
   ```

2. **Incrementa la versione**
   Modifica `version` in `package.json` (es. da "1.0.0" a "1.0.1")

3. **Build Linux**
   ```bash
   npm run build:linux
   ```
   Il file `.AppImage` viene generato in `release/`

4. **Build Windows**
   Sul PC Windows:
   ```bash
   npm run build:win
   ```
   Il file `.exe` viene generato in `release/`

5. **Pubblica su GitHub**
   - Vai su https://github.com/zak066/pipenewsgenerator/releases
   - Crea una nuova release con tag `v1.0.1`
   - Carica entrambi i file (`.AppImage` + `.exe`)

### Con Script (Linux)

```bash
./build-and-publish.sh 1.0.1
```

### Con Script (Windows)

```batch
build-and-publish.bat 1.0.1
```

---

### Note Importanti

- Il tag della release DEVE iniziare con `v` (es. `v1.0.1`)
- L'auto-update funziona automaticamente per tutti gli utenti
- Gli utenti riceveranno una notifica quando una nuova versione è disponibile