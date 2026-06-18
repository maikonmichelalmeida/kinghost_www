# 11 Conclusion

## Controle do bloco

- **Bloco:** 075
- **Curso:** 09 Formality Foundation
- **Aula:** 11 Conclusion
- **Prioridade do roteiro:** média
- **Arquivo de origem:** `C:\Users\maiko\ci_expert\Aulas2Prints\09 Formality Foundation\11 Conclusion.docx`
- **Faixa processada conforme roteiro:** slides 1-4
- **Observação sobre o anexo:** o DOCX contém 2 páginas com 4 prints/slides. O conteúdo foi extraído visualmente das imagens, pois o texto não estava disponível em formato editável.
- **Salvar em:**

```text
C:\Users\maiko\ci_expert\mdCursoPt2\09 Formality Foundation\11 Conclusion.md
```

---

## Resumo executivo

Esta aula é a conclusão do curso **09 Formality Foundation**. Ela não introduz comandos novos; ela consolida a mentalidade principal do curso: **Formality é uma ferramenta de prova formal, mas o sucesso do fluxo depende fortemente de setup correto, SVF correto, leitura dos resumos certos e uso cedo no projeto**.

A conclusão reforça quatro ideias:

1. **Get it right in Formality first time**  
   Acerte o setup desde o começo. A maior parte do tempo desperdiçado em Formality vem de depurar **false negatives**, isto é, falhas que não indicam erro real de silício, mas sim problemas de setup, SVF, match, scan, black boxes, undriven signals, guidance rejeitada ou interpretação de RTL.

2. **The setup is everything**  
   O setup correto é a base da verificação. O slide destaca explicitamente:
   - `synopsys_auto_setup true`;
   - `set_svf`;
   - aplicação do SVF;
   - match dos compare points.

3. **Use Formality early in the project**  
   Formality deve entrar cedo no ciclo do projeto, enquanto RTL e scripts de síntese ainda podem ser corrigidos com facilidade. Se o fluxo só é testado perto de `RTL freeze` ou `netlist freeze`, fica tarde para corrigir problemas estruturais, introduzir SVF corretamente ou iniciar fluxo SVP.

4. **Where to look: Summaries**  
   Antes de depurar cones individualmente, olhe os resumos:
   - `report_setup_status`;
   - `report_hdlin_mismatches -summary`;
   - Guidance Summary;
   - Match Summary;
   - Verification Results Table;
   - `analyze_points`.

A aula final amarra todas as unidades anteriores: a prática correta não é “rodar `verify` e clicar no primeiro failing point”. A prática correta é seguir o fluxo, observar os sintomas em cada estágio e só entrar em debug detalhado quando os resumos não forem suficientes.

---

## Texto extraído e organizado por slide

### Slide 1 — Recall: Efficient Debugging Principles

Texto extraído:

```text
Recall: Efficient Debugging Principles
```

Pontos principais:

```text
Get it right in Formality first time
```

```text
Get the setup right — far less time wasted debugging false negatives
```

```text
Debug Early
```

```text
in Project cycle and Formality flow
```

```text
Debugging is about working back from the symptoms to identify the cause
```

```text
It involves reasoning and understanding
```

```text
A key to efficient debugging is knowing:
```

```text
What the likely causes of failure are (both false and real)
```

```text
How each cause will show up in Formality (where to look)
```

```text
From this catalogue of known symptoms from known causes be able to
work backwards from a given failure symptom to an unknown cause
```

Interpretação:

Este slide recupera a filosofia central da unidade de debug eficiente.

A ideia não é decorar janelas da GUI. A ideia é desenvolver uma capacidade de diagnóstico:

```text
sintoma observado → causa provável → relatório/comando certo → correção
```

Exemplo:

```text
Sintoma:
  muitos unmatched LAT na implementação

Hipótese:
  clock-gating não reconhecido

Onde olhar:
  Match Summary, Guidance Summary, Pattern Window

Correção possível:
  set verification_clock_gate_hold_mode any
  ou synopsys_auto_setup true
```

Outro exemplo:

```text
Sintoma:
  rejected reg_constant na Guidance Summary
  unmatched non-constant DFF na referência
  vários failing points downstream

Hipótese:
  constant register removido pelo DC, mas não identificado pelo Formality

Onde olhar:
  report_svf_operation -status rejected -command reg_constant
  report_unmatched_points
  analyze_points -fail
```

A conclusão reforça que debug bom é racional. Ele parte de sintomas conhecidos e volta para a causa.

---

### Slide 2 — The setup is everything

Título extraído:

```text
The setup is everything
```

Elementos do fluxo:

```text
Guide
↓
Read Reference Design
Read Implementation Design
↓
Check reading
↓
Setup
↓
Match
↓
Check Matching and SVF summary
↓
Verify
↓
Pass/Fail/Inconclusive
```

Caixa amarela destacada:

```text
synops_auto_setup true
set_svf
```

Observações da figura:

```text
1) Apply SVF
```

```text
2) Match up compare points
```

Interpretação:

Este é o slide mais importante da conclusão.

Ele resume que a verificação não começa no `verify`. Ela começa no setup.

A sequência correta é:

1. Ler o design de referência.
2. Ler o design de implementação.
3. Conferir leitura.
4. Aplicar setup.
5. Aplicar SVF.
6. Fazer match.
7. Conferir Match Summary e Guidance Summary.
8. Só então verificar.

Os dois comandos destacados são:

```tcl
set synopsys_auto_setup true
set_svf design.svf
```

Esses dois comandos não resolvem todos os problemas, mas são o ponto de partida em um fluxo Synopsys típico.

#### Por que `synopsys_auto_setup true` importa?

Ele faz o Formality se comportar mais como o fluxo de síntese em vários pontos:

- aceita certos pragmas de síntese;
- ajusta comportamento de scan;
- configura interpretação de undriven signals;
- ajuda a aceitar guidance de scan;
- reduz false negatives por diferença de interpretação entre RTL, DC e FM.

#### Por que `set_svf` importa?

O SVF informa ao Formality o que o Design Compiler fez:

- `guide_reg_constant`;
- `guide_reg_merging`;
- `guide_reg_duplication`;
- `guide_inv_push`;
- `guide_scan_input`;
- `guide_ungroup`;
- datapath guidance;
- naming/environment guidance;
- checkpoint/retiming guidance.

Sem SVF correto, o Formality precisa inferir transformações sozinho. Em designs simples, isso pode funcionar. Em designs reais, especialmente com otimizações sequenciais e datapath, isso pode gerar falhas falsas, inconclusivos ou debug muito difícil.

---

### Slide 3 — Use Formality Early in the Project

Título extraído:

```text
Use Formality Early in the Project
```

Elementos da linha do tempo:

```text
Project Time Line
```

À esquerda:

```text
RTL revision 1
RTL revision 2
RTL revision 3
RTL revision 4
RTL freeze
```

À direita:

```text
Synthesis 1
Synthesis 2
Synthesis 3
Synthesis 4
Netlist freeze
```

Caixas verdes:

```text
Lots of Formality issues can be pipe cleaned here (Unit 8)
```

```text
Get SVF in DC flow
```

```text
Majority of issues show up here
```

```text
RTL changes not easy here
```

```text
Too late to start SVP flow
```

Interpretação:

O curso fecha reforçando que Formality deve ser usado cedo.

No início do projeto, ainda é barato corrigir:

- arquivos RTL faltando;
- problemas de `full_case`/`parallel_case`;
- fontes de `X`;
- módulos unresolved;
- black boxes inesperadas;
- undriven signals;
- multiply driven nets;
- scripts de síntese;
- geração de SVF;
- multi-stage SVF;
- hard verifications com SVP.

Perto de `RTL freeze` ou `netlist freeze`, cada correção fica cara.

A frase “Too late to start SVP flow” é especialmente importante. O fluxo SVP exige:

1. rodar Design Compiler;
2. rodar Formality;
3. identificar hard points;
4. gerar recomendações com `analyze_points`;
5. inserir `set_verification_priority` no script DC;
6. re-sintetizar;
7. rodar Formality novamente.

Se isso só começa no fim, o projeto pode não ter tempo para completar o ciclo.

Mensagem prática:

```text
Formality não deve ser apenas signoff final.
Formality deve ser uma ferramenta de desenvolvimento do fluxo.
```

---

### Slide 4 — Where to look: Summaries

Título extraído:

```text
Where to look: Summaries
```

Fluxo mostrado:

```text
Guide
↓
Read Reference Design
Read Implementation Design
↓
Check reading
↓
Setup
↓
Match
↓
Check Matching and SVF summary
↓
Verify
↓
Pass/Fail/Inconclusive
```

Caixa no estágio de leitura:

```text
report_setup_status
report_hdlin_mismatches -summary
```

Caixa no estágio de match:

```text
Guidance Summary
Match Summary
```

Caixa no estágio de verify:

```text
Verification Results Table
analyze_points
```

Interpretação:

Este slide é o fechamento metodológico da unidade.

O melhor lugar para começar debug não é o cone. É o resumo.

#### No estágio de leitura

Use:

```tcl
report_setup_status
report_hdlin_mismatches -summary
```

Isso detecta:

- black boxes inesperadas;
- libraries faltando;
- módulos unresolved;
- mismatches de interpretação RTL/hardware;
- setup incompleto;
- problemas antes do match.

#### No estágio de match

Use:

```text
Guidance Summary
Match Summary
```

Isso detecta:

- SVF errado;
- SVF incompleto;
- guidance rejeitada;
- compare points unmatched;
- unmatched registers;
- unmatched LATs;
- constants;
- unread points;
- black-box pins;
- problemas de scan, clock-gating, retiming, constant registers etc.

#### No estágio de verify

Use:

```text
Verification Results Table
analyze_points
```

Isso ajuda a separar:

- passing;
- failing;
- aborted;
- unverified;
- not run;
- hard points;
- rejected SVF operations;
- unmatched cone inputs;
- problemas com `X`, scan, constantes, black boxes, undriven e outros.

A grande mensagem:

```text
Summaries first. Cone debug later.
```

---

## Aula didática desenvolvida

### 1. A conclusão do curso: Formality é fluxo, não apenas comando

O curso começou com comandos básicos:

```tcl
read_verilog
set_top
match
verify
```

Mas a conclusão mostra que a maturidade real está em entender o fluxo completo.

Um fluxo Formality robusto envolve:

```text
setup correto
SVF correto
leitura validada
match validado
guidance interpretada
verify bem analisado
debug por sintomas
uso cedo no projeto
```

Ou seja, o `verify` é apenas uma etapa. O sucesso depende de todo o caminho antes dele.

---

### 2. O setup certo evita a maioria dos false negatives

False negative é quando o Formality falha, mas a implementação não está errada.

Causas comuns estudadas no curso:

- SVF errado ou ausente;
- `synopsys_auto_setup` não aplicado;
- scan enable livre;
- `guide_scan*` rejeitado;
- `guide_reg_constant` rejeitado;
- `guide_reg_merging` rejeitado;
- `guide_inv_push` rejeitado;
- retiming sem guidance adequada;
- clock-gating não reconhecido;
- black box inesperada;
- undriven signal afetando cone;
- mismatch de interpretação RTL/hardware;
- `X` como don't care;
- hierarchy/boundary setup incorreto.

A conclusão reforça: quanto melhor o setup inicial, menos tempo será gasto depurando falhas falsas.

---

### 3. SVF é a memória da síntese

O SVF informa ao Formality as transformações do Design Compiler.

Ele pode carregar informações como:

```text
ambiente de leitura
naming style
case pragmas
scan insertion
constant register removal
register merging
register duplication
phase inversion
retiming
datapath transforms
ungrouping
uniquification
checkpoint
```

Sem SVF, ou com SVF errado, o Formality perde contexto.

Regra prática:

```text
netlist e SVF devem ser tratados como um par.
```

Se você salva uma netlist, salve o SVF correspondente. Se verifica uma etapa intermediária, use o SVF daquela etapa.

---

### 4. Formality cedo no projeto: pipe-clean

A conclusão menciona que muitos problemas podem ser “pipe cleaned” cedo. Isso significa limpar o pipeline do fluxo antes do projeto ficar congelado.

Exemplos de pipe-clean:

- confirmar que o DC lê o RTL corretamente;
- confirmar que o SVF é gerado e fechado corretamente;
- confirmar que Formality aceita a guidance;
- confirmar que `synopsys_auto_setup` está aplicado;
- testar uma síntese simples;
- verificar problemas de `X`, pragmas e undriven;
- configurar scripts de reports automáticos;
- rodar `analyze_points` em regressões iniciais.

Isso evita descobrir perto do signoff que o fluxo nunca esteve saudável.

---

### 5. Summaries são o painel de controle

A aula final coloca os summaries como o painel de controle do Formality.

Antes do verify:

```tcl
report_setup_status
report_hdlin_mismatches -summary
```

Durante/depois do match:

```text
Guidance Summary
Match Summary
```

Depois do verify:

```text
Verification Results Table
analyze_points
```

Esses resumos dizem onde procurar.

Exemplo:

```text
Guidance Summary com rejected reg_constant
→ investigar report_svf_operation
→ não começar abrindo cone aleatório.
```

Exemplo:

```text
Match Summary com muitos unmatched LAT na implementação
→ suspeitar clock-gating
→ configurar verification_clock_gate_hold_mode.
```

Exemplo:

```text
Verification Results Table mostra muitos aborted
→ suspeitar hard verification
→ rodar analyze_points -aborted
→ talvez usar SVP.
```

---

### 6. Debug eficiente é catálogo de sintomas

A conclusão reforça a ideia de catálogo.

Durante o curso, o catálogo construído foi aproximadamente:

| Sintoma | Causa provável |
|---|---|
| rejected `reg_constant` | constant register não identificado |
| unmatched non-constant DFF em Ref | constant register, reg merging ou unread mal interpretado |
| unmatched non-constant DFF em Impl | register replication ou test insertion |
| rejected `inv_push` | phase inversion não reconhecida |
| nomes `R_#` ou `REG#_S#` | retiming |
| muitos unmatched LAT em Impl | clock-gating |
| `X` em compare point UPF | power-down, isolation, supply, PDCut |
| `b (originally undriven)` na Pattern Window | undriven signal |
| `guide_scan*` rejected | auto setup/scan setup incorreto |
| muitos points inconclusive/aborted em datapath | SVF datapath ausente/rejeitado, hard verification |
| black box inesperada | módulo não lido, unresolved module, interface-only indevido |
| muitos failures de uma vez | causa global/setup, não ponto isolado |

Esse catálogo permite trabalhar de trás para frente.

---

## Conceitos difíceis explicados em profundidade

### False negative

Falha de verificação que não corresponde necessariamente a erro real na implementação. Em Formality, muitos false negatives vêm de setup, SVF ou interpretação diferente.

---

### True negative

Falha real: a implementação não é funcionalmente equivalente à referência. É o tipo de falha que o signoff precisa capturar.

---

### Pipe-clean

Limpeza antecipada do fluxo. Significa rodar Formality cedo, com síntese simples ou etapas iniciais, para descobrir problemas de setup antes do projeto amadurecer.

---

### `synopsys_auto_setup`

Configuração que ajusta o Formality para se alinhar ao fluxo Synopsys/Design Compiler. Ajuda em scan, pragmas, undriven, interpretation e outros detalhes.

---

### `set_svf`

Comando que carrega o arquivo SVF no Formality. O SVF contém guidance de síntese gerada pelo Design Compiler.

---

### Guidance Summary

Resumo que mostra quais comandos SVF foram aceitos, rejeitados, não suportados ou não processados. É uma das principais ferramentas para prever falhas antes do verify.

---

### Match Summary

Resumo do matching de compare points, primary inputs, black-box outputs, unread points, constants, latches, DFFs e outros objetos.

---

### Verification Results Table

Tabela que mostra resultados de verificação: passing, failing, aborted, unverified, not run etc.

---

### `analyze_points`

Comando que analisa failing/hard/aborted/unverified points e tenta agrupar causas prováveis.

---

## Comandos importantes

### Setup básico recomendado

```tcl
set synopsys_auto_setup true
set_svf design.svf
```

### Read stage

```tcl
report_setup_status
report_hdlin_mismatches -summary
```

### Match stage

```tcl
match
```

Relatórios/conferências:

```text
Guidance Summary
Match Summary
```

### Verify stage

```tcl
verify
```

Análise:

```tcl
analyze_points
analyze_points -fail
analyze_points -aborted
analyze_points -unverified
```

### Relatórios úteis do curso inteiro

```tcl
report_svf_operation -status rejected
report_unmatched_points
report_failing_points
report_black_boxes
report_multidriven_nets -ref
report_multidriven_nets -impl
report_hdlin_mismatches
```

---

## Fluxo de referência consolidado

```tcl
set synopsys_auto_setup true
set_svf design.svf

# Read reference and implementation
# read_verilog -r ...
# set_top ...
# read_verilog -i ...
# set_top ...

report_setup_status
report_hdlin_mismatches -summary

match

# Ler no transcript:
# - Guidance Summary
# - Match Summary

report_setup_status
report_unmatched_points > unmatched.rpt
report_svf_operation -status rejected > rejected_svf.rpt

if {![verify]} {
  report_failing_points > failing.rpt
  analyze_points -fail > analyze_fail.rpt
}
```

Esse script representa a filosofia final do curso: gerar dados de diagnóstico em cada estágio.

---

## Figuras e diagramas importantes

### Recall: Efficient Debugging Principles

Mostra que debug eficiente depende de raciocínio, sintomas e causas conhecidas. Não é apenas uso mecânico da GUI.

---

### The setup is everything

Mostra o fluxo Formality completo e destaca `synops_auto_setup true`, `set_svf`, aplicação do SVF e match de compare points. É a figura que melhor resume o curso.

---

### Use Formality Early in the Project

Mostra a linha do tempo de RTL revisions, synthesis runs, RTL freeze e netlist freeze. A lição é que Formality deve entrar antes do congelamento do projeto.

---

### Where to look: Summaries

Mostra quais relatórios usar em cada estágio:

```text
Read:
  report_setup_status
  report_hdlin_mismatches -summary

Match:
  Guidance Summary
  Match Summary

Verify:
  Verification Results Table
  analyze_points
```

---

## Pontos de prova e revisão

1. O setup correto reduz tempo perdido com false negatives.
2. A maior parte das falhas iniciais em Formality tende a ser problema de setup/fluxo, não erro real de silício.
3. Debug deve começar cedo no projeto.
4. Debug deve começar cedo no fluxo Formality.
5. `synopsys_auto_setup true` é um comando-chave no fluxo Synopsys.
6. `set_svf` é essencial para aplicar guidance do Design Compiler.
7. O SVF deve corresponder à netlist e à etapa verificada.
8. Antes do `verify`, confira leitura, setup e match.
9. `report_setup_status` é um resumo essencial no read/setup stage.
10. `report_hdlin_mismatches -summary` ajuda a detectar divergências de interpretação RTL/hardware.
11. Guidance Summary deve ser lida antes de depurar failing points.
12. Match Summary deve ser lida por tipo de objeto, não só por quantidade.
13. Verification Results Table separa passing, failing, aborted, unverified e not run.
14. `analyze_points` ajuda a agrupar causas.
15. Formality deve ser usado cedo para pipe-clean do fluxo.
16. Perto de `RTL freeze`, mudanças de RTL ficam difíceis.
17. Perto de `netlist freeze`, é tarde para iniciar fluxo SVP.
18. A maioria dos problemas aparece nas primeiras sínteses.
19. Debug é trabalhar de trás para frente: sintoma → causa.
20. O engenheiro tem contexto que o Formality não tem.
21. Muitos failing points sugerem problema global/setup.
22. Poucos failing points sugerem problema localizado.
23. Não comece com Pattern Window se os summaries ainda não foram analisados.
24. Summaries first, detailed debug later.
25. O objetivo do curso é formar um catálogo de sintomas e causas.

---

## Relação com projeto/laboratório

Esta conclusão serve como checklist para qualquer laboratório ou projeto real com Formality.

Antes de declarar que a implementação está errada, confira:

```text
1. O SVF é o correto?
2. O SVF foi fechado corretamente no DC?
3. A netlist corresponde ao SVF?
4. O synopsys_auto_setup está ativo?
5. O report_setup_status está limpo?
6. Há mismatches de RTL/hardware?
7. A Guidance Summary mostra rejeições perigosas?
8. A Match Summary mostra unmatched objects suspeitos?
9. Os failures são poucos ou muitos?
10. analyze_points aponta causa comum?
```

Se todas essas perguntas estiverem bem respondidas, aí sim faz sentido entrar em Pattern Window, Logic Cone, probe points, cutpoints e debug detalhado.

---

## Checklist de qualidade

- [x] Bloco 075 processado conforme roteiro, slides 1-4.
- [x] Texto dos prints foi extraído e organizado.
- [x] Figuras finais foram interpretadas.
- [x] O conteúdo foi consolidado como fechamento do curso Formality Foundation.
- [x] Comandos centrais foram preservados.
- [x] Pontos de prova foram listados.
- [x] Próximo bloco foi indicado conforme roteiro.

---

## Próximo bloco

- **Bloco:** 076
- **Curso:** 10 Fusion Compiler Synthesis and Design Implementation Jumpstart
- **Aula:** 01 Fusion Compiler Synthesis and Design Implementation Jumpstart — parte A
- **Prioridade:** média
- **Arquivo para anexar:**

```text
C:\Users\maiko\ci_expert\Aulas2Prints\10 Fusion Compiler Synthesis and Design Implementation Jumpstart\01 Fusion Compiler Synthesis and Design Implementation Jumpstart.docx
```

- **Processar somente:** slides 1-20
- **Salvar em:**

```text
C:\Users\maiko\ci_expert\mdCursoPt2\10 Fusion Compiler Synthesis and Design Implementation Jumpstart\01 Fusion Compiler Synthesis and Design Implementation Jumpstart_parte_A.md
```

- **Próximo depois dele:** Bloco 077 — `01 Fusion Compiler Synthesis and Design Implementation Jumpstart - parte B`
