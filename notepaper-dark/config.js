const CONFIG = {
  title: 'DARK NOTEPAPER',
  backendUrl: '',   // deixe vazio para gerar no navegador; ou ex.: 'https://seu-dominio.com/api/notepaper'
  passHash: '445c22295dbfa09a5a1c44144032bf8e48a8353309d01c589e16a591a2d47214',   // SHA-256 da senha numerica (a senha em si nao fica no codigo)
  thumbBorder: '#58595B',   // borda das miniaturas do índice (igual no dark e no light)
  thumbInk: '#939598',      // linhas de papel nas miniaturas (igual no dark e no light)
  thumbStruct: '#4D4D4F',   // divisórias/margens nas miniaturas (igual no dark e no light)
  line: {color: '#ffffff', code: 'white'},
  presetTitle: 'Dark',
  presets: '000000 575b86 6b5786 8d5e7b 886067 897478 6c8778 74826e 60423d 20215b 40205b'.split(' ')
};
