# 09 Reporting

## Controle do bloco

- **Bloco:** 097
- **Curso:** 12 Design Compiler NXT - Low Power
- **Arquivo de origem:** `C:\Users\maiko\ci_expert\Aulas2Prints\12 Design Compiler NXT - Low Power\09 Reporting.docx`
- **Faixa de slides:** 1-5
- **Caminho sugerido para salvar:**

```text
C:\Users\maiko\ci_expert\mdCursoPt2\12 Design Compiler NXT - Low Power\09 Reporting.md
```

- **Próximo bloco recomendado:** fim da fila principal de aulas. O próximo material existente no roteiro é o lab separado do fluxo principal:

```text
C:\Users\maiko\ci_expert\Aulas2Prints\12 Design Compiler NXT - Low Power\10 Design Compiler NXT - Low Power_2022.03_Lab Guide.docx
```

- **Saída futura sugerida para o lab separado:**

```text
C:\Users\maiko\ci_expert\mdCursoPt2\12 Design Compiler NXT - Low Power\10 Design Compiler NXT - Low Power_2022.03_Lab Guide.md
```

---

## Resumo executivo

Esta aula fecha o curso **Design Compiler NXT - Low Power** explicando como interpretar relatórios de potência. O comando principal é `report_power`, que calcula e apresenta a potência do design em grupos como `clock_network`, `register`, `sequential`, `combinational`, `memory`, `io_pad` e `black_box`.

O ponto mais importante é que **relatório de potência depende diretamente de switching activity**. Se a atividade veio de SAIF, anotação manual ou inferência, o relatório tende a representar melhor o comportamento real. Se faltarem anotações, a ferramenta propaga atividade a partir de pontos conhecidos ou usa valores estimados/default, o que pode distorcer o resultado.

A aula também mostra uma pegadinha forte: antes do CTS, o clock network ainda não está fisicamente construído. Por isso, o `report_power` pode mostrar potência de clock network irrealisticamente alta, especialmente em nets de clock com fanout grande. A recomendação do slide é excluir a switching power do clock network no relatório pre-CTS usando `set_ideal_network`, mantendo ainda a potência interna de ICGs considerada.

Por fim, a aula apresenta `report_power_calculation`, um comando de análise mais detalhada usado para entender como a ferramenta chegou ao valor de potência interna de um pino, leakage de uma célula ou switching power de uma net.

---

# Texto extraído e organizado por slide

## Slide 1 — Performing Power Analysis

### Texto principal extraído

- The `report_power` command calculates and reports power for a design.
  - Needs switching activity information on all design nets.
  - Uses switching activity propagation mechanism to estimate switching activity information on nonannotated design nets based on user-annotated switching activity.

### Comando central

```tcl
report_power
```

### Leitura didática

O `report_power` não é apenas um comando de impressão. Ele calcula e organiza a potência estimada do design. Para isso, ele precisa saber quanto os sinais chaveiam.

A ferramenta tenta preencher lacunas de atividade de três formas principais:

1. usa atividade anotada pelo usuário, por exemplo via SAIF ou `set_switching_activity`;
2. propaga atividade para nets internas a partir dos sinais anotados;
3. usa valores default quando não há informação suficiente.

Isso significa que um relatório de potência pode parecer completo mesmo quando a atividade não é confiável. A pergunta importante não é apenas “o relatório existe?”, mas sim “a atividade usada no relatório representa o design real?”.

### Estrutura típica do relatório

O relatório exibido no slide mostra colunas como:

- **Power Group**;
- **Internal Power**;
- **Switching Power**;
- **Leakage Power**;
- **Total Power**;
- **%** do total;
- **Attrs**, indicando atributos/observações do grupo.

Essas colunas permitem separar onde o consumo está vindo: da lógica interna das células, das nets que chaveiam, do leakage ou da soma total.

---

## Slide 2 — Performing Power Analysis: Power Groups

### Texto principal extraído

The following table has the definition for all power groups:

| Group | Cell types belonging to the group |
|---|---|
| `io_pad` | Cells defined in the `pad_cell_group` in the library |
| `memory` | Cells defined in the `memory` group in the library |
| `black_box` | Cells that do not have any functional description in the library |
| `clock_network` | Cells in the clock network, excluding the `io_pad` cells |
| `register` | Latches and flip-flops driven by the clock network, excluding the `io_pad` and `black_box` cells |
| `sequential` | Latches and flip-flops clocked by signals that are not in the clock network |
| `combinational` | Cells that have a functional description and are not sequential cells |

The `-group` option in `report_power` reports a single power group:

```tcl
dcnxt_shell> report_power -group $group [-net] [-cell]
```

### Leitura didática

O `report_power` organiza a potência por grupos para facilitar a interpretação. Em vez de entregar apenas um número total, ele separa o consumo por categoria funcional.

Essa separação é essencial porque cada grupo tem causas e soluções diferentes:

- se o problema está em `clock_network`, técnicas como clock gating, CTS e tratamento pre-CTS são relevantes;
- se está em `register`, pode envolver clock gating, self-gating ou multibit banking;
- se está em `combinational`, pode envolver sizing, restructuring, placement, datapath optimization ou DesignWare minPower;
- se está em `memory`, a solução pode depender de macro, arquitetura e modos de operação;
- se está em `black_box`, o relatório pode estar incompleto ou depender de modelos externos.

### Uso de `-group`

Quando o relatório total está grande demais, você pode focar em um grupo específico:

```tcl
report_power -group clock_network
```

ou, quando quiser detalhar por nets ou células:

```tcl
report_power -group clock_network -net
report_power -group register -cell
```

A opção `-net` ajuda a enxergar nets responsáveis por switching power. A opção `-cell` ajuda a enxergar células responsáveis por internal/leakage power.

---

## Slide 3 — Pre-CTS Power Report

### Texto principal extraído

- Clock network power groups does not have a special treatment when calculating power, however, there are two variables that affect the power estimation:
  - Input net transition time is 0 (ideal) by default in all clock nets.
    - Internal power is calculated based on output net capacitance and input pin transition time.
  - Clock nets with high fanout can lead to an unrealistic and high switching power.

Notas laterais do slide:

- Capacitance simplification in nets with fanout greater than 100 causes unrealistic power.
- Any actual power improvement is negligible compared to large percentage of clock network power.

### Leitura didática

Este é o slide mais importante da aula em termos de pegadinha prática.

Antes do CTS, isto é, antes da construção real da árvore de clock, a rede de clock ainda não representa fielmente o que existirá no layout final. O clock pode aparecer como uma net de fanout enorme alimentando muitos registradores. Isso cria uma estimativa artificialmente grande de capacitância e, portanto, de switching power.

Como a potência dinâmica depende de atividade e capacitância, uma net de clock com fanout gigante pode dominar o relatório:

```text
clock net com fanout muito alto
        ↓
capacitância estimada muito alta
        ↓
switching power de clock network irrealisticamente alta
        ↓
relatório pre-CTS fica distorcido
```

O problema não é que clock não consome potência. Clock normalmente consome muita potência. O problema é que, **pre-CTS**, a representação da rede de clock ainda é idealizada ou simplificada demais para ser usada como estimativa realista de clock tree power.

### Por que fanout alto distorce a potência

Uma net com fanout maior que 100 pode ter simplificações de capacitância. Em vez de representar uma árvore de buffers real, a ferramenta pode enxergar uma carga concentrada muito grande. Isso pode produzir um número de switching power que não corresponde ao clock tree final.

Por isso, uma “melhoria” que pareça reduzir uma pequena parte do consumo real pode parecer irrelevante no relatório, porque o clock network aparece artificialmente gigantesco.

---

## Slide 4 — Pre-CTS Power Report: `set_ideal_network`

### Texto principal extraído

- It is recommended to exclude clock network switching power when reporting pre-CTS power.
  - `set_ideal_network` can be used to reduce wire and pin capacitance to zero in order to reduce clock network switching power to zero.
  - Removing the clock network switching power when reporting pre-CTS power avoids unrealistic power due to high fanout nets or unbuffered nets.

Comando mostrado no slide:

```tcl
dcnxt_shell> set_ideal_network -no_propagate [get_nets -of [all_fanout -flat -clock_tree]]
dcnxt_shell> report_power
```

Notas laterais do slide:

- Clock network switching power is zero due to `set_ideal_network`.
- ICG internal power is still considered.

### Leitura didática

A recomendação é tratar a rede de clock como ideal para fins de relatório pre-CTS, removendo a switching power das nets de clock.

O comando:

```tcl
set_ideal_network -no_propagate [get_nets -of [all_fanout -flat -clock_tree]]
```

seleciona as nets relacionadas à clock tree e as marca como ideais, com `-no_propagate`. O objetivo aqui não é “enganar” a ferramenta para fingir que clock não consome potência. O objetivo é evitar que a estimativa pre-CTS seja dominada por um clock network ainda não construído fisicamente.

Depois disso, ao rodar:

```tcl
report_power
```

a switching power associada às nets de clock cai para zero no relatório pre-CTS.

### O que continua sendo considerado

O slide deixa claro que a potência interna dos ICGs continua sendo considerada.

Isso é importante porque clock gating não é gratuito. A célula ICG tem lógica interna, latch, enable, capacitância e consumo. Mesmo que a switching power das nets de clock seja zerada para evitar distorção pre-CTS, a ferramenta ainda contabiliza a potência interna das células de clock gating.

Em termos práticos:

```text
set_ideal_network no clock pre-CTS
    remove: switching power irrealística das clock nets
    mantém: internal/leakage power das células, incluindo ICGs
```

---

## Slide 5 — Report Power Calculation

### Texto principal extraído

- Use `report_power_calculation` command to display the calculation of the internal power for a pin, the leakage power for a cell, or the switching power for a net.
- It is highly recommended to use the option `-verbose` to increase the amount of information displayed.
- This command is supported by IC Compiler II.

Exemplo mostrado no slide:

```tcl
dcnxt_shell> report_power_calculation [get_cells U9] -verbose
```

### Leitura didática

O `report_power` responde “quanto deu”. O `report_power_calculation` ajuda a responder “por que deu esse valor”.

Ele é útil quando você quer investigar:

- por que uma célula tem leakage alto;
- por que um pino tem internal power alto;
- por que uma net tem switching power alto;
- quais condições de estado, probabilidade e transição foram usadas no cálculo;
- se a atividade anotada está coerente com o valor final.

A opção `-verbose` é recomendada porque mostra mais detalhes da fórmula, dos estados considerados, das probabilidades e dos parâmetros usados.

---

# Aula didática desenvolvida

## 1. O que significa “reportar potência” em síntese

Em um fluxo de low power, o relatório de potência não é apenas uma tabela final. Ele é uma ferramenta de decisão.

Ele responde perguntas como:

- O clock network domina o consumo?
- A potência está concentrada em registradores?
- A lógica combinacional está chaveando demais?
- O leakage é relevante neste cenário?
- O resultado melhorou depois de clock gating, self-gating ou multibit banking?
- A atividade usada no cálculo é confiável?

Sem relatório, não existe como saber se a otimização realmente funcionou. Mas relatório ruim pode levar a conclusões erradas. Por isso esta aula foca não só no comando, mas também nas armadilhas de interpretação.

---

## 2. As três parcelas do relatório de potência

O `report_power` normalmente separa potência em três colunas principais:

```text
Internal Power + Switching Power + Leakage Power = Total Power
```

### Internal Power

É potência interna da célula. Inclui energia consumida dentro da célula quando ela chaveia.

Exemplos:

- energia interna de uma porta lógica durante transição;
- energia de curto momentâneo entre VDD e GND;
- energia interna associada a pinos e arcos da célula;
- consumo interno de ICGs.

### Switching Power

É potência associada à carga e descarga de capacitâncias das nets.

Exemplos:

- uma saída dirigindo muitos fanouts;
- uma net longa;
- uma net de clock;
- uma net de dados com alta atividade.

### Leakage Power

É potência de fuga, mesmo sem chaveamento.

Depende de:

- tipo de célula;
- Vt;
- estado lógico;
- temperatura;
- corner;
- biblioteca.

---

## 3. Por que switching activity é obrigatória

O slide reforça que `report_power` precisa de switching activity em todas as nets do design.

Isso conversa diretamente com os blocos anteriores:

- SAIF é a forma recomendada de trazer atividade real de simulação;
- `set_switching_activity` permite anotação manual;
- `infer_switching_activity` tenta inferir atividade em pontos não anotados;
- a ferramenta propaga atividade para nets internas.

A potência dinâmica depende de atividade. Uma net com capacitância alta mas que quase nunca alterna pode consumir pouco. Uma net com capacitância moderada mas que alterna o tempo todo pode consumir muito.

Por isso, sem switching activity confiável, o relatório pode ser matematicamente completo, mas semanticamente fraco.

---

## 4. Como interpretar os power groups

Os power groups ajudam a transformar uma tabela grande em diagnóstico.

### `clock_network`

Agrupa células da rede de clock, excluindo `io_pad`.

É importante porque clock costuma ter alta atividade e grande distribuição. Mas em relatórios pre-CTS pode ficar irrealisticamente alto.

### `register`

Agrupa latches e flip-flops dirigidos pela clock network.

É onde técnicas como clock gating, self-gating e multibit banking têm impacto direto.

### `sequential`

Agrupa latches e flip-flops clockados por sinais que não pertencem à clock network.

Essa categoria pode aparecer quando há clock não reconhecido como clock network, sinais derivados, clocks locais ou estruturas sequenciais especiais.

### `combinational`

Agrupa células funcionais não sequenciais.

É relevante para otimizações como sizing, restructuring, datapath restructuring, DesignWare minPower e redução de atividade.

### `memory`

Agrupa células definidas como memória na biblioteca.

Aqui, a otimização pode não estar totalmente sob controle da síntese lógica, especialmente quando se trata de macros.

### `black_box`

Agrupa células sem descrição funcional na biblioteca.

Se aparecer potência relevante em `black_box`, é sinal de que modelos, estimativas ou anotações precisam ser verificados.

### `io_pad`

Agrupa células definidas como pads de I/O na biblioteca.

Pode ser relevante em designs top-level, mas em muitos blocos internos aparece com pouco impacto.

---

## 5. A grande pegadinha do relatório pre-CTS

Antes do CTS, a rede de clock ainda não foi construída de verdade.

O CTS, ou Clock Tree Synthesis, insere buffers, balanceia latências, controla skew e transforma o clock em uma árvore física realista. Antes disso, a rede de clock pode aparecer como uma estrutura simplificada, com fanout enorme e capacitância estimada de forma grosseira.

Isso afeta o `report_power` porque:

```text
switching power ≈ atividade × capacitância × V² × frequência
```

Se a capacitância de uma net de clock pre-CTS é superestimada por causa de fanout alto, a switching power também será superestimada.

O resultado é um relatório onde o clock network parece enorme demais. Isso pode mascarar ganhos reais em outras partes do design.

---

## 6. Por que usar `set_ideal_network` no pre-CTS power report

A recomendação do slide é excluir clock network switching power quando reportar potência pre-CTS.

O comando:

```tcl
set_ideal_network -no_propagate [get_nets -of [all_fanout -flat -clock_tree]]
```

faz a ferramenta tratar essas nets como ideais para o cálculo de capacitância de wire/pin, reduzindo a switching power do clock network para zero.

Esse procedimento é útil para comparar o impacto de otimizações de lógica sem deixar que uma estimativa pre-CTS distorcida domine a tabela.

Mas isso deve ser entendido corretamente:

- não significa que clock power real é zero;
- não substitui análise pós-CTS;
- não elimina internal power de ICGs;
- serve para evitar uma distorção conhecida em relatório pre-CTS.

---

## 7. O papel do `report_power_calculation`

Quando um número parece estranho, o próximo passo não é apenas rodar outro `report_power`. O ideal é investigar o cálculo.

O comando:

```tcl
report_power_calculation [get_cells U9] -verbose
```

permite enxergar detalhes de como a potência foi calculada.

O slide mostra exemplos de cálculo state-dependent, como:

- leakage dependente do estado da célula;
- potência interna dependente de rise/fall, transição e toggle rate;
- probabilidades de estado usadas na ponderação.

Esse comando é especialmente útil para debug quando:

- uma célula aparece com leakage muito alto;
- uma net aparece com switching power inesperada;
- um pino aparece com internal power dominante;
- suspeita-se que a atividade ou probabilidade está errada.

---

# Conceitos difíceis explicados em profundidade

## `report_power`

### O que é

Comando que calcula e reporta potência do design.

### Por que existe

Para avaliar o consumo estimado do circuito e medir o impacto de otimizações de low power.

### Onde aparece no fluxo

Após setup de bibliotecas, constraints, cenários e atividade de chaveamento. Também pode ser usado antes e depois de otimizações para comparação.

### Exemplo

```tcl
report_power
report_power -group clock_network
report_power -group register -cell
report_power -group combinational -net
```

### Erros comuns

- Comparar relatórios com atividades diferentes.
- Confiar em relatório pre-CTS de clock network sem considerar distorção de fanout.
- Ignorar grupos e olhar apenas o total.
- Não verificar se SAIF ou switching activity foram aplicados corretamente.

---

## Power groups

### O que são

Categorias usadas pela ferramenta para agrupar células e reportar potência.

### Por que existem

Porque o valor total sozinho não mostra a causa do consumo.

### Como usar

Se `clock_network` domina, investigar clock, clock gating, CTS e ideal network pre-CTS.

Se `register` domina, investigar clock gating, self-gating e multibit.

Se `combinational` domina, investigar atividade de dados, datapath, sizing e restructuring.

---

## Pre-CTS power

### O que é

Relatório de potência antes da construção da clock tree.

### Por que é delicado

Porque a rede de clock ainda não está fisicamente realista. Nets de clock podem aparecer com fanout muito alto e capacitância irreal.

### Erro comum

Interpretar switching power do clock network pre-CTS como se fosse potência final de clock.

### Boa prática do slide

Usar `set_ideal_network` para excluir a switching power do clock network em relatório pre-CTS.

---

## `set_ideal_network`

### O que é

Comando usado para marcar uma rede como ideal, removendo a influência de capacitâncias de wire/pin no cálculo.

### No contexto da aula

É usado para reduzir clock network switching power a zero no relatório pre-CTS.

### Comando do slide

```tcl
set_ideal_network -no_propagate [get_nets -of [all_fanout -flat -clock_tree]]
report_power
```

### Cuidado

Não use essa conclusão como substituto para relatório pós-CTS. Ela serve para evitar distorção antes do CTS.

---

## `report_power_calculation`

### O que é

Comando de investigação detalhada do cálculo de potência.

### O que pode mostrar

- potência interna de um pino;
- leakage power de uma célula;
- switching power de uma net;
- dados de estado e probabilidade usados no cálculo;
- informações adicionais com `-verbose`.

### Exemplo

```tcl
report_power_calculation [get_cells U9] -verbose
```

### Quando usar

Quando o `report_power` mostra um número inesperado e você precisa entender a origem exata do cálculo.

---

# Figuras, diagramas e relatórios importantes

## Figura do slide 1 — Estrutura do `report_power`

A figura mostra um relatório com cabeçalho e tabela por power group. A parte relevante é a separação entre internal, switching, leakage e total power.

A leitura correta é: não basta olhar o total. É preciso identificar qual grupo domina e qual parcela domina dentro do grupo.

---

## Figura do slide 3 — Clock network exagerado pre-CTS

A figura destaca que clock network pode aparecer com uma porcentagem enorme do consumo total. O slide alerta que essa porcentagem pode ser irrealista antes do CTS, devido a fanout alto e simplificações de capacitância.

---

## Figura do slide 4 — Efeito de `set_ideal_network`

A figura mostra que, após aplicar `set_ideal_network`, a switching power do clock network cai para zero. Ao mesmo tempo, o slide observa que a internal power dos ICGs continua considerada.

Isso é exatamente o comportamento desejado para evitar distorção pre-CTS sem apagar totalmente o custo das células de clock gating.

---

## Figura do slide 5 — `report_power_calculation -verbose`

A figura mostra uma saída detalhada com cálculos state-dependent. Ela ilustra que a ferramenta não tira os números “do nada”: ela pondera estados, probabilidades, energia interna, toggle rate e dados de biblioteca.

---

# Pontos de prova e revisão

## Perguntas prováveis

1. **Qual comando calcula e reporta potência no Design Compiler NXT?**

```tcl
report_power
```

2. **O que o `report_power` precisa para calcular potência dinâmica corretamente?**

Precisa de switching activity nas nets do design.

3. **O que acontece em nets sem anotação de atividade?**

A ferramenta usa propagação de switching activity a partir de pontos anotados e/ou valores estimados/default.

4. **Para que serve a opção `-group` em `report_power`?**

Para reportar um único power group.

5. **Quais são alguns power groups mostrados na aula?**

`io_pad`, `memory`, `black_box`, `clock_network`, `register`, `sequential`, `combinational`.

6. **Por que o relatório pre-CTS de clock network pode ser irrealista?**

Porque antes do CTS a rede de clock pode ter fanout alto e capacitância estimada de forma simplificada, gerando switching power exagerada.

7. **Qual comando o slide recomenda para excluir clock network switching power no relatório pre-CTS?**

```tcl
set_ideal_network -no_propagate [get_nets -of [all_fanout -flat -clock_tree]]
```

8. **Ao usar `set_ideal_network`, a potência interna dos ICGs some?**

Não. O slide indica que ICG internal power ainda é considerada.

9. **Para que serve `report_power_calculation`?**

Para mostrar detalhes do cálculo da potência interna de um pino, leakage de uma célula ou switching power de uma net.

10. **Qual opção é recomendada com `report_power_calculation`?**

```tcl
-verbose
```

---

# Pegadinhas importantes

| Tema | Pegadinha | Correção |
|---|---|---|
| `report_power` | Achar que o relatório é confiável sem atividade de chaveamento | Potência dinâmica depende de switching activity |
| Nets não anotadas | Achar que são ignoradas | A ferramenta propaga atividade ou usa default |
| Power groups | Olhar só o total | É preciso identificar o grupo dominante |
| Pre-CTS clock | Achar que clock network pre-CTS é potência final real | Pode ser irreal por fanout alto e falta de CTS |
| `set_ideal_network` | Achar que clock real passa a consumir zero | É apenas uma técnica para relatório pre-CTS |
| ICGs | Achar que `set_ideal_network` remove todo custo de clock gating | ICG internal power continua considerada |
| `report_power_calculation` | Achar que só existe no DC NXT | O slide diz que o comando é suportado pelo IC Compiler II |
| Comparação de runs | Comparar power com atividades diferentes | Comparações precisam usar atividade de mesma qualidade/precisão |

---

# Relação com projeto/laboratório

Em um script de síntese low power, esta aula se conecta ao ponto final do fluxo: medir o resultado.

Um fluxo prático poderia ter esta estrutura:

```tcl
# 1. Configurar cenários e potência dinâmica
set_scenario_options -scenarios func.tt_60c \
    -setup true \
    -dynamic_power true \
    -leakage_power true

# 2. Ler atividade de chaveamento
read_saif design_sim.saif

# 3. Rodar síntese/otimização
compile_ultra -gate_clock -spg

# 4. Reportar potência total
report_power

# 5. Focar em grupos específicos
report_power -group clock_network
report_power -group register -cell
report_power -group combinational -net

# 6. Em pre-CTS, evitar distorção de clock network
set_ideal_network -no_propagate [get_nets -of [all_fanout -flat -clock_tree]]
report_power

# 7. Investigar cálculo detalhado quando necessário
report_power_calculation [get_cells U9] -verbose
```

No laboratório, este bloco deve ser usado para responder perguntas como:

- O ganho de clock gating apareceu em `clock_network`, `register` ou ambos?
- O relatório foi feito antes ou depois do CTS?
- A potência de clock network está realista ou dominada por fanout pre-CTS?
- O SAIF foi lido corretamente?
- O relatório está usando atividade anotada, propagada ou default?
- Se um valor parece estranho, qual célula/net/pino explica esse número?

---

# Checklist de qualidade

- [x] Texto dos slides foi convertido para texto real.
- [x] Conceitos difíceis foram explicados, não apenas citados.
- [x] Código/comandos foram preservados e explicados.
- [x] Figuras relevantes foram interpretadas.
- [x] O Markdown ficou útil para estudar sem abrir o DOCX.
- [x] O próximo bloco/material foi indicado ao final.

---

# Continuação recomendada

A fila principal de aulas termina no **Bloco 097 — 09 Reporting**.

O próximo material listado no roteiro é um **lab separado do fluxo principal**:

```text
C:\Users\maiko\ci_expert\Aulas2Prints\12 Design Compiler NXT - Low Power\10 Design Compiler NXT - Low Power_2022.03_Lab Guide.docx
```

Saída futura sugerida:

```text
C:\Users\maiko\ci_expert\mdCursoPt2\12 Design Compiler NXT - Low Power\10 Design Compiler NXT - Low Power_2022.03_Lab Guide.md
```
