# 04 Setup for Verification

## Controle do bloco

- **Bloco:** 054
- **Curso:** 08 Formality Jumpstart
- **Aula:** 04 Setup for Verification
- **Arquivo de origem:** `C:\Users\maiko\ci_expert\Aulas2Prints\08 Formality Jumpstart\04 Setup for Verification.docx`
- **Arquivo processado:** `04 Setup for Verification.docx`
- **Faixa de slides:** 1-16
- **Páginas no DOCX:** 7 páginas, cada uma contendo prints de slides
- **Caminho sugerido para salvar:** `C:\Users\maiko\ci_expert\mdCursoPt2\08 Formality Jumpstart\04 Setup for Verification.md`
- **Próximo bloco recomendado:** Bloco 055 - `05 Match and Verify`

## Resumo executivo

Esta aula explica por que a verificação formal de equivalência nem sempre é uma simples comparação direta entre RTL e netlist. Em um fluxo real de síntese, o Design Compiler, Power Compiler, DFT Compiler e ferramentas relacionadas podem transformar o projeto para atender metas de teste, potência, timing e implementação física. Essas transformações podem preservar a função pretendida do chip, mas alterar a estrutura dos cones lógicos, os nomes dos objetos, os pontos de comparação, os registradores e até a codificação de máquinas de estados. Por isso, antes de executar `match` e `verify`, o Formality pode precisar de **setup adicional**.

O ponto central é: muitas falhas de equivalência não são bugs reais do design. Elas podem ser **false failures**, isto é, falhas artificiais causadas por falta de orientação ao Formality. O slide inicial reforça que o caminho recomendado é usar o arquivo **SVF**, gerado automaticamente pelo Design Compiler, e habilitar o **Auto Setup Mode** com:

```tcl
set synopsys_auto_setup true
```

A aula cobre seis famílias de problemas de setup: **internal scan**, **boundary scan**, **clock-gating**, **clock tree buffering**, **FSM re-encoding** e **black boxes**. Em cada caso, a lógica funcional pode continuar correta, mas a estrutura comparada pelo Formality fica diferente. O papel do setup é dizer ao Formality quais sinais devem ser fixados, quais pontos devem ser correspondidos manualmente, quais informações do SVF devem ser usadas e quais blocos não devem ser verificados internamente.

Para prova e uso prático, os comandos mais importantes deste bloco são `set_constant`, `set_verification_clock_gate_hold_mode`, `set_verification_clock_gate_edge_analysis`, `set_user_match`, `set_svf_ignore_unqualified_fsm_information`, `set_black_box`, `report_black_boxes`, além da variável `synopsys_auto_setup`.

## Texto extraído e organizado por slide

### Slide 1 — Setup Needed for Verification

Texto extraído:

- Guidance might be needed for matching and verification.
  - Recommended: Use the automated setup file (SVF).
  - Essential for retiming, register merging, or register inversion.
- Design transformations that may need setup:
  - Internal Scan.
  - Boundary Scan.
  - Clock-gating.
  - Clock Tree Buffering.
  - Finite State Machine (FSM) Re-encoding.
  - Black-boxes.
- Auto Setup Mode handles most setup automatically.

Comando destacado:

```tcl
set synopsys_auto_setup true
```

Interpretação:

Este slide posiciona a aula. O Formality compara dois designs: referência e implementação. Porém, a implementação pode ter recebido transformações legítimas durante síntese, DFT, low power ou otimização física. Essas transformações não significam necessariamente que a função mudou. Elas significam que a forma estrutural do circuito mudou. Para o Formality entender isso, ele precisa de guidance, geralmente pelo SVF.

O slide também conecta esta aula com a anterior: o SVF carrega informações geradas pelo Design Compiler para evitar setup manual excessivo. Quando o SVF e o Auto Setup Mode são usados corretamente, o Formality tende a reconhecer automaticamente várias transformações de síntese.

### Slide 2 — Internal Scan: What Is It?

Texto extraído:

- Implemented by DFT Compiler.
  - Replaces flip-flops with scan flip-flops.
  - Connects scan flip-flops into shift registers or “scan chains”.
- The scan chains make it easier to set and observe the state of registers internal to a design for manufacturing test.

Interpretação:

Internal scan é uma técnica de DFT. Em vez de deixar os flip-flops comuns isolados internamente no chip, a ferramenta substitui esses flip-flops por scan flip-flops e os encadeia em cadeias seriais. Isso permite carregar estados internos e observar respostas internas durante teste de fabricação.

A ideia não é melhorar a função normal do circuito, mas tornar o chip testável depois de fabricado. Durante operação normal, o circuito deve se comportar como antes. Durante modo de teste, os flip-flops passam a funcionar como uma cadeia de deslocamento controlada por sinais como `scan_in`, `scan_en` ou `test_se`.

### Slide 3 — Internal Scan: Why It Requires Attention

Texto extraído:

- The additional logic added during scan insertion changes the combinational function.

Figura extraída e interpretada:

A figura compara dois desenhos:

- **Pre-Scan:** o caminho funcional vai de `data_in`, passa por flip-flops comuns e lógica combinacional, e chega em `data_out`.
- **Post-Scan:** os flip-flops são substituídos por scan flip-flops com entradas extras, como `scan_in`, `scan_en` e saída `scan_out`.

Interpretação:

A inserção de scan adiciona multiplexadores ou entradas extras aos registradores. O caminho funcional ainda existe, mas agora depende do estado do sinal de modo de teste. Se o scan estiver habilitado durante a verificação, o Formality enxergará uma função diferente da RTL original.

Esse é um caso clássico em que uma diferença estrutural legítima parece diferença funcional se o setup estiver errado. O Formality precisa saber que o circuito deve ser comparado no modo funcional, não no modo de teste.

### Slide 4 — Internal Scan: How to Deal With It

Texto extraído:

- Determine which ports disable the scan circuitry.
  - Default for DFT Compiler is `test_se`.
- Set those ports to the inactive state using the `set_constant` command.

Comando destacado:

```tcl
fm_shell (setup)> set_constant i:/WORK/TOP/test_se 0
```

Interpretação:

Para comparar o design funcional com a implementação que contém scan, é preciso desativar o modo scan. O slide mostra que, no fluxo do DFT Compiler, o sinal padrão pode ser `test_se`. Fixar esse sinal em `0` informa ao Formality: “compare o circuito como se ele estivesse em modo normal de operação”.

O prefixo `i:` indica que o objeto está no container de implementação. `WORK` é a biblioteca padrão e `TOP` representa o top design. Então o comando está fixando o sinal `test_se` da implementação em zero.

### Slide 5 — Boundary Scan: What Is It?

Texto extraído:

- Boundary scan involves the addition of logic to a design.
  - The added logic makes it possible to set and/or observe the logic values at the primary inputs and outputs, the boundaries of a chip.
  - Used in manufacturing test at board and system level.
  - Added by BSD Compiler.
- Boundary scan is also referred to as:
  - The IEEE 1149.1 specification.
  - JTAG.

Interpretação:

Boundary scan é o scan aplicado às fronteiras do chip, não aos registradores internos. Ele adiciona células de teste perto dos pinos de entrada e saída. Isso permite controlar e observar os sinais de I/O do chip em teste de placa ou sistema, sem necessariamente acessar fisicamente cada ponto.

A referência a IEEE 1149.1/JTAG é importante: JTAG é a forma mais conhecida de boundary scan. O objetivo principal é testabilidade em nível de placa e sistema, especialmente para detectar problemas de conexão, solda, curto, abertura ou falhas em interconexões.

### Slide 6 — Boundary Scan: Why It Requires Attention

Texto extraído:

- The logic cones at the primary outputs are different.
- The logic cones driven by primary inputs are different.
- The design has extra state holding elements.

Figura extraída e interpretada:

A figura compara:

- **Pre-Boundary Scan:** sinais `data1`, `data2`, `data3` vão diretamente para saídas `out1`, `out2`, `out3`, com pouca lógica extra.
- **Post-Boundary Scan:** células de boundary scan são adicionadas nos caminhos de entrada/saída, controladas por um **Tap Controller**.

Interpretação:

Boundary scan altera a fronteira do chip. Para o Formality, isso é delicado porque os **primary inputs** e **primary outputs** são justamente pontos centrais de comparação. Se células extras aparecem entre entradas, saídas e lógica interna, os cones lógicos vistos nos pontos de comparação mudam.

Além disso, boundary scan adiciona elementos de estado, como células controladas pelo TAP. Esses elementos não existiam no RTL funcional original. Sem setup, o Formality pode tentar comparar lógica funcional contra lógica funcional + lógica JTAG, o que causaria falhas.

### Slide 7 — Boundary Scan: How to Deal With It

Texto extraído:

- Disable the Boundary scan:
  - If the design has an optional asynchronous TAP reset pin, such as `TRSTZ` or `TRSTN`, use `set_constant` on the pin to disable the scan cells.
  - If the design has only the four mandatory TAP inputs, `TMS`, `TCK`, `TDI` and `TDO`, then force an internal net of the design using the `set_constant` command.

Comandos destacados:

```tcl
fm_shell (setup)> set_constant i:/WORK/TOP/TRSTZ 0
fm_shell (setup)> set_constant i:/WORK/alu/somenet 0
```

Interpretação:

A estratégia é semelhante à do internal scan: colocar a lógica de teste em um estado inativo para que a comparação foque o modo funcional. Se existir um reset assíncrono de TAP, como `TRSTZ` ou `TRSTN`, ele pode ser usado para desativar a infraestrutura de boundary scan. Caso não exista esse reset opcional, pode ser necessário forçar uma rede interna apropriada.

Atenção: esse tipo de `set_constant` não deve ser usado de forma cega. Ele precisa refletir o modo funcional correto do chip. Fixar o sinal errado pode esconder erro real ou criar uma equivalência artificial.

### Slide 8 — Clock-Gating: What Is It?

Texto extraído:

- Added by Power Compiler.
- Adding logic in a register’s clock path, which disables the clock when the register output is not changing.
- Saves power by not clocking register cells unnecessarily.

Interpretação:

Clock-gating é uma técnica de redução de potência dinâmica. Em CMOS, grande parte do consumo dinâmico vem de comutação. O clock é um dos sinais que mais comutam no chip. Se um registrador não precisa atualizar seu valor em determinado ciclo, é desperdício deixar o clock chegando nele.

O Power Compiler pode inserir lógica no caminho do clock para gerar um clock habilitado apenas quando necessário. Isso reduz atividade de comutação em bancos de registradores e, portanto, reduz potência.

### Slide 9 — Clock-Gating

Texto extraído da figura:

- **Before Clock-Gating:** `Data In` → register bank → `Data Out`.
- **After Clock-Gating:** lógica de habilitação gera `clken`, que controla se o clock chega ao register bank.
- Sinal destacado: `CLK`.

Interpretação da figura:

Antes do clock-gating, o banco de registradores recebe clock diretamente. Depois do clock-gating, uma lógica adicional calcula se o clock deve ou não passar. A figura mostra um elemento de controle entre `CLK` e o banco de registradores, comandado por uma condição de enable.

Para a função normal do design, o resultado deve ser equivalente: se o registrador não mudaria, bloquear o clock não altera seu valor final. Porém, estruturalmente, o cone de clock e os pontos internos mudaram bastante. Isso explica por que o Formality precisa tratar clock-gating como uma transformação especial.

### Slide 10 — Clock-Gating: Why Is It an Issue?

Texto extraído:

- Without intervention, compare points will fail verification.
  - A compare point is created for each clock-gating latch.
    - This compare point does not have a matching point in the other design and will fail.
  - The logic feeding the clock input of the register bank has changed.
    - The register bank compare points will fail.

Interpretação:

O problema não é apenas a existência de uma porta a mais. O clock-gating pode inserir latches, portas e lógica de enable no caminho do clock. Como o Formality cria e compara pontos de comparação, ele pode encontrar pontos no design de implementação que simplesmente não existem no design de referência.

Além disso, a entrada de clock do banco de registradores deixa de vir diretamente do clock original. Ela passa por uma rede controlada. Se isso não for interpretado corretamente, os registradores parecem estar sob clocks diferentes e os cones lógicos associados aos compare points podem falhar.

### Slide 11 — Clock-Gating: How to Deal With It

Texto extraído:

- Use:

```tcl
set_verification_clock_gate_hold_mode low
```

- Use option `low` or `any` if the clock-gating net drives the clock pin of positive edge-triggered DFF.
- If the clock-gating net also drives primary outputs or black-box inputs, use the `collapse_all_cg_cells` option.
- Use the `set_clock` command to identify the primary input clock net if clock-gating cells do not drive any clock pin of a DFF.
- Auto setup mode enables clock-gating by default.
- Use the following variable only if clock-gating verification issues continue:

```tcl
set_verification_clock_gate_edge_analysis true
```

Comando destacado no rodapé:

```tcl
fm_shell (setup)> set_verification_clock_gate_hold_mode low
```

Interpretação:

O comando `set_verification_clock_gate_hold_mode low` orienta o Formality sobre como tratar a condição de hold/inatividade da célula de clock-gating. Em termos práticos, ele ajuda a ferramenta a entender que determinada lógica no caminho do clock não representa mudança funcional do dado, mas uma otimização de potência.

O slide também mostra uma hierarquia de soluções:

1. Primeiro, use Auto Setup Mode, pois ele já habilita clock-gating por padrão.
2. Se ainda houver problemas, use `set_verification_clock_gate_hold_mode`.
3. Se a rede de clock-gating também alimentar saídas primárias ou black boxes, talvez seja necessário colapsar todas as células de clock-gating.
4. Se a ferramenta não reconhece corretamente o clock primário, use `set_clock`.
5. Como recurso adicional, habilite `set_verification_clock_gate_edge_analysis true` apenas se os problemas persistirem.

### Slide 12 — Clock Tree Buffering

Texto extraído:

- Clock tree buffering is the addition of buffers in the clock path to allow the clock signal to drive large loads.

Figura extraída e interpretada:

A figura mostra:

- **Pre-Buffering:** um único sinal `clk` entra no bloco `blocka` e alimenta flip-flops `ff1`, `ff2`, `ff3`.
- **Post-Buffering:** o clock passa por uma estrutura `clk_buf`, com múltiplos buffers, gerando ramos como `clk1`, `clk2`, `clk3` para alimentar os flip-flops.

Interpretação:

Clock tree buffering não muda a função lógica de dados do design. Ele muda a distribuição física do clock. Em vez de um clock ideal chegando a todos os registradores, a implementação usa buffers para distribuir o sinal com capacidade de corrente e balanceamento adequados.

No nível top, a ferramenta pode entender que esses clocks derivados pertencem à mesma rede funcional. Porém, quando se verifica um sub-bloco isolado, os nomes e pinos de clock podem não bater diretamente. Aí entra o comando `set_user_match`.

### Slide 13 — Clock Tree Buffering: How to Deal With It

Texto extraído:

- Verification at the top level requires no setup.
- When verifying at `blocka` sub-block level, use the `set_user_match` command to show that the buffered clock pins are equivalent.

Comandos destacados:

```tcl
fm_shell (setup)> set_reference_design i:/WORK/blocka
fm_shell (setup)> set_implementation_design i:/WORK/blocka
fm_shell (setup)> set_user_match r:/WORK/blocka/clk \
  i:/WORK/blocka/clk1 \
  i:/WORK/blocka/clk2 \
  i:/WORK/blocka/clk3
fm_shell (setup)> verify
```

Interpretação:

No nível top, a árvore de clock pode ser compreendida como uma transformação de distribuição. Mas, no nível de sub-bloco, o Formality pode ver que a referência tem um pino `clk`, enquanto a implementação tem múltiplos pinos ou nets de clock derivados: `clk1`, `clk2`, `clk3`. O `set_user_match` diz explicitamente que esses sinais devem ser tratados como equivalentes para fins de verificação.

Esse é um ponto importante: nem toda equivalência é inferida automaticamente por nome. Quando a implementação quebra um clock em múltiplos ramos, a correspondência precisa ser guiada.

### Slide 14 — Finite State Machine Re-encoding

Texto extraído:

- Verify that the re-encoding in the automated setup file (SVF) is correct.
  - View the ASCII file: `./formality_svf/svf.txt`.
- Enable the use of this setup information in Formality.
- Auto setup mode will enable use of this FSM information by default.

Comando destacado:

```tcl
fm_shell> set_svf_ignore_unqualified_fsm_information false
```

Interpretação:

FSM re-encoding ocorre quando a síntese troca a codificação dos estados de uma máquina de estados. Por exemplo, a RTL pode usar codificação binária, mas a implementação pode usar one-hot, gray encoding ou outra codificação otimizada. A sequência funcional de estados deve ser equivalente, mas os bits dos registradores de estado podem ser totalmente diferentes.

O Formality precisa saber como mapear os estados antigos para os estados novos. Essa informação pode estar no SVF. O slide orienta verificar o arquivo ASCII `./formality_svf/svf.txt` e habilitar o uso dessa informação. Com Auto Setup Mode, o uso da informação de FSM é habilitado por padrão.

### Slide 15 — Black Boxes

Texto extraído:

- A black box is a module or entity which contains no logic.
  - These are modules that are not verified.
  - Analog circuitry.
  - Memory devices.
  - Match black boxes between reference and implementation.

Figura extraída e interpretada:

A figura mostra dois designs:

- `Top_ref`, contendo `Mod_a` e `Ram(Black-Box)`.
- `Top_imp`, contendo `Mod_a` e `Ram(Black-Box)`.

Interpretação:

Uma black box é um bloco cuja interface é conhecida, mas cuja implementação interna não é verificada pelo Formality. Isso é comum para memórias, macros analógicas, IPs fechados ou blocos que não estão disponíveis em RTL/gate-level detalhado.

O requisito principal é que a black box exista de forma compatível nos dois designs. O Formality não prova a equivalência interna da RAM ou do bloco analógico, mas pode verificar que as conexões em torno dela são equivalentes e que a black box correspondente aparece nos dois lados.

### Slide 16 — How Are Black Boxes Created?

Texto extraído:

- RTL modules that have only I/O port declarations are read in.
- Library `.db` cells with port and timing information only.
  - Typically a memory.
- Missing a piece of design and are using this variable:

```tcl
set hdlin_unresolved_modules black_box
```

- Usage of other variable when reading in designs:

```tcl
set hdlin_interface_only "$RAM* dram16x8"
```

- Any module beginning with `SRAM` and the `dram16x8` module will become a black-box.
- Declare a sub-design as a black-box:

```tcl
set_black_box designID
```

- Command `report_black_boxes` shows list of black-boxes.

Interpretação:

O slide mostra várias formas de uma black box surgir. Ela pode ser deliberada, quando o designer só fornece a interface. Pode vir de uma biblioteca `.db`, especialmente no caso de memória. Pode também ser consequência de módulo ausente, caso a variável `hdlin_unresolved_modules` esteja configurada para transformar módulos não resolvidos em black boxes.

O comando `report_black_boxes` é essencial para revisar o que a ferramenta está tratando como caixa-preta. Uma black box acidental pode esconder erro real; uma black box ausente pode causar falha de link ou falha de matching.

## Aula didática desenvolvida

### 1. O problema geral: equivalência funcional não é igualdade estrutural

No começo do estudo de Formality, é comum imaginar que a ferramenta compara dois circuitos da seguinte forma: “pega o RTL, pega a netlist, compara saída por saída e diz se são iguais”. A ideia geral não está errada, mas é incompleta. Em projetos reais, o design de implementação pode passar por transformações que mantêm a função, mas mudam a estrutura.

Exemplo simples: suponha que a RTL tenha:

```verilog
always_ff @(posedge clk) begin
  if (en)
    q <= d;
end
```

Uma síntese com clock-gating pode transformar esse comportamento em algo como: em vez de manter o clock sempre ativo e usar enable no dado, ela cria uma lógica que bloqueia o clock quando `en` está inativo. A função de alto nível pode ser a mesma: `q` só muda quando `en` permite. Mas a implementação física mudou bastante.

O Formality, se não for orientado, pode enxergar:

- novos latches de clock-gating;
- novos sinais internos;
- nomes diferentes;
- registradores fundidos;
- registradores invertidos;
- máquina de estados recodificada;
- lógica de scan adicionada;
- células de boundary scan nas bordas;
- blocos tratados como black box.

Por isso existe a etapa de setup. O setup diz à ferramenta como interpretar essas diferenças estruturais sem confundi-las com erros funcionais.

### 2. SVF e Auto Setup Mode como primeira linha de defesa

A aula reforça que guidance pode ser necessário e que a recomendação é usar o arquivo SVF. O SVF é produzido pelo Design Compiler e contém informações sobre transformações que ele aplicou durante a síntese. Em vez de o usuário reconstruir manualmente todas as decisões da síntese, o Formality pode consumir essas informações.

A variável central do bloco é:

```tcl
set synopsys_auto_setup true
```

Esse comando deve ser entendido como: “Formality, aplique automaticamente configurações compatíveis com o que as ferramentas Synopsys costumam fazer durante síntese e otimização”. Ele não dispensa completamente o engenheiro, mas reduz muito o risco de false failures.

O slide cita que o SVF é essencial para:

- retiming;
- register merging;
- register inversion.

Essas transformações são especialmente difíceis porque alteram profundamente a correspondência direta entre registradores da RTL e registradores da netlist. Sem SVF, o Formality pode não conseguir reconstruir o mapeamento correto.

### 3. Internal scan: verificação funcional precisa ignorar o modo de teste

Internal scan é inserido por DFT Compiler. Ele transforma flip-flops comuns em scan flip-flops. Um scan flip-flop geralmente tem pelo menos dois caminhos de entrada:

- caminho funcional, usado em operação normal;
- caminho de scan, usado em teste.

O sinal `test_se` ou equivalente seleciona qual caminho está ativo. Se `test_se = 0`, o circuito opera normalmente. Se `test_se = 1`, os flip-flops participam da cadeia de scan.

Na verificação de equivalência entre RTL funcional e netlist com scan, a pergunta correta é:

> A netlist com scan, quando colocada em modo funcional, é equivalente ao RTL original?

Portanto, o modo scan precisa ser desabilitado. O slide mostra:

```tcl
set_constant i:/WORK/TOP/test_se 0
```

Esse comando fixa `test_se` em zero no design de implementação. Assim, o Formality não tenta comparar comportamento de teste com comportamento funcional.

Erro comum: esquecer de fixar o sinal de scan enable. O resultado costuma ser falha de verificação em muitos compare points, mesmo que o design funcional esteja correto.

### 4. Boundary scan: cuidado porque a fronteira do chip muda

Boundary scan é adicionado por BSD Compiler e também é conhecido como JTAG ou IEEE 1149.1. Diferente do internal scan, que atua nos registradores internos, o boundary scan atua nas bordas do chip: entradas e saídas primárias.

Isso é crítico para Formality porque entradas e saídas primárias são regiões naturalmente usadas na comparação. Se a implementação possui células de boundary scan e a referência não possui, os cones lógicos ligados às entradas e saídas mudam.

O slide propõe desabilitar a lógica de boundary scan com `set_constant`. Se existir um TAP reset assíncrono opcional, como `TRSTZ`, o comando pode ser:

```tcl
set_constant i:/WORK/TOP/TRSTZ 0
```

Se o design possui apenas os quatro sinais obrigatórios de TAP (`TMS`, `TCK`, `TDI`, `TDO`), talvez seja necessário forçar uma rede interna:

```tcl
set_constant i:/WORK/alu/somenet 0
```

A ideia é a mesma: colocar a infraestrutura JTAG em estado que não interfira na função normal.

### 5. Clock-gating: otimização de potência que altera o caminho de clock

Clock-gating é adicionado por Power Compiler para reduzir potência. A lógica é simples: se um banco de registradores não precisa mudar, não faz sentido clockar esse banco.

Mas isso cria um problema formal. Na RTL original, o registrador pode estar ligado diretamente ao clock `CLK`. Na implementação, o clock que chega ao registrador pode ser uma versão controlada, com latches, gates e enable. O Formality pode criar compare points para essas novas células e falhar porque elas não existem na referência.

O slide apresenta o comando:

```tcl
set_verification_clock_gate_hold_mode low
```

Esse comando informa como o Formality deve tratar o modo de hold/inatividade das células de clock-gating. A aula também diz que Auto Setup Mode habilita clock-gating por padrão, o que reforça a importância de `set synopsys_auto_setup true`.

Se os problemas continuarem, o slide menciona:

```tcl
set_verification_clock_gate_edge_analysis true
```

Esse comando deve ser visto como um recurso adicional, não como primeira tentativa. A primeira tentativa é sempre usar corretamente SVF e Auto Setup Mode.

### 6. Clock tree buffering: mesmo clock, múltiplos ramos

Clock tree buffering não é clock-gating. Clock-gating liga/desliga clock para poupar potência. Clock tree buffering distribui clock por buffers para dirigir cargas grandes e reduzir problemas de distribuição.

No top-level, o Formality geralmente não exige setup adicional. Mas se a verificação for feita em um sub-bloco, a referência pode ter um único pino `clk`, enquanto a implementação pode ter clocks derivados `clk1`, `clk2`, `clk3`. Nesse caso, o Formality precisa saber que esses sinais correspondem funcionalmente ao clock original.

O slide mostra:

```tcl
set_user_match r:/WORK/blocka/clk \
  i:/WORK/blocka/clk1 \
  i:/WORK/blocka/clk2 \
  i:/WORK/blocka/clk3
```

Esse comando cria uma correspondência definida pelo usuário. Ele diz que o `clk` da referência deve ser casado com os clocks derivados da implementação.

Erro comum: tentar resolver clock tree buffering com `set_constant`. Isso estaria conceitualmente errado, pois o clock não deve ser fixado; ele deve ser reconhecido como equivalente em suas versões distribuídas.

### 7. FSM re-encoding: estados diferentes, comportamento igual

Finite State Machine re-encoding é uma transformação de síntese que altera a codificação interna dos estados. Por exemplo:

RTL original:

```text
IDLE  = 2'b00
READ  = 2'b01
WRITE = 2'b10
DONE  = 2'b11
```

Implementação recodificada:

```text
IDLE  = 4'b0001
READ  = 4'b0010
WRITE = 4'b0100
DONE  = 4'b1000
```

Os bits dos estados são diferentes, mas a máquina pode continuar tendo a mesma sequência funcional. O Formality não deve comparar bit a bit os registradores de estado como se eles fossem iguais. Ele precisa entender o mapeamento entre codificações.

O slide orienta verificar a informação no SVF em:

```text
./formality_svf/svf.txt
```

E apresenta:

```tcl
set_svf_ignore_unqualified_fsm_information false
```

Essa variável permite usar informações de FSM do SVF que, dependendo do contexto, poderiam ser ignoradas. O slide também diz que Auto Setup Mode habilita o uso dessas informações por padrão.

### 8. Black boxes: verificar em torno do bloco, não dentro dele

Black box é um módulo ou entidade sem lógica interna disponível para verificação. Isso é comum com:

- memórias;
- circuitos analógicos;
- macros especiais;
- IPs fechados;
- módulos ausentes intencionalmente.

O Formality não prova a lógica interna da black box. Ele verifica a lógica ao redor e tenta casar black boxes equivalentes entre referência e implementação.

Uma black box pode surgir de várias formas:

```tcl
set hdlin_unresolved_modules black_box
```

Esse comando transforma módulos não resolvidos em black boxes. É útil, mas perigoso se usado sem revisão, porque pode esconder que um arquivo importante não foi lido.

Outro comando:

```tcl
set hdlin_interface_only "$RAM* dram16x8"
```

Esse comando faz com que módulos que começam com `SRAM` e o módulo `dram16x8` sejam tratados apenas pela interface.

Também é possível declarar explicitamente:

```tcl
set_black_box designID
```

E revisar a lista com:

```tcl
report_black_boxes
```

A regra prática é: black box deve ser uma decisão consciente. Se aparecer uma black box inesperada, investigue.

## Conceitos difíceis explicados em profundidade

### Guidance

Guidance é a orientação fornecida ao Formality para que ele interprete corretamente transformações realizadas na implementação. Ela pode vir do SVF, de comandos manuais ou de variáveis de setup.

Sem guidance, o Formality tenta encontrar equivalência com base nas estruturas e nomes disponíveis. Isso funciona bem para sínteses simples, mas falha quando ocorrem transformações avançadas.

### SVF

SVF é o arquivo de setup/guidance produzido pelo Design Compiler. Ele informa ao Formality transformações aplicadas durante síntese. Esta aula reforça seu uso principalmente para retiming, register merging e register inversion, mas também conecta o SVF a FSM re-encoding e Auto Setup Mode.

### `set_constant`

`set_constant` fixa um sinal em um valor durante a verificação formal. Ele é usado quando determinado modo precisa ser desativado, como scan ou boundary scan.

Exemplos:

```tcl
set_constant i:/WORK/TOP/test_se 0
set_constant i:/WORK/TOP/TRSTZ 0
```

A interpretação correta é: “para fins de equivalência funcional, compare o design nessa condição específica de operação”.

### Internal scan versus boundary scan

Internal scan atua em flip-flops internos e cria scan chains. Boundary scan atua nos pinos de entrada/saída e está associado a JTAG/IEEE 1149.1.

Ambos adicionam lógica de teste. Ambos podem quebrar equivalência se forem comparados no modo errado. Ambos normalmente exigem desativação da lógica de teste durante a comparação funcional.

### Clock-gating versus clock tree buffering

Clock-gating reduz potência bloqueando o clock quando o registrador não precisa mudar.

Clock tree buffering distribui o clock por buffers para dirigir carga grande.

Os dois mexem no caminho de clock, mas por razões diferentes. O primeiro é uma otimização de potência; o segundo é uma necessidade de distribuição elétrica/física.

### `set_user_match`

`set_user_match` informa manualmente que objetos da referência e implementação devem ser considerados correspondentes. É útil quando a ferramenta não consegue casar automaticamente por nome ou estrutura.

No slide, ele é usado para dizer que `clk` da referência corresponde a `clk1`, `clk2` e `clk3` na implementação.

### FSM re-encoding

FSM re-encoding troca a representação binária dos estados. Se o Formality não souber o mapeamento, pode concluir falsamente que os registradores de estado não equivalem.

A informação de re-encoding deve ser conferida no SVF, especialmente em:

```text
./formality_svf/svf.txt
```

### Black box

Black box é um bloco sem lógica interna verificada. O Formality trata a interface e o contexto, mas não prova a função interna. É uma solução necessária para memórias, IPs fechados ou blocos analógicos, mas deve ser controlada cuidadosamente.

## Figuras, diagramas e waveforms importantes

### Figura do internal scan

A figura mostra que, antes do scan, os flip-flops comuns fazem parte do caminho funcional. Depois do scan, cada flip-flop recebe entradas adicionais de teste. O ponto de estudo é perceber que a função combinacional vista pelo Formality muda se o modo scan não for desativado.

### Figura do boundary scan

A figura compara um chip antes e depois da inserção de boundary scan. O pós-boundary scan adiciona células junto às saídas e um TAP controller. O ponto de estudo é perceber que a fronteira do chip muda, e essa fronteira é justamente onde muitos compare points são criados.

### Figura do clock-gating

A figura mostra o antes e depois de um banco de registradores. Antes, o clock chega diretamente. Depois, passa por lógica de enable (`clken`). O ponto de estudo é entender que a função de dados pode ser equivalente, mas a rede de clock mudou.

### Figura do clock tree buffering

A figura mostra um clock único antes do buffering e múltiplos ramos após buffering. O ponto de estudo é distinguir distribuição de clock de mudança funcional. Em sub-blocos, o Formality pode precisar de `set_user_match` para casar o clock original com os clocks derivados.

### Figura das black boxes

A figura mostra `Top_ref` e `Top_imp`, ambos com `Mod_a` e `Ram(Black-Box)`. O ponto de estudo é que a RAM precisa ser casada entre os dois designs, mas sua lógica interna não será provada pelo Formality.

## Pontos de prova e revisão

### Perguntas prováveis

1. **Qual arquivo é recomendado para fornecer guidance ao Formality?**  
   O SVF, arquivo de setup/guidance automatizado gerado pelo Design Compiler.

2. **Qual comando habilita Auto Setup Mode?**

```tcl
set synopsys_auto_setup true
```

3. **Por que internal scan exige atenção em equivalence checking?**  
   Porque substitui flip-flops comuns por scan flip-flops e adiciona lógica de teste, alterando a função vista se o modo scan não for desativado.

4. **Qual comando pode desativar scan enable no design de implementação?**

```tcl
set_constant i:/WORK/TOP/test_se 0
```

5. **Boundary scan também é conhecido como quê?**  
   JTAG ou IEEE 1149.1.

6. **Por que clock-gating pode causar falha de comparação?**  
   Porque cria lógica no caminho do clock, pode introduzir latches de clock-gating e altera os cones de clock dos registradores.

7. **Qual comando é mostrado para tratar clock-gating?**

```tcl
set_verification_clock_gate_hold_mode low
```

8. **Quando `set_user_match` aparece na aula?**  
   No caso de clock tree buffering em verificação de sub-bloco, para mostrar que clocks derivados são equivalentes ao clock original.

9. **Onde verificar a informação ASCII gerada a partir do SVF para FSM re-encoding?**

```text
./formality_svf/svf.txt
```

10. **O que é uma black box?**  
    Um módulo ou entidade sem lógica interna verificada, usado para blocos como memória, IP fechado ou circuito analógico.

11. **Qual comando lista black boxes?**

```tcl
report_black_boxes
```

### Pegadinhas importantes

- **Scan não é erro funcional.** É lógica de teste. O erro é comparar sem desativar o modo de teste.
- **Boundary scan altera a fronteira do chip.** Isso afeta entradas e saídas primárias.
- **Clock-gating não é clock tree buffering.** Um economiza potência; o outro distribui clock.
- **FSM re-encoding muda bits de estado, não necessariamente comportamento.**
- **Black box não prova a lógica interna.** Ela apenas permite verificar o entorno e casar blocos equivalentes.
- **`set_constant` deve ser usado com intenção funcional clara.** Fixar sinais errados pode mascarar problemas reais.
- **Auto Setup Mode resolve muito, mas não tudo.** Ainda é necessário interpretar relatórios e revisar comandos.

## Relação com projeto/laboratório

Esta aula é diretamente aplicável quando o fluxo do laboratório ou projeto usa Design Compiler e Formality. Depois da síntese, o projeto pode conter transformações que não existiam na RTL. Ao rodar Formality, erros de equivalência podem surgir não porque o RTL está errado, mas porque o setup está incompleto.

No contexto de script, esta aula ajuda a entender por que uma sequência de Formality não deve simplesmente fazer:

```tcl
read_verilog -r rtl.v
read_verilog -i netlist.v
set_top top
match
verify
```

Em um fluxo real, pode ser necessário incluir:

```tcl
set synopsys_auto_setup true
set_svf default.svf
set_constant i:/WORK/TOP/test_se 0
```

ou comandos específicos para clock-gating, boundary scan, black boxes e FSM re-encoding.

Também ajuda a interpretar logs de falha. Se muitos compare points falham após inserção de scan, clock-gating ou boundary scan, o primeiro diagnóstico não deve ser “o design está errado”. Deve ser: “o setup da transformação foi corretamente informado ao Formality?”.

## Checklist de qualidade

- [x] Texto dos slides foi convertido para texto real.
- [x] Conceitos difíceis foram explicados, não apenas citados.
- [x] Código/comandos foram preservados e explicados.
- [x] Figuras relevantes foram interpretadas.
- [x] O Markdown ficou útil para estudar sem abrir o DOCX.
- [x] O próximo bloco foi indicado ao final.

## Próximo bloco

- **Bloco 055:** `05 Match and Verify`
- **Arquivo para anexar:** `C:\Users\maiko\ci_expert\Aulas2Prints\08 Formality Jumpstart\05 Match and Verify.docx`
- **Salvar Markdown em:** `C:\Users\maiko\ci_expert\mdCursoPt2\08 Formality Jumpstart\05 Match and Verify.md`
