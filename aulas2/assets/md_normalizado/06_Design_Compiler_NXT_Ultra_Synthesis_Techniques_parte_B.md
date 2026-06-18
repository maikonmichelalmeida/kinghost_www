# 06 Design Compiler NXT Ultra Synthesis Techniques — parte B

## Controle do bloco
- Bloco: 040
- Arquivo de origem: `C:\Users\maiko\ci_expert\Aulas2Prints\07 Design Compiler NXT - RTL Synthesis\06 Design Compiler NXT Ultra Synthesis Techniques.docx`
- Faixa de slides: 26-50
- Caminho sugerido para salvar: `C:\Users\maiko\ci_expert\mdCursoPt2\07 Design Compiler NXT - RTL Synthesis\06 Design Compiler NXT Ultra Synthesis Techniques_parte_B.md`
- Próximo bloco recomendado: 041 — `06 Design Compiler NXT Ultra Synthesis Techniques - parte C`

## Resumo executivo

Esta parte continua a aula de `compile_ultra` mostrando o lado mais delicado da otimização: a ferramenta melhora QoR removendo hierarquias, atravessando fronteiras de sub-blocos, otimizando para scan, priorizando métricas específicas e agrupando caminhos de timing.

A ideia central é que o DC NXT pode melhorar muito timing e área quando recebe liberdade para reestruturar o projeto. Porém essa liberdade tem efeitos colaterais: a hierarquia da netlist pode ficar diferente da hierarquia RTL, testbenches baseados em caminhos hierárquicos podem quebrar, e fluxos de verificação formal podem exigir mais cuidado.

A segunda metade do bloco entra em **path groups**. Esse é um conceito muito importante: por padrão, o DC NXT organiza caminhos de timing por clock de captura. Isso pode fazer caminhos importantes ficarem “ignorados” se outro caminho crítico dominar o grupo. A solução é criar grupos de caminho definidos pelo usuário e ajustar `critical_range` e `weight`.

---

## Texto extraído e organizado por slide

### Slide 26 — Auto-Ungrouping of `DesignWare` Hierarchies

O slide afirma que o auto-ungrouping também remove automaticamente hierarquias de componentes **DesignWare**.

Quando um operador aritmético vira um componente DesignWare, ele pode aparecer inicialmente como uma hierarquia interna. Com `compile_ultra`, essa hierarquia pode ser removida para permitir melhor otimização lógica e física.

Para desabilitar auto-ungrouping em hierarquias DesignWare antes de `compile_ultra`:

```tcl
set_app_var compile_ultra_ungroup_dw false
```

Ideia principal:

- Por padrão, `compile_ultra` pode “achatar” componentes DesignWare.
- Isso melhora otimização.
- Mas pode reduzir a preservação da estrutura hierárquica original.

---

### Slide 27 — Boundary Optimization — ON by Default

Boundary optimization é ligada por padrão.

O slide mostra um design com sub-blocos `SUB1`, `SUB2`, `SUB3` e `SUB4`. Mesmo usando:

```tcl
compile_ultra -no_autoungroup
```

a ferramenta ainda pode otimizar através das fronteiras dos blocos usando boundary optimization.

O slide destaca três otimizações:

1. **Complement propagation**
   - Propaga o complemento de um sinal para reduzir lógica.

2. **Constant propagation**
   - Remove gates redundantes quando existem entradas constantes, como tie-high e tie-low.

3. **Unconnected pin propagation**
   - Remove gates redundantes associados a saídas desconectadas.

Nota importante do slide:

> Pode afetar verificação formal com ferramentas de terceiros e testbenches RTL baseados em hierarquia.

---

### Slide 28 — Controlling Boundary Optimization

Boundary optimization é ligada por padrão com `compile_ultra`.

Para desabilitar completamente:

```tcl
compile_ultra -no_boundary_optimization
```

Para desabilitar em sub-designs seletivos antes de `compile_ultra`:

```tcl
set_boundary_optimization <cells designs> false
```

Para desabilitar constant propagation, que por padrão fica habilitada mesmo com `-no_boundary_optimization`:

```tcl
set_app_var \
  compile_enable_constant_propagation_with_no_boundary_opt false
```

Para desabilitar constant propagation em pinos específicos de sub-blocos:

```tcl
set_compile_directives -constant_propagation false \
  [get_pins "SUB2/In2 SUB2/In3"]
```

---

### Slide 29 — Design Partitioning

Particionamento em sub-designs ou blocos é comum em projetos grandes. O slide lista razões:

- Separar funções distintas.
- Tornar tamanho e complexidade mais gerenciáveis.
- Gerenciar projeto em ambiente de equipe.
- Permitir reuso de design.
- Outras razões organizacionais e físicas.

O slide lembra que a hierarquia lógica de sub-designs é definida no Verilog ou VHDL por:

```text
module
entity
```

---

### Slide 30 — Partitioning Guidelines for Design Compiler NXT

Diretrizes de particionamento:

- Criar blocos tão grandes quanto possível, considerando:
  - memória disponível;
  - tempo aceitável de execução.

- Particionar em saídas registradas.
  - Facilita aplicar constraints nos blocos.
  - Permite otimização combinacional e sequencial que seria impedida por fronteiras de hierarquia.

- Considerar requisitos de floorplanning hierárquico.
  - Cada hierarquia física, ou macro, deve corresponder a um bloco lógico.

O slide mostra a diferença entre hierarquia lógica e hierarquia física. A hierarquia física aparece quando blocos individuais são posicionados e roteados como macros, integrados no nível pai.

---

### Slide 31 — Scan Registers: The Problem

Como a maioria dos designs inclui scan chains, o impacto dos registradores scan deve ser considerado durante a síntese.

Problema mostrado:

- Um registrador normal vira um registrador scan multiplexado.
- O mux de scan aumenta área.
- O mux de scan aumenta requisito de setup.
- Se esse impacto for ignorado, o design pode fechar timing antes do scan e falhar depois da inserção de scan.

Resumo do slide:

> Since most designs include scan chains, expect the impact of scan registers during synthesis, to avoid negative results after scan insertion.

---

### Slide 32 — Test-Ready Synthesis — The Solution

A solução é usar síntese preparada para teste.

Comandos mostrados:

```tcl
set_scan_configuration -style \
<multiplexed_flip_flop | clocked_scan | lssd | aux_clock_lssd>

compile_ultra -scan ;# AND
compile_ultra -incremental -scan
```

Pontos importantes:

- Scan registers são adicionados durante `compile`, mas não são encadeados em scan chains nessa etapa.
- O impacto de área e timing é modelado antecipadamente.
- O fluxo fica mais simples porque a inserção de scan cell ocorre em uma etapa de compilação.
- Test-ready synthesis requer licença de **DFT Compiler**.

---

### Slide 33 — Automatic Shift-Register Identification

Durante `compile_ultra -scan`, o DC NXT identifica automaticamente shift registers.

O slide destaca:

- Buffers ou inversores entre registradores não impedem a identificação.
- Apenas o primeiro registrador é substituído por equivalente scan.
- Isso melhora área.
- Reduz o fanout de scan-enable.
- O recurso é ligado por padrão.

Para desabilitar:

```tcl
set_app_var compile_seqmap_identify_shift_registers false
```

---

### Slide 34 — Quiz sobre Boundary Optimization

Questão:

```text
Select the correct statements regarding boundary optimization during compile_ultra:
```

Resposta correta indicada pelo curso:

```text
b, c and d
```

A interpretação correta:

- Boundary optimization é ligada por padrão e pode ser controlada.
- Pode quebrar testbench de simulação que dependia da hierarquia RTL.
- Pode melhorar timing e área.
- Pode afetar verificação formal em certos fluxos, principalmente com ferramentas de terceiros.

---

### Slide 35 — Quiz sobre Auto-Ungrouping

Questão:

```text
Select the correct statement regarding Auto-ungrouping
```

Alternativas visíveis:

a. Is invoked with `compile_ultra -auto_ungroup`  
b. Can only be applied to all or none of the sub-designs  
c. Does not ungroup DesignWare hierarchies, by default  
d. Ungroups all poorly partitioned sub-designs  
e. None of the above  

---

### Slide 36 — Correção do Quiz sobre Auto-Ungrouping

A resposta correta indicada pelo curso é:

```text
e. None of the above
```

Justificativa:

- Não existe necessidade de chamar `compile_ultra -auto_ungroup`; o recurso já é ligado por padrão.
- Não é apenas tudo ou nada; pode ser controlado seletivamente.
- DesignWare hierarchies podem ser ungrouped por padrão.
- A ferramenta não garante remover literalmente todos os sub-designs mal particionados; ela decide conforme heurísticas e necessidade de otimização.

---

### Slide 37 — Quiz sobre Test-Ready Synthesis com `compile_ultra -scan`

Questão:

```text
Test-ready synthesis with compile_ultra -scan:
```

Alternativas visíveis:

a. Enables the additional delay or area impact of scan registers to be considered during compile  
b. Performs scan register insertion and scan chain stitching  
c. Speeds up the scan-in to scan-out path delay  
d. All of the above  

---

### Slide 38 — Correção do Quiz sobre Test-Ready Synthesis

Resposta correta indicada pelo curso:

```text
a
```

Justificativa:

- `compile_ultra -scan` permite considerar o impacto de atraso e área dos registradores scan durante o compile.
- O slide anterior afirma que os registradores scan são adicionados durante compile, mas **não são chained**.
- Portanto, “all of the above” é rejeitado.

---

### Slide 39 — Targeted QoR Optimization

O comando `set_qor_strategy` pode ser usado na etapa de síntese para melhorar desempenho em uma métrica específica:

```text
timing
total_power
```

Características:

- Funciona apenas com:
  ```tcl
  compile_ultra -spg
  ```

- Ajusta variáveis internamente para orientar a síntese a uma métrica específica de QoR.

Exemplo do slide:

```tcl
set_qor_strategy -metric {timing} -stage synthesis
```

A tabela mostrada indica que opções internas como as seguintes passam a ser configuradas como target setting:

```text
compile_timing_high_effort
psynopt_tns_high_effort
```

---

### Slide 40 — Enhanced TNS Optimization

Enhanced TNS optimization melhora o **TNS** do design durante compile e incremental compile.

Pontos do slide:

- Funciona apenas com:
  ```tcl
  compile_ultra -spg
  ```

- Pode aumentar:
  - runtime;
  - área;
  - WNS.

- Deve ser habilitado antes do compile principal.

- Usa a variável `compile_enhanced_tns_optimization_effort_level` para selecionar candidatos de células aprimorados para motores de otimização de delay.

Comandos:

```tcl
set_app_var compile_enhanced_tns_optimization true
# default is false for main compile and true for incremental compile

set_app_var compile_enhanced_tns_optimization_effort_level "high"
# default is low
```

---

### Slide 41 — Prioritizing Setup Timing over DRCs

Por padrão, as constraints de design rule abaixo têm maior prioridade que timing durante a otimização:

```text
max_transition
max_fanout
max_capacitance
```

Se a ferramenta puder corrigir apenas uma violação de DRC ou uma violação de timing, mas não as duas, ela corrige o DRC mesmo prejudicando timing.

Em alguns casos, é mais importante priorizar setup timing sobre violações de DRC.

Para aumentar a prioridade de setup timing sobre max DRCs:

```tcl
set_cost_priority -delay
```

O slide ressalta que a correção de DRC ainda é feita, mas não deve afetar setup timing.

---

### Slide 42 — Clock Network: Default DRC-Disabling

Por padrão, a correção de DRC é automaticamente desabilitada em nets de clock diretamente conectadas a pinos de clock de registradores.

Motivo:

- Buffering de clock antes de CTS normalmente não é desejado.
- A árvore real de clock será construída depois, por uma ferramenta de implementação física/CTS.

Mas o slide alerta:

- Nets de clock separadas dos pinos de clock por lógica **não** têm DRC desabilitado.
- Essas nets podem receber buffers para cumprir DRCs.

---

### Slide 43 — Disabling DRCs on Entire Clock Network

Para desabilitar DRC fixing em toda a rede de clock:

```tcl
set_auto_disable_drc_nets -on_clock_network true
```

Isso evita que a ferramenta tente inserir buffering em partes da rede de clock que ainda estão antes da CTS, incluindo trechos que passam por alguma lógica intermediária.

---

### Slide 44 — Default Path Groups

Durante `compile`, cada timing path é colocado em um **path group** associado ao clock de captura daquele caminho.

O DC NXT otimiza cada path group por vez, começando pelo caminho crítico em cada grupo.

Comando citado:

```tcl
report_path_group
```

Função:

```text
Lista os path groups definidos no current design.
```

Exemplo do slide:

- Caminhos capturados por `CLK2` entram no grupo `CLK2`.
- Caminhos capturados por `CLK3` entram no grupo `CLK3`.
- Caminhos capturados por `CLK4` entram no grupo `CLK4`.

---

### Slide 45 — Problem: Sub-Critical Paths Ignored

Por padrão, a otimização dentro de um path group para quando:

- todos os caminhos do grupo cumprem timing; ou
- o caminho crítico não pode mais ser melhorado.

Nesse segundo caso, apenas um conjunto de caminhos subcríticos é otimizado, para economizar runtime.

Problema:

- caminhos subcríticos, mas ainda importantes, podem ficar sem otimização;
- isso pode deixar o design mais frágil para variações futuras, mudanças físicas ou ECOs.

Pergunta do slide:

```text
What are some advantages of optimizing sub-critical paths?
```

Resposta conceitual:

- melhora robustez;
- reduz quantidade de caminhos próximos da violação;
- melhora TNS;
- facilita fechamento em etapas posteriores.

---

### Slide 46 — Problem: Register-to-Register Paths Ignored

O slide mostra um caso em que, por má partição, constraints de entrada e saída são propositalmente pessimistas.

Pergunta:

```text
What happens if the "critical path" is an I/O path and Design Compiler NXT gives up on it?
```

Problema:

- se o caminho crítico dominante for um I/O pessimista, a ferramenta pode gastar esforço nele;
- caminhos internos register-to-register podem ser ignorados;
- isso é ruim porque caminhos reg-to-reg frequentemente são os caminhos mais relevantes para a qualidade real do bloco.

---

### Slide 47 — Solution: User-Defined Path Groups

Path groups customizados dão mais controle sobre otimização.

Pontos do slide:

- Cada path group é otimizado independentemente.
- O pior violador em um path group não impede a otimização em outro path group.

O slide separa conceitualmente:

- input paths;
- output paths;
- register-to-register paths;
- combinational paths.

Observação:

- A criação manual de path groups é apresentada para explicar o conceito.
- Criação automática de path groups também está disponível.

---

### Slide 48 — Creating User-defined Path Groups

Exemplo de comandos:

```tcl
# Ensure that the reg-reg paths get optimized
group_path -name INPUTS -from [all_inputs]
group_path -name OUTPUTS -to [all_outputs]
group_path -name COMBO -from [all_inputs] -to [all_outputs]
```

Perguntas do slide:

```text
Where are the register-to-register paths?
Are the COMBO paths in three path groups?
```

Interpretação:

- Os caminhos reg-to-reg normalmente ficam no grupo do clock de captura, por exemplo `CLK`.
- Um caminho combinacional de entrada para saída pode aparecer afetado pelos grupos `INPUTS`, `OUTPUTS` e `COMBO`, dependendo de como os grupos são definidos e priorizados.
- A figura mostra que os caminhos críticos em `CLK`, `INPUTS` e `OUTPUTS` também são otimizados.
- Caminhos near-critical continuam não sendo otimizados por padrão.

---

### Slide 49 — Enabling Near-Critical Path Optimization

O `critical_range` define uma faixa em relação ao pior ou caminho crítico.

Recomendação do slide:

```text
Do not exceed 10% of the clock period
```

Exemplo:

```tcl
group_path -name CLK -critical_range 0.2
```

Interpretação:

- Todos os caminhos do grupo `CLK` dentro da faixa crítica são otimizados.
- Caminhos violadores fora da faixa não são otimizados.
- Caminhos que já cumprem timing nunca são otimizados.

---

### Slide 50 — Prioritizing Path Groups: `-weight`

Path groups podem receber prioridade relativa de otimização por meio de `-weight`.

O slide afirma que isso permite melhorias em um grupo, mesmo que elas degradem o pior violador de outro grupo, se a função de custo global melhorar:

```text
Σ neg_slack × weight
```

Recomendações:

- Peso 5 para caminhos mais críticos, normalmente register-to-register.
- Peso 2 para caminhos menos críticos.
- Peso 1 para os demais caminhos, por exemplo I/O paths imprecisos.

Exemplo do slide:

```tcl
group_path -name INPUTS -from [all_inputs]
group_path -name OUTPUTS -to [all_outputs]
group_path -name COMBO -from [all_inputs] \
                      -to   [all_outputs]

group_path -name CLK -critical_range 0.2 -weight 5
```

---

## Aula didática desenvolvida

### 1. A grande questão desta parte: liberdade de otimização versus preservação estrutural

A síntese precisa equilibrar duas forças.

De um lado, o projetista quer preservar a estrutura RTL porque ela ajuda no debug, na revisão, na verificação e no entendimento do projeto.

De outro lado, a ferramenta quer liberdade para otimizar. Muitas vezes, uma hierarquia criada para organização humana é ruim para a ferramenta. Ela pode impedir propagação de constantes, impedir compartilhamento de lógica, impedir remoção de gates redundantes ou criar fronteiras artificiais no caminho crítico.

Por isso aparecem recursos como:

```text
auto-ungrouping
boundary optimization
DesignWare ungrouping
```

Todos eles dão mais liberdade para o DC NXT melhorar timing, área e QoR.

---

### 2. Auto-ungrouping de DesignWare

Quando o RTL usa operadores aritméticos, a ferramenta pode inferir componentes DesignWare. Esses componentes podem aparecer como hierarquias intermediárias.

Exemplo conceitual:

```verilog
assign y = a * b + c;
```

Isso pode virar internamente algo como:

```text
DW_mult
DW_add
```

Se a hierarquia DesignWare for preservada rigidamente, a ferramenta pode ficar limitada. Ao remover essa hierarquia, ela consegue reestruturar a lógica, otimizar células e melhorar timing.

Mas existe um custo: a netlist fica menos parecida com a estrutura inicial.

Quando preservar DesignWare for importante, usa-se:

```tcl
set_app_var compile_ultra_ungroup_dw false
```

---

### 3. Boundary optimization: otimizar sem necessariamente apagar a hierarquia

Auto-ungrouping remove hierarquias. Boundary optimization é mais sutil: ela permite que a ferramenta otimize atravessando a fronteira dos blocos.

Imagine:

```text
SUB_A gera um sinal constante
SUB_B usa esse sinal em uma porta AND
```

Se a ferramenta não puder atravessar a fronteira, a porta AND fica lá. Se ela puder propagar a constante, pode simplificar a lógica.

Casos mostrados no slide:

- Complement propagation.
- Constant propagation.
- Unconnected pin propagation.

Essas otimizações são excelentes para QoR, mas podem mudar a correspondência com o RTL. Um sinal que existia no RTL pode desaparecer ou mudar de forma na netlist.

---

### 4. Por que boundary optimization pode afetar testbench e formal

Testbenches RTL às vezes acessam sinais internos por caminhos hierárquicos, por exemplo:

```systemverilog
tb.dut.SUB2.u_logic.signal_x
```

Depois da síntese, se a lógica foi atravessada, removida ou simplificada, esse caminho pode não existir mais. Mesmo que o comportamento funcional esteja correto, o testbench estrutural quebra.

Na verificação formal, a situação é parecida. Ferramentas como Formality são preparadas para muitas transformações, mas fluxos com ferramentas de terceiros ou testbenches baseados em RTL podem ter dificuldade se a estrutura mudar muito.

---

### 5. Particionamento correto reduz a necessidade de “forçar” otimização

O melhor cenário não é depender de auto-ungrouping para consertar uma hierarquia ruim. O ideal é particionar bem desde o RTL.

A recomendação principal do slide é:

```text
particionar em saídas registradas
```

Por quê?

Porque registradores criam fronteiras naturais de timing. Se um bloco termina em registrador, é mais fácil aplicar constraints, mais fácil analisar timing e mais fácil integrar com outros blocos.

Partição ruim:

```text
entrada → lógica combinacional → fronteira → lógica combinacional → fronteira → registrador
```

Partição melhor:

```text
entrada → lógica combinacional → registrador → fronteira
```

A primeira cria caminhos combinacionais atravessando hierarquias. A segunda cria uma divisão mais limpa.

---

### 6. Scan precisa ser considerado antes de virar problema

Em ASIC, scan é parte do fluxo de teste de fabricação. Um registrador comum recebe muxes ou estruturas adicionais para permitir carregamento e observação durante teste.

Esse mux não é neutro:

- aumenta área;
- aumenta delay;
- altera setup;
- altera carga;
- pode afetar fanout de sinais de teste.

Por isso o curso recomenda test-ready synthesis.

Com:

```tcl
compile_ultra -scan
```

a ferramenta considera o impacto de scan durante a síntese. Isso evita o erro clássico:

```text
1. sintetiza sem scan
2. timing fecha
3. insere scan
4. timing quebra
```

O detalhe de prova é importante: no enquadramento do curso, `compile_ultra -scan` considera impacto e insere scan registers, mas não faz o scan chain stitching completo.

---

### 7. Shift-register identification

Um shift register é uma sequência de registradores conectados em cadeia. Durante scan, se todos os registradores fossem substituídos por scan flops independentes, haveria custo desnecessário.

A identificação automática permite substituir apenas o primeiro por equivalente scan em certos casos. Isso reduz área e fanout de scan-enable.

Comando para desligar:

```tcl
set_app_var compile_seqmap_identify_shift_registers false
```

O normal é deixar ligado, a menos que o fluxo de DFT exija controle específico.

---

### 8. Targeted QoR e Enhanced TNS

QoR significa **Quality of Results**. Em síntese, as métricas mais comuns são:

- WNS — Worst Negative Slack;
- TNS — Total Negative Slack;
- número de violadores;
- área;
- potência;
- DRCs;
- congestionamento;
- correlação com pós-layout.

`set_qor_strategy` é uma forma de pedir para a ferramenta ajustar seu comportamento interno para uma meta. Exemplo:

```tcl
set_qor_strategy -metric {timing} -stage synthesis
```

Isso não substitui constraints corretas. Ele apenas direciona a ferramenta.

Já enhanced TNS optimization tenta melhorar o conjunto total de violações, não apenas o pior caminho. Isso pode melhorar a distribuição geral de slack, mas tem trade-offs:

- mais runtime;
- mais área;
- possível impacto no WNS.

Por isso o slide fala “might increase runtime, area and WNS”.

---

### 9. Setup timing versus DRCs

Por padrão, DRCs lógicos como:

```text
max_transition
max_fanout
max_capacitance
```

têm prioridade sobre timing.

Isso faz sentido porque DRCs protegem a validade elétrica do circuito. Uma violação de max transition, por exemplo, pode invalidar modelos de delay e potência.

Mas em alguns casos, especialmente em caminhos críticos, o projetista pode querer priorizar setup timing:

```tcl
set_cost_priority -delay
```

O ponto sutil é: isso não manda ignorar DRCs. O slide diz que DRC fixing ainda é realizado, mas não deve prejudicar setup timing.

---

### 10. Cuidado com DRC em redes de clock

Antes da CTS, a ferramenta de síntese não deve construir uma árvore de clock definitiva. Quem faz isso é a etapa física de Clock Tree Synthesis.

Por isso, em nets de clock diretamente ligadas a pinos de clock de registradores, o DC NXT desabilita automaticamente DRC fixing.

O problema aparece quando o clock passa por alguma lógica. A ferramenta pode não reconhecer toda a rede como clock puro e pode inserir buffers para cumprir DRCs. Isso não é desejado antes da CTS.

Para desabilitar DRC fixing na rede de clock inteira:

```tcl
set_auto_disable_drc_nets -on_clock_network true
```

---

### 11. Path groups: a ideia mais importante da parte B

O DC NXT não otimiza todos os caminhos como uma lista única. Ele organiza caminhos em grupos. Por padrão, cada caminho entra no grupo associado ao clock de captura.

Isso parece bom, mas pode causar problemas.

Imagine que o grupo `CLK` tem um caminho absurdamente ruim e vários caminhos quase críticos. A ferramenta pode gastar esforço no pior caminho. Se não conseguir melhorá-lo, ela pode parar cedo e deixar outros caminhos importantes sem otimização.

Por isso o curso introduz path groups definidos pelo usuário.

---

### 12. Por que caminhos reg-to-reg podem ser ignorados

Em projetos mal particionados, os caminhos de I/O podem ser pessimistas. Se os input/output delays foram colocados muito agressivos para proteger integração, um caminho de entrada ou saída pode virar o pior violador.

A ferramenta tenta resolver esse caminho. Se ela não consegue, pode deixar de melhorar caminhos internos reg-to-reg, mesmo que esses sejam mais importantes para o bloco.

A solução é separar os tipos de caminho em grupos.

---

### 13. Criando grupos definidos pelo usuário

Exemplo do slide:

```tcl
group_path -name INPUTS -from [all_inputs]
group_path -name OUTPUTS -to [all_outputs]
group_path -name COMBO -from [all_inputs] -to [all_outputs]
```

Com isso:

- caminhos de entrada entram em `INPUTS`;
- caminhos de saída entram em `OUTPUTS`;
- caminhos puramente combinacionais de entrada para saída entram em `COMBO`;
- caminhos register-to-register continuam no grupo do clock, por exemplo `CLK`.

Assim, o pior violador em `INPUTS` não impede otimização em `CLK`.

---

### 14. `critical_range`: otimizar caminhos quase críticos

Por padrão, caminhos near-critical podem não ser otimizados.

O `critical_range` define uma janela ao redor do pior caminho do grupo. Exemplo:

```tcl
group_path -name CLK -critical_range 0.2
```

Se o pior caminho do grupo tem certo atraso, os caminhos dentro de 0,2 ns dessa criticidade também recebem atenção.

Recomendação do slide:

```text
não exceder 10% do período de clock
```

Isso evita gastar runtime demais otimizando caminhos que não são realmente críticos.

---

### 15. `-weight`: prioridade relativa entre grupos

O `-weight` altera a importância relativa de um path group na função de custo da otimização.

A ideia do slide é:

```text
Σ negative_slack × weight
```

Se o grupo `CLK` recebe peso 5, uma violação nesse grupo pesa mais do que uma violação equivalente em um grupo de peso 1.

Exemplo:

```tcl
group_path -name CLK -critical_range 0.2 -weight 5
```

Uso recomendado:

- peso 5 para caminhos reg-to-reg;
- peso 2 para caminhos importantes, mas menos críticos;
- peso 1 para caminhos menos confiáveis ou menos importantes, como I/O paths pessimistas.

---

## Conceitos difíceis explicados em profundidade

### Auto-ungrouping de DesignWare

DesignWare cria componentes internos otimizados para aritmética e datapath. O auto-ungrouping permite que a ferramenta remova essa hierarquia e integre a lógica ao restante do design.

Isso pode melhorar:

- timing;
- área;
- sharing de lógica;
- otimização física.

Mas pode piorar:

- legibilidade da netlist;
- debug estrutural;
- correspondência com RTL;
- fluxos formais menos preparados.

Comando de controle:

```tcl
set_app_var compile_ultra_ungroup_dw false
```

---

### Boundary optimization

Boundary optimization não é exatamente “apagar hierarquia”. Ela permite otimizar através de fronteiras.

Exemplo:

```text
SUB1 gera A
SUB2 usa A
```

Se `A` é constante ou complementar a outro sinal, a ferramenta pode simplificar `SUB2` usando informação que veio de `SUB1`.

Desligar globalmente:

```tcl
compile_ultra -no_boundary_optimization
```

Desligar seletivamente:

```tcl
set_boundary_optimization <cells designs> false
```

Desligar propagação de constante em pinos específicos:

```tcl
set_compile_directives -constant_propagation false \
  [get_pins "SUB2/In2 SUB2/In3"]
```

---

### Particionamento em saídas registradas

É uma técnica de arquitetura RTL para criar fronteiras limpas.

Uma saída registrada significa que o bloco entrega dados já sincronizados em flip-flop. Isso reduz caminhos combinacionais atravessando hierarquias e torna a constraint mais previsível.

Vantagens:

- facilita síntese hierárquica;
- simplifica constraints;
- reduz dependência de boundary optimization;
- melhora previsibilidade do timing;
- facilita integração física.

---

### Test-ready synthesis

Test-ready synthesis antecipa efeitos de DFT.

Comando típico:

```tcl
compile_ultra -scan
```

Isso considera que flip-flops terão estrutura scan. O timing fica mais realista porque o mux de scan já é levado em conta.

Ponto de prova:

```text
compile_ultra -scan considera impacto de scan, mas não faz scan chain stitching completo no contexto do curso.
```

---

### TNS e WNS

**WNS** é o pior slack negativo. Mostra o caminho mais violado.

**TNS** é a soma dos slacks negativos. Mostra o volume total de violação.

Um design pode ter WNS pequeno, mas TNS enorme, se muitos caminhos violam pouco. Enhanced TNS optimization tenta melhorar essa distribuição geral.

Comandos:

```tcl
set_app_var compile_enhanced_tns_optimization true
set_app_var compile_enhanced_tns_optimization_effort_level "high"
```

---

### DRCs lógicos em síntese

Neste contexto, DRC não é DRC físico de layout. É design rule constraint lógica/elétrica da biblioteca, como:

```text
max_transition
max_fanout
max_capacitance
```

Essas regras garantem que as células sejam usadas dentro dos limites caracterizados.

Por padrão, elas têm prioridade sobre timing. Para inverter prioridade em casos específicos:

```tcl
set_cost_priority -delay
```

---

### Path groups

Um path group é um conjunto de caminhos de timing que a ferramenta otimiza como grupo.

Por padrão:

```text
path group = clock de captura
```

Mas o projetista pode criar grupos customizados:

```tcl
group_path -name INPUTS -from [all_inputs]
group_path -name OUTPUTS -to [all_outputs]
group_path -name COMBO -from [all_inputs] -to [all_outputs]
```

Isso evita que um tipo de caminho domine toda a otimização.

---

### `critical_range`

Define quais caminhos próximos ao crítico devem ser otimizados.

Exemplo:

```tcl
group_path -name CLK -critical_range 0.2
```

Se o clock é de 2 ns, 0,2 ns é 10% do período. O slide recomenda não passar disso.

---

### `-weight`

Dá prioridade relativa entre grupos.

Exemplo:

```tcl
group_path -name CLK -critical_range 0.2 -weight 5
```

Esse grupo passa a ter mais importância na função de custo. É útil para garantir que caminhos internos reg-to-reg sejam tratados como prioridade maior que I/O paths imprecisos ou pessimistas.

---

## Figuras, diagramas e waveforms importantes

### DesignWare ungrouping

A figura mostra um componente aritmético DesignWare sendo absorvido por `compile_ultra`. O estudo dessa figura ajuda a entender por que a netlist pode perder sub-hierarquias que pareciam existir no RTL/GTECH.

### Boundary optimization

A figura mostra um caminho crítico atravessando vários sub-blocos. As setas indicam propagação de complemento, constantes e pinos desconectados. É uma das figuras mais importantes para entender otimização através de fronteiras.

### Design partitioning

O diagrama mostra uma lógica grande sendo dividida em blocos `A`, `B` e `C`. A mensagem é que hierarquia é necessária, mas deve ser planejada para não prejudicar síntese.

### Scan registers

A figura do registrador scan multiplexado mostra o mux adicional antes do flip-flop. Esse mux é o motivo de aumento de área e setup.

### Clock network DRC-disabling

A figura mostra quais nets de clock têm DRC desabilitado e quais ainda podem ser bufferizadas. O ponto crítico é que clock passando por lógica pode não ser protegido automaticamente.

### Default path groups

A figura mostra caminhos `path1`, `path2`, `path3`, `path4` sendo agrupados por clocks de captura, como `CLK2`, `CLK3`, `CLK4`.

### Sub-critical paths ignored

O gráfico mostra que apenas o pior caminho ou um conjunto limitado de caminhos próximos pode ser otimizado, deixando outros subcríticos sem tratamento.

### User-defined path groups

A figura separa input paths, output paths, register-to-register paths e combinational paths. Essa separação é a base para otimização mais controlada.

### `critical_range` e `weight`

Os gráficos mostram como uma faixa crítica seleciona caminhos próximos ao pior violador e como `weight` muda prioridade relativa entre grupos.

---

## Pontos de prova e revisão

1. Auto-ungrouping remove hierarquias DesignWare por padrão.
2. Para impedir ungrouping de DesignWare:
   ```tcl
   set_app_var compile_ultra_ungroup_dw false
   ```
3. Boundary optimization é ligada por padrão com `compile_ultra`.
4. Para desligar boundary optimization:
   ```tcl
   compile_ultra -no_boundary_optimization
   ```
5. Boundary optimization pode propagar complemento, constantes e pinos desconectados.
6. Boundary optimization pode afetar testbenches RTL baseados em hierarquia.
7. A resposta correta do quiz de boundary optimization é:
   ```text
   b, c and d
   ```
8. A resposta correta do quiz de auto-ungrouping é:
   ```text
   None of the above
   ```
9. Particionar em saídas registradas é recomendado.
10. `compile_ultra -scan` considera impacto de área e atraso de registradores scan.
11. No curso, `compile_ultra -scan` não deve ser entendido como scan chain stitching completo.
12. A resposta correta do quiz de test-ready synthesis é:
   ```text
   a
   ```
13. Shift-register identification é ligado por padrão.
14. Para desligar identificação automática de shift registers:
   ```tcl
   set_app_var compile_seqmap_identify_shift_registers false
   ```
15. `set_qor_strategy` funciona apenas com:
   ```tcl
   compile_ultra -spg
   ```
16. Enhanced TNS optimization pode melhorar TNS, mas pode aumentar runtime, área e WNS.
17. DRCs como `max_transition`, `max_fanout` e `max_capacitance` têm prioridade sobre timing por padrão.
18. Para priorizar setup timing sobre max DRCs:
   ```tcl
   set_cost_priority -delay
   ```
19. DRC fixing é automaticamente desabilitado em clock nets diretamente conectadas a clock pins de registradores.
20. Para desabilitar DRC fixing em toda a rede de clock:
   ```tcl
   set_auto_disable_drc_nets -on_clock_network true
   ```
21. Por padrão, path groups são associados ao clock de captura.
22. `report_path_group` lista os path groups do current design.
23. Path groups definidos pelo usuário permitem otimização mais independente.
24. Exemplo:
   ```tcl
   group_path -name INPUTS -from [all_inputs]
   group_path -name OUTPUTS -to [all_outputs]
   group_path -name COMBO -from [all_inputs] -to [all_outputs]
   ```
25. `critical_range` otimiza caminhos próximos ao pior caminho do grupo.
26. Recomendação: `critical_range` não deve exceder 10% do clock period.
27. `-weight` dá prioridade relativa ao path group.
28. Recomendação: peso 5 para caminhos reg-to-reg mais críticos.

---

## Relação com projeto/laboratório

Em um script real de síntese, esta aula aparece como controle fino antes e durante `compile_ultra`.

Exemplo de trecho de script com alguns recursos desta parte:

```tcl
# Preservar algumas hierarquias importantes
set_ungroup [get_cells U_DEBUG_BLOCK] false

# Controlar boundary optimization em bloco sensível
set_boundary_optimization [get_cells U_FORMAL_SENSITIVE] false

# Preparar síntese para scan
set_scan_configuration -style multiplexed_flip_flop
compile_ultra -scan
```

Em fluxo com SPG e foco em timing:

```tcl
set_qor_strategy -metric {timing} -stage synthesis
set_app_var compile_enhanced_tns_optimization true
set_app_var compile_enhanced_tns_optimization_effort_level "high"

group_path -name INPUTS -from [all_inputs]
group_path -name OUTPUTS -to [all_outputs]
group_path -name COMBO -from [all_inputs] -to [all_outputs]
group_path -name CLK -critical_range 0.2 -weight 5

compile_ultra -spg
```

Para rede de clock antes de CTS:

```tcl
set_auto_disable_drc_nets -on_clock_network true
```

A conexão com laboratório é direta: quando um relatório de timing mostra caminhos I/O dominando ou quando a netlist final perde hierarquias esperadas, esta aula explica o porquê.

---

## Checklist de qualidade

- [x] Texto dos slides foi convertido para texto real.
- [x] Conceitos difíceis foram explicados, não apenas citados.
- [x] Código/comandos foram preservados e explicados.
- [x] Figuras relevantes foram interpretadas.
- [x] O Markdown ficou útil para estudar sem abrir o DOCX.
- [x] O próximo bloco foi indicado ao final.
