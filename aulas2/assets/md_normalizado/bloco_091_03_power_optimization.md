# 03 Power Optimization

## Controle do bloco

- **Bloco:** 091
- **Curso:** 12 Design Compiler NXT - Low Power
- **Arquivo de origem:** `C:\Users\maiko\ci_expert\Aulas2Prints\12 Design Compiler NXT - Low Power\03 Power Optimization.docx`
- **Faixa de slides:** 1-7
- **Caminho sugerido para salvar:**

```text
C:\Users\maiko\ci_expert\mdCursoPt2\12 Design Compiler NXT - Low Power\03 Power Optimization.md
```

- **Próximo bloco recomendado:** 092 — `04 Clock Gating`
- **Arquivo do próximo bloco:**

```text
C:\Users\maiko\ci_expert\Aulas2Prints\12 Design Compiler NXT - Low Power\04 Clock Gating.docx
```

- **Caminho sugerido para salvar o próximo Markdown:**

```text
C:\Users\maiko\ci_expert\mdCursoPt2\12 Design Compiler NXT - Low Power\04 Clock Gating.md
```

---

## Resumo executivo

Esta aula mostra como habilitar e interpretar a **Total Power Optimization (TPO)** no Design Compiler NXT. A ideia principal é fazer a síntese deixar de otimizar apenas timing, área e DRC lógico, e passar a considerar **leakage power** e **dynamic power** como parte de um custo único de otimização.

O ponto mais importante é que a otimização total de potência não acontece de forma completa só porque o design está sendo compilado. Para o DC NXT otimizar potência dinâmica, o fluxo precisa ter pelo menos um cenário com `-setup true` e `-dynamic_power true`, além de ativar a estratégia de QoR com métrica `total_power` ou habilitar explicitamente a variável `compile_enable_total_power_optimization`.

A aula também separa a otimização total de potência das técnicas específicas de low power. TPO é o mecanismo geral que combina custos de leakage e dinâmica, mas existem recursos independentes que também melhoram potência, como **clock gating**, **self-gating**, **multibit**, **IC Compiler II Link enhanced low-power placement** e **DesignWare minPower**.

---

## Texto extraído e organizado por slide

## Slide 1 — Enable Total Power Optimization

### Texto do slide

Para habilitar o fluxo de otimização baseado em potência total e aplicar configurações da ferramenta aprendidas a partir de experiências com clientes:

- Habilite pelo menos um cenário de **dynamic setup** se Multi-Corner Multi-Mode for usado.

```tcl
create_scenario s2
set_scenario_options -setup true -dynamic_power true \
    -leakage_power true|false
```

- Use `set_qor_strategy` com a métrica `total_power`:

```tcl
set_qor_strategy -stage synthesis -metric total_power
```

Observações do slide:

- As configurações de `-metric timing` também são usadas.
- `compile_enable_total_power_optimization` é habilitada.

### Leitura didática

Este slide mostra o caminho recomendado para ativar a otimização total de potência no fluxo de síntese. Existem dois níveis de configuração:

1. **Configuração de cenário**, dizendo em qual cenário a ferramenta deve considerar potência dinâmica e setup.
2. **Configuração de estratégia de QoR**, dizendo que a etapa de síntese deve mirar a métrica `total_power`.

A parte de cenário é essencial porque potência dinâmica depende de atividade de chaveamento e de dados de timing. Por isso o slide liga `-dynamic_power true` com `-setup true`.

---

## Slide 2 — Total Power Optimization with `set_qor_strategy`

### Texto do slide

O slide mostra a execução:

```tcl
dcnxt_shell> set_qor_strategy -stage synthesis -metric total_power
```

A tabela da ferramenta lista opções associadas ao grupo de métrica `total_power`, comparando:

- nome da opção;
- grupo de métrica;
- valor default da ferramenta;
- configuração atual;
- configuração-alvo da estratégia.

Entre as opções mostradas estão:

```text
compile_enable_total_power_optimization
compile_timing_high_effort
placer_max_driver
compile_timing_high_effort_tns
compile_enhanced_tns_optimization_in_incremental
compile_optimize_netlist_area_in_incremental
placer_enhanced_low_power_effort
placer_disable_register_control
placer_buffering_aware
```

### Leitura didática

O comando `set_qor_strategy` é uma forma de aplicar um pacote coerente de configurações de otimização. Quando a métrica escolhida é `total_power`, o DC NXT ajusta diversas opções internas para tentar melhorar potência sem abandonar timing.

O detalhe importante do slide é que a estratégia de `total_power` também reaproveita configurações da métrica `timing`. Isso evita uma interpretação errada: otimizar potência não significa ignorar timing. A ferramenta continua precisando fechar timing e corrigir DRCs lógicos.

A estratégia `total_power` atua como uma camada de orientação para a síntese: ela avisa que, entre implementações logicamente equivalentes e temporalmente válidas, a ferramenta deve preferir soluções com menor potência total.

---

## Slide 3 — Total Power Optimization (TPO)

### Texto do slide

Para incluir custos de potência dinâmica na otimização total:

```tcl
set_app_var compile_enable_total_power_optimization true
```

Default: `false`.

O slide afirma:

- Leakage e dynamic power são combinadas em um único custo.
- A ferramenta executa múltiplas otimizações power-aware, como:
  - power-aware sizing;
  - low-power placement;
  - power-aware sequential mapping;
  - bundle cell optimization.

### Requisitos listados

- Habilitar **Synopsys Physical Guidance (SPG)** no `compile_ultra`.
- Habilitar pelo menos um cenário para otimização de potência dinâmica em fluxo MCMM.
- Habilitar análise/otimização de setup para cada cenário de potência dinâmica.
- Recomendado: fornecer atividade de chaveamento RTL para cada cenário de potência dinâmica.

### Leitura didática

Este é o slide central da aula. Ele define TPO como a otimização em que leakage e dinâmica deixam de ser tratadas isoladamente e passam a compor um custo único.

A variável principal é:

```tcl
set_app_var compile_enable_total_power_optimization true
```

Sem ela, a otimização de potência dinâmica não é ativada por padrão. O curso reforça isso porque o aluno pode confundir com leakage: leakage já aparecia como componente de custo em `compile_ultra`, mas dynamic power precisa ser ativada.

---

## Slide 4 — Example: `report_power`

### Texto do slide

O exemplo usa:

```tcl
dcnxt_shell> topo> report_power -scenario func.ff_040c
```

A ferramenta informa:

```text
Information: Propagating switching activity \
(low effort zero delay simulation). (PWR-6)
```

O relatório apresenta colunas de potência por grupo:

```text
Power Group | Internal Power | Switching Power | Leakage Power | Total Power | % | Attrs
```

Grupos visíveis no relatório:

```text
io_pad
memory
black_box
clock_network
register
sequential
combinational
```

A linha final apresenta o total do design.

### Leitura didática

Este slide ensina como interpretar o relatório de potência. O `report_power` separa a potência por blocos ou grupos funcionais do design.

A tabela tem três parcelas principais:

- **Internal Power:** potência interna das células.
- **Switching Power:** potência de carga e descarga de nets/capacitâncias externas.
- **Leakage Power:** potência estática de fuga.

O relatório também mostra a porcentagem de contribuição de cada grupo para o total. No exemplo do slide, a memória aparece como o maior grupo, com mais da metade da potência reportada. Registros, lógica sequencial e lógica combinacional também aparecem como grupos relevantes. O clock network aparece com parcela menor no exemplo, mas em designs reais pode ser um alvo muito importante, especialmente quando há muitos flip-flops alternando.

A mensagem `PWR-6` indica que a ferramenta está propagando atividade de chaveamento usando uma simulação zero-delay de baixo esforço. Isso normalmente acontece quando a atividade não está totalmente anotada em todos os pontos e a ferramenta precisa derivar/propagar parte das informações.

---

## Slide 5 — Multiple Modes and Corners: Dominant Power Scenario

### Texto do slide

O modo topográfico executa automaticamente **scenario reduction** sobre o conjunto atual de cenários ativos para reduzir memória e runtime.

O slide afirma:

- O cenário dominante é sempre o pior cenário de timing.
- Mas o pior cenário de timing nem sempre é o pior cenário de potência.
- O Design Compiler NXT adiciona um cenário dominante extra de potência quando o cenário dominante de timing não corresponde ao cenário dominante de potência.

Também afirma:

- O cenário dominante adicional de potência é inferido a partir dos cenários ativos que têm a opção `dynamic_power` habilitada.
- Use o relatório de resumo de redução de cenários emitido durante o compile para verificar quais cenários dominantes foram selecionados.

### Leitura didática

Em fluxos MCMM, o design pode ter muitos cenários:

```text
modo funcional + corner rápido + temperatura alta
modo funcional + corner lento + temperatura baixa
modo scan + corner rápido
modo baixo consumo + tensão reduzida
...
```

Analisar e otimizar todos os cenários com o mesmo peso pode ser caro em runtime e memória. Por isso a ferramenta faz **scenario reduction**, escolhendo cenários dominantes que representam os casos mais críticos.

A pegadinha do slide é esta:

```text
pior cenário de timing ≠ necessariamente pior cenário de potência
```

Um cenário pode ser crítico para setup, mas não ser o que mais consome. Por exemplo:

- pior timing pode ocorrer em um corner lento;
- pior leakage pode ocorrer em temperatura alta;
- pior dinâmica pode ocorrer em cenário com maior atividade ou frequência.

Por isso, quando TPO está ativa, o DC NXT pode manter um cenário dominante para timing e adicionar outro cenário dominante para potência.

---

## Slide 6 — Additional Power Optimization Features

### Texto do slide

`compile_enable_total_power_optimization` é a variável de aplicação principal e única para habilitar power-aware optimization.

Além disso, o Design Compiler NXT possui recursos independentes que podem melhorar potência:

- Clock Gating
- Self-gating
- Multibit
- IC Compiler II Link: Enhanced Low-Power placement
- DesignWare minPower

### Leitura didática

Este slide separa duas coisas que podem se confundir:

1. **TPO:** fluxo geral de otimização que combina leakage e dynamic power.
2. **Recursos específicos:** técnicas independentes que atacam fontes particulares de consumo.

TPO não substitui clock gating, multibit ou DesignWare minPower. Ela é o guarda-chuva geral de custo de potência. As outras técnicas são mecanismos concretos que podem reduzir capacitância, atividade de clock, número de células, carga de rede ou custo de implementação.

---

## Slide 7 — Power-Focused Technology Summary

### Texto do slide/figura

A figura organiza tecnologias de baixo consumo ao longo dos eixos:

```text
Area
Power
Timing
```

Principais grupos da figura:

### Clock Gating

- Multistage
- Extraction through Hierarchies
- Self Gating
- Placement Aware

### Multibit

- RTL Inference
- Physically-Aware Multibit
- Timing-Aware Multibit Debanking

### Total Power Optimization

- Low-Power placement
- Power-Driven Re-structuring
- Power-aware sequential mapping
- IC Compiler II Link Enhanced Low-Power placement

### DesignWare

- minPower

### Leitura didática

A figura mostra que low power não é uma única técnica. É uma família de otimizações distribuídas entre síntese lógica, mapeamento sequencial, posicionamento físico, tratamento de clock e escolha de IPs.

A mensagem visual é que potência interage com área e timing. Uma otimização que reduz power pode aumentar área, piorar timing ou exigir reestruturação. Por isso a ferramenta precisa trabalhar com tradeoffs, e não com uma regra simples do tipo “sempre usar célula menor” ou “sempre usar célula high-Vt”.

---

# Aula didática desenvolvida

## 1. O que significa otimizar potência total

Potência total em CMOS é a soma de duas grandes componentes:

```text
Total Power = Leakage Power + Dynamic Power
```

A aula anterior já mostrou que leakage é o consumo por correntes de fuga, enquanto dynamic power aparece quando o circuito alterna sinais.

Nesta aula, o ponto novo é: o Design Compiler NXT pode combinar esses dois custos em uma única função de otimização.

Isso significa que a ferramenta passa a comparar alternativas como:

```text
Implementação A:
- fecha timing
- área média
- leakage menor
- dinâmica maior

Implementação B:
- fecha timing
- área um pouco maior
- leakage maior
- dinâmica menor
```

Com TPO habilitada, a ferramenta tenta escolher a alternativa com melhor custo total, respeitando as prioridades principais do fluxo: legalidade lógica, DRCs, timing e constraints.

---

## 2. Por que TPO não é simplesmente “reduzir tudo”

Uma visão ingênua seria pensar:

```text
Para reduzir potência, basta usar células menores, mais lentas e menos vazadoras.
```

Mas isso não funciona sempre.

Exemplos de conflitos:

- Célula menor reduz capacitância, mas pode piorar slew e timing.
- Célula high-Vt reduz leakage, mas aumenta delay.
- Menos buffers reduzem capacitância, mas podem piorar transição e setup.
- Clock gating economiza dinâmica, mas adiciona lógica de controle.
- Multibit reduz clock power, mas pode afetar placement e debanking.

Por isso a otimização de potência é um problema de tradeoff. O DC NXT precisa equilibrar potência, timing, área e DRCs.

---

## 3. Ativação de cenário: `set_scenario_options`

O primeiro comando do slide é:

```tcl
create_scenario s2
set_scenario_options -setup true -dynamic_power true \
    -leakage_power true|false
```

A leitura correta é:

- `create_scenario s2`: cria um cenário chamado `s2`.
- `-setup true`: habilita análise/otimização de setup nesse cenário.
- `-dynamic_power true`: habilita cálculo/otimização de potência dinâmica nesse cenário.
- `-leakage_power true|false`: habilita ou desabilita leakage power naquele cenário, conforme a intenção do fluxo.

O ponto crítico é que, para potência dinâmica, `-setup true` não é detalhe. O cálculo de potência interna depende de transições/slew e informação de timing. Sem o cenário configurado para setup, a ferramenta não tem a base completa para estimar internal power.

---

## 4. Ativação por estratégia: `set_qor_strategy`

O comando:

```tcl
set_qor_strategy -stage synthesis -metric total_power
```

aplica uma estratégia de QoR para a etapa de síntese com foco em potência total.

`QoR` significa **Quality of Results**. No contexto do Design Compiler NXT, uma estratégia de QoR é um conjunto de opções internas da ferramenta voltadas para uma métrica principal.

Quando se usa:

```tcl
-metric total_power
```

a ferramenta ativa um conjunto de configurações relacionadas a potência total, incluindo a variável:

```tcl
compile_enable_total_power_optimization
```

O slide também diz que as configurações de `-metric timing` são usadas. Isso quer dizer que a estratégia de potência não abandona as técnicas de timing; ela adiciona consciência de potência sobre uma base ainda preocupada com fechamento temporal.

---

## 5. Ativação direta por variável: `compile_enable_total_power_optimization`

A variável principal da TPO é:

```tcl
set_app_var compile_enable_total_power_optimization true
```

O default é:

```text
false
```

Isso significa que dynamic power optimization não é ativada por padrão.

Quando essa variável é ativada:

- leakage e dynamic power são combinadas em um único custo;
- a ferramenta pode aplicar otimizações conscientes de potência;
- o compile passa a considerar potência dinâmica como parte da tomada de decisão.

Atenção: isso não dispensa a configuração dos cenários. Em MCMM, você ainda precisa ter pelo menos um cenário com `-dynamic_power true` e `-setup true`.

---

## 6. O que é power-aware sizing

**Power-aware sizing** significa alterar o tamanho das células considerando impacto em potência, não apenas timing.

Exemplo simples:

```text
INV_X8 -> INV_X4 -> INV_X2
```

Se uma célula está muito forte para a carga que dirige, ela pode consumir mais potência do que o necessário. A ferramenta pode reduzir o drive strength, desde que timing, transição e capacitância continuem aceitáveis.

Mas o contrário também pode acontecer: às vezes aumentar uma célula reduz slew ruim e melhora potência interna em células downstream. Por isso power-aware sizing não é apenas “diminuir célula”; é escolher o tamanho com melhor custo total.

---

## 7. O que é low-power placement

**Low-power placement** tenta posicionar células considerando potência.

A posição física afeta:

- comprimento de nets;
- capacitância de fio;
- buffers necessários;
- consumo de switching power;
- congestionamento;
- timing.

Uma net longa tem capacitância maior. Se ela alterna muito, sua contribuição para dynamic power cresce. Então a ferramenta pode tentar aproximar células relacionadas, reduzir comprimento de conexões críticas em atividade e melhorar o custo de potência.

---

## 8. O que é power-aware sequential mapping

**Sequential mapping** é o mapeamento de elementos sequenciais, como flip-flops e registradores, para células reais da biblioteca.

Power-aware sequential mapping tenta escolher implementações sequenciais com melhor consumo, considerando:

- tipo de flip-flop;
- suporte a clock enable;
- carga no clock;
- possibilidade de clock gating;
- uso de células multibit;
- timing dos arcos sequenciais.

Como flip-flops recebem clock constantemente, a otimização de elementos sequenciais tem grande impacto em potência dinâmica.

---

## 9. O que é bundle cell optimization

O slide cita **bundle cell optimization** como uma das otimizações feitas pela TPO.

A ideia geral é agrupar ou mapear estruturas de forma mais eficiente quando há células ou funções que podem ser implementadas de maneira conjunta, reduzindo custo de potência, área ou carga de interconexão.

No contexto do curso, não é necessário memorizar uma definição profunda. O ponto de prova é saber que TPO habilita múltiplas otimizações power-aware, incluindo sizing, placement, sequential mapping e bundle cell optimization.

---

## 10. Como interpretar `report_power`

O comando:

```tcl
report_power -scenario func.ff_040c
```

mostra a potência estimada para um cenário específico.

As principais colunas são:

| Coluna | Significado |
|---|---|
| Internal Power | Potência interna das células |
| Switching Power | Potência para carregar/descarregar nets |
| Leakage Power | Potência estática de fuga |
| Total Power | Soma das parcelas |
| % | Participação daquele grupo no total |

Os grupos do relatório ajudam a localizar onde a potência está concentrada.

Exemplo de interpretação:

```text
Se memory domina o total:
    investigar macros, atividade, modos de operação e modelagem de memória.

Se clock_network domina:
    clock gating, multibit e CTS/placement-aware clock optimization viram alvos fortes.

Se register/sequential domina:
    multibit, clock gating e sequential mapping podem ajudar.

Se combinational domina:
    restructuring, sizing e redução de switching activity podem ajudar.
```

O relatório é diagnóstico. Ele não apenas diz “quanto consome”; ele mostra onde procurar oportunidade de melhoria.

---

## 11. Dominant timing scenario versus dominant power scenario

O slide sobre múltiplos modos e corners é importante porque evita uma simplificação perigosa.

Em MCMM, a ferramenta pode trabalhar com muitos cenários. Para reduzir runtime, ela seleciona cenários dominantes.

O cenário dominante de timing é o mais crítico para fechamento temporal. Mas potência pode ser máxima em outro cenário.

Exemplo conceitual:

```text
Scenario A: pior setup timing
Scenario B: maior leakage por temperatura alta
Scenario C: maior dynamic power por frequência/atividade
```

Se a ferramenta só usasse o pior cenário de timing, poderia otimizar mal a potência. Por isso, quando o pior cenário de potência não coincide com o pior cenário de timing, o DC NXT pode adicionar um cenário dominante extra para potência.

O slide orienta verificar o **scenario reduction summary** durante o compile para confirmar quais cenários foram escolhidos como dominantes.

---

## 12. Relação entre TPO e outros recursos de low power

TPO é o mecanismo geral. Mas o DC NXT também possui técnicas específicas:

### Clock Gating

Reduz chaveamento do clock quando registradores não precisam atualizar.

### Self-gating

Forma especial de clock gating em que a própria condição de estabilidade do dado pode ser usada para evitar clock desnecessário.

### Multibit

Agrupa múltiplos flip-flops de 1 bit em uma célula multibit, reduzindo carga de clock, área e, muitas vezes, potência.

### IC Compiler II Link: Enhanced Low-Power placement

Conecta a síntese com informações físicas mais realistas, permitindo placement mais consciente de potência.

### DesignWare minPower

Usa implementações de IPs DesignWare otimizadas para menor potência.

---

# Conceitos difíceis explicados em profundidade

## `set_qor_strategy`

`set_qor_strategy` aplica uma estratégia de qualidade de resultados para uma etapa do fluxo.

Nesta aula:

```tcl
set_qor_strategy -stage synthesis -metric total_power
```

Significa:

```text
Na etapa de síntese, configure a ferramenta para perseguir melhor potência total.
```

Isso não é a mesma coisa que um único comando de otimização. Ele ajusta várias variáveis e esforços internos.

Pegadinha: como o próprio slide diz, configurações de timing também são usadas. Então `total_power` não significa “sacrificar timing livremente”.

---

## `compile_enable_total_power_optimization`

Esta é a variável principal de TPO:

```tcl
set_app_var compile_enable_total_power_optimization true
```

Ela habilita a combinação de leakage e dynamic power em um custo único.

Default:

```text
false
```

Ponto de prova provável:

```text
Design Compiler NXT otimiza dynamic power por padrão?
Resposta: Não. Precisa habilitar total power optimization.
```

---

## `-setup true` com `-dynamic_power true`

A configuração:

```tcl
set_scenario_options -setup true -dynamic_power true
```

é essencial em MCMM.

Motivo:

- dynamic power depende de atividade de chaveamento;
- internal power depende também de slew/transição;
- slew/transição vem da análise de timing;
- por isso o cenário precisa de setup habilitado.

Sem `-setup true`, a ferramenta pode não ter as informações necessárias para internal power.

---

## Synopsys Physical Guidance (SPG)

O slide lista como requisito:

```text
Enable Synopsys Physical Guidance (SPG) in compile_ultra
```

SPG é importante porque potência depende fortemente de aspectos físicos:

- comprimento de nets;
- capacitância de interconexão;
- posicionamento;
- carga;
- buffers;
- congestionamento.

Sem orientação física, a síntese enxerga uma estimativa menos realista da implementação. Com SPG, o DC NXT toma decisões de síntese mais próximas do impacto físico real.

---

## Scenario reduction

**Scenario reduction** é a redução automática do conjunto de cenários considerados simultaneamente para melhorar runtime e memória.

No slide, o modo topográfico seleciona cenários dominantes. O cenário dominante de timing sempre entra, mas o cenário dominante de power pode ser diferente.

Ponto de prova:

```text
O pior cenário de timing é sempre o pior cenário de power?
Não.
```

---

## Power-driven restructuring

A figura final cita **Power-Driven Re-structuring** dentro de Total Power Optimization.

Reestruturação significa alterar a implementação lógica mantendo a mesma função, mas buscando menor custo.

Exemplo conceitual:

```verilog
assign y = (a & b) | (a & c);
```

Pode ser reestruturado como:

```verilog
assign y = a & (b | c);
```

Dependendo da atividade dos sinais, capacitâncias e biblioteca, uma forma pode consumir menos potência que a outra. A ferramenta pode explorar transformações desse tipo quando TPO está ativa.

---

## Power-aware sequential mapping

Elementos sequenciais têm impacto grande porque estão ligados ao clock. Mesmo quando dados não mudam, o clock pode continuar alternando.

Power-aware sequential mapping tenta escolher células sequenciais e estruturas que reduzem esse custo.

Técnicas relacionadas:

- clock enable;
- clock gating;
- multibit flops;
- escolha de células sequenciais mais econômicas;
- redução de carga na árvore de clock.

---

# Figuras, diagramas e waveforms importantes

## Figura do Slide 2 — Tabela de opções do `set_qor_strategy`

A tabela é importante porque mostra que `set_qor_strategy -metric total_power` não é simbólico: ele altera ou mira configurações concretas da ferramenta.

A linha mais importante é:

```text
compile_enable_total_power_optimization -> target true
```

Isso confirma que a estratégia de QoR com métrica `total_power` habilita a otimização total de potência.

---

## Figura do Slide 4 — Relatório `report_power`

A figura mostra como a potência é organizada por grupo de circuito.

O estudo correto do relatório é:

1. olhar o total;
2. identificar os grupos que mais contribuem;
3. separar internal, switching e leakage;
4. decidir qual técnica de otimização tem mais chance de ajudar.

Exemplo:

- clock network alto → clock gating/multibit;
- register/sequential alto → multibit/sequential mapping;
- combinational alto → restructuring/sizing;
- memory alto → análise de macros, atividade e modos.

---

## Figura do Slide 5 — Dominant scenario

A figura mostra que a ferramenta pode selecionar:

```text
s1_worst_timing (dominant)
s4_max_power (dominant)
```

Essa figura deve ser memorizada porque resume a diferença entre cenário crítico de timing e cenário crítico de potência.

---

## Figura do Slide 7 — Power-Focused Technology Summary

A figura organiza o curso inteiro de low power.

Ela mostra que os próximos blocos serão aprofundamentos das técnicas listadas:

- clock gating;
- self-gating;
- multibit;
- IC Compiler II Link;
- DesignWare minPower;
- reporting.

Portanto, este bloco funciona como um mapa do restante do curso.

---

# Pontos de prova e revisão

## Perguntas prováveis

1. **Qual comando aplica uma estratégia de QoR focada em potência total na síntese?**

```tcl
set_qor_strategy -stage synthesis -metric total_power
```

2. **Qual variável habilita Total Power Optimization?**

```tcl
compile_enable_total_power_optimization
```

3. **Qual é o valor default de `compile_enable_total_power_optimization`?**

```text
false
```

4. **TPO combina quais custos?**

```text
Leakage power + dynamic power
```

5. **Em MCMM, o que precisa estar habilitado em pelo menos um cenário para dynamic power optimization?**

```text
-setup true e -dynamic_power true
```

6. **Por que `-setup true` é necessário?**

Porque informações de timing/transição são necessárias para cálculo de potência interna.

7. **O pior cenário de timing é sempre o pior cenário de potência?**

Não.

8. **O que o DC NXT faz se o cenário dominante de timing não for o cenário dominante de potência?**

Adiciona um cenário dominante extra de potência.

9. **Quais são recursos adicionais independentes de low power citados?**

Clock gating, self-gating, multibit, IC Compiler II Link enhanced low-power placement e DesignWare minPower.

10. **Qual comando exibe potência por grupo e por componentes internal/switching/leakage?**

```tcl
report_power
```

---

## Pegadinhas

| Tema | Pegadinha | Correção |
|---|---|---|
| TPO | Achar que dynamic power é otimizada por padrão | Default de `compile_enable_total_power_optimization` é `false` |
| `set_qor_strategy` | Achar que métrica `total_power` ignora timing | O slide diz que settings de timing também são usados |
| Cenários | Achar que basta ligar a variável global | Em MCMM precisa habilitar cenário com `-dynamic_power true` e `-setup true` |
| Dominant scenario | Achar que pior timing sempre é pior power | Nem sempre; DC NXT pode adicionar dominant power scenario |
| Power report | Olhar só o total | É preciso olhar grupos e parcelas internal/switching/leakage |
| Clock network | Achar que é sempre dominante | Depende do design; no exemplo não é o maior, mas pode ser alvo importante |
| TPO vs features | Achar que TPO substitui clock gating/multibit | São técnicas complementares |

---

# Relação com projeto/laboratório

Em um script real de síntese low power, este bloco aparece como a parte em que se decide que o compile será orientado por potência total.

Um esqueleto coerente com os slides seria:

```tcl
# Criar/configurar cenário de potência dinâmica
create_scenario s2
set_scenario_options -scenarios s2 \
    -setup true \
    -dynamic_power true \
    -leakage_power true

# Aplicar estratégia de QoR focada em potência total
set_qor_strategy -stage synthesis -metric total_power

# Alternativamente ou explicitamente, garantir TPO habilitada
set_app_var compile_enable_total_power_optimization true

# Fornecer atividade de chaveamento quando disponível
read_saif -input design_sim.saif -instance <tb_path>/<dut_instance>

# Rodar síntese com orientação física/SPG quando o fluxo pedir
compile_ultra

# Relatar potência por cenário
report_power -scenario s2
```

No laboratório, os sinais de que este bloco está sendo aplicado serão:

- presença de `set_qor_strategy -stage synthesis -metric total_power`;
- uso de `set_scenario_options` com `-dynamic_power true` e `-setup true`;
- leitura de SAIF ou anotação de switching activity;
- execução de `report_power`;
- comparação de potência antes/depois da otimização.

Este bloco também prepara diretamente os próximos temas do curso: clock gating, self-gating e multibit. Eles são técnicas específicas que podem ser ativadas ou controladas dentro de um fluxo maior de low power.

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

## Bloco 092 — 04 Clock Gating

- **Arquivo para anexar:**

```text
C:\Users\maiko\ci_expert\Aulas2Prints\12 Design Compiler NXT - Low Power\04 Clock Gating.docx
```

- **Faixa:** slides `1-16`

- **Salvar Markdown em:**

```text
C:\Users\maiko\ci_expert\mdCursoPt2\12 Design Compiler NXT - Low Power\04 Clock Gating.md
```
