// Termos da disciplina Arquitetura Computacional.
// resposta: grafia usada nas casas da cruzadinha (maiúsculas, sem acento, sem espaço)
// nome: como o termo aparece no e-book
// pista: dica que NÃO contém a resposta nem a sigla por extenso
// definicao: explicação para estudo e para o gabarito

const TERMOS = [
  {
    id: "CPU", resposta: "CPU", nome: "CPU",
    pista: "Processador principal que executa as instruções dos programas.",
    definicao: "Unidade central de processamento: executa as instruções dos programas, reunindo ULA, UC e registradores."
  },
  {
    id: "ULA", resposta: "ULA", nome: "ULA",
    pista: "Parte da CPU que faz as contas e as operações lógicas.",
    definicao: "Circuito da CPU que realiza operações aritméticas (como somas) e lógicas (como E, OU e NÃO)."
  },
  {
    id: "UC", resposta: "UC", nome: "UC (Unidade de Controle)",
    pista: "Parte da CPU que busca e decodifica instruções e coordena as operações.",
    definicao: "Componente da CPU que busca e decodifica instruções e envia sinais de controle aos demais componentes."
  },
  {
    id: "REGISTRADORES", resposta: "REGISTRADORES", nome: "Registradores",
    pista: "Pequenas memórias ultrarrápidas dentro da CPU que guardam dados em uso.",
    definicao: "Memórias minúsculas e muito rápidas, dentro da CPU, que guardam os dados em uso imediato."
  },
  {
    id: "RAM", resposta: "RAM", nome: "RAM",
    pista: "Componente volátil que guarda os dados dos programas enquanto estão em uso.",
    definicao: "Memória volátil de acesso aleatório: guarda programas e dados em execução e perde o conteúdo sem energia."
  },
  {
    id: "ROM", resposta: "ROM", nome: "ROM",
    pista: "Chip não volátil com programas fixos, como o firmware da placa.",
    definicao: "Memória somente de leitura e não volátil, com conteúdo gravado na fabricação (ex.: firmware de inicialização)."
  },
  {
    id: "EEPROM", resposta: "EEPROM", nome: "EEPROM",
    pista: "Chip não volátil que pode ser apagado e regravado eletricamente pelo usuário.",
    definicao: "Memória não volátil que pode ser apagada e regravada eletricamente, em pequenas quantidades de dados."
  },
  {
    id: "FLASH", resposta: "FLASH", nome: "Flash",
    pista: "Tipo de memória não volátil, rápida e regravável, comum em pendrives e SSDs.",
    definicao: "Memória não volátil regravável em blocos, rápida e barata; usada em pendrives, SSDs e cartões."
  },
  {
    id: "CACHE", resposta: "CACHE", nome: "Cache",
    pista: "Memória muito rápida e pequena, próxima ao processador, que guarda dados recentes.",
    definicao: "Memória pequena e muito rápida, entre a CPU e a RAM, que guarda dados acessados recentemente."
  },
  {
    id: "MEMORIADEMASSA", resposta: "MEMORIADEMASSA", nome: "Memória de massa (armazenamento)",
    pista: "Dispositivo onde os arquivos ficam guardados de forma permanente, como HD ou SSD.",
    definicao: "Armazenamento permanente de grande capacidade, como HDs e SSDs."
  },
  {
    id: "DMA", resposta: "DMA", nome: "DMA",
    pista: "Recurso que permite a periféricos transferir dados à memória sem passar pela CPU.",
    definicao: "Acesso direto à memória: periféricos transferem dados para a memória sem usar a CPU, que fica livre para outras tarefas."
  },
  {
    id: "ADDRESSBUS", resposta: "ADDRESSBUS", nome: "Address bus (barramento de endereço)",
    pista: "Caminho por onde a CPU informa a posição exata na memória a acessar.",
    definicao: "Barramento que transporta o endereço da posição de memória ou do dispositivo a ser acessado."
  },
  {
    id: "DATABUS", resposta: "DATABUS", nome: "Data bus (barramento de dados)",
    pista: "Caminho bidirecional por onde trafegam as informações entre CPU, memória e periféricos.",
    definicao: "Barramento que transporta os dados entre CPU, memória e periféricos, nos dois sentidos."
  },
  {
    id: "MICROCONTROLADOR", resposta: "MICROCONTROLADOR", nome: "Microcontrolador",
    pista: "Chip que reúne CPU, memória e periféricos em um só circuito integrado.",
    definicao: "Chip que integra CPU, memória e periféricos de entrada e saída em um único circuito, usado em sistemas embarcados."
  },
  {
    id: "DUALCORE", resposta: "DUALCORE", nome: "Dual core",
    pista: "Processador com dois núcleos de execução independentes no mesmo chip.",
    definicao: "Processador com dois núcleos de execução, capazes de processar tarefas em paralelo."
  },
  {
    id: "QUADCORE", resposta: "QUADCORE", nome: "Quad core",
    pista: "Processador com quatro núcleos de execução no mesmo chip.",
    definicao: "Processador com quatro núcleos de execução, capazes de processar tarefas em paralelo."
  }
];
