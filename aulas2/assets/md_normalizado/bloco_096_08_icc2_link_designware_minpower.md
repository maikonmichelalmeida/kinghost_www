# 08 IC Compiler II Link and DesignWare minPower

## Controle do bloco

- **Bloco:** 096
- **Curso:** 12 Design Compiler NXT - Low Power
- **Arquivo de origem:** `C:\Users\maiko\ci_expert\Aulas2Prints\12 Design Compiler NXT - Low Power\08 IC Compiler II Link and DesignWare minPower.docx`
- **Faixa de slides:** 1-4
- **Caminho sugerido para salvar:**

```text
C:\Users\maiko\ci_expert\mdCursoPt2\12 Design Compiler NXT - Low Power\08 IC Compiler II Link and DesignWare minPower.md
```

- **Próximo bloco recomendado:** 097 — `09 Reporting`
- **Arquivo do próximo bloco:**

```text
C:\Users\maiko\ci_expert\Aulas2Prints\12 Design Compiler NXT - Low Power\09 Reporting.docx
```

- **Faixa do próximo bloco:** slides `1-5`
- **Salvar próximo Markdown em:**

```text
C:\Users\maiko\ci_expert\mdCursoPt2\12 Design Compiler NXT - Low Power\09 Reporting.md
```

---

## Resumo executivo

Este bloco fecha a parte de otimização de potência mostrando duas frentes complementares ao que já foi estudado em Total Power Optimization, clock gating, self-gating e multibit banking.

A primeira frente é o **IC Compiler II Link**, usado dentro do fluxo físico do Design Compiler NXT com `compile_ultra -spg`. Quando o fluxo está usando Synopsys Physical Guidance, o DC NXT consegue acionar uma capacidade de placement mais consciente de potência chamada **enhanced Low-Power Placement**, ou **eLPP**. A ideia principal é simples: nets de dados com alta atividade de chaveamento consomem muita potência dinâmica; se as células conectadas a essas nets forem colocadas fisicamente mais próximas, o comprimento da net cai, a capacitância cai e a potência de switching também cai.

A segunda frente é o **DesignWare minPower**, voltado principalmente para designs com datapath intenso, como somadores, multiplicadores, shifters e subtratores. O minPower tenta escolher arquiteturas e estruturas internas de datapath que reduzam glitches, chaveamentos desnecessários e consumo, sem depender apenas de otimizações genéricas de célula ou placement.

A mensagem prática do bloco é: para low power avançado, não basta trocar células ou inserir clock gates. O fluxo precisa usar informação física, atividade de chaveamento e escolhas arquiteturais de datapath.

---

## Texto extraído e organizado por slide

## Slide 1 — IC Compiler II Link: Enhanced Low Power Placement (1/2)

### Texto limpo do slide

Quando se usa o comando `compile_ultra -spg` no Design Compiler NXT, a capacidade de **enhanced low-power placement**, chamada de **eLPP**, pode ser habilitada por meio do **IC Compiler II Link**.

Essa capacidade otimiza o posicionamento de células conectadas a sinais de alta taxa de toggle, em nets que não são de clock, com o objetivo de encurtar o comprimento dessas nets.

O eLPP é habilitado configurando o esforço de otimização para `low` ou superior e ativando o **Design Compiler NXT Total Power Optimization**.

O esforço usado durante o placement guiado por potência dinâmica pode ser alterado pela variável:

```tcl
placer_enhanced_low_power_effort
```

O slide também informa que:

```tcl
set_qor_strategy -metric total_power
```

habilita eLPP com esforço `low` em modo NDM.

### Comandos do slide

```tcl
set_app_var compile_enable_total_power_optimization true
set_app_var placer_enhanced_low_power_effort [ none / low / medium / high ]
```

### Interpretação

Esse slide conecta a otimização lógica de potência com informação física. A ferramenta não está apenas perguntando “qual célula consome menos?”. Ela também passa a perguntar:

```text
Quais células ligadas a nets muito ativas devem ficar mais próximas para reduzir capacitância e potência de switching?
```

Como potência dinâmica é aproximadamente proporcional à capacitância da net, reduzir comprimento de nets de alta atividade pode ter efeito direto na potência total.

---

## Slide 2 — IC Compiler II Link: Enhanced Low Power Placement (2/2)

### Texto limpo do slide

Para verificar que **Total Power Optimization** foi habilitada corretamente, deve-se procurar a seguinte mensagem durante `compile_ultra`:

```text
Information: Design Compiler NXT Total Power Optimization is enabled. (PWR-1101)
```

Também é possível verificar que a feature foi habilitada procurando a seguinte linha durante a invocação aninhada do IC Compiler II dentro de `compile_ultra`:

```text
place.coarse.enhanced_low_power_effort : low
```

Em fluxos MCMM, é necessário verificar se existe um cenário de potência dinâmica. Quando isso está correto, mensagens como as seguintes aparecem:

```text
Information: Design Compiler NXT Total Power Optimization is enabled. (PWR-1101)
Information: Performing power optimization on scenario: s2 and dynamic power optimization with switching activity from scenario: s1. (PWR-850)
```

### Interpretação

Esse slide é essencialmente uma aula de debug do fluxo. Não basta escrever o comando no script. É preciso verificar no log se a ferramenta realmente ativou a otimização.

As duas mensagens importantes são:

- `PWR-1101`: confirma que Total Power Optimization está habilitada.
- `PWR-850`: confirma que a ferramenta está usando cenário de potência e atividade de chaveamento para otimização dinâmica.

Em MCMM, isso é ainda mais importante porque pode existir cenário de timing, cenário de leakage e cenário de dynamic power. Se o cenário correto não estiver ativo ou não tiver `-dynamic_power true`, a ferramenta pode não otimizar potência dinâmica como esperado.

---

## Slide 3 — DesignWare minPower Components

### Texto limpo do slide

Designs com datapath frequentemente ficam ligados por longos períodos.

É difícil prever as consequências de potência no nível arquitetural, e decisões arquiteturais ótimas dependem do contexto e das restrições.

A tecnologia **DesignWare minPower** oferece:

- Arquiteturas de datapath de baixa potência.
  - Menos glitches.
  - Menos switching.

- Estruturas de datapath conscientes de potência e switching.
  - Consideram características de potência de árvores de datapath.

- Datapath gating embutido.
  - Permite gating de datapath sem overhead de timing.

- IPs de baixa potência instanciados.
  - Data tracking.
  - Enhanced clock gating.
  - Datapath gating.

### Interpretação das figuras

As figuras laterais resumem três ideias:

1. **Low Power Architecture selection**
   - A ferramenta escolhe uma arquitetura funcionalmente equivalente, mas melhor em potência conforme o contexto de timing/slack.

2. **Datapath restructuring**
   - Estruturas como árvores de soma podem ser reorganizadas para reduzir glitching e switching.

3. **Datapath Gating**
   - Partes do datapath podem ser bloqueadas quando seus resultados não precisam ser atualizados.

A ideia principal é que datapath consome muita potência porque opera sobre vários bits em paralelo e contém muitas estruturas combinacionais grandes. Em vez de apenas otimizar célula por célula, o minPower atua em nível de estrutura.

---

## Slide 4 — DesignWare minPower Components

### Texto limpo do slide

Para verificar o conteúdo total de datapath no design, como adders, multipliers, shifters e subtractors:

- Adicione o comando `analyze_datapath` depois do primeiro compile para reportar o percentual total de conteúdo de datapath.

- Adicione os relatórios `report_area -designware` e `report_resources -hier` depois do compile.

Esses relatórios fornecem detalhes de área e recursos, incluindo singletons e extracted blocks, de todos os blocos de datapath.

Para habilitar o DesignWare minPower antes de `compile_ultra` e otimizar potência em designs intensivos em datapath:

```tcl
set_app_var power_enable_minpower true
```

O valor default é:

```text
false
```

### Interpretação

O slide mostra que o minPower não deve ser ativado cegamente sem olhar o design. Antes, ou junto com o fluxo, vale descobrir se o design realmente tem muito datapath.

Exemplos de blocos de datapath:

- somadores;
- subtratores;
- multiplicadores;
- shifters;
- comparadores amplos;
- operadores aritméticos inferidos pelo RTL;
- estruturas DesignWare instanciadas ou inferidas.

Se o design é majoritariamente controle, FSM e registradores simples, o ganho de minPower pode ser limitado. Se o design tem bastante aritmética, processamento de dados e blocos vetoriais, minPower pode ser muito mais relevante.

---

# Aula didática desenvolvida

## 1. O que este bloco acrescenta ao curso de low power

Até aqui, o curso já apresentou quatro níveis importantes de otimização:

1. **Total Power Optimization**
   - Coloca leakage e dynamic power no custo de otimização.

2. **Clock gating**
   - Desliga clock de bancos de registradores quando enable síncrono está falso.

3. **Self-gating**
   - Desliga clock de registradores quando o valor de entrada `D` não muda em relação ao valor armazenado `Q`.

4. **Multibit banking**
   - Junta registradores de 1 bit em registradores multibit para reduzir área, clock pin power e comprimento da árvore de clock.

Este bloco adiciona mais dois recursos:

5. **Enhanced Low-Power Placement via IC Compiler II Link**
   - Usa informação física para reduzir potência em nets de alta atividade.

6. **DesignWare minPower**
   - Usa arquiteturas e estruturas de datapath mais econômicas em potência.

A diferença é que esses dois recursos não são apenas “trocar célula por célula”. Eles agem em níveis mais globais:

```text
Placement físico         → eLPP / IC Compiler II Link
Arquitetura de datapath  → DesignWare minPower
```

---

## 2. Por que placement afeta potência

A potência dinâmica de uma net depende fortemente da sua capacitância.

De forma simplificada:

```text
P_dynamic ≈ atividade × capacitância × tensão² × frequência
```

A ferramenta não consegue mudar facilmente a tensão ou a frequência durante a síntese lógica, mas consegue influenciar:

- tamanho das células;
- quantidade de buffers;
- comprimento de nets;
- proximidade física entre driver e loads;
- fanout efetivo;
- estruturas de datapath;
- clock gating e banking.

O eLPP mira principalmente em nets de dados com alta atividade, não em nets de clock. Uma net de dados que alterna muito e percorre uma longa distância pode consumir bastante switching power.

Exemplo conceitual:

```text
Antes:
U1/Z ───────────────────────────────> U20/A
net longa + alta atividade = maior capacitância efetiva

Depois de placement low power:
U1/Z ─────> U20/A
net mais curta + alta atividade = menor capacitância efetiva
```

Essa redução física pode diminuir:

- capacitância da net;
- quantidade de buffers necessários;
- potência de switching;
- possivelmente congestionamento local, dependendo do caso.

---

## 3. O que é IC Compiler II Link no contexto do DC NXT

O Design Compiler NXT é uma ferramenta de síntese, mas quando o fluxo físico está habilitado ele pode usar recursos do mundo físico para orientar melhor as decisões.

O comando que indica esse tipo de fluxo é:

```tcl
compile_ultra -spg
```

`SPG` significa **Synopsys Physical Guidance**. Na prática, significa que a síntese não está trabalhando de forma puramente lógica e abstrata. Ela está usando informação física para tomar decisões melhores de QoR.

O slide diz que, quando se usa `compile_ultra -spg`, a capacidade eLPP pode ser habilitada por meio do IC Compiler II Link.

Em termos práticos:

```text
Design Compiler NXT
    ↓ chama/usa capacidade física
IC Compiler II Link
    ↓ orienta placement
Enhanced Low-Power Placement
```

---

## 4. O que é eLPP — enhanced Low-Power Placement

**eLPP** significa **enhanced Low-Power Placement**.

A função do eLPP é fazer placement pensando em potência, especialmente em nets de dados com alta taxa de chaveamento.

O slide é explícito:

> It optimizes the placement of cells connected to high toggle rate signal (non-clock) nets with the purpose of shortening these net lengths.

Ou seja:

- identifica nets não-clock com alta atividade;
- observa as células conectadas a essas nets;
- tenta posicionar essas células de forma que o comprimento das nets fique menor;
- reduz capacitância;
- reduz switching power.

### Por que o slide enfatiza “non-clock nets”?

Porque clock já é tratado por técnicas específicas:

- clock gating;
- self-gating;
- multibit banking;
- CTS no back-end;
- clock network optimization.

O eLPP mira principalmente sinais de dados, controle e datapath que alternam muito.

---

## 5. Condições para habilitar eLPP

O slide indica duas condições principais:

1. Ativar Total Power Optimization:

```tcl
set_app_var compile_enable_total_power_optimization true
```

2. Configurar o esforço do placement low power:

```tcl
set_app_var placer_enhanced_low_power_effort low
```

Valores possíveis mostrados no slide:

```text
none / low / medium / high
```

Também aparece a recomendação/atalho:

```tcl
set_qor_strategy -metric total_power
```

Em modo NDM, esse comando habilita eLPP com esforço `low`.

### Interpretação prática dos esforços

| Esforço | Leitura prática |
|---|---|
| `none` | Desliga eLPP. |
| `low` | Ativa eLPP com impacto moderado no runtime e QoR. |
| `medium` | Maior esforço para melhorar potência, possivelmente com mais custo de runtime. |
| `high` | Maior agressividade; deve ser usado com cuidado e verificação de timing/área. |

O slide não detalha os efeitos de cada nível, mas o conceito de esforço em EDA normalmente representa o quanto a ferramenta vai gastar de tentativa, análise e otimização para melhorar aquela métrica.

---

## 6. Como verificar se TPO e eLPP foram realmente habilitados

Uma das partes mais importantes do bloco é a verificação por log.

Depois de rodar `compile_ultra`, procure:

```text
Information: Design Compiler NXT Total Power Optimization is enabled. (PWR-1101)
```

Essa mensagem confirma que a otimização total de potência está ativa.

Depois, durante a chamada interna do IC Compiler II, procure algo como:

```text
place.coarse.enhanced_low_power_effort : low
```

Essa linha confirma que o esforço de enhanced low-power placement foi passado para o mecanismo físico.

Em MCMM, procure também mensagem como:

```text
Information: Performing power optimization on scenario: s2 and dynamic power optimization with switching activity from scenario: s1. (PWR-850)
```

Essa mensagem mostra que a ferramenta está distinguindo cenário usado para otimização de potência e cenário usado para atividade de chaveamento.

---

## 7. Relação entre eLPP, MCMM e switching activity

Em um fluxo MCMM, existem vários cenários possíveis:

```text
func.ff_125c
func.tt_60c
scan.ss_0c
func.ss_125c
...
```

Nem todo cenário é adequado para potência dinâmica. Para dynamic power, o cenário precisa ter opções como:

```tcl
set_scenario_options -setup true -dynamic_power true
```

Além disso, a qualidade da otimização depende de atividade de chaveamento, geralmente vinda de SAIF.

O eLPP precisa saber quais nets têm alta taxa de toggle. Se a switching activity está ruim, default ou incompleta, a ferramenta pode otimizar as nets erradas.

Por isso, o bloco anterior sobre SAIF é pré-requisito direto deste bloco.

Resumo da cadeia:

```text
SAIF / switching activity
        ↓
identificação de nets muito ativas
        ↓
TPO habilitada
        ↓
eLPP via IC Compiler II Link
        ↓
placement encurtando nets de alta atividade
        ↓
menor capacitância e menor switching power
```

---

## 8. O que é DesignWare minPower

DesignWare é uma família de IPs, bibliotecas e componentes parametrizáveis da Synopsys. Em síntese, muitos operadores RTL podem ser inferidos ou mapeados para componentes DesignWare.

Exemplos:

```verilog
assign y = a + b;
assign p = x * z;
assign s = data << shamt;
```

Esses operadores podem virar:

- adders;
- multipliers;
- shifters;
- subtractors;
- comparators;
- estruturas aritméticas compostas.

O **DesignWare minPower** é uma tecnologia voltada para reduzir potência nesses datapaths.

O slide diz que designs de datapath frequentemente ficam ligados por muito tempo. Isso é importante porque um datapath grande pode consumir muita potência mesmo quando a lógica de controle é pequena.

---

## 9. Por que datapath é difícil de otimizar para potência

Datapath é difícil porque há muitas arquiteturas funcionalmente equivalentes.

Um somador, por exemplo, pode ser implementado de várias formas:

- ripple-carry adder;
- carry-lookahead adder;
- carry-select adder;
- prefix adder;
- estruturas híbridas.

Um multiplicador também pode ter várias arquiteturas:

- array multiplier;
- Wallace tree;
- Booth encoding;
- Dadda tree;
- estruturas pipelineadas;
- compartilhamento de recursos.

Cada arquitetura tem tradeoffs diferentes:

| Arquitetura | Timing | Área | Potência | Comentário |
|---|---:|---:|---:|---|
| Mais simples | pior | menor | às vezes menor | Pode ter menos célula, mas maior delay. |
| Mais rápida | melhor | maior | pode ser maior | Pode usar mais lógica e gerar mais switching. |
| Balanceada | médio | médio | melhor contexto | Depende das restrições. |

Por isso o slide diz que é difícil prever consequência de potência no nível arquitetural. A melhor decisão depende de:

- constraints de timing;
- slack disponível;
- atividade de chaveamento;
- largura de dados;
- frequência;
- arquitetura RTL;
- biblioteca disponível;
- objetivo de QoR.

---

## 10. Low power datapath architectures

O primeiro componente do minPower citado pelo slide é:

```text
Low power datapath architectures
```

Objetivo:

- reduzir glitches;
- reduzir switching;
- escolher arquiteturas que consumam menos.

### O que são glitches?

Glitches são transições temporárias indesejadas antes de um sinal estabilizar.

Exemplo conceitual:

```text
Esperado:
0 ─────────────── 1

Com glitch:
0 ─── 1 ─ 0 ───── 1
```

Mesmo que o valor final esteja correto, cada transição extra carrega e descarrega capacitâncias, consumindo potência dinâmica.

Em datapaths grandes, glitches podem ser muito relevantes porque há muitas portas combinacionais em cascata.

Uma arquitetura melhor balanceada pode reduzir chegada desencontrada de sinais e, com isso, reduzir glitches.

---

## 11. Power- and switching-aware datapath structures

O segundo componente citado é:

```text
Power- and switching-aware datapath structures
```

Isso significa que a escolha da estrutura não considera apenas timing e área, mas também o padrão de atividade.

Exemplo conceitual:

```text
Estrutura A:
- Mais rápida.
- Mais nós internos alternando.
- Maior potência.

Estrutura B:
- Atende timing.
- Menos atividade interna.
- Menor potência.
```

A ferramenta pode preferir a Estrutura B se ela cumprir timing e reduzir switching.

---

## 12. Built-in datapath gating

O terceiro componente citado é:

```text
Built-in datapath gating
```

O slide diz:

> Enables datapath gating with no timing overhead.

A ideia é bloquear parte do datapath quando ela não precisa contribuir para o resultado.

Exemplo conceitual:

```text
if (valid)
    result = a + b;
else
    result não precisa ser atualizado
```

Se o hardware puder impedir chaveamento desnecessário em `a + b` quando `valid = 0`, a potência cai.

A vantagem do gating embutido no datapath é que ele pode ser implementado de forma mais inteligente do que simplesmente colocar lógica extra no caminho crítico.

---

## 13. Instantiated low power IP

O slide também cita IPs de baixa potência instanciados:

- **Data tracking**
- **Enhanced clock gating**
- **Datapath gating**

Interpretação:

- `Data tracking`: acompanha quando dados realmente mudam ou são relevantes.
- `Enhanced clock gating`: usa condições mais inteligentes para desligar clock.
- `Datapath gating`: bloqueia computação desnecessária em operadores ou subestruturas.

Isso mostra que minPower não é uma única transformação. É um conjunto de técnicas aplicadas ao datapath.

---

## 14. Como diagnosticar se minPower vale a pena

O slide recomenda verificar o conteúdo de datapath do design.

Depois do primeiro compile:

```tcl
analyze_datapath
```

Depois do compile:

```tcl
report_area -designware
report_resources -hier
```

### Para que serve cada comando?

| Comando | Função |
|---|---|
| `analyze_datapath` | Reporta percentual/conteúdo total de datapath. |
| `report_area -designware` | Mostra área associada a componentes DesignWare. |
| `report_resources -hier` | Mostra recursos inferidos/extraídos hierarquicamente. |

Esses comandos ajudam a responder:

```text
Meu design tem datapath suficiente para justificar minPower?
Quais blocos são aritméticos?
Quanto da área vem de componentes DesignWare?
Onde há potencial de otimização?
```

---

## 15. Como habilitar DesignWare minPower

O comando do slide é:

```tcl
set_app_var power_enable_minpower true
```

E o default é:

```text
false
```

O slide enfatiza que ele deve ser habilitado **antes de `compile_ultra`**.

Fluxo mínimo:

```tcl
set_app_var power_enable_minpower true
compile_ultra
```

Em um fluxo mais realista, ele apareceria junto com TPO, cenários e atividade de chaveamento:

```tcl
set_app_var compile_enable_total_power_optimization true
set_app_var power_enable_minpower true

set_scenario_options -scenarios func.tt_60c \
    -setup true \
    -dynamic_power true

read_saif -input design.saif -instance_name tb/dut

compile_ultra -spg
```

---

# Conceitos difíceis explicados em profundidade

## 1. Diferença entre otimização lógica e otimização física de potência

Uma otimização lógica mexe principalmente em:

- escolha de células;
- reestruturação booleana;
- tamanho de gates;
- mapeamento de operadores;
- clock gating;
- multibit banking.

Uma otimização física mexe ou influencia:

- placement;
- comprimento de nets;
- necessidade de buffers;
- capacitância de fios;
- proximidade entre células relacionadas;
- congestionamento;
- estimativa física de parasitas.

O eLPP pertence ao segundo grupo.

Ele não reduz potência porque “a lógica mudou”. Ele reduz potência porque a implementação física da lógica pode ficar mais curta e menos capacitiva.

---

## 2. Por que nets de alta toggle rate são prioridade

Nem toda net longa é igualmente importante para potência.

Uma net longa que quase nunca alterna pode não consumir tanta potência dinâmica.

Uma net curta que alterna a cada ciclo pode consumir bastante.

Uma net longa e com alta toggle rate é candidata forte para otimização.

A lógica é:

```text
Alta atividade × alta capacitância = alta potência dinâmica
```

Então o eLPP procura reduzir o fator capacitância justamente onde o fator atividade é alto.

---

## 3. Por que TPO precisa estar ativo para eLPP

O eLPP é uma otimização orientada a potência. Se o custo de potência não está habilitado, o placement tenderia a priorizar outras métricas, como timing, área e congestionamento.

O comando:

```tcl
set_app_var compile_enable_total_power_optimization true
```

informa à ferramenta que potência total deve entrar no custo de otimização.

Sem isso, a variável de effort do eLPP pode não produzir o comportamento esperado, porque o fluxo não está rodando em modo power-driven.

---

## 4. O papel de `set_qor_strategy -metric total_power`

O comando:

```tcl
set_qor_strategy -stage synthesis -metric total_power
```

já apareceu em bloco anterior. Aqui o slide reforça que, em modo NDM, `set_qor_strategy -metric total_power` habilita eLPP com effort `low`.

Isso é importante porque `set_qor_strategy` é uma forma mais alta de dizer à ferramenta:

```text
Configure várias opções internas para priorizar esta métrica de QoR.
```

No caso de `total_power`, ele pode ativar automaticamente variáveis relacionadas, em vez de o usuário configurar cada uma manualmente.

---

## 5. Diferença entre DesignWare normal e DesignWare minPower

DesignWare normal já permite mapear operadores complexos para implementações otimizadas.

DesignWare minPower adiciona foco específico em potência.

A diferença conceitual:

```text
DesignWare comum:
    Escolhe/implementa blocos aritméticos eficientes para timing/área.

DesignWare minPower:
    Escolhe/implementa blocos aritméticos considerando também switching, glitches e gating.
```

Isso é especialmente relevante quando o design possui muito datapath.

---

## 6. Por que minPower depende de contexto

Uma arquitetura de baixa potência em um cenário pode não ser a melhor em outro.

Exemplo:

```text
Cenário A: timing folgado
    Pode escolher arquitetura mais lenta e econômica.

Cenário B: timing crítico
    Precisa escolher arquitetura mais rápida, talvez com maior potência.
```

Por isso o slide diz que decisões arquiteturais ótimas dependem de contexto e constraints.

---

# Figuras, diagramas e waveforms importantes

## Página 1 — eLPP via IC Compiler II Link

A primeira página mostra que o recurso eLPP atua durante `compile_ultra -spg`. A figura textual destaca dois comandos centrais:

```tcl
set_app_var compile_enable_total_power_optimization true
set_app_var placer_enhanced_low_power_effort [ none / low / medium / high ]
```

A segunda metade da página mostra as mensagens de confirmação no log:

```text
PWR-1101
PWR-850
```

Essas mensagens devem ser tratadas como evidência de que o fluxo foi realmente ativado.

---

## Página 2 — DesignWare minPower

A segunda página mostra três diagramas conceituais:

1. **Low Power Architecture selection**
   - Escolha de arquitetura com melhor potência dentro das restrições.

2. **Datapath restructuring**
   - Reorganização do datapath para reduzir switching/glitching.

3. **Datapath gating**
   - Bloqueio de computação desnecessária no datapath.

A página também destaca o comando principal:

```tcl
set_app_var power_enable_minpower true
```

E os comandos de análise/report:

```tcl
analyze_datapath
report_area -designware
report_resources -hier
```

---

# Pontos de prova e revisão

## Perguntas prováveis

1. **Qual comando coloca o DC NXT em fluxo com Synopsys Physical Guidance?**

```tcl
compile_ultra -spg
```

2. **O que o eLPP otimiza?**

O posicionamento de células conectadas a nets não-clock com alta taxa de toggle, encurtando essas nets para reduzir potência de switching.

3. **Qual variável habilita Total Power Optimization?**

```tcl
set_app_var compile_enable_total_power_optimization true
```

4. **Qual variável controla o esforço do enhanced low-power placement?**

```tcl
placer_enhanced_low_power_effort
```

5. **Quais valores de esforço aparecem no slide?**

```text
none / low / medium / high
```

6. **Qual comando pode habilitar eLPP com esforço low em modo NDM?**

```tcl
set_qor_strategy -metric total_power
```

7. **Qual mensagem confirma que Total Power Optimization está habilitada?**

```text
Information: Design Compiler NXT Total Power Optimization is enabled. (PWR-1101)
```

8. **Qual mensagem indica otimização de potência dinâmica em cenário?**

```text
PWR-850
```

9. **Para que serve o DesignWare minPower?**

Para otimizar potência em designs intensivos em datapath, usando arquiteturas e estruturas de datapath de menor switching/glitching e recursos como datapath gating.

10. **Qual variável habilita DesignWare minPower?**

```tcl
set_app_var power_enable_minpower true
```

11. **Qual é o default de `power_enable_minpower`?**

```text
false
```

12. **Quais comandos ajudam a analisar conteúdo de datapath?**

```tcl
analyze_datapath
report_area -designware
report_resources -hier
```

---

## Pegadinhas

| Tema | Pegadinha | Correção |
|---|---|---|
| eLPP | Achar que otimiza clock nets | O slide fala em high toggle rate **non-clock** nets. |
| TPO | Achar que eLPP funciona sozinho | eLPP requer Total Power Optimization habilitada. |
| Effort | Achar que qualquer valor habilita | `none` desabilita; `low` ou superior habilita. |
| `set_qor_strategy` | Achar que só muda uma variável | Pode configurar várias opções internas para a métrica escolhida. |
| MCMM | Ignorar cenário de dynamic power | Em MCMM, é preciso verificar cenário de potência dinâmica. |
| Log | Confiar apenas no script | O slide manda verificar mensagens no log. |
| minPower | Achar que serve para qualquer design igualmente | É mais útil em designs intensivos em datapath. |
| Datapath | Achar que é só célula combinacional comum | Datapath inclui estruturas aritméticas como adders, multipliers, shifters e subtractors. |
| Ativação | Ativar minPower depois do compile | O slide manda habilitar antes de `compile_ultra`. |

---

# Relação com projeto/laboratório

Em um lab de DC NXT Low Power, este bloco provavelmente aparece em scripts de síntese física e low power.

Um esqueleto coerente com os slides seria:

```tcl
# 1. Habilitar otimização total de potência
set_app_var compile_enable_total_power_optimization true

# 2. Ativar esforço de enhanced low-power placement
set_app_var placer_enhanced_low_power_effort low

# 3. Opcionalmente habilitar DesignWare minPower para datapath intenso
set_app_var power_enable_minpower true

# 4. Configurar cenário com dynamic power
set_scenario_options -scenarios func.tt_60c \
    -setup true \
    -dynamic_power true

# 5. Ler atividade de chaveamento
read_saif -input design.saif -instance_name tb/dut

# 6. Rodar síntese com physical guidance
compile_ultra -spg

# 7. Verificar datapath e DesignWare
analyze_datapath
report_area -designware
report_resources -hier
```

Depois da execução, deve-se procurar no log:

```text
PWR-1101
PWR-850
place.coarse.enhanced_low_power_effort : low
```

Esses pontos ajudam a confirmar que o script não apenas rodou, mas rodou com as opções de potência esperadas.

---

# Checklist de qualidade

- [x] Texto dos slides foi convertido para texto real.
- [x] Conceitos difíceis foram explicados, não apenas citados.
- [x] Código/comandos foram preservados e explicados.
- [x] Figuras relevantes foram interpretadas.
- [x] O Markdown ficou útil para estudar sem abrir o DOCX.
- [x] O próximo bloco foi indicado ao final.

---

# Próximo bloco

## Bloco 097 — 09 Reporting

**Arquivo para anexar:**

```text
C:\Users\maiko\ci_expert\Aulas2Prints\12 Design Compiler NXT - Low Power\09 Reporting.docx
```

**Faixa:** slides `1-5`

**Salvar Markdown em:**

```text
C:\Users\maiko\ci_expert\mdCursoPt2\12 Design Compiler NXT - Low Power\09 Reporting.md
```
