# 07 Multibit

## Controle do bloco

- **Bloco:** 095
- **Curso:** 12 Design Compiler NXT - Low Power
- **Arquivo de origem:** `C:\Users\maiko\ci_expert\Aulas2Prints\12 Design Compiler NXT - Low Power\07 Multibit.docx`
- **Faixa de slides:** 1-9
- **Caminho sugerido para salvar:**

```text
C:\Users\maiko\ci_expert\mdCursoPt2\12 Design Compiler NXT - Low Power\07 Multibit.md
```

- **Próximo bloco recomendado:** 096 — `08 IC Compiler II Link and DesignWare minPower`
- **Arquivo do próximo bloco:**

```text
C:\Users\maiko\ci_expert\Aulas2Prints\12 Design Compiler NXT - Low Power\08 IC Compiler II Link and DesignWare minPower.docx
```

- **Faixa do próximo bloco:** slides `1-4`
- **Salvar próximo Markdown em:**

```text
C:\Users\maiko\ci_expert\mdCursoPt2\12 Design Compiler NXT - Low Power\08 IC Compiler II Link and DesignWare minPower.md
```

---

## Resumo executivo

Esta aula apresenta **multibit banking**, uma técnica de otimização de baixa potência em que registradores de 1 bit são agrupados em registradores multibit, por exemplo, transformar vários flip-flops individuais em uma célula de registrador de 2, 4, 8 ou mais bits.

A motivação principal é reduzir **área** e **potência**, principalmente potência do clock. Registradores individuais repetem muito circuito interno: buffers de clock, transistores de controle, lógica de scan, carga de clock e estrutura física. Quando vários bits são colocados em uma célula multibit, parte dessa lógica é compartilhada. Isso reduz capacitância, reduz comprimento total de nets de clock, reduz buffers na árvore de clock e melhora a eficiência física do layout.

O Design Compiler NXT pode fazer multibit banking de três formas principais:

1. **Inferência automática a partir de barramentos RTL** (`hdlin_infer_multibit`).
2. **Banking físico/placement-aware** usando `identify_register_banks` e comandos `create_register_bank` gerados automaticamente.
3. **Banking manual** com `create_multibit`.

A aula também mostra que multibit banking pode prejudicar timing se for aplicado agressivamente. Por isso há modos de controle, como `set_multibit_options -mode timing_driven`, filtros de WNS no `identify_register_banks`, e mecanismos de **de-banking** para desfazer bancos multibit em caminhos críticos.

---

## Texto extraído e organizado por slide

## Slide 1 — Multibit Banking

### Texto extraído e organizado

**Multibit Banking**

Merging, ou banking, de registradores single-bit para registradores multibit leva a:

- **Menor área e menor potência**, devido a transistores compartilhados e layout otimizado no nível de transistor.
- **Redução do comprimento total das nets da árvore de clock e do número de buffers**, reduzindo o consumo de potência da clock tree.

### Interpretação do slide

O slide mostra duas ideias visuais:

1. À esquerda, dois registradores de 1 bit separados são transformados em um único registrador multibit. A lógica de clock e parte da estrutura interna deixam de ser duplicadas.
2. À direita, uma árvore de clock que alimentava quatro células de 1 bit passa a alimentar menos células multibit. Isso reduz ramificações, buffers e carga capacitiva do clock.

O ganho mais importante vem do fato de que o clock costuma ser uma das redes de maior atividade no chip. Clock alterna o tempo todo. Portanto, qualquer redução de capacitância nessa rede tende a gerar redução real de potência dinâmica.

---

## Slide 2 — Two Automatic Multibit Banking Methods

### Texto extraído e organizado

**Two Automatic Multibit Banking Methods**

Para obter a maior razão de MB banking, habilite ambos os métodos:

### 1. RTL bus inference flow

Banks registers belonging to an RTL bus.

- Ocorre durante `compile_ultra`.
- Potencial desvantagem: menor flexibilidade para placement e routing dos registradores, o que pode impactar outros aspectos de QoR.

Comando:

```tcl
set_app_var hdlin_infer_multibit default_all
```

Default:

```text
default_none
```

### 2. Placement-aware register banking flow

Banks unrelated, ou bussed, registers that are physically near each other.

- Executado em um design já mapeado/posicionado após o compile inicial.
- É recomendado tornar todos os cenários ativos para garantir que exceções de timing e constraints sejam consideradas.
- O banking é executado por comandos `create_register_bank` gerados automaticamente.

Comandos do slide:

```tcl
identify_register_banks -output_file create_reg.tcl
set_active_scenarios -all
source create_reg.tcl ; # Contains create_register_bank commands
```

### Interpretação do slide

O Design Compiler NXT oferece dois caminhos automáticos, mas eles atacam oportunidades diferentes.

O primeiro olha para a estrutura lógica do RTL. Se o RTL tem um barramento, por exemplo:

```verilog
always_ff @(posedge clk) begin
  data_q <= data_d;
end
```

onde `data_q` é um vetor, o compilador pode inferir que os bits pertencem ao mesmo grupo lógico e são bons candidatos a uma célula multibit.

O segundo método é físico. Mesmo que registradores não pertençam ao mesmo barramento RTL, eles podem estar fisicamente próximos no layout e compartilhar clock. Nesse caso, pode fazer sentido agrupá-los em uma célula multibit para economizar área e clock power.

---

## Slide 3 — Manual Banking

### Texto extraído e organizado

**Manual Banking**

Alternativamente, registradores podem ser marcados manualmente para MB banking após leitura do RTL, para agrupar registradores discretos ou não bussed.

Exemplo:

```tcl
create_multibit {x_reg y_reg} -name xy_mb
compile_ultra -scan -gate_clock -spg ...
```

- Marca os registradores não bussed de 1 bit `x_reg` e `y_reg` para serem agrupados em um componente MB chamado `xy_mb`.
- O MB mapping acontece durante `compile`.

### Interpretação do slide

O comando `create_multibit` não necessariamente já troca imediatamente as células no momento em que é chamado. Ele cria uma intenção ou agrupamento para que, durante o compile, a ferramenta tente mapear aqueles registradores para um componente multibit compatível.

Esse modo é útil quando o projetista sabe que certos registradores devem ser agrupados, mesmo que a inferência automática não perceba essa relação.

Exemplo conceitual:

```text
x_reg e y_reg:
- mesmo clock;
- mesmo reset ou reset compatível;
- fisicamente próximos ou logicamente relacionados;
- não formam um barramento RTL evidente.
```

Nesse caso, o projetista pode forçar a intenção:

```tcl
create_multibit {x_reg y_reg} -name xy_mb
```

---

## Slide 4 — Timing-Driven Banking

### Texto extraído e organizado

**Timing-Driven Banking**

MB banking não é timing-driven por padrão.

- Por padrão, busca atingir o melhor banking ratio.

Para prevenir RTL bus inference banking em paths que violam timing:

```tcl
set_multibit_options -mode timing_driven
```

Default:

```text
none_timing_driven
```

Para prevenir placement-aware banking em uma porcentagem de registradores que violam timing:

```tcl
identify_register_banks -wns_threshold 80 -out create_reg.tcl
```

- Este exemplo evita que 80% dos registradores com setup slack mais negativo sejam banked.
- O usuário escolhe a porcentagem apropriada.
- A porcentagem default é 0.
- Ambos os ajustes podem resultar em redução do banking ratio.

### Interpretação do slide

Aqui aparece o tradeoff central da aula:

```text
Mais banking  -> maior economia de área/potência, mas possível piora de timing.
Menos banking -> menor economia, mas mais segurança para fechar timing.
```

Por padrão, a ferramenta tenta maximizar a taxa de banking. Isso é bom para potência e área, mas nem sempre é ideal para timing. Uma célula multibit pode ter:

- posicionamento menos flexível;
- pinos mais concentrados;
- carga e roteamento diferentes;
- impacto em caminhos críticos;
- menor liberdade para otimização individual de cada bit.

Com `set_multibit_options -mode timing_driven`, a ferramenta passa a respeitar mais a condição de timing na etapa de inferência por barramento RTL.

Com `identify_register_banks -wns_threshold 80`, a etapa placement-aware evita bancos envolvendo parte dos registradores com pior slack. O termo WNS significa **Worst Negative Slack**. O comando está dizendo: preserve os registradores mais críticos para evitar piorar ainda mais o timing.

---

## Slide 5 — De-Banking

### Texto extraído e organizado

**De-Banking**

Para automaticamente desfazer bancos de registradores multibit com timing crítico:

```tcl
set_multibit_options -mode timing_only -critical_range 0.05
compile_ultra -scan -spg -incremental ...
```

- Desfaz o banking de registradores MB dentro de 50 ps do WNS do design se o timing for melhorado.
- Tenta refazer banking em bits não críticos para minimizar degradação do banking ratio.
- De-banking é disparado somente durante incremental compile em modo SPG.

Para fazer de-banking manual:

```tcl
split_register_bank reg_6_bit_inst \
    -lib_cells { mylib/REG_4_BIT mylib/REG_2_BIT }
```

- Divide um banco de registrador de 6 bits em um banco de 4 bits e outro de 2 bits.

### Interpretação do slide

De-banking é o processo inverso do banking. Ele desfaz ou divide uma célula multibit quando isso ajuda o timing.

Imagine que uma célula multibit de 8 bits foi criada para economizar potência, mas um dos bits está em um caminho crítico. Se todos os bits ficam presos na mesma célula física, a ferramenta pode ter dificuldade para otimizar apenas aquele bit crítico. O de-banking permite separar os bits críticos dos não críticos.

O comando:

```tcl
set_multibit_options -mode timing_only -critical_range 0.05
```

usa uma janela de criticidade de 0.05 ns, ou seja, 50 ps. Registradores multibit dentro dessa região próxima ao pior slack do design podem ser candidatos a de-banking se isso melhorar timing.

O slide também mostra que o de-banking automático é restrito ao fluxo:

```text
incremental compile + SPG mode
```

Isso faz sentido porque o design já passou por uma primeira síntese. A ferramenta agora está refinando uma implementação já mapeada/posicionada com mais informação física.

---

## Slide 6 — Multibit Reporting

### Texto extraído e organizado

**Multibit Reporting**

Reportar estatísticas de componentes MB:

- Antes do compile: reporta componentes MB potenciais, especialmente registradores bussed.
- Depois do compile: reporta componentes MB e razões para não aplicar banking em registradores 1-bit.

Comando:

```tcl
report_multibit -hierarchical [object_list]
```

Reportar estatísticas pós-compile de registradores MB e banking ratio:

```tcl
report_multibit_banking [-hierarchical]
```

Usar o atributo `multibit_width` para encontrar registradores multibit:

```tcl
get_cells -filter "multibit_width > 1"
```

### Interpretação do slide

O fluxo não termina em aplicar multibit. É necessário medir se a otimização realmente aconteceu.

Há dois tipos principais de relatório:

1. `report_multibit`
   - bom para investigar componentes candidatos;
   - útil antes e depois do compile;
   - mostra por que alguns registradores não foram agrupados.

2. `report_multibit_banking`
   - bom para estatísticas finais;
   - mostra número de células single-bit e multibit;
   - mostra a taxa de banking.

O filtro:

```tcl
get_cells -filter "multibit_width > 1"
```

é uma forma direta de pegar no banco de dados da ferramenta as células que realmente são multibit. Se `multibit_width` é maior que 1, a célula representa mais de um bit sequencial.

---

## Slide 7 — Multibit Reporting: exemplo de relatório

### Texto extraído e organizado

O slide mostra um exemplo de saída de:

```tcl
report_multibit_banking -hierarchical
```

A saída apresenta estatísticas como:

- Total number of sequential cells.
- Number of single-bit flip-flops.
- Number of single-bit latches.
- Number of multi-bit flip-flops.
- Number of multi-bit latches.
- Total number of single-bit equivalent sequential cells.
- Sequential cells banking ratio.
- Flip-flop cells banking ratio.
- Multi-bit Register Decomposition.

No exemplo, aparecem decomposições por largura, como:

- 2-bit registers.
- 4-bit registers.

### Interpretação do slide

Esse relatório não conta apenas células físicas. Ele também usa o conceito de **single-bit equivalent**.

Exemplo:

```text
Uma célula multibit de 4 bits = 1 célula física, mas equivale a 4 bits sequenciais.
```

Por isso, um relatório de multibit precisa responder duas perguntas diferentes:

1. Quantas células físicas existem?
2. Quantos bits sequenciais essas células representam?

A taxa de banking mede quantos bits sequenciais foram implementados como parte de células multibit.

Exemplo conceitual:

```text
Total equivalente: 1000 bits sequenciais
Bits dentro de células multibit: 450
Banking ratio: 45%
```

Essa taxa ajuda a avaliar se a otimização de multibit foi efetiva.

---

## Slide 8 — Multibit Banking Flow: Example

### Texto extraído e organizado

O slide mostra um fluxo exemplo:

```tcl
set_app_var hdlin_infer_multibit default_all

analyze ...; elaborate ...

compile_ultra -scan -gate_clock -spg ...

report_multibit

report_multibit_banking

identify_register_banks
insert_dft

set_multibit_options -mode .. -critical_range;

compile_ultra -scan -spg -incremental ...

optimize_netlist -area
```

Fluxo conceitual indicado no diagrama:

1. Inferir componentes multibit em todos os registradores bussed.
2. Executar RTL banking durante o primeiro compile.
3. Reportar RTL banking durante o primeiro compile e registradores específicos mapeados para multibit.
4. Reportar todos os registradores multibit no design e o banking ratio.
5. Executar placement-aware physical banking.
6. Habilitar de-banking.
7. Executar de-banking durante incremental compile.
8. Executar otimização gate-to-gate para melhorar área.

### Interpretação do slide

Esse slide junta todas as peças em um fluxo prático.

A sequência sugerida é:

1. **Antes da leitura/elaboração ou no setup inicial**, habilitar inferência multibit para barramentos RTL:

```tcl
set_app_var hdlin_infer_multibit default_all
```

2. **Ler e elaborar o design:**

```tcl
analyze ...
elaborate ...
```

3. **Fazer o primeiro compile com recursos relevantes:**

```tcl
compile_ultra -scan -gate_clock -spg ...
```

Aqui podem acontecer banking por barramento RTL, scan, clock gating e otimização com SPG.

4. **Reportar o resultado:**

```tcl
report_multibit
report_multibit_banking
```

5. **Identificar bancos adicionais com base física:**

```tcl
identify_register_banks
```

6. **Aplicar DFT, se fizer parte do fluxo:**

```tcl
insert_dft
```

7. **Configurar de-banking para timing crítico:**

```tcl
set_multibit_options -mode .. -critical_range
```

8. **Rodar compile incremental:**

```tcl
compile_ultra -scan -spg -incremental ...
```

9. **Refinar área:**

```tcl
optimize_netlist -area
```

O ponto didático é que multibit banking não é apenas um comando isolado. Ele pode fazer parte de uma estratégia de síntese em múltiplas fases: inferir, compilar, reportar, fazer banking físico, aplicar DFT, corrigir timing por de-banking e otimizar área.

---

## Slide 9 — Improving Multibit Banking Ratio with Limited MB Lib Cells

### Texto extraído e organizado

**Improving Multibit Banking Ratio with Limited MB Lib Cells**

RTL bus inference MB banking acontece em duas etapas:

### Step 1

Sequential mapping replaces GTECH sequential cells with one-bit registers.

- Por padrão, registradores de 1 bit não precisam ter registradores compatíveis multibit.

### Step 2

Replaces bussed one-bit registers with compatible multibit registers.

A configuração abaixo pode melhorar o multibit banking ratio:

```tcl
set_app_var seqmap_prefer_registers_with_multibit_equivalent true
```

- Útil quando as bibliotecas de referência têm um número limitado de registradores multibit compatíveis com todos os registradores de 1 bit disponíveis.
- O sequential mapping usa registradores de 1 bit com equivalentes compatíveis MB sempre que possível.
- Permite que mais registradores de 1 bit sejam agrupados, aumentando o banking ratio.

### Interpretação do slide

Este slide explica uma pegadinha de biblioteca.

O banking multibit depende de compatibilidade entre:

- registradores de 1 bit escolhidos durante sequential mapping;
- células multibit disponíveis na biblioteca;
- características como clock, reset, scan, enable, polaridade, função e restrições.

Se o mapeamento inicial escolher registradores de 1 bit que não têm equivalente multibit compatível, depois a ferramenta não consegue agrupá-los bem.

A variável:

```tcl
set_app_var seqmap_prefer_registers_with_multibit_equivalent true
```

orienta o sequential mapping a preferir registradores de 1 bit que tenham equivalentes multibit. Isso aumenta a chance de banking posterior.

Em outras palavras:

```text
Sem essa opção:
  O mapper pode escolher FFs de 1 bit ótimos isoladamente,
  mas ruins para formar células multibit depois.

Com essa opção:
  O mapper favorece FFs de 1 bit que têm família multibit compatível,
  aumentando a taxa de banking.
```

---

# Aula didática desenvolvida

## 1. O que é multibit banking

Multibit banking é uma técnica em que vários elementos sequenciais de 1 bit são agrupados em uma única célula física multibit.

Exemplo lógico:

```text
Antes:
  DFF_X1 bit0
  DFF_X1 bit1
  DFF_X1 bit2
  DFF_X1 bit3

Depois:
  DFF_4BIT_X1 bits[3:0]
```

A função lógica continua sendo a mesma: armazenar 4 bits. O que muda é a implementação física.

Em vez de quatro células separadas, com quatro pinos de clock independentes, quatro pequenas redes locais e estruturas duplicadas, a biblioteca oferece uma célula otimizada para armazenar múltiplos bits com partes compartilhadas.

---

## 2. Por que multibit reduz potência

Em circuitos síncronos, o clock é uma das maiores fontes de potência dinâmica porque alterna continuamente. Mesmo quando dados não mudam, o clock continua chegando aos flip-flops.

A potência dinâmica tem relação com:

```text
atividade de chaveamento × capacitância × tensão² × frequência
```

No clock, a atividade e a frequência são altas por natureza. Então reduzir capacitância no clock é muito valioso.

Multibit banking reduz potência por três caminhos principais:

### 2.1 Menos capacitância no clock pin

Uma célula multibit compartilha parte da estrutura de clock entre vários bits. Isso normalmente reduz a capacitância total vista pela árvore de clock.

### 2.2 Menos buffers na clock tree

Se o design tem menos células sequenciais físicas, a árvore de clock pode precisar de menos ramificações e menos buffers para distribuir o clock.

### 2.3 Layout interno otimizado

A célula multibit é desenhada no nível de transistor para compartilhar componentes e reduzir overhead. Isso pode diminuir área e capacitância interna.

---

## 3. Diferença entre banking por barramento RTL e banking placement-aware

A aula separa dois métodos automáticos.

## 3.1 RTL bus inference banking

Esse método olha para o RTL e identifica registradores que pertencem a um barramento.

Exemplo:

```verilog
logic [7:0] data_q;
logic [7:0] data_d;

always_ff @(posedge clk) begin
  data_q <= data_d;
end
```

A ferramenta entende que `data_q[7:0]` forma um grupo natural de bits. Esses bits têm forte relação lógica e são candidatos a multibit.

Comando principal:

```tcl
set_app_var hdlin_infer_multibit default_all
```

Esse método ocorre durante `compile_ultra`.

### Vantagem

Alta chance de encontrar grupos naturais e aumentar banking ratio.

### Desvantagem

Como os bits pertencem ao mesmo barramento lógico, eles podem acabar menos flexíveis para posicionamento e roteamento. Isso pode afetar QoR físico, timing ou congestionamento.

## 3.2 Placement-aware register banking

Esse método olha para o design já mapeado/posicionado e encontra registradores fisicamente próximos.

Comandos principais:

```tcl
identify_register_banks -output_file create_reg.tcl
set_active_scenarios -all
source create_reg.tcl
```

O comando `identify_register_banks` gera um arquivo com comandos de banking, normalmente contendo `create_register_bank`. Depois o script é carregado com `source`.

### Vantagem

Pode agrupar registradores que não eram óbvios no RTL, mas que são bons candidatos fisicamente.

### Desvantagem

Precisa de informação física e deve respeitar todos os cenários ativos, exceções e constraints. Se mal configurado, pode gerar banking que parece bom fisicamente, mas prejudica timing em algum cenário.

---

## 4. Banking manual

O banking manual é usado quando o projetista quer marcar explicitamente registradores para formar um banco.

Exemplo:

```tcl
create_multibit {x_reg y_reg} -name xy_mb
compile_ultra -scan -gate_clock -spg ...
```

Aqui, `x_reg` e `y_reg` são registradores de 1 bit que o usuário quer agrupar em um componente chamado `xy_mb`.

Esse método é útil quando:

- os registradores não pertencem a um barramento RTL;
- a ferramenta não detecta a oportunidade automaticamente;
- o projetista sabe que o agrupamento é seguro;
- há intenção arquitetural ou física clara.

Mas deve ser usado com cuidado. Forçar banking em registradores de timing crítico pode piorar QoR.

---

## 5. Timing-driven banking

Por padrão, o objetivo do multibit banking é maximizar banking ratio. Isso significa que a ferramenta tenta agrupar o máximo possível, desde que as regras básicas permitam.

O problema é que o maior banking ratio nem sempre é o melhor resultado global.

Um banco multibit pode dificultar otimizações individuais porque vários bits passam a compartilhar a mesma célula física. Se um bit é crítico e outro não, a ferramenta perde liberdade para tratar cada um separadamente.

Para tornar a inferência mais sensível a timing:

```tcl
set_multibit_options -mode timing_driven
```

Esse comando previne banking por inferência RTL em caminhos que violam timing.

Para o fluxo placement-aware, o slide usa:

```tcl
identify_register_banks -wns_threshold 80 -out create_reg.tcl
```

A ideia é proteger os registradores mais críticos, ligados aos piores slacks de setup. O exemplo evita banking em 80% dos registradores mais negativos em setup slack.

Consequência esperada:

```text
Mais proteção de timing
→ menos registradores agrupados
→ menor banking ratio
→ menor economia de potência/área
```

Esse é um tradeoff clássico de síntese: potência e área versus timing.

---

## 6. De-banking

De-banking é desfazer ou dividir células multibit quando isso ajuda o timing.

Comando automático mostrado:

```tcl
set_multibit_options -mode timing_only -critical_range 0.05
compile_ultra -scan -spg -incremental ...
```

O `critical_range 0.05` define uma janela de 50 ps em relação ao WNS. Se um registrador multibit está nessa região crítica e o timing melhora ao desfazer o banco, a ferramenta pode aplicar de-banking.

O slide destaca três detalhes:

1. O de-banking ocorre em registradores MB dentro de 50 ps do WNS se isso melhorar timing.
2. A ferramenta tenta refazer banking em bits não críticos para não degradar demais a taxa de banking.
3. O de-banking automático só é disparado em `incremental compile` com SPG.

Também há de-banking manual:

```tcl
split_register_bank reg_6_bit_inst \
    -lib_cells { mylib/REG_4_BIT mylib/REG_2_BIT }
```

Esse comando divide um banco de 6 bits em dois bancos: um de 4 bits e outro de 2 bits.

---

## 7. Relatórios de multibit

Os relatórios são essenciais para saber se a técnica funcionou.

### 7.1 `report_multibit`

```tcl
report_multibit -hierarchical [object_list]
```

Uso principal:

- antes do compile: ver potenciais componentes MB;
- depois do compile: ver componentes MB criados e motivos para não banking em certos registradores.

### 7.2 `report_multibit_banking`

```tcl
report_multibit_banking [-hierarchical]
```

Uso principal:

- estatísticas pós-compile;
- número de células single-bit;
- número de células multibit;
- single-bit equivalent;
- banking ratio.

### 7.3 Buscar células multibit diretamente

```tcl
get_cells -filter "multibit_width > 1"
```

Esse filtro retorna células cujo atributo `multibit_width` é maior que 1.

---

## 8. Como interpretar banking ratio

O banking ratio indica a fração de elementos sequenciais equivalentes que foram implementados usando células multibit.

Exemplo didático:

```text
Design possui 1000 bits sequenciais equivalentes.
500 desses bits estão dentro de células multibit.
Banking ratio = 50%.
```

Mas é importante não confundir:

```text
número de células físicas != número de bits sequenciais
```

Uma célula multibit de 8 bits conta como uma célula física, mas representa 8 bits sequenciais.

Por isso o relatório de banking precisa mostrar decomposição por largura:

- 2-bit cells;
- 4-bit cells;
- 8-bit cells;
- e assim por diante, se disponíveis na biblioteca.

---

## 9. Por que bibliotecas limitadas podem reduzir banking ratio

O último slide mostra uma limitação importante: o resultado depende da biblioteca.

O fluxo de inferência por barramento RTL tem duas etapas:

1. Mapear GTECH sequential cells para registradores de 1 bit.
2. Substituir registradores de 1 bit bussed por registradores multibit compatíveis.

Se na etapa 1 a ferramenta escolhe um registrador de 1 bit que não tem equivalente multibit compatível, a etapa 2 fica limitada.

A variável:

```tcl
set_app_var seqmap_prefer_registers_with_multibit_equivalent true
```

ajuda porque faz o sequential mapping preferir registradores de 1 bit que tenham equivalentes multibit. Assim, mais bits podem ser agrupados depois.

Esse ajuste é especialmente útil quando a biblioteca tem poucas células multibit ou quando nem todos os registradores de 1 bit possuem versões compatíveis em 2, 4 ou 8 bits.

---

# Conceitos difíceis explicados em profundidade

## 1. Single-bit equivalent

Um conceito importante nos relatórios é o de **single-bit equivalent**.

Uma célula de 4 bits não é igual a quatro células físicas, mas equivale logicamente a quatro registradores de 1 bit.

Exemplo:

```text
10 células DFF_4BIT = 10 células físicas
10 células DFF_4BIT = 40 single-bit equivalents
```

Esse conceito permite comparar designs antes e depois do banking.

---

## 2. Banking ratio

Banking ratio mede quanto do design sequencial foi convertido para multibit.

Fórmula conceitual:

```text
banking ratio = bits sequenciais em células multibit / total de bits sequenciais equivalentes
```

Um banking ratio maior geralmente indica melhor aproveitamento da técnica, mas não deve ser maximizado cegamente. Se o timing piorar, pode ser necessário reduzir a agressividade ou aplicar de-banking.

---

## 3. `hdlin_infer_multibit`

```tcl
set_app_var hdlin_infer_multibit default_all
```

Essa variável habilita inferência de registradores multibit durante o fluxo de leitura/elaboração/compile baseado em RTL.

O default mostrado no slide é:

```text
default_none
```

Ou seja, se o usuário não habilitar, a inferência automática por barramento pode não acontecer.

---

## 4. `identify_register_banks`

```tcl
identify_register_banks -output_file create_reg.tcl
```

Esse comando identifica oportunidades de banking em um design já mapeado ou posicionado. Em vez de aplicar diretamente tudo de forma invisível, ele pode gerar um arquivo Tcl com comandos de banking.

Depois:

```tcl
source create_reg.tcl
```

aplica os bancos sugeridos.

A vantagem desse fluxo é a auditabilidade: o usuário pode abrir `create_reg.tcl` e ver quais bancos serão criados.

---

## 5. `set_active_scenarios -all`

O slide recomenda:

```tcl
set_active_scenarios -all
```

antes de aplicar o script de banking físico.

Isso é importante em MCMM, porque um banco que parece seguro em um cenário pode violar timing em outro. Ativar todos os cenários ajuda a ferramenta a considerar todas as exceções e constraints relevantes.

---

## 6. `set_multibit_options -mode timing_driven`

```tcl
set_multibit_options -mode timing_driven
```

Esse modo evita banking por inferência RTL em caminhos com violação de timing.

É uma opção de proteção. O custo é reduzir banking ratio.

---

## 7. `-wns_threshold`

```tcl
identify_register_banks -wns_threshold 80 -out create_reg.tcl
```

Esse parâmetro impede banking em uma porcentagem dos registradores mais críticos em setup slack.

O exemplo do slide usa 80%. Isso não significa 80 ps. Significa uma porcentagem de registradores com pior slack, conforme descrito pelo próprio slide.

---

## 8. `critical_range`

```tcl
set_multibit_options -mode timing_only -critical_range 0.05
```

`critical_range 0.05` indica uma janela de 0.05 ns, ou 50 ps, em torno do WNS. Registradores multibit dentro dessa faixa crítica podem ser candidatos a de-banking durante compile incremental.

---

## 9. `split_register_bank`

```tcl
split_register_bank reg_6_bit_inst \
    -lib_cells { mylib/REG_4_BIT mylib/REG_2_BIT }
```

Esse comando divide manualmente um banco multibit existente. No exemplo, uma célula de 6 bits vira duas células: uma de 4 bits e outra de 2 bits.

Isso pode ser útil quando:

- parte do banco é crítica em timing;
- a biblioteca tem melhores opções em larguras menores;
- há necessidade de reorganizar fisicamente os bits;
- um banco grande reduziu flexibilidade demais.

---

## 10. `seqmap_prefer_registers_with_multibit_equivalent`

```tcl
set_app_var seqmap_prefer_registers_with_multibit_equivalent true
```

Essa variável melhora a chance de banking quando a biblioteca multibit é limitada.

Ela faz o sequential mapping escolher registradores de 1 bit que tenham equivalentes multibit compatíveis. Assim, na etapa posterior, a substituição por multibit tem mais chances de funcionar.

---

# Figuras, diagramas e exemplos importantes

## Figura do Slide 1 — Single-bit para multibit

A figura mostra registradores de 1 bit separados sendo agrupados em uma célula multibit. A mensagem visual é que o circuito passa a compartilhar estrutura interna, reduzindo área e potência.

## Figura do Slide 1 — Clock tree menor

A figura da árvore de clock mostra que várias células de 1 bit exigem mais ramificações. Ao usar células multibit, há menos sinks físicos de clock, o que reduz comprimento de nets e número de buffers.

## Slide 7 — Exemplo de relatório

O exemplo de `report_multibit_banking -hierarchical` ensina a olhar para:

- número total de células sequenciais;
- número de flip-flops single-bit;
- número de flip-flops multibit;
- single-bit equivalent;
- banking ratio;
- decomposição por largura.

## Slide 8 — Fluxo completo

O diagrama do fluxo mostra que multibit banking pode acontecer em fases:

1. inferência por barramento RTL;
2. primeiro compile;
3. relatórios;
4. banking físico;
5. DFT;
6. de-banking;
7. compile incremental;
8. otimização final de área.

Esse slide é provavelmente o mais importante para laboratório e prova, porque conecta comandos em uma sequência de uso real.

---

# Pontos de prova e revisão

## Perguntas prováveis

1. **O que é multibit banking?**
   - Agrupar registradores de 1 bit em células de registradores multibit.

2. **Qual o principal benefício de multibit banking?**
   - Redução de área e potência, especialmente potência da clock tree.

3. **Por que multibit reduz clock power?**
   - Reduz carga de clock, comprimento de nets e número de buffers da árvore de clock.

4. **Qual variável habilita inferência multibit por barramentos RTL?**

```tcl
set_app_var hdlin_infer_multibit default_all
```

5. **Qual é o default mostrado para `hdlin_infer_multibit`?**
   - `default_none`.

6. **Qual comando identifica bancos de registradores placement-aware?**

```tcl
identify_register_banks -output_file create_reg.tcl
```

7. **Por que usar `set_active_scenarios -all` antes de aplicar banking físico?**
   - Para considerar constraints e exceções de timing de todos os cenários.

8. **Qual comando cria banking manual no exemplo?**

```tcl
create_multibit {x_reg y_reg} -name xy_mb
```

9. **MB banking é timing-driven por padrão?**
   - Não.

10. **Qual comando ativa modo timing-driven para multibit?**

```tcl
set_multibit_options -mode timing_driven
```

11. **O que `identify_register_banks -wns_threshold 80` faz no exemplo?**
   - Evita banking em 80% dos registradores com pior setup slack negativo.

12. **O que é de-banking?**
   - Desfazer ou dividir bancos multibit para melhorar timing.

13. **Qual comando manual divide um banco multibit?**

```tcl
split_register_bank reg_6_bit_inst \
    -lib_cells { mylib/REG_4_BIT mylib/REG_2_BIT }
```

14. **Qual relatório mostra estatísticas pós-compile e banking ratio?**

```tcl
report_multibit_banking [-hierarchical]
```

15. **Qual atributo ajuda a encontrar células multibit?**

```tcl
multibit_width
```

16. **Qual comando busca células multibit?**

```tcl
get_cells -filter "multibit_width > 1"
```

17. **Qual variável pode melhorar banking ratio quando há poucas células MB compatíveis?**

```tcl
set_app_var seqmap_prefer_registers_with_multibit_equivalent true
```

---

## Pegadinhas

| Tema | Pegadinha | Correção |
|---|---|---|
| Multibit | Achar que é só otimização de área | Também reduz potência, especialmente clock power |
| Banking ratio | Achar que quanto maior sempre melhor | Banking alto pode prejudicar timing |
| Timing | Achar que MB banking é timing-driven por padrão | Não é; precisa configurar |
| RTL bus inference | Achar que pega todos os registradores possíveis | Pega principalmente registradores pertencentes a barramentos RTL |
| Placement-aware banking | Achar que independe de cenário | Deve considerar cenários ativos e constraints |
| `wns_threshold` | Interpretar como ps/ns | No slide, é porcentagem dos registradores com pior slack |
| De-banking | Achar que destrói todo o banking | A ferramenta tenta preservar/rebank bits não críticos |
| Biblioteca | Achar que qualquer FF de 1 bit pode virar multibit | Precisa haver célula MB compatível |
| `multibit_width` | Achar que é largura de barramento RTL | É atributo da célula/objeto multibit no banco de dados |

---

# Relação com projeto/laboratório

Em um laboratório de Design Compiler NXT Low Power, esta aula ajuda a entender scripts que tentam reduzir potência sem alterar a função RTL.

Um fluxo prático baseado nos slides pode ter esta forma:

```tcl
# 1. Habilitar inferência multibit por barramentos RTL
set_app_var hdlin_infer_multibit default_all

# 2. Ler e elaborar design
analyze ...
elaborate ...

# 3. Primeiro compile com scan, clock gating e SPG
compile_ultra -scan -gate_clock -spg ...

# 4. Reportar oportunidades/resultados multibit
report_multibit
report_multibit_banking -hierarchical

# 5. Identificar banking físico adicional
identify_register_banks -output_file create_reg.tcl
set_active_scenarios -all
source create_reg.tcl

# 6. Proteger timing crítico ou habilitar de-banking
set_multibit_options -mode timing_only -critical_range 0.05

# 7. Compile incremental
compile_ultra -scan -spg -incremental ...

# 8. Buscar células multibit no banco de dados
get_cells -filter "multibit_width > 1"
```

A conexão com os blocos anteriores é direta:

- Clock gating reduz clock toggling em bancos de registradores.
- Self-gating usa atividade de dados para desligar clock de registradores específicos.
- Multibit reduz a carga estrutural do clock e a área dos registradores.
- Todas essas técnicas atacam potência dinâmica, mas precisam respeitar timing, DFT e constraints.

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

## Bloco 096 — 08 IC Compiler II Link and DesignWare minPower

**Arquivo para anexar:**

```text
C:\Users\maiko\ci_expert\Aulas2Prints\12 Design Compiler NXT - Low Power\08 IC Compiler II Link and DesignWare minPower.docx
```

**Faixa:** slides `1-4`

**Salvar Markdown em:**

```text
C:\Users\maiko\ci_expert\mdCursoPt2\12 Design Compiler NXT - Low Power\08 IC Compiler II Link and DesignWare minPower.md
```
