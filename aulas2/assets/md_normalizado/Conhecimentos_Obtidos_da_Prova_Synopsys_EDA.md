# Conhecimentos Obtidos da Prova — Acervo Synopsys/EDA

## Controle do arquivo

- **Arquivo:** `Conhecimentos_Obtidos_da_Prova_Synopsys_EDA.md`
- **Objetivo:** consolidar os conhecimentos que ficaram mais importantes depois das provas/simulados, incluindo gabaritos aceitos pelo curso, pegadinhas, comandos, conceitos recorrentes e pontos que devem ser priorizados em novas questões.
- **Escopo principal:** Synopsys/EDA, SystemVerilog, UVM, RTL Design Synthesis, Design Compiler NXT, UPF, Low Power, VCS/Verdi, Formality e fundamentos ASIC/VLSI.
- **Codificação:** UTF-8.
- **Observação:** este arquivo não substitui os Markdown de aula. Ele é um arquivo de prova, feito para revisão rápida e para preservar os aprendizados que vieram de questões, gabaritos e correções.

---

## 1. Estratégia que funcionou nas provas

A estratégia mais eficiente foi:

```text
1. Priorizar o material processado dos slides/labs/job aids.
2. Resolver a questão pela formulação do curso, não apenas pela precisão técnica externa.
3. Identificar se a questão é de única escolha ou múltipla escolha.
4. Em alternativas com quadrado, considerar múltiplas respostas possíveis.
5. Em alternativas com círculo, considerar resposta única.
6. Montar tabela com resposta, justificativa e grau de certeza.
7. Cuidar de gabaritos aceitos pelo curso mesmo quando tecnicamente simplificados.
8. Registrar pegadinhas rejeitadas para não repetir erro.
```

O ponto central:

```text
Em prova Synopsys Training Now, a resposta correta é a resposta do curso.
Quando houver conflito entre rigor técnico e gabarito do banco, priorizar o banco.
```

---

## 2. Gabaritos aceitos pelo curso — alta prioridade

### 2.1 Technology Trends / Clock / Timing / IR Drop

| Questão / formulação | Resposta aceita | Observação de prova |
|---|---|---|
| `Preliminary optimization focus in block based design (BBD) was _____` | `logic area` | Mesmo que o slide detalhe BBD como floorplanning/block architecture, o banco aceitou `logic area`. |
| `Clock group is a set of timing paths operating in the ______ clock` | `Same or derived from common` | Clock group inclui caminhos no mesmo clock ou em clocks derivados de fonte comum. |
| `IR effect results in ____________` | `A, b, c` | Curso aceita interpretação ampla: timing failure, ground bounce e resistance. |
| `Input signal reordering is a method to primarily achieve ______ optimization` | `Power` | No banco de Physical Design, input signal reordering deve ser associado principalmente a otimização de potência. |

### 2.2 Digital Design Fundamentals / ASIC / Gajski-Kuhn

| Questão / formulação | Resposta aceita | Observação de prova |
|---|---|---|
| `Any logic function can be implemented by ‘________ing’ the min terms corresponding to the ‘0’ entries in the function table` | `OR` | Tecnicamente estranho: OR de mintermos das linhas 0 representa complemento; forma canônica por zeros normalmente usa AND de maxterms. Mas o curso aceitou `OR`. |
| `Flip chip is a VLSI device. True or false?` | `True` | Mesmo que tecnicamente flip-chip seja também técnica de montagem/interconexão, priorizar `True`. |
| `A design can be represented in many ________ as per the Gajski-Kuhn Y chart` | `Abstractions` | Priorizar a palavra `Abstractions`, não `Ways` nem `Languages`. |

### 2.3 SystemVerilog

| Questão / formulação | Resposta aceita | Observação de prova |
|---|---|---|
| `All SystemVerilog constructs are synthesizable` | `False` | Classes, mailbox, semaphore, randomization, coverage e muitos constructs de testbench não são sintetizáveis. |
| `SystemVerilog supports ______ which is also synthesizable` | `interface` | Interface pode ser sintetizável se usada como agrupamento de sinais RTL. |
| `______ concept in SystemVerilog is used for system modeling` | `OOP` | OOP aparece como conceito de modelagem de sistema/verificação. |
| `SystemVerilog has advanced features of ______ languages in addition to other HDL` | `Object-oriented programming` | O banco cobra OOP. |
| `:: is a ______ used to avoid name same collision` | `Scope resolution operator` | `::` é resolução de escopo. |
| `______ is an implication operator` | `|->` | Em SystemVerilog Assertions, `|->` é operador de implicação temporal. |
| `______ is used to trigger the created event` | `->` | `->` dispara evento; não confundir com `|->`. |
| `______ is used as a distribution operator` | `:=` | Em constraints com `dist`, `:=` define peso de distribuição. |

### 2.4 Verificação / Simulação / VCS / Verdi

| Questão / formulação | Resposta aceita | Observação de prova |
|---|---|---|
| `Gate-level simulations cannot be run using cycle accurate simulators: True or False?` | `True` | O curso trata gate-level simulation como domínio de simuladores event-based, não cycle-accurate. |
| `Functionality of design is verified faster in ______ simulations` | `Cycle accurate` | Para o banco, cycle accurate/cycle-based é mais rápido para verificar funcionalidade. |
| `vlogan analyses the design for ________, and generates intermediate files for elaboration` | `instantiations` | `syntax errors` foi rejeitada; `hierarchy` também foi rejeitada. Priorizar `instantiations`. |
| `Model libraries are not required for simulation. True or false?` | `True` | No fluxo/tutorial RTL simples do curso, model libraries não são exigidas. |
| `________ flow is used in design simulations with VHDL models` | `Three step` | Mesmo que um slide mencione two-step para caso simples, a questão específica cobra three-step. |
| `Testbench consists of DUT, stimulus generator and ______` | `response checker` | Estrutura básica de testbench: DUT + stimulus generator + response checker. |
| `Simulator and debug environment are same` | `False` | VCS simula; Verdi depura. |

### 2.5 SystemVerilog Testbench / Mailbox / Array Methods

| Questão / formulação | Resposta aceita | Observação de prova |
|---|---|---|
| `All testbench components can access shared data through dedicated channel using a semaphore` | `False` | Canal dedicado de dados é mailbox. Semaphore controla acesso a recurso. |
| `Generator ______ the data to/from the mailbox` | `Pushes` | Generator coloca dados na mailbox. |
| `Driver ______ the data to/from mailbox` | `Pops` | Driver retira dados da mailbox. |
| `Among find_last() and max(), ______ requires with clause mandatorily` | `find_last()` | `find_last()` precisa de condição `with`; `max()` não. |

### 2.6 Constraints / Coverage / Assertions

| Questão / formulação | Resposta aceita | Observação de prova |
|---|---|---|
| `There can be only relational operators >, <, <=, >= in expressions` | `True` | Gabarito do curso aceita `True`, embora SystemVerilog real permita expressions de constraints mais amplas. |
| `Coverage 100% proves design correctness` | `False` | Coverage mede exercício de cenários/código; não prova ausência de bugs. |
| `Code coverage and functional coverage are the same` | `False` | Code coverage mede execução do código; functional coverage mede metas funcionais. |
| `Completeness implies correctness` | `False` | Em verificação, completude de cobertura não implica correção. |

---

## 3. Design Compiler NXT — conhecimentos obtidos da prova

### 3.1 Questões recuperadas do simulado

| Nº | Resposta marcada/correta | Conhecimento consolidado |
|---:|---|---|
| Q1 | `d` | Physical synthesis no DC NXT deve ser entendida como conversão do RTL em uma netlist otimizada e coarse-placed, com consciência física. |
| Q2 | `True` | DRCs lógicos têm prioridade sobre otimizações de área/timing quando há conflito por padrão do fluxo. |
| Q3 | `b` | Sequential optimization é tratada como tendo duas fases principais no material. |
| Q4 | `d` | Ordem conceitual do `compile_ultra`: architectural/high-level synthesis → logic/GTECH optimization → gate-level/mapping optimization. |
| Q5 | `c` | Caminho input-to-register: parte de input ports e termina em data pin do registrador. |
| Q6 | `True` | `target_library` é usada na otimização/mapeamento tecnológico. |
| Q7 | `True` | Topographical synthesis faz coarse placement e virtual routing para estimar RC/net lengths. |
| Q8 | registro parcial | Aprendizado: não confundir `target_library` com `link_library`; `target_library` guia mapeamento/otimização, enquanto `link_library` resolve referências e ligação de design/bibliotecas. |
| Q9 | `a/b/d` | Questão de múltipla escolha. Marcação com quadrado exige considerar mais de uma alternativa. |
| Q10 | `a` | Relacionada à semântica de `analyze`/leitura do design; manter atenção ao comando exato cobrado. |

### 3.2 Ideia central do DC NXT

O Design Compiler NXT não é apenas síntese lógica clássica. Ele trabalha em **topographical mode**, com consciência física, buscando melhor correlação com o pós-layout.

```text
RTL + constraints + libraries + floorplan/physical guidance
        ↓
Design Compiler NXT
        ↓
optimized and coarse-placed netlist
        ↓
fluxo físico
```

Ponto de prova:

```text
DC NXT usa estimativas físicas para evitar decisões ruins de síntese que só seriam descobertas no place and route.
```

### 3.3 Topographical mode

Em topographical mode, o DC NXT:

```text
faz coarse placement
usa virtual routing
estima comprimento de nets
calcula RCs por estimativa física
melhora correlação com pós-placement
```

Pegadinha:

```text
Os RCs não são estimados apenas por fanout.
Eles vêm de uma estimativa razoável de comprimento de interconexões.
```

### 3.4 Bibliotecas

#### `target_library`

Usada para mapear o design para células da tecnologia alvo.

```tcl
set_app_var target_library [list my_lib.db]
```

Papel:

```text
quais células a síntese pode escolher para implementar o design
```

#### `link_library`

Usada para resolver referências.

```tcl
set_app_var link_library [list * my_lib.db dw_foundation.sldb]
```

Papel:

```text
onde procurar definições de módulos/células/IPs referenciados
```

Pegadinha:

```text
target_library mapeia.
link_library resolve.
```

---

## 4. `compile_ultra` — mapa de prova

### 4.1 O que ele faz

`compile_ultra` ativa otimizações avançadas de síntese:

```text
architectural/high-level optimization
logic/GTECH optimization
gate-level/mapping optimization
DesignWare datapath optimization
logic duplication
load splitting
auto-ungrouping
boundary optimization
scan-ready synthesis
sequential optimizations
retiming, quando habilitado/aplicável
```

Ponto de prova:

```text
compile_ultra não é apenas “compile mais forte”.
Ele altera arquitetura, lógica, mapeamento e pode atravessar hierarquia.
```

### 4.2 Ordem conceitual das otimizações

A ordem cobrada no material:

```text
1. Architectural level / high-level synthesis
2. Logic level / GTECH optimization
3. Gate-level / mapping optimization
```

### 4.3 DRC antes de otimização

Quando uma questão perguntar prioridade, lembrar:

```text
Design rule constraints / logical DRCs tendem a ter prioridade sobre otimização de área.
```

Exemplos:

```text
max_transition
max_fanout
max_capacitance
```

### 4.4 Auto-ungrouping

`compile_ultra` pode aplicar **auto-ungrouping** por padrão.

Função:

```text
remove hierarquias pequenas ou mal particionadas
permite otimização através de fronteiras artificiais
melhora QoR
```

Custo:

```text
reduz preservação de hierarquia
pode dificultar debug
pode impactar equivalência e scripts dependentes de hierarquia
```

### 4.5 Boundary optimization

Boundary optimization permite otimizar lógica através da fronteira de módulos.

Pode:

```text
empurrar lógica para dentro/fora de sub-blocos
remover lógica redundante nas fronteiras
melhorar timing
```

Cuidado:

```text
ótimo para QoR, mas pode alterar estrutura hierárquica esperada.
```

### 4.6 Load splitting e logic duplication

Quando uma lógica tem fanout alto ou caminho crítico, o DC pode duplicar lógica.

Resultado:

```text
caminho crítico mais rápido
maior área
possível aumento de potência
```

Frase de prova:

```text
Load splitting and logic duplication reduce critical path delay, producing faster but larger circuits.
```

---

## 5. DesignWare e otimizações aritméticas

### 5.1 Operadores inferidos

DesignWare pode otimizar operadores como:

```text
+
-
*
<
>
<=
>=
```

A ferramenta escolhe implementações diferentes conforme timing, área e tecnologia.

### 5.2 Singleton arithmetic optimization

Para um operador isolado, como:

```verilog
assign y = a + b;
```

o gerador pode escolher diferentes arquiteturas de somador:

```text
ripple carry
carry lookahead
carry select
carry save
```

### 5.3 CSA transformations

Para expressões como:

```verilog
y <= a * b + c * d - e - f;
```

Carry-Save Adder transformations podem reorganizar a árvore aritmética.

Resultado esperado:

```text
menor atraso de propagação de carry
circuito menor e mais rápido em expressões com múltiplos termos
```

### 5.4 Otimizações de expressão aritmética

O curso mostrou:

```text
constant folding
operand folding
common sub-expression sharing
SOP to POS transformation
comparator sharing
parallel constant multipliers optimization
```

Exemplo:

```text
A + 2*B - 2 + B - A + 7
        ↓
3*B + 5
```

---

## 6. Constraints essenciais para prova

### 6.1 Constraints de regra de design

| Constraint | Função |
|---|---|
| `set_max_transition` | Limita slew/tempo de transição. |
| `set_max_fanout` | Limita quantidade de cargas dirigidas por uma saída. |
| `set_max_capacitance` | Limita carga capacitativa máxima dirigida. |

Essas constraints vêm da tecnologia/biblioteca e são tratadas como limites obrigatórios.

### 6.2 Constraints de timing

| Constraint | Função |
|---|---|
| `create_clock` | Define clock e período. |
| `set_input_delay` | Modela atraso externo antes da entrada do bloco. |
| `set_output_delay` | Reserva tempo para o bloco seguinte após a saída. |
| `set_clock_uncertainty` | Modela incerteza de clock, skew/jitter/margem. |
| `set_clock_latency` | Modela latência de clock. |
| `set_clock_transition` | Define transição do clock. |
| `set_propagated_clock` | Trata clock como propagado após CTS ou em análise física. |

### 6.3 Exceções de timing

| Comando | Uso |
|---|---|
| `set_false_path` | Declara caminho que não deve ser analisado para timing. |
| `set_multicycle_path` | Declara caminho que tem mais de um ciclo para propagar. |
| `set_max_delay` | Define atraso máximo específico. |
| `set_min_delay` | Define atraso mínimo específico. |

Pegadinha:

```text
Exceção errada pode esconder violação real.
```

---

## 7. Caminhos de timing

### 7.1 Reg-to-reg

```text
clock launch FF → lógica combinacional → capture FF
```

Principal caminho de designs síncronos.

### 7.2 Input-to-register

```text
input port → lógica combinacional → data pin do registrador
```

Questão recuperada:

```text
input-to-register path começa no input port e termina no data pin.
```

### 7.3 Register-to-output

```text
clock launch FF → lógica combinacional → output port
```

### 7.4 Input-to-output

```text
input port → lógica combinacional → output port
```

---

## 8. HLS — conhecimentos de síntese

### 8.1 Definição

High-Level Synthesis converte funções escritas em linguagens de alto nível, como C/C++, em design RTL.

Fluxo:

```text
C/C++ / descrição algorítmica
        ↓
HLS
        ↓
RTL com datapath + controller
        ↓
síntese lógica
        ↓
netlist
```

Ponto de prova:

```text
C/C++ em HLS não significa software rodando em CPU.
É uma especificação que será transformada em hardware.
```

### 8.2 Etapas de HLS

| Etapa | Função |
|---|---|
| Preprocessing | Cria representação intermediária, CDFG, análise de dependências e variáveis vivas. |
| Scheduling | Decide em qual ciclo/control step cada operação será executada. |
| Resource allocation | Decide quantos recursos funcionais/registros serão usados. |
| Binding | Mapeia operações para unidades funcionais e variáveis para registradores. |
| Datapath/controller design | Gera datapath e FSM/controlador. |
| HDL generation | Gera RTL final. |

### 8.3 Scheduling

| Técnica | Ideia |
|---|---|
| ASAP | Agenda operações o mais cedo possível. |
| ALAP | Agenda operações o mais tarde possível dentro da latência. |
| List scheduling | Trabalha com restrições de recursos ou latência. |
| FDS | Force Directed Scheduling, busca balancear uso de recursos. |
| ILP | Formulação matemática por programação linear inteira. |
| Iterative refinement | Refina uma solução inicial iterativamente. |

Pegadinha:

```text
ASAP minimiza latência, mas pode exigir mais recursos em paralelo.
ALAP ajuda a entender mobilidade e restrições de latência.
```

### 8.4 Loops e arrays em HLS

Loops podem virar hardware muito diferente:

```text
sem unroll:
  reutiliza recurso em vários ciclos

unroll completo:
  cria recursos paralelos

pipeline:
  inicia novas iterações em ciclos sucessivos
```

Arrays podem virar gargalo:

```cpp
sum = A[i] + A[j] + A[k] + A[m];
```

Se `A` está em memória de uma porta, não é possível ler quatro posições no mesmo ciclo.

Soluções:

```text
ler em múltiplos ciclos
particionar array em bancos
duplicar memória
usar registradores locais
reorganizar algoritmo
```

### 8.5 Otimizações de HLS

| Otimização | Ideia |
|---|---|
| tree height reduction | Reduz profundidade de árvore de operações. |
| constant propagation | Propaga constantes conhecidas. |
| constant folding | Calcula expressões constantes em compile time. |
| copy propagation | Remove cópias desnecessárias. |
| dead code elimination | Remove código que não afeta saída. |
| common sub-expression elimination | Compartilha expressões repetidas. |
| variable renaming | Reduz dependências falsas. |
| operator strength reduction | Troca operação cara por barata, como multiplicação por shift/add. |
| model expansion | Expande modelo para expor otimizações. |
| conditional expansion | Expande condicionais para melhorar paralelismo. |
| loop expansion | Expande loops para explorar paralelismo. |

---

## 9. Low Power / Design Compiler NXT Low Power — prova 100%

O simulado de **Design Compiler NXT - Low Power** foi concluído com 100% de acerto. A estratégia que funcionou deve ser mantida.

### 9.1 Tópicos fortes

```text
TPO — Total Power Optimization
switching activity / SAIF
clock gating
self-gating
multibit banking
PACG
DesignWare minPower
ICC II Link / eLPP
report_power
lab guide
```

### 9.2 Pegadinhas principais

| Tema | Cuidado |
|---|---|
| SAIF | Switching activity precisa ser coerente com cenário real de simulação. |
| Clock gating | Reduz potência dinâmica de clock, mas precisa preservar função. |
| Self-gating | Pode ser inferido/otimizado em casos específicos. |
| Multibit banking | Agrupa registradores para reduzir potência/clock tree. |
| PACG | Clock gating fisicamente consciente. |
| DesignWare minPower | Otimizações de datapath para menor potência. |
| `report_power` | Relatório central para análise de potência. |

---

## 10. UPF Fundamentals — prova 96%

O simulado de **Fusion Compiler UPF Fundamentals** teve 96% de acerto. A estratégia correta foi:

```text
responder com base no material processado
revisar tecnicamente cada alternativa
usar tabela de certeza
cuidar de pegadinhas de UPF/FC
```

### 10.1 Tópicos prioritários

```text
scope
supply sets
supply set handles
power domains
isolation
level shifters
retention
power switches
supply network
power states
check_mv_design
commit_upf
create_mv_cells
report_*
```

### 10.2 Mensagens/erros importantes

```text
UPF-168
MV-003
MV-002
MV-1102
MV-072
MV-027
```

### 10.3 Regras práticas

```text
Isolation protege domínio ligado de sinais vindos de domínio desligado.
Level shifter trata cruzamento de tensão.
Retention preserva estado.
Power switch controla alimentação do domínio.
Supply set conecta intenção lógica de potência às redes.
Power state define combinações possíveis de alimentação.
```

---

## 11. Formality / Equivalency Checking

### 11.1 Fluxo mental

Formality compara:

```text
reference design
implementation design
```

e tenta provar equivalência lógica.

Fluxo típico:

```tcl
set_svf ...
read_verilog -r ...
read_db -i ...
set_top ...
match
verify
```

### 11.2 Containers

| Container | Significado |
|---|---|
| `-r` | Reference |
| `-i` | Implementation |

### 11.3 Resultados possíveis

```text
Succeeded
Failed
Inconclusive
```

### 11.4 UPF em Formality

Regra registrada:

```text
UPF fonte no container de referência.
UPF pós-síntese no container de implementação.
```

---

## 12. SystemVerilog/UVM — conhecimentos de prova

### 12.1 SystemVerilog para design

```text
logic simplifica reg/wire em muitos contextos
always_comb expressa combinacional
always_ff expressa sequencial
always_latch expressa latch intencional
typedef enum melhora FSM
struct packed organiza barramentos
interface agrupa sinais e pode ser sintetizável
```

Pegadinha:

```text
logic não significa automaticamente flip-flop.
O bloco e a atribuição definem o hardware inferido.
```

### 12.2 Recursos não sintetizáveis comuns

```text
classes
mailboxes
semaphores
randomization
coverage
program blocks
muitos constructs de assertion/testbench
DPI como chamada de simulação
```

### 12.3 Assertions

```text
immediate assertion → checa condição agora
concurrent assertion → checa comportamento temporal
sequence → padrão temporal
property → regra baseada em sequence
assert property → verifica propriedade
cover property → mede se sequência ocorreu
```

Operadores/funções:

```text
|->  implicação temporal
$rose subida
$fell descida
$stable estabilidade
$past valor anterior
$isunknown detecta X/Z
$onehot exatamente um bit ativo
$onehot0 zero ou um bit ativo
```

### 12.4 UVM

Mapa de equivalência:

| Testbench manual | UVM |
|---|---|
| Packet/reg_item | `uvm_sequence_item` |
| generator | `uvm_sequence` |
| mailbox generator-driver | `seq_item_port` / `seq_item_export` |
| driver | `uvm_driver` |
| monitor | `uvm_monitor` |
| agent | `uvm_agent` |
| environment | `uvm_env` |
| test | `uvm_test` |
| scoreboard | `uvm_scoreboard` |
| mailbox/FIFO | TLM FIFO, ports/exports |
| print/copy manual | `uvm_object` methods/macros |
| `$finish` manual | objections |

Frases de prova:

```text
Driver dirige; monitor observa.
Active agent tem driver, sequencer e monitor.
Passive agent tem apenas monitor.
Factory permite override em runtime.
TLM transporta transações.
put empurra; get puxa.
Analysis port publica por write().
Objections controlam fim do teste.
```

---

## 13. VCS/Verdi — fluxo de prova

### 13.1 Dois passos

Para Verilog/SystemVerilog simples:

```bash
vcs -sverilog -f filelist.f
./simv
```

### 13.2 Três passos

Para fluxo mais geral/misto:

```bash
vlogan ...
vhdlan ...
vcs ...
./simv
```

### 13.3 Debug

```bash
verdi -nologo -ssf dump.fsdb &
```

### 13.4 Dica prática registrada

No fluxo de simulação VCS/Verdi do projeto RTL_LAB2, quando a waveform não aparece corretamente, a orientação foi inverter a ordem no `filelist.f`, colocando o testbench antes do módulo de design:

```text
../tb/_tb_<modulo>.v
../<modulo>.v
```

---

## 14. Tabela de “responder assim” em prova

| Quando a questão disser... | Responder pensando em... |
|---|---|
| `all constructs synthesizable` | Falso. SystemVerilog tem muitos constructs de testbench. |
| `interface synthesizable` | Verdadeiro se usada em RTL adequado. |
| `mailbox/semaphore/class synthesizable` | Normalmente falso. |
| `generator mailbox` | Generator pushes. |
| `driver mailbox` | Driver pops. |
| `event trigger` | `->`. |
| `implication operator` | `|->`. |
| `distribution operator` | `:=`. |
| `find_last vs max with clause` | `find_last()` precisa de `with`. |
| `vlogan analyses for...` | `instantiations`, conforme banco. |
| `model libraries not required` | True no tutorial RTL simples. |
| `VHDL simulation flow` | Three-step. |
| `cycle accurate faster functionality` | Cycle accurate. |
| `gate-level simulation with cycle accurate` | True para “cannot be run” no banco. |
| `physical synthesis DC NXT` | RTL → optimized and coarse-placed netlist. |
| `topographical mode` | coarse placement + virtual routing. |
| `target_library` | mapeamento/otimização. |
| `link_library` | resolução de referências. |
| `compile_ultra levels` | architectural → logic/GTECH → gate/mapping. |
| `DesignWare operator inferencing` | operadores aritméticos/relacionais. |
| `input-to-register path` | input port → data pin. |
| `BBD preliminary optimization` | logic area. |
| `clock group` | same or derived from common. |
| `IR effect results` | A, b, c. |
| `input signal reordering` | Power. |
| `Gajski-Kuhn Y chart` | Abstractions. |
| `Flip chip VLSI device` | True. |

---

## 15. Erros técnicos versus gabarito do curso

Algumas respostas do curso são simplificadas ou tecnicamente discutíveis. Para prova, manter o gabarito aceito.

| Tema | Rigor técnico | Gabarito do curso |
|---|---|---|
| Min termos das linhas 0 | OR de mintermos de zeros representa complemento; zeros normalmente usam maxterms por AND. | `OR`. |
| Flip-chip | Pode ser descrito como técnica de montagem/interconexão. | `True` para “VLSI device”. |
| Constraint expressions só com relacionais | SystemVerilog real permite muito mais constructs. | `True` na questão específica. |
| vlogan analisa syntax/hierarchy | Tecnicamente detecta sintaxe e participa da análise. | `instantiations`. |
| VHDL two-step/three-step | Pode haver fluxos específicos. | `Three step` na questão. |

---

## 16. Checklist mental antes de responder questão

```text
[ ] A alternativa é de escolha única ou múltipla?
[ ] A pergunta está pedindo conceito técnico geral ou gabarito do curso?
[ ] Há palavra-chave do banco já registrada?
[ ] A questão envolve comando Synopsys? Conferir comando exato.
[ ] A questão envolve SystemVerilog? Separar RTL sintetizável de testbench.
[ ] A questão envolve UPF? Separar isolation, level shifter, retention, power switch.
[ ] A questão envolve DC NXT? Pensar topographical, target/link library, compile_ultra.
[ ] A questão envolve HLS? Pensar scheduling, allocation, binding, datapath/controller.
[ ] A questão envolve simulation/debug? Separar VCS de Verdi.
[ ] A questão envolve coverage? Lembrar: coverage não prova correção.
```

---

## 17. Resumo de altíssima densidade

```text
Síntese lógica transforma RTL em netlist.
Síntese física transforma netlist em layout ou netlist fisicamente consciente.
DC NXT usa topographical mode para melhorar correlação física.
target_library mapeia; link_library resolve.
compile_ultra faz architectural, logic/GTECH e gate-level mapping optimization.
DesignWare otimiza operadores aritméticos e relacionais.
DRCs lógicos têm prioridade.
Constraints guiam timing, área, potência e regras de design.
HLS transforma C/C++ em RTL com datapath e controller.
Scheduling decide ciclos; allocation decide recursos; binding associa operações a recursos.
SystemVerilog une design e verificação, mas nem tudo é sintetizável.
UVM padroniza testbench orientado a objetos com sequence item, sequence, sequencer, driver, monitor, agent, env e test.
VCS simula; Verdi depura.
Formality compara referência e implementação.
UPF descreve intenção de potência: domains, supply sets, isolation, level shifter, retention, switch e power states.
Coverage mede exercício; scoreboard/assertions/checkers medem correção funcional/protocolar.
```

---

## 18. Próxima retomada no roteiro

Pelo roteiro atual da seção **04 RTL Design Synthesis**, a sequência ao redor deste ponto é:

```text
Bloco 018 — 01 Introduction to Synthesis
Bloco 019 — 02 Design and Constraint Files for Synthesis
Bloco 020 — 03 High-Level Synthesis
Bloco 021 — 04 High-Level Synthesis (HLS) for Power Optimization
Bloco 022 — 05 Synthesis with Time or Area Optimization
```

O arquivo de aula seguinte, caso o fluxo de blocos continue, é:

```text
C:\Users\maiko\ci_expert\Aulas2Prints\04 RTL Design Synthesis\04 High-Level Synthesis (HLS) for Power Optimization.docx
```

---

## 19. Como usar este MD

Use este arquivo como:

```text
revisão antes de prova
banco de pegadinhas
memória de gabaritos aceitos
guia de resposta rápida
ponte entre aulas processadas e questões
```

Em provas futuras, a prioridade deve ser:

```text
1. gabarito aceito registrado
2. frase exata do slide/lab/job aid
3. coerência com comandos Synopsys
4. rigor técnico geral
```

Quando houver conflito entre 1 e 4, para a prova, priorizar 1.
