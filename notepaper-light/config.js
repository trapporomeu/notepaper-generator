const CONFIG = {
  title: 'LIGHT NOTEPAPER',
  backendUrl: '',   // deixe vazio para gerar no navegador; ou ex.: 'https://seu-dominio.com/api/notepaper'
  passHash: '445c22295dbfa09a5a1c44144032bf8e48a8353309d01c589e16a591a2d47214',   // SHA-256 da senha numerica (a senha em si nao fica no codigo)
  thumbBorder: '#58595B',   // borda das miniaturas do índice (igual no dark e no light)
  thumbInk: '#939598',      // linhas de papel nas miniaturas (igual no dark e no light)
  thumbStruct: '#4D4D4F',   // divisórias/margens nas miniaturas (igual no dark e no light)
  line: {color: '#565656', code: 'black'},
  presetTitle: 'Light',
  presets: 'ffffff ffe6ea ffe6f3 fde6ff f6e6ff ede6ff e6e8ff e7f4f9 e7f9f6 e7f9e7 f8f6d9 f8e9d9 f6e5e2 ebddf3 f3dde9'.split(' ')
};
