# 07 SystemVerilog for UVM 1

## Controle do bloco

- **Bloco:** 016
- **Arquivo de origem:** `C:\Users\maiko\ci_expert\Aulas2Prints\03 SystemVerilog Refresher\07 SystemVerilog for UVM 1.docx`
- **Faixa processada:** slides visíveis do DOCX, distribuídos em 9 páginas
- **Caminho sugerido para salvar:** `C:\Users\maiko\ci_expert\mdCursoPt2\03 SystemVerilog Refresher\07 SystemVerilog for UVM 1.md`
- **Roteiro/checklist conferido antes da próxima sugestão:** sim. Este bloco segue a sequência indicada depois de `06 SystemVerilog Reference Design-2`.
- **Próximo bloco recomendado:** 017 — `08 SystemVerilog for UVM 2`
- **Codificação do arquivo gerado:** UTF-8 com BOM, para evitar problemas de acentuação em editores do Windows.

> Observação: o DOCX veio como prints de slides, sem texto editável extraível. O conteúdo abaixo foi reconstruído a partir da leitura visual das páginas/imagens do documento.  
> Observação adicional: este bloco inaugura a parte de **UVM**. Por isso, a explicação aprofunda a ponte entre os testbenches SystemVerilog anteriores e a metodologia UVM.

---

## Resumo executivo

Esta aula introduz **UVM — Universal Verification Methodology**, uma metodologia de verificação construída em SystemVerilog para criar ambientes de verificação reutilizáveis, padronizados e escaláveis.

Nos blocos anteriores, o testbench SystemVerilog era construído manualmente com classes como:

```text
transaction
generator
driver
monitor
scoreboard
environment
test
```

Agora, UVM padroniza essa arquitetura com uma biblioteca de classes base:

```text
uvm_object
uvm_transaction
uvm_sequence_item
uvm_sequence
uvm_component
uvm_driver
uvm_monitor
uvm_agent
uvm_env
uvm_test
uvm_scoreboard
uvm_subscriber
```

A ideia principal é:

```text
não reinventar a estrutura do testbench em cada projeto.
```

UVM fornece uma base comum para:

- criar componentes reutilizáveis;
- fazer verificação guiada por cobertura, CDV — Coverage Driven Verification;
- organizar ambientes por agentes, monitores, drivers, sequencers e scoreboards;
- usar TLM — Transaction Level Modeling — para comunicação entre componentes;
- usar factory para substituir componentes sem reescrever o ambiente;
- distribuir transações para múltiplos consumidores por analysis ports;
- desacoplar produtor e consumidor usando FIFOs TLM.

O bloco é muito conceitual. O foco não é ainda escrever um ambiente UVM completo, mas entender a arquitetura mental: **transações fluem entre componentes por interfaces TLM**, e os componentes são construídos estendendo classes base da biblioteca UVM.

---

## Texto extraído e organizado por slide

### Slide 1 — Universal Verification Methodology (UVM)

UVM é uma metodologia de verificação com **reusable verification components**, ou seja, componentes de verificação reutilizáveis.

Pontos principais do slide:

- UVM é uma metodologia de verificação com componentes reutilizáveis.
- Fornece framework para **coverage driven verification (CDV)**.
- O propósito de CDV é:
  - eliminar esforço e tempo gastos criando centenas de testes;
  - garantir verificação completa por meio de definição antecipada de metas;
  - receber notificações de erro cedo;
  - usar checagem em runtime e análise de erro para simplificar debug.
- Ajuda a desenvolver ambientes de teste reutilizáveis usando um grande conjunto de classes base.
- Reduz o tempo de desenvolvimento do ambiente de verificação.
- Consiste em um conjunto de classes base com métodos definidos.
- UVM é desenvolvido usando SystemVerilog.
- Qualquer ambiente de teste pode ser desenvolvido estendendo o conjunto disponível de classes base da biblioteca UVM.

Interpretação:

UVM é uma forma padronizada de construir testbenches complexos. Ele não é apenas uma biblioteca; é uma metodologia. Em vez de cada time criar sua própria estrutura de generator, driver, monitor e scoreboard, UVM oferece uma arquitetura comum.

O ponto mais importante:

```text
UVM transforma a verificação SystemVerilog orientada a objetos em um padrão reutilizável.
```

---

### Slide 2 — UVM Base Class Library

O slide apresenta três tipos principais de classes base da biblioteca UVM:

```text
UVM Object Class
UVM Transaction Class
UVM Component Class
```

#### UVM Object Class

Pontos do slide:

- É a classe base central com métodos operacionais como:
  - create;
  - copy;
  - clone;
  - compare;
  - print;
  - record;
  - etc.
- Possui campos de identificação de instância, como:
  - name;
  - type name;
  - unique id;
  - etc.
- Também possui random seeding.
- `uvm_transaction` e `uvm_component` são derivadas de `uvm_object`.

Interpretação:

`uvm_object` é a raiz conceitual de muitos objetos UVM. Ela fornece operações comuns que todo objeto de verificação precisa: criar, copiar, comparar, imprimir e registrar.

#### UVM Transaction Class

Pontos do slide:

- Classes de transação são usadas para:
  - stimulus generation;
  - checking.

Interpretação:

Transações representam operações abstratas: leitura, escrita, pacote, comando, burst, transferência de barramento, etc.

Em UVM moderno, é muito comum usar `uvm_sequence_item`, derivado da família de transações.

#### UVM Component Class

Pontos do slide:

- Componentes são objetos dinâmicos que existem durante o tempo de simulação.
- Todo componente UVM é endereçado unicamente por um caminho hierárquico, como:
  - `test.env.agent.driver`
- `uvm_component` passa por três fases diferentes durante simulação:
  - build;
  - connect;
  - run.
- `uvm_component` define:
  - configuration;
  - reporting;
  - transaction recording;
  - factory interfaces.

Interpretação:

`uvm_component` representa blocos estruturais do testbench: driver, monitor, agent, env, scoreboard e test. Esses componentes vivem em uma hierarquia UVM, têm fases de construção/conexão/execução e podem ser criados pela factory.

---

### Slide 3 — UVM Testbench and Environment

O slide apresenta a ideia de **UVM testbench** e **verification components (VCs)**.

Pontos principais:

- Um testbench UVM é composto por ambientes de verificação reutilizáveis chamados **verification components (VC)**.
- Um VC é um ambiente encapsulado, pronto para uso e configurável para:
  - uma interface;
  - um protocolo;
  - um submódulo de design;
  - um sistema completo.
- O VC é aplicado ao DUT para verificar a implementação do protocolo ou do design architecture.
- Esses verification components podem ser armazenados em um repositório da empresa e reutilizados em múltiplos ambientes de verificação.
- O interface verification component é instanciado e configurado para um modo operacional desejado.
- O ambiente de verificação também contém um mecanismo de sequência multicanal, isto é, um **virtual sequencer**.
- O virtual sequencer sincroniza tempo e dados entre diferentes interfaces e permite controle fino do ambiente para um teste específico.

A figura mostra:

```text
Verification Environment
 ├── Sequencer
 ├── VC1
 ├── VC2
 ├── VC3
 └── DUT
      ├── CPU
      ├── RAM
      ├── Peripheral 1
      ├── Peripheral 2
      └── Peripheral 3
```

A figura também mostra um **Interface Verification Component (VC)** com:

```text
Monitor
Driver
Sequencer
```

Interpretação:

Um VC é como um “pacote de verificação” para uma interface ou protocolo. Por exemplo, um VC de AXI poderia conter driver, monitor, sequencer, coverage e checks para o protocolo AXI.

O virtual sequencer entra quando existem múltiplas interfaces e o teste precisa coordená-las.

---

### Slide 4 — UVM Verification Components (1/3)

O slide lista classes constituintes de um **Verification Component (VC)**.

#### Data item / Transaction

Pontos do slide:

- Data items representam a entrada para o DUT.
- Exemplos:
  - bus transactions;
  - ethernet packets.
- Os campos dos data items são randomizados usando constructs de SystemVerilog para criar grande quantidade de tráfego de teste significativo.

Interpretação:

O data item é a transação. Em SystemVerilog puro, criávamos classes como `Packet` ou `reg_item`. Em UVM, normalmente criamos uma classe derivada de `uvm_sequence_item`.

Exemplo conceitual:

```systemverilog
class bus_item extends uvm_sequence_item;
  rand bit [31:0] addr;
  rand bit [31:0] data;
  rand bit        write;
endclass
```

#### Driver / BFM

Pontos do slide:

- O driver é uma entidade ativa que emula lógica que dirige o DUT.
- Um driver abstrato recebe data items e os dirige para o DUT por amostragem e direção dos sinais do DUT.
- Exemplo: interface de barramento com endereço, dado e sinais de read/write.

Interpretação:

O driver converte transação em atividade de pinos. Ele é ativo porque dirige sinais.

#### Sequencer

Pontos do slide:

- O sequencer é um gerador avançado de estímulos que controla os itens fornecidos ao driver.
- O driver demanda itens, e o sequencer entrega.
- O sequencer captura importantes requisitos de randomização fora do gerador randômico simples.
- Ele reage ao estado atual do DUT para cada data item gerado.
- Ele captura a ordem entre data items em user-defined sequences, formando estímulo mais estruturado e significativo.
- Habilita modelagem de tempo em cenários reutilizáveis.
- Suporta constraints declarativas e procedurais para o mesmo cenário.
- Permite sincronização em nível de sistema e controle de múltiplas interfaces.

Interpretação:

No testbench SystemVerilog manual, o generator criava itens e colocava na mailbox. Em UVM, essa função é organizada por **sequence** e **sequencer**. A sequence define o fluxo de transações. O sequencer gerencia a entrega dessas transações ao driver.

---

### Slide 5 — UVM Verification Components (2/3)

O slide foca no **monitor**.

Pontos principais:

- O monitor é uma entidade passiva que amostra sinais do DUT, mas não os dirige.
- Monitores coletam informações de coverage e fazem checking.
- Embora drivers e sequencers reutilizáveis dirijam tráfego de barramento, eles não são usados para coverage e checking. Monitores são usados para isso.
- O monitor coleta transações — data items — e extrai informação de sinais de um barramento.
- Ele traduz essa informação para uma transação que pode ser disponibilizada para outros componentes e para o test writer.
- O monitor reconhece eventos, detecta disponibilidade de informação, estrutura dados e emite eventos para notificar outros componentes sobre a disponibilidade da transação.
- Ele também captura status e apresenta para outros componentes e para o test writer.
- O monitor realiza checagem e coverage.
- Checking geralmente consiste em protocol and data checkers para verificar se a saída do DUT atende à especificação do protocolo.
- Coverage também é coletada no monitor.
- Opcionalmente imprime trace information.
- Um bus monitor lida com todos os sinais e transações de um barramento.
- Um agent monitor lida apenas com sinais e transações relevantes para um agent específico.
- Drivers e monitors normalmente são construídos como entidades separadas, mesmo que usem os mesmos sinais, para poderem trabalhar independentemente. O código pode ser reutilizado.

Interpretação:

Monitor é um dos componentes mais importantes em UVM. Ele fica olhando a interface, reconstruindo transações e enviando essas transações para scoreboards, coverage collectors e subscribers.

Regra mental:

```text
driver dirige
monitor observa
```

Essa separação evita acoplamento e facilita reuso.

---

### Slide 6 — UVM Verification Components (3/3)

O slide apresenta **agent** e **environment**.

#### Agent

Pontos principais:

- Sequencers, drivers e monitors são reutilizados independentemente, mas integrados em um envelope chamado **agent**.
- O agent aprende nomes, papéis, configuração e hook-up dessas entidades.
- O agent é um container mais abstrato que reduz o trabalho e o conhecimento exigido do test writer.
- Agents podem emular e verificar dispositivos DUT.
- Eles encapsulam:
  - driver;
  - sequencer;
  - monitor.
- Verification components podem ter mais de um agent.
- Alguns agents, por exemplo master ou transmit agents, iniciam transações para o DUT.
- Outros agents, por exemplo slave ou receive agents, reagem a requests de transação.
- Agents devem ser configuráveis para serem ativos ou passivos.
- Active agents emulam devices e dirigem transações conforme diretivas do test.
- Passive agents apenas monitoram atividade do DUT.

Interpretação:

O agent é um pacote completo para uma interface. Ele contém tudo que é necessário para dirigir e observar aquela interface.

Dois modos importantes:

```text
active agent  → tem driver + sequencer + monitor
passive agent → tem monitor, mas não dirige sinais
```

#### Environment

Pontos principais:

- O environment, ou `env`, é o componente top-level do VC.
- Contém:
  - um ou mais agents;
  - bus monitors;
  - configuration properties para customizar topologias e comportamento.
- Exemplo: active agent pode ser tornado passive.

Interpretação:

O environment organiza os agents e outros componentes maiores, como scoreboard, coverage collectors e virtual sequencer.

---

### Slide 7 — UVM Reusable Verification Components

O slide mostra um ambiente UVM típico reutilizável.

Pontos principais:

- A figura mostra um ambiente UVM reutilizável típico.
- Ele é um VC flexível, reutilizável e extensível.
- A classe de environment permite:
  - geração de constraint random stimulus;
  - monitoramento de respostas do DUT;
  - checagem de conformidade com protocolos;
  - coleta de estatísticas de coverage.

A figura mostra:

```text
Verification component environment
 ├── Configuration object
 ├── Bus Monitor / Checker / Coverage
 ├── Master Agent
 │    ├── Configuration object
 │    ├── Sequencer
 │    ├── Agent
 │    ├── Bus Driver
 │    └── Bus Monitor
 ├── Slave Agent
 │    ├── Configuration object
 │    ├── Sequencer
 │    ├── Agent
 │    ├── Bus Driver
 │    └── Bus Monitor
 └── DUT internal bus
```

Interpretação:

O mesmo ambiente pode ser usado em vários projetos porque os elementos são parametrizáveis e configuráveis. Um master agent pode dirigir transações; um slave agent pode responder; o bus monitor observa tudo; coverage e checkers avaliam se o protocolo está correto.

---

### Slide 8 — UVM Class Library

O slide mostra que a biblioteca UVM fornece objetos de classe reutilizáveis para construir ambientes de teste confiáveis rapidamente.

Vantagens listadas:

- Conjunto robusto de recursos built-in.
- Fornece muitos recursos exigidos para verificação, incluindo implementação completa de:
  - printing;
  - copying;
  - test phases;
  - factory methods;
  - e mais.
- Conceitos UVM corretamente implementados.
- Cada componente no ambiente UVM é derivado de um componente correspondente na UVM Class Library.

A figura mostra parte da hierarquia da biblioteca UVM:

```text
uvm_object
 ├── uvm_report_object
 │    └── uvm_component
 │         ├── uvm_driver
 │         ├── uvm_monitor
 │         ├── uvm_agent
 │         ├── uvm_env
 │         ├── uvm_test
 │         ├── uvm_scoreboard
 │         └── uvm_subscriber
 ├── uvm_transaction
 │    └── uvm_sequence_item
 │         └── uvm_sequence
 └── TLM classes
```

Interpretação:

UVM não pede que você crie tudo do zero. Você estende classes base. Por exemplo:

```systemverilog
class my_driver extends uvm_driver #(my_item);
class my_monitor extends uvm_monitor;
class my_agent extends uvm_agent;
class my_env extends uvm_env;
class my_test extends uvm_test;
```

Isso dá ao seu componente acesso a fases, factory, reporting, configuração e TLM.

---

### Slide 9 — UVM Test Environment Using Class Library Components

O slide mostra um ambiente de teste usando componentes da biblioteca UVM.

Pontos principais:

- A figura mostra um ambiente de teste usando UVM library components.
- O ambiente é:
  - facilmente legível;
  - manutenível;
  - reutilizável entre projetos de design.

A figura mostra novamente:

```text
UVM Verification Environment
 ├── Configuration Object
 ├── UVM Monitor / Checker / Coverage
 ├── UVM Master Agent
 │    ├── Configuration Object
 │    ├── UVM Sequencer
 │    ├── UVM Agent
 │    ├── UVM Driver
 │    └── UVM Monitor
 ├── UVM Slave Agent
 │    ├── Configuration Object
 │    ├── UVM Sequencer
 │    ├── UVM Agent
 │    ├── UVM Driver
 │    └── UVM Monitor
 └── DUT internal bus
```

Interpretação:

Esse slide reforça que UVM formaliza o padrão visto no SystemVerilog manual. A diferença é que agora os blocos têm nomes, fases e funções padronizadas pela biblioteca.

---

### Slide 10 — UVM Factory

O slide apresenta o conceito de **UVM Factory**.

Pontos principais:

- O conceito de UVM Factory é adotado do desenvolvimento de software.
- Nesse conceito, o processo de design cria código genérico, adiando para runtime a especificação exata do objeto que será criado.
- A factory permite substituir o verification component sem precisar fornecer uma versão derivada do parent component no código original.
- A UVM Class Library fornece uma factory central built-in que permite:
  - controlar alocação de objetos no ambiente inteiro ou para objetos específicos;
  - modificar stimulus data items e componentes de infraestrutura;
  - facilitar reuso e ajuste de verification IP predefinido no ambiente do usuário.
- A UVM Factory é transparente para o test writer e reduz a expertise orientada a objetos exigida de desenvolvedores e usuários.

Interpretação:

Factory é um dos conceitos mais importantes de UVM. Ela permite trocar a implementação real de um componente sem editar o código que o instancia.

Exemplo conceitual:

```text
O env pede: crie um driver padrão.
A factory decide: crie my_special_driver no lugar.
```

Isso é útil para criar testes que substituem transações, drivers ou componentes por versões especializadas.

Em UVM, isso aparece como **override**:

```systemverilog
base_item::type_id::set_type_override(derived_item::get_type());
```

A ideia é:

```text
o código continua genérico;
o teste escolhe a versão concreta em runtime.
```

---

### Slide 11 — UVM TLM

O slide apresenta **TLM — Transaction Level Modeling** em UVM.

Pontos principais:

- Componentes UVM se comunicam por interfaces TLM padrão, melhorando reuso.
- Classes de componentes UVM VC se comunicam com outra classe componente por meio da mesma interface.
- A interface TLM consiste em um ou mais métodos usados para transportar dados.
- TLM especifica o comportamento requerido, ou semântica, de cada método, mas não define sua implementação.
- Classes que herdam uma interface TLM devem fornecer uma implementação que atenda à semântica especificada.
- Assim, um componente pode ser conectado em nível de transação a outros componentes implementados em múltiplos níveis de abstração.
- A semântica comum da comunicação TLM permite que componentes sejam trocados sem afetar o restante do ambiente.

Interpretação:

TLM é a forma padronizada de componentes UVM trocarem transações.

Em vez de uma classe chamar diretamente métodos internos de outra classe, elas se conectam por portas/exports/imps TLM. Isso reduz acoplamento e aumenta reuso.

Pense assim:

```text
driver não precisa saber como o sequencer é implementado;
scoreboard não precisa saber como o monitor foi escrito;
eles só precisam concordar na interface TLM.
```

---

### Slide 12 — UVM Transactions

O slide explica transações em UVM.

Pontos principais:

- Em UVM, uma transação é um objeto de classe, `uvm_transaction`, estendido de `uvm_object`.
- A transação inclui qualquer informação necessária para modelar uma unidade de comunicação entre dois componentes.
- O objeto de transação inclui:
  - variáveis;
  - constraints;
  - outros campos e métodos necessários para gerar e operar na transação.
- O exemplo `simple_trans` pode ser estendido para incluir:
  - número de wait states;
  - tamanho da transferência;
  - outras propriedades.
- A transação também pode ser estendida para incluir constraints adicionais.
- Transações podem ser:
  - compostas;
  - decompostas;
  - estendidas;
  - colocadas em camadas;
  - manipuladas para modelar comunicação em qualquer nível de abstração.

O slide mostra um exemplo semelhante a:

```systemverilog
class simple_trans extends uvm_transaction;
  rand data_t data;
  rand addr_t addr;
  rand enum {READ, WRITE} kind;

  constraint c1 {
    addr < 16'h2000;
  }
endclass
```

Interpretação:

A transação é o “pacote de significado” que trafega entre componentes. Ela pode representar desde uma simples leitura de registrador até um pacote Ethernet ou uma transação AXI complexa.

---

### Slide 13 — UVM Transaction Level Communication (1/2)

O slide apresenta comunicação TLM do tipo **put**.

Pontos principais:

- Interfaces em nível de transação definem um conjunto de métodos que usam objetos de transação como argumentos.
- Uma TLM port define o conjunto de métodos, isto é, a API a ser usada para uma conexão específica.
- Uma TLM export fornece a implementação desses métodos.
- Conectar uma port a uma export permite que a implementação seja executada quando o método da port é chamado.
- A operação transacional mais básica permite que um componente coloque uma transação em outro.
- A chamada `put()` no producer bloqueia até que a implementação `put` do consumer complete.
- Fora isso, a operação do producer é completamente independente da implementação `put` do consumer.
- TLM cria um ambiente em que componentes podem ser facilmente reutilizados, porque as interfaces são bem definidas.

A figura mostra:

```text
Producer --put_port--> Consumer
```

Exemplo conceitual:

```systemverilog
class producer extends uvm_component;
  uvm_blocking_put_port #(simple_trans) put_port;

  function new(string name, uvm_component parent);
    super.new(name, parent);
    put_port = new("put_port", this);
  endfunction

  virtual task run_phase(uvm_phase phase);
    simple_trans t;

    for (int i = 0; i < 10; i++) begin
      t = simple_trans::type_id::create("t");
      // gerar transação
      put_port.put(t);
    end
  endtask
endclass
```

Consumer:

```systemverilog
class consumer extends uvm_component;
  uvm_blocking_put_imp #(simple_trans, consumer) put_export;

  function new(string name, uvm_component parent);
    super.new(name, parent);
    put_export = new("put_export", this);
  endfunction

  task put(simple_trans t);
    // consumir transação
  endtask
endclass
```

Interpretação:

`put()` é produtor empurrando transação para consumidor. Se for blocking, o produtor espera o consumidor terminar.

---

### Slide 14 — UVM Transaction Level Communication (2/2)

O slide apresenta comunicação TLM do tipo **get**.

Pontos principais:

- O consumer requisita transações do producer por meio de sua get port.
- A implementação de `get()` é fornecida pelo producer.
- Assim como `put()`, a chamada `get()` do consumer bloqueia até que o método `get` do producer complete.

A figura mostra:

```text
Get Consumer --get_port--> Get Producer
```

Exemplo conceitual:

```systemverilog
class get_consumer extends uvm_component;
  uvm_blocking_get_port #(simple_trans) get_port;

  function new(string name, uvm_component parent);
    super.new(name, parent);
    get_port = new("get_port", this);
  endfunction

  virtual task run_phase(uvm_phase phase);
    simple_trans t;

    for (int i = 0; i < 10; i++) begin
      get_port.get(t);
      // processar transação recebida
    end
  endtask
endclass
```

Producer:

```systemverilog
class get_producer extends uvm_component;
  uvm_blocking_get_imp #(simple_trans, get_producer) get_export;

  function new(string name, uvm_component parent);
    super.new(name, parent);
    get_export = new("get_export", this);
  endfunction

  task get(output simple_trans t);
    t = simple_trans::type_id::create("t");
    // preencher transação
  endtask
endclass
```

Interpretação:

`get()` é consumidor puxando transação do produtor. Se for blocking, ele espera até haver transação disponível.

Resumo:

```text
put → producer empurra
get → consumer puxa
```

---

### Slide 15 — UVM Process Level Communication

O slide apresenta comunicação em nível de processo usando **uvm_tlm_fifo**.

Pontos principais:

- Quando componentes precisam trabalhar independentemente, sem handshake direto de transações por `put/get`, UVM fornece comunicação interprocessos.
- O canal `uvm_tlm_fifo` fornece essa comunicação.
- `uvm_tlm_fifo` implementa todos os métodos da interface TLM.
- Assim, o producer coloca a transação na FIFO, enquanto o consumer obtém a transação da FIFO independentemente.
- O producer só bloqueia se a FIFO estiver cheia; caso contrário, coloca a transação e retorna.
- A operação `get` retorna imediatamente se houver transação disponível.

A figura mostra:

```text
Producer → tlm_fifo → get_consumer
```

Interpretação:

A FIFO desacopla produtor e consumidor. Eles não precisam sincronizar diretamente um com o outro.

Sem FIFO:

```text
producer.put(t) chama diretamente consumer.put(t)
```

Com FIFO:

```text
producer.put(t) coloca na fila
consumer.get(t) retira quando puder
```

Isso é parecido com mailbox em SystemVerilog puro, mas padronizado dentro de UVM/TLM.

---

### Slide 16 — UVM TLM Connection Types

O slide mostra tipos de conexão TLM e a forma de `connect()`.

Tabela:

| Connection type | `connect()` form |
|---|---|
| port-to-export | `comp1.port.connect(comp2.export);` |
| port-to-port | `subcomponent.port.connect(port);` |
| export-to-export | `export.connect(subcomponent.export);` |

Interpretação:

Conexões TLM são feitas no `connect_phase`.

Exemplo típico:

```systemverilog
function void connect_phase(uvm_phase phase);
  super.connect_phase(phase);

  producer.put_port.connect(consumer.put_export);
endfunction
```

A conexão define o caminho pelo qual a transação vai fluir.

---

### Slide 17 — UVM TLM Analysis Ports

O slide apresenta **analysis ports**.

Pontos principais:

- Analysis ports são comunicação focada.
- A transação é distribuída usando analysis port para o restante do ambiente para:
  - end-to-end checking;
  - scoreboarding;
  - cobertura adicional.
- `uvm_analysis_port`, representado como diamante no monitor da figura, é uma port TLM especializada cuja interface consiste em uma única função:
  - `write()`.
- Uma analysis port contém um número de `analysis_exports` conectadas a ela.
- Quando o componente chama `analysis_port.write()`, a analysis port percorre a lista e chama o método `write()` de cada export conectado.
- Analysis port é conectada a uma ou mais exports.
- No parent environment, as analysis ports são conectadas aos analysis exports dos componentes desejados, como:
  - coverage collectors;
  - scoreboards.
- A classe base `uvm_subscriber` pode ser usada para simplificar um componente export que implementa a função `write`.

A figura mostra:

```text
Producer/Monitor → analysis_port → subscriber/scoreboard/coverage
```

Interpretação:

Analysis port é usada quando um componente quer publicar uma transação para vários consumidores sem se importar com quem são eles.

Uso típico:

```text
monitor observa uma transação
monitor chama ap.write(t)
scoreboard recebe
coverage collector recebe
logger recebe
```

O monitor não bloqueia esperando o scoreboard processar, e não precisa conhecer os consumidores.

Exemplo conceitual:

```systemverilog
class my_monitor extends uvm_monitor;
  uvm_analysis_port #(simple_trans) ap;

  function new(string name, uvm_component parent);
    super.new(name, parent);
    ap = new("ap", this);
  endfunction

  task run_phase(uvm_phase phase);
    simple_trans t;
    forever begin
      // capturar transação
      ap.write(t);
    end
  endtask
endclass
```

Subscriber:

```systemverilog
class my_subscriber extends uvm_subscriber #(simple_trans);

  function void write(simple_trans t);
    // processar transação recebida
  endfunction

endclass
```

---

### Slide 18 — UVM TLM Analysis Exports

O slide aprofunda analysis exports.

Pontos principais:

- A conexão TLM entre uma analysis port e uma export permite que a export forneça a implementação de `write()`.
- Se múltiplas exports estão conectadas a uma analysis port, a port chama `write()` de cada export em ordem.
- Quando múltiplos subscribers são conectados a uma analysis port, cada um recebe um ponteiro para o mesmo transaction object, como argumento para a chamada `write()`.
- Cada implementação de `write()` deve fazer uma cópia local da transação e operar na cópia para evitar corromper o conteúdo da transação para outros subscribers que possam ter recebido o mesmo ponteiro.
- UVM também inclui uma `analysis_fifo`, que é uma `uvm_tlm_fifo` com uma analysis export. Ela permite que componentes bloqueantes acessem a transação de análise.
- A `analysis_fifo` é unbounded, então a chamada `write()` do monitor é garantida para suceder imediatamente.
- O componente de análise pode então obter as transações da analysis_fifo quando quiser.

A figura mostra:

```text
Producer → tlm_fifo → get_ip_consumer
             ↓
           sub1
           sub2
```

Exemplo de conexão:

```systemverilog
class my_env extends uvm_env;

  my_monitor mon;
  my_scoreboard scb;
  my_coverage cov;

  function void connect_phase(uvm_phase phase);
    super.connect_phase(phase);

    mon.ap.connect(scb.analysis_export);
    mon.ap.connect(cov.analysis_export);
  endfunction

endclass
```

Interpretação:

Essa é uma diferença importante: o monitor publica uma transação uma vez, mas múltiplos consumidores podem recebê-la. Por isso cada consumer deve copiar a transação se for modificar algo.

---

## Aula didática desenvolvida

### 1. Como UVM se encaixa nos blocos anteriores

Nos blocos anteriores, você viu testbenches SystemVerilog feitos manualmente:

```text
Packet
generator
driver
monitor
scoreboard
environment
test
mailbox
event
virtual interface
```

UVM pega esse padrão e transforma em uma metodologia padronizada:

| SystemVerilog manual | UVM |
|---|---|
| `Packet` / `reg_item` | `uvm_sequence_item` / `uvm_transaction` |
| generator | `uvm_sequence` + `uvm_sequencer` |
| driver | `uvm_driver` |
| monitor | `uvm_monitor` |
| scoreboard | `uvm_scoreboard` |
| environment | `uvm_env` |
| test | `uvm_test` |
| mailbox | TLM ports/exports/FIFOs |
| custom print/copy/compare | métodos herdados de `uvm_object` |
| criação manual com `new()` | criação via factory |

A estrutura mental é a mesma, mas agora existe uma biblioteca base com fases, comunicação e factory.

---

### 2. UVM não é outra linguagem

UVM é escrito em SystemVerilog.

Isso é importante:

```text
SystemVerilog fornece classes, OOP, constraints, coverage, assertions e interfaces.
UVM organiza tudo isso em uma metodologia e biblioteca.
```

Então, quando o slide diz:

```text
UVM is developed using SystemVerilog
```

ele está dizendo que UVM usa os recursos avançados de SystemVerilog que você estudou antes.

---

### 3. CDV — Coverage Driven Verification

Coverage Driven Verification significa que a verificação é guiada por metas de cobertura.

Fluxo mental:

```text
1. Definir o que precisa ser coberto.
2. Rodar testes.
3. Medir coverage.
4. Ver buracos.
5. Criar novos estímulos ou constraints.
6. Repetir até atingir as metas.
```

Isso evita escrever centenas de testes cegamente.

O objetivo não é apenas gerar muitos estímulos. É garantir que os cenários importantes foram exercitados.

---

### 4. `uvm_object`: raiz dos objetos reutilizáveis

`uvm_object` fornece métodos que você teria que escrever manualmente:

```text
copy
clone
compare
print
record
create
```

Em um testbench manual, você criava funções como:

```systemverilog
function void copy(Packet tmp);
function void print(string tag);
```

Em UVM, a infraestrutura já espera que objetos tenham esses comportamentos.

Isso padroniza transações e facilita debug.

---

### 5. `uvm_component`: raiz dos blocos estruturais

`uvm_component` é usado para tudo que tem posição na hierarquia do testbench.

Exemplos:

```text
test
env
agent
driver
monitor
scoreboard
subscriber
```

Esses componentes têm nome e caminho hierárquico:

```text
uvm_test_top.env.agent.driver
```

Isso ajuda em:

- configuração;
- reporting;
- debug;
- factory;
- fases de simulação.

---

### 6. Fases UVM: build, connect, run

O slide cita três fases:

```text
build
connect
run
```

#### Build phase

Cria componentes.

```systemverilog
function void build_phase(uvm_phase phase);
  super.build_phase(phase);
  agent = my_agent::type_id::create("agent", this);
endfunction
```

#### Connect phase

Conecta TLM ports, exports e analysis ports.

```systemverilog
function void connect_phase(uvm_phase phase);
  monitor.ap.connect(scoreboard.analysis_export);
endfunction
```

#### Run phase

Executa estímulo e processos temporais.

```systemverilog
task run_phase(uvm_phase phase);
  // threads com tempo de simulação
endtask
```

Regra prática:

```text
build cria
connect liga
run executa
```

---

### 7. Transaction, sequence e sequencer

Em SystemVerilog manual, o generator fazia tudo:

```text
cria item
randomiza
envia ao driver
controla ordem
```

Em UVM, isso se divide:

#### Transaction / sequence item

É o item individual.

```text
uma leitura
uma escrita
um pacote
um comando
```

#### Sequence

Define a sequência de itens.

```text
faça reset
faça 10 writes
faça 10 reads
faça burst
```

#### Sequencer

Controla a entrega dos itens ao driver.

```text
driver pede próximo item
sequencer entrega item vindo da sequence
```

Essa separação dá muito mais controle e reuso.

---

### 8. Driver em UVM

O driver continua tendo o mesmo papel:

```text
transformar transação em sinais no DUT
```

Ele recebe itens do sequencer e dirige a interface virtual.

Padrão mental:

```text
sequence item → driver → sinais da interface
```

Exemplo conceitual:

```systemverilog
task run_phase(uvm_phase phase);
  forever begin
    seq_item_port.get_next_item(req);
    drive_item(req);
    seq_item_port.item_done();
  end
endtask
```

Esse padrão substitui a mailbox manual usada nos blocos anteriores.

---

### 9. Monitor em UVM

O monitor continua passivo:

```text
não dirige sinais
observa a interface
reconstrói transações
envia para analysis port
```

Padrão:

```systemverilog
ap.write(trans);
```

A analysis port entrega a transação para scoreboard, coverage e subscribers.

---

### 10. Agent: pacote reutilizável da interface

O agent encapsula:

```text
sequencer
driver
monitor
```

Em modo ativo:

```text
sequencer + driver + monitor
```

Em modo passivo:

```text
monitor
```

Isso é útil porque o mesmo agent pode ser usado de dois jeitos:

- para dirigir uma interface em um testbench de bloco;
- para apenas observar a mesma interface em um testbench de sistema.

---

### 11. Environment

O environment organiza:

```text
agents
scoreboards
coverage collectors
configuration objects
virtual sequencer
bus monitors
```

Ele é o topo do verification component.

Em um SoC, o environment pode ter vários agents:

```text
AXI agent
APB agent
UART agent
SPI agent
interrupt agent
memory agent
```

O virtual sequencer coordena sequências entre eles.

---

### 12. Configuration object

As figuras mostram configuration objects dentro do environment e dos agents.

Configuration object guarda parâmetros do ambiente, como:

```text
agent ativo ou passivo
largura do barramento
timeout
modo de protocolo
endereço base
habilitar coverage
habilitar checks
```

Isso permite usar o mesmo component com comportamentos diferentes.

---

### 13. UVM Factory: por que ela importa?

Sem factory, você cria objetos diretamente:

```systemverilog
driver = new("driver", this);
```

Com factory:

```systemverilog
driver = my_driver::type_id::create("driver", this);
```

A diferença é que a factory permite substituir `my_driver` por outro tipo sem mudar essa linha.

Exemplo mental:

```text
teste normal usa normal_driver
teste de erro usa error_inject_driver
teste lento usa delay_driver
```

O environment não precisa saber disso. O test configura a factory.

---

### 14. TLM: comunicação por contrato

TLM define métodos de comunicação.

Exemplo:

```text
put()
get()
write()
```

A ideia é que componentes se conectem por interfaces padronizadas, não por chamadas diretas internas.

Isso permite trocar componentes sem quebrar o ambiente.

---

### 15. `put` versus `get`

#### `put`

O produtor empurra a transação:

```text
producer.put_port.put(t)
```

O consumidor implementa o método `put`.

#### `get`

O consumidor puxa a transação:

```text
consumer.get_port.get(t)
```

O produtor implementa o método `get`.

Resumo:

```text
put → produtor empurra
get → consumidor puxa
```

---

### 16. `uvm_tlm_fifo`: desacoplamento

Sem FIFO, `put()` pode chamar diretamente o consumidor e bloquear até ele terminar.

Com FIFO:

```text
producer coloca na FIFO
consumer retira depois
```

Isso permite que produtor e consumidor trabalhem em ritmos diferentes.

É a versão UVM/TLM da ideia que você já viu com mailbox.

---

### 17. Tipos de conexão TLM

A tabela mostra três tipos:

```text
port-to-export
port-to-port
export-to-export
```

A mais comum para começar é:

```systemverilog
comp1.port.connect(comp2.export);
```

Conexões são feitas no `connect_phase`.

---

### 18. Analysis port: publicação para muitos consumidores

Analysis port é usada principalmente por monitores.

Fluxo:

```text
monitor captura transação
monitor chama ap.write(t)
scoreboard recebe t
coverage recebe t
logger recebe t
```

O monitor não precisa conhecer cada consumidor individualmente. Ele só publica.

Isso é perfeito para arquitetura reutilizável.

---

### 19. Por que cada subscriber deve copiar a transação?

O slide alerta:

```text
todos os subscribers recebem ponteiro para o mesmo objeto
```

Se um subscriber modificar o objeto, pode corromper o dado visto por outro subscriber.

Por isso, cada `write()` deve fazer cópia local se for alterar algo.

Exemplo:

```systemverilog
function void write(my_item t);
  my_item local_t;
  $cast(local_t, t.clone());
  // trabalhar em local_t
endfunction
```

Regra:

```text
recebeu por analysis port e vai modificar? copie antes.
```

---

### 20. `analysis_fifo`

`analysis_fifo` combina dois mundos:

```text
analysis export
+
FIFO TLM
```

O monitor faz:

```text
write()
```

A FIFO guarda.

O consumidor faz:

```text
get()
```

quando quiser.

Isso é útil quando um componente precisa consumir transações de analysis port em ritmo próprio.

---

## Conceitos difíceis explicados em profundidade

### 1. Diferença entre componente e objeto em UVM

#### Objeto

Representa dados ou transações.

Exemplos:

```text
uvm_sequence_item
uvm_transaction
configuration object
```

Deriva de `uvm_object`.

#### Componente

Representa estrutura do ambiente.

Exemplos:

```text
driver
monitor
agent
env
scoreboard
test
```

Deriva de `uvm_component`.

Resumo:

```text
uvm_object → dados e objetos criáveis
uvm_component → blocos hierárquicos do ambiente
```

---

### 2. Por que UVM usa hierarquia?

A hierarquia permite endereçar componentes:

```text
uvm_test_top.env.master_agent.driver
```

Isso ajuda em:

- debug;
- configuração;
- reporting;
- factory overrides;
- conexão TLM;
- organização do ambiente.

---

### 3. Por que UVM separa agent, env e test?

#### Agent

Cuida de uma interface.

```text
driver + sequencer + monitor
```

#### Env

Junta agents e componentes maiores.

```text
agents + scoreboard + coverage + virtual sequencer
```

#### Test

Define o cenário.

```text
qual sequence rodar
quais configs aplicar
quais overrides usar
```

Essa separação permite reuso.

---

### 4. Active agent versus passive agent

#### Active agent

Dirige sinais.

Contém:

```text
sequencer
driver
monitor
```

Uso:

```text
emular master ou slave
gerar tráfego
```

#### Passive agent

Apenas observa.

Contém:

```text
monitor
```

Uso:

```text
monitorar barramento em testbench de sistema
coletar coverage
checar protocolo
```

---

### 5. Por que o monitor faz coverage?

O monitor vê o que realmente aconteceu na interface.

O driver sabe o que tentou dirigir, mas o monitor sabe o que efetivamente ocorreu.

Por isso, coverage e checking devem ficar no monitor ou nos componentes conectados ao monitor.

Exemplo:

```text
driver enviou WRITE
mas reset estava ativo
monitor percebe que transação não foi válida
```

---

### 6. Por que TLM melhora reuso?

Sem TLM, um componente pode depender diretamente do método interno de outro.

Com TLM, eles dependem apenas de um contrato:

```text
este componente tem uma port com método put()
aquele componente tem uma export que implementa put()
```

Se a implementação mudar, a conexão ainda vale.

---

### 7. TLM blocking

Quando o slide diz que `put()` bloqueia, significa:

```text
o producer espera até o consumer terminar a operação put
```

Isso pode ser bom quando você quer sincronização direta.

Mas quando quer desacoplamento, use FIFO.

---

### 8. Analysis port não é para handshake

Analysis port é broadcast.

Ela não pergunta:

```text
você está pronto?
```

Ela chama `write()` nos exports conectados.

Por isso é ótima para monitor publicar transações, mas não para fluxo com controle de backpressure.

---

### 9. Por que analysis FIFO é unbounded?

O slide diz que a `analysis_fifo` é unbounded, então o `write()` do monitor sempre deve conseguir retornar imediatamente.

Isso evita que o monitor trave a simulação porque um consumidor está atrasado.

O consumidor pode retirar depois:

```text
analysis_fifo.get(t)
```

---

### 10. UVM reduz, mas não elimina complexidade

O slide de factory diz que UVM reduz a expertise orientada a objetos exigida, mas isso não significa que UVM é simples.

Ele reduz complexidade por padronização:

```text
nomes comuns
fases comuns
comunicação comum
factory comum
reporting comum
```

Mas ainda exige entender OOP, TLM, phases e arquitetura de testbench.

---

## Figuras, diagramas e elementos visuais importantes

### Página 1 — UVM e UVM Base Class Library

A primeira página apresenta UVM como metodologia reutilizável e mostra os três grandes tipos de classes base: object, transaction e component. Essa é a base do bloco.

### Página 2 — UVM Testbench and Environment / Components 1/3

A figura mostra um DUT com CPU, RAM e periféricos sendo verificado por VCs. Também mostra um VC com monitor, driver e sequencer. Isso visualiza o agent/interface verification component.

### Página 3 — Monitor, Agent e Environment

Mostra que o monitor é passivo e que agent encapsula sequencer, driver e monitor. Também mostra que o environment é o top-level component do VC.

### Página 4 — Reusable VC e Class Library

Mostra ambiente reutilizável com master/slave agents, configuration object, bus monitor/checker/coverage e DUT internal bus. Também mostra parte da hierarquia da biblioteca UVM.

### Página 5 — Environment usando classes UVM e Factory

A figura reforça que UVM cria ambientes legíveis, manuteníveis e reutilizáveis. O slide de factory introduz substituição de componentes em runtime.

### Página 6 — TLM e Transactions

Mostra TLM como interface padrão de comunicação e transactions como objetos derivados de `uvm_transaction`, contendo variáveis e constraints.

### Página 7 — Transaction Level Communication

Mostra os modelos `put` e `get`: produtor empurrando para consumidor e consumidor puxando do produtor.

### Página 8 — Process Level Communication, Connection Types e Analysis Ports

Mostra `uvm_tlm_fifo`, tabela de conexões TLM e analysis port distribuindo transações para múltiplos consumidores.

### Página 9 — Analysis Exports

Mostra que múltiplos subscribers recebem ponteiros para o mesmo objeto e que cada `write()` deve copiar localmente se for modificar a transação.

---

## Pontos de prova e revisão

### Perguntas prováveis

1. **O que é UVM?**  
   Uma metodologia de verificação baseada em SystemVerilog, com componentes reutilizáveis e biblioteca de classes base.

2. **UVM é desenvolvido usando qual linguagem?**  
   SystemVerilog.

3. **Para que serve CDV?**  
   Para guiar a verificação por metas de cobertura, reduzindo criação manual de muitos testes e melhorando completude.

4. **Quais são os três tipos principais de classes base citados?**  
   UVM Object Class, UVM Transaction Class e UVM Component Class.

5. **De qual classe derivam `uvm_transaction` e `uvm_component`?**  
   De `uvm_object`.

6. **Quais fases principais de `uvm_component` aparecem no slide?**  
   Build, connect e run.

7. **O que é um VC?**  
   Verification Component: componente/ambiente encapsulado, reutilizável e configurável para verificar uma interface, protocolo, submódulo ou sistema.

8. **O que contém um agent?**  
   Sequencer, driver e monitor.

9. **Qual a diferença entre active agent e passive agent?**  
   Active agent dirige transações; passive agent apenas monitora.

10. **Qual componente é passivo e não dirige sinais do DUT?**  
    Monitor.

11. **Qual componente transforma data items em sinais do DUT?**  
    Driver.

12. **Qual componente controla os itens fornecidos ao driver?**  
    Sequencer.

13. **Qual componente é o top-level component do VC?**  
    Environment.

14. **Para que serve a factory?**  
    Para criar/substituir objetos e componentes em runtime, facilitando reuso e overrides.

15. **O que é TLM?**  
    Transaction Level Modeling: comunicação padronizada por métodos entre componentes UVM.

16. **O que é uma transaction em UVM?**  
    Um objeto de classe que contém informações necessárias para modelar uma unidade de comunicação.

17. **Em TLM, o que faz `put()`?**  
    Producer empurra transação para outro componente; em blocking put, espera o consumer completar.

18. **Em TLM, o que faz `get()`?**  
    Consumer puxa/requisita transação do producer; em blocking get, espera a transação estar disponível.

19. **Para que serve `uvm_tlm_fifo`?**  
    Para desacoplar producer e consumer, permitindo comunicação independente.

20. **Para que serve analysis port?**  
    Para publicar transações para um ou mais consumidores, como scoreboard e coverage collector.

21. **Qual método existe na interface da analysis port?**  
    `write()`.

22. **Por que subscribers devem copiar a transação recebida?**  
    Porque recebem ponteiro para o mesmo objeto; modificar sem copiar pode corromper o dado visto por outros subscribers.

### Pegadinhas

- UVM não é uma linguagem separada; é uma metodologia/biblioteca em SystemVerilog.
- Driver é ativo; monitor é passivo.
- Sequencer não dirige pinos; ele fornece itens ao driver.
- Agent encapsula driver, sequencer e monitor.
- Passive agent não dirige DUT.
- Environment é top-level do VC, não necessariamente do testbench inteiro.
- Factory permite substituir componentes sem alterar o código base.
- TLM especifica semântica dos métodos, não a implementação.
- `put()` é producer empurrando; `get()` é consumer puxando.
- `uvm_tlm_fifo` desacopla produtor e consumidor.
- Analysis port usa `write()`.
- Analysis port pode chamar múltiplos subscribers.
- O mesmo ponteiro de transação pode ser entregue a vários subscribers; copie antes de modificar.

### Frases para memorizar

```text
UVM é metodologia de verificação reutilizável baseada em SystemVerilog.
CDV guia verificação por metas de cobertura.
uvm_object é a raiz de objetos UVM.
uvm_component é a raiz de componentes hierárquicos.
build cria, connect liga, run executa.
Agent encapsula sequencer, driver e monitor.
Driver dirige; monitor observa.
Active agent dirige; passive agent apenas monitora.
Factory permite substituir componentes em runtime.
TLM transporta transações entre componentes.
put empurra; get puxa.
Analysis port publica transações por write().
```

---

## Relação com projeto/laboratório

### Arquitetura UVM mínima

```text
uvm_test
 └── uvm_env
      ├── uvm_agent
      │    ├── uvm_sequencer
      │    ├── uvm_driver
      │    └── uvm_monitor
      ├── uvm_scoreboard
      └── coverage/subscribers
```

### Fluxo conceitual de uma transação

```text
sequence cria item
sequencer entrega item
driver recebe item
driver dirige interface virtual
DUT responde
monitor observa interface
monitor cria transação observada
analysis_port.write(transação)
scoreboard/coverage recebem
```

### Relação com blocos anteriores

| Blocos SystemVerilog anteriores | UVM 1 |
|---|---|
| `Packet` / `reg_item` | `uvm_sequence_item` / `uvm_transaction` |
| mailbox generator-driver | sequencer-driver TLM |
| monitor manual | `uvm_monitor` |
| scoreboard manual | `uvm_scoreboard` |
| env manual | `uvm_env` |
| test manual | `uvm_test` |
| copy/print manuais | métodos de `uvm_object` |
| generator manual | `uvm_sequence` |
| mailbox/queue | TLM FIFO, ports, exports |

### Próxima etapa esperada

O próximo bloco deve aprofundar a implementação prática de UVM, provavelmente mostrando como criar:

```text
sequence item
sequence
sequencer
driver
monitor
agent
env
test
```

---

## Checklist de qualidade

- [x] Texto dos slides foi reconstruído a partir dos prints do DOCX.
- [x] Conteúdo visual das páginas foi incorporado.
- [x] Conceitos difíceis foram explicados e aprofundados.
- [x] O conteúdo ficou fortemente baseado nos prints do DOCX.
- [x] Código/conceitos foram preservados e explicados com exemplos didáticos.
- [x] Pontos de prova e revisão foram criados a partir dos conceitos apresentados.
- [x] O Markdown ficou útil para estudar sem abrir o DOCX.
- [x] Roteiro/checklist foi conferido antes de sugerir o próximo bloco.
- [x] O próximo bloco indicado segue a sequência do roteiro: `08 SystemVerilog for UVM 2`.

---

## Próximo bloco

**Bloco 017 — 08 SystemVerilog for UVM 2**

Arquivo para anexar:

```text
C:\Users\maiko\ci_expert\Aulas2Prints\03 SystemVerilog Refresher\08 SystemVerilog for UVM 2.docx
```

Salvar em:

```text
C:\Users\maiko\ci_expert\mdCursoPt2\03 SystemVerilog Refresher\08 SystemVerilog for UVM 2.md
```
