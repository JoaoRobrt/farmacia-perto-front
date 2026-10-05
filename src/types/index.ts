export type Estado = {
  sigla: string;
  nome: string;
};

export type Municipio = {
  id: string;
  nome: string;
  uf: string;
};

export type Farmacia = {
  id: string;
  nome: string;
  endereco: string;
  bairro: string;
  municipioId: string;
  latitude: number;
  longitude: number;
};
