# 06 Module 06 — Fusion Compiler and UPF

## Controle do bloco

- **Bloco:** 087
- **Curso:** 11 Fusion Compiler UPF Fundamentals
- **Aula:** 06 Module 06 — Fusion Compiler and UPF
- **Arquivo de origem:** `C:\Users\maiko\ci_expert\Aulas2Prints\11 Fusion Compiler UPF Fundamentals\06 Module 06 - Fusion Compiler and UPF.docx`
- **Arquivo anexado nesta conversa:** `06 Module 06 - Fusion Compiler and UPF.docx`
- **Faixa processada conforme roteiro:** slides 1-20
- **Observação sobre o anexo:** o DOCX possui 10 páginas renderizadas, com 2 slides por página. O texto foi extraído visualmente dos prints, pois o documento não possui texto editável parseável.
- **Começa em:** `Innovation Leadership with Synopsys Fusion Design Platform`
- **Termina em:** `Outputs: Using save_upf`
- **Salvar em:**

```text
C:\Users\maiko\ci_expert\mdCursoPt2\11 Fusion Compiler UPF Fundamentals\06 Module 06 - Fusion Compiler and UPF.md
```

---

## Resumo executivo

Este módulo conecta tudo que foi estudado em UPF com o fluxo real de uso do **Fusion Compiler**. Depois de aprender power domains, power strategies, supply network e power states, agora o curso mostra como esses conceitos entram no fluxo de implementação RTL-to-GDSII.

A mensagem central é:

```text
Fusion Compiler trabalha em modo UPF por padrão, lê o UPF junto com RTL/constraints/libs, valida o power intent, insere células multivoltage durante compile_fusion, permite checagens com check_mv_design e exporta o UPF implementado com save_upf.
```

O módulo cobre:

1. A posição do Fusion Compiler dentro da **Synopsys Fusion Design Platform**.
2. O Fusion Compiler como solução RTL-to-GDSII com:
   - single data model and shell;
   - common engines;
   - golden signoff backbone.
3. O que diferencia o FC:
   - otimizações unificadas;
   - common data model;
   - engines intercalados;
   - signoff analysis engines.
4. Modelo de uso com UPF:
   - `load_upf`;
   - `compile_fusion`;
   - `initial_map`;
   - `initial_place`;
   - inserção de células multivoltage.
5. Fluxo de implementação UPF entre front-end e back-end.
6. Comandos principais em modo UPF:
   - `load_upf`;
   - `commit_upf`;
   - `check_mv_design`;
   - `compile_fusion`;
   - `save_upf`.
7. Duas formas de transferir UPF entre ferramentas:
   - fluxo tradicional UPF′;
   - fluxo golden UPF + supplemental UPF.
8. Inputs principais:
   - RTL;
   - multivoltage libraries;
   - UPF power intent.
9. Setup de bibliotecas multivoltage.
10. Checagem de modelagem de PG pins com:
    - `report_mv_lib_cells`.
11. Células especiais necessárias:
    - level shifters;
    - isolation cells;
    - enable level shifters;
    - retention cells;
    - always-on cells.
12. Exemplo de modelagem Liberty para enable level shifter.
13. Leitura de UPF com `load_upf`.
14. Finalização do power intent com `commit_upf`.
15. Checagens estáticas com `check_mv_design`.
16. Cuidados antes e depois de `compile_fusion`.
17. Uso opcional de `create_mv_cells`.
18. Exportação com `save_upf`.

O módulo é menos conceitual que os anteriores e mais operacional. Ele ensina a sequência mental:

```text
Ler RTL → carregar UPF → commitar UPF → checar MV → compilar → checar novamente → salvar UPF implementado.
```

---

# Parte 1 — Fusion Design Platform e Fusion Compiler

## Slide 1 — Innovation Leadership with Synopsys Fusion Design Platform

### Texto extraído

Título:

```text
Innovation Leadership with Synopsys Fusion Design Platform
```

Caixas principais:

```text
Fusion Architecture
#1 Anchors: Synthesis, Place and Route, Signoff
Fusion of algorithms, engines, data model
Three Fusion types: ECO, Signoff, and Test
```

```text
Innovative Products
Industry unique Fusion Compiler
Design Compiler NXT, TestMAX, IC Validator NXT
New PrimeShield, PrimeECO, RTL Architect
```

```text
Market Leadership
AI-enhanced tools, AI-driven apps
Accelerating AI, Automotive, 3DIC chips
Cloud-ready, Silicon Lifecycle Management
```

Rodapé:

```text
20% Better Quality-of-Results and 2X faster Time-to-Results
```

Figura lateral:

```text
Synopsys Digital Design Family
SoC Compiler
RTL Architect
Test Fusion
Design Compiler NXT
IC Compiler II
Fusion Compiler
Signoff Fusion
PrimeTime / PrimeShield / PrimePower / PrimeSim / Tweaker ECO
StarRC
IC Validator NXT / Formality ECO / RedHawk Analysis Fusion
```

### Interpretação

Este slide posiciona o Fusion Compiler dentro da plataforma maior da Synopsys.

A ideia é que a plataforma Fusion integra três grandes âncoras:

```text
synthesis
place and route
signoff
```

Em vez de tratar front-end, place-and-route e signoff como mundos separados, a arquitetura Fusion tenta compartilhar:

- algoritmos;
- engines;
- data model;
- análise;
- feedback entre etapas.

O slide também coloca o Fusion Compiler como produto central da família digital, conectado com ferramentas como:

- Design Compiler NXT;
- IC Compiler II;
- PrimeTime;
- StarRC;
- IC Validator NXT;
- Formality ECO;
- RedHawk Analysis Fusion.

### Ponto didático

Para UPF, isso importa porque o power intent não é apenas uma restrição de síntese. Ele afeta:

```text
synthesis
placement
routing
CTS
power grid
signoff
ECO
```

Logo, uma ferramenta unificada tem vantagem porque carrega a mesma intenção de potência ao longo de mais etapas.

---

## Slide 2 — Fusion Compiler: The Industry’s Only RTL-to-GDSII Solution

### Texto extraído

Título:

```text
Fusion Compiler: The Industry's Only RTL-to-GDSII Solution
```

Caixas:

```text
Single Data Model and Shell
Common Engines
Interleaved for highest PPA
Golden Signoff Backbone
```

Rodapé:

```text
Best PPA. Most Predictable Flow. Fastest Time-to-Results.
```

Figura:

```text
RTL → Common Interleaved Optimization Engines → GDSII
Golden Signoff Analysis
Single Framework
```

### Interpretação

Este slide resume a proposta do Fusion Compiler:

```text
uma solução única de RTL até GDSII
```

Os três pilares são:

## 1. Single data model and shell

A ferramenta usa um modelo de dados único, evitando perda de informação entre etapas.

## 2. Common engines

Os engines de otimização são compartilhados/intercalados, permitindo que síntese e otimização física conversem mais cedo.

## 3. Golden signoff backbone

A implementação é orientada por análise próxima de signoff, reduzindo surpresas no fim do fluxo.

### Relação com UPF

UPF precisa sobreviver e continuar coerente por várias etapas:

```text
RTL
logic optimization
placement
CTS
routing
signoff
```

Um único data model ajuda a manter a consistência do power intent.

---

## Slide 3 — What Makes Fusion Compiler Different?

### Texto extraído

Título:

```text
What Makes Fusion Compiler Different?
```

Subtítulo:

```text
Seamless Movement of Technologies for Optimal Predictability and Highest QoR
```

Lado esquerdo:

```text
Traditional Front-End
Traditional Back-End
```

Bloco central:

```text
Common Data Model
Signoff Analysis Engines
```

Lista de engines/etapas:

```text
Boolean Optimization
Resource Sharing
Mapping
Structuring
Datapath Optimization
Buffering
Logic Re-synthesis
Placement & Legalization
Wire Synthesis
Clock Tree Synthesis
Clock and Data Optimization
Routing
Crosstalk Optimization
Timing ECO Optimization
```

Lado direito:

```text
Unified
```

### Interpretação

Este slide mostra a diferença entre um fluxo tradicional separado e um fluxo unificado.

No fluxo tradicional, front-end e back-end são fases separadas. No Fusion Compiler, várias tecnologias de otimização são integradas dentro do mesmo modelo de dados.

A lista mostra que o FC não faz apenas síntese lógica. Ele atravessa desde:

```text
Boolean optimization
mapping
resource sharing
datapath optimization
```

até:

```text
placement
wire synthesis
CTS
routing
crosstalk optimization
timing ECO
```

### Ponto importante

A presença de **signoff analysis engines** dentro desse fluxo significa que as decisões são guiadas por análises mais realistas.

### Relação com UPF

UPF afeta várias dessas etapas:

- LS/ISO/RET podem ser inseridos em synthesis;
- placement deve respeitar voltage areas e supplies;
- routing deve respeitar PG connectivity;
- timing precisa considerar cells especiais;
- ECO não pode quebrar power intent.

---

# Parte 2 — Modelo de uso do Fusion Compiler com UPF

## Slide 4 — Fusion Compiler Usage Model With UPF

### Texto extraído

Título:

```text
Fusion Compiler Usage Model With UPF
```

Pontos:

```text
Unified RTL-to-GDSII in one single shell
UPF is loaded for the design that is read-in
initial_map does the multivoltage cell insertion
*New multivoltage cells needed for DFT paths are added in initial_place
```

Fluxo mostrado:

```text
Fusion Compiler
Load UPF

compile_fusion:
initial_map
logic_opto
insert_dft
initial_place
initial_opto
final_opto
clock_opt
route_opt
```

Destaque:

```text
Insertion of multivoltage cells
```

### Interpretação

Este slide mostra onde o UPF entra no fluxo do FC.

Primeiro, o design é lido. Depois o UPF é carregado:

```tcl
load_upf
```

Em seguida, durante `compile_fusion`, as etapas iniciais cuidam da inserção das células multivoltage.

O slide destaca:

```text
initial_map faz a inserção de multivoltage cells
```

e:

```text
novas MV cells necessárias para caminhos DFT são adicionadas em initial_place.
```

### Que células são essas?

Principalmente:

- level shifters;
- isolation cells;
- retention cells;
- enable level shifters;
- always-on buffers;
- power management cells associadas às strategies.

### Ponto prático

A inserção não acontece “no fim”. Ela começa cedo no compile, porque essas células afetam mapeamento, lógica, placement e timing.

---

## Slide 5 — UPF Implementation Flow

### Texto extraído

Título:

```text
UPF Implementation Flow
```

Entradas do front-end:

```text
Tech File
TLU+
RTL
UPF
SDC
Ref Lib (NDM)
```

Fluxo Fusion Compiler [FE]:

```text
Read RTL
load_upf
Read SDC
Setup CG
Read Physical Constraints
check_mv_design
compile_fusion -to logic_opt
Setup TEST
compile_fusion -to final_opt
check_mv_design
Report QoR
```

Saídas/intermediários:

```text
Design NDM
UPF'
SDC
Netlist
DEF
```

Fluxo Fusion Compiler [BE]:

```text
Read ASCII/NDM
commit_upf
connect_pg_net
check_mv_design
compile_fusion -to final_opt
Report QoR
```

### Interpretação

Este slide organiza o fluxo em front-end e back-end.

## Front-end [FE]

O FC lê:

- RTL;
- UPF;
- SDC;
- constraints físicas;
- libs/tech.

Depois roda:

```text
check_mv_design
compile_fusion
check_mv_design
report QoR
```

Saídas importantes:

```text
Design NDM
UPF'
SDC
Netlist
DEF
```

O `UPF'` representa o UPF atualizado/derivado após a implementação front-end.

## Back-end [BE]

O BE lê o design implementado/intermediário e continua:

```text
commit_upf
connect_pg_net
check_mv_design
compile_fusion -to final_opt
Report QoR
```

### Ponto importante

A presença de `commit_upf`, `connect_pg_net` e `check_mv_design` no BE mostra que power intent precisa ser validado também depois de etapas físicas e de conexão PG.

---

## Slide 6 — Logic Synthesis in UPF mode

### Texto extraído

Título:

```text
Logic Synthesis in UPF mode
```

Ponto:

```text
Fusion Compiler is invoked in the UPF mode by default:
```

Comando:

```text
unix% fc_shell
```

Ponto:

```text
Main UPF commands for synthesis in the UPF mode:
```

Comandos:

```tcl
fc_shell> load_upf
fc_shell> commit_upf
fc_shell> check_mv_design
fc_shell> compile_fusion
fc_shell> save_upf
```

### Interpretação

Este slide mostra o fluxo mínimo operacional em FC.

Diferente de alguns fluxos onde é preciso habilitar explicitamente modo UPF, aqui o slide diz:

```text
Fusion Compiler é invocado em UPF mode por default.
```

Sequência principal:

```text
1. load_upf
2. commit_upf
3. check_mv_design
4. compile_fusion
5. save_upf
```

### Função de cada comando

| Comando | Função |
|---|---|
| `load_upf` | Lê o arquivo UPF |
| `commit_upf` | Finaliza/valida o power intent carregado |
| `check_mv_design` | Checa regras multivoltage |
| `compile_fusion` | Compila/implementa o design considerando UPF |
| `save_upf` | Escreve o UPF atualizado/derivado |

---

# Parte 3 — Transferência de UPF entre ferramentas

## Slide 7 — Two Methods for UPF Transfer Across Tools

### Texto extraído

Título:

```text
Two Methods for UPF Transfer Across Tools
```

Ponto:

```text
Both UPF' and golden UPF flows are supported
```

Fluxo tradicional:

```text
Traditional UPF' Flow

RTL + UPF
↓
Fusion Compiler [FE]
↓
Gate + UPF'
↓
Fusion Compiler [BE]
↓
Gate + UPF''
```

Fluxo golden:

```text
Golden UPF Flow

Golden UPF + RTL
↓
Fusion Compiler [FE]
↓
Gate + Supplemental UPF
↓
Fusion Compiler [BE]
↓
Gate w/PG + Supplemental UPF
```

### Interpretação

Este slide compara duas metodologias.

## Traditional UPF′ flow

O UPF entra no FE. A ferramenta gera um UPF atualizado:

```text
UPF'
```

Depois o BE consome esse `UPF'` e pode gerar outro:

```text
UPF''
```

Essa abordagem carrega uma versão transformada do UPF ao longo das etapas.

## Golden UPF flow

Há um **Golden UPF** preservado como fonte principal. A ferramenta gera um **Supplemental UPF** com mudanças complementares derivadas da implementação.

O BE recebe:

```text
Golden UPF + Supplemental UPF
```

### Diferença mental

| Fluxo | Ideia |
|---|---|
| UPF′ tradicional | O UPF vai sendo transformado e passado adiante |
| Golden UPF | O UPF original permanece referência; mudanças vão em supplemental UPF |

### Ponto prático

O slide diz que ambos são suportados. O fluxo golden costuma ser mais controlado, porque preserva o arquivo de intenção original.

---

# Parte 4 — Inputs: RTL, multivoltage libraries e UPF

## Slide 8 — UPF Inputs for Power Compiler

### Texto extraído

Título:

```text
UPF Inputs for Power Compiler
```

Lista:

```text
RTL
Multivoltage libraries
UPF power intent
```

### Interpretação

Este slide é simples, mas organiza os três inputs essenciais para o fluxo low-power:

1. **RTL**
   - descreve a lógica funcional.
2. **Multivoltage libraries**
   - fornecem cells normais e especiais modeladas para múltiplas tensões.
3. **UPF power intent**
   - descreve domínios, supplies, states e strategies.

### Ponto importante

UPF sozinho não implementa nada se a biblioteca não tiver células compatíveis.

Exemplo:

```text
set_level_shifter pode estar correto,
mas se a biblioteca não tem LS compatível,
a célula pode ficar unmapped ou a inserção falhar.
```

---

## Slide 9 — Multivoltage Library Setup

### Texto extraído

Título:

```text
Multivoltage Library Setup
```

Pontos:

```text
Multivoltage implementation requires a set of libraries that are characterized
at different voltages for a given PT corner
```

```text
Libraries are the key enabler for a complete multivoltage implementation
```

Subitens:

```text
Special cells: such as level shifters or isolation cells
Extra modelling (PG pins) syntax
```

Figura:

```text
LIB 1.db
OC: slow
Pvt: 1.08
...

LIB 2.db
OC: slow
Pvt: 1.23
...

LIB N.db
...
Fusion Compiler and IC Compiler II
Cell Libraries NDM
Synthesis & Place & Route
```

### Interpretação

Bibliotecas multivoltage são indispensáveis para implementação low-power.

A ferramenta precisa de bibliotecas caracterizadas em diferentes tensões para um mesmo corner de PrimeTime/PT.

Exemplo:

```text
uma biblioteca para 0.9 V
outra para 1.08 V
outra para 1.2 V
```

Além das células normais, as bibliotecas precisam conter células especiais:

- level shifters;
- isolation cells;
- enable level shifters;
- retention cells;
- always-on cells.

Também precisam ter modelagem extra de PG pins, porque as ferramentas precisam saber quais pinos são power/ground e como se relacionam com sinais.

### Ponto prático

```text
Bibliotecas são o habilitador central da implementação multivoltage.
```

UPF define a intenção; biblioteca fornece células implementáveis.

---

## Slide 10 — Checking PG Pin Modelling in Libraries for UPF Flow

### Texto extraído

Título:

```text
Checking PG Pin Modelling in Libraries for UPF Flow
```

Ponto:

```text
Check that all PG attributes are correctly populated into a PG library:
```

Comando:

```tcl
report_mv_lib_cells
```

Descrição:

```text
Displays PG pins, power management attributes, and multivoltage relevant information
```

Exemplos:

```tcl
fc_shell> report_mv_lib_cells lib/buffer_lib_cell -buffer
fc_shell> report_mv_lib_cells lib/ISO_lib_cell -isolation
fc_shell> report_mv_lib_cells
```

### Interpretação

Este slide mostra como checar se a biblioteca está corretamente modelada para UPF.

O comando:

```tcl
report_mv_lib_cells
```

mostra:

- PG pins;
- atributos de power management;
- informações relevantes para multivoltage.

É possível filtrar por tipo de célula:

```tcl
-buffer
-isolation
```

### Por que isso importa?

Se uma célula de isolation não tem atributos corretos, a ferramenta pode não reconhecê-la como ISO.

Se um level shifter não tem PG pins, related power/ground pins ou ranges, a ferramenta pode não mapear corretamente.

---

## Slide 11 — Checking PG Pin Modelling in Libraries for UPF Flow — relatório

### Texto extraído

Título:

```text
Checking PG Pin Modelling in Libraries for UPF Flow
```

Comando no topo:

```tcl
report_mv_lib_cells -isolation mv_lib/ISO_CELL
```

Partes destacadas no relatório:

```text
Lib cell attributes section
Operating conditions section
Signal and PG pins modelling section
```

Exemplos visíveis no relatório:

```text
Isolation Cell
Lib Cell Attributes Values
Lib Cell Type Isolation Cell
Isolation Clamp Value 1
Isolation Sense high
Threshold Voltage Group ...

PG_PIN(VDD)
VOLTAGE_NAME VDD
PG_TYPE primary_power
END_PG_PIN VDD

PG_PIN(VSS)
VOLTAGE_NAME VSS
PG_TYPE primary_ground
END_PG_PIN VSS

PIN(A)
RELATED_POWER_PIN VDD
RELATED_GROUND_PIN VSS

PIN(EN)
LOGIC_FUNCTION QD !ISO
RELATED_POWER_PIN VDD
RELATED_GROUND_PIN VSS

PIN(Q)
RELATED_POWER_PIN VDD
RELATED_GROUND_PIN VSS
END_CELL
```

### Interpretação

Este slide mostra que o relatório não é apenas uma lista de nomes. Ele separa informações por seções.

## 1. Lib cell attributes

Mostra o tipo da célula e atributos PM:

```text
Isolation Cell
Isolation Clamp Value
Isolation Sense
```

## 2. Operating conditions

Mostra condições de operação/caracterização.

## 3. Signal and PG pins modelling

Mostra como pinos de sinal se relacionam com pinos de power/ground.

Exemplo:

```text
PIN(A) → RELATED_POWER_PIN VDD, RELATED_GROUND_PIN VSS
PIN(EN) → related VDD/VSS
PIN(Q) → related VDD/VSS
```

### Ponto prático

Essas relações são essenciais para `source/sink`, MV checking, LS/ISO insertion e verificação de PG connectivity.

---

## Slide 12 — Special (Power Management) Cells Required

### Texto extraído

Título:

```text
Special (Power Management) Cells Required
```

Pontos:

```text
Special cell libraries are needed
Low-power design requires new cells with multiple power pins
Additional modeling information in ".lib" is required to allow automatic handling of these cells
Verilog models for the special cells are needed for simulation
```

Células mostradas:

```text
Level shifters
Isolation cells
Enable level shifters
Retention cells
Always On cells
```

### Interpretação

Este slide resume as células especiais exigidas em um fluxo UPF.

## Level shifters

Convertem sinais entre domínios de tensão diferente.

## Isolation cells

Protegem domínios ligados contra saídas de domínios desligados.

## Enable level shifters

Combinam função de enable/isolation com level shifting.

## Retention cells

Mantêm estado durante shutdown.

## Always-on cells

Funcionam mesmo quando parte do domínio está desligada.

### Ponto importante

Essas células normalmente têm múltiplos power pins e precisam de modelagem Liberty detalhada.

Além disso, são necessários modelos Verilog para simulação.

---

## Slide 13 — Example of Multivoltage Cell Modelling: Enable Level Shifter

### Texto extraído

Título:

```text
Example of Multivoltage Cell Modelling: Enable Level Shifter
```

Texto:

```text
Look for presence of all key power attributes:
```

Trechos visíveis de Liberty:

```text
CELL(Enable_Level_Shifter) ...
LEVEL_SHIFTER_TYPE: LH
```

PG pins:

```text
PG_PIN(VDD1):
  VOLTAGE_NAME: VDD1
  PG_TYPE: primary_power
END_PG_PIN VDD1

PG_PIN(VDD2):
  VOLTAGE_NAME: VDD2
  PG_TYPE: primary_power
END_PG_PIN VDD2

PG_PIN(VSS):
  VOLTAGE_NAME: VSS
  PG_TYPE: primary_ground
END_PG_PIN VSS
```

Pinos de sinal:

```text
PIN(A):
  RELATED_POWER_PIN: VDD1
  RELATED_GROUND_PIN: VSS
  INPUT_SIGNAL_LEVEL(A): VDD1

PIN(EN):
  RELATED_POWER_PIN: VDD2
  RELATED_GROUND_PIN: VSS
  INPUT_SIGNAL_LEVEL(EN): VDD2

PIN(Y):
  RELATED_POWER_PIN: VDD2
  RELATED_GROUND_PIN: VSS
  POWER_DOWN_FUNCTION: !VDD1+!VDD2+VSS
  OUTPUT_SIGNAL_LEVEL(Y): VDD2
END_CELL Enable_Level_Shifter
```

### Interpretação

Este slide mostra um exemplo concreto de modelagem Liberty para uma célula ELS.

## Atributo de tipo

```text
LEVEL_SHIFTER_TYPE: LH
```

Indica que é um level shifter low-to-high.

## Múltiplos power pins

A célula tem:

```text
VDD1
VDD2
VSS
```

Isso faz sentido porque um LS precisa lidar com dois domínios de tensão.

## Related power pins

O pino `A` está relacionado a `VDD1`, enquanto `EN` e `Y` estão relacionados a `VDD2`.

Isso informa à ferramenta que:

```text
A entra no domínio de baixa tensão
Y sai no domínio de alta tensão
EN pertence ao lado de VDD2
```

## Power down function

```text
POWER_DOWN_FUNCTION: !VDD1+!VDD2+VSS
```

Modela quando a saída deve ser considerada em power-down/corrupt conforme estado das supplies.

### Ponto prático

Sem esses atributos, o FC não consegue inferir, checar ou mapear a célula corretamente em fluxo UPF.

---

## Slide 14 — UPF Inputs for Fusion Compiler

### Texto extraído

Título:

```text
UPF Inputs for Fusion Compiler
```

Lista:

```text
RTL
Multivoltage libraries
UPF power intent
```

Destaque visual:

```text
UPF power intent
```

### Interpretação

Este slide retoma os três inputs, agora destacando o UPF power intent.

Depois de tratar as bibliotecas, a aula entra na parte operacional de como ler e processar o UPF dentro do Fusion Compiler.

---

# Parte 5 — Leitura, commit, checagem, compile e saída do UPF

## Slide 15 — Input UPF — How to Read it in?

### Texto extraído

Título:

```text
Input UPF — How to Read it in?
```

Uso do comando:

```tcl
load_upf
    # Read a Synopsys UPF Constraints format script
    [-supplemental <upf_file_name>] (Supplemental UPF file to read)
    [-scope string] (Scope)
    [-noecho] (Do not echo all commands)
    [-simulation_only] (Do not process this in tools other than simulation tools)
    [-strict_check string] (Perform exact name search and error check)
    [upf_file_name] (UPF file to read)
```

Sequência destacada:

```tcl
fc_shell> load_upf
fc_shell> commit_upf
fc_shell> check_mv_design
fc_shell> compile_fusion
fc_shell> check_mv_design
fc_shell> save_upf
```

### Interpretação

O comando principal para ler UPF é:

```tcl
load_upf
```

Ele lê um script de constraints UPF.

Opções importantes:

## `-supplemental`

Usado para ler um supplemental UPF, especialmente no fluxo golden UPF.

## `-scope`

Carrega o UPF em um determinado escopo hierárquico.

Isso é importante para IP e integração hierárquica.

## `-noecho`

Evita ecoar todos os comandos.

## `-simulation_only`

Não processa o trecho em ferramentas que não são de simulação.

## `-strict_check`

Ativa busca exata de nomes e checagem de erros.

### Sequência operacional

O slide encaixa `load_upf` como primeiro comando de UPF no fluxo:

```text
load_upf → commit_upf → check_mv_design → compile_fusion → check_mv_design → save_upf
```

---

## Slide 16 — Input UPF — Committing the Power Intent

### Texto extraído

Título:

```text
Input UPF — Committing the Power Intent
```

Comando:

```tcl
commit_upf
```

Pontos:

```text
Indicates to the tool that UPF intent are complete and finalized for the design
Auto executed during compile
Basic checks including the following are performed:
```

Subitens:

```text
UPF object reference
Primary power/ground check
Strategy association for instantiated PM cells
Power Domain - Voltage Area correspondence check
```

Outro ponto:

```text
Resolves PG conflict between DEF and UPF, if DEF is loaded before this command is executed
```

Log visível:

```text
Information: Power intent has been successfully committed.
Information: Total 0 isolation cell(s) in the design.
Information: Total 0 level shifter cell(s) in the design.
Information: Total 0 enable level shifter cell(s) in the design.
Information: Total 0 repeater cell(s) in the design.
Information: Total 0 retention cell(s) in the design.
Information: Total 0 power switch cell(s) in the design.
...
The power domain ... is associated to the voltage area DEFAULT_VA ...
```

### Interpretação

`commit_upf` finaliza o power intent para o design.

Ele informa à ferramenta:

```text
o UPF carregado está completo o suficiente para ser analisado e usado.
```

O slide diz que ele é executado automaticamente durante `compile`, mas é uma boa prática chamá-lo explicitamente para checar cedo.

## Checagens básicas

`commit_upf` verifica:

- referências a objetos UPF;
- primary power/ground;
- associação de strategies a PM cells instanciadas;
- correspondência entre power domains e voltage areas.

## Conflito DEF vs UPF

Se um DEF já foi carregado antes, `commit_upf` pode resolver conflitos de PG entre DEF e UPF.

### Ponto prático

O log de `commit_upf` é útil porque mostra quantas células PM já existem/inferidas e se domínios foram associados a voltage areas.

---

## Slide 17 — Use of Multivoltage Static Checkers

### Texto extraído

Título:

```text
Use of Multivoltage Static Checkers
```

Ponto:

```text
check_mv_design checks the design, multivoltage constraints, electrical isolation requirements, and connection rules; issues error and warning messages as appropriate
```

Subitens:

```text
The checker options can be combined to adjust the level of detail in the final report
If the command is used without any checker options, it reports only a summary of all violations found
```

Uso geral visível:

```tcl
check_mv_design  # check mv design
    [-all] ...
    [-erc_mode] ...
    [-voltage_threshold threshold] ...
    [-power_domain] ...
    [-supply] ...
    [-isolation] ...
    [-level_shifters] ...
    [-retention] ...
    [-power_switch] ...
    [-repeater] ...
    [-terminal_boundary] ...
    [-srsn] ...
    [-diode] ...
    [-model] ...
    [-tieoff] ...
    [-pg_pin] ...
    [-analog] ...
    [-physical_block_pin] ...
    [-signal_pin] ...
    [-pg_netlist] ...
    [-all] ...
    [-interface_only] ...
```

Sequência destacada:

```tcl
fc_shell> load_upf
fc_shell> commit_upf
fc_shell> check_mv_design
fc_shell> compile_fusion
fc_shell> check_mv_design
fc_shell> save_upf
```

### Interpretação

`check_mv_design` é o checker estático multivoltage.

Ele checa:

- design;
- constraints multivoltage;
- requisitos de isolation elétrica;
- regras de conexão;
- violations e warnings.

Sem opções, reporta apenas um resumo de violações.

Com opções, é possível focar em categorias específicas:

```text
isolation
level shifters
retention
power switch
repeater
supply
power domain
PG pins
terminal boundary
physical block pins
```

### Ponto prático

Use `check_mv_design`:

```text
antes do compile, para pegar erro de setup;
depois do compile, para pegar erro na implementação resultante.
```

---

## Slide 18 — Running `compile_fusion` Command

### Texto extraído

Título:

```text
Running compile_fusion Command
```

Antes de rodar:

```text
Before running compile_fusion:
RTL is properly read and elaborated
UPF is properly read using load_upf:
  Ensure there are no errors after reading in the UPF (coded with MV-xxx or UPF-xxx)
  Review warnings issued by the command
Optionally, you can run check_mv_design to check electrical correctness of your design
```

Depois de rodar:

```text
After running compile_fusion:
Review all MV-xxx and UPF-xxx warnings or errors
Run check_mv_design to ensure the correctness of your implemented design
```

Fluxo visual:

```text
Fusion Compiler
Read RTL
load_upf
Read SDC / MCMM
Read Constraints
commit_upf (optional)
create_mv_cells (optional)
check_mv_design (optional)
compile_fusion
check_mv_design & save_upf
```

### Interpretação

Este slide mostra boas práticas antes e depois de `compile_fusion`.

## Antes

Verifique:

- RTL lido e elaborado corretamente;
- UPF carregado com `load_upf`;
- sem erros `MV-xxx` ou `UPF-xxx`;
- warnings revisados;
- opcionalmente, rode `check_mv_design`.

## Depois

Verifique:

- warnings e errors `MV-xxx` / `UPF-xxx`;
- rode `check_mv_design` novamente para validar a implementação.

### Ponto prático

`compile_fusion` não deve ser tratado como “apertar botão e esperar”. O fluxo recomendado inclui checagens antes e depois.

---

## Slide 19 — Use of `create_mv_cells` Command

### Texto extraído

Título:

```text
Use of create_mv_cells Command
```

Comando:

```tcl
create_mv_cells
```

Pontos:

```text
Inserts unmapped level shifters, isolation cells, and retention cells in the design,
based on the defined UPF strategies
```

```text
Traces power management cells to establish drivers and loads
```

```text
Useful for UPF authoring; check power intent early in the flow and modify the strategies as required
```

```text
Multibit power management cells are supported
```

Segundo bloco:

```text
Power management cells are inserted during compile
```

Subitem:

```text
You can use create_mv_cells -mapped to insert power management cells mapped to technology libraries
```

Log:

```text
fc_shell> create_mv_cells
Information: Total 1961 sequential cells have been converted to generic retention cells. (MV-075)
Information: Total 3929 isolation cells have been inserted. (MV-054)
Information: Total 204 enable level shifter (as isolation cells) have been inserted. (MV-054)
Information: Total 2926 level shifter cells have been inserted. (MV-054)
```

### Interpretação

`create_mv_cells` permite inserir células multivoltage antes do compile completo.

Ele insere células **unmapped** com base nas strategies UPF:

- level shifters;
- isolation cells;
- retention cells.

Também rastreia PM cells para estabelecer drivers e loads, o que ajuda a validar o power intent.

## Quando usar?

O slide diz que é útil para **UPF authoring**:

```text
checar power intent cedo
ajustar strategies antes do compile completo
```

## `-mapped`

```tcl
create_mv_cells -mapped
```

insere células já mapeadas para technology libraries.

### Ponto importante

Mesmo sem chamar `create_mv_cells`, o slide diz que PM cells são inseridas durante `compile`. Então este comando é uma ferramenta opcional de inspeção/autoria antecipada.

---

## Slide 20 — Outputs: Using `save_upf`

### Texto extraído

Título:

```text
Outputs: Using save_upf
```

Pontos:

```text
Output of save_upf is a UPF file referred to as UPF prime or UPF'
```

Subitem:

```text
In UPF-prime mode, save_upf command writes out the complete power intent infrastructure
of the design, as a UPF command script
```

Segundo ponto:

```text
UPF' consists of commands previously loaded with load_upf
```

Subitens:

```text
Plus UPF commands entered at the tool prompt during the session
Plus UPF power intent changes derived by the tool during implementation (compile_fusion)
```

Terceiro ponto:

```text
UPF' is the input UPF for backend optimization
```

Golden UPF mode:

```text
In golden UPF mode, no UPF' is written out
Use save_upf -supplemental to write a supplemental UPF which includes all the UPF
changes derived during implementation
Use golden UPF + Supplemental UPF as input for backend optimization
```

Fluxo visual:

```text
load_upf
commit_upf (optional)
create_mv_cells (optional)
check_mv_design (optional)
compile_fusion
check_mv_design & save_upf
```

Saídas:

```text
Design NDM
UPF'
SDC
Netlist
DEF/Tcl
```

### Interpretação

`save_upf` escreve a saída de power intent do fluxo.

No modo UPF′ tradicional, a saída é:

```text
UPF'
```

Esse arquivo contém:

1. o UPF carregado com `load_upf`;
2. comandos UPF digitados durante a sessão;
3. mudanças derivadas pela ferramenta durante `compile_fusion`.

Esse `UPF'` pode ser usado como input para backend optimization.

## Golden UPF mode

No fluxo golden UPF, a ferramenta não escreve um UPF′ completo.

Em vez disso, usa-se:

```tcl
save_upf -supplemental
```

para escrever um **supplemental UPF**, contendo as mudanças derivadas durante implementação.

O BE usa:

```text
Golden UPF + Supplemental UPF
```

### Ponto prático

Escolha do fluxo afeta como o UPF é entregue entre FE e BE:

| Fluxo | Saída |
|---|---|
| Traditional UPF′ | `UPF'` completo |
| Golden UPF | supplemental UPF |

---

# Aula didática desenvolvida

## 1. O Fusion Compiler não trata UPF como detalhe lateral

O UPF entra no fluxo desde cedo:

```text
Read RTL
load_upf
check_mv_design
compile_fusion
```

A ferramenta usa o power intent para decidir:

- onde inserir LS;
- onde inserir ISO;
- quais retention cells criar;
- como lidar com DFT paths;
- como validar supplies;
- como checar voltage areas;
- como salvar o UPF implementado.

## 2. Multivoltage cell insertion acontece cedo no compile

O slide de usage model diz que:

```text
initial_map does the multivoltage cell insertion
```

Isso é importante porque as células MV não são apenas “enfeites de saída”. Elas influenciam lógica, timing, placement, CTS e route.

Além disso:

```text
DFT paths podem exigir novas MV cells em initial_place.
```

## 3. Bibliotecas são tão importantes quanto o UPF

O UPF pode estar perfeito conceitualmente, mas a implementação depende de células e modelagem de biblioteca.

A biblioteca precisa conter:

- células especiais;
- PG pins modelados;
- related power/ground pins;
- level shifter type;
- clamp/sense de ISO;
- operating conditions;
- Verilog models para simulação.

## 4. `report_mv_lib_cells` é ferramenta de sanidade da biblioteca

Antes de culpar o UPF, é preciso verificar se a biblioteca é reconhecida corretamente.

Exemplos:

```tcl
report_mv_lib_cells lib/ISO_lib_cell -isolation
report_mv_lib_cells lib/buffer_lib_cell -buffer
report_mv_lib_cells
```

Se a célula não aparece com atributos adequados, o FC pode não conseguir usá-la automaticamente.

## 5. `commit_upf` é um ponto de fechamento do power intent

`commit_upf` diz à ferramenta que o power intent está completo para o design. Ele faz checagens básicas e prepara o UPF para uso.

Mesmo sendo autoexecutado durante compile, chamá-lo explicitamente ajuda a detectar erros cedo.

## 6. `check_mv_design` deve ser usado antes e depois

Antes do compile:

```text
pega erros de setup e intenção
```

Depois do compile:

```text
verifica se a implementação resultante ainda está correta
```

Isso é especialmente importante porque cells MV são inseridas durante o compile.

## 7. `create_mv_cells` é útil para autoria e debug do UPF

`create_mv_cells` permite inserir cells MV de forma antecipada, com base nas strategies.

Isso ajuda a responder:

```text
meu UPF está gerando as células esperadas?
quantas ISOs aparecem?
quantos LS aparecem?
retention foi inferida?
```

Antes de rodar o compile completo, pode ser uma forma rápida de validar o power intent.

## 8. `save_upf` registra o que a ferramenta derivou

Durante `compile_fusion`, o FC pode derivar mudanças de power intent. `save_upf` escreve essas mudanças.

No fluxo tradicional, ele escreve `UPF'`.

No fluxo golden, ele escreve supplemental UPF, preservando o golden UPF como fonte original.

---

# Conceitos difíceis explicados em profundidade

## UPF mode

Modo em que o Fusion Compiler entende e processa power intent UPF. O slide diz que o FC é invocado em UPF mode por default.

## UPF′

UPF prime. Arquivo UPF derivado/escrito pela ferramenta após carregar UPF original, aplicar comandos da sessão e incorporar mudanças geradas durante implementação.

## Supplemental UPF

Arquivo adicional usado no fluxo golden UPF para registrar mudanças derivadas pela implementação, sem substituir o golden UPF.

## Golden UPF

UPF de referência, mantido como fonte principal de power intent.

## Multivoltage libraries

Bibliotecas caracterizadas em diferentes tensões e com células especiais para low-power/multivoltage.

## PG pins

Pinos de power/ground das células, modelados na biblioteca para que as ferramentas entendam conectividade e comportamento multivoltage.

## `report_mv_lib_cells`

Comando que reporta atributos de células multivoltage, PG pins e informações de power management.

## `load_upf`

Comando que lê um arquivo UPF.

## `commit_upf`

Comando que finaliza/commita o power intent carregado e executa checagens básicas.

## `check_mv_design`

Checker estático multivoltage para design, constraints, isolation requirements e connection rules.

## `compile_fusion`

Comando principal de compile/implementation do Fusion Compiler.

## `create_mv_cells`

Comando opcional para inserir células multivoltage com base no UPF, útil para autoria e checagem antecipada.

## `save_upf`

Comando que escreve a saída UPF/UPF′ ou supplemental UPF.

---

# Comandos importantes do módulo

## Invocar Fusion Compiler

```tcl
fc_shell
```

## Sequência principal em UPF mode

```tcl
load_upf
commit_upf
check_mv_design
compile_fusion
check_mv_design
save_upf
```

## Ler UPF

```tcl
load_upf [upf_file_name]
```

Opções mostradas:

```tcl
load_upf \
    [-supplemental <upf_file_name>] \
    [-scope string] \
    [-noecho] \
    [-simulation_only] \
    [-strict_check string] \
    [upf_file_name]
```

## Committar UPF

```tcl
commit_upf
```

## Checar design multivoltage

```tcl
check_mv_design
```

Opções/categorias mostradas no slide:

```tcl
check_mv_design \
    [-erc_mode] \
    [-voltage_threshold threshold] \
    [-power_domain] \
    [-supply] \
    [-isolation] \
    [-level_shifters] \
    [-retention] \
    [-power_switch] \
    [-repeater] \
    [-terminal_boundary] \
    [-srsn] \
    [-diode] \
    [-model] \
    [-tieoff] \
    [-pg_pin] \
    [-analog] \
    [-physical_block_pin] \
    [-signal_pin] \
    [-pg_netlist] \
    [-all] \
    [-interface_only]
```

## Rodar compile

```tcl
compile_fusion
```

Exemplos de etapas citadas no fluxo:

```tcl
compile_fusion -to logic_opt
compile_fusion -to final_opt
```

## Inserir células multivoltage antecipadamente

```tcl
create_mv_cells
```

Com mapeamento para biblioteca:

```tcl
create_mv_cells -mapped
```

## Salvar UPF

```tcl
save_upf
```

No fluxo golden:

```tcl
save_upf -supplemental
```

## Reportar células multivoltage na biblioteca

```tcl
report_mv_lib_cells
```

Exemplos:

```tcl
report_mv_lib_cells lib/buffer_lib_cell -buffer
report_mv_lib_cells lib/ISO_lib_cell -isolation
report_mv_lib_cells -isolation mv_lib/ISO_CELL
```

---

# Tabelas de revisão

## Sequência recomendada de comandos

| Etapa | Comando | Objetivo |
|---|---|---|
| Ler UPF | `load_upf` | Carregar power intent |
| Finalizar UPF | `commit_upf` | Validar e commitar intenção |
| Checar MV | `check_mv_design` | Encontrar violações antes do compile |
| Compilar | `compile_fusion` | Implementar design com UPF |
| Checar novamente | `check_mv_design` | Validar implementação resultante |
| Exportar UPF | `save_upf` | Gerar UPF′ ou supplemental UPF |

---

## Traditional UPF′ vs Golden UPF

| Fluxo | Entrada FE | Saída FE | Entrada BE |
|---|---|---|---|
| Traditional UPF′ | RTL + UPF | Gate + UPF′ | Gate + UPF′ |
| Golden UPF | RTL + Golden UPF | Gate + Supplemental UPF | Gate + Golden UPF + Supplemental UPF |

---

## Inputs principais

| Input | Função |
|---|---|
| RTL | Lógica funcional |
| Multivoltage libraries | Células normais e especiais, caracterizadas e modeladas |
| UPF power intent | Domínios, supplies, states, strategies |

---

## Células especiais

| Célula | Função |
|---|---|
| Level shifter | Conversão entre tensões |
| Isolation cell | Proteção contra domínio OFF |
| Enable level shifter | Combina enable/isolation com LS |
| Retention cell | Preserva estado |
| Always-on cell | Opera em supply que permanece ligada relativa ao domínio desligado |

---

## Checagens de biblioteca

| Item | Por que checar |
|---|---|
| PG pins | Necessários para conectividade power/ground |
| Related power/ground pins | Necessários para source/sink e MV analysis |
| Isolation attributes | Clamp/sense/tipo precisam estar corretos |
| Level shifter type | LH/HL e ranges precisam estar corretos |
| Operating conditions | Necessárias para corners e tensões |
| Verilog models | Necessários para simulação |

---

## `commit_upf` checa

| Checagem | Objetivo |
|---|---|
| UPF object reference | Referências válidas |
| Primary power/ground | Supplies principais definidas |
| Strategy association | PM cells instanciadas associadas a strategies |
| Power Domain ↔ Voltage Area | Correspondência entre domínio e VA |
| DEF vs UPF PG conflict | Resolver conflito se DEF foi carregado antes |

---

## `check_mv_design` categorias

| Categoria | O que verifica |
|---|---|
| `-power_domain` | Regras de power domains |
| `-supply` | Supply nets/sets e support ports |
| `-isolation` | Regras de isolation |
| `-level_shifters` | Regras de LS |
| `-retention` | Regras de retention |
| `-power_switch` | Regras de switch |
| `-repeater` | Regras de repeater |
| `-pg_pin` | Modelagem/conectividade PG |
| `-terminal_boundary` | Boundaries |
| `-all` | Todas as regras |

---

# Fluxo mental para usar Fusion Compiler com UPF

```text
1. Preparar RTL.
2. Preparar SDC/MCMM/constraints.
3. Garantir bibliotecas multivoltage corretas.
4. Conferir cells especiais e PG pin modelling.
5. Invocar fc_shell.
6. Ler RTL.
7. Carregar UPF com load_upf.
8. Rodar commit_upf para fechar power intent.
9. Rodar check_mv_design para pegar erros cedo.
10. Rodar compile_fusion.
11. Revisar warnings MV-xxx e UPF-xxx.
12. Rodar check_mv_design novamente.
13. Salvar UPF com save_upf.
14. Entregar UPF′ ou Golden UPF + Supplemental UPF ao backend.
```

---

# Figuras e diagramas importantes

## Página 1 — Fusion Design Platform e RTL-to-GDSII

O slide superior posiciona o Fusion Compiler na plataforma Synopsys Fusion Design Platform. O slide inferior mostra os pilares: single data model, common engines e golden signoff backbone.

## Página 2 — Diferença do Fusion Compiler e Usage Model With UPF

O slide superior mostra a unificação de otimizações de front-end/back-end. O slide inferior mostra que `initial_map` insere células multivoltage e que `initial_place` adiciona novas MV cells para caminhos DFT.

## Página 3 — UPF Implementation Flow e Logic Synthesis in UPF Mode

O slide superior mostra o fluxo FE/BE com `load_upf`, `check_mv_design`, `compile_fusion`, `commit_upf` e `connect_pg_net`. O slide inferior lista os comandos principais.

## Página 4 — UPF transfer e inputs

O slide superior compara fluxo tradicional UPF′ e golden UPF. O slide inferior lista os inputs: RTL, multivoltage libraries e UPF power intent.

## Página 5 — Library setup e report_mv_lib_cells

O slide superior mostra que implementação MV exige bibliotecas em diferentes tensões. O inferior mostra `report_mv_lib_cells` para checar atributos PG e informações MV.

## Página 6 — Report de ISO e special cells

O slide superior mostra seções de relatório de uma isolation cell: attributes, operating conditions, signal/PG pins. O inferior lista as power management cells necessárias.

## Página 7 — Enable Level Shifter e UPF input

O slide superior mostra uma modelagem Liberty de ELS com `VDD1`, `VDD2`, `VSS`, related pins e signal levels. O inferior destaca UPF power intent como input do FC.

## Página 8 — load_upf e commit_upf

O slide superior detalha opções de `load_upf`. O inferior mostra `commit_upf` e suas checagens básicas.

## Página 9 — check_mv_design e compile_fusion

O slide superior mostra o checker estático multivoltage. O inferior mostra boas práticas antes e depois de `compile_fusion`.

## Página 10 — create_mv_cells e save_upf

O slide superior mostra `create_mv_cells` e logs de inserção de retention/ISO/ELS/LS. O inferior mostra `save_upf`, UPF′ e supplemental UPF no fluxo golden.

---

# Pontos de prova e revisão

1. Fusion Compiler faz parte da Synopsys Fusion Design Platform.
2. Fusion Architecture combina synthesis, place and route e signoff.
3. Fusion Compiler é apresentado como solução RTL-to-GDSII.
4. O FC usa single data model and shell.
5. O FC usa common engines interleaved para melhor PPA.
6. O FC tem golden signoff backbone.
7. A proposta é melhor PPA, fluxo mais previsível e menor time-to-results.
8. O FC unifica tecnologias de front-end e back-end.
9. O common data model permite movimento mais contínuo de tecnologias.
10. Engines de signoff analysis fazem parte do diferencial.
11. Fusion Compiler é invocado em UPF mode por default.
12. `load_upf` carrega o UPF do design lido.
13. `initial_map` faz inserção de multivoltage cells.
14. Novas MV cells para caminhos DFT são adicionadas em `initial_place`.
15. O fluxo principal inclui `load_upf`, `commit_upf`, `check_mv_design`, `compile_fusion`, `save_upf`.
16. No FE, o fluxo lê RTL, UPF, SDC e constraints físicas.
17. No BE, o fluxo inclui `commit_upf`, `connect_pg_net` e `check_mv_design`.
18. Fluxos UPF′ e golden UPF são ambos suportados.
19. No fluxo tradicional, o UPF é transformado em UPF′ e depois UPF″.
20. No fluxo golden, o Golden UPF é preservado e mudanças vão para supplemental UPF.
21. Inputs principais são RTL, multivoltage libraries e UPF power intent.
22. Multivoltage implementation exige bibliotecas caracterizadas em diferentes tensões.
23. Libraries são key enabler para implementação multivoltage completa.
24. Libraries precisam de special cells como LS e ISO.
25. Libraries precisam de modelagem extra de PG pins.
26. `report_mv_lib_cells` mostra PG pins, atributos PM e informações MV.
27. `report_mv_lib_cells -isolation` pode checar isolation cells.
28. O relatório pode mostrar lib cell attributes, operating conditions e signal/PG pins.
29. Special cell libraries são necessárias.
30. Low-power designs exigem cells com múltiplos power pins.
31. Informações de modelagem em `.lib` permitem handling automático dessas cells.
32. Modelos Verilog são necessários para simulação das special cells.
33. Special cells incluem level shifters, isolation cells, enable level shifters, retention cells e always-on cells.
34. ELS pode ter `LEVEL_SHIFTER_TYPE: LH`.
35. ELS pode ter PG pins `VDD1`, `VDD2` e `VSS`.
36. Pinos de sinal precisam de `RELATED_POWER_PIN` e `RELATED_GROUND_PIN`.
37. `INPUT_SIGNAL_LEVEL` e `OUTPUT_SIGNAL_LEVEL` ajudam a definir níveis de sinal.
38. `POWER_DOWN_FUNCTION` modela comportamento em power-down.
39. `load_upf` lê script Synopsys UPF Constraints.
40. `load_upf -supplemental` lê supplemental UPF.
41. `load_upf -scope` lê UPF em um escopo.
42. `commit_upf` indica que o power intent está completo e finalizado.
43. `commit_upf` é autoexecutado durante compile.
44. `commit_upf` checa referências UPF.
45. `commit_upf` checa primary power/ground.
46. `commit_upf` checa association de strategies para PM cells instanciadas.
47. `commit_upf` checa correspondência power domain-voltage area.
48. `commit_upf` pode resolver conflito PG entre DEF e UPF.
49. `check_mv_design` checa design, constraints MV, isolation electrical requirements e connection rules.
50. `check_mv_design` emite errors e warnings.
51. Sem opções, `check_mv_design` reporta resumo de violações.
52. Opções de checker ajustam nível de detalhe.
53. Antes de `compile_fusion`, RTL deve estar lido e elaborado.
54. Antes de `compile_fusion`, UPF deve estar lido com `load_upf`.
55. Depois de `load_upf`, revisar erros MV-xxx e UPF-xxx.
56. Antes de compile, `check_mv_design` pode ser rodado opcionalmente.
57. Depois de `compile_fusion`, revisar warnings/errors MV-xxx e UPF-xxx.
58. Depois de compile, rodar `check_mv_design` para validar implementação.
59. `create_mv_cells` insere LS, ISO e retention cells unmapped.
60. `create_mv_cells` é baseado nas UPF strategies.
61. `create_mv_cells` ajuda na autoria e checagem inicial do UPF.
62. `create_mv_cells -mapped` insere PM cells mapeadas para technology libraries.
63. PM cells também são inseridas durante compile.
64. `save_upf` gera UPF′ no modo UPF-prime.
65. UPF′ inclui comandos carregados com `load_upf`.
66. UPF′ inclui comandos digitados no prompt.
67. UPF′ inclui mudanças derivadas durante `compile_fusion`.
68. UPF′ é input para backend optimization.
69. No golden UPF mode, nenhum UPF′ completo é escrito.
70. `save_upf -supplemental` escreve supplemental UPF.
71. Golden UPF + Supplemental UPF são usados como input para backend optimization.
72. A sequência prática é: `load_upf → commit_upf → check_mv_design → compile_fusion → check_mv_design → save_upf`.

---

# Relação com os módulos anteriores

Este módulo amarra tudo:

## Power Domains

São carregados e validados pelo UPF no FC.

## Power Strategies

Geram células multivoltage durante `initial_map`, `initial_place`, `create_mv_cells` ou `compile_fusion`.

## Supply Network

Precisa estar correta para `commit_upf`, `check_mv_design`, `connect_pg_net` e implementation.

## Power States

Ajudam a determinar quando LS/ISO/RET são necessários e como a ferramenta entende ON/OFF/tensões.

## Libraries

Dão suporte real para que o power intent seja implementável.

---

# Checklist prático para rodar FC com UPF

```text
1. Confirmar que o roteiro/anexo do módulo foi processado completo.
2. Garantir RTL lido e elaborado.
3. Garantir libs NDM/multivoltage corretas.
4. Rodar report_mv_lib_cells em cells críticas.
5. Verificar PG pins e PM attributes.
6. Carregar UPF com load_upf.
7. Usar -scope quando o UPF for de bloco/IP.
8. Usar -supplemental no fluxo golden quando necessário.
9. Rodar commit_upf.
10. Ler mensagens de commit_upf.
11. Rodar check_mv_design antes do compile.
12. Corrigir erros MV-xxx/UPF-xxx.
13. Rodar compile_fusion.
14. Revisar warnings/errors.
15. Rodar check_mv_design novamente.
16. Usar create_mv_cells se quiser validar strategies cedo.
17. Usar save_upf.
18. Entregar UPF′ ou Golden UPF + Supplemental UPF conforme fluxo.
```

---

# Checklist de qualidade

- [x] Bloco 087 processado conforme roteiro, slides 1-20.
- [x] O módulo foi processado inteiro, pois o roteiro indica 20 slides.
- [x] Fusion Design Platform e Fusion Compiler RTL-to-GDSII foram explicados.
- [x] Modelo de uso do FC com UPF foi detalhado.
- [x] UPF Implementation Flow FE/BE foi interpretado.
- [x] Fluxos UPF′ e Golden UPF foram comparados.
- [x] Multivoltage library setup foi explicado.
- [x] `report_mv_lib_cells` e PG pin modelling foram detalhados.
- [x] Células especiais PM foram listadas e explicadas.
- [x] `load_upf`, `commit_upf`, `check_mv_design`, `compile_fusion`, `create_mv_cells` e `save_upf` foram explicados.
- [x] Figuras dos slides 1-20 foram interpretadas.
- [x] Pontos de prova foram listados.
- [x] Próximo bloco indicado conforme roteiro.

---

## Próximo bloco

- **Bloco:** 088
- **Curso:** 11 Fusion Compiler UPF Fundamentals
- **Aula:** 07 Module 07 — Fusion Compiler Reporting
- **Arquivo para anexar:**

```text
C:\Users\maiko\ci_expert\Aulas2Prints\11 Fusion Compiler UPF Fundamentals\07 Module 07 - Fusion Compiler Reporting.docx
```

- **Processar:** slides 1-26
- **Salvar em:**

```text
C:\Users\maiko\ci_expert\mdCursoPt2\11 Fusion Compiler UPF Fundamentals\07 Module 07 - Fusion Compiler Reporting.md
```

- **Depois:** Bloco 089 — início do curso `12 Design Compiler NXT - Low Power`.
