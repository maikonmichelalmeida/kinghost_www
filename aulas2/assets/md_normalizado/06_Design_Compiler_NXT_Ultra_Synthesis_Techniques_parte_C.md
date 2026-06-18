# 06 Design Compiler NXT Ultra Synthesis Techniques — parte C

## Controle do bloco
- Bloco: 041
- Arquivo de origem: `C:\Users\maiko\ci_expert\Aulas2Prints\07 Design Compiler NXT - RTL Synthesis\06 Design Compiler NXT Ultra Synthesis Techniques.docx`
- Faixa de slides: 51-75
- Caminho sugerido para salvar: `C:\Users\maiko\ci_expert\mdCursoPt2\07 Design Compiler NXT - RTL Synthesis\06 Design Compiler NXT Ultra Synthesis Techniques_parte_C.md`
- Próximo bloco recomendado: 042 — `06 Design Compiler NXT Ultra Synthesis Techniques - parte D`

## Resumo executivo

Esta parte fecha a discussão prática sobre **path groups**, prioridades de otimização, paralelismo, relatórios pós-compile, execução em background, compilação incremental, recuperação de área e importância do estilo de RTL.

O núcleo técnico da aula é este: depois que o design foi compilado uma primeira vez, o trabalho não acabou. É preciso analisar violations, olhar timing, controlar quais grupos de caminhos merecem prioridade, usar incremental compile quando fizer sentido, e só então fazer recuperação final de área. A ferramenta não deve ser tratada como “apertar um botão”; ela precisa ser dirigida com boas constraints, bons grupos de caminhos e boa estratégia de otimização.

No final, o curso reforça uma ideia muito importante: **dois códigos RTL funcionalmente equivalentes podem gerar resultados de síntese muito diferentes**. O Design Compiler NXT consegue otimizar bastante, mas não substitui um RTL bem escrito.

---

## Texto extraído e organizado por slide

### Slide 51 — Example: `-weight`

O slide continua o exemplo de path groups e mostra o uso de `-weight`.

Comandos:

```tcl
group_path -name INPUTS  -from [all_inputs]
group_path -name OUTPUTS -to   [all_outputs]
group_path -name COMBO   -from [all_inputs] -to [all_outputs]
group_path -name CLK -critical 0.2 -weight 5
```

A figura mostra uma troca de células nos flip-flops:

- Antes:
  - TNS = 0.9
  - slack de entrada = -0.4 ns
  - slack de clock/reg-to-reg = -0.1 ns
  - `FFslw`: `TCLK->Q = 0.2 ns`, `Tsetup = 0.1 ns`

- Depois:
  - TNS = 0.6
  - slack de entrada = -0.6 ns
  - slack de clock/reg-to-reg = 0.0 ns
  - `FFfst`: `TCLK->Q = 0.1 ns`, `Tsetup = 0.3 ns`

A troca piora o caminho de entrada, mas melhora o grupo de clock. Como o grupo `CLK` tem peso 5, a ferramenta aceita essa troca porque a função de custo ponderada melhora.

---

### Slide 52 — Multi-Clock Example

Resumo do slide:

> If I/O port constraints are known to be pessimistic, focus optimization on all register-to-register paths.

Exemplo de comandos:

```tcl
group_path -name CLK1 -critical 0.3 -weight 5
group_path -name CLK2 -critical 0.1 -weight 5
group_path -name CLK3 -critical 0.2 -weight 2
group_path -name INPUTS  -from [all_inputs]
group_path -name OUTPUTS -to   [all_outputs]
group_path -name COMBO -from [all_inputs] -to [all_outputs]
report_path_group
```

A tabela do slide mostra os grupos:

```text
Group Name   Weight   Critical Range
**default**   1.00       0.00
CLK1          5.00       0.30
CLK2          5.00       0.10
CLK3          2.00       0.20
COMBO         1.00       0.00
INPUTS        1.00       0.00
OUTPUTS       1.00       0.00
```

Pergunta do slide:

```text
If I/O port constraints are accurate, what group_path modification is still useful?
```

Interpretação: mesmo com I/O preciso, ainda é útil aplicar `critical_range` nos grupos de clock, para otimizar caminhos quase críticos register-to-register e não apenas o pior caminho.

---

### Slide 53 — TNS-Driven Placement

A partir da versão 2019.03-SP4, o placement dirigido por timing é focado por padrão na redução de **TNS**, isto é, **total negative slack**.

Pontos do slide:

- Quando `placer_tns_driven` é `true`, o placement tenta reduzir TNS.
- Quando definido como `false`, o placement foca em WNS, isto é, **worst negative slack**.
- Para desabilitar a feature, configurar antes de `compile_ultra`:

```tcl
set_app_var placer_tns_driven false
compile_ultra
```

Padrão:

```text
true
```

---

### Slide 54 — IC Compiler II Link Placer Optimizations

A partir da versão 2019.03, alguns recursos de placement do DC NXT requerem uma imagem instalada do **IC Compiler II**.

Recursos citados:

- Buffering-aware placement.
- Automatic timing control.
- Congestion-driven restructuring.

O slide afirma:

- A instalação do Design Compiler NXT vem com uma imagem padrão do IC Compiler II.
- O DC NXT usa automaticamente essa imagem padrão para habilitar os novos recursos.
- Opcionalmente, é possível especificar uma imagem alternativa com:

```tcl
set_icc2_options -icc2_executable
```

A imagem especificada deve ser P-2019.03 ou posterior.

---

### Slide 55 — IC Compiler II Link Placer Optimizations — Buffer Aware Placement

Buffer-aware placement melhora timing QoR por meio do link com o IC Compiler II.

A ideia:

- Placement inicial pode estimar uma net longa como muito atrasada.
- A otimização posterior pode inserir buffers e reduzir o atraso.
- Mas, se o placement inicial não antecipa esse comportamento, pode tomar decisões ruins.

O recurso **buffering-aware placement** modela atrasos de buffers durante placement para melhorar QoR global.

Comando:

```tcl
set_app_var placer_buffering_aware true
compile_ultra -spg
```

Padrão:

```text
false
```

---

### Slide 56 — IC Compiler II Link Placer Optimizations — Automatic Timing Control

Automatic Timing Control, ou **ATC**, melhora TNS durante placement.

O slide afirma:

- ATC aprimora o cálculo do objetivo de timing para melhorar TNS durante placement.
- Pode ser habilitado durante:
  ```tcl
  compile_ultra -spg
  compile_ultra -spg -incremental
  ```

Comando:

```tcl
set_app_var placer_auto_timing_control true
compile_ultra -spg
```

Padrão:

```text
false
```

---

### Slide 57 — IC Compiler II Link Placer Optimizations — Congestion Driven Restructuring

Congestion-driven restructuring melhora congestionamento causado por árvores lógicas com propriedades comutativas e associativas, como:

- árvores OR;
- árvores AND;
- árvores XOR.

A ideia é reordenar sinais de entrada para reduzir cruzamentos de fios.

Exemplo mostrado:

- antes, vários sinais entram em uma OR tree com muitos cruzamentos;
- depois, os sinais são reordenados para aliviar congestionamento.

Comando:

```tcl
set_app_var placer_cong_restruct true
compile_ultra -spg
```

Padrão:

```text
false
```

---

### Slide 58 — Multi-Core Optimization

O slide apresenta suporte a threading e processamento paralelo durante `compile_ultra`.

Pontos principais:

- É possível especificar de 1 core, o padrão, até 16 cores.
- Mais cores trazem speedup incremental.
- Recomendação: usar 8 cores.
- Medir speedup por **wall-clock time**, não por CPU time.
- Memória recomendada:
  - 4 cores exigem 2x a memória de 1 core.
  - 8 cores exigem 3x a memória de 1 core.
  - swap space = 2x memory.

Comando:

```tcl
set_host_options -max_cores 8
compile_ultra ...
```

---

### Slide 59 — Multi-Core License Requirements

Multi-core exige 1 licença por 8 cores para:

- Design Compiler-Expert, Design Compiler-Extension.
- Design Compiler-Ultra-Features, Design Compiler-Ultra-Opt.
- Design-Compiler, Design-Compiler-NXT.
- DesignWare.
- Power-Compiler, se aplicável.
- Test-Compiler, se aplicável.

Para reportar opções atuais:

```tcl
report_host_options
```

Para desligar otimização multi-core:

```tcl
remove_host_options
```

ou:

```tcl
set_host_options -max_cores 1
```

---

### Slide 60 — Disabling Runtime-Intensive Settings

O comando `compile_prefer_runtime` desabilita configurações de otimização intensivas em runtime.

Exemplos citados:

- múltiplos clocks por registrador;
- menor esforço para relatórios, como `report_congestion`.

As alterações aparecem no logfile.

Afeta comandos como:

```text
compile_ultra
compile_ultra -incr
optimize_netlist -area
```

Pode impactar QoR.

Uso recomendado:

- principalmente com `compile_ultra` pré-floorplan.

Exemplo:

```tcl
compile_prefer_runtime
compile_ultra
```

---

### Slide 61 — Quiz: Near-Critical Paths

Questão:

```text
Near critical paths that would be ignored by default can be optimized by:
```

Alternativas:

a. Placing them in their own path group  
b. Applying a critical range to create_clock  
c. Applying a weight to their path group  
d. All of the above  

A alternativa marcada no print é:

```text
a
```

Interpretação técnica: colocar caminhos near-critical em um grupo próprio pode fazer com que eles sejam tratados como críticos dentro daquele grupo. Também é importante notar que `critical_range` é aplicado a `group_path`, não a `create_clock`.

---

### Slide 62 — Quiz: `-weight`

Questão:

```text
By applying a -weight option to a path group, it is possible to worsen the worst violator in another path group. True or False?
```

A alternativa marcada inicialmente foi:

```text
False
```

---

### Slide 63 — Correção do Quiz: `-weight`

O curso indica que a resposta correta é:

```text
True
```

Justificativa:

- `-weight` altera a função de custo global.
- Um grupo com peso maior pode receber prioridade.
- A ferramenta pode aceitar piorar o pior violador de outro grupo se o custo ponderado global melhorar.

---

### Slide 64 — Quiz: `set_host_options -max_cores`

Questão:

```text
Increasing set_host_options -max_cores from 4 to 16 results in the same speedup factor as increasing it from 1 to 4. True or False?
```

A alternativa marcada inicialmente foi:

```text
False
```

---

### Slide 65 — Correção do Quiz: `set_host_options -max_cores`

O curso indica que a resposta correta é:

```text
True
```

Interpretação dentro do curso:

- O banco espera a leitura de que aumentar a quantidade de cores em 4x, de 1 para 4 ou de 4 para 16, representa o mesmo fator de aumento configurado.
- Ainda assim, do ponto de vista prático, o speedup real não é perfeitamente linear; o próprio slide de multi-core fala em speedup incremental e recomenda medir wall-clock time.

Para prova, priorizar:

```text
True
```

---

### Slide 66 — Generate a Constraint Report After Compile

Depois de `compile_ultra`, gerar relatório de constraints violadas:

```tcl
compile_ultra
report_constraint -all_violators
```

O relatório resume todas as constraints violadas.

Exemplos visíveis no slide:

- `max_delay/setup ('clk' group)`
- endpoints com slack negativo;
- `max_capacitance`;
- nets com capacitância acima do requerido.

Mensagem do slide:

> Summarizes all violating constraints. If no violations are reported, no further analysis or optimization is needed. Use `report_timing` for detailed timing path information.

---

### Slide 67 — Generate Timing Reports

Comando:

```tcl
report_timing
```

O relatório de timing mostra a decomposição de um caminho:

- clock launch edge;
- clock network delay;
- input external delay;
- delay de células/nets;
- data arrival time;
- clock capture edge;
- uncertainty;
- library setup time;
- data required time;
- slack.

O slide informa que timing reports serão discutidos na próxima unidade.

---

### Slide 68 — Parallel Command Execution

Execução paralela acelera comandos de:

- `check_...`
- `report_...`

Características:

- cada comando é atribuído a um core;
- até 8 cores podem ser usados;
- executar `update_timing` antes do relatório paralelo;
- listar até 8 comandos para rodar em paralelo.

Exemplo:

```tcl
set_host_options -max_cores 8
...
update_timing
parallel_execute [list \
  "report_constraint -all > rc.rpt" \
  "report_timing          > rt.rpt" \
  "report_area            > ra.rpt" \
  "report_qor             > rq.rpt" \
  ...
]
```

---

### Slide 69 — Background Command Execution

Usar `redirect -bg` para executar comandos em background.

Pontos do slide:

- Executar reports e comandos de escrita em background enquanto `incremental compile` ou `optimize_netlist -area` roda no foreground.
- `list_commands -bg` mostra comandos suportados para execução em background.
- `redirect -bg -max_cores` define quantos cores serão usados do total configurado por `set_host_options`.
- `parallel_execute` pode ser usado dentro de `redirect -bg`.

Exemplo:

```tcl
set_host_options -max_cores 8
compile_ultra -spg

redirect -bg -max_cores 4 {parallel_execute [list \
  "report_timing > rt.rpt" \
  "report_area   > ra.rpt" \
  "report_qor    > rq.rpt" ]}

compile_ultra -spg -incremental
```

---

### Slide 70 — Subsequent Incremental Compile

Depois do primeiro compile e do scan chain stitching, se aplicável, pode-se executar incremental compile para melhorar os resultados.

Exemplo geral do slide:

```tcl
compile_ultra |-no_autoungroup| |-no_boundary| \
              |-scan| |-retime|

report_timing

# Apply focus to critical path(s):
group_path -critical -weight -from .. -to ..

insert_dft; # Create scan chains

# Execute an incremental compile:
compile_ultra |-scan| |-retime| -incremental
```

Recomendações:

- Se caminhos críticos não estavam antes em um path group focado, colocá-los em seu próprio path group antes do incremental compile.
- Se forem aplicadas outras mudanças de controle de otimização, settings ou constraints para melhorar resultado, aplicar ao RTL ou GTECH e recompilar, não usar incremental.

---

### Slide 71 — Violating Constraints

Se violações de timing ou DRC forem grandes demais depois de incremental compile:

1. modificar timing constraints e ressintetizar o RTL original; ou
2. modificar o código RTL e começar de novo.

Mensagem importante: incremental compile não deve ser usado para tentar consertar problemas estruturais grandes ou constraints incorretas.

---

### Slide 72 — Final Area Recovery

Depois do último compile, executar recuperação final de área:

```tcl
optimize_netlist -area
```

Objetivo:

- melhorar área;
- sem degradar timing;
- sem degradar leakage power.

O slide mostra esse comando depois do compile incremental.

---

### Slide 73 — Synthesis Optimization Overview

Fluxo resumido:

1. Especificar bibliotecas e dados de tecnologia.
2. Carregar RTL.
3. Carregar floorplan.
4. Aplicar timing constraints.
5. Aplicar diretivas de otimização conforme necessário.

Diretivas citadas:

- Desabilitar auto-ungrouping em sub-designs ou DesignWare.
- Desabilitar boundary optimization em sub-designs.
- Definir estilo de scan configuration ou desabilitar shift-register identification.
- Habilitar enhanced TNS optimization.
- Usar recursos de IC Compiler II link placer optimization.
- Priorizar setup timing sobre DRCs.
- Desabilitar DRC fixing em clock network.
- Aplicar path group focus em register-to-register paths.
- Habilitar TNS-driven placement.
- Habilitar multi-core optimization.
- Desabilitar settings intensivos em runtime.

Depois:

```tcl
compile_ultra -scan [-spg -no_autoungroup -no_boundary]
```

Usar path groups para aplicar mais foco nos caminhos críticos.

Por fim:

```tcl
compile_ultra -spg -scan -incr
optimize_netlist -area
```

---

### Slide 74 — The Importance of Quality Source Code

O slide mostra que diferentes pontos de partida levam a diferentes resultados.

Mensagens principais:

- Códigos RTL funcionalmente equivalentes, mas escritos com estilos diferentes, produzem resultados de síntese diferentes.
- Não se pode depender apenas do DC NXT para consertar um design mal codificado.
- Entender como o DC NXT interpreta estilos de RTL permite obter os melhores resultados de síntese.

---

### Slide 75 — Example: Coding to Allow Resource Sharing

O exemplo mostra duas formas possíveis de sintetizar uma estrutura com `if`.

Código:

```verilog
if (SEL)
  SUM = A + B;
else
  SUM = C + D;
```

Duas arquiteturas possíveis:

1. **Resource sharing not applied**
   - dois somadores;
   - multiplexador depois dos somadores;
   - pode ser necessário se o caminho `SEL -> SUM` for crítico.

2. **Resource sharing is applied**
   - multiplexadores antes;
   - um único somador compartilhado;
   - economiza área.

Mensagem do slide:

> Arithmetic resources within an `if` or `case` statement are considered for resource sharing. This allows Design Compiler NXT to select the smallest architecture that meets timing.

---

## Aula didática desenvolvida

### 1. `-weight`: quando piorar um caminho pode ser uma decisão correta

À primeira vista, parece estranho aceitar que um caminho piore depois da otimização. Mas a ferramenta não otimiza olhando apenas um caminho isolado. Ela usa uma função de custo.

Quando você usa:

```tcl
group_path -name CLK -critical 0.2 -weight 5
```

você está dizendo que violações no grupo `CLK` são mais importantes. Se melhorar o caminho reg-to-reg reduz muito o custo ponderado, a ferramenta pode aceitar piorar um caminho de entrada ou saída de peso menor.

Esse comportamento é exatamente o que o quiz reforça: aplicar `-weight` pode piorar o pior violador em outro grupo.

---

### 2. Diferença entre WNS e TNS na decisão de otimização

**WNS**, Worst Negative Slack, olha apenas o pior caminho.  
**TNS**, Total Negative Slack, olha o conjunto das violações.

Exemplo:

```text
Caso A:
1 caminho com -0.50 ns
TNS = -0.50 ns

Caso B:
10 caminhos com -0.08 ns
TNS = -0.80 ns
```

Se a ferramenta foca apenas em WNS, ela pode atacar o caso A. Se foca em TNS, ela pode preferir melhorar o conjunto do caso B.

O slide diz que, a partir de 2019.03-SP4, o placement timing-driven passou a focar por padrão em TNS. Isso ajuda a reduzir a quantidade total de violações, não apenas o pior caso.

---

### 3. IC Compiler II Link Placer: por que o DC NXT usa recursos físicos

O DC NXT trabalha antes do place & route final, mas tenta antecipar problemas físicos.

Recursos como:

```text
buffering-aware placement
automatic timing control
congestion-driven restructuring
```

dependem de capacidades do IC Compiler II. Por isso o slide menciona a imagem do ICC II.

A síntese moderna não é puramente lógica. Ela tenta prever:

- onde as células ficarão;
- quais nets serão longas;
- onde buffers serão necessários;
- onde haverá congestionamento;
- como a estrutura lógica pode ser reordenada para reduzir fios.

Isso melhora correlação entre síntese e pós-layout.

---

### 4. Buffer-aware placement

Sem buffer-aware placement, a ferramenta pode estimar uma net longa como muito ruim e posicionar células tentando reduzir aquela net diretamente.

Mas, na prática, a solução física futura pode inserir buffers. Se o placement souber disso, ele consegue fazer escolhas mais realistas.

Comando:

```tcl
set_app_var placer_buffering_aware true
compile_ultra -spg
```

É especialmente útil para:

- nets longas;
- high fanout;
- interconexões que provavelmente receberão buffers.

---

### 5. Automatic timing control

ATC ajusta a função objetivo de timing durante placement, buscando melhorar TNS. Em vez de tratar placement como apenas posicionamento geométrico, ele o integra melhor com a meta temporal.

Comando:

```tcl
set_app_var placer_auto_timing_control true
compile_ultra -spg
```

Usado com:

```tcl
compile_ultra -spg
compile_ultra -spg -incremental
```

---

### 6. Congestion-driven restructuring

Algumas expressões lógicas são comutativas e associativas. Por exemplo:

```verilog
assign y = a | b | c | d | e;
```

A ordem dos operandos não altera a função. Mas altera o roteamento.

Se sinais fisicamente distantes entram em posições ruins em uma árvore OR, fios cruzam e congestionam. A ferramenta pode reordenar entradas para reduzir cruzamentos.

Comando:

```tcl
set_app_var placer_cong_restruct true
compile_ultra -spg
```

Isso é uma otimização que mistura lógica e física: a função booleana é a mesma, mas a estrutura é reorganizada para ser mais roteável.

---

### 7. Multi-core: mais rápido, mas não “de graça”

O DC NXT pode usar múltiplos cores:

```tcl
set_host_options -max_cores 8
```

Mas isso aumenta memória. O slide dá números práticos:

```text
4 cores → 2x memória de 1 core
8 cores → 3x memória de 1 core
swap → 2x memória
```

A recomendação é usar 8 cores. O speedup deve ser medido por wall-clock time, porque CPU time soma tempo de todos os cores e pode parecer maior mesmo quando o tempo real diminuiu.

---

### 8. Runtime versus QoR

`compile_prefer_runtime` é um atalho para reduzir tempo de execução:

```tcl
compile_prefer_runtime
compile_ultra
```

Ele desliga ou reduz o esforço de otimizações caras.

Isso pode ser útil no compile pré-floorplan, quando a netlist é usada principalmente para gerar o floorplan inicial e não precisa ter QoR final máximo.

Mas há custo:

```text
menos runtime pode significar pior QoR
```

Portanto, usar isso na etapa final de fechamento de timing pode ser perigoso.

---

### 9. Relatórios após compile

Depois de `compile_ultra`, o primeiro relatório recomendado é:

```tcl
report_constraint -all_violators
```

Ele responde: “quais constraints ainda estão violando?”

Se não houver violações, não é necessário investigar cada caminho em detalhes. Se houver, usa-se:

```tcl
report_timing
```

para entender exatamente onde está a violação.

A sequência prática é:

```text
compile
↓
report_constraint -all_violators
↓
report_timing nos caminhos problemáticos
↓
ajustar path groups, constraints ou RTL
↓
incremental compile ou ressíntese completa
```

---

### 10. Execução paralela de relatórios

Relatórios podem consumir tempo. O comando:

```tcl
parallel_execute
```

permite rodar vários relatórios ao mesmo tempo, usando cores diferentes.

Antes, recomenda-se:

```tcl
update_timing
```

Assim, os relatórios usam uma visão temporal atualizada do design.

Exemplo:

```tcl
set_host_options -max_cores 8
update_timing
parallel_execute [list \
  "report_constraint -all > rc.rpt" \
  "report_timing          > rt.rpt" \
  "report_area            > ra.rpt" \
  "report_qor             > rq.rpt" \
]
```

---

### 11. Execução em background

`redirect -bg` permite rodar comandos no background enquanto outro comando principal segue no foreground.

Exemplo:

```tcl
redirect -bg -max_cores 4 {parallel_execute [list \
  "report_timing > rt.rpt" \
  "report_area   > ra.rpt" \
  "report_qor    > rq.rpt" ]}
```

Uso típico:

```text
roda reports em background
enquanto roda incremental compile no foreground
```

Isso melhora produtividade do fluxo, principalmente quando relatórios e escrita de arquivos são longos.

---

### 12. Incremental compile: quando usar e quando não usar

Incremental compile é útil quando o design já foi compilado e você quer melhorar resultados pontuais sem começar do zero:

```tcl
compile_ultra -incremental
```

Também pode ser usado com scan ou retiming:

```tcl
compile_ultra -scan -incremental
compile_ultra -retime -incremental
```

Mas há uma regra importante:

- Se você muda constraints, diretivas grandes ou RTL, não tente “remendar” com incremental.
- Aplique as mudanças ao RTL/GTECH original e recompile.

Incremental compile é ajuste fino, não correção estrutural.

---

### 13. Se ainda viola muito, volte ao RTL ou às constraints

O slide 71 é muito prático: se violações continuam grandes depois de incremental compile, a solução não é insistir infinitamente.

Você deve:

1. corrigir constraints e ressintetizar; ou
2. corrigir RTL e começar de novo.

Isso evita desperdiçar tempo tentando forçar a ferramenta a resolver um problema que veio de especificação errada ou arquitetura ruim.

---

### 14. Final area recovery

Depois que timing está aceitável, a ferramenta pode tentar recuperar área:

```tcl
optimize_netlist -area
```

A ideia é reduzir células grandes ou estruturas excessivas sem degradar timing nem leakage.

Isso deve ser feito no final, porque antes de fechar timing a prioridade é desempenho. Recuperar área cedo demais pode desfazer otimizações úteis.

---

### 15. Código RTL de qualidade

O slide final desta parte reforça algo essencial: o estilo do RTL afeta diretamente a arquitetura que a ferramenta consegue inferir.

No exemplo:

```verilog
if (SEL)
  SUM = A + B;
else
  SUM = C + D;
```

A ferramenta pode escolher:

- dois somadores em paralelo e um mux na saída;
- ou um mux nas entradas e um somador compartilhado.

Se timing permitir, compartilhar o somador economiza área. Se `SEL -> SUM` for crítico, talvez seja melhor não compartilhar, porque colocar mux antes do somador aumenta atraso nesse caminho.

A síntese escolhe com base no RTL e nas constraints.

---

## Conceitos difíceis explicados em profundidade

### `-weight` em `group_path`

O `-weight` é uma prioridade relativa. Ele não “conserta” timing sozinho; ele altera o que a ferramenta considera mais caro.

Exemplo:

```tcl
group_path -name CLK -critical_range 0.2 -weight 5
```

Isso diz:

```text
violações no grupo CLK importam 5 vezes mais do que violações de peso 1
```

Por isso é possível piorar outro grupo. A ferramenta está otimizando o custo total ponderado, não necessariamente o pior slack absoluto de todos os grupos.

---

### TNS-driven placement

TNS-driven placement orienta a etapa de placement a reduzir o total de slacks negativos.

Comando para desligar:

```tcl
set_app_var placer_tns_driven false
```

Quando desligado, o placement foca em WNS.

Regra prática:

- WNS é bom para atacar o pior caminho.
- TNS é bom para reduzir volume total de violações.

---

### IC Compiler II Link Placer

É o uso de recursos do IC Compiler II dentro do fluxo do DC NXT para melhorar decisões físicas durante síntese.

Recursos:

```text
buffering-aware placement
automatic timing control
congestion-driven restructuring
```

Esses recursos conectam lógica, timing e física antes do P&R completo.

---

### `set_host_options -max_cores`

Controla paralelismo.

Exemplo:

```tcl
set_host_options -max_cores 8
```

Cuidados:

- mais cores exigem mais memória;
- speedup real não é sempre linear;
- medir por wall-clock time;
- verificar licenças;
- usar `report_host_options` para conferir configuração.

---

### `compile_prefer_runtime`

Reduz runtime desligando otimizações caras.

Exemplo:

```tcl
compile_prefer_runtime
compile_ultra
```

Indicado para etapas exploratórias ou pré-floorplan. Não é ideal para fechamento final de QoR.

---

### `report_constraint -all_violators`

Mostra todas as constraints violadas.

É um relatório de triagem:

```tcl
report_constraint -all_violators
```

Serve para responder:

- ainda há setup violado?
- há max transition violado?
- há max capacitance violado?
- há max fanout violado?
- quais endpoints/nets estão problemáticos?

---

### `report_timing`

Mostra caminho detalhado.

Exemplo:

```tcl
report_timing
```

Ele mostra a conta do slack:

```text
data required time
- data arrival time
= slack
```

É usado depois de identificar violações no relatório de constraints.

---

### `parallel_execute`

Executa vários comandos independentes em paralelo.

Exemplo:

```tcl
parallel_execute [list \
  "report_constraint -all > rc.rpt" \
  "report_timing          > rt.rpt" \
]
```

É útil para relatórios e checks, não para comandos dependentes em sequência.

---

### `redirect -bg`

Executa comandos em background.

Exemplo:

```tcl
redirect -bg -max_cores 4 {parallel_execute [list \
  "report_timing > rt.rpt" \
  "report_area   > ra.rpt" \
]}
```

Permite continuar outro trabalho enquanto relatórios rodam.

---

### `compile_ultra -incremental`

Refina o resultado após uma compilação anterior.

Exemplo:

```tcl
compile_ultra -incremental
```

Bom para:

- melhorar caminhos específicos;
- ajustar após scan chain stitching;
- refinar QoR.

Ruim para:

- mudanças grandes de constraints;
- mudanças de RTL;
- problemas estruturais;
- violações enormes.

---

### `optimize_netlist -area`

Faz recuperação final de área:

```tcl
optimize_netlist -area
```

Deve ser usado quando timing já está satisfatório. A promessa é melhorar área sem degradar timing ou leakage.

---

### Resource sharing

Resource sharing é compartilhar uma única unidade funcional entre operações mutuamente exclusivas.

Exemplo:

```verilog
if (SEL)
  SUM = A + B;
else
  SUM = C + D;
```

Como só uma soma é usada por vez, a ferramenta pode implementar com um somador compartilhado:

```text
mux A/C
mux B/D
somador único
```

Isso economiza área, mas pode aumentar atraso no caminho de seleção.

---

## Figuras, diagramas e waveforms importantes

### Figura do `-weight`

Mostra que trocar um flip-flop lento por um rápido pode melhorar o grupo `CLK`, mas piorar o caminho de entrada por causa do aumento de setup. É o exemplo mais claro de otimização ponderada.

### Figura de multi-clock path groups

Mostra que clocks diferentes podem receber pesos e critical ranges diferentes. Isso é essencial em designs com múltiplos domínios.

### Figura de buffering-aware placement

Compara placement simples, otimização posterior com buffers e placement consciente de buffering. Mostra por que modelar buffers antes melhora QoR.

### Figura de congestion-driven restructuring

Mostra uma OR tree antes e depois do reordenamento de entradas. O objetivo não é mudar lógica, mas reduzir cruzamento de fios.

### Figura de multi-core optimization

Mostra particionamento do trabalho em vários cores. A mensagem principal é que paralelismo existe, mas consome memória e depende de licença.

### Relatórios de constraint e timing

Os slides de `report_constraint` e `report_timing` mostram a diferença entre relatório resumido de violadores e relatório detalhado de caminho.

### Figura de synthesis optimization overview

É o slide-resumo da unidade: aplicar setup, diretivas, compile options, path groups, incremental compile e recuperação de área.

### Figura de resource sharing

Mostra que o mesmo RTL pode virar duas arquiteturas: uma com dois somadores e outra com somador compartilhado. A escolha depende de timing e estilo de código.

---

## Pontos de prova e revisão

1. `-weight` em `group_path` pode piorar o pior violador de outro path group.
2. A resposta correta do quiz sobre `-weight` é:
   ```text
   True
   ```
3. Se I/O constraints são pessimistas, foque otimização em caminhos register-to-register.
4. Mesmo com I/O preciso, `critical_range` nos grupos de clock ainda pode ser útil.
5. `placer_tns_driven` é `true` por padrão.
6. Para desligar TNS-driven placement:
   ```tcl
   set_app_var placer_tns_driven false
   ```
7. Buffer-aware placement:
   ```tcl
   set_app_var placer_buffering_aware true
   compile_ultra -spg
   ```
8. Automatic timing control:
   ```tcl
   set_app_var placer_auto_timing_control true
   compile_ultra -spg
   ```
9. Congestion-driven restructuring:
   ```tcl
   set_app_var placer_cong_restruct true
   compile_ultra -spg
   ```
10. Multi-core:
    ```tcl
    set_host_options -max_cores 8
    ```
11. Recomendação do slide: usar 8 cores.
12. Medir speedup por wall-clock time, não CPU time.
13. Reportar host options:
    ```tcl
    report_host_options
    ```
14. Desligar multi-core:
    ```tcl
    remove_host_options
    ```
    ou:
    ```tcl
    set_host_options -max_cores 1
    ```
15. `compile_prefer_runtime` reduz runtime, mas pode impactar QoR.
16. Após compile:
    ```tcl
    report_constraint -all_violators
    ```
17. Para timing detalhado:
    ```tcl
    report_timing
    ```
18. Para relatórios paralelos, usar `parallel_execute`.
19. Antes de relatórios paralelos, executar:
    ```tcl
    update_timing
    ```
20. Para background:
    ```tcl
    redirect -bg
    ```
21. Incremental compile:
    ```tcl
    compile_ultra -incremental
    ```
22. Se constraints ou RTL mudam bastante, recompile do RTL/GTECH original, não use incremental.
23. Se violações continuam grandes após incremental, modificar constraints ou RTL e começar de novo.
24. Recuperação final de área:
    ```tcl
    optimize_netlist -area
    ```
25. RTL funcionalmente equivalente pode gerar QoR diferente.
26. Resource sharing pode economizar área, mas depende de timing.
27. Recursos aritméticos dentro de `if` ou `case` podem ser considerados para resource sharing.

---

## Relação com projeto/laboratório

Esta parte aparece diretamente em scripts reais de síntese quando o primeiro `compile_ultra` não é suficiente.

Um fluxo prático pode ser:

```tcl
# Setup já feito: bibliotecas, RTL, floorplan e constraints

# Foco em timing e caminhos internos
group_path -name INPUTS  -from [all_inputs]
group_path -name OUTPUTS -to   [all_outputs]
group_path -name COMBO   -from [all_inputs] -to [all_outputs]
group_path -name CLK -critical_range 0.2 -weight 5

# Recursos SPG / physical-aware
set_app_var placer_tns_driven true
set_app_var placer_buffering_aware true
set_app_var placer_auto_timing_control true
set_app_var placer_cong_restruct true

# Paralelismo
set_host_options -max_cores 8

# Compile
compile_ultra -spg

# Relatórios
report_constraint -all_violators
report_timing
report_qor
report_area
```

Depois de analisar os relatórios:

```tcl
# Se for ajuste fino:
compile_ultra -spg -incremental

# Depois que timing estiver bom:
optimize_netlist -area
```

No laboratório, esta aula explica por que os scripts podem conter várias etapas de compile, relatórios, path groups e otimizações físicas antes de gerar a netlist final.

---

## Checklist de qualidade

- [x] Texto dos slides foi convertido para texto real.
- [x] Conceitos difíceis foram explicados, não apenas citados.
- [x] Código/comandos foram preservados e explicados.
- [x] Figuras relevantes foram interpretadas.
- [x] O Markdown ficou útil para estudar sem abrir o DOCX.
- [x] O próximo bloco foi indicado ao final.
