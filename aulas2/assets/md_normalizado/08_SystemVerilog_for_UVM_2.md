# 08 SystemVerilog for UVM 2

## Controle do bloco

- **Bloco:** 017
- **Arquivo de origem:** `C:\Users\maiko\ci_expert\Aulas2Prints\03 SystemVerilog Refresher\08 SystemVerilog for UVM 2.docx`
- **Faixa processada:** slides visíveis do DOCX, distribuídos em 10 páginas
- **Caminho sugerido para salvar:** `C:\Users\maiko\ci_expert\mdCursoPt2\03 SystemVerilog Refresher\08 SystemVerilog for UVM 2.md`
- **Roteiro/checklist conferido antes da próxima sugestão:** sim. Este bloco é a continuação direta de `07 SystemVerilog for UVM 1`.
- **Próximo bloco recomendado:** confirmar no roteiro antes de anexar o próximo DOCX; o arquivo atual não mostra a tela final com a sequência seguinte.
- **Codificação do arquivo gerado:** UTF-8 com BOM, para evitar problemas de acentuação em editores do Windows.

> Observação: o DOCX veio como prints de slides, sem texto editável extraível. O conteúdo abaixo foi reconstruído a partir da leitura visual das páginas/imagens do documento.  
> Observação adicional: este bloco é mais prático que o UVM 1. Ele mostra como construir os principais componentes de um ambiente UVM: data item, knobs, driver, sequencer, monitor, agent, environment, scenario creation e controle de fim de teste por objections.

---

## Resumo executivo

Esta aula aprofunda a construção dos **componentes de um testbench UVM**. No bloco anterior, a aula apresentou a arquitetura geral de UVM: base class library, transactions, agents, environments, factory, TLM, analysis ports e analysis exports. Agora, este bloco entra no desenvolvimento prático de um **verification component**.

O slide inicial lista as etapas principais:

```text
Modeling Data Items for Generation
Transaction-Level Components
UVM Driver
UVM Sequencer
UVM Monitor
Instantiating Components
Creating the Agent
Creating the Environment
Enabling Scenario Creation
Managing End of Test
```

A ideia central é transformar o padrão manual de SystemVerilog:

```text
transaction → generator → driver → monitor → scoreboard → environment → test
```

em um padrão UVM:

```text
uvm_sequence_item → uvm_sequence/uvm_sequencer → uvm_driver → uvm_monitor → uvm_agent → uvm_env → uvm_test
```

O bloco mostra como:

- criar um **data item** derivado de `uvm_sequence_item`;
- usar macros de campo para permitir `print()`, `copy()`, `compare()` e automação;
- usar **knobs** para controlar geração de estímulos de modo abstrato;
- construir um **driver** derivado de `uvm_driver`;
- buscar itens do sequencer com `get_next_item()` e finalizar com `item_done()`;
- usar `try_next_item()` para evitar bloqueio;
- enviar resposta de volta ao sequencer;
- construir um **monitor** que coleta transações, faz checks, coleta coverage e publica itens por analysis port;
- instanciar componentes via **factory** usando `type_id::create`;
- montar um **agent** ativo ou passivo;
- criar um **environment** configurável com múltiplos agents;
- criar cenários usando sequências reutilizáveis;
- controlar fim de teste usando **objections**, `raise_objection()` e `drop_objection()`.

O ponto mais importante da aula é:

```text
UVM padroniza a arquitetura, mas cada componente ainda precisa ser criado com responsabilidade clara.
Data item modela a transação.
Sequencer organiza estímulos.
Driver aplica no DUT.
Monitor observa.
Agent agrupa driver, sequencer e monitor.
Environment monta o sistema.
Objections controlam quando a simulação pode terminar.
```

---

## Texto extraído e organizado por slide

### Slide 1 — UVM Testbench Components

O slide lista o que envolve desenvolver um verification component usando UVM.

Itens listados:

- Modeling Data Items for Generation
- Transaction-Level Components
- UVM Driver
- UVM Sequencer
- UVM Monitor
- Instantiating Components
- Creating the Agent
- Creating the Environment
- Enabling Scenario Creation
- Managing End of Test

Interpretação:

Esse slide é o roteiro da aula. A sequência é lógica:

1. Primeiro define-se o **item de dados**, ou seja, a transação.
2. Depois define-se como os componentes se comunicam em nível de transação.
3. Em seguida criam-se driver, sequencer e monitor.
4. Depois esses componentes são instanciados e agrupados em um agent.
5. O agent entra no environment.
6. O ambiente é controlado por cenários.
7. Por fim, UVM precisa saber quando o teste pode terminar.

---

### Slide 2 — Modeling Data Items (1/2)

O slide mostra como criar data items em UVM.

O exemplo deriva uma classe `simple_item` de `uvm_sequence_item`.

Código reconstruído a partir do slide:

```systemverilog
class simple_item extends uvm_sequence_item;

  rand int unsigned addr;
  rand int unsigned data;
  rand int unsigned delay;

  // Adding constraints to data item
  constraint c1 { addr < 16'h2000; }
  constraint c2 { data < 16'h1000; }

  // UVM automation macros for general objects
  // Add to use access macro for UVM factory
  `uvm_object_utils_begin(simple_item)
    `uvm_field_int(addr,  UVM_ALL_ON)
    `uvm_field_int(data,  UVM_ALL_ON)
    `uvm_field_int(delay, UVM_ALL_ON)
  `uvm_object_utils_end

  // Constructor
  function new(string name = "simple_item");
    super.new(name);
  endfunction : new

endclass : simple_item
```

O slide também mostra uma classe derivada que adiciona uma constraint:

```systemverilog
class word_aligned_item extends simple_item;

  // Additional constraint added to the class
  constraint word_aligned_addr {
    addr[1:0] == 2'b00;
  }

  `uvm_object_utils(word_aligned_item)

  // Constructor
  function new(string name = "word_aligned_item");
    super.new(name);
  endfunction : new

endclass : word_aligned_item
```

Interpretação:

O data item é a transação que será gerada e enviada ao driver. Aqui, `addr`, `data` e `delay` são campos randômicos. As constraints limitam os valores legais.

A classe derivada `word_aligned_item` mostra uma ideia essencial de UVM: você pode especializar uma transação sem reescrever tudo. Ela herda `addr`, `data` e `delay` de `simple_item`, mas adiciona a regra de alinhamento de palavra:

```text
addr[1:0] == 0
```

Ou seja, o endereço precisa ser múltiplo de 4.

#### Por que herdar data items?

Porque diferentes testes podem querer variações do mesmo item:

```text
simple_item             → transação geral
word_aligned_item       → transação com endereço alinhado
error_item              → transação inválida para teste negativo
long_delay_item         → transação com delay maior
corner_case_item        → transação com valores extremos
```

Essa é uma das razões pelas quais UVM usa OOP.

---

### Slide 3 — Modeling Data Items (2/2)

O slide explica o processo para criar um data item definido pelo usuário.

Passos listados:

1. Revisar a especificação de transação do DUT e identificar:
   - propriedades específicas da aplicação;
   - constraints;
   - tasks;
   - functions.
2. Derivar uma classe de data item da classe base `uvm_sequence_item`, ou de uma classe derivada dela.
3. Definir um construtor para o data item.
4. Adicionar campos de controle, chamados **knobs**, aos itens identificados no passo 1 para facilitar escrita de testes.
5. Usar UVM field macros para habilitar:
   - printing;
   - copying;
   - comparing;
   - e outras operações.

O slide também destaca que UVM possui macros ou service routines built-in que um data item precisa.

Exemplos citados:

```text
print()   → imprimir um data item
copy()    → copiar o conteúdo de um data item
compare() → comparar dois objetos similares
```

Por fim, o slide afirma:

```text
For debugging, data items have transaction ids or sequence ids.
```

Interpretação:

O data item precisa ser pensado a partir da especificação do DUT. Não é apenas uma classe aleatória. Ele deve representar uma unidade real de comunicação do protocolo.

Exemplo mental:

Para um barramento simples, o item pode ter:

```text
addr
data
write/read
byte enable
delay
burst length
response
```

Para um pacote de rede, o item pode ter:

```text
header
payload
crc
packet_type
length
error_injection
```

---

### Slide 4 — Modeling Data Items: Knobs

O slide apresenta o conceito de **knobs**.

Pontos principais:

- No exemplo mostrado, o delay entre data items é transformado em parâmetro de controle.
- O mecanismo de controle é chamado de **knobs**.
- Knobs são usados para criar variedade de data items de maneira mais abstrata.
- Ranges de campos são geralmente usados para gerar data items, e knobs são adicionados para simplificar as funções de controle.

O código mostra um `typedef enum` para controlar o tipo de delay:

```systemverilog
typedef enum {ZERO, SHORT, MEDIUM, LARGE, MAX} simple_item_delay_e;
```

Depois, a classe possui:

```systemverilog
rand int unsigned addr;
rand int unsigned data;
rand int unsigned delay;

rand simple_item_delay_e delay_kind; // control field
```

A constraint relaciona o knob `delay_kind` com o valor randômico `delay`:

```systemverilog
constraint delay_order {
  solve delay_kind before delay;
}

constraint delay_c {
  (delay_kind == ZERO)   -> delay == 0;
  (delay_kind == SHORT)  -> delay inside {[1:10]};
  (delay_kind == MEDIUM) -> delay inside {[11:99]};
  (delay_kind == LARGE)  -> delay inside {[100:999]};
  (delay_kind == MAX)    -> delay == 1000;
}
```

Interpretação:

Knob é um controle de alto nível. Em vez de o test writer precisar escolher diretamente o valor exato de `delay`, ele escolhe uma categoria:

```text
ZERO
SHORT
MEDIUM
LARGE
MAX
```

e a constraint gera um delay compatível.

Isso simplifica a criação de cenários:

```text
quero um teste com delays curtos
quero um teste com delays longos
quero forçar delay zero
```

O campo `delay_kind` controla o tipo de estímulo sem expor todos os detalhes numéricos.

---

### Slide 5 — UVM Transaction Level Components

O slide mostra uma visão gráfica dos componentes transacionais UVM.

A figura da esquerda mostra conexões de VC em UVM:

```text
Analysis
Monitor with/without coverage checks
Sequencer to generate data
Driver driving transaction items onto DUT
DUT
```

A figura da direita mostra o agrupamento recomendado de UVM VCs dentro de um **Agent**:

```text
Agent
 ├── Analysis
 ├── Monitor with/without coverage checks
 ├── Sequencer to generate data
 └── Driver driving transaction items onto DUT
```

Conexões indicadas:

- `seq_item_export`
- `seq_item_port`
- conexão entre driver e sequencer
- monitor publicando para analysis

Interpretação:

Este slide mostra o padrão que será implementado no restante da aula:

```text
sequencer gera/fornece itens
driver consome itens e dirige o DUT
monitor observa o DUT e publica transações
analysis coleta dados para checks/coverage
agent agrupa tudo isso
```

A figura da direita é importante porque mostra que o agrupamento recomendado é colocar monitor, driver e sequencer dentro do agent.

---

### Slide 6 — UVM Driver (1/2)

O slide mostra um exemplo de código de driver.

Código reconstruído:

```systemverilog
// Derive the driver class
class simple_driver extends uvm_driver #(simple_item);

  simple_item s_item;
  virtual dut_if vif;

  // Add UVM infrastructure macros
  // UVM automation macros for general components
  `uvm_component_utils(simple_driver)

  // Constructor
  function new(string name = "simple_driver", uvm_component parent);
    super.new(name, parent);
  endfunction : new

  function void build_phase(uvm_phase phase);
    string inst_name;

    super.build_phase(phase);

    // Get the resource to define virtual interface
    if (!uvm_config_db #(virtual dut_if)::get(this, "", "vif", vif))
      `uvm_fatal("NOVIF",
        {"Virtual interface must be set for: ", get_full_name(), ".vif"})
  endfunction : build_phase

  task run_phase(uvm_phase phase);
    forever begin
      // Get the next data item from sequencer
      seq_item_port.get_next_item(s_item);

      drive_item(s_item); // Execute the item

      seq_item_port.item_done(); // Consume the request
    end
  endtask : run_phase

  task drive_item(input simple_item item);
    // Add DUT specific logic here
  endtask : drive_item

endclass : simple_driver
```

Interpretação:

O driver em UVM tem três partes fundamentais:

#### 1. Herança

```systemverilog
class simple_driver extends uvm_driver #(simple_item);
```

Isso diz que o driver consome itens do tipo `simple_item`.

#### 2. Virtual interface

```systemverilog
virtual dut_if vif;
```

O driver precisa de uma virtual interface para acessar os sinais reais do DUT.

#### 3. Comunicação com o sequencer

```systemverilog
seq_item_port.get_next_item(s_item);
drive_item(s_item);
seq_item_port.item_done();
```

Esse é o padrão mais importante do driver:

```text
pegar item
dirigir item no DUT
avisar que terminou
```

---

### Slide 7 — UVM Driver (2/2)

O slide explica a função do driver no ambiente UVM.

Pontos principais:

- A função do driver no ambiente de teste UVM é dirigir data items para a interface do DUT seguindo os requisitos de protocolo da interface.
- O driver obtém o data item do sequencer.
- A UVM Class Library fornece a classe base `uvm_driver`, da qual todos os drivers são estendidos direta ou indiretamente.
- O driver tem um método `run()` que define sua operação.
- O driver possui uma TLM port por meio da qual se comunica com o sequencer.
- Podem existir múltiplas run-time phases para operação detalhada.
- Para desenvolver um driver:
  - derive um driver da classe base `uvm_driver`;
  - se desejado, adicione macros de infraestrutura UVM para propriedades da classe, implementando utilidades como printing, copying, comparing etc.;
  - obtenha o próximo data item do sequencer e dirija conforme necessário;
  - declare uma virtual interface no driver para conectá-lo ao DUT.

Interpretação:

Driver é o componente que conhece o protocolo físico da interface. Ele sabe quando colocar sinais, quando esperar clock, quando respeitar `ready`, quando aplicar `valid`, quando liberar os sinais.

O sequencer não sabe disso. O sequencer só fornece transações.

Regra mental:

```text
Sequencer trabalha em nível de item.
Driver trabalha em nível de pino/protocolo.
```

---

### Slide 8 — UVM Sequencer (1/4)

O slide apresenta a classe base `uvm_sequencer`.

Pontos principais:

- O sequencer gera stimulus data e passa ao driver para execução.
- Usa a classe base `uvm_sequencer`.
- A classe é parametrizada pelos tipos de item de request e response.
- O tipo de response é igual ao tipo de request por padrão.
- Se um tipo de response diferente for desejado, o segundo parâmetro opcional deve ser especificado:

```systemverilog
uvm_sequencer #(simple_item, simple_rsp) sequencer;
```

- A classe contém toda a funcionalidade base necessária para permitir que uma sequence se comunique com um driver.
- Só precisa ser estendida quando for necessária customização adicional, como adicionar outra port.
- Driver e sequencer são conectados via TLM, com a `seq_item_port` do driver conectada à `seq_item_export` do sequencer.

Interpretação:

O sequencer é o intermediário entre **sequence** e **driver**.

Fluxo:

```text
sequence cria item
sequencer gerencia entrega
driver pede item
sequencer entrega item
driver executa
driver chama item_done()
```

Em muitos casos, você não precisa escrever uma classe sequencer complexa. Basta:

```systemverilog
typedef uvm_sequencer #(simple_item) simple_sequencer;
```

ou criar uma classe simples que estende `uvm_sequencer #(simple_item)`.

---

### Slide 9 — UVM Sequencer (2/4)

O slide explica melhor a conexão entre driver e sequencer.

Pontos principais:

- Driver e sequencer são conectados via TLM.
- A `seq_item_port` do driver é conectada à `seq_item_export` do sequencer.
- Essa porta é bidirecional.
- Ela usa:
  - `get()` e `peek()` para requisitar item do sequencer;
  - `put()` para fornecer response.
- Outros componentes, como `seq_item_port`, não necessariamente precisam derivar de `uvm_driver`; ainda podem conectar e comunicar com o sequencer, dependendo da interação necessária.

O slide mostra o padrão de código:

```systemverilog
get_next_item(req); // It is blocking statement
// Send item following the protocol.
item_done();
```

Interpretação:

`get_next_item()` é bloqueante. Isso significa que o driver espera até haver um item disponível.

Depois de dirigir o item, o driver chama:

```systemverilog
item_done();
```

Isso libera o sequencer para continuar.

Esse par é o coração da interação básica driver-sequencer.

---

### Slide 10 — UVM Sequencer Interactions (3/4)

O slide apresenta interações mais avançadas entre driver e sequencer.

#### Basic driver-sequencer interaction

Pontos do slide:

- A `seq_item_port` no `uvm_driver` define o conjunto de métodos usados pelo driver para obter o próximo item do sequencer.
- O sequencer implementa métodos que permitem interação flexível e modular entre driver e sequencer.
- A interação básica entre driver e sequencer usa:
  - `get_next_item()`
  - `item_done()`

#### Querying for randomized data item

Pontos do slide:

- A classe `uvm_seq_item_pull_port` fornece uma task adicional chamada `try_next_item()`.
- Ela permite que o driver execute transações idle, por exemplo quando o DUT precisa ser estimulado mesmo sem item significativo disponível.
- Essa task retorna no mesmo simulation step se não houver data item disponível para execução.

Interpretação:

`try_next_item()` não bloqueia. Isso é útil quando o driver precisa continuar operando mesmo sem transação válida.

Exemplo:

```systemverilog
seq_item_port.try_next_item(req);

if (req == null) begin
  drive_idle();
end
else begin
  drive_item(req);
  seq_item_port.item_done();
end
```

#### Fetching consecutive randomized items

Pontos do slide:

- Em alguns protocolos, como protocolos pipeline, o driver pega alguns itens pré-gerados para preencher o pipeline antes de os primeiros itens serem completamente processados.
- Nesses casos, o driver chama `item_done()` sem fornecer response ao sequencer.

Interpretação:

Em protocolos pipeline, o driver pode buscar vários itens em sequência antes de terminar todos, porque o protocolo permite múltiplas transações em voo.

#### Sending processed data back to the sequencer

Pontos do slide:

- Em sequences complexas, as transações podem depender da resposta de dados previamente gerados/recebidos.
- Por padrão, os data items entre driver e sequencer são copiados por referência.
- Isso significa que mudanças feitas pelo driver no data item ficam visíveis ao sequencer.
- Em casos em que o data item entre driver e sequencer é copiado por valor, o driver precisa retornar a response processada ao sequencer.
- Isso é feito com argumento opcional de `item_done()`.

Interpretação:

Se a sequence precisa saber o resultado processado pelo driver, o driver pode devolver uma response.

Exemplo:

```systemverilog
seq_item_port.item_done(rsp);
```

---

### Slide 11 — UVM Sequencer (4/4)

O slide mostra quatro trechos de pseudo-código.

#### 1. Pausar o sequencer enquanto o driver opera na transação

```systemverilog
get(req);
// Process req operation.
get(req);
// Allow sequencer to proceed immediately upon driver receiving transaction
get(req);
```

Interpretação:

Esse trecho diferencia formas de buscar transações. Algumas interações bloqueiam o sequencer até o driver terminar; outras permitem que o sequencer continue após entregar o item.

#### 2. Querying random items sem bloquear

Código reconstruído:

```systemverilog
task run_phase(uvm_phase phase);
  forever begin
    // Try the next data item from sequencer; does not block
    seq_item_port.try_next_item(s_item);

    if (s_item == null) begin
      // No data item to execute, send idle transaction
    end
    else begin
      // Got a valid item from the sequencer, execute it
      seq_item_port.item_done();
    end
  end
endtask
```

Interpretação:

Esse padrão evita que o driver pare quando não há item disponível.

#### 3. Pseudo-code for consecutive random items

Código reconstruído:

```systemverilog
while (the pipeline is not empty) begin
  get_next_item(req);
  fork
    logic that sends item to the pipeline
  join_none

  item_done();

  for each completed process call ...
end
```

Interpretação:

A ideia é lidar com pipeline. O driver pode ter múltiplos itens em voo.

#### 4. Sending response back to sequencer

Código reconstruído:

```systemverilog
seq_item_port.item_done(rsp);
// using the put_response() method
seq_item_port.put_response(rsp);
// or using the built-in analysis port in the driver
rsp_port.write(rsp);
```

Interpretação:

O driver pode devolver uma response ao sequencer ou publicá-la por uma analysis port, dependendo da arquitetura.

---

### Slide 12 — UVM Monitor (1/2)

O slide apresenta a função do monitor.

Pontos principais:

- O monitor é responsável por extrair informação de sinais das interfaces.
- Ele traduz essa informação em:
  - events;
  - data structures;
  - status information.
- Essa informação fica disponível para outros componentes e para o test writer por interfaces e canais TLM padrão.
- O monitor não depende de informação de estado coletada por outros componentes, como o driver.
- Ele depende de informação específica da request para configurar corretamente sequência e transação de informação para response.
- A funcionalidade do monitor deve ser limitada ao monitoramento básico sempre exigido pelo DUT.
- Isso inclui protocol checking.
- O monitor deve ser configurável para ser habilitado ou desabilitado.
- Deve poder coletar coverage data.
- Outros componentes de verificação, como scoreboards, são implementados acima do monitor na hierarquia de verificação.
- É boa prática separar:
  - funcionalidade pin-level;
  - modelo abstrato;
  - extração signal-level;
  - coverage;
  - checking;
  - atividades transaction-level.
- Uma analysis port deve permitir comunicação entre subcomponentes do monitor.

Interpretação:

O monitor é passivo, mas não é trivial. Ele precisa saber interpretar os sinais do protocolo e converter isso em transações.

Ele deve ser independente do driver. Mesmo que o driver ache que mandou uma transação, o monitor só considera o que realmente apareceu na interface.

---

### Slide 13 — UVM Monitor (2/2)

O slide mostra um exemplo de código de monitor.

Código reconstruído e organizado:

```systemverilog
class master_monitor extends uvm_monitor;

  virtual bus_if vif; // SystemVerilog virtual interface

  bit checks_enable   = 1; // Control checking in monitor and interface
  bit coverage_enable = 1; // Control coverage in monitor and interface

  uvm_analysis_port #(simple_item) item_collected_port;

  event cov_transaction; // Events needed to trigger covergroups
  protected simple_item trans_collected;

  `uvm_component_utils_begin(master_monitor)
    `uvm_field_int(checks_enable,   UVM_ALL_ON)
    `uvm_field_int(coverage_enable, UVM_ALL_ON)
  `uvm_component_utils_end

  covergroup cov_trans @(cov_transaction);
    option.per_instance = 1;
    // coverage bins definition
  endgroup : cov_trans

  function new(string name, uvm_component parent);
    super.new(name, parent);
    cov_trans = new();
    item_collected_port = new("item_collected_port", this);
  endfunction : new

  virtual task run_phase(uvm_phase phase);
    fork
      collect_transactions(); // Spawn collector task
    join
  endtask : run_phase

  virtual protected task collect_transactions();
    forever begin
      @(posedge m_sig_clock);

      // Collect the data from the bus into trans_collected
      if (checks_enable)
        perform_transfer_checks();

      if (coverage_enable)
        perform_transfer_coverage();

      item_collected_port.write(trans_collected);
    end
  endtask : collect_transactions

  virtual protected function void perform_transfer_coverage();
    -> cov_transaction;
  endfunction : perform_transfer_coverage

  virtual protected function void perform_transfer_checks();
    // Perform data checks on trans_collected
  endfunction : perform_transfer_checks

endclass : master_monitor
```

Interpretação:

Esse monitor mostra vários padrões importantes:

#### 1. Virtual interface

```systemverilog
virtual bus_if vif;
```

O monitor acessa sinais do DUT por meio da interface virtual.

#### 2. Habilitação configurável

```systemverilog
checks_enable
coverage_enable
```

Isso permite ligar/desligar checks e coverage sem reescrever o monitor.

O slide mostra um exemplo de configuração:

```systemverilog
uvm_config_db#(bit)::set(this, "master0.monitor", "checks_enable", 0);
```

#### 3. Analysis port

```systemverilog
item_collected_port.write(trans_collected);
```

O monitor publica transações para outros componentes.

#### 4. Covergroup acionado por event

```systemverilog
event cov_transaction;
covergroup cov_trans @(cov_transaction);
```

O monitor dispara o evento quando quer amostrar coverage.

---

### Slide 14 — Instantiating UVM Components

O slide compara instanciação direta com instanciação via factory.

Pontos principais:

- Cada componente UVM é independente.
- Qualquer componente pode ser substituído por um novo componente com as mesmas interfaces sem alterar o método `connect()` do parent.
- Essa flexibilidade é possível usando a factory em UVM.

#### Forma sem factory

O código mostra:

```systemverilog
class my_component extends uvm_component;

  my_driver driver;

  function build();
    // calling driver
    driver = new("driver", this);
  endfunction

endclass
```

Interpretação:

Essa forma cria exatamente `my_driver`. Fica mais difícil substituir por outro driver em um teste.

#### Forma com factory

O código mostra:

```systemverilog
class my_component extends uvm_component;

  my_driver driver;

  function build();
    // Instantiating driver, as a type-specific static method that returns an
    // instance of the desired type, in this case, my_driver, from the factory.
    driver = my_driver::type_id::create("driver", this);
  endfunction

endclass
```

Interpretação:

Com `type_id::create`, a factory pode retornar uma classe derivada se houver override configurado.

#### Troca de driver em teste

O slide mostra:

```systemverilog
class new_driver extends my_driver;
  // Add more functionality here.
endclass : new_driver
```

E no test/environment/testbench, faz override:

```systemverilog
virtual function build();
  set_type_override_by_type(my_driver::get_type(),
                            new_driver::get_type());
endfunction
```

Interpretação:

O environment continua pedindo `my_driver`, mas a factory entrega `new_driver`. Isso permite alterar comportamento por teste sem modificar o environment.

---

### Slide 15 — UVM Agent (1/2)

O slide explica o agent.

Pontos principais:

- Um UVM agent instancia e conecta:
  - driver;
  - monitor;
  - sequencer;
  usando conexões TLM.
- Também contém informações de configuração e outros parâmetros.
- UVM recomenda que o verification component developer crie um agent que forneça:
  - geração de estímulo específico de protocolo;
  - checking;
  - coverage;
  para um device.
- Em um ambiente baseado em barramento, um agent modela um componente master ou slave.
- Um agent tem dois modos:
  - Active;
  - Passive.

#### Active

Pontos:

- Emula um device no sistema.
- Dirige sinais do DUT.
- Requer que o agent instancie:
  - driver;
  - sequencer.
- Um monitor também é instanciado para checking e coverage.

#### Passive

Pontos:

- Não instancia driver nem sequencer.
- Contém apenas o monitor instanciado e configurado.
- Use esse modo quando só checking e coverage collection são desejados.

Interpretação:

Agent é um pacote configurável. Ele pode ser ativo quando precisa gerar tráfego ou passivo quando precisa apenas observar.

Exemplo:

```text
Em bloco isolado:
  AXI master agent ativo dirige o DUT.

Em SoC:
  AXI master real já existe no design.
  O AXI agent pode ser passivo, só monitorando.
```

---

### Slide 16 — UVM Agent (2/2)

O slide mostra código de um `simple_agent`.

Código reconstruído:

```systemverilog
class simple_agent extends uvm_agent;

  uvm_active_passive_enum is_active;

  // Constructor and UVM automation macros
  `uvm_component_utils(simple_agent)

  uvm_sequencer #(simple_item) sequencer;
  simple_driver  driver;
  simple_monitor monitor;

  // Use build() phase to create agent's subcomponents.
  virtual function void build_phase(uvm_phase phase);
    super.build_phase(phase);

    // monitor created here
    monitor = simple_monitor::type_id::create("monitor", this);

    if (is_active == UVM_ACTIVE) begin
      // Build the sequencer and driver
      sequencer = uvm_sequencer #(simple_item)::type_id::create("sequencer", this);
      driver    = simple_driver::type_id::create("driver", this);
    end
  endfunction : build_phase

  virtual function void connect_phase(uvm_phase phase);
    if (is_active == UVM_ACTIVE) begin
      // checked to see if agent is active
      driver.seq_item_port.connect(sequencer.seq_item_export);
    end
  endfunction : connect_phase

endclass : simple_agent
```

Interpretação:

O monitor é criado sempre. Driver e sequencer só são criados se o agent for ativo.

A conexão TLM:

```systemverilog
driver.seq_item_port.connect(sequencer.seq_item_export);
```

é feita apenas no modo ativo, pois no modo passivo não há driver nem sequencer.

---

### Slide 17 — UVM Environment

O slide apresenta o environment.

A figura mostra um verification component environment com:

- config;
- bus monitor/checker/coverage;
- master agents;
- slave agents;
- DUT;
- bus.

O slide também mostra código de uma classe `ahb_env`.

Código reconstruído:

```systemverilog
class ahb_env extends uvm_env;

  int num_masters;
  ahb_master_agent masters[];

  `uvm_component_utils_begin(ahb_env)
    `uvm_field_int(num_masters, UVM_ALL_ON)
  `uvm_component_utils_end

  virtual function void build_phase(uvm_phase phase);
    string inst_name;

    super.build_phase(phase);

    if (!uvm_config_db #(virtual ahb_if)::get(this, "", "vif", vif))
      `uvm_fatal("NOVIF",
        {"Virtual interface must be set for: ", get_full_name(), ".vif"})

    masters = new[num_masters];

    for (int i = 0; i < num_masters; i++) begin
      $sformat(inst_name, "masters[%0d]", i);
      masters[i] = ahb_master_agent::type_id::create(inst_name, this);
    end

    // Build slaves and other components
  endfunction

  function new(string name, uvm_component parent);
    super.new(name, parent);
  endfunction : new

endclass
```

O slide mostra configuração do número de agents:

```systemverilog
uvm_config_db#(int)::set(this, "*my_env", "num_masters", 3);
```

Interpretação:

O environment é configurável. Em vez de codificar fixo quantos masters existem, o valor vem de configuração.

Isso permite reutilizar o mesmo environment em designs diferentes:

```text
design A → 1 master
design B → 3 masters
design C → 5 masters
```

---

### Slide 18 — UVM Scenario Creation

O slide explica como criar cenários em UVM.

Pontos principais:

O criador do test environment facilita a escrita de testes pelo usuário do environment ao:

- colocar knobs na classe de data item para simplificar controle declarativo do teste;
- criar uma biblioteca de sequências interessantes e reutilizáveis.

O usuário do environment controla os padrões gerados pelo environment configurando os sequencers.

Ele pode:

- adicionar uma sequência de transações a um sequencer;
- modificar o sequencer para usar certas sequências com mais frequência que outras;
- sobrescrever o loop principal do sequencer para começar com uma sequência definida pelo usuário.

Interpretação:

Scenario creation é onde o test writer usa a infraestrutura para criar testes reais.

UVM separa:

```text
environment developer → cria agent/env/data item/sequences reutilizáveis
test writer → escolhe configurações e sequências para o cenário
```

Knobs e sequences são os pontos de controle.

Exemplo mental:

```text
knob: delay_kind = SHORT
sequence: burst_write_sequence
sequence: random_read_sequence
sequence: reset_during_transfer_sequence
```

O teste combina essas peças para formar cenários.

---

### Slide 19 — UVM: Managing End of Test (1/2)

O slide apresenta **objections**.

Pontos principais:

- UVM fornece um mecanismo de objection para permitir comunicação hierárquica de status entre componentes.
- Existe uma objection built-in para cada phase.
- Ela fornece uma forma de componentes e objetos sincronizarem suas atividades de teste e indicarem quando é seguro encerrar a phase e, por fim, o teste.
- Em simulação, agents podem ter uma agenda significativa a ser cumprida antes de as metas do teste serem declaradas como concluídas.
- Exemplo:
  - um master agent pode precisar completar todas as operações read/write antes que a run phase pare;
  - um reactive slave agent pode não objetar ao fim do teste, pois apenas atende requests quando aparecem, sem agenda própria.
- Um uso típico de objections é uma sequence de um active agent levantar uma objection quando inicia como root sequence, e derrubar a objection quando termina como root sequence.
- Quando todas as objections são derrubadas, a phase atualmente em execução termina.

Interpretação:

Objection é o mecanismo que impede a simulação de acabar cedo demais.

Sem objection, a run phase poderia terminar enquanto ainda há transações em andamento.

Fluxo:

```text
começou atividade importante → raise_objection()
terminou atividade importante → drop_objection()
quando ninguém mais objeta → UVM encerra a phase
```

---

### Slide 20 — UVM: Managing End of Test (2/2)

O slide continua objections e apresenta `phase_ready_to_end()` e drain time.

Pontos principais:

- Existe o método exclusivo `phase_ready_to_end()` para re-raise da phase objection se uma transação ainda está em voo.
- Também é possível definir um **drain time** para inserir atraso entre o momento em que a contagem total de objections chega a zero e o fim da phase atual.
- Se qualquer objection for levantada durante esse atraso, o drop é cancelado e o raise não é propagado adiante.
- Um uso típico é definir um único drain time no nível de env ou test.

O código mostra uma sequence que levanta e derruba objection:

```systemverilog
class interesting_sequence extends uvm_sequence #(some_item);

  task pre_body();
    if (starting_phase != null)
      starting_phase.raise_objection(this);
  endtask

  task body();
    // do interesting activity
  endtask

  task post_body();
    if (starting_phase != null)
      starting_phase.drop_objection(this);
  endtask

endclass
```

Interpretação:

`pre_body()` levanta objection antes da sequence principal. `post_body()` derruba depois que a sequence termina.

O `drain time` é útil quando a última transação foi enviada, mas ainda há resposta pendente ou atividade no monitor/scoreboard.

Exemplo mental:

```text
driver terminou de enviar
monitor ainda precisa capturar resposta
scoreboard ainda precisa comparar
drain time dá tempo para isso antes de encerrar
```

---

## Aula didática desenvolvida

### 1. A ponte entre SystemVerilog manual e UVM

Nos blocos anteriores, você criou mentalmente estruturas como:

```text
Packet
driver
monitor
scoreboard
environment
test
mailbox
event
```

Em UVM, essas ideias continuam, mas ficam padronizadas.

A equivalência prática é:

| Testbench SystemVerilog manual | UVM |
|---|---|
| `Packet` / `reg_item` | `uvm_sequence_item` |
| generator | `uvm_sequence` |
| mailbox generator-driver | `seq_item_port` / `seq_item_export` |
| driver manual | `uvm_driver #(item_type)` |
| monitor manual | `uvm_monitor` |
| environment manual | `uvm_env` |
| test manual | `uvm_test` |
| component creation with `new()` | factory with `type_id::create()` |
| finish by `$finish` | objections and phase control |

UVM não muda a lógica conceitual da verificação. Ele muda a infraestrutura.

---

### 2. Data item é a transação UVM

Um data item deve representar aquilo que faz sentido no protocolo.

Exemplo para barramento:

```text
addr
data
read/write
delay
byte enable
burst length
response
```

O data item não é apenas um container. Ele também pode ter:

- constraints;
- knobs;
- métodos de debug;
- campos de controle;
- suporte a print/copy/compare.

Exemplo:

```systemverilog
class simple_item extends uvm_sequence_item;
  rand int unsigned addr;
  rand int unsigned data;
  rand int unsigned delay;

  constraint c1 { addr < 16'h2000; }
  constraint c2 { data < 16'h1000; }

  `uvm_object_utils_begin(simple_item)
    `uvm_field_int(addr,  UVM_ALL_ON)
    `uvm_field_int(data,  UVM_ALL_ON)
    `uvm_field_int(delay, UVM_ALL_ON)
  `uvm_object_utils_end

  function new(string name = "simple_item");
    super.new(name);
  endfunction
endclass
```

---

### 3. Por que usar `uvm_sequence_item`?

Porque ele já entra no ecossistema UVM.

Ao herdar de `uvm_sequence_item`, o item pode ser usado por:

```text
sequences
sequencers
drivers
factory
print/copy/compare
transaction recording
sequence id
transaction id
```

Isso evita criar um objeto isolado que o resto da metodologia não entende.

---

### 4. Macros de campo

Macros como:

```systemverilog
`uvm_field_int(addr, UVM_ALL_ON)
```

permitem que UVM saiba como operar sobre aquele campo.

Com isso, métodos como:

```systemverilog
print()
copy()
compare()
```

podem funcionar automaticamente.

Sem essas macros, você teria que implementar muita coisa manualmente.

Observação prática: em projetos reais, alguns times evitam excesso de macros por controle/performance, mas no contexto didático do curso elas são fundamentais para entender a automação UVM.

---

### 5. Knobs: controle abstrato do estímulo

Knobs são campos de controle que simplificam o teste.

Em vez de escrever:

```text
delay entre 1 e 10
delay entre 11 e 99
delay entre 100 e 999
```

o test writer escolhe:

```text
SHORT
MEDIUM
LARGE
```

A constraint transforma isso em valores reais.

Isso deixa o teste mais expressivo:

```systemverilog
item.delay_kind = SHORT;
```

é mais claro do que:

```systemverilog
item.delay inside {[1:10]};
```

Knobs ajudam a controlar o espaço de randomização sem perder abstração.

---

### 6. Driver: o tradutor de transação para protocolo

O driver recebe um item:

```text
addr, data, delay
```

e executa na interface:

```text
espera clock
aplica addr
aplica data
ativa valid
espera ready
desativa valid
```

O driver é o único componente que deve conhecer os detalhes temporais do protocolo de direção.

Por isso, o método `drive_item()` é onde entra a lógica específica do DUT:

```systemverilog
task drive_item(input simple_item item);
  // Add DUT specific logic here
endtask
```

---

### 7. O trio fundamental do driver UVM

O padrão mais importante é:

```systemverilog
seq_item_port.get_next_item(req);
drive_item(req);
seq_item_port.item_done();
```

Leia assim:

```text
get_next_item → driver pede item ao sequencer
drive_item    → driver aplica item no DUT
item_done     → driver avisa que terminou
```

Se esquecer `item_done()`, o sequencer pode ficar travado esperando o driver concluir.

---

### 8. `get_next_item()` versus `try_next_item()`

#### `get_next_item()`

Bloqueia até haver item.

Use quando o driver só deve agir quando há transação válida.

```systemverilog
seq_item_port.get_next_item(req);
```

#### `try_next_item()`

Não bloqueia.

Use quando o driver precisa continuar ativo mesmo sem item, por exemplo dirigindo idle.

```systemverilog
seq_item_port.try_next_item(req);

if (req == null)
  drive_idle();
else
  drive_item(req);
```

Essa diferença é muito importante em protocolos reais.

---

### 9. Driver pipeline

Em protocolos pipeline, o driver pode buscar novos itens antes de terminar os antigos.

Exemplo mental:

```text
ciclo 1: envia endereço da transação A
ciclo 2: envia endereço da transação B
ciclo 3: recebe dado da transação A
ciclo 4: recebe dado da transação B
```

Nesse tipo de protocolo, há múltiplas transações em voo. O driver precisa gerenciar isso com cuidado e, às vezes, devolver responses ao sequencer.

---

### 10. Response de volta ao sequencer

Se o driver obtém uma resposta do DUT e a sequence precisa conhecer essa resposta, o driver pode fazer:

```systemverilog
seq_item_port.item_done(rsp);
```

ou:

```systemverilog
seq_item_port.put_response(rsp);
```

ou ainda publicar em uma analysis port:

```systemverilog
rsp_port.write(rsp);
```

A escolha depende da arquitetura do ambiente.

---

### 11. Sequencer não é generator simples

No testbench manual, o generator muitas vezes fazia tudo.

Em UVM, o estímulo vem de sequences. O sequencer coordena essas sequences e entrega os itens ao driver.

Pense assim:

```text
sequence → define o cenário
sequencer → arbitra/organiza entrega
driver → executa no DUT
```

O sequencer é uma infraestrutura, não apenas um loop de randomização.

---

### 12. Monitor deve ser independente do driver

O monitor não deve confiar no que o driver “achou” que enviou.

Ele deve olhar os sinais reais da interface.

Isso é essencial porque:

```text
driver pode estar errado
interface pode estar errada
DUT pode não aceitar a transação
reset pode estar ativo
ready pode estar baixo
```

O monitor registra o que realmente aconteceu.

---

### 13. Monitor com analysis port

O monitor publica transações assim:

```systemverilog
item_collected_port.write(trans_collected);
```

Consumidores podem ser:

```text
scoreboard
coverage collector
logger
protocol checker
subscriber
```

Essa publicação desacopla o monitor do restante do ambiente.

---

### 14. Monitor com checks e coverage configuráveis

O slide mostra:

```systemverilog
checks_enable
coverage_enable
```

Isso é uma prática muito boa.

Em alguns testes, você pode querer desligar checks temporariamente. Em outros, pode querer coletar coverage. Em alguns ambientes, checks ficam no monitor; em outros, ficam em checkers externos.

Configuração:

```systemverilog
uvm_config_db#(bit)::set(this, "master0.monitor", "checks_enable", 0);
```

---

### 15. Factory: por que `type_id::create` importa?

Se você usa:

```systemverilog
driver = new("driver", this);
```

você sempre cria exatamente aquele tipo.

Se usa:

```systemverilog
driver = my_driver::type_id::create("driver", this);
```

a factory pode substituir por outro tipo.

Isso permite:

```text
teste A usa driver normal
teste B usa driver com erro
teste C usa driver com delays
teste D usa driver com comportamento especial
```

sem alterar o código do environment.

---

### 16. Agent ativo e passivo

O agent ativo cria:

```text
monitor
sequencer
driver
```

O agent passivo cria:

```text
monitor
```

Isso aparece diretamente no código:

```systemverilog
monitor = simple_monitor::type_id::create("monitor", this);

if (is_active == UVM_ACTIVE) begin
  sequencer = uvm_sequencer #(simple_item)::type_id::create("sequencer", this);
  driver    = simple_driver::type_id::create("driver", this);
end
```

A conexão também só acontece se for ativo:

```systemverilog
driver.seq_item_port.connect(sequencer.seq_item_export);
```

---

### 17. Environment configurável

O environment pode criar um número variável de agents.

O slide mostra:

```systemverilog
uvm_config_db#(int)::set(this, "*my_env", "num_masters", 3);
```

Isso permite configurar a topologia.

Exemplo:

```text
num_masters = 1
num_masters = 3
num_masters = 8
```

O mesmo environment se adapta.

---

### 18. Scenario creation

Cenário é uma composição de sequences, knobs e configurações.

Exemplo:

```text
cenário 1: 100 writes curtos
cenário 2: reads e writes alternados
cenário 3: bursts longos
cenário 4: resets no meio da transferência
cenário 5: delays grandes
```

O environment developer facilita isso criando:

- knobs no data item;
- sequences reutilizáveis;
- mecanismos de configuração;
- sequencers apropriados.

O test writer combina essas peças.

---

### 19. Objections: fim de teste controlado

Em testbench manual, era comum usar:

```systemverilog
#1000 $finish;
```

Em UVM, isso é frágil. O teste pode terminar cedo ou tarde demais.

UVM usa objections:

```systemverilog
phase.raise_objection(this);
...
phase.drop_objection(this);
```

Enquanto houver objection levantada, a phase não termina.

Quando todas são derrubadas, a phase pode terminar.

---

### 20. Objection em sequence

O slide mostra:

```systemverilog
task pre_body();
  if (starting_phase != null)
    starting_phase.raise_objection(this);
endtask

task body();
  // do interesting activity
endtask

task post_body();
  if (starting_phase != null)
    starting_phase.drop_objection(this);
endtask
```

Isso significa:

```text
antes da sequence começar, impedir fim da phase
durante body, executar estímulo
depois da sequence terminar, permitir fim da phase
```

Esse é um padrão importante para root sequences.

---

### 21. Drain time

Às vezes, a sequence terminou de enviar estímulos, mas ainda há coisas acontecendo:

```text
respostas atrasadas
monitor capturando última transação
scoreboard comparando
coverage sendo amostrada
```

Drain time adiciona um atraso depois que objections chegam a zero, antes de encerrar a phase.

Isso evita que o teste termine antes de a última resposta ser processada.

---

## Conceitos difíceis explicados em profundidade

### 1. Data item não é só “entrada”

O data item pode carregar:

```text
entrada desejada
campos de controle
informações esperadas
resposta
identificadores
constraints
knobs
métodos auxiliares
```

Ele é a unidade de comunicação do testbench.

---

### 2. Knobs reduzem complexidade sem reduzir controle

Knobs permitem controlar a geração sem mexer nos detalhes.

Exemplo:

```text
delay_kind = SHORT
```

é melhor para teste do que:

```text
delay inside {[1:10]}
```

porque expressa intenção.

O test fica mais legível e reutilizável.

---

### 3. `solve before` com knobs

Quando um campo controla outro, faz sentido resolver o knob primeiro.

```systemverilog
solve delay_kind before delay;
```

Assim, o solver escolhe a categoria antes de escolher o valor concreto.

Sem isso, a distribuição final pode ficar diferente da intenção do teste.

---

### 4. `get_next_item()` é um contrato

Quando o driver chama:

```systemverilog
get_next_item(req)
```

ele está dizendo:

```text
sequencer, me dê o próximo item e considere que estou trabalhando nele.
```

Quando chama:

```systemverilog
item_done()
```

ele está dizendo:

```text
terminei este item.
```

Esse contrato precisa ser respeitado.

---

### 5. `try_next_item()` e idle

Em alguns protocolos, mesmo sem transação, o driver precisa manter sinais em estado idle.

Exemplo:

```text
valid = 0
addr = 0
data = 0
```

`try_next_item()` permite isso sem travar o driver.

---

### 6. Monitor e coverage

Coverage deve observar o que aconteceu, não apenas o que foi tentado.

Por isso, o monitor é um bom lugar para coletar coverage:

```text
driver tentou enviar write
mas monitor viu se write realmente ocorreu
```

Essa diferença importa em presença de reset, ready/valid, backpressure e erros de protocolo.

---

### 7. Factory e reuso real

Sem factory, trocar componente exige editar o environment.

Com factory, o test pode dizer:

```text
use new_driver no lugar de my_driver
```

Isso é fundamental para reuso de verification IP.

---

### 8. Agent como unidade de reutilização

Um agent pode ser empacotado e reutilizado em vários níveis:

```text
bloco
subsystem
SoC
emulação
regressão
```

Configurando ativo/passivo, ele serve tanto para dirigir quanto para monitorar.

---

### 9. Environment dinâmico

O environment do slide cria `masters[]` com tamanho configurável.

Isso mostra que UVM não precisa ter topologia fixa.

A topologia pode depender de:

```text
parâmetro do teste
configuração do DUT
número de interfaces
modo de operação
```

---

### 10. Objections evitam `$finish` arbitrário

`$finish` por tempo fixo é frágil:

```text
#1000 pode ser pouco
#100000 pode ser muito
```

Objections encerram o teste quando a atividade real termina.

Isso é mais limpo e escalável.

---

## Figuras, diagramas e elementos visuais importantes

### Página 1 — UVM Testbench Components e Modeling Data Items

A primeira página mostra o roteiro do bloco e o exemplo de `simple_item` estendendo `uvm_sequence_item`, com campos randômicos, constraints e macros UVM.

### Página 2 — Data Items e Knobs

Mostra o processo de criação de data items e o conceito de knobs. O exemplo usa `delay_kind` para controlar faixas de delay.

### Página 3 — Transaction Level Components e Driver

Mostra a arquitetura transacional UVM, com monitor, analysis, sequencer e driver, e depois mostra o esqueleto de um driver com `get_next_item()`, `drive_item()` e `item_done()`.

### Página 4 — Driver e Sequencer

Mostra a função do driver e introduz `uvm_sequencer`, parametrizado por request e response item types.

### Página 5 — Sequencer Interactions

Mostra conexão `seq_item_port` / `seq_item_export`, porta bidirecional, `get_next_item()`, `item_done()`, `try_next_item()`, pipeline e responses.

### Página 6 — Sequencer 4/4 e Monitor 1/2

Mostra pseudo-códigos avançados de sequencer e começa a explicar a função do monitor como coletor de informações da interface.

### Página 7 — Monitor 2/2 e Instantiating Components

Mostra o código de um monitor com virtual interface, enable de checks/coverage, analysis port, covergroup e configuração por `uvm_config_db`. Também compara instanciação por `new()` e por factory.

### Página 8 — Agent 1/2 e Agent 2/2

Mostra o agent ativo/passivo e o código de `simple_agent`, criando monitor sempre, driver/sequencer apenas quando ativo, e conectando `seq_item_port` ao `seq_item_export`.

### Página 9 — Environment, Scenario Creation e Managing End of Test 1/2

Mostra um environment configurável com múltiplos masters, configuração por `uvm_config_db`, criação de cenários por knobs/sequences e início da explicação de objections.

### Página 10 — Managing End of Test 2/2

Mostra `phase_ready_to_end()`, drain time e o padrão de sequence com `pre_body()`, `body()` e `post_body()` levantando e derrubando objections.

---

## Pontos de prova e revisão

### Perguntas prováveis

1. **Quais etapas envolvem desenvolver um verification component usando UVM?**  
   Modeling data items, transaction-level components, driver, sequencer, monitor, instantiating components, agent, environment, scenario creation e managing end of test.

2. **De qual classe um data item normalmente deriva?**  
   `uvm_sequence_item`.

3. **Para que servem UVM field macros?**  
   Para habilitar automação como print, copy, compare e outras operações.

4. **O que são knobs?**  
   Campos de controle usados para criar variedade de data items de forma abstrata e facilitar escrita de testes.

5. **Qual é a função do driver?**  
   Dirigir data items para a interface do DUT seguindo o protocolo.

6. **De qual classe base o driver deriva?**  
   `uvm_driver`.

7. **Como o driver obtém itens do sequencer?**  
   Por `seq_item_port.get_next_item()`.

8. **O que o driver deve chamar após terminar o item?**  
   `seq_item_port.item_done()`.

9. **Qual método permite consultar item sem bloquear?**  
   `try_next_item()`.

10. **De qual classe base o sequencer deriva?**  
    `uvm_sequencer`.

11. **Como driver e sequencer são conectados?**  
    `driver.seq_item_port.connect(sequencer.seq_item_export);`.

12. **Qual é a função do monitor?**  
    Extrair informação dos sinais da interface, traduzir em transações, fazer checks/coverage e publicar por TLM.

13. **O monitor dirige sinais?**  
    Não. Ele é passivo.

14. **Para que serve analysis port no monitor?**  
    Para publicar transações coletadas para scoreboards, coverage collectors e outros componentes.

15. **Por que usar `type_id::create()` em vez de `new()`?**  
    Para permitir factory override e substituição de componentes.

16. **O que um agent ativo contém?**  
    Monitor, driver e sequencer.

17. **O que um agent passivo contém?**  
    Monitor apenas.

18. **O que o environment contém?**  
    Agents, configurações, monitores/checkers/coverage e outros componentes.

19. **Para que serve `uvm_config_db` no slide do environment?**  
    Para configurar atributos como número de masters.

20. **Como UVM gerencia fim de teste?**  
    Por mecanismo de objections.

21. **Quais métodos levantam e derrubam objection?**  
    `raise_objection()` e `drop_objection()`.

22. **Para que serve drain time?**  
    Para dar tempo de concluir atividade pendente depois que as objections chegam a zero.

23. **Para que serve `phase_ready_to_end()`?**  
    Para re-levantar objection se ainda houver transação em voo.

### Pegadinhas

- Data item deve derivar de `uvm_sequence_item`, não de `uvm_component`.
- Driver dirige sinais; sequencer não dirige sinais.
- Sequencer fornece itens ao driver; ele não substitui o driver.
- `get_next_item()` bloqueia; `try_next_item()` não bloqueia.
- Após `get_next_item()`, o driver deve chamar `item_done()`.
- Monitor é passivo e deve ser independente do driver.
- Monitor publica transações por analysis port.
- Usar `new()` reduz flexibilidade de factory.
- Usar `type_id::create()` permite override.
- Agent passivo não cria driver nem sequencer.
- Environment deve ser configurável.
- Scenario creation depende de knobs e sequences reutilizáveis.
- Objection evita fim prematuro do teste.
- Drain time não substitui scoreboard; apenas dá tempo para processar atividade final.

### Frases para memorizar

```text
Data item modela a transação.
Knobs controlam estímulos em nível abstrato.
Driver pega item do sequencer e dirige o DUT.
get_next_item bloqueia; try_next_item não bloqueia.
item_done avisa que o driver terminou o item.
Sequencer organiza a entrega de itens ao driver.
Monitor observa sinais e publica transações.
Factory usa type_id::create para permitir overrides.
Agent ativo tem sequencer, driver e monitor.
Agent passivo tem apenas monitor.
Environment organiza agents e configurações.
Objections controlam o fim do teste.
```

---

## Relação com projeto/laboratório

### Estrutura mínima de arquivos UVM

```text
simple_item.sv
simple_sequence.sv
simple_sequencer.sv
simple_driver.sv
simple_monitor.sv
simple_agent.sv
simple_env.sv
simple_test.sv
tb_top.sv
```

### Fluxo conceitual

```text
simple_test configura environment
simple_env cria agents
simple_agent cria monitor e, se ativo, driver + sequencer
sequence cria simple_items
sequencer entrega simple_items ao driver
driver dirige interface do DUT
monitor observa interface
monitor publica transações por analysis port
scoreboard/coverage recebem
objections mantêm a run_phase viva até o fim
```

### Padrão central do driver

```systemverilog
task run_phase(uvm_phase phase);
  forever begin
    seq_item_port.get_next_item(req);
    drive_item(req);
    seq_item_port.item_done();
  end
endtask
```

### Padrão central do agent

```systemverilog
function void build_phase(uvm_phase phase);
  monitor = simple_monitor::type_id::create("monitor", this);

  if (is_active == UVM_ACTIVE) begin
    sequencer = uvm_sequencer #(simple_item)::type_id::create("sequencer", this);
    driver    = simple_driver::type_id::create("driver", this);
  end
endfunction

function void connect_phase(uvm_phase phase);
  if (is_active == UVM_ACTIVE)
    driver.seq_item_port.connect(sequencer.seq_item_export);
endfunction
```

### Padrão de fim de teste

```systemverilog
task pre_body();
  if (starting_phase != null)
    starting_phase.raise_objection(this);
endtask

task body();
  // estímulo principal
endtask

task post_body();
  if (starting_phase != null)
    starting_phase.drop_objection(this);
endtask
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
- [x] Nenhum próximo arquivo específico foi inventado sem confirmação na tela final do DOCX.

---

## Próximo bloco

O DOCX atual não mostra uma tela final indicando o próximo arquivo. Como este bloco encerra `08 SystemVerilog for UVM 2`, o próximo arquivo deve ser confirmado no **roteiro/checklist fornecido**, em vez de ser inferido apenas pelo nome.

Próximo passo de organização:

```text
Verificar no roteiro qual é o primeiro DOCX depois de:
03 SystemVerilog Refresher\08 SystemVerilog for UVM 2.docx
```

Salvar este bloco em:

```text
C:\Users\maiko\ci_expert\mdCursoPt2\03 SystemVerilog Refresher\08 SystemVerilog for UVM 2.md
```
