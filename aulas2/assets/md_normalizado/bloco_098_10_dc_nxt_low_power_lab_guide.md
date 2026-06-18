# 10 Design Compiler NXT - Low Power_2022.03_Lab Guide

## Controle do material

- **Tipo:** Lab Guide separado do fluxo principal de aulas
- **Curso:** 12 Design Compiler NXT - Low Power
- **Arquivo de origem:** `C:\Users\maiko\ci_expert\Aulas2Prints\12 Design Compiler NXT - Low Power\10 Design Compiler NXT - Low Power_2022.03_Lab Guide.docx`
- **Duração estimada do lab:** 75 minutos
- **Caminho sugerido para salvar este Markdown:**

```text
C:\Users\maiko\ci_expert\mdCursoPt2\12 Design Compiler NXT - Low Power\10 Design Compiler NXT - Low Power_2022.03_Lab Guide.md
```

- **Continuação recomendada:** a fila principal de aulas terminou no Bloco 097. Este é o lab separado do curso 12. Depois dele, o próximo passo natural é revisar os MDs do curso 12 e/ou rodar o lab no ambiente do professor.

---

# Resumo executivo

Este laboratório fecha o curso **Design Compiler NXT - Low Power** aplicando, em um fluxo prático, os principais recursos estudados nas aulas: **clock gating**, **identificação de clock gates pré-existentes**, **controle de estilo de ICG**, **leitura e mapeamento de SAIF**, **Total Power Optimization (TPO)**, **DFT insertion**, **incremental compile**, **relatório de potência**, **correção de atividade de portas DFT**, **uso de `set_ideal_network` no clock antes de CTS** e, opcionalmente, **correlação com PrimePower**.

A lógica do lab é bem clara: primeiro você roda uma síntese básica com `compile_ultra -spg -no_autoungroup -gate_clock` e observa limitações. Depois melhora o fluxo identificando ICGs pré-existentes, aplicando especificações de clock gating, anotando atividade real com SAIF, ativando TPO, inserindo DFT, corrigindo atividades não anotadas e preparando os arquivos para análise de power signoff.

O material já traz as respostas esperadas para as 25 perguntas. Por isso, este Markdown organiza o lab como um roteiro de execução e também como um guia de estudo para prova.

---

# Objetivos do laboratório

Ao concluir o lab, você deve ser capaz de:

1. Aplicar técnicas recomendadas de síntese low power no **Design Compiler NXT**.
2. Verificar diretivas e variáveis aplicadas antes do `compile`.
3. Analisar a netlist gate-level para:
   - garantir que os resultados de potência foram medidos corretamente;
   - observar o efeito das otimizações aplicadas.
4. Executar, opcionalmente, verificação de signoff de potência com **PrimePower** e comparar com a análise gate-level do Design Compiler.

---

# Arquivos e estrutura do design

## Arquivos fornecidos

O lab fornece:

```text
rtl/*.v
scripts/MY_DESIGN.con
sim/top_rtl.fsdb.saif
scripts/insert_dft.tcl
```

## Design a ser compilado

```text
my_design
```

## Restrições

```text
scripts/MY_DESIGN.con
```

## SAIF

```text
sim/top_rtl.fsdb.saif
```

## Script de DFT

```text
scripts/insert_dft.tcl
```

Esses arquivos **não devem ser modificados** durante o lab.

---

# Hierarquia RTL do design

A hierarquia apresentada no lab é:

```text
MY_DESIGN
├── CG_ROOT
├── CODE_GENERATOR
│   └── gen_cg[*].latch
├── gen_loop[*].COUNTER
├── FLAG_GENERATOR
└── SUM_ACC
```

O lab também destaca a célula de ICG pré-existente:

```text
CGLPPRX2_LVT
```

Essa célula será importante nas tarefas de identificação de clock gating existente.

---

# Especificações de síntese

## Recursos disponíveis

Todos os recursos do DC NXT e licenças relacionadas estão disponíveis:

```text
All DC NXT features and related licenses are available.
```

Isso permite usar:

- SPG;
- clock gating;
- SAIF mapping;
- Total Power Optimization;
- DFT;
- PrimePower, na parte opcional.

---

## Especificação de clock gating

O lab define as seguintes regras:

1. A célula de ICG usada nos clock gates pré-existentes deve ser usada também para ICGs inseridos pela ferramenta.
2. O número máximo de estágios de ICG é `4`.
3. A largura mínima para inserir ICG é `3`.
4. O ponto de controle do ICG deve estar antes do latch do ICG.
5. ICGs pré-existentes devem ser preservados.
6. A condição de enable desses ICGs pré-existentes **não deve ser modificada**.

Essas regras se conectam diretamente às aulas de:

- `set_clock_gating_style`;
- `identify_clock_gating`;
- `set_preserve_clock_gate`;
- clock gating through hierarchy;
- multistage clock gating;
- reporting com `report_clock_gating`.

---

## Especificação de power analysis

O lab pede:

1. A taxa de anotação em **essential points** deve ser `100%` após ler o SAIF antes do compile.
2. A atividade de switching do SAIF deve ser escalada para a frequência definida nas constraints de timing.

Esse ponto é essencial porque a potência dinâmica depende de atividade de chaveamento. Se o SAIF foi gerado com uma frequência diferente da frequência do SDC, a atividade deve ser ajustada com um fator de escala.

---

## Especificação de otimização

O lab pede:

1. **Total Power Optimization** deve ser ativada.
2. O fluxo de otimização deve ter três estágios:
   - primeiro compile;
   - inserção de DFT;
   - incremental compile.

Isso reflete um fluxo realista: primeiro otimiza a lógica funcional, depois insere DFT e depois corrige/otimiza incrementalmente a netlist modificada.

---

## Especificação de power reporting

O lab pede:

1. A potência deve ser medida no **modo funcional**.
2. A potência de switching da clock network deve ser zero.

A segunda exigência é típica de relatório **pre-CTS**. Antes de Clock Tree Synthesis, a clock network ainda não representa a árvore real de clock. Por isso, deixar o switching power da clock network aparecer no report pode gerar valores irreais.

---

# Roteiro principal do lab

## Etapa 1 — Invocar o DC NXT Topographical

Entre no diretório:

```bash
lab1
```

E invoque o Design Compiler NXT em modo topographical.

A partir daqui, o lab orienta criar um arquivo:

```text
scripts/dc.tcl
```

Todo comando executado interativamente deve ser copiado para esse arquivo. A ideia é transformar a exploração manual em um script reexecutável.

---

# Task 1 — Setup inicial, SAIF mapping e leitura do design

## 1. Ativar naming compatível com UPF/SAIF e iniciar SAIF map

```tcl
set_app_var hdlin_enable_upf_compatible_naming true
saif_map -start
```

## Explicação

A variável:

```tcl
set_app_var hdlin_enable_upf_compatible_naming true
```

ajusta o estilo de nomes do HDL compiler para alinhar nomes do Design Compiler com convenções usadas por simuladores. Isso é importante porque o SAIF foi gerado na simulação RTL e precisa ser mapeado corretamente para os objetos dentro do Design Compiler.

O comando:

```tcl
saif_map -start
```

inicia o banco de mapeamento de nomes SAIF. Esse banco será usado para relacionar nomes RTL, nomes elaborados e nomes gate-level.

---

## 2. Setup de bibliotecas, análise, elaboração e constraints

```tcl
source scripts/setup.tcl

analyze -format verilog [glob -directory ./rtl *.v]
elaborate my_design
current_design my_design

source MY_DESIGN.con
```

## Explicação linha por linha

```tcl
source scripts/setup.tcl
```

Carrega bibliotecas físicas e lógicas, variáveis de ambiente e configurações necessárias para a síntese.

```tcl
analyze -format verilog [glob -directory ./rtl *.v]
```

Lê todos os arquivos Verilog do diretório `rtl`.

```tcl
elaborate my_design
```

Elabora o design, transformando a descrição RTL em uma representação interna do DC.

```tcl
current_design my_design
```

Define `my_design` como o design ativo.

```tcl
source MY_DESIGN.con
```

Aplica as constraints do projeto. Em um fluxo mais robusto, normalmente o caminho seria `scripts/MY_DESIGN.con`, mas o lab apresenta o comando como `source MY_DESIGN.con`.

---

# Task 1A — Primeiro compile com clock gating básico

Execute:

```tcl
compile_ultra -spg -no_autoungroup -gate_clock
report_clock_gating -ungated
```

## Conceitos envolvidos

```tcl
compile_ultra
```

Executa a síntese otimizada.

```tcl
-spg
```

Ativa Synopsys Physical Guidance, permitindo que o DC NXT considere informações físicas aproximadas.

```tcl
-no_autoungroup
```

Impede que a ferramenta desfaça hierarquias automaticamente. Isso é importante no lab porque algumas oportunidades de clock gating dependem de atravessar hierarquias.

```tcl
-gate_clock
```

Ativa a inserção de clock gating baseado em enable síncrono existente no RTL.

```tcl
report_clock_gating -ungated
```

Lista registradores que não foram gated e os motivos.

---

## Pergunta 1

**What is the tool-inserted gated register ratio?**

Resposta esperada:

```text
84.21%
```

## Interpretação

Esse valor mede a proporção de registradores que receberam clock gating inserido pela ferramenta. Ele não inclui necessariamente clock gates pré-existentes se eles ainda não foram identificados corretamente.

---

## Pergunta 2

**Check the ungated reasons and RTL. Comment on why the tool could not insert an ICG on those registers.**

Resposta esperada:

```text
FLAG_GENERATOR/flag_reg não foi gated por "Min bitwidth not met".
Ele é o único registrador na hierarquia FLAG_GENERATOR, e a largura mínima para inserir clock gate é 4.

CODE_GENERATOR/code_reg[*] não tem um comando if que possa ser usado como enable; por isso aparece como "Always enabled registers".
```

## Explicação

Clock gating regular depende de uma condição de enable síncrona no RTL, por exemplo:

```verilog
always @(posedge clk) begin
  if (en)
    q <= d;
end
```

Se o registrador sempre recebe novo valor, sem `if`, a ferramenta não encontra enable natural.

Além disso, mesmo com enable, a ferramenta pode não inserir ICG quando o número de bits é pequeno demais. O motivo é o overhead: inserir uma célula ICG para poucos registradores pode consumir mais área/potência do que economiza.

---

# Task 2 — Identificar clock gates pré-existentes

O lab manda sair do shell, repetir o fluxo até a etapa de constraints e então identificar clock gates pré-existentes.

Comandos úteis:

```tcl
identify_clock_gating
get_lib_cell -of [all_clock_gates -origin pre_existing]
```

---

## Pergunta 3

**What is the library cell name of pre-existing ICGs?**

Resposta esperada:

```text
CGLPPRX2_LVT
```

Comandos:

```tcl
identify_clock_gating
get_lib_cell -of [all_clock_gates -origin pre_existing]
```

## Explicação

Antes da identificação, o DC NXT pode enxergar essas estruturas apenas como lógica comum. Depois de `identify_clock_gating`, ele reconhece que certos elementos são clock gates já existentes no RTL ou na netlist.

---

## Pergunta 4

**What is the `clock_gating_integrated_cell` attribute on pre-existing ICGs?**

Resposta esperada:

```text
latch_posedge_precontrol
```

Comando:

```tcl
get_attribute [get_lib_cells -of [get_cells CG_ROOT]] clock_gating_integrated_cell
```

## Explicação

O atributo `clock_gating_integrated_cell` descreve o estilo funcional da célula ICG. Nesse caso:

```text
latch_posedge_precontrol
```

significa que a célula é um clock gate integrado baseado em latch, associado a clock de borda positiva, com controle antes do latch.

---

# Task 3 — Aplicar especificação de clock gating

O lab manda repetir o fluxo até as constraints e aplicar o script:

```tcl
source scripts/clock_gating.tcl
```

Depois executar:

```tcl
compile_ultra -spg -no_autoungroup -gate_clock
report_clock_gating -ungated
```

---

## Pergunta 5

**What is the only ungated register?**

Resposta esperada:

```text
FLAG_GENERATOR/flag_reg
```

## Explicação

Depois de identificar os clock gates pré-existentes, a ferramenta passa a saber que `CG_ROOT` já está fazendo clock gating em:

```text
CODE_GENERATOR/code_reg[*]
```

Com isso, esses registradores deixam de aparecer como problema de não-gated. O único que permanece ungated é:

```text
FLAG_GENERATOR/flag_reg
```

---

## Pergunta 6

**Without ungroup, what variable can be used to insert an ICG in `flag_reg`?**

Resposta esperada:

```tcl
set_app_var compile_clock_gating_through_hierarchy true
```

Ou, conforme o texto da resposta do lab:

```text
compile_clock_gating_through_hierarchy
```

## Explicação

A variável permite encontrar condições de enable através de fronteiras hierárquicas, sem precisar desfazer a hierarquia com ungroup.

Isso conversa diretamente com a aula de advanced clock gating: por padrão, a inserção é feita na hierarquia local do banco de registradores. Quando a condição de enable está em outra hierarquia, a ferramenta pode não enxergar a oportunidade.

---

# Task 4 — Power analysis com SAIF

O lab manda repetir o fluxo até o setup de clock gating e aplicar o script:

```tcl
source scripts/power_analysis.tcl
```

Depois executar:

```tcl
compile_ultra -spg -no_autoungroup -gate_clock
report_clock_gating -ungated
```

---

## Pergunta 7

**What is the `-instance_name` to be used in `read_saif` command?**

Resposta esperada:

```text
top_tb/top
```

## Como verificar

O próprio lab sugere:

```bash
grep INSTANCE sim/top_rtl.fsdb.saif
```

## Explicação

O `-instance_name` precisa casar a instância do design dentro do testbench usada durante a simulação. O SAIF foi gerado a partir de uma simulação onde o design está instanciado sob:

```text
top_tb/top
```

Por isso o `read_saif` deve mapear a atividade para essa instância.

---

## Pergunta 8

**What is the scale factor needed to align SAIF clock frequency to SDC clock frequency?**

Resposta esperada:

```text
3.335
```

## Cálculo didático

O SDC define período de clock:

```text
3.00 ns
```

Para clock, a toggle rate é duas transições por período:

```text
TR_SDC = 2 / 3 = 0.666 1/ns
```

O SAIF informa:

```text
timescale = 1 ps
duration = 4030000 ps
TC ≈ 804 ou 805 para NET clk
```

O lab usa:

```text
TR_SAIF = 805 / 4030000 ps × 1 ps / 0.001 ns
        ≈ 0.1997 1/ns
```

Então:

```text
scale_factor = TR_SDC / TR_SAIF
             = 0.666 / 0.1997
             ≈ 3.335
```

## Interpretação

O SAIF foi gerado com atividade equivalente a uma frequência mais baixa que a frequência do SDC. Por isso, a atividade precisa ser multiplicada por aproximadamente `3.335`.

---

## Pergunta 9

**What is annotation rate in seq-pin column?**

Resposta esperada:

```text
100.00%
```

Comando:

```tcl
report_activity -driver
```

Detalhe:

```text
62 sequential output pins foram anotados com atividade SAIF simulada.
```

## Interpretação

Isso confirma que os essential points sequenciais receberam anotação de atividade. O lab exige 100% de annotation rate em essential points antes do compile.

---

# Task 5 — Ativar Total Power Optimization

## Pergunta 10

**What commands or options can be used to enable Total Power Optimization?**

Resposta esperada:

```tcl
set_app_var compile_enable_total_power_optimization true
```

Também é aceito:

```tcl
set_qor_strategy -metric total_power
```

## Explicação

A variável direta é:

```tcl
compile_enable_total_power_optimization
```

Ela ativa a Total Power Optimization, combinando leakage e dynamic power em um custo único.

O comando:

```tcl
set_qor_strategy -metric total_power
```

também ativa essa variável como parte da estratégia QoR voltada a potência total.

---

## Mensagens de confirmação

Depois de ativar TPO e executar `compile_ultra -spg`, o lab manda observar mensagens `Information` com códigos `PWR`.

---

## Pergunta 11

**What information message code confirms total power optimization was enabled?**

Resposta esperada:

```text
PWR-1101
```

Mensagem:

```text
Information: Design Compiler NXT Total Power Optimization is enabled. (PWR-1101)
```

---

## Pergunta 12

**What is an indication that the pre-existing gating elements were identified?**

Resposta esperada:

```text
PWR-876 e PWR-877
```

Mensagens:

```text
Information: Starting design-scoped clock gating circuitry identification (PWR-876)
Information: Automatically identified 5 gating element(s) (PWR-877)
```

---

## Pergunta 13

**What information message code confirms `saif_map` feature was enabled?**

Resposta esperada:

```text
PWR-602
```

Mensagem:

```text
Information: The SAIF name mapping information database is now active. (PWR-602)
```

---

# Task 6 — Fluxo completo: compile, DFT e incremental compile

O lab manda rodar o fluxo completo:

1. Primeiro compile.
2. DFT insertion.
3. Incremental compile.

Comandos para DFT e incremental:

```tcl
source -echo scripts/insert_dft.tcl
compile_ultra -spg -no_autoungroup -incr
report_clock_gating -ungated
```

## Observação importante

O lab destaca:

```text
It is not recommended to add -gate_clock option in an incremental compile.
```

## Interpretação

No incremental compile, o objetivo é preservar e melhorar uma netlist já otimizada, não refazer a inserção principal de clock gating. Usar `-gate_clock` novamente pode causar mudanças estruturais desnecessárias.

---

# Task 7 — Report power e atividade de inputs

## 1. Gerar relatório de potência

```tcl
redirect -file ./reports/report_power.rpt -tee {report_power}
```

## 2. Reportar atividade dos inputs

```tcl
get_switching_activity [all_inputs]
```

---

## Pergunta 14

**Are there any primary input port non-annotated from the SAIF File? What activity type they have?**

Resposta esperada:

```text
Sim. report_saif -hier -rtl_saif -missing lista as portas não anotadas:
SI[1], SI[0] e SE.
```

Comando útil:

```tcl
report_saif -hier -rtl_saif -missing
```

## Interpretação

Essas portas não existiam na simulação RTL original porque foram inseridas depois, no fluxo de DFT.

---

## Pergunta 15

**At what stage of the flow were those ports inserted?**

Resposta esperada:

```text
Depois de insert_dft.
```

---

## Pergunta 16

**Depending on the type of activity being observed, what impact does the activity on those ports have on the power measurement?**

Resposta esperada:

```text
Portas primárias não anotadas recebem atividade default:
power_default_toggle_rate e power_default_static_probability.

Como são portas DFT conectadas aos registradores, a medição de potência inclui atividade de DFT que não pertence ao modo funcional.
```

## Explicação

As portas:

```text
SI[1], SI[0], SE
```

são relacionadas a scan/DFT. Se elas recebem atividade default, a ferramenta pode assumir toggling funcional inexistente. Isso contamina a medição de potência funcional, especialmente em registradores.

---

# Task 8 — Corrigir atividade das portas DFT

## Pergunta 17

**What commands can be used to constraint the activity of those ports?**

Resposta esperada com `set_switching_activity`:

```tcl
set_switching_activity [get_port SE] \
  -static_probability 0 -toggle_rate 0

set_switching_activity [get_port SI*] \
  -static_probability 0 -toggle_rate 0
```

Alternativa com `set_case_analysis`:

```tcl
set_case_analysis 0 [get_port SI[1]]
set_case_analysis 0 [get_port SI[0]]
set_case_analysis 0 [get_port SE]
```

## Observação

O texto da resposta do lab tem um erro de digitação em um ponto:

```text
set_swithing_activity
```

O comando correto é:

```tcl
set_switching_activity
```

---

## Pergunta 18

**Which power group and type of power was most affected by the change?**

Resposta esperada:

```text
O grupo register foi o mais afetado.
```

## Explicação

A porta `SE` conecta-se aos scan enable pins dos registradores. Se `SE` fica alternando por default, os pinos de scan enable dos registradores também podem receber atividade artificial. Ao fixar `SE = 0`, essa atividade funcional falsa desaparece.

O tipo de potência mais afetado é a potência dinâmica associada ao grupo de registradores, especialmente internal power relacionada aos pinos internos e arcos de registradores.

---

## Pergunta 19

**Is it enough to make this change at the end of the flow? Can it affect power optimization?**

Resposta esperada:

```text
Não. As portas primárias devem ser restringidas depois da inserção de DFT, para que a otimização foque nas nets corretas de alta atividade.
```

## Explicação

Se a correção for feita apenas no final, o relatório melhora, mas a síntese/otimização já tomou decisões com atividade errada. Para afetar otimização, a correção deve entrar no fluxo antes do incremental compile.

---

# Task 9 — Zerar clock network switching power pre-CTS

O lab manda usar:

```tcl
set_ideal_network
```

em todas as clock nets para reduzir a potência de switching da clock network para zero.

## Conceito

Antes de CTS, a árvore de clock física ainda não existe de verdade. A clock net pode aparecer como uma rede de fanout enorme e não bufferizada, gerando potência de switching irreal.

Por isso, em relatório pre-CTS, o lab exige:

```text
Clock network switching power should be zero.
```

Comando conceitual:

```tcl
set_ideal_network -no_propagate [get_nets -of [all_fanout -flat -clock_tree]]
```

A forma exata pode variar conforme o ambiente do lab e o que foi ensinado no slide de reporting.

---

# Task 10 — Reexecutar o fluxo completo

Depois de adicionar:

1. correção de switching activity das portas DFT;
2. `set_ideal_network` para clock nets;

o lab manda reexecutar tudo:

```text
Task 1 → Task 5
```

E então corroborar os resultados com:

```tcl
report_power
```

A ideia é garantir que o relatório final esteja em modo funcional e sem potência de clock network artificial pre-CTS.

---

# Task 11 — Gerar SAIF mapping para PrimePower

Depois do fluxo completo, aplicar:

```tcl
change_names -rule verilog -hier
saif_map -write_map ./results/primepower_dc.saif.map -type primepower
```

## Pergunta 20

**Comment on the difference between the RTL name and the gate level name.**

Resposta esperada:

```text
A diferença fundamental entre nomes RTL e gate-level em registradores é o "_reg" anexado aos elementos sequenciais durante a elaboração.

Se change_names foi executado, o "." de labels gerados por loops Verilog é alterado para "_".
```

## Explicação

Na simulação RTL, um registrador pode aparecer com um nome hierárquico. Depois da elaboração e síntese, o DC pode alterar nomes por:

- anexar `_reg`;
- substituir caracteres inválidos;
- renomear labels de generate;
- replicar registradores;
- criar bancos multibit;
- inverter saídas;
- aplicar `change_names`.

Por isso, o mapping file é essencial para ferramentas downstream, como PrimePower.

---

# Task 12 — Comparação com `infer_switching_activity`

O lab manda criar uma cópia:

```text
lab1_infer
```

E substituir `read_saif` por:

```tcl
infer_switching_activity -sci_based all -apply
```

Depois rodar o fluxo completo.

---

## Pergunta 21

**Can the power results from `lab1` be compared with `lab1_infer`? Why?**

Resposta esperada:

```text
Uma comparação justa de potência exige a mesma anotação de switching activity.
```

## Interpretação

Não é justo comparar diretamente um fluxo que usa SAIF real de simulação com outro que usa atividade inferida. A base de atividade é diferente.

---

## Pergunta 22

**Can the power results from `lab1` be compared with `lab1_infer`? Why? Which run reports less power?**

Resposta esperada:

```text
Uma comparação justa exige usar a mesma activity annotation nas duas netlists, priorizando o arquivo de atividade mais preciso.

Portanto, fluxos com infer_switching_activity devem ler o RTL SAIF no final do stream para permitir comparação justa.
```

## Interpretação

O lab sugere que o fluxo com `infer_switching_activity` deve ler o RTL SAIF no final para equalizar a base de comparação. Sem isso, diferenças de potência podem refletir diferenças de anotação, não diferenças reais da netlist.

O texto da resposta não especifica explicitamente qual run reporta menos potência. A conclusão segura é: só compare depois de alinhar a atividade. Quando houver diferença, priorize a comparação com o arquivo de atividade mais preciso.

---

# Task opcional — PrimePower signoff

O lab apresenta uma etapa opcional para invocar o **PrimePower**, ferramenta de signoff de potência da Synopsys, e verificar correlação com Design Compiler.

PrimePower possui modos avançados de análise de potência; o lab pede garantir que o modo esteja como:

```text
averaged
```

---

## Arquivos a serem escritos pelo DC NXT para PrimePower

Adicionar ao final do fluxo do Design Compiler:

```tcl
extract_rc -estimate
update_timing

write_sdc ./results/constraints_dc.sdc

write_file -format verilog -output ./results/netlist_dc.v \
  -hierarchy

write_parasitics -output ../results/parasitics_dc.spef

redirect -file ../reports/report_power.final.rpt -tee \
  {report_power -nosplit}
```

## Explicação dos comandos

```tcl
extract_rc -estimate
```

Extrai/estima parasitas RC.

```tcl
update_timing
```

Atualiza a análise de timing com as informações disponíveis.

```tcl
write_sdc
```

Exporta constraints para o PrimePower.

```tcl
write_file -format verilog
```

Exporta a netlist gate-level.

```tcl
write_parasitics
```

Exporta parasitas em SPEF.

```tcl
report_power -nosplit
```

Gera relatório final de potência sem quebrar linhas/tabelas.

---

## Ler o script PrimePower

O lab manda abrir:

```text
./scripts/pwr.tcl
```

para entender o fluxo PrimePower.

---

## Pergunta 23

**What files from Design Compiler NXT are read by PrimePower?**

Resposta esperada:

```text
Netlist, SPEF file, PrimePower mapping file and SDC.
```

Ou seja:

```text
netlist_dc.v
parasitics_dc.spef
primepower_dc.saif.map
constraints_dc.sdc
```

---

## Pergunta 24

**If PrimePower reads an RTL SAIF or RTL FSDB, which file is needed for a correct activity annotation?**

Resposta esperada:

```text
Mapping file.
```

## Explicação

Se a atividade vem de RTL SAIF ou RTL FSDB, os nomes da simulação não batem diretamente com a netlist gate-level. O mapping file resolve essa correspondência.

---

## Rodar PrimePower

No diretório `lab1`:

```bash
pwr_shell
```

Depois:

```tcl
source -echo ./scripts/pwr.tcl
```

---

## Pergunta 25

**Does PrimePower correlate with Design Compiler?**

Resposta esperada:

```text
Sim. O erro de correlação é abaixo de 1% usando T-2022.03-SP3.
```

Se a correlação estiver baixa, o lab recomenda verificar se há alta taxa de anotação em pontos synthesis-invariant usando:

```tcl
report_switching_activity
```

---

# Script consolidado sugerido: `scripts/dc.tcl`

Abaixo está um esqueleto consolidado do fluxo, organizado a partir das tarefas do lab. Ele deve ser ajustado ao ambiente real se algum caminho no lab estiver diferente.

```tcl
# ============================================================
# DC NXT Low Power Lab - consolidated flow
# ============================================================

# ------------------------------------------------------------
# 1. Naming and SAIF mapping setup
# ------------------------------------------------------------

set_app_var hdlin_enable_upf_compatible_naming true
saif_map -start

# ------------------------------------------------------------
# 2. Library and design setup
# ------------------------------------------------------------

source scripts/setup.tcl

analyze -format verilog [glob -directory ./rtl *.v]
elaborate my_design
current_design my_design

source scripts/MY_DESIGN.con

# ------------------------------------------------------------
# 3. Clock-gating setup
# ------------------------------------------------------------

identify_clock_gating

# Lab specification script
source scripts/clock_gating.tcl

# Enable clock gating through hierarchy for FLAG_GENERATOR/flag_reg
set_app_var compile_clock_gating_through_hierarchy true

# ------------------------------------------------------------
# 4. Power-analysis setup
# ------------------------------------------------------------

source scripts/power_analysis.tcl

# Typical expected content from power_analysis.tcl:
# read_saif -input sim/top_rtl.fsdb.saif \
#   -instance_name top_tb/top \
#   -scale 3.335

# ------------------------------------------------------------
# 5. Total Power Optimization
# ------------------------------------------------------------

set_app_var compile_enable_total_power_optimization true

# Alternative:
# set_qor_strategy -stage synthesis -metric total_power

# ------------------------------------------------------------
# 6. First compile
# ------------------------------------------------------------

compile_ultra -spg -no_autoungroup -gate_clock

report_clock_gating -ungated
report_activity -driver

# ------------------------------------------------------------
# 7. DFT insertion
# ------------------------------------------------------------

source -echo scripts/insert_dft.tcl

# Fix DFT port activity immediately after DFT insertion.
# These ports were not present in the original RTL SAIF.
set_switching_activity [get_port SE] \
  -static_probability 0 -toggle_rate 0

set_switching_activity [get_port SI*] \
  -static_probability 0 -toggle_rate 0

# Alternative:
# set_case_analysis 0 [get_port SI[1]]
# set_case_analysis 0 [get_port SI[0]]
# set_case_analysis 0 [get_port SE]

# ------------------------------------------------------------
# 8. Pre-CTS clock network treatment
# ------------------------------------------------------------

# Use a project-appropriate collection of clock nets.
# This form reflects the idea from the Reporting lesson:
set_ideal_network -no_propagate [get_nets -of [all_fanout -flat -clock_tree]]

# ------------------------------------------------------------
# 9. Incremental compile
# ------------------------------------------------------------

# Do not add -gate_clock in incremental compile.
compile_ultra -spg -no_autoungroup -incr

report_clock_gating -ungated

# ------------------------------------------------------------
# 10. Power reports
# ------------------------------------------------------------

redirect -file ./reports/report_power.rpt -tee {report_power}
get_switching_activity [all_inputs]

# ------------------------------------------------------------
# 11. Name change and PrimePower mapping
# ------------------------------------------------------------

change_names -rule verilog -hier
saif_map -write_map ./results/primepower_dc.saif.map -type primepower

# ------------------------------------------------------------
# 12. PrimePower collateral
# ------------------------------------------------------------

extract_rc -estimate
update_timing

write_sdc ./results/constraints_dc.sdc

write_file -format verilog -output ./results/netlist_dc.v \
  -hierarchy

write_parasitics -output ../results/parasitics_dc.spef

redirect -file ../reports/report_power.final.rpt -tee \
  {report_power -nosplit}
```

---

# Tabela de respostas do lab

| Questão | Resposta curta |
|---:|---|
| 1 | `84.21%` |
| 2 | `FLAG_GENERATOR/flag_reg`: min bitwidth não atendido; `CODE_GENERATOR/code_reg[*]`: sempre habilitados, sem `if` de enable |
| 3 | `CGLPPRX2_LVT` |
| 4 | `latch_posedge_precontrol` |
| 5 | `FLAG_GENERATOR/flag_reg` |
| 6 | `compile_clock_gating_through_hierarchy` |
| 7 | `top_tb/top` |
| 8 | `3.335` |
| 9 | `100.00%` em `seq-pin`; 62 sequential output pins anotados com SAIF |
| 10 | `set_app_var compile_enable_total_power_optimization true`; ou `set_qor_strategy -metric total_power` |
| 11 | `PWR-1101` |
| 12 | `PWR-876` e `PWR-877`; 5 gating elements identificados |
| 13 | `PWR-602` |
| 14 | Sim: `SI[1]`, `SI[0]`, `SE`; atividade default |
| 15 | Depois de `insert_dft` |
| 16 | Atividade default em portas DFT contamina potência funcional |
| 17 | `set_switching_activity ... -toggle_rate 0 -static_probability 0` ou `set_case_analysis 0` |
| 18 | Grupo `register`, potência dinâmica/internal associada aos registradores |
| 19 | Não; deve ser feito após DFT e antes da otimização incremental |
| 20 | Gate-level acrescenta `_reg`; `change_names` troca `.` por `_` em labels de generate |
| 21 | Não diretamente; comparação justa exige mesma anotação de switching activity |
| 22 | Comparação justa exige atividade alinhada; fluxo com inferência deve ler RTL SAIF no final |
| 23 | Netlist, SPEF/parasitics, PrimePower mapping file e SDC |
| 24 | Mapping file |
| 25 | Sim; erro de correlação abaixo de 1% usando T-2022.03-SP3 |

---

# Conceitos difíceis explicados

## 1. Por que identificar clock gates pré-existentes?

Se o design já contém clock gates instanciados manualmente ou vindos de RTL, o DC NXT pode não reconhecê-los automaticamente como ICGs. Sem identificação, esses elementos podem:

- não aparecer nos relatórios de clock gating;
- não ser preservados corretamente;
- não ser considerados na taxa de gated registers;
- não participar das transformações de clock gating.

Por isso o lab usa:

```tcl
identify_clock_gating
```

E verifica:

```tcl
all_clock_gates -origin pre_existing
```

---

## 2. Por que `FLAG_GENERATOR/flag_reg` não foi gated inicialmente?

Porque a decisão de clock gating depende de:

1. encontrar uma condição de enable;
2. atender a largura mínima de bits;
3. enxergar a oportunidade na hierarquia correta.

No começo, `FLAG_GENERATOR/flag_reg` falha por `Min bitwidth not met`. Depois, a solução envolve permitir clock gating through hierarchy:

```tcl
set_app_var compile_clock_gating_through_hierarchy true
```

Isso permite aproveitar uma condição de enable compartilhada com registradores em outra hierarquia, sem precisar fazer ungroup.

---

## 3. Por que SAIF precisa de `-instance_name`?

O SAIF é gerado durante a simulação, onde o DUT geralmente está dentro de um testbench.

Exemplo:

```text
top_tb/top
```

Já no Design Compiler, o design ativo pode ser apenas:

```text
my_design
```

O `-instance_name` diz à ferramenta qual instância dentro do SAIF corresponde ao design que está sendo sintetizado.

---

## 4. Por que escalar atividade do SAIF?

A potência dinâmica depende de frequência e toggle rate. Se o SAIF foi gerado com um clock diferente do SDC, a atividade anotada não representa a condição de síntese.

No lab:

```text
SDC clock = 3.00 ns → TR = 0.666 1/ns
SAIF TR ≈ 0.1997 1/ns
scale ≈ 3.335
```

Sem esse ajuste, a potência reportada ficaria subestimada.

---

## 5. Por que DFT ports precisam ser corrigidos?

Portas como:

```text
SI[1]
SI[0]
SE
```

são inseridas após a simulação RTL original. Logo, o SAIF não contém atividade para elas.

Se a ferramenta aplica atividade default, ela pode assumir que scan enable e scan inputs alternam em modo funcional. Isso não é verdade para medição funcional de potência.

A correção é fixar essas portas em zero:

```tcl
set_switching_activity [get_port SE] \
  -static_probability 0 -toggle_rate 0

set_switching_activity [get_port SI*] \
  -static_probability 0 -toggle_rate 0
```

ou:

```tcl
set_case_analysis 0 [get_port SE]
set_case_analysis 0 [get_port SI[0]]
set_case_analysis 0 [get_port SI[1]]
```

---

## 6. Por que `set_ideal_network` antes de CTS?

Antes de CTS, a clock network ainda não é uma árvore física real. Se a ferramenta calcula switching power em uma clock net de fanout enorme e sem buffers reais, o valor pode ser artificialmente alto.

O lab exige que:

```text
Clock network switching power should be zero.
```

Isso evita comparar otimizações usando uma parcela de potência irreal.

---

## 7. Por que não usar `-gate_clock` no incremental compile?

O incremental compile deve preservar a estrutura principal já otimizada e ajustar apenas o necessário. Rodar novamente a inserção completa de clock gating pode:

- modificar demais a netlist;
- atrapalhar a relação com DFT;
- dificultar comparação;
- gerar mudanças estruturais não desejadas.

Por isso o lab usa:

```tcl
compile_ultra -spg -no_autoungroup -incr
```

sem:

```tcl
-gate_clock
```

---

## 8. Por que PrimePower precisa de mapping file?

PrimePower analisa uma netlist gate-level, mas pode receber atividade RTL SAIF/FSDB. Os nomes RTL e gate-level não batem diretamente.

O mapping file permite mapear:

```text
nome RTL/simulação → nome gate-level/síntese
```

Sem esse arquivo, a taxa de anotação pode cair e a correlação com Design Compiler pode ficar ruim.

---

# Pontos de prova e revisão

## Comandos que merecem memorização

```tcl
set_app_var hdlin_enable_upf_compatible_naming true
saif_map -start
```

```tcl
identify_clock_gating
all_clock_gates -origin pre_existing
```

```tcl
compile_ultra -spg -no_autoungroup -gate_clock
report_clock_gating -ungated
```

```tcl
set_app_var compile_clock_gating_through_hierarchy true
```

```tcl
set_app_var compile_enable_total_power_optimization true
```

```tcl
set_qor_strategy -metric total_power
```

```tcl
report_activity -driver
```

```tcl
set_switching_activity [get_port SE] \
  -static_probability 0 -toggle_rate 0
```

```tcl
set_case_analysis 0 [get_port SE]
```

```tcl
set_ideal_network -no_propagate [get_nets -of [all_fanout -flat -clock_tree]]
```

```tcl
change_names -rule verilog -hier
saif_map -write_map ./results/primepower_dc.saif.map -type primepower
```

---

## Pegadinhas do lab

| Tema | Pegadinha | Correção |
|---|---|---|
| Clock gating | Clock gates pré-existentes podem não ser reconhecidos automaticamente | Usar `identify_clock_gating` |
| Ungated registers | Nem todo registrador não gated é erro | Pode faltar enable ou bitwidth mínimo |
| Hierarquia | Enable pode estar fora da hierarquia local | Usar `compile_clock_gating_through_hierarchy` |
| SAIF | O SAIF precisa apontar para a instância correta | `-instance_name top_tb/top` |
| Frequência | SAIF pode ter frequência diferente do SDC | Usar scale factor `3.335` |
| TPO | `compile_ultra` sozinho não garante TPO | Ativar `compile_enable_total_power_optimization` ou `set_qor_strategy -metric total_power` |
| DFT | Portas DFT não existem no RTL SAIF | Corrigir atividade de `SI[1]`, `SI[0]`, `SE` |
| Modo funcional | Atividade default em scan contamina potência funcional | Fixar scan ports em zero |
| Incremental compile | Não usar `-gate_clock` no incremental | Usar `compile_ultra -spg -no_autoungroup -incr` |
| Pre-CTS power | Clock network switching pode ser irreal | Usar `set_ideal_network` em clock nets |
| PrimePower | RTL SAIF/FSDB não casa diretamente com gate netlist | Gerar mapping file |

---

# Relação com as aulas anteriores

Este lab amarra praticamente todos os temas do curso 12:

## 01 Introduction

A distinção entre leakage e dynamic power aparece quando o lab ativa Total Power Optimization e usa SAIF para medir potência dinâmica.

## 02 Power Analysis Setup

O lab usa:

- SAIF;
- `read_saif`;
- `-instance_name`;
- scale factor;
- annotation rate;
- `report_activity -driver`;
- correção de switching activity.

## 03 Power Optimization

O lab ativa TPO com:

```tcl
set_app_var compile_enable_total_power_optimization true
```

ou:

```tcl
set_qor_strategy -metric total_power
```

## 04 Clock Gating

O lab usa:

- `compile_ultra -gate_clock`;
- `identify_clock_gating`;
- `report_clock_gating -ungated`;
- preservação de ICGs pré-existentes.

## 05 Advanced Clock Gating Techniques

O lab exige:

- máximo de 4 estágios de ICG;
- controle antes do latch;
- preservação de enable conditions;
- clock gating through hierarchy.

## 09 Reporting

O lab usa:

- `report_power`;
- `get_switching_activity`;
- `set_ideal_network`;
- power reporting em modo funcional;
- correlação com PrimePower.

---

# Checklist de qualidade

- [x] O conteúdo do lab foi reorganizado em formato de roteiro executável.
- [x] Todos os comandos importantes foram preservados.
- [x] As 25 perguntas foram respondidas.
- [x] As respostas foram integradas com explicações didáticas.
- [x] As pegadinhas do lab foram destacadas.
- [x] O fluxo completo foi consolidado em um script Tcl sugerido.
- [x] O material ficou útil para estudar sem abrir o DOCX.
- [x] A continuação/caminho de saída foi indicado no início.

---

# Continuação

A fila principal de aulas do roteiro terminou no **Bloco 097 — 09 Reporting** e este arquivo fecha o material de lab separado do curso 12.

Não há próximo bloco de aula no roteiro principal.

## Caminho final sugerido deste lab

```text
C:\Users\maiko\ci_expert\mdCursoPt2\12 Design Compiler NXT - Low Power\10 Design Compiler NXT - Low Power_2022.03_Lab Guide.md
```
