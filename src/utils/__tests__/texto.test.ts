import { mensagemDeErro, normalizarBusca } from '../texto';

describe('normalizarBusca', () => {
  it('remove acentos, converte para minúsculas e apara espaços', () => {
    expect(normalizarBusca('  São João  ')).toBe('sao joao');
  });

  it('permite comparar termos com e sem acento', () => {
    expect(normalizarBusca('PARAÍBA')).toBe(normalizarBusca('paraiba'));
  });
});

describe('mensagemDeErro', () => {
  it('usa a mensagem do Error quando existe', () => {
    expect(mensagemDeErro(new Error('Falha na rede'), 'Erro padrão')).toBe('Falha na rede');
  });

  it('usa a mensagem padrão para Error sem mensagem', () => {
    expect(mensagemDeErro(new Error(''), 'Erro padrão')).toBe('Erro padrão');
  });

  it('usa a mensagem padrão para valores que não são Error', () => {
    expect(mensagemDeErro('texto', 'Erro padrão')).toBe('Erro padrão');
  });
});
