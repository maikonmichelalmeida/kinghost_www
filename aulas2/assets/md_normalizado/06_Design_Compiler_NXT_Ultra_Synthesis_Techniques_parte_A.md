# 06 Design Compiler NXT Ultra Synthesis Techniques — parte A

## Controle do bloco
- Bloco: 039
- Arquivo de origem: `C:\Users\maiko\ci_expert\Aulas2Prints\07 Design Compiler NXT - RTL Synthesis\06 Design Compiler NXT Ultra Synthesis Techniques.docx`
- Faixa de slides: 1-25
- Caminho sugerido para salvar: `C:\Users\maiko\ci_expert\mdCursoPt2\07 Design Compiler NXT - RTL Synthesis\06 Design Compiler NXT Ultra Synthesis Techniques_parte_A.md`
- Próximo bloco recomendado: 040 — `06 Design Compiler NXT Ultra Synthesis Techniques - parte B`

## Resumo executivo

Esta aula começa a parte central de otimização do **Design Compiler NXT** com `compile_ultra`. Até aqui, o fluxo já cobriu bibliotecas, leitura de RTL, elaboração, bibliotecas físicas, floorplan e constraints. Agora o foco passa para a etapa em que o DC NXT realmente transforma o RTL em uma netlist otimizada, tentando cumprir timing, DRCs lógicos, área, potência e melhor correlação física.

A ideia principal é que `compile_ultra` não é apenas um comando de “sintetizar”. Ele ativa um conjunto amplo de algoritmos: otimização arquitetural, otimização lógica, mapeamento para gates, otimizações aritméticas com **DesignWare**, duplicação de lógica, análise de bibliotecas, auto-ungrouping, boundary optimization, preparação para scan, estratégias direcionadas de QoR, priorização de setup e controle de DRCs em redes de clock.

O ponto mais importante para prova e projeto é entender o equilíbrio entre **melhor QoR** e **preservação da estrutura original**. Algumas otimizações melhoram timing e área, mas podem modificar hierarquia, atravessar fronteiras de submódulos e dificultar debug, equivalência formal ou testbenches RTL baseados em hierarquia.

---

## Texto extraído e organizado por slide

### Slide 1 — Design Compiler NXT Physical Synthesis Flow

O slide mostra novamente o fluxo de síntese física do DC NXT. A etapa destacada agora é:

```tcl
Synthesize the Design
```

Fluxo geral:

1. Specify Libraries
2. Load RTL Code
3. Load Floorplan
4. Apply Constraints
5. Synthesize the Design
6. Analyze Results
7. Write out Netlist with Cell Placement

A mensagem é que, depois de configurar bibliotecas, floorplan e constraints, entra a fase de síntese/otimização propriamente dita.

---

### Slide 2 — Requirements for Optimal Synthesis Results

Para atingir metas agressivas de timing com boa correlação pós-layout, o slide aponta como importantes:

- RTL de boa qualidade, otimizado para Design Compiler NXT.
- Constraints completas e precisas.
- Uso das técnicas de otimização do Design Compiler NXT Ultra.
- Uso dos recursos de physical guidance do DC NXT.

Recomendação do slide:

- Compilar blocos tão grandes quanto possível no fluxo top-down.
- Isso reduz número de arquivos de constraints, compilações e iterações.
- O DC NXT não tem limite inerente de tamanho de projeto; o limite prático é memória disponível e tempo aceitável de execução.

Observação destacada:

> Nesta unidade, assume-se que você começa com RTL e constraints de boa qualidade e executa compilações top-down.

---

### Slide 3 — Default `compile_ultra` Optimizations

O `compile_ultra` executa três níveis de otimização:

1. **Architectural level / high-level synthesis**
   - Executado apenas quando a entrada é RTL ou `.ddc` não mapeado.
2. **Logic level / GTECH optimization**
   - Otimização da lógica genérica antes do mapeamento tecnológico.
3. **Gate-level / mapping optimization**
   - Mapeamento e otimização usando células reais da biblioteca alvo.

Prioridade de otimização:

- DRCs lógicos e timing.
- Minimizar área sem afetar outras constraints.

Em modo topographical/topo, o comando também executa placement e estimativa de roteamento “under the hood” para calcular RCs das nets.

Inclui ainda:

- Placement-driven HFN synthesis.
- Scan reordering.
- Algoritmos adicionais de alta performance.
- Requer licença Ultra e DesignWare Foundation.

---

### Slide 4 — What is the DesignWare Library?

A biblioteca **DesignWare** é apresentada como uma coleção de blocos soft IP e componentes de datapath:

- Independentes de tecnologia.
- Pré-verificados.
- Reutilizáveis.
- Parametrizáveis.
- Sintetizáveis.

Formas de acesso:

1. **Inferência de operadores**
   - Para operadores aritméticos e relacionais:
     ```verilog
     +, -, *, >, =, <
     ```
   - Operadores maiores que 4 bits podem inferir sub-blocos hierárquicos.

2. **Instanciação direta de IPs padrão**
   - Exemplos:
     ```text
     DW_fifo, DW_shifter, DW_div_seq, DW_ram, ...
     ```

Durante `compile_ultra`, a DesignWare Foundation License permite:

- Otimizações aritméticas e de datapath.
- Acesso aos IPs DesignWare.
- Inclusão automática da DesignWare em `synthetic_library` e `link_library`.

---

### Slide 5 — Singleton Arithmetic Optimization

A DesignWare permite usar um gerador de datapath para criar várias implementações possíveis de operadores aritméticos:

```text
+, -, *, <, >, <=, >=
```

Para cada operador isolado, `compile_ultra` pode escolher a melhor implementação que atenda timing. Exemplo: para um somador `A + B`, o gerador pode avaliar alternativas como:

- Ripple carry adder.
- Carry look-ahead.
- Carry-select.
- Carry-save.
- Outras arquiteturas dependentes da biblioteca e do tamanho do operador.

A escolha inicial busca a menor implementação que ainda cumpra timing. Depois, a implementação escolhida é otimizada para a tecnologia alvo.

---

### Slide 6 — Datapath Optimization: CSA Transformations

O slide mostra uma expressão aritmética do tipo:

```verilog
y <= a * b + c * d - e - f;
```

A implementação direta pode gerar uma cadeia de multiplicadores, somadores e subtratores em série, ficando:

- pequena e lenta, ou
- rápida e grande.

A transformação CSA, isto é, **Carry-Save Adder**, reorganiza a árvore aritmética para reduzir atraso de propagação de carry. O resultado mostrado é:

- circuito menor e mais rápido;
- melhor eficiência para expressões aritméticas com múltiplos termos.

Mensagem do slide:

> CSA transformations result in the most efficient arithmetic circuit — smaller and faster.

---

### Slide 7 — Arithmetic Expression Optimization

O slide lista otimizações de expressão aritmética:

#### Constant or operand folding

Exemplo conceitual:

```text
A + 2*B - 2 + B - A + 7  ->  3*B + 5
```

A ferramenta simplifica constantes e termos repetidos.

#### Common sub-expression sharing

Exemplo:

```text
Z1 = A + B + C
Z2 = C + D + B
```

Pode ser reescrito para compartilhar partes comuns, reduzindo lógica repetida.

#### SOP para POS transformation

Exemplo conceitual:

```text
A*C + B*C  ->  (A + B) * C
```

#### Comparator sharing

Vários comparadores relacionados podem compartilhar um único subtrator com múltiplas saídas de comparação.

#### Parallel constant multipliers optimization

Multiplicações por constantes podem ser decompostas e compartilhadas usando deslocamentos e somas.

---

### Slide 8 — Load Splitting and Combo Logic Duplication

O slide mostra um caso de lógica combinacional com grande fanout e um caminho crítico.

Antes:

- uma única lógica alimenta muitos destinos;
- parte do fanout está no caminho crítico;
- a carga grande aumenta atraso.

Depois:

- a lógica é duplicada/restruturada;
- um ramo alimenta o caminho crítico;
- outro ramo alimenta o fanout grande.

Resultado:

- reduz atraso no caminho crítico;
- circuito fica mais rápido;
- custo: maior área.

Mensagem do slide:

> Load-splitting and logic duplication reduces critical path delays — results in faster but larger circuit.

---

### Slide 9 — Library Analysis (ALIB)

**ALIB** é a análise de biblioteca feita para caracterizar a tecnologia alvo.

Ela cria um cache de implementações pré-construídas para uma ampla faixa de funções booleanas complexas.

Benefícios:

- melhora otimização de área;
- evita recalcular alternativas repetidamente;
- é gerado uma vez por biblioteca tecnológica;
- é reutilizado por compilações posteriores e por outros usuários.

O slide mostra uma função booleana complexa e duas implementações possíveis usando células disponíveis na biblioteca alvo.

---

### Slide 10 — Quiz sobre DesignWare

Questão do slide:

> Select the correct statement regarding DesignWare:

Alternativas visíveis:

a. Requires additional library variable settings prior to invoking `compile_ultra`  
b. Uses operator inferencing to synthesize a wide variety of arithmetic and relational operators  
c. Uses operator inferencing to synthesize a wide variety of standard IP. Example: FIFOs, shift-registers, sequential dividers

Resposta correta indicada pelo curso:

```text
B
```

Justificativa: a inferência automática por operador vale especialmente para operadores aritméticos e relacionais. IPs padrão podem ser instanciados, mas não é correto dizer que todos eles são acessados por “operator inferencing”.

---

### Slide 11 — Preservation of Sub-Block Pins

O slide mostra um projeto dividido em sub-blocos hierárquicos. A ferramenta precisa preservar definições de pinos nas hierarquias de sub-blocos. Isso limita otimizações.

Consequências mostradas:

- `U1` não pode ser removido reconectando entrada diretamente a `FF1/QB`.
- `U2` e `U3`, mesmo com entradas constantes, não podem ser removidos.
- `U4`, com saída desconectada, não pode ser removido.
- `U5` e `U6` não podem ser combinados em uma porta AND de 3 entradas.
- `U7` e `FF2` não podem ser combinados em um único enable flip-flop.

Pergunta do slide:

```text
What does compile_ultra do?
```

A resposta vem nos slides seguintes: ele pode remover ou atravessar hierarquias quando otimizações como auto-ungrouping e boundary optimization estão habilitadas.

---

### Slide 12 — Auto-Ungrouping — ON by Default

O slide afirma:

```text
Auto-ungrouping is ON, by default, with compile_ultra
```

Função:

- remove automaticamente hierarquias de sub-designs mal particionados;
- ajuda quando as fronteiras de I/O da hierarquia impedem timing;
- permite otimizações combinacionais e sequenciais que seriam bloqueadas por fronteiras artificiais.

Para desabilitar auto-ungrouping globalmente:

```tcl
compile_ultra -no_autoungroup
```

Para desabilitar seletivamente antes de `compile_ultra`:

```tcl
set_ungroup <references_or_cells> false
```

---

### Slide 13 — Auto-Ungrouping Example

O exemplo mostra que, antes de `compile_ultra`, a hierarquia impede otimizações ao longo do caminho crítico.

Depois do auto-ungrouping:

- a lógica combinacional pode ser otimizada atravessando antigas fronteiras;
- uma lógica sequencial do tipo `DFF-ENBL` pode ser transformada logicamente;
- o circuito final pode ficar menor e mais rápido.

Nota importante do slide:

> Pode afetar verificação formal com ferramentas de terceiros e testbenches RTL baseados em hierarquia.

---

### Slide 14 — Auto-Ungrouping of DesignWare Hierarchies

O auto-ungrouping também remove automaticamente hierarquias de componentes DesignWare.

Para desabilitar auto-ungrouping em hierarquias DesignWare antes de `compile_ultra`:

```tcl
set_app_var compile_ultra_ungroup_dw false
```

Isso é útil quando se deseja preservar a estrutura DesignWare para debug, análise ou compatibilidade com algum fluxo.

---

### Slide 15 — Boundary Optimization — ON by Default

Boundary optimization é ativada por padrão com `compile_ultra`.

Ela permite otimizações através das fronteiras de sub-blocos sem necessariamente remover toda a hierarquia. O slide mostra três efeitos:

1. **Complement propagation**
   - Conecta a forma complementar de um sinal para reduzir lógica.
2. **Constant propagation**
   - Remove lógica redundante quando entradas estão presas em constante.
3. **Unconnected pin propagation**
   - Remove lógica relacionada a saídas desconectadas.

A ideia é permitir que a ferramenta enxergue além das fronteiras rígidas de módulos.

---

### Slide 16 — Controlling Boundary Optimization

Para desabilitar boundary optimization completamente:

```tcl
compile_ultra -no_boundary_optimization
```

Para desabilitar em sub-designs seletivos antes de `compile_ultra`:

```tcl
set_boundary_optimization <cells designs> false
```

Para desabilitar constant propagation quando boundary optimization está desligada:

```tcl
set_app_var compile_enable_constant_propagation_with_no_boundary_opt false
```

Para desabilitar constant propagation em pinos específicos:

```tcl
set_compile_directives -constant_propagation false \
    [get_pins "SUB2/In2 SUB2/In3"]
```

---

### Slide 17 — Design Partitioning

Particionamento em sub-designs ou blocos é comum em projetos grandes por várias razões:

- separar funções distintas;
- manter tamanho e complexidade gerenciáveis;
- facilitar trabalho em equipe;
- permitir reuso;
- organizar integração.

O slide ressalta que a hierarquia lógica do sub-design é definida por `module` em Verilog ou `entity` em VHDL.

---

### Slide 18 — Partitioning Guidelines for Design Compiler NXT

Diretrizes do slide:

- Criar blocos tão grandes quanto possível, respeitando memória disponível e tempo aceitável.
- Particionar em saídas registradas.
- Isso facilita aplicar constraints nos blocos.
- Permite otimizações combinacionais e sequenciais que seriam impedidas por fronteiras de hierarquia.
- Considerar requisitos de floorplanning hierárquico.
- Cada hierarquia física, ou macro, deve corresponder a um bloco lógico.

Ideia central: a partição lógica deve ajudar síntese, timing e implementação física. Uma hierarquia mal escolhida pode impedir otimizações importantes.

---

### Slide 19 — Scan Registers: The Problem

Como a maioria dos designs inclui scan chains, o slide recomenda considerar o impacto de registradores scan durante a síntese para evitar resultados negativos após a inserção de scan.

Problema mostrado:

- Um registrador normal vira um registrador scan com mux na entrada.
- O mux aumenta área.
- O mux aumenta o requisito de setup.
- Se a síntese ignorar esse impacto, o design pode parecer fechar timing antes do scan, mas falhar depois da inserção de scan.

---

### Slide 20 — Test-Ready Synthesis — The Solution

A solução é fazer síntese já considerando scan:

```tcl
set_scan_configuration -style \
    <multiplexed_flip_flop | clocked_scan | lssd | aux_clock_lssd>

compile_ultra -scan

# ou:
compile_ultra -incremental -scan
```

O slide destaca:

> Scan registers are added during compile, but not chained.

Benefícios:

- área e timing de scan são modelados desde cedo;
- fluxo de síntese fica mais fácil;
- inserção de scan cell é feita em uma etapa de compilação.

Requisito:

```text
Test-ready synthesis requires a DFT Compiler license
```

---

### Slide 21 — Automatic Shift-Register Identification

Durante `compile_ultra -scan`, a ferramenta identifica automaticamente shift registers.

Observações do slide:

- Buffers ou inversores entre registradores não impedem a identificação.
- Apenas o primeiro registrador é substituído por equivalente scan.
- Isso melhora área.
- Reduz fanout de scan-enable.
- O recurso é ligado por padrão.

Para desabilitar:

```tcl
set_app_var compile_seqmap_identify_shift_registers false
```

---

### Slide 22 — Quiz sobre Boundary Optimization

Questão:

> Select the correct statements regarding boundary optimization during `compile_ultra`.

Resposta correta indicada pelo curso:

```text
b, c and d
```

Leitura coerente das alternativas visíveis:

- Boundary optimization é ligada por padrão e pode ser controlada seletivamente ou completamente.
- Pode quebrar testbench de simulação que dependia de hierarquia.
- Pode melhorar timing e área.
- Pode também dificultar verificação formal dependendo do fluxo.

---

### Slide 23 — Quiz sobre Auto-Ungrouping

Questão:

> Select the correct statement regarding Auto-ungrouping.

Resposta correta indicada pelo curso:

```text
e. None of the above
```

A alternativa “none of the above” é correta porque:

- Não é invocado por `compile_ultra -auto_ungroup`.
- Não se aplica apenas a tudo ou nada; pode ser controlado seletivamente.
- DesignWare pode sim ser ungrouped por padrão.
- Não remove literalmente todos os sub-designs mal particionados; a decisão é guiada por heurísticas e necessidade de otimização.

---

### Slide 24 — Quiz sobre Test-Ready Synthesis

Questão:

> Test-ready synthesis with `compile_ultra -scan`:

Resposta correta indicada pelo curso:

```text
a
```

Alternativa correta:

> Enables the additional delay or area impact of scan registers to be considered during compile.

O curso rejeita “All of the above”, porque o slide anterior afirma que os scan registers são inseridos durante compile, mas **não são chained** nessa etapa. Portanto, dizer que faz inserção e scan chain stitching no mesmo sentido amplo da alternativa fica incorreto para este contexto.

---

### Slide 25 — Targeted QoR Optimization

O comando `set_qor_strategy` é usado na etapa de síntese para melhorar desempenho em uma métrica específica:

- `timing`
- `total_power`

Características:

- funciona apenas com `compile_ultra -spg`;
- ajusta variáveis internamente para direcionar a síntese a uma métrica de QoR;
- o exemplo do slide usa:

```tcl
set_qor_strategy -metric timing -stage synthesis
```

A tabela mostrada indica que variáveis como `compile_timing_high_effort` e `psynopt_tns_high_effort` passam a ser ativadas como target setting para a métrica de timing.

---

## Aula didática desenvolvida

### 1. Onde esta aula entra no fluxo

Até agora, o fluxo do DC NXT foi preparado para que a ferramenta tenha três tipos de informação:

1. **O que sintetizar**
   - RTL, módulos, hierarquia, bibliotecas lógicas.
2. **Para qual tecnologia sintetizar**
   - target library, link library, Design Library, NDM, TLUPlus, technology file.
3. **Quais metas cumprir**
   - clocks, input/output delays, uncertainty, latency, transition, output load, constraints físicas.

Agora entra o comando de síntese e otimização. No fluxo DC NXT, esse papel é ocupado principalmente por:

```tcl
compile_ultra
```

Esse comando transforma o design de uma representação RTL/GTECH para uma netlist mapeada em células da tecnologia. Mas, no DC NXT moderno, ele também faz muito mais do que apenas substituir operadores por gates.

---

### 2. O que `compile_ultra` realmente faz

Uma forma simples de pensar:

```text
RTL + bibliotecas + constraints + informação física
        ↓
compile_ultra
        ↓
netlist otimizada para timing, DRC, área, potência e correlação física
```

Dentro disso, a ferramenta trabalha em níveis diferentes.

No nível arquitetural, ela pode escolher estruturas melhores para operadores grandes. Por exemplo, um somador de 32 bits pode ter várias arquiteturas possíveis. Um ripple carry adder pode ser pequeno, mas lento. Um carry look-ahead ou carry-select pode ser mais rápido, mas maior. O DC NXT escolhe com base nas constraints.

No nível lógico, ela reestrutura expressões booleanas e aritméticas, remove redundâncias, compartilha subexpressões e propaga constantes.

No nível de gate, ela escolhe células reais da target library: portas NAND, NOR, AOI/OAI, buffers, inversores, flip-flops etc., considerando delay, transição, capacitância, fanout, potência e área.

No modo topographical/topo, existe ainda a estimativa física: a ferramenta usa placement grosseiro e estimativa de roteamento para calcular RCs mais realistas do que uma síntese puramente lógica baseada apenas em fanout.

---

### 3. Por que RTL bom e constraints boas ainda importam

O slide enfatiza que esta unidade assume RTL e constraints de boa qualidade. Isso é importante porque `compile_ultra` não faz milagre.

Se o RTL tem hierarquia ruim, caminhos combinacionais gigantes, resets mal modelados, latches acidentais, clocks derivados de lógica ou operadores escritos de forma confusa, a ferramenta pode até tentar otimizar, mas o QoR tende a ser pior.

Se as constraints estão erradas, a ferramenta otimiza a coisa errada. Por exemplo:

- clock com período muito relaxado → circuito pode ficar lento;
- clock irrealista demais → área explode e ainda assim timing pode falhar;
- output load ausente → a ferramenta assume carga pequena demais;
- input transition ausente → delay interno pode ser subestimado;
- I/O delays ausentes → caminhos de entrada/saída podem ficar sem restrição realista.

O comando de síntese depende do contexto. Ele precisa saber qual é a meta.

---

### 4. Por que compilar blocos grandes ajuda

A recomendação do slide é compilar o maior bloco possível, dentro de memória e tempo aceitáveis.

Motivo: quanto mais a ferramenta enxerga, mais liberdade ela tem para otimizar.

Se um caminho crítico atravessa três blocos, mas cada bloco é sintetizado isoladamente, a ferramenta enxerga apenas pedaços do problema. Ela pode otimizar cada bloco localmente, mas não consegue mover lógica, compartilhar expressões, duplicar lógica ou balancear atrasos entre fronteiras.

Compilar top-down permite:

- menos constraints duplicadas;
- menos arquivos por bloco;
- menos iterações manuais;
- melhor visão global do timing;
- maior chance de otimizações através das fronteiras.

O custo é maior consumo de memória e run time.

---

### 5. DesignWare como motor de otimização aritmética

A DesignWare é essencial para datapaths. Em RTL, um operador como:

```verilog
assign y = a + b;
```

não define uma arquitetura física. Ele diz apenas “some `a` e `b`”. A arquitetura do somador pode variar.

Para poucos bits, a ferramenta pode mapear diretamente em gates simples. Para larguras maiores, ela pode inferir um bloco DesignWare. Isso dá acesso a implementações otimizadas, pré-verificadas e parametrizáveis.

Isso vale especialmente para:

```verilog
+
-
*
<
>
<=
>=
```

Exemplo conceitual:

```verilog
assign result = a * b + c * d - e;
```

Sem otimização de datapath, essa expressão pode virar uma cadeia longa de multiplicadores e somadores. Com DesignWare e transformações CSA, a ferramenta pode montar uma árvore aritmética mais eficiente, reduzindo o caminho crítico.

---

### 6. CSA: por que Carry-Save é tão poderoso

O gargalo de uma soma comum é a propagação do carry. Em um ripple carry adder, cada bit depende do carry anterior. Em expressões com múltiplos operandos, esperar o carry se propagar várias vezes é caro.

Um Carry-Save Adder evita propagar carry imediatamente. Ele mantém soma e carry separados, comprimindo vários operandos até o final, onde apenas uma soma com propagação completa é necessária.

Para uma expressão como:

```verilog
y <= a*b + c*d - e - f;
```

a ferramenta pode evitar uma sequência linear:

```text
multiplica → soma → multiplica → soma → subtrai → subtrai
```

e construir uma árvore mais paralela:

```text
produtos e termos parciais
        ↓
compressores CSA
        ↓
somador final
```

Resultado: menos profundidade lógica e melhor timing.

---

### 7. Load splitting e duplicação de lógica

Uma net com grande fanout atrasa porque o driver precisa carregar muita capacitância. Se essa mesma lógica alimenta um caminho crítico e vários destinos não críticos, o caminho crítico sofre por causa da carga total.

A técnica de load splitting duplica ou reestrutura a lógica:

```text
Antes:
uma lógica → muitos destinos, incluindo caminho crítico

Depois:
lógica duplicada 1 → caminho crítico
lógica duplicada 2 → fanout grande restante
```

Isso melhora timing, mas aumenta área. Essa troca é aceitável quando timing é mais importante que área.

---

### 8. ALIB: por que a ferramenta analisa a biblioteca

A tecnologia possui muitas células equivalentes ou quase equivalentes. A mesma função booleana pode ser implementada com combinações diferentes de NAND, NOR, AOI, OAI, inversores e células complexas.

A análise ALIB cria um cache de implementações úteis. Isso acelera a busca por soluções e melhora a otimização de área. Em vez de redescobrir todas as combinações possíveis em toda compilação, a ferramenta reutiliza conhecimento caracterizado para aquela biblioteca.

---

### 9. Hierarquia: amiga da organização, inimiga de algumas otimizações

Hierarquia é essencial para projeto humano. Ela organiza o sistema, separa responsabilidades e facilita debug.

Mas para síntese, hierarquia pode virar uma parede. Se uma lógica redundante está de um lado da fronteira e uma constante está do outro, a ferramenta pode não conseguir remover a redundância. Se um caminho crítico atravessa muitos blocos pequenos, cada fronteira limita a reestruturação.

Por isso entram:

- auto-ungrouping;
- boundary optimization;
- partitioning guidelines.

---

### 10. Auto-ungrouping

Auto-ungrouping remove hierarquias automaticamente quando elas atrapalham otimização. Ele é ligado por padrão em `compile_ultra`.

Exemplo de impacto:

Antes:

```text
TOP
 ├── SUB1
 ├── SUB2
 ├── SUB3
 └── SUB4
```

Depois da otimização, alguns desses sub-blocos podem desaparecer como entidades hierárquicas na netlist final, com sua lógica absorvida em outro nível.

Vantagem:

- melhora timing;
- melhora área;
- permite otimização combinacional e sequencial.

Risco:

- dificulta debug por hierarquia;
- pode quebrar testbenches que usam caminhos hierárquicos;
- pode dificultar equivalência formal em alguns fluxos;
- pode surpreender quem espera ver os mesmos módulos na netlist.

Comando para desligar globalmente:

```tcl
compile_ultra -no_autoungroup
```

Comando para controlar seletivamente:

```tcl
set_ungroup <references_or_cells> false
```

---

### 11. Boundary optimization

Boundary optimization é diferente de auto-ungrouping.

No auto-ungrouping, a hierarquia pode ser removida. Na boundary optimization, a ferramenta pode otimizar através das fronteiras, mesmo preservando parte da estrutura.

Ela permite:

- propagar constantes;
- remover lógica redundante;
- simplificar sinais complementares;
- eliminar lógica ligada a pinos desconectados.

Desligar globalmente:

```tcl
compile_ultra -no_boundary_optimization
```

Desligar em células ou designs específicos:

```tcl
set_boundary_optimization <cells designs> false
```

---

### 12. Como particionar bem

O slide recomenda particionar em saídas registradas.

Por quê?

Um bloco com saída registrada tem uma fronteira temporal clara. O timing interno termina em flip-flop. Isso facilita aplicar constraints e evita que caminhos combinacionais longos atravessem blocos demais.

Ruim:

```text
bloco A → lógica combinacional → bloco B → lógica combinacional → bloco C
```

Melhor:

```text
bloco A → registrador → bloco B → registrador → bloco C
```

Isso melhora previsibilidade e facilita síntese incremental ou hierárquica.

---

### 13. Test-ready synthesis e scan

Em ASIC, scan é inserido para permitir teste de fabricação. Um flip-flop comum vira um scan flip-flop, normalmente com mux adicional.

Esse mux altera:

- área;
- delay;
- setup time;
- carga e fanout de sinais como scan-enable.

Se você sintetiza ignorando scan, pode ter surpresas depois. Por isso existe:

```tcl
compile_ultra -scan
```

Ele considera o impacto de scan durante a síntese, mas o slide destaca que os scan registers são adicionados sem encadeamento das chains nessa etapa.

---

### 14. Shift-register identification

Shift registers longos podem ser tratados de modo especial durante scan.

Se cada flip-flop de um shift register recebesse mux scan completo, área e fanout de scan-enable poderiam crescer bastante. O recurso automático identifica esse padrão e troca apenas o primeiro registrador por equivalente scan, reduzindo custo.

Para desligar:

```tcl
set_app_var compile_seqmap_identify_shift_registers false
```

---

### 15. Targeted QoR

QoR significa **Quality of Results**, ou qualidade dos resultados. Em síntese, isso normalmente envolve:

- timing;
- área;
- potência;
- DRCs;
- congestionamento;
- correlação física.

O comando:

```tcl
set_qor_strategy -metric timing -stage synthesis
```

pede que a ferramenta ajuste configurações internas para priorizar timing na etapa de síntese, especialmente no fluxo `compile_ultra -spg`.

Isso não substitui boas constraints, mas orienta heurísticas internas para uma meta específica.

---

## Conceitos difíceis explicados em profundidade

### `compile_ultra`

`compile_ultra` é o comando de síntese avançada do DC NXT. Ele realiza otimização em múltiplos níveis:

```text
RTL / unmapped DDC
      ↓
GTECH / lógica genérica
      ↓
mapeamento para biblioteca tecnológica
      ↓
netlist otimizada
```

Ele usa:

- target library;
- link library;
- DesignWare;
- constraints SDC;
- informação física em modo topo;
- estimativas de RC;
- heurísticas de timing, área, DRC e potência.

Erro comum: tratar `compile_ultra` como apenas “gerar gates”. Na prática, ele pode alterar hierarquia, reescrever datapaths e mudar bastante a estrutura da netlist.

---

### DesignWare

DesignWare é uma biblioteca de componentes sintetizáveis e parametrizáveis. Ela entra em dois modos principais:

1. Inferência por operadores RTL.
2. Instanciação explícita de IP.

Exemplo por inferência:

```verilog
assign z = a * b;
```

A ferramenta pode substituir isso por uma implementação DesignWare de multiplicador.

Exemplo por instanciação explícita:

```verilog
DW_fifo ...
DW_shifter ...
DW_div_seq ...
```

Erro comum: achar que todo IP DesignWare aparece automaticamente por operador. Operadores aritméticos e relacionais são inferidos; IPs mais específicos normalmente exigem instanciação.

---

### CSA Transformation

CSA significa **Carry-Save Adder**. É uma técnica para somar múltiplos operandos sem propagar carry em todos os estágios.

Em somas grandes, o carry é o vilão do atraso. O CSA reduz a profundidade do caminho crítico adiando a propagação completa para o final.

É muito útil em:

- multiplicadores;
- somas de muitos termos;
- filtros digitais;
- acumuladores;
- expressões aritméticas grandes.

---

### Auto-Ungrouping

Auto-ungrouping remove hierarquias que atrapalham otimização.

Exemplo:

```verilog
module TOP;
  SUB_A u_a (...);
  SUB_B u_b (...);
endmodule
```

Depois da síntese, `SUB_A` ou `SUB_B` podem desaparecer como níveis hierárquicos na netlist.

Vantagem:

- mais liberdade para otimizar.

Desvantagem:

- menos correspondência com RTL original.

Comando para impedir globalmente:

```tcl
compile_ultra -no_autoungroup
```

Comando seletivo:

```tcl
set_ungroup [get_cells U_CRITICAL_HIER] false
```

---

### Boundary Optimization

Boundary optimization permite otimizar através dos limites dos módulos.

Exemplo conceitual:

```verilog
module A(output y);
  assign y = 1'b0;
endmodule

module B(input x, output z);
  assign z = x & some_signal;
endmodule
```

Se `A.y` alimenta `B.x`, a ferramenta pode propagar a constante `0` para dentro de `B` e simplificar a lógica.

Sem boundary optimization, a fronteira de módulo poderia impedir isso.

---

### Partitioning em saídas registradas

Particionar em saídas registradas significa criar blocos cujas saídas principais saem de flip-flops.

Isso facilita:

- constraints por bloco;
- fechamento de timing;
- integração;
- análise formal;
- síntese hierárquica.

Evita que caminhos combinacionais atravessem muitas fronteiras de submódulos.

---

### Test-ready synthesis

Test-ready synthesis antecipa o impacto de scan.

Sem isso:

```text
síntese fecha timing
↓
scan é inserido
↓
muxes aumentam delay
↓
timing falha
```

Com isso:

```text
síntese já considera scan
↓
timing mais realista
↓
menos surpresa depois
```

Comando principal:

```tcl
compile_ultra -scan
```

---

### Targeted QoR Optimization

`set_qor_strategy` configura a ferramenta para focar em uma métrica específica.

Exemplo:

```tcl
set_qor_strategy -metric timing -stage synthesis
```

Isso ativa internamente opções de esforço mais alto. O trade-off é que maior esforço pode aumentar run time e, às vezes, área ou potência.

---

## Figuras, diagramas e waveforms importantes

### Fluxo de síntese física

O diagrama de fluxo mostra que `compile_ultra` aparece depois de bibliotecas, RTL, floorplan e constraints. Isso reforça que a qualidade da síntese depende do setup anterior.

### Diagrama de DesignWare

O slide de DesignWare mostra que operadores HDL podem virar blocos otimizados. O operador no RTL não determina diretamente a arquitetura física.

### Diagrama CSA

A figura de CSA mostra uma expressão aritmética transformada de uma cadeia de operações para uma rede de compressores/somadores. Esse é um dos pontos mais importantes de otimização aritmética.

### Diagrama de load splitting

Mostra o trade-off clássico:

```text
mais área → menor atraso no caminho crítico
```

### Diagramas de auto-ungrouping e boundary optimization

Esses diagramas explicam por que a hierarquia original do RTL pode desaparecer ou ser atravessada. São figuras essenciais para entender por que a netlist pós-síntese nem sempre se parece com o código RTL.

### Diagramas de scan

Mostram o impacto do mux de scan. A ideia essencial é que scan não é “gratuito”: ele muda timing e área.

---

## Pontos de prova e revisão

1. `compile_ultra` executa otimização arquitetural, lógica e gate-level.
2. Em modo topo, `compile_ultra` usa placement e estimativa de roteamento para calcular RCs.
3. DesignWare é uma coleção de soft IPs e componentes de datapath.
4. DesignWare usa inferência de operadores para operadores aritméticos e relacionais.
5. A resposta correta do quiz sobre DesignWare é **B**.
6. CSA transformations tornam circuitos aritméticos mais eficientes, menores e mais rápidos.
7. Load splitting e logic duplication melhoram timing, mas aumentam área.
8. ALIB caracteriza a target technology library e cria cache de implementações.
9. Auto-ungrouping é ligado por padrão com `compile_ultra`.
10. Para desligar auto-ungrouping globalmente:
    ```tcl
    compile_ultra -no_autoungroup
    ```
11. Para impedir ungroup seletivo:
    ```tcl
    set_ungroup <references_or_cells> false
    ```
12. Auto-ungrouping de DesignWare pode ser desligado com:
    ```tcl
    set_app_var compile_ultra_ungroup_dw false
    ```
13. Boundary optimization é ligada por padrão com `compile_ultra`.
14. Para desligar boundary optimization globalmente:
    ```tcl
    compile_ultra -no_boundary_optimization
    ```
15. Boundary optimization pode melhorar timing e área, mas pode afetar testbenches e verificação formal.
16. A resposta correta do quiz de boundary optimization é **b, c and d**.
17. A resposta correta do quiz de auto-ungrouping é **None of the above**.
18. Particionar em saídas registradas facilita constraints e permite melhor otimização.
19. `compile_ultra -scan` considera impacto de scan durante compile.
20. `compile_ultra -scan` não deve ser entendido como scan chain stitching completo no contexto do quiz.
21. A resposta correta do quiz de test-ready synthesis é **A**.
22. Shift-register identification é ligado por padrão.
23. Para desligar shift-register identification:
    ```tcl
    set_app_var compile_seqmap_identify_shift_registers false
    ```
24. `set_qor_strategy` funciona com `compile_ultra -spg`.
25. Exemplo de targeted QoR:
    ```tcl
    set_qor_strategy -metric timing -stage synthesis
    ```

---

## Relação com projeto/laboratório

Esta aula ajuda diretamente a entender por que scripts reais de síntese não param em:

```tcl
compile_ultra
```

Eles frequentemente incluem opções e variáveis antes da síntese para controlar:

- hierarquia;
- boundary optimization;
- DesignWare;
- scan;
- QoR;
- esforço de timing;
- comportamento em clocks;
- DRCs;
- relatórios e debug.

Em um laboratório ou projeto RTL, isso aparece em arquivos como:

```text
dc.tcl
compile.tcl
constraints.sdc
setup.tcl
```

Exemplo de trecho conceitual:

```tcl
source dc_setup.tcl
source constraints.sdc

set_qor_strategy -metric timing -stage synthesis

compile_ultra -spg
```

Em projetos maiores, pode aparecer também:

```tcl
compile_ultra -scan
compile_ultra -no_autoungroup
compile_ultra -no_boundary_optimization
```

O ponto prático é: cada opção muda a liberdade de otimização da ferramenta. Mais liberdade pode melhorar QoR, mas pode dificultar correspondência com o RTL original. Menos liberdade preserva hierarquia, mas pode piorar timing.

---

## Checklist de qualidade

- [x] Texto dos slides foi convertido para texto real.
- [x] Conceitos difíceis foram explicados, não apenas citados.
- [x] Código/comandos foram preservados e explicados.
- [x] Figuras relevantes foram interpretadas.
- [x] O Markdown ficou útil para estudar sem abrir o DOCX.
- [x] O próximo bloco foi indicado ao final.
