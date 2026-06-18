# 05 Verilog Reference Design of ROBOT Model

## Controle do bloco

- **Bloco:** 005
- **Arquivo de origem:** `C:\Users\maiko\ci_expert\Aulas2Prints\01 Verilog Refresher\05 Verilog Reference Design of ROBOT Model.docx`
- **Faixa de slides:** 1-19
- **Caminho sugerido para salvar:** `C:\Users\maiko\ci_expert\mdCursoPt2\01 Verilog Refresher\05 Verilog Reference Design of ROBOT Model.md`
- **Próximo bloco recomendado:** 006 — `01 VHDL Introduction`
- **Codificação do arquivo gerado:** UTF-8 com BOM, para evitar problemas de acentuação em editores do Windows.

> Observação: o DOCX veio como prints de slides, sem texto editável extraível. O conteúdo abaixo foi reconstruído a partir da leitura visual das páginas/imagens do documento.

---

## Resumo executivo

Esta aula apresenta um **reference design em Verilog** mais complexo que os exemplos anteriores: um **modelo de robô** que carrega e descarrega um objeto em estações diferentes conforme requisições de sensores. O foco não é apenas escrever um módulo combinacional simples, mas modelar um comportamento sequencial com **máquinas de estados**, sinais de requisição, sinais de início, sinais de conclusão e um testbench capaz de simular cenários de operação.

O design usa uma estrutura típica de controle digital:

```text
sensores de requisição
        ↓
máquina principal de controle
        ↓
máquina de carregamento
        ↓
máquina de descarregamento
        ↓
sinais de controle dos movimentos do robô
```

A aula também mostra a organização de diretórios do projeto, o arquivo `README`, o uso de `Makefile`, opções de simulação como `SOC_Verification`, `SOC_PP_Debug`, `SOC_Interactive_Debug` e `SOC_Coverage`, além de uma waveform de exemplo no Verdi. A ideia é aproximar o aluno de um fluxo real: ler especificação, entender o DUT, entender o testbench, rodar simulação, abrir waveform e interpretar a sequência de estados.

---

## Texto extraído e organizado por slide

### Slide 1 — Design Requirement

Objetivo: projetar um modelo de robô que carrega e descarrega um objeto em estações dependendo da requisição.

Pontos principais:

- Os sensores conectados ao robô detectam a requisição e iniciam a sequência correta de operação.
- A estação de carregamento fica verticalmente acima e continua carregando o robô após cada execução de descarregamento.
- Existem duas estações de descarregamento localizadas em cada lado do robô.
- Assumiu-se que o robô atende somente uma requisição de sensor por vez.

Interpretação:

O robô opera como um sistema de controle sequencial. Ele fica esperando uma requisição. Quando alguma estação solicita atendimento, o robô primeiro executa a sequência de **load** para pegar o objeto na estação superior e depois executa a sequência de **unload** para entregar o objeto na estação pedida.

---

### Slide 2 — Design Specification

Requisito: o robô sob design tem 5 graus de movimento:

| Letra | Movimento |
|---|---|
| A | Base movement |
| B | Shoulder movement |
| C | Arm movement |
| D | Wrist movement |
| E | Claw movement |

Outros pontos:

- O robô tem duas orientações possíveis.
- `S1`, `S2`, `S3` e `S4` são quatro estações.
- `L1` é a estação de carregamento no topo.
- Existem sensores correspondentes no robô para detectar requisições feitas pelas estações e descarregar o objeto na estação respectiva.
- Cada junta, exceto `E`, executa 3 ações e requer variável de 2 bits para representar essas ações.

Tabela de ações das juntas principais:

| Código | Ação |
|---|---|
| `00` | Stay |
| `01` | Obtuse angle turn — 45° right |
| `10` | Acute angle turn — 45° left |

Tabela do pulso/posição do pulso ou garra, conforme o slide:

| Sinal | Código | Ação |
|---|---|---|
| D | `00` | Hold |
| D | `01` | Horizontal |
| D | `10` | Vertical |
| E | `0` | Hold |
| E | `1` | Release |

Interpretação:

O design transforma movimentos mecânicos em códigos digitais. Cada saída do controlador representa uma ordem para uma junta ou parte do robô. Por exemplo, uma saída de 2 bits pode significar “ficar parado”, “girar 45° para a direita” ou “girar 45° para a esquerda”.

---

### Slide 3 — Robot Design

O slide mostra o diagrama de pinos do modelo e uma tabela de sinais de entrada e saída.

Sinais principais:

| Sinal | I/O | Descrição |
|---|---|---|
| `clock` | input | Clock input |
| `reset_n` | input | Reset assíncrono ativo em nível baixo |
| `S0_req` | input | Requisição da estação 0 para descarregamento |
| `S1_req` | input | Requisição da estação 1 para descarregamento |
| `S2_req` | input | Requisição da estação 2 para descarregamento |
| `S3_req` | input | Requisição da estação 3 para descarregamento |
| `Load_start` | output | Inicia carregamento quando uma atividade requisitada será atendida |
| `Load_done` | input | Indica conclusão do carregamento |
| `S0_start` | output | Inicia descarregamento para estação 0 |
| `S1_start` | output | Inicia descarregamento para estação 1 |
| `S2_start` | output | Inicia descarregamento para estação 2 |
| `S3_start` | output | Inicia descarregamento para estação 3 |
| `S0_done` | input | Descarregamento da estação 0 concluído |
| `S1_done` | input | Descarregamento da estação 1 concluído |
| `S2_done` | input | Descarregamento da estação 2 concluído |
| `S3_done` | input | Descarregamento da estação 3 concluído |

Observação: o slide usa nomes como `S0`, `S1`, `S2`, `S3`, enquanto a especificação textual também menciona estações `S1` a `S4`. O padrão do código parece indexar as estações de `0` a `3`.

Diagrama conceitual:

```text
          clock
        reset_n
         S0_req
         S1_req        ┌─────────────┐     Load_start
         S2_req  ────► │ Robot Model │ ─── Load_done
         S3_req        │             │ ─── S0_start
                       │             │ ─── S1_start
         S0_done ────► │             │ ─── S2_start
         S1_done ────► │             │ ─── S3_start
         S2_done ────► └─────────────┘
         S3_done
```

---

### Slide 4 — ROBOT Main Control State Machine

O slide mostra a máquina de estados principal do robô.

Estados visíveis:

- `start`
- `Wait_req`
- `S0_start`
- `S0_load`
- `S0_unload`
- `S1_start`
- `S1_load`
- `S1_unload`
- `S2_start`
- `S2_load`
- `S2_unload`
- `S3_start`
- `S3_load`
- `S3_unload`

Fluxo geral:

```text
start
  ↓
Wait_req
  ↓   quando S0_req
S0_start → S0_load → S0_unload → Wait_req

Wait_req
  ↓   quando S1_req
S1_start → S1_load → S1_unload → Wait_req

Wait_req
  ↓   quando S2_req
S2_start → S2_load → S2_unload → Wait_req

Wait_req
  ↓   quando S3_req
S3_start → S3_load → S3_unload → Wait_req
```

Interpretação:

A máquina principal não controla diretamente cada movimento mecânico. Ela organiza o atendimento da requisição:

1. esperar pedido;
2. identificar qual estação pediu;
3. iniciar a sequência da estação;
4. acionar carregamento;
5. acionar descarregamento;
6. voltar para `Wait_req`.

---

### Slide 5 — Load State Machine

A máquina de estados de carregamento é mostrada no slide.

Pontos principais:

- Quando uma requisição de qualquer estação é recebida, a máquina vai para o estado correspondente `S*_start`.
- Nesse estado, o sinal `load_start` é gerado para carregar o item no robô.
- O carregamento é feito por três estados de controle:
  1. `Wrist Horizontal`
  2. `Load item and close claw`
  3. `Wrist Vertical`
- Depois disso, o controle se move para o estado correspondente de descarregamento.
- A máquina de descarregamento é disparada a partir desse estado.

Fluxo conceitual:

```text
S*_load
   ↓
load_start
   ↓
Wrist Horizontal
   ↓
Load item and close claw
   ↓
Wrist Vertical
   ↓
S*_unload
```

Interpretação:

A sequência de carregamento independe, em grande parte, de qual estação pediu o objeto. O robô sempre precisa pegar o objeto na estação de carregamento superior antes de descarregar no destino.

---

### Slide 6 — Unload Operation

O slide compara a operação de descarregamento para dois grupos de estações:

- Station 1 and 3
- Station 2 and 4

A figura mostra que o robô precisa assumir posições diferentes dependendo da estação de destino.

Interpretação:

As estações não estão todas na mesma posição geométrica em relação ao robô. Por isso, a sequência de movimentos de descarregamento muda conforme a estação. Algumas estações exigem apenas movimentos de base e ombro; outras exigem movimento adicional da junta `C`, pois estão em uma posição mais baixa ou deslocada.

---

### Slide 7 — Unload State Machine

A máquina de estados de descarregamento é mostrada no slide.

Pontos principais:

- O sinal `S*_start` é colocado em nível alto para iniciar o descarregamento.
- O descarregamento acontece conforme a máquina de estados mostrada.
- Para as estações 1 e 3, a máquina segue as transições destacadas pelo bloco vermelho.
- Para as estações 2 e 4, a máquina segue os estados destacados pelo bloco verde.
- A diferença existe porque a junta `C` precisa executar movimento adicional para essas estações.
- Quando o descarregamento termina, a máquina volta ao estado `Wait_req` na máquina principal.

Estados visíveis no diagrama:

```text
S*_unload
   ↓
S*_start
   ↓
Turn joint A right by 45°
   ↓
Turn B down by 45°
   ↓
Release claw
   ↓
Turn joint A left by 45°
   ↓
Turn joint B up by 45°
   ↓
Wait Req
```

Para algumas estações, aparecem movimentos adicionais da junta `C`:

```text
Turn C down by 45°
Turn C up by 45°
```

Interpretação didática:

A máquina de descarregamento representa uma sequência temporal de comandos mecânicos. Cada estado emite um conjunto de sinais para as juntas. Quando a ação termina, a FSM avança para o próximo estado.

---

### Slide 8 — README File (1/2)

O slide mostra o começo do arquivo `README`.

Informações principais:

- O arquivo tem aviso de copyright e confidencialidade.
- Depois orienta configurar a estrutura de diretórios do ROBOT demo.

Estrutura de diretório mostrada:

```text
ROOT
├── src/          // Directory where Verilog design files are present
├── sim/          // Directory for running simulation and dumping generated data
└── robot.setup   // Setup file to be sourced before analysis/elaboration
```

O slide também menciona instalação de ferramentas:

```text
Install VCS and Verdi and set the path to the tool's home directory.
```

Interpretação:

Antes de simular, o ambiente precisa estar preparado. Isso inclui arquivos organizados, variáveis de ambiente configuradas e ferramentas disponíveis no `PATH`.

---

### Slide 9 — README File (2/2)

O slide mostra os passos para rodar a simulação na área de trabalho.

Comandos reconstruídos:

```bash
gtar -zxvf robot.tar.gz     # untar the file in your local area
cd robot
source robot.setup          # Change $ROOT to your local area

cd sim
make
```

Para simulação básica do design:

```bash
make SOC_Verification
```

Outras funcionalidades suportadas:

```bash
make SOC_Interactive_Debug  # compilation/simulation with debugging capability
make SOC_PP_Debug           # post-process debug
make SOC_Coverage           # compile/simulate with coverage options
```

Interpretação:

O fluxo foi organizado para o usuário não precisar digitar comandos longos de VCS/Verdi diretamente. O `Makefile` encapsula as receitas.

---

### Slide 10 — Verilog Robot Model Design Under Test (DUT) (1/3)

O slide mostra a primeira parte do código Verilog do modelo do robô.

Elementos principais do código:

- declaração do módulo `robot_model`;
- portas de entrada:
  - `clock`
  - `reset_n`
  - requisições de estação, como `s0_req`, `s1_req`, `s2_req`, `s3_req`;
- sinais de início de descarregamento, como `s0_unloadstart`, `s1_unloadstart`, `s2_unloadstart`, `s3_unloadstart`;
- sinais de conclusão de descarregamento:
  - `s0_unload_done`
  - `s1_unload_done`
  - `s2_unload_done`
  - `s3_unload_done`
- sinal de carregamento:
  - `load_START` ou `load_start`, conforme a grafia usada no slide.

O código também declara registradores para estados:

```verilog
reg [2:0] curr_state, next_state;
reg [2:0] load_state, load_nextstate;
reg [3:0] unload_state, unload_nextstate;
```

E parâmetros para codificar estados, por exemplo:

```verilog
parameter IDLE      = 3'b000;
parameter WAIT_REQ  = 3'b001;
parameter LOAD_START = 3'b010;
```

Observação: a leitura visual do slide não permite reconstruir todos os nomes de parâmetros com total precisão, mas a estrutura é claramente a de uma FSM principal com submáquinas de load e unload.

Exemplo didático de cabeçalho coerente com o slide:

```verilog
module robot_model (
  input  wire clock,
  input  wire reset_n,

  input  wire s0_req,
  input  wire s1_req,
  input  wire s2_req,
  input  wire s3_req,

  input  wire load_done,
  input  wire s0_done,
  input  wire s1_done,
  input  wire s2_done,
  input  wire s3_done,

  output wire load_start,
  output wire s0_start,
  output wire s1_start,
  output wire s2_start,
  output wire s3_start
);

  reg [2:0] curr_state;
  reg [2:0] next_state;

endmodule
```

---

### Slide 11 — Verilog Robot Model Design Under Test (DUT) (2/3)

O slide mostra partes da máquina principal e da máquina de load.

Estrutura típica visível:

- bloco sequencial para atualizar estado atual;
- bloco combinacional para calcular próximo estado;
- `case` sobre `curr_state`;
- condições com `s0_req`, `s1_req`, `s2_req`, `s3_req`;
- transições para estados de load e unload;
- parâmetros para estados de load, como:
  - `WAIT_HORI`
  - `LOAD_ITEM`
  - `WRIST_VERT`

Exemplo didático de FSM principal:

```verilog
always @(posedge clock or negedge reset_n) begin
  if (!reset_n)
    curr_state <= WAIT_REQ;
  else
    curr_state <= next_state;
end

always @(*) begin
  next_state = curr_state;

  case (curr_state)
    WAIT_REQ: begin
      if (s0_req)
        next_state = S0_LOAD;
      else if (s1_req)
        next_state = S1_LOAD;
      else if (s2_req)
        next_state = S2_LOAD;
      else if (s3_req)
        next_state = S3_LOAD;
    end

    S0_LOAD: begin
      if (load_done)
        next_state = S0_UNLOAD;
    end

    S1_LOAD: begin
      if (load_done)
        next_state = S1_UNLOAD;
    end

    S2_LOAD: begin
      if (load_done)
        next_state = S2_UNLOAD;
    end

    S3_LOAD: begin
      if (load_done)
        next_state = S3_UNLOAD;
    end

    S0_UNLOAD: begin
      if (s0_done)
        next_state = WAIT_REQ;
    end

    S1_UNLOAD: begin
      if (s1_done)
        next_state = WAIT_REQ;
    end

    S2_UNLOAD: begin
      if (s2_done)
        next_state = WAIT_REQ;
    end

    S3_UNLOAD: begin
      if (s3_done)
        next_state = WAIT_REQ;
    end

    default: begin
      next_state = WAIT_REQ;
    end
  endcase
end
```

Interpretação:

Essa é a essência do controlador: esperar requisição, ir para a sequência apropriada, aguardar conclusão e voltar para espera.

---

### Slide 12 — Verilog Robot Model Design Under Test (DUT) (3/3)

O slide mostra a continuação da máquina de unload e a geração de saídas.

A parte de saída usa expressões do tipo:

```verilog
assign s0_unloadstart = (...);
assign s1_unloadstart = (...);
assign s2_unloadstart = (...);
assign s3_unloadstart = (...);
assign load_start     = (...);
```

A ideia é gerar pulsos/sinais de controle dependendo do estado atual.

Exemplo didático:

```verilog
assign load_start =
  (curr_state == S0_LOAD) ||
  (curr_state == S1_LOAD) ||
  (curr_state == S2_LOAD) ||
  (curr_state == S3_LOAD);

assign s0_start = (curr_state == S0_UNLOAD);
assign s1_start = (curr_state == S1_UNLOAD);
assign s2_start = (curr_state == S2_UNLOAD);
assign s3_start = (curr_state == S3_UNLOAD);
```

Se o design também gera códigos para as juntas `A`, `B`, `C`, `D`, `E`, eles podem seguir o mesmo princípio:

```verilog
always @(*) begin
  joint_a = STAY;
  joint_b = STAY;
  joint_c = STAY;
  wrist_d = HOLD;
  claw_e  = HOLD;

  case (unload_state)
    TURN_A_RIGHT: joint_a = TURN_RIGHT;
    TURN_B_DOWN:  joint_b = TURN_DOWN;
    RELEASE:      claw_e  = RELEASE_CLAW;
    default: ;
  endcase
end
```

Interpretação:

A FSM define “onde o robô está na sequência”. A lógica de saída transforma esse estado em comandos físicos.

---

### Slide 13 — Verilog Test Bench for Robot Model

O testbench para simular o modelo do robô é mostrado em forma de diagrama.

Componentes do testbench:

- clock generator;
- reset_n generator;
- sensor output model;
- DUT instantiation;
- I/O signals for debug.

Diagrama conceitual:

```text
clock/reset_n generator ──► DUT Robot Model ──► waveform debug system
sensor output model     ──►
```

Sinais observáveis no debug:

- `Load_start`
- `Load_done`
- `S0_done`
- `S1_done`
- `S2_done`
- `S3_done`
- `S0_start`
- `S1_start`
- `S2_start`
- `S3_start`

Interpretação:

O testbench cria os eventos externos que, em um robô real, viriam de sensores e atuadores. Na simulação, esses eventos são forçados por `initial`, delays e sinais de controle.

---

### Slide 14 — Verilog Robot Model Testbench (1/2)

O slide mostra a primeira parte do testbench.

Elementos principais:

- módulo `robot_model_tb`;
- declaração de sinais;
- geração de clock;
- geração de reset;
- declaração de requests;
- declaração de sinais de done;
- instanciação do DUT.

Exemplo reconstruído:

```verilog
module robot_model_tb;

  // Signal declarations
  reg clock;
  reg reset_n;

  // Clock generation
  initial begin
    clock = 1'b0;
    forever #10 clock = ~clock;
  end

  // Reset generation
  initial begin
    reset_n = 1'b1;
    #2  reset_n = 1'b0;
    #5  reset_n = 1'b1;
  end

  reg s0_req, s1_req, s2_req, s3_req;
  reg s0_unload_done, s1_unload_done;
  reg s2_unload_done, s3_unload_done;
  reg load_done;

  wire s0_unloadstart, s1_unloadstart;
  wire s2_unloadstart, s3_unloadstart;
  wire load_START;

  // Module instantiation
  robot_model t_robot_model (
    .clock(clock),
    .reset_n(reset_n),

    .s0_req(s0_req),
    .s1_req(s1_req),
    .s2_req(s2_req),
    .s3_req(s3_req),

    .s0_done(s0_unload_done),
    .s1_done(s1_unload_done),
    .s2_done(s2_unload_done),
    .s3_done(s3_unload_done),

    .s0_start(s0_unloadstart),
    .s1_start(s1_unloadstart),
    .s2_start(s2_unloadstart),
    .s3_start(s3_unloadstart),

    .load_start(load_START),
    .load_done(load_done)
  );

endmodule
```

Observação: os nomes exatos variam no slide entre `S*_start`, `S*_unloadstart`, `S*_done` e `S*_unload_done`. O padrão lógico é o importante: requisição entra, início sai, done entra.

---

### Slide 15 — Verilog Robot Model Testbench (2/2)

O slide mostra a parte de geração de requisições das estações e o dump de sinais para debug.

Trecho conceitual reconstruído:

```verilog
// Generate station unload requests
initial begin
  // Individual request generation

  #50 s0_req = 1'b0;
  #15 s0_req = 1'b1;
      s0_unload_done = 1'b0;
  #5  s0_req = 1'b0;

  #50 s0_unload_done = 1'b1;
  #5  s0_unload_done = 1'b0;

  #50 s1_req = 1'b1;
  #5  s1_req = 1'b0;

  #50 s2_req = 1'b1;
  #5  s2_req = 1'b0;

  #50 s3_req = 1'b1;
  #5  s3_req = 1'b0;
end
```

Dump para debug em modo pós-processamento:

```verilog
initial begin
  $fsdbDumpfile("robot_model.fsdb");
  $fsdbDumpvars(2, robot_model_tb);
  #800 $finish;
end
```

Interpretação:

O testbench emula o ambiente do robô. Em vez de sensores reais, ele sobe e desce sinais como `s0_req`, `s1_req`, etc. Em vez de atuadores reais, ele simula sinais de conclusão como `s0_unload_done`.

---

### Slide 16 — Simulation Run Script: Makefile (1/2)

O slide mostra a primeira parte do `Makefile`.

Primeira orientação:

```text
Run project environment setup first.
```

Alvos principais visíveis:

```makefile
SOC_Verification: comp sim

SOC_Interactive_Debug: clean ana comp_interactive_debug sim_debug_interactive

SOC_PP_Debug: clean comp_PP_debug sim debug

SOC_Coverage: clean comp_cov sim_cov
```

Alvo de limpeza:

```makefile
clean:
	rm -rf simv* csrc* *.log verdiLog novas.fsdb novas.rc novas.conf
```

Etapa de análise principal:

```makefile
ana_core:
	vlogan -l ana_top.log -f rtl_file_list.f
	vlogan -l ana_tb.log -kdb -work tb -ntb_opts -f tb_robot
```

Etapas de compilação:

```makefile
comp:
	vcs -f rtl_file_list.f -l comp.log

comp_pp_debug:
	vcs -f rtl_file_list.f -debug_access -kdb -l comp.log
```

Interpretação:

O `Makefile` transforma o fluxo VCS/Verdi em comandos de alto nível. Em vez de digitar várias linhas, o usuário chama um alvo como `make SOC_Verification`.

---

### Slide 17 — Simulation Run Script: Makefile (2/2)

Continuação do `Makefile`.

Alvo para debug interativo:

```makefile
comp_interactive_debug:
	vcs robot_tb_top test -debug_access+all -kdb -l comp.log
```

Alvo para coverage:

```makefile
comp_cov:
	vcs robot_tb_top test -kdb -l comp.log -cm line+cond+tgl+fsm+branch+assert
```

Simulação normal:

```makefile
sim:
	./simv -l simv.log
```

Simulação com debug interativo:

```makefile
sim_debug_interactive:
	./simv -gui=verdi -l simv.log
```

Simulação com coverage:

```makefile
sim_cov:
	./simv -l simv.log -cm line+cond+tgl+fsm+branch+assert +enable_coverage=1
```

Abertura de debug pós-processamento:

```makefile
debug:
	verdi -nologo -ssf robot_model.fsdb &
```

Relatório de coverage:

```makefile
report_cov:
	verdi -cov -covdir simv.vdb
```

Interpretação:

O `Makefile` cobre quatro modos principais:

1. simulação normal;
2. debug interativo;
3. debug pós-processamento;
4. simulação com coverage.

---

### Slide 18 — Sample Simulation Waveform

O slide mostra uma captura de tela da waveform para a estação 1 sendo atendida.

Texto do slide:

```text
Screen capture of station 1 being served
```

Na waveform aparecem grupos de sinais, como:

- `station Req`
- sinais de clock/reset;
- sinais de load;
- sinais de unload process;
- sinais internos da FSM;
- sinais de output/control.

Interpretação:

A waveform permite ver a sequência temporal:

1. a requisição da estação sobe;
2. a FSM sai de `Wait_req`;
3. `load_start` é acionado;
4. o carregamento acontece;
5. a sequência de descarregamento inicia;
6. o sinal de done encerra a operação;
7. a FSM retorna para espera.

---

### Slide 19 — Simulation of Robot Model

O slide resume a simulação do modelo do robô.

Pontos principais:

- A estrutura de diretórios e arquivos é mostrada na figura.
- O `README` fornece instruções detalhadas.
- O script de execução é o `Make_file`, que pode ser rodado com opções.
- `SOC_Verification` roda a simulação.
- `SOC_PP_Debug` roda com ambiente de debug usando arquivo de pós-processamento gerado durante a simulação.

Estrutura mostrada:

```text
ROOT: robot
├── src
│   └── robot_model.v
└── sim
    ├── robot_model_tb.v
    └── Make_file
```

Tabela de arquivos:

| Arquivo | Diretório | Descrição |
|---|---|---|
| `Robot_model.v` | `pc_tutorial/robot/src/` | Contém o código-fonte RTL do modelo do robô. |
| `Robot_model_tb.v` | `pc_tutorial/robot/sim/` | Contém o testbench Verilog top-level. |
| `README` | `pc_tutorial/robot/sim/` | Contém detalhes de execução da simulação. |
| `Makefile` | `pc_tutorial/robot/sim/` | Contém scripts de compilação e execução da simulação. |

---

## Aula didática desenvolvida

### 1. Este design é uma FSM hierárquica

O robô não é apenas uma lógica combinacional. Ele tem memória de estado. Ele precisa saber:

- se está esperando requisição;
- qual estação pediu atendimento;
- se está carregando;
- se terminou o carregamento;
- se está descarregando;
- qual passo do descarregamento está em execução;
- quando deve voltar a esperar nova requisição.

Isso é exatamente o tipo de problema resolvido por uma **FSM — Finite State Machine**.

O modelo fica mais limpo quando pensamos em três níveis:

```text
FSM principal:
  decide qual estação atender e em qual fase global está.

FSM de load:
  controla a sequência para pegar o objeto.

FSM de unload:
  controla a sequência para descarregar na estação correta.
```

---

### 2. Por que separar máquina principal, load e unload?

Poderia existir uma única máquina gigante com todos os estados:

```text
WAIT
S0_LOAD_WRIST_HORIZONTAL
S0_LOAD_CLOSE_CLAW
S0_LOAD_WRIST_VERTICAL
S0_UNLOAD_TURN_A
S0_UNLOAD_TURN_B
...
S3_UNLOAD_RELEASE
```

Mas isso ficaria difícil de entender.

Separar em blocos deixa o design mais modular:

```text
Main FSM → escolhe estação e fase.
Load FSM → sempre executa sequência de carregamento.
Unload FSM → executa sequência de descarregamento conforme estação.
```

Isso facilita:

- leitura;
- debug;
- waveform;
- manutenção;
- expansão para mais estações;
- reaproveitamento de lógica.

---

### 3. Requisição, start e done: protocolo simples de controle

O design usa um padrão muito comum em hardware:

```text
req   → alguém pede uma operação
start → controlador inicia a operação
done  → operação informa que terminou
```

Exemplo para estação 0:

```text
s0_req sobe
   ↓
FSM identifica pedido
   ↓
load_start sobe
   ↓
load_done indica carregamento concluído
   ↓
s0_start sobe
   ↓
s0_done indica descarregamento concluído
   ↓
FSM volta para Wait_req
```

Esse padrão aparece em muitos projetos reais:

- controladores DMA;
- interfaces de memória;
- blocos de comunicação;
- aceleradores;
- pipelines;
- controladores de periféricos.

---

### 4. Codificação dos movimentos

Cada movimento mecânico é codificado como bits.

Exemplo:

```text
00 → stay
01 → turn right
10 → turn left
```

Isso transforma uma ação física em uma saída digital.

No RTL, algo assim poderia aparecer como:

```verilog
parameter STAY       = 2'b00;
parameter TURN_RIGHT = 2'b01;
parameter TURN_LEFT  = 2'b10;

reg [1:0] joint_a;
```

E a FSM pode gerar:

```verilog
case (unload_state)
  TURN_A_RIGHT: joint_a = TURN_RIGHT;
  TURN_A_LEFT:  joint_a = TURN_LEFT;
  default:      joint_a = STAY;
endcase
```

Assim, o atuador que controla a junta `A` recebe uma ordem binária clara.

---

### 5. Reset assíncrono ativo baixo

O sinal `reset_n` indica reset ativo em nível baixo.

A convenção `_n` significa:

```text
active low
```

Ou seja:

```text
reset_n = 0 → reset ativo
reset_n = 1 → operação normal
```

Template típico:

```verilog
always @(posedge clock or negedge reset_n) begin
  if (!reset_n)
    curr_state <= WAIT_REQ;
  else
    curr_state <= next_state;
end
```

Esse bloco descreve flip-flops com reset assíncrono ativo baixo.

---

### 6. Como ler a máquina principal na waveform

Na waveform, procure:

1. `clock`;
2. `reset_n`;
3. `s*_req`;
4. `curr_state` ou nome equivalente;
5. `load_start`;
6. `load_done`;
7. `s*_start`;
8. `s*_done`.

Uma sequência saudável seria:

```text
reset_n sobe
curr_state = Wait_req
s1_req sobe
curr_state muda para S1_load
load_start ativa
load_done sobe
curr_state muda para S1_unload
s1_start ativa
s1_done sobe
curr_state volta para Wait_req
```

Se a FSM não sair de `Wait_req`, o problema pode estar em `s*_req`.

Se sair para load mas nunca avançar, o problema pode estar em `load_done`.

Se entrar em unload mas nunca voltar, o problema pode estar em `s*_done`.

---

### 7. Testbench como modelo do ambiente

O testbench não testa apenas a lógica isolada. Ele imita o ambiente do robô.

No mundo real:

```text
sensor detecta pedido
atuador conclui carregamento
atuador conclui descarregamento
```

Na simulação:

```verilog
s0_req = 1'b1;
...
load_done = 1'b1;
...
s0_unload_done = 1'b1;
```

Ou seja, o testbench precisa produzir os eventos que fariam o hardware andar.

Se o testbench nunca gera `load_done`, a FSM pode ficar presa em load mesmo que o RTL esteja correto.

---

### 8. Por que sinais de debug são importantes?

O slide destaca “I/O Signals for debug”.

Em designs sequenciais, apenas olhar a saída final pode não ser suficiente. Você precisa observar sinais intermediários:

- estado atual;
- próximo estado;
- request;
- start;
- done;
- sinais das juntas;
- sinais de load/unload.

Por isso, em simulação e Verdi, é comum adicionar sinais internos à waveform.

No Verdi, você pode navegar hierarquicamente e adicionar sinais como:

```text
robot_model_tb.t_robot_model.curr_state
robot_model_tb.t_robot_model.load_state
robot_model_tb.t_robot_model.unload_state
```

Isso torna o debug muito mais rápido.

---

### 9. Makefile como documentação executável

O `README` explica. O `Makefile` executa.

A vantagem do `Makefile` é padronizar comandos:

```bash
make SOC_Verification
make SOC_PP_Debug
make SOC_Coverage
```

Cada alvo encapsula uma intenção.

Exemplo:

```text
SOC_Verification
  → compila e simula normalmente

SOC_PP_Debug
  → compila com debug, simula, gera FSDB e abre Verdi

SOC_Coverage
  → compila e simula coletando coverage
```

Isso evita o problema clássico de cada pessoa rodar o projeto com um comando diferente.

---

### 10. Coverage no Makefile

O slide mostra opções de coverage:

```bash
-cm line+cond+tgl+fsm+branch+assert
```

Significado:

| Opção | Ideia |
|---|---|
| `line` | mede linhas executadas |
| `cond` | mede condições booleanas |
| `tgl` | mede toggles de sinais |
| `fsm` | mede cobertura de estados/transições de FSM |
| `branch` | mede ramos de decisão |
| `assert` | mede cobertura relacionada a assertions |

Para esse design de robô, `fsm` é especialmente importante, porque a maior parte do comportamento é governada por máquinas de estados.

---

### 11. Como verificar melhor o robô

Um testbench básico pode apenas gerar requisições e abrir waveform. Mas um testbench mais forte deveria checar automaticamente:

- se `load_start` sobe após uma requisição;
- se apenas uma estação é atendida por vez;
- se `s0_start` só sobe quando `s0_req` foi o pedido;
- se a FSM volta para `Wait_req` após `done`;
- se os comandos das juntas seguem a sequência correta;
- se uma nova requisição não interrompe indevidamente uma operação em andamento.

Exemplo conceitual de check simples:

```verilog
always @(posedge clock) begin
  if (s0_req) begin
    // depois de alguns ciclos, espera-se load_start
  end
end
```

Em SystemVerilog, isso poderia virar assertion, mas nesta aula o foco ainda está em Verilog e waveform.

---

### 12. Assunção de uma requisição por vez

A especificação diz que o robô atende apenas uma requisição de sensor por vez.

Isso simplifica muito a FSM.

Se duas requisições aparecessem ao mesmo tempo:

```text
s0_req = 1
s1_req = 1
```

o controlador precisaria de política de arbitragem:

- prioridade fixa;
- round-robin;
- fila;
- rejeição de requisição;
- tratamento de erro.

Como o slide assume uma por vez, o RTL pode usar uma cadeia simples de `if/else` ou `case`.

Mas essa assunção deve ser testada ou garantida pelo ambiente. Caso contrário, o design pode se comportar de forma não especificada.

---

## Conceitos difíceis explicados em profundidade

### 1. FSM com submáquinas

Uma FSM principal pode delegar operações para submáquinas. Isso é comum em controladores.

Exemplo:

```text
Main FSM:
  WAIT_REQ
  LOAD
  UNLOAD

Load FSM:
  WRIST_HORIZONTAL
  CLOSE_CLAW
  WRIST_VERTICAL

Unload FSM:
  TURN_A
  TURN_B
  RELEASE
  RETURN
```

A FSM principal decide “qual fase”. A submáquina decide “qual passo dentro da fase”.

Isso evita uma explosão de estados na FSM principal.

---

### 2. Estado atual e próximo estado

Em RTL de FSM, normalmente há dois blocos:

#### Bloco sequencial

```verilog
always @(posedge clock or negedge reset_n) begin
  if (!reset_n)
    curr_state <= WAIT_REQ;
  else
    curr_state <= next_state;
end
```

Ele guarda o estado.

#### Bloco combinacional

```verilog
always @(*) begin
  next_state = curr_state;

  case (curr_state)
    WAIT_REQ: begin
      if (s0_req)
        next_state = S0_LOAD;
    end
  endcase
end
```

Ele calcula para onde ir.

Essa separação melhora síntese e debug.

---

### 3. Outputs baseados em estado

Sinais como `load_start` e `s0_start` podem ser gerados diretamente a partir do estado.

Exemplo:

```verilog
assign load_start = (curr_state == S0_LOAD) ||
                    (curr_state == S1_LOAD) ||
                    (curr_state == S2_LOAD) ||
                    (curr_state == S3_LOAD);
```

Isso é estilo **Moore**, porque a saída depende do estado atual.

Alternativamente, uma saída poderia depender de estado e entrada, estilo **Mealy**:

```verilog
assign load_start = (curr_state == WAIT_REQ) && (s0_req || s1_req || s2_req || s3_req);
```

Para controle mecânico, saídas Moore costumam ser mais previsíveis.

---

### 4. Done signals

Sinais `done` são fundamentais para sincronizar módulos com duração variável.

A FSM não deve simplesmente esperar um número fixo de ciclos se o tempo da operação pode variar. Em vez disso:

```verilog
if (load_done)
  next_state = S0_UNLOAD;
```

Isso torna o design mais robusto.

No testbench, se você esquece de gerar `load_done`, a FSM fica presa. Por isso, o testbench precisa modelar o ambiente completo.

---

### 5. Debug de FSM

Ao debugar uma FSM, a primeira pergunta é:

```text
Em qual estado ela está presa?
```

Depois:

```text
Qual condição deveria fazê-la sair desse estado?
```

Exemplo:

```text
Estado atual: S0_LOAD
Condição de saída: load_done == 1
Waveform mostra: load_done nunca sobe
Conclusão: problema no testbench ou no bloco de load_done
```

Esse método evita chute.

---

### 6. `Makefile` e fluxo reproducível

Em verificação, o comando usado para rodar o teste faz parte do resultado. Se um teste passa na mão de uma pessoa e falha na mão de outra, muitas vezes a diferença está em:

- opção de compilação;
- macro definida;
- seed;
- versão de ferramenta;
- arquivo de entrada;
- ordem no filelist;
- modo de debug;
- coverage habilitado ou não.

O `Makefile` padroniza isso.

---

### 7. Post-process debug versus interactive debug

#### Post-process debug

Você roda a simulação, gera um arquivo como `.fsdb`, e depois abre no Verdi.

Fluxo:

```text
simulação termina
   ↓
FSDB gerado
   ↓
Verdi abre waveform
```

Comando:

```bash
verdi -nologo -ssf robot_model.fsdb &
```

#### Interactive debug

Você roda a simulação já conectada à GUI, podendo interagir durante a execução.

Fluxo:

```text
simulação roda com GUI
   ↓
usuário pode pausar, avançar, inspecionar
```

Comando típico do slide:

```bash
./simv -gui=verdi -l simv.log
```

---

### 8. Coverage de FSM

Como o design do robô é fortemente baseado em FSM, coverage de FSM é muito valioso.

Perguntas de coverage:

- Todos os estados foram visitados?
- Todas as transições foram exercitadas?
- Cada estação foi atendida?
- O fluxo de load foi executado?
- O fluxo de unload para estações 1/3 foi executado?
- O fluxo de unload para estações 2/4 foi executado?
- O reset foi testado?
- O retorno para `Wait_req` foi testado?

Se a waveform só mostra a estação 1 sendo atendida, isso não prova que as estações 2, 3 e 4 funcionam.

---

## Figuras, diagramas e waveforms importantes

### Figura do robô e estação de carregamento

Mostra a ideia física do problema: um braço robótico com uma estação de carregamento superior e estações laterais de descarregamento. Essa figura ajuda a entender por que a FSM precisa de load e unload.

### Figura dos movimentos A, B, C, D, E

Mostra que o robô tem cinco graus de movimento: base, ombro, braço, pulso e garra. Essa figura conecta sinais digitais a ações mecânicas.

### Diagrama de pinos do Robot Model

Mostra entradas de request/done e saídas start/load. É a interface externa do DUT e deve ser a primeira coisa a entender antes do testbench.

### Máquina principal de controle

Mostra a estrutura global: `Wait_req`, caminhos para cada estação, load e unload. É o coração lógico do design.

### Load State Machine

Mostra a sequência comum de carregamento: pulso horizontal, pegar item/fechar garra, pulso vertical.

### Unload Operation

Mostra por que estações diferentes exigem sequências diferentes de movimentos.

### Unload State Machine

Mostra as transições de descarregamento e a diferença entre estações 1/3 e 2/4.

### README

Mostra como instalar/configurar/rodar o projeto. É importante porque, em labs reais, o código sozinho não basta; é preciso preparar o ambiente.

### Testbench diagram

Mostra clock/reset generator, sensor model, DUT e waveform debug system. Essa é a arquitetura de simulação.

### Makefile

Mostra os alvos de simulação, debug e coverage. É a parte operacional do laboratório.

### Sample waveform

Mostra a estação 1 sendo atendida. Deve ser usada para rastrear a sequência: request → load → unload → done → wait.

---

## Pontos de prova e revisão

### Perguntas prováveis

1. **Qual é o objetivo do design do robô?**  
   Projetar um modelo que carrega e descarrega um objeto em estações conforme requisições.

2. **Quantos graus de movimento o robô possui?**  
   Cinco: base, shoulder, arm, wrist e claw.

3. **Qual é a função dos sensores?**  
   Detectar requisições das estações e iniciar a sequência correta de operação.

4. **Qual assunção simplifica o controle?**  
   O robô atende somente uma requisição de sensor por vez.

5. **Quais sinais representam requisições?**  
   `S0_req`, `S1_req`, `S2_req`, `S3_req`.

6. **Quais sinais indicam início de atendimento/descarregamento?**  
   `S0_start`, `S1_start`, `S2_start`, `S3_start`, ou nomes equivalentes `S*_unloadstart`.

7. **O que faz `Load_start`?**  
   Indica início da operação de carregamento.

8. **O que faz `Load_done`?**  
   Indica que a operação de carregamento terminou.

9. **Qual é a função da máquina principal de estados?**  
   Esperar requisições, escolher a estação, iniciar load/unload e voltar para espera.

10. **Quais são os três passos da máquina de load?**  
    Wrist horizontal, load item and close claw, wrist vertical.

11. **Por que as estações 2 e 4 têm sequência diferente?**  
    Porque exigem movimento adicional da junta `C`.

12. **Para que serve `robot.setup`?**  
    Configurar o ambiente do projeto antes de análise/elaboração.

13. **Qual comando roda a verificação básica?**  
    `make SOC_Verification`.

14. **Qual comando abre debug pós-processamento?**  
    `make SOC_PP_Debug`, que usa Verdi e arquivo FSDB.

15. **Qual comando está associado a coverage?**  
    `make SOC_Coverage`.

16. **Qual arquivo contém o RTL do robô?**  
    `Robot_model.v`.

17. **Qual arquivo contém o testbench?**  
    `Robot_model_tb.v`.

18. **Qual arquivo contém os scripts de compilação/simulação?**  
    `Makefile`.

### Pegadinhas

- `reset_n` é ativo baixo.
- O robô atende apenas uma requisição por vez; o design pode não arbitrar requisições simultâneas.
- `Load_start` é saída do controlador; `Load_done` é entrada de conclusão.
- `S*_start` é saída para iniciar descarregamento; `S*_done` é entrada de conclusão.
- A FSM principal não executa todos os movimentos; ela coordena submáquinas.
- A waveform de uma estação atendida não garante que todas as estações foram verificadas.
- Coverage de FSM é muito relevante neste design.
- `SOC_PP_Debug` é diferente de `SOC_Interactive_Debug`.
- O testbench precisa gerar os sinais de `done`; caso contrário, a FSM pode ficar presa.
- A organização de diretórios faz parte do fluxo, não é detalhe secundário.

### Frases para memorizar

```text
O robô é controlado por FSMs.
Request inicia; start aciona; done conclui.
Load é comum; unload depende da estação.
reset_n ativo baixo significa reset quando vale 0.
Makefile padroniza simulação, debug e coverage.
Waveform mostra a sequência temporal de atendimento.
Coverage de FSM mede se estados e transições foram exercitados.
```

---

## Relação com projeto/laboratório

Esta aula é diretamente ligada ao fluxo de laboratório.

### Relação com leitura de RTL

O arquivo principal é:

```text
Robot_model.v
```

Ele deve ser lido procurando:

- declaração de portas;
- parâmetros de estado;
- FSM principal;
- FSM de load;
- FSM de unload;
- geração de saídas.

### Relação com testbench

O arquivo:

```text
Robot_model_tb.v
```

deve ser lido procurando:

- geração de clock;
- geração de reset;
- geração de requisições;
- geração de `done`;
- instanciação do DUT;
- dump FSDB;
- tempo de finalização com `$finish`.

### Relação com Makefile

O arquivo:

```text
Makefile
```

controla os modos de execução:

```bash
make SOC_Verification
make SOC_PP_Debug
make SOC_Interactive_Debug
make SOC_Coverage
```

### Relação com Verdi

A waveform `robot_model.fsdb` é aberta com:

```bash
verdi -nologo -ssf robot_model.fsdb &
```

No Verdi, o objetivo é observar:

- requests;
- states;
- load/unload;
- start/done;
- saídas de movimento;
- retorno para `Wait_req`.

### Relação com debug

Se a estação 1 não for atendida:

```text
verifique s1_req
verifique curr_state
verifique load_start
verifique load_done
verifique s1_start
verifique s1_done
```

Se a FSM fica presa, procure o sinal de conclusão esperado para aquele estado.

---

## Checklist de qualidade

- [x] Texto dos slides foi convertido para texto real.
- [x] Conceitos difíceis foram explicados, não apenas citados.
- [x] Código/comandos foram preservados e explicados.
- [x] Figuras relevantes foram interpretadas.
- [x] O Markdown ficou útil para estudar sem abrir o DOCX.
- [x] O próximo bloco foi indicado ao final.

---

## Próximo bloco

**Bloco 006 — 01 VHDL Introduction**

Arquivo para anexar:

```text
C:\Users\maiko\ci_expert\Aulas2Prints\02 VHDL Refresher\01 VHDL Introduction.docx
```

Faixa:

```text
Slides 1-13
```

Salvar em:

```text
C:\Users\maiko\ci_expert\mdCursoPt2\02 VHDL Refresher\01 VHDL Introduction.md
```
