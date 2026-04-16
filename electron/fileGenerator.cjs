async function generateFile(data) {
  const { marchi, templates } = data;
  
  let itaContent = templates.header_ita + '\n\n';
  let engContent = templates.header_eng + '\n\n';
  
  for (const m of marchi) {
    itaContent += '_' + m.nome + '_\n' + (m.link_ita || '') + '\n\n';
    engContent += '_' + m.nome + '_\n' + (m.link_eng || '') + '\n\n';
  }
  
  itaContent += templates.footer_ita;
  engContent += templates.footer_eng;
  
  return {
    ita: itaContent,
    eng: engContent,
    filenameIta: 'pipe-ita.txt',
    filenameEng: 'pipe-en.txt'
  };
}

module.exports = { generateFile };