# 01 Introduction — Design Compiler NXT Low Power

## Controle do bloco

- **Bloco:** 089
- **Curso:** 12 Design Compiler NXT - Low Power
- **Arquivo de origem:** `C:\Users\maiko\ci_expert\Aulas2Prints\12 Design Compiler NXT - Low Power\01 Introduction.docx`
- **Faixa de slides processada:** slides 1-4
- **Caminho sugerido para salvar:** `C:\Users\maiko\ci_expert\mdCursoPt2\12 Design Compiler NXT - Low Power\01 Introduction.md`
- **Próximo bloco recomendado:** 090 — `02 Power Analysis Setup`
- **Arquivo do próximo bloco:** `C:\Users\maiko\ci_expert\Aulas2Prints\12 Design Compiler NXT - Low Power\02 Power Analysis Setup.docx`
- **Faixa do próximo bloco:** slides 1-18

---

## Resumo executivo

Esta aula é a porta de entrada do curso de **Design Compiler NXT - Low Power**. Ela apresenta quatro ideias fundamentais para qualquer fluxo de síntese orientado a potência:

1. A potência dissipada em CMOS se divide em **Static or Leakage Power (potência estática ou de fuga)** e **Dynamic Power (potência dinâmica)**.
2. A otimização de **leakage power (potência de fuga)** já é considerada durante `compile_ultra`, mas depende de cenários corretamente configurados.
3. A otimização de **dynamic power (potência dinâmica)** **não** é ativada por padrão no Design Compiler NXT; ela precisa ser habilitada explicitamente.
4. Para calcular potência de modo útil, a ferramenta precisa de **switching activity (atividade de chaveamento)**, preferencialmente vinda de um arquivo **SAIF** gerado por simulação RTL.

O coração da aula é entender que potência não é apenas uma métrica final de relatório. Ela entra como parte do custo de otimização da síntese. Porém, para a ferramenta tomar boas decisões, ela precisa saber em quais cenários analisar potência, quais tipos de potência considerar e qual é a atividade realista dos sinais.

---

# Texto extraído e organizado por slide

## Slide 1 — Power Dissipation Categories

### Texto extraído

**Power Dissipation Categories**

The power dissipated in a CMOS circuit falls into two categories:

- **Static or Leakage Power**
  - Power dissipated due to leakage currents when the circuit is idle
    - Leakage increases exponentially with low-threshold voltages

- **Dynamic Power**
  - Power dissipated when a circuit is active, i.e., stimulus applied to the circuit
    - Internal power (→ Cell)
      - Models power dissipated by the circuit to charge internal capacitances while switching
      - Includes power dissipated by the momentary short circuit path between supply rails, also called crowbar or transient power
    - Switching power (→ Net)
      - Power dissipated by charging external capacitance loads

### Tradução e organização

A potência dissipada em um circuito CMOS cai em duas categorias:

- **Static or Leakage Power (potência estática ou potência de fuga)**
  - Potência dissipada por correntes de fuga quando o circuito está ocioso.
  - A fuga aumenta exponencialmente com tensões de limiar menores.

- **Dynamic Power (potência dinâmica)**
  - Potência dissipada quando o circuito está ativo, ou seja, quando estímulos são aplicados ao circuito.
  - Divide-se em:
    - **Internal power (potência interna)**, associada à célula.
    - **Switching power (potência de chaveamento)**, associada à net/interconexão.

### Explicação didática

Em CMOS ideal, se o circuito não estivesse chaveando, o consumo deveria ser praticamente zero. Mas em tecnologias reais isso não acontece. Mesmo quando o circuito está parado, existem correntes de fuga nos transistores. Essa é a **leakage power (potência de fuga)**.

Quando o circuito está ativo, os sinais alternam entre 0 e 1. Cada transição carrega e descarrega capacitâncias. Essa é a base da **dynamic power (potência dinâmica)**.

A potência dinâmica pode ser entendida por uma fórmula clássica:

```text
P_dynamic ≈ α · C · V² · f
```

Onde:

- `α` é o fator de atividade de chaveamento;
- `C` é a capacitância carregada/descarregada;
- `V` é a tensão de alimentação;
- `f` é a frequência.

O slide não mostra essa fórmula diretamente, mas todos os elementos citados nele apontam para ela: atividade, capacitância interna, capacitância externa e chaveamento.

---

## Slide 2 — Leakage Power Optimization

### Texto extraído

**Leakage Power Optimization**

- Performs tradeoffs between available
  - Faster, higher leakage, low Vth and/or short-L cells
  - Slower, lower leakage, high Vth and/or long-L cells

- Is enabled by default during `compile_ultra`
  - Cannot be disabled

- Is controlled through scenario options
  - Must have at least one scenario enabled for leakage power

```tcl
set_scenario_options -scenarios func.ff_125c -leakage_power true
```

- Leakage power is a component of the overall optimization cost
  - Has lower priority than logic DRCs and timing

### Tradução e organização

A otimização de potência de fuga faz trocas entre células disponíveis na biblioteca:

- células mais rápidas, com maior leakage, geralmente **low Vth** e/ou **short-L cells**;
- células mais lentas, com menor leakage, geralmente **high Vth** e/ou **long-L cells**.

Ela é habilitada por padrão durante `compile_ultra` e não pode ser desabilitada no enquadramento apresentado pelo curso.

Mesmo assim, ela é controlada por opções de cenário. Pelo menos um cenário precisa estar habilitado para leakage power:

```tcl
set_scenario_options -scenarios func.ff_125c -leakage_power true
```

A potência de fuga entra como componente do custo geral de otimização, mas com prioridade menor do que DRCs lógicos e timing.

### Explicação didática

A biblioteca de células geralmente oferece versões diferentes da mesma função lógica. Por exemplo, uma célula inversora pode existir em variantes de baixo, médio e alto threshold:

```text
INV_X1_LVT  -> low Vt, mais rápida, maior leakage
INV_X1_SVT  -> standard Vt, compromisso intermediário
INV_X1_HVT  -> high Vt, mais lenta, menor leakage
```

A lógica é simples:

- Caminhos críticos precisam de células rápidas.
- Caminhos com folga de timing podem usar células mais lentas e econômicas.

A ferramenta tenta economizar leakage sem quebrar timing. Por isso a otimização de leakage é um problema de troca:

```text
Reduzir leakage demais pode piorar timing.
Fechar timing agressivamente pode aumentar leakage.
```

A figura do slide mostra esse tradeoff:

| Tipo de célula | Leakage | Delay | Interpretação |
|---|---:|---:|---|
| Low-Vt | Alto | Baixo | Rápida, mas vazadora |
| Std-Vt | Médio | Médio | Equilíbrio |
| High-Vt | Baixo | Alto | Econômica, mas mais lenta |

### Leitura do comando

```tcl
set_scenario_options -scenarios func.ff_125c -leakage_power true
```

Linha por linha:

- `set_scenario_options`: altera opções de análise/otimização de um cenário.
- `-scenarios func.ff_125c`: escolhe o cenário chamado `func.ff_125c`.
- `-leakage_power true`: habilita consideração de potência de fuga nesse cenário.

Uma leitura provável do nome do cenário:

- `func`: modo funcional.
- `ff`: fast-fast corner, canto rápido de processo.
- `125c`: temperatura de 125 °C.

O curso está reforçando que potência é **scenario dependent (dependente de cenário)**. Em MCMM, cada cenário combina modo, processo, tensão e temperatura. Leakage pode variar muito com essas condições.

---

## Slide 3 — Total Power Optimization

### Texto extraído

**Total Power Optimization**

- Design Compiler NXT does not optimize dynamic power by default.
  - To enable total power optimization to include dynamic power costs:

```tcl
set_app_var compile_enable_total_power_optimization true
```

Default: `false`

- Total power optimization is scenario dependent. In Multi-Corner Multi-Mode flows, you must enable at least one scenario with options `dynamic_power` and `setup` set true.

```tcl
set_scenario_options -scenarios func.ff_125c \
    -setup true -dynamic_power true
```

- The scenario setup option is required since net transition time information is needed to calculate internal power.

### Tradução e organização

O Design Compiler NXT não otimiza potência dinâmica por padrão.

Para habilitar otimização de potência total incluindo custos de potência dinâmica:

```tcl
set_app_var compile_enable_total_power_optimization true
```

O valor padrão dessa variável é:

```text
false
```

A otimização de potência total depende de cenário. Em fluxos **Multi-Corner Multi-Mode (múltiplos cantos e múltiplos modos)**, é necessário habilitar pelo menos um cenário com as opções `dynamic_power` e `setup` em `true`:

```tcl
set_scenario_options -scenarios func.ff_125c \
    -setup true -dynamic_power true
```

A opção `setup` é necessária porque a informação de tempo de transição das nets é necessária para calcular potência interna.

### Explicação didática

Aqui está uma das principais pegadinhas da aula:

```text
Leakage optimization vem ativa em compile_ultra.
Dynamic power optimization não vem ativa por padrão.
```

Então, se você roda `compile_ultra` sem configurar total power optimization, a ferramenta pode até considerar leakage, mas não necessariamente vai otimizar o design buscando reduzir potência dinâmica.

Para incluir potência dinâmica no custo de otimização, são necessárias duas camadas de configuração:

## Camada 1 — variável global de aplicação

```tcl
set_app_var compile_enable_total_power_optimization true
```

Essa variável diz à ferramenta:

```text
Inclua dynamic power no custo de total power optimization.
```

Sem isso, o default é `false`.

## Camada 2 — cenário habilitado para dynamic power e setup

```tcl
set_scenario_options -scenarios func.ff_125c \
    -setup true -dynamic_power true
```

Esse comando diz:

```text
Neste cenário específico, faça análise de setup e considere dynamic power.
```

O `-setup true` não está ali por acaso. Para calcular potência interna, a ferramenta precisa saber as transições dos sinais. Essas transições vêm da análise temporal do cenário. Sem essa informação, o cálculo de internal power fica incompleto ou impreciso.

### Por que internal power precisa de transition time?

A potência interna de uma célula depende de como o sinal entra na célula e de como ela dirige a carga. Um sinal com transição lenta pode fazer PMOS e NMOS conduzirem simultaneamente por mais tempo, aumentando a parcela de curto-circuito momentâneo.

Por isso, a ferramenta precisa de informações como:

- slew de entrada;
- transição de saída;
- carga da net;
- modelo da célula na biblioteca;
- arco de timing utilizado;
- condição de operação do cenário.

Sem `-setup true`, o cenário pode não ter os dados necessários para esse cálculo.

---

## Slide 4 — Power Calculation Requires Switching Activity

### Texto extraído

**Power Calculation Requires Switching Activity**

- Power calculation requires accurate switching activity:
  - Applied by reading SAIF files from RTL simulation (recommended)

```tcl
set_scenario_options func.tt_60c \
    -setup true -dynamic_power true \
    -leakage_power true

read_saif design_sim.saif
```

- Alternatively, by “manually” applying toggle information to primary inputs and black box outputs

```tcl
current_scenario func.tt_60c

set_switching_activity [get_ports "rst scan_en"] \
    -toggle_rate 0.0 -static_probability 0.0

set_switching_activity [get_ports a] \
    -toggle_rate 0.02 -static_probability 0.7

set_switching_activity [get_ports b] \
    -toggle_rate 0.06 -static_probability 0.3
```

- Unannotated points use default switching activity.

### Tradução e organização

O cálculo de potência exige atividade de chaveamento precisa.

O método recomendado é ler arquivos **SAIF** vindos de simulação RTL:

```tcl
set_scenario_options func.tt_60c \
    -setup true -dynamic_power true \
    -leakage_power true

read_saif design_sim.saif
```

Alternativamente, é possível aplicar manualmente informações de toggle nas entradas primárias e nas saídas de black boxes:

```tcl
current_scenario func.tt_60c

set_switching_activity [get_ports "rst scan_en"] \
    -toggle_rate 0.0 -static_probability 0.0

set_switching_activity [get_ports a] \
    -toggle_rate 0.02 -static_probability 0.7

set_switching_activity [get_ports b] \
    -toggle_rate 0.06 -static_probability 0.3
```

Pontos não anotados usam atividade de chaveamento default.

### Explicação didática

A potência dinâmica depende de chaveamento. Se a ferramenta não sabe quanto cada sinal alterna, ela precisa adivinhar. Essa adivinhação é feita por defaults, mas esses defaults podem não representar o funcionamento real do projeto.

Por isso, o slide recomenda o uso de **SAIF**, que significa **Switching Activity Interchange Format (formato de intercâmbio de atividade de chaveamento)**.

Um fluxo típico é:

```text
RTL + testbench representativo
        ↓
simulação RTL
        ↓
arquivo SAIF com atividade realista
        ↓
read_saif no Design Compiler NXT
        ↓
cálculo e otimização de potência
```

Essa abordagem é melhor porque usa atividade observada durante simulação, em vez de chutes manuais.

---

# Aula didática desenvolvida

## 1. O que esta introdução quer preparar

Este bloco não é uma aula longa em número de slides, mas é conceitualmente importante. Ele estabelece as bases para todo o curso:

- como a ferramenta enxerga potência;
- quais categorias de potência podem ser otimizadas;
- quais comandos ativam essa otimização;
- por que cenários MCMM importam;
- por que atividade de chaveamento é essencial.

A síntese low power não é simplesmente rodar um comando mágico. É um conjunto de decisões:

```text
Que tipo de potência quero otimizar?
Em qual cenário?
Com quais dados de atividade?
Com que prioridade em relação a timing e DRC?
```

O Design Compiler NXT só consegue otimizar bem se essas perguntas forem respondidas no script.

---

## 2. Static/leakage power: consumo mesmo parado

**Static or Leakage Power (potência estática ou de fuga)** é a potência dissipada quando o circuito está idle, ou seja, sem atividade funcional relevante.

Isso parece contraintuitivo para quem aprendeu CMOS ideal, porque no modelo ideal o CMOS só consumiria potência significativa durante transições. Mas em tecnologia real, transistores vazam.

Fontes comuns de leakage incluem:

- **subthreshold leakage (fuga sub-limiar)**: corrente mesmo quando `VGS < Vth`;
- **gate leakage (fuga de gate)**: corrente através do óxido de gate, especialmente em tecnologias avançadas;
- **junction leakage (fuga de junção)**: correntes em junções reversamente polarizadas.

O slide destaca uma relação importante:

```text
Quanto menor o threshold voltage, maior tende a ser o leakage.
```

Threshold voltage é a tensão mínima aproximada para o transistor começar a conduzir fortemente. Células **low-Vt** ligam mais facilmente e, por isso, são rápidas. Mas essa facilidade também aumenta fuga.

---

## 3. Dynamic power: consumo quando há atividade

**Dynamic Power (potência dinâmica)** aparece quando os sinais alternam. Ela depende diretamente da atividade do circuito.

A potência dinâmica se divide em duas partes no slide:

```text
Dynamic Power
├── Internal Power → associada à célula
└── Switching Power → associada à net
```

Essa divisão é importante porque o relatório de potência da ferramenta frequentemente separa esses componentes.

---

## 4. Internal power: potência dentro da célula

**Internal power (potência interna)** é associada à própria célula da biblioteca.

Exemplo:

```text
NAND2_X1
```

Essa célula tem transistores internos, capacitâncias internas e arcos caracterizados na biblioteca. Quando as entradas mudam, há consumo interno.

O slide cita duas origens:

1. carregar capacitâncias internas durante o chaveamento;
2. corrente de curto-circuito momentânea entre os trilhos de alimentação.

Esse curto momentâneo também aparece como:

- **crowbar power (potência de curto momentâneo)**;
- **transient power (potência transitória)**.

Durante uma transição, pode haver um intervalo em que PMOS e NMOS conduzem parcialmente ao mesmo tempo. Nesse instante, existe um caminho temporário entre VDD e VSS.

A potência interna depende de:

- tipo da célula;
- slew de entrada;
- carga de saída;
- estado das outras entradas;
- modelo de potência da biblioteca;
- cenário PVT.

Por isso ela não pode ser bem calculada apenas olhando a lógica booleana.

---

## 5. Switching power: potência nas nets

**Switching power (potência de chaveamento)** é associada às nets, isto é, aos fios/interconexões e às cargas que eles dirigem.

Imagine:

```text
U1/Z ---> net_data ---> U2/A, U3/A, U4/B
```

Quando `net_data` alterna, a saída de `U1` precisa carregar ou descarregar a capacitância total conectada nessa net. Essa capacitância inclui:

- capacitância do fio;
- capacitância de entrada das células conectadas;
- capacitância parasita estimada ou extraída;
- carga externa, se houver.

Assim:

```text
Mais capacitância → mais energia por transição.
Mais transições → mais potência dinâmica.
Maior tensão → muito mais potência, porque aparece V².
Maior frequência → mais transições por segundo.
```

---

## 6. Leakage optimization durante compile_ultra

O slide afirma que a otimização de leakage é ativada por padrão durante:

```tcl
compile_ultra
```

Isso significa que, no fluxo do curso, o Design Compiler NXT já considera leakage dentro do custo de otimização durante a síntese ultra.

Mas existe uma limitação importante:

```text
Leakage tem prioridade menor do que logic DRCs e timing.
```

Isso quer dizer que a ferramenta não deve sacrificar a legalidade lógica nem quebrar timing só para reduzir leakage.

Uma hierarquia prática seria:

```text
1. Corrigir violações lógicas/DRCs: max transition, max capacitance, max fanout etc.
2. Fechar timing: setup e, quando aplicável, hold.
3. Reduzir leakage onde houver margem.
```

Exemplo:

```text
Caminho crítico com slack negativo:
    a ferramenta provavelmente mantém ou usa células rápidas.

Caminho com slack positivo grande:
    a ferramenta pode trocar low-Vt por high-Vt para reduzir leakage.
```

---

## 7. Multi-Vt e long-L/short-L cells

O slide menciona:

- **low Vth cells (células de baixo limiar)**;
- **high Vth cells (células de alto limiar)**;
- **short-L cells (células de canal curto)**;
- **long-L cells (células de canal longo)**.

Esses termos indicam variações físicas/tecnológicas da célula.

| Variante | Tendência de velocidade | Tendência de leakage | Uso típico |
|---|---:|---:|---|
| Low Vth | Maior | Maior | Timing crítico |
| High Vth | Menor | Menor | Caminhos com folga |
| Short-L | Maior | Maior | Desempenho |
| Long-L | Menor | Menor | Redução de leakage |

A ferramenta escolhe essas células de acordo com as restrições e custos.

Essa é uma forma clássica de otimização de leakage sem mudar a funcionalidade RTL.

---

## 8. Total power optimization: leakage + dynamic

Quando o slide fala em **Total Power Optimization (otimização de potência total)**, ele está tratando da otimização que inclui não apenas leakage, mas também dynamic power.

Atenção à diferença:

```text
Leakage power optimization:
    habilitada por padrão durante compile_ultra.

Dynamic power optimization:
    não habilitada por padrão.
```

Para ativar total power optimization incluindo dynamic power:

```tcl
set_app_var compile_enable_total_power_optimization true
```

Esse comando sozinho não basta em fluxo MCMM. Também é preciso habilitar pelo menos um cenário com:

```tcl
set_scenario_options -scenarios func.ff_125c \
    -setup true -dynamic_power true
```

Portanto, a lógica completa é:

```text
1. Habilitar a variável global de total power optimization.
2. Habilitar dynamic_power em pelo menos um cenário.
3. Habilitar setup nesse cenário.
4. Fornecer switching activity confiável.
```

---

## 9. Por que o cenário precisa ter setup ativo

O slide diz que `setup` é exigido porque a informação de tempo de transição da net é necessária para calcular internal power.

Isso é muito importante.

A potência interna da célula não depende só de quantas vezes ela chaveia. Depende também de como ela chaveia:

- transição rápida;
- transição lenta;
- carga leve;
- carga pesada;
- arco de subida;
- arco de descida;
- condição de entrada.

A análise de setup produz/usa informações de timing e transition. Sem isso, o cálculo de internal power perde dados essenciais.

Por isso, no contexto do slide:

```text
-dynamic_power true precisa andar junto com -setup true.
```

Em prova, essa é uma resposta provável.

---

## 10. Switching activity: a peça que torna power analysis realista

A ferramenta precisa saber quanto os sinais alternam.

Sem switching activity, ela pode:

- usar defaults genéricos;
- propagar probabilidades estimadas;
- gerar relatórios pouco representativos;
- otimizar regiões que não são realmente críticas em potência;
- subestimar ou superestimar consumo.

Por isso o slide recomenda:

```tcl
read_saif design_sim.saif
```

O SAIF carrega atividade gerada por simulação RTL. Essa simulação deve ser representativa do uso real do design. Um SAIF gerado por um teste ruim também produz power analysis ruim.

Exemplo:

```text
Se o testbench só reseta o design e não roda tráfego real,
o SAIF vai dizer que quase nada chaveia.
O relatório de potência ficará artificialmente baixo.
```

---

## 11. Anotação manual com set_switching_activity

Quando não há SAIF, o slide mostra a alternativa manual:

```tcl
set_switching_activity [get_ports a] \
    -toggle_rate 0.02 -static_probability 0.7
```

Esse comando define dois valores importantes:

## `-toggle_rate`

Indica a taxa de alternância do sinal.

Exemplo:

```tcl
-toggle_rate 0.02
```

Sinal com toggle rate maior consome mais potência dinâmica, pois alterna mais.

## `-static_probability`

Indica a probabilidade de o sinal estar em nível lógico 1.

Exemplo:

```tcl
-static_probability 0.7
```

Quer dizer que o sinal tende a ficar em 1 cerca de 70% do tempo.

Essa probabilidade importa porque a atividade interna das células depende dos valores das entradas. Em uma porta NAND, por exemplo, certas combinações de entrada podem impedir que uma transição se propague internamente.

---

## 12. Por que reset e scan_en aparecem com toggle zero

O slide mostra:

```tcl
set_switching_activity [get_ports "rst scan_en"] \
    -toggle_rate 0.0 -static_probability 0.0
```

Isso sugere que, no cenário funcional considerado, `rst` e `scan_en` ficam em 0 e não alternam.

Interpretação:

- `rst` provavelmente está inativo no modo funcional normal.
- `scan_en` provavelmente está inativo no modo funcional normal.

Essa é uma escolha típica para análise de potência funcional. Não faz sentido estimar a potência do modo funcional supondo que scan enable fica alternando o tempo todo.

Mas em um cenário de teste/DFT, a análise poderia ser diferente.

---

## 13. Black boxes e saídas não observadas

O slide diz que a anotação manual pode ser aplicada a:

- **primary inputs (entradas primárias)**;
- **black box outputs (saídas de black boxes)**.

Isso é importante porque uma black box não tem lógica interna disponível para a ferramenta propagar atividade através dela.

Se a ferramenta não conhece o interior de um bloco, ela não consegue estimar sozinha como as saídas dele alternam. Por isso, saídas de black boxes muitas vezes precisam de anotação explícita.

---

## 14. Propagated, default e applied switching activity

A figura do slide 4 usa três categorias:

- **set_switching_activity applied (atividade aplicada manualmente)**;
- **Default (atividade padrão)**;
- **Propagated (atividade propagada)**.

A leitura correta é:

```text
Applied:
    atividade definida diretamente pelo usuário ou por arquivo SAIF.

Propagated:
    atividade calculada internamente pela ferramenta a partir dos sinais anotados.

Default:
    atividade assumida pela ferramenta quando não há anotação suficiente.
```

O ideal é ter atividade aplicada ou propagada a partir de uma fonte confiável. Default é melhor do que nada, mas pode ser impreciso.

---

# Conceitos difíceis explicados em profundidade

## 1. Relação entre timing, leakage e escolha de células

O ponto mais importante do slide 2 é o tradeoff entre velocidade e leakage.

A ferramenta não escolhe uma célula apenas pela função lógica. Ela escolhe uma implementação física disponível na biblioteca.

Exemplo conceitual:

```verilog
assign y = a & b;
```

Essa lógica pode virar diferentes células na netlist:

```text
AND2_X1_LVT
AND2_X1_SVT
AND2_X1_HVT
```

Todas implementam `a & b`, mas têm características diferentes.

A ferramenta pode decidir:

```text
Se o caminho está atrasado:
    usar LVT para reduzir delay.

Se o caminho tem folga:
    usar HVT para reduzir leakage.
```

Isso mostra por que otimização de potência depende de timing. Não existe otimização isolada.

---

## 2. Logic DRCs têm prioridade maior que leakage

O slide diz que leakage tem prioridade menor que **logic DRCs (regras lógicas de projeto)** e timing.

Logic DRCs são restrições como:

- max transition;
- max capacitance;
- max fanout;
- restrições de biblioteca;
- integridade básica da implementação lógica.

Se uma net tem capacitância grande demais, a ferramenta pode precisar inserir buffer ou aumentar célula. Isso talvez aumente potência, mas é necessário para respeitar restrições elétricas.

Por isso:

```text
Não adianta reduzir leakage se o circuito resultante viola DRC lógico ou não fecha timing.
```

---

## 3. `set_app_var` versus `set_scenario_options`

Esses comandos atuam em níveis diferentes.

## `set_app_var`

```tcl
set_app_var compile_enable_total_power_optimization true
```

Configura uma variável global de comportamento da ferramenta.

É como dizer:

```text
A ferramenta está autorizada a incluir dynamic power na otimização total.
```

## `set_scenario_options`

```tcl
set_scenario_options -scenarios func.ff_125c \
    -setup true -dynamic_power true
```

Configura um cenário específico.

É como dizer:

```text
Neste cenário, analise setup e considere dynamic power.
```

A pegadinha é que um comando não substitui o outro. Em fluxo MCMM, a variável global e a configuração do cenário precisam estar coerentes.

---

## 4. Por que dynamic power depende de SAIF ou switching activity

A fórmula mental é:

```text
P_dynamic ≈ α · C · V² · f
```

A ferramenta geralmente conhece ou estima:

- `C`, pela biblioteca e pela interconexão;
- `V`, pelo cenário/condição de operação;
- `f`, pelo clock;
- mas precisa de `α`, a atividade.

O `α` depende do comportamento funcional do design.

Exemplo:

```verilog
if (enable)
    data_out <= data_in;
```

Se `enable` raramente fica em 1, o registrador e sua lógica associada chaveiam pouco. Se `enable` fica sempre em 1, chaveiam muito.

A ferramenta não sabe isso apenas olhando o RTL, a menos que você dê atividade realista.

---

## 5. SAIF recomendado não significa SAIF perfeito

O slide marca SAIF de simulação RTL como recomendado. Isso é correto, mas depende da qualidade da simulação.

Um SAIF é bom quando:

- o testbench é representativo;
- cobre modos relevantes;
- usa tráfego parecido com o caso real;
- não fica preso em reset;
- não mistura modo funcional e modo de teste indevidamente;
- tem duração suficiente para capturar comportamento típico.

Um SAIF ruim pode enganar a ferramenta.

Exemplo:

```text
Simulação curta demais:
    atividade incompleta.

Simulação só com reset:
    potência dinâmica subestimada.

Simulação com tráfego artificial excessivo:
    potência dinâmica superestimada.
```

---

## 6. Como ler o comando `read_saif`

```tcl
read_saif design_sim.saif
```

Interpretação:

- lê o arquivo `design_sim.saif`;
- anota a atividade de chaveamento no design atual;
- permite que a ferramenta use essa atividade para cálculo e otimização de potência.

Em fluxos reais, às vezes o comando precisa de opções adicionais de instância, hierarquia ou mapeamento, dependendo de como o SAIF foi gerado. Mas neste slide o conceito central é: **use SAIF para fornecer switching activity realista**.

---

## 7. Como ler o comando `current_scenario`

```tcl
current_scenario func.tt_60c
```

Esse comando seleciona o cenário corrente.

Depois dele, comandos como `set_switching_activity` são aplicados no contexto desse cenário.

Uma leitura provável do cenário:

- `func`: modo funcional;
- `tt`: typical-typical corner;
- `60c`: temperatura de 60 °C.

Isso reforça que switching activity e power analysis são tratados por cenário.

---

## 8. O risco de pontos não anotados

O slide diz:

```text
Unannotated points use default switching activity.
```

Isso é importante para prova e prática.

Se você não anotar um sinal:

```text
A ferramenta não ignora necessariamente esse sinal.
Ela aplica uma atividade default.
```

O problema é que default pode não ser realista.

Exemplo:

```text
Um enable real alterna raramente.
Default pode assumir atividade maior.
Resultado: potência superestimada.
```

Ou:

```text
Um barramento de dados real alterna muito.
Default pode assumir atividade menor.
Resultado: potência subestimada.
```

---

# Fluxo mental recomendado para esta aula

Uma forma limpa de memorizar o bloco:

```text
1. Classificar potência:
   leakage + dynamic.

2. Entender leakage:
   idle, corrente de fuga, low-Vt vaza mais, high-Vt vaza menos.

3. Entender dynamic:
   atividade, capacitância, internal power e switching power.

4. Configurar leakage:
   set_scenario_options ... -leakage_power true.

5. Configurar dynamic/total power:
   set_app_var compile_enable_total_power_optimization true.
   set_scenario_options ... -setup true -dynamic_power true.

6. Fornecer atividade:
   read_saif recomendado.
   set_switching_activity como alternativa manual.

7. Lembrar prioridade:
   timing e logic DRCs vêm antes de leakage.
```

---

# Comandos do bloco — explicados linha por linha

## 1. Habilitar leakage power em um cenário

```tcl
set_scenario_options -scenarios func.ff_125c -leakage_power true
```

- `set_scenario_options`: define opções de um cenário.
- `-scenarios func.ff_125c`: aplica ao cenário `func.ff_125c`.
- `-leakage_power true`: habilita consideração de leakage power nesse cenário.

Uso conceitual:

```text
Quero que este cenário conte para otimização/análise de leakage.
```

---

## 2. Habilitar total power optimization

```tcl
set_app_var compile_enable_total_power_optimization true
```

- `set_app_var`: altera uma variável de aplicação da ferramenta.
- `compile_enable_total_power_optimization`: variável que controla se a otimização total de potência inclui dynamic power.
- `true`: habilita o recurso.

Pegadinha:

```text
Default = false.
```

Então, se não configurar, dynamic power não entra por padrão na otimização.

---

## 3. Habilitar setup e dynamic power no cenário

```tcl
set_scenario_options -scenarios func.ff_125c \
    -setup true -dynamic_power true
```

- `-setup true`: habilita análise de setup no cenário.
- `-dynamic_power true`: habilita potência dinâmica no cenário.

Motivo do `setup true`:

```text
Internal power precisa de informação de transition time das nets.
```

---

## 4. Configurar cenário com setup, dynamic e leakage

```tcl
set_scenario_options func.tt_60c \
    -setup true -dynamic_power true \
    -leakage_power true
```

Esse comando reúne as três dimensões:

- setup analysis;
- dynamic power;
- leakage power.

Interpretação:

```text
No cenário func.tt_60c, calcule/considere timing de setup, potência dinâmica e potência de fuga.
```

---

## 5. Ler SAIF

```tcl
read_saif design_sim.saif
```

- Lê o arquivo de atividade de chaveamento.
- Usa dados vindos de simulação RTL.
- É o método recomendado pelo slide.

---

## 6. Selecionar cenário corrente

```tcl
current_scenario func.tt_60c
```

Seleciona o cenário no qual os comandos seguintes serão aplicados.

---

## 7. Aplicar atividade manual em reset e scan enable

```tcl
set_switching_activity [get_ports "rst scan_en"] \
    -toggle_rate 0.0 -static_probability 0.0
```

Interpretação:

- `rst` e `scan_en` ficam com toggle zero.
- A probabilidade de estarem em 1 é zero.
- Ou seja, no cenário funcional, eles são considerados em 0 e sem alternância.

---

## 8. Aplicar atividade manual em `a`

```tcl
set_switching_activity [get_ports a] \
    -toggle_rate 0.02 -static_probability 0.7
```

Interpretação:

- `a` alterna com taxa 0.02.
- `a` fica em 1 cerca de 70% do tempo.

---

## 9. Aplicar atividade manual em `b`

```tcl
set_switching_activity [get_ports b] \
    -toggle_rate 0.06 -static_probability 0.3
```

Interpretação:

- `b` alterna mais que `a`, pois `0.06 > 0.02`.
- `b` fica em 1 cerca de 30% do tempo.

---

# Figuras, diagramas e interpretações importantes

## Figura do slide 2 — Leakage versus Delay

A figura compara três tipos de célula:

```text
Low-Vt, Std-Vt, High-Vt
```

A curva de leakage cai quando vai de Low-Vt para High-Vt. A curva de delay sobe.

Interpretação:

```text
Low-Vt:
    menor atraso, maior leakage.

Std-Vt:
    compromisso intermediário.

High-Vt:
    maior atraso, menor leakage.
```

Esse gráfico resume o dilema da otimização de leakage: economizar potência de fuga usando células mais lentas onde houver folga de timing.

---

## Figura do slide 4 — Atividade aplicada, default e propagada

O diagrama mostra entradas como:

```text
rst, scan_en, a, b, clk
```

E mostra um **Black Box (caixa preta)**.

A legenda indica:

- atividade aplicada por `set_switching_activity`;
- atividade default;
- atividade propagada.

A interpretação é:

```text
Entradas anotadas influenciam a atividade interna propagada.
Pontos não anotados recebem default.
Black boxes podem exigir anotação explícita nas saídas.
```

Essa figura prepara o aluno para entender relatórios de potência e problemas de anotação incompleta.

---

# Pontos de prova e revisão

## Questões diretas prováveis

1. **Quais são as duas categorias principais de potência dissipada em CMOS?**
   - Static or Leakage Power e Dynamic Power.

2. **Quando leakage power é dissipada?**
   - Quando o circuito está idle, por correntes de fuga.

3. **Leakage aumenta com células low-Vt ou high-Vt?**
   - Aumenta com low-Vt.

4. **Células low-Vt são mais rápidas ou mais lentas?**
   - Mais rápidas.

5. **Células high-Vt têm menor leakage, mas pioram o quê?**
   - Delay/timing.

6. **Quais são as duas subcategorias de dynamic power no slide?**
   - Internal power e switching power.

7. **Internal power está associada a quê?**
   - À célula.

8. **Switching power está associada a quê?**
   - À net/interconexão e cargas capacitivas externas.

9. **Leakage power optimization é habilitada por padrão durante qual comando?**
   - `compile_ultra`.

10. **A otimização de dynamic power é ativada por padrão no Design Compiler NXT?**
    - Não.

11. **Qual variável ativa total power optimization incluindo dynamic power costs?**

```tcl
set_app_var compile_enable_total_power_optimization true
```

12. **Em fluxo MCMM, qual opção de cenário deve estar true junto com `dynamic_power`?**
    - `setup`.

13. **Por que `setup true` é necessário para dynamic power?**
    - Porque net transition time é necessário para calcular internal power.

14. **Qual arquivo é recomendado para fornecer switching activity?**
    - SAIF de simulação RTL.

15. **O que acontece com pontos não anotados?**
    - Usam switching activity default.

---

## Pegadinhas fortes

| Pegadinha | Resposta correta |
|---|---|
| “CMOS só consome quando chaveia.” | Falso. Existe leakage mesmo idle. |
| “Low-Vt reduz leakage.” | Falso. Low-Vt aumenta leakage, mas melhora velocidade. |
| “High-Vt sempre é melhor.” | Falso. Reduz leakage, mas aumenta delay. |
| “`compile_ultra` otimiza dynamic power por padrão.” | Falso. Dynamic power não é otimizada por padrão no DC NXT. |
| “Para dynamic power basta `-dynamic_power true`.” | Incompleto. O slide exige também `-setup true`. |
| “SAIF é opcional e não muda muito o cálculo.” | Perigoso. Switching activity é essencial para potência dinâmica realista. |
| “Pontos não anotados são ignorados.” | Falso. Eles usam atividade default. |
| “Leakage tem prioridade máxima.” | Falso. Tem prioridade menor que logic DRCs e timing. |

---

# Relação com projeto/laboratório

Este bloco se conecta diretamente ao tipo de script Tcl que aparece em fluxo de síntese Synopsys.

Um esqueleto conceitual de fluxo seria:

```tcl
# 1. Habilitar otimização de potência total
set_app_var compile_enable_total_power_optimization true

# 2. Configurar cenário para timing e potência
set_scenario_options -scenarios func.tt_60c \
    -setup true \
    -dynamic_power true \
    -leakage_power true

# 3. Ler atividade de chaveamento
read_saif design_sim.saif

# 4. Rodar síntese/otimização
compile_ultra

# 5. Gerar relatórios
report_power
```

A ordem lógica é importante:

```text
Sem cenário configurado, a ferramenta não sabe onde considerar potência.
Sem setup, internal power fica sem informação de transição.
Sem switching activity, dynamic power vira estimativa genérica.
Sem total power optimization habilitada, dynamic power não entra por padrão no custo de otimização.
```

Em laboratório, os erros mais prováveis seriam:

- esquecer `compile_enable_total_power_optimization`;
- esquecer `-dynamic_power true` no cenário;
- esquecer `-setup true`;
- rodar power report sem SAIF;
- usar SAIF pouco representativo;
- deixar black boxes sem atividade anotada;
- interpretar redução de leakage como prioridade acima de timing.

---

# Mapa mental da aula

```text
Power Dissipation in CMOS
│
├── Static / Leakage Power
│   ├── Existe quando circuito está idle
│   ├── Aumenta com low-Vt
│   ├── Reduz com high-Vt/long-L
│   ├── Otimizada por padrão no compile_ultra
│   └── Menor prioridade que timing e logic DRCs
│
└── Dynamic Power
    ├── Existe quando circuito chaveia
    ├── Depende de switching activity
    ├── Internal Power → cell
    │   ├── capacitâncias internas
    │   └── crowbar/transient power
    └── Switching Power → net
        └── capacitâncias externas

Total Power Optimization
│
├── Não otimiza dynamic por padrão
├── Precisa: set_app_var compile_enable_total_power_optimization true
├── Precisa: -setup true
├── Precisa: -dynamic_power true
└── Precisa de switching activity confiável

Switching Activity
│
├── Preferido: read_saif design_sim.saif
├── Alternativo: set_switching_activity
├── Pode ser aplicada em primary inputs e black box outputs
├── Pode ser propagada internamente
└── Pontos não anotados usam default
```

---

# Checklist de qualidade do bloco

- [x] Texto dos slides foi convertido para texto real.
- [x] Conceitos difíceis foram explicados, não apenas citados.
- [x] Código/comandos foram preservados e explicados.
- [x] Figuras relevantes foram interpretadas.
- [x] O Markdown ficou útil para estudar sem abrir o DOCX.
- [x] O próximo bloco foi indicado ao final.

---

# Próximo bloco recomendado

## Bloco 090 — 02 Power Analysis Setup

- **Arquivo para anexar:** `C:\Users\maiko\ci_expert\Aulas2Prints\12 Design Compiler NXT - Low Power\02 Power Analysis Setup.docx`
- **Faixa:** slides 1-18
- **Salvar Markdown em:** `C:\Users\maiko\ci_expert\mdCursoPt2\12 Design Compiler NXT - Low Power\02 Power Analysis Setup.md`
