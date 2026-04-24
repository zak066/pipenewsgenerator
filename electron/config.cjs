const path = require('path');
const { app } = require('electron');

const config = {
  db: {
    filename: 'pipe-link.db',
    folder: 'database',
    getPath() {
      if (app.isPackaged) {
        const exeDir = path.dirname(app.getPath('exe'));
        const dbFolder = path.join(exeDir, this.folder);
        return path.join(dbFolder, this.filename);
      } else {
        return path.join(app.getPath('userData'), this.filename);
      }
    },
    ensureFolder() {
      if (app.isPackaged) {
        const exeDir = path.dirname(app.getPath('exe'));
        const dbFolder = path.join(exeDir, this.folder);
        const fs = require('fs');
        if (!fs.existsSync(dbFolder)) {
          fs.mkdirSync(dbFolder, { recursive: true });
        }
      }
    }
  },
  tables: {
    marchi: 'marchi',
    templates: 'templates',
    settings: 'settings'
  },
  api: {
    bitly: {
      baseUrl: 'https://api-ssl.bitly.com/v4',
      endpoints: {
        shorten: '/shorten'
      }
    },
    tinyurl: {
      baseUrl: 'https://api.tinyurl.com',
      endpoints: {
        create: '/create'
      }
    }
  },
  output: {
    filenames: {
      ita: 'pipe-ita.txt',
      eng: 'pipe-en.txt',
      exportIta: 'Elenco Link ITA.txt',
      exportEng: 'Elenco Link ENG.txt'
    }
  },
  repository: {
    path: path.join(__dirname, '..', 'repository')
  },
  validation: {
    marchio: {
      nome: { minLength: 1, maxLength: 255 },
      urlPattern: /^https?:\/\/.+/i
    },
    whatsapp: {
      pattern: /^\+?[0-9]{8,15}$/
    }
  }
};

module.exports = config;