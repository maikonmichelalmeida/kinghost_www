# 07 Efficient Debugging in Formality — parte A

## Controle do bloco

- **Bloco:** 067
- **Curso:** 09 Formality Foundation
- **Aula:** 07 Efficient Debugging in Formality — parte A
- **Arquivo de origem:** `C:\Users\maiko\ci_expert\Aulas2Prints\09 Formality Foundation\07 Efficient Debugging in Formality.docx`
- **Faixa processada:** slides 1-19
- **Salvar em:**

```text
C:\Users\maiko\ci_expert\mdCursoPt2\09 Formality Foundation\07 Efficient Debugging in Formality_parte_A.md
```

- **Próximo bloco:** Bloco 068 — `07 Efficient Debugging in Formality - parte B`
- **Próxima faixa:** continuar a partir do slide 20, começando por `Guidance Summary: What to look for`

---

## Resumo executivo

Esta aula muda o foco de “usar comandos do Formality” para **pensar como depurar de forma eficiente**. O ponto central é que a maioria das falhas em Formality não é erro real de silício. A maioria é **false negative**: a implementação está funcionalmente correta, mas o Formality falha por causa de setup incorreto, SVF ausente ou errado, guidance rejeitada, scan não configurado, registros constantes não reconhecidos, transformações sequenciais não aceitas ou problemas de matching.

A aula propõe uma mentalidade de debug:

```text
Não começar abrindo um failing point aleatório na GUI.
Primeiro entender em qual estágio o problema aparece.
```

Os estágios principais são:

1. **Read stage**
   - O design foi lido corretamente?
   - Existem black boxes, libraries faltando, hdl mismatches?
   - Comandos: `report_setup_status`, `report_hdlin_mismatches -summary`.

2. **Match stage**
   - Os compare points e primary inputs foram casados corretamente?
   - O SVF foi aplicado corretamente?
   - Existem guide commands rejeitados?
   - Relatórios: Guidance Summary, Match Summary, `report_setup_status`.

3. **Verify stage**
   - O design passou, falhou, ficou inconclusive, aborted, unverified ou not run?
   - O limite de failing points foi atingido?
   - A falha é real ou consequência de setup/match?
   - Comandos depois do verify: Verification Results Table, `analyze_points`.

Na parte A, o foco maior é **antes do verify**: como usar os resumos de reading, match e guidance para diagnosticar a maioria dos problemas sem desperdiçar tempo depurando ponto por ponto. A aula também introduz uma classificação muito útil de rejeições de SVF: naming, combinational, sequential e test. A grande pegadinha é que **rejeições sequenciais e de test tendem a causar falha real de verificação**, enquanto rejeições combinacionais podem apenas tornar a prova mais lenta ou inconclusiva.

---

## Texto extraído e organizado por slide

### Slide 1 — Two types of failure: Majority are false

Texto extraído:

- **False Negative**
  - The implementation is actually good but Formality fails the design.
  - Majority of failures are these and the majority of causes are due to setup issues.
- **True Negative**
  - The implementation is genuinely bad, i.e. bad silicon.
  - These are the ones we really need to trap before sign-off.
- A figura “Formality Runs” mostra a maior parte como **Pass**, uma parcela menor como **False Negative** e uma parcela muito pequena como **True Negative**.

Interpretação:

O slide estabelece uma premissa importante: quando Formality falha, não significa automaticamente que a netlist está errada. Muitas falhas são **false negatives**: o design implementado está correto, mas a ferramenta não conseguiu provar por causa de setup incompleto ou incorreto.

Exemplos de false negative:

- SVF errado, ausente ou incompleto;
- `synopsys_auto_setup` não usado;
- scan enable não fixado;
- black boxes/libraries faltando;
- registros constantes otimizados sem guidance aceita;
- clock-gating ou scan inserido sem setup adequado;
- transformações sequenciais rejeitadas;
- mismatch de nomes ou hierarquia.

O **true negative** é o caso que realmente queremos capturar: a implementação está funcionalmente diferente da referência e poderia gerar silício errado.

A mentalidade eficiente é: primeiro suspeite de setup e fluxo; depois conclua diferença funcional.

---

### Slide 2 — Efficient Debugging Principles

Texto extraído:

- **Get it right in Formality first time**
  - Get the setup right — far less time wasted debugging false negatives.
- **Debug Early**
  - in project cycle and Formality flow.
- **Debugging is about working back from the symptoms to identify the cause**
  - It involves reasoning and understanding.
- **A key to efficient debugging is knowing:**
  - What the likely causes of failure are, both false and real.
  - How each cause will show up in Formality, where to look.
  - From this catalogue of known symptoms from known causes, be able to work backwards from a given failure symptom to an unknown cause.

Interpretação:

A aula define três princípios:

1. **Right First Time**
   - Configurar Formality corretamente desde o começo evita horas de debug falso.

2. **Debug Early**
   - Depurar cedo no projeto e cedo no fluxo do Formality reduz custo.
   - Não espere o tapeout ou o netlist freeze.

3. **Debug por sintomas**
   - O debug eficiente não é tentativa e erro.
   - É mapear sintomas para causas prováveis.

A frase mais importante é:

```text
trabalhar de trás para frente: sintoma → causa provável
```

Exemplo:

```text
Sintoma: registros constantes unmatched na referência.
Causa provável: DC removeu registros constantes, mas a guidance reg_constant foi rejeitada.
```

---

### Slide 3 — Debugging Principles: Right First Time

Texto extraído:

- **Get it right in Formality first time**
  - Get the setup right — far less time wasted debugging false negatives.
- **The keys to easy setup are:**

```tcl
set synopsys_auto_setup true
```

  - Overview: Unit 2.
  - Implication details: Unit 8, 10.
- **SVF**
  - Use the right SVF: Unit 4.
  - Further details: Unit 7, 8, 9, 10.

Interpretação:

O slide reforça dois pilares de setup:

1. `synopsys_auto_setup`
2. SVF correto

O comando:

```tcl
set synopsys_auto_setup true
```

ativa configurações automáticas recomendadas para alinhar Formality com o fluxo Synopsys, especialmente quando Design Compiler foi usado.

O SVF correto é igualmente essencial. O SVF informa ao Formality as transformações feitas na síntese. Se o SVF está errado, incompleto, de outro run ou de outro estágio, a verificação pode falhar mesmo com uma implementação correta.

Ponto de prova:

```text
A maioria dos false negatives vem de setup.
Os dois primeiros suspeitos são auto setup e SVF.
```

---

### Slide 4 — Debugging Principles: Early in Project

Elementos da figura:

Linha do tempo do projeto:

```text
RTL revision 1
RTL revision 2
RTL revision 3
RTL revision 4
RTL freeze
```

Em paralelo:

```text
Synthesis 1
Synthesis 2
Synthesis 3
Synthesis 4
Netlist freeze
```

Caixas verdes:

- Lots of Formality issues can be pipe cleaned here.
- Get SVF in DC flow.
- Majority of issues show up here.
- RTL changes not easy here.
- Too late to start SVP flow.

Interpretação:

O slide mostra que Formality deve entrar cedo no projeto, não só no fim.

No início:

- ainda é fácil mudar RTL;
- ainda é fácil ajustar scripts de síntese;
- ainda é fácil corrigir SVF;
- ainda é possível configurar SVP;
- problemas de flow aparecem cedo.

Perto de `RTL freeze` e `netlist freeze`, qualquer mudança fica cara. Começar SVP tarde demais é ruim, porque SVP normalmente exige voltar ao Design Compiler, ajustar `set_verification_priority` e re-sintetizar.

Mensagem prática:

```text
Não espere o signoff para descobrir que o fluxo Formality não está limpo.
```

---

### Slide 5 — Debugging Principles: Early in Flow

Figura do fluxo Formality:

```text
Guide
↓
Read Reference Design / Read Implementation Design
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
↓
Debug
```

Caixas:

- A lot of issues can be debugged easily as early as reading.
  - Available without waiting for match or verify.
- A lot of other issues can be debugged easily as early as matching.
  - Available without waiting for verify.
- All failures debuggable here.

Interpretação:

Este slide ensina a não esperar o final do `verify` para depurar.

Muitos problemas aparecem antes:

- no **read/check reading**:
  - design não lido corretamente;
  - libraries faltando;
  - black boxes;
  - HDL mismatches.

- no **match/guidance summary**:
  - pontos não casados;
  - guidance rejeitada;
  - SVF errado;
  - scan/clock-gating/constant registers suspeitos.

- no **verify**:
  - só depois de ler e casar corretamente é que vale depurar falha funcional.

A frase prática é:

```text
Depure o mais cedo possível no fluxo.
```

---

### Slide 6 — Stage Summary vs Detailed Debugging

Texto extraído:

- Want to be able to debug each stage:
  - Read, Match, Verify.
- Each Formality stage has available:
  - Summary information.
  - Detailed information.
- Usually the summary information is the best place to start.
  - Best place to gauge whether a possible problem is visible at that stage.
- Once looked at summary information for each stage then go on to detailed debugging if required.
- Destaque:
  - Where to look? Summaries First.

Interpretação:

Este slide é central para o método da aula.

Antes de abrir Pattern Window ou Logic Cone, olhe os resumos:

- Read summary;
- Guidance Summary;
- Match Summary;
- Verification Results Summary.

Os resumos respondem perguntas grandes:

```text
O design foi lido corretamente?
O SVF parece correto?
Os compare points casaram?
O verify falhou mesmo ou ficou inconclusive?
O limite de failing points foi atingido?
```

Só depois disso vale ir para debug detalhado.

---

### Slide 7 — Read Stage: Summary Information

Figura:

O fluxo destaca o ponto **Check reading**.

Comandos indicados:

```tcl
report_setup_status
report_hdlin_mismatches -summary
```

Nota:

```text
More information in Unit 8
```

Interpretação:

Depois de ler referência e implementação, antes de match, verifique se a leitura está saudável.

O comando:

```tcl
report_setup_status
```

mostra problemas de setup, incluindo black boxes, unresolved references, library issues e status geral.

O comando:

```tcl
report_hdlin_mismatches -summary
```

resume diferenças ou inconsistências de leitura HDL entre referência e implementação.

Se há problema aqui, não faz sentido depurar falhas de verify. O design ainda não está corretamente carregado.

---

### Slide 8 — Match Stage: Summary Information

Figura:

O fluxo destaca o ponto **Check Matching and SVF summary**.

Informações de summary:

```text
Guidance Summary
Match Summary
report_setup_status
```

Interpretação:

Durante o match, três fontes de informação são importantes:

1. **Guidance Summary**
   - mostra comandos SVF aceitos, rejeitados, não processados etc.

2. **Match Summary**
   - mostra quantos compare points casaram, quantos ficaram unmatched.

3. **report_setup_status**
   - ainda pode revelar problemas de setup relevantes.

Muitos problemas de verify podem ser previstos aqui, antes de rodar `verify`.

---

### Slide 9 — Match Stage: Guidance Summary

Texto extraído:

- **Guidance Summary**
- Caixa amarela:
  - With a little understanding one can predict verification failures from the Guidance Summary.

Interpretação:

O slide diz que, com conhecimento mínimo sobre que tipo de guidance foi rejeitada, é possível prever se o verify provavelmente falhará.

Exemplo:

- Rejeição de guidance combinacional pode não causar falha, mas pode deixar verify mais lento/inconclusive.
- Rejeição de guidance sequencial, como `reg_merging`, `retiming`, `reg_constant`, tende a causar falha.
- Rejeição de guidance de scan tende a causar falha se o setup de scan não foi configurado.

Portanto, a Guidance Summary não é apenas relatório decorativo. Ela é uma ferramenta de diagnóstico antecipado.

---

### Slide 10 — The Guidance Summary

A tabela mostra comandos SVF com colunas como:

```text
Accepted
Rejected
Unsupported
Unprocessed
Total
```

Caixas do slide:

- Many types of commands rejected.
- A number of possible reasons for rejection — some benign.
- What will lead to failure?

Interpretação:

Nem toda rejeição no Guidance Summary é grave. Algumas rejeições são benignas; outras são sinal forte de falha futura.

O ponto da aula é aprender a diferenciar:

```text
Rejeição que só torna a prova mais difícil
versus
Rejeição que muda a fronteira sequencial ou test logic e provavelmente causa fail
```

A pergunta correta não é apenas:

```text
Há rejected commands?
```

A pergunta correta é:

```text
Que tipo de rejected commands existe?
Eles são naming, combinational, sequential ou test?
```

---

### Slide 11 — Design Compiler transforms and SVF

Texto extraído:

Guide transforms podem ser caracterizados como:

- **Compare point naming**
  - transforms that may change pathnames to where the logic cones begin and end.
- **Combinational**
  - transforms that change the structure of the combinational logic.
  - Example: datapath optimization.
- **Sequential**
  - transforms that change the sequential boundaries — where logic cones begin and end.
  - Example: register merging.
- **Test**
  - Test insertion.

Interpretação:

Essa classificação é a base da análise de SVF rejection.

1. **Naming**
   - Afeta nomes e pathnames.
   - Pode causar problemas de match.

2. **Combinational**
   - Afeta a estrutura lógica dentro do cone.
   - Geralmente não muda os compare points.
   - Pode tornar verify mais difícil, mas não necessariamente falhar.

3. **Sequential**
   - Afeta fronteiras sequenciais.
   - Muda onde os cones começam e terminam.
   - Rejeição tende a causar falha, porque os compare points podem não corresponder corretamente.

4. **Test**
   - Inserção de scan/test logic.
   - Se não houver setup correto, a função combinacional observada no compare point muda e verify falha.

---

### Slide 12 — Guidance Rejection Characterization

Tabela extraída e organizada:

| Tipo | Se rejeitado | Exemplos de comandos SVF |
|---|---|---|
| Naming | Potential problem in match | `change_names`, `ungroup` |
| Combinational | Not a match issue; verify may take longer | `datapath`, `multiplier`, `merge`, `replace` |
| Sequential | Likely that verification will fail | `reg_constant`, `inv_push`, `reg_duplication`, `reg_merging`, `multibit`, `retiming*` |
| Test | Without other setup verification will fail | `scan_input` |

Interpretação:

Esta é uma das tabelas mais importantes da parte A.

A leitura correta é:

- **Naming rejected**
  - Pode impedir match.
  - Exemplo: se `change_names` foi rejeitado, Formality pode não encontrar o objeto correspondente.

- **Combinational rejected**
  - Não costuma ser problema de match.
  - O cone ainda começa e termina nos mesmos pontos.
  - Verify pode demorar mais ou ficar inconclusive, mas não necessariamente falhar.

- **Sequential rejected**
  - Sinal vermelho.
  - Se o DC removeu/mesclou/duplicou/retimou registradores e Formality rejeitou essa guidance, os boundaries mudam e a equivalência tende a falhar.

- **Test rejected**
  - Sem setup adicional, tende a falhar.
  - Scan insertion adiciona lógica que precisa ser controlada.

---

### Slide 13 — Example: Combinational

Figura:

```text
Structure 1 --DC--> Structure 2
```

Texto extraído:

Assume:

1. DC has done some datapath optimization to logic cone.
2. This was valid but Formality has rejected the corresponding SVF, maybe it could not find the datapath objects.

Destaque:

```text
Verification will not fail (maybe will be inconclusive though)
```

Interpretação:

Este exemplo mostra uma rejeição combinacional.

A lógica combinacional foi reestruturada, mas os compare points continuam os mesmos. Se a otimização foi válida, o design é equivalente. Mesmo que a guidance combinacional seja rejeitada, o Formality ainda pode provar equivalência por outros meios.

O risco é performance:

```text
pode demorar mais
pode ficar inconclusive
mas não necessariamente falha
```

Essa é uma diferença importante em relação a transformações sequenciais.

---

### Slide 14 — Example: Sequential

Figura:

Dois registradores são mesclados:

```text
Two registers merged
```

Texto extraído:

Assume:

1. DC has merged 2 registers together.
2. Formality has rejected the corresponding SVF, maybe it could not find the registers.

Destaque:

```text
Verification will fail: a_reg[31] a failing point
```

Interpretação:

Aqui a transformação altera fronteiras sequenciais. Se o DC mescla dois registradores, o conjunto de compare points e cones muda.

Se a guidance é aceita, Formality entende que a transformação é válida. Se a guidance é rejeitada, Formality pode tratar os registradores como pontos não equivalentes.

Por isso, rejeições sequenciais são muito mais perigosas que rejeições combinacionais.

Exemplos críticos:

```text
reg_constant
reg_merging
reg_duplication
retiming
multibit
inv_push
```

---

### Slide 15 — Example: Test

Texto extraído:

- The additional logic added during scan insertion changes the combinational function of compare point.
- Pre-Scan / Post-Scan
- Destaque:
  - Verification will fail unless `test_se` de-asserted.

Interpretação:

Scan insertion adiciona lógica extra nos flops:

- `scan_in`;
- `scan_out`;
- `test_se`;
- muxes de scan.

Se `test_se` fica livre, o Formality pode comparar o circuito em modo scan em vez de modo funcional. Isso muda a função combinacional do compare point.

Solução típica:

```tcl
set_constant test_se 0
```

ou usar auto setup/scan guidance adequada.

A mensagem central:

```text
Scan logic precisa ser desabilitada para equivalência funcional normal.
```

---

### Slide 16 — SVF Rejections Causing Fail

Lista extraída:

- `guide_inv_push`
- `guide_reg_constant`
- `guide_reg_duplication`
- `guide_reg_merging`
- `guide_retiming*`
- `guide_scan*`
  - `guide_scan*`, e.g. `guide_scan_input`, only accepted when:

```tcl
synopsys_auto_setup true
```

- `guide_multibit`
  - Borderline: often leads to matching issues that cause failure.

Interpretação:

Este slide lista as rejeições que mais preocupam.

O destaque para `guide_scan*` é importante: comandos como `guide_scan_input` só são aceitos quando:

```tcl
set synopsys_auto_setup true
```

Isso liga diretamente a aula de debug eficiente ao princípio Right First Time.

Rejeições críticas:

- `guide_reg_constant`: DC removeu registro constante.
- `guide_reg_duplication`: DC duplicou registro.
- `guide_reg_merging`: DC mesclou registros.
- `guide_retiming`: DC moveu registros através da lógica.
- `guide_scan*`: DC inseriu scan/test logic.
- `guide_multibit`: caso borderline, frequentemente causa problemas de matching.

---

### Slide 17 — Less common Rejections Causing Fail

Texto extraído:

- `guide_fsm_reencoding`
  - Not common to have this in DC.
- `guide_multiplier`
  - Special case where you have a DesignWare partial product multiplier instantiated in design (`DW_multp`).
  - Bit functionality dynamic.

Interpretação:

Algumas rejeições menos comuns também podem causar falha.

`guide_fsm_reencoding` aparece quando há reencoding de FSM. Se a codificação de estados mudou e Formality não entende a transformação, a verificação pode falhar.

`guide_multiplier` é um caso especial envolvendo multiplicadores DesignWare de produto parcial, como `DW_multp`. Multiplicadores podem gerar lógica altamente reestruturada, e a funcionalidade bit a bit pode ser dinâmica/difícil de mapear.

---

### Slide 18 — Clues in the Guidance Summary

A tabela Guidance Summary aparece com algumas linhas destacadas em vermelho:

- `inv_push`
- `reg_constant`
- `reg_merging`
- `scan_input`

Caixa do slide:

```text
Q: What will lead to failure?
A: Rejected in red rows.
```

Interpretação:

O slide aplica a classificação anterior a uma Guidance Summary real.

As linhas destacadas são justamente tipos de guidance cuja rejeição tende a causar fail:

- `inv_push`;
- `reg_constant`;
- `reg_merging`;
- `scan_input`.

Esse é o tipo de leitura que o aluno precisa treinar: olhar uma Guidance Summary e perceber rapidamente quais rejeições são perigosas.

---

### Slide 19 — Rejected guidance

Texto extraído:

- Reasons for rejected guidance:
  - Naming reasons.
  - Invalid.
  - Not using the right SVF or missing SVF.
- Example: rejected `guide_reg_constant`.
  - This will be Design Compiler guide that it is removing a register because it is constant.
  - This could be rejected because:
    - Formality could not find the register.
    - Formality does not agree it is a constant.
- The command `report_svf_operation` gives SVF details.
- Example to get a list and reason for rejected constant registers:

```tcl
report_svf_operation -status rejected -command reg_constant
```

Interpretação:

Este slide fecha a parte A com o comando de investigação detalhada.

A Guidance Summary diz que existe rejeição. O comando `report_svf_operation` mostra os detalhes da rejeição.

Exemplo:

```tcl
report_svf_operation -status rejected -command reg_constant
```

Esse comando ajuda a responder:

```text
Quais registros constantes foram rejeitados?
Por que foram rejeitados?
O Formality não encontrou o registro?
Ou discordou de que era constante?
```

Esse comando é especialmente importante porque `reg_constant` rejeitado é uma causa clássica de false negative.

---

## Aula didática desenvolvida

### 1. O método: não comece pelo failing point

A aula está ensinando que o debug eficiente não começa clicando em um failing point aleatório. Isso pode funcionar em exemplos pequenos, mas em design real é ineficiente.

A ordem correta é:

```text
1. Read stage summary
2. Match stage summary
3. Guidance Summary
4. Verify results
5. analyze_points
6. Só então Pattern Window / Logic Cone / ponto individual
```

Por quê? Porque muitas falhas individuais têm uma causa comum. Se `reg_constant` foi rejeitado, tudo que aquele registro alimenta pode falhar. Depurar cada failing point separadamente desperdiça tempo.

---

### 2. False negative: a categoria dominante

A maioria das falhas não significa “bad silicon”. Significa que Formality não recebeu ou não aceitou informações suficientes para entender a transformação.

Exemplo:

```text
Design Compiler removeu fred_reg porque era constante 0.
Formality rejeitou guide_reg_constant.
Agora fred_reg aparece como unmatched non-constant DFF na referência.
Tudo que depende de fred_reg pode falhar.
```

A implementação pode estar correta, mas a prova falha porque a ferramenta não entendeu a transformação.

---

### 3. Guidance Summary como detector antecipado

A Guidance Summary aparece no match, antes do verify. Isso permite prever falhas.

Rejeições perigosas:

```text
reg_constant
reg_merging
reg_duplication
retiming
scan_input
inv_push
multibit
```

Rejeições menos graves:

```text
datapath
multiplier
merge
replace
```

A pegadinha é: não basta olhar quantidade de rejected commands. É preciso olhar o tipo.

Um número grande de rejeições combinacionais pode não gerar fail. Um número pequeno de rejeições sequenciais pode destruir a verificação.

---

### 4. Combinational rejection versus sequential rejection

#### Combinational

Uma transformação combinacional muda a estrutura interna do cone:

```text
mesma entrada sequencial
mesma saída sequencial
lógica interna diferente
```

Se a guidance é rejeitada, Formality ainda pode tentar provar equivalência pela função.

Resultado provável:

```text
não falha necessariamente
mas pode demorar ou ficar inconclusive
```

#### Sequential

Uma transformação sequencial muda fronteiras:

```text
registradores removidos
registradores mesclados
registradores movidos
registradores duplicados
```

Se a guidance é rejeitada, Formality pode estar comparando pontos que não têm mais correspondência direta.

Resultado provável:

```text
verify falha
```

---

### 5. Test rejection e scan logic

Scan insertion muda o circuito porque adiciona muxes e entradas de teste.

Se o scan enable (`test_se`) não for travado em `0`, o Formality pode considerar modo scan como possível. Isso muda a função.

Solução típica:

```tcl
set synopsys_auto_setup true
```

e/ou:

```tcl
set_constant test_se 0
```

O slide enfatiza que `guide_scan*` só é aceito quando `synopsys_auto_setup true`.

---

### 6. `report_svf_operation`: saindo do resumo para o detalhe

A Guidance Summary aponta que algo foi rejeitado. O comando:

```tcl
report_svf_operation -status rejected -command reg_constant
```

mostra quais operações foram rejeitadas e por quê.

Esse é o caminho correto:

```text
Guidance Summary → suspeita
report_svf_operation → detalhe
setup/script correction → rerun
```

Não é necessário esperar `verify` falhar para começar a investigar.

---

## Conceitos difíceis explicados em profundidade

### False Negative

É quando a implementação está correta, mas Formality falha. Geralmente ocorre por setup.

Exemplo:

```text
SVF errado → guidance rejeitada → Formality não entende transformação → verify falha
```

---

### True Negative

É quando a implementação está realmente errada. É o caso crítico para signoff.

Exemplo:

```text
RTL usa OR
netlist usa AND
```

---

### Guidance Summary

Relatório que aparece durante o match e mostra quantos comandos SVF foram aceitos, rejeitados, não suportados ou não processados.

---

### Rejected Guidance

É uma operação do SVF que o Formality não conseguiu ou não aceitou aplicar. Pode ser por:

- objeto não encontrado;
- nome diferente;
- SVF errado;
- operação inválida;
- Formality discordando da condição;
- setup ausente.

---

### Naming transform

Transformação que muda nomes ou caminhos hierárquicos. Se rejeitada, pode causar problema de match.

Exemplos:

```text
change_names
ungroup
```

---

### Combinational transform

Transformação que altera a estrutura da lógica combinacional, mas não muda fronteiras sequenciais.

Exemplos:

```text
datapath
multiplier
merge
replace
```

---

### Sequential transform

Transformação que altera registradores ou fronteiras sequenciais.

Exemplos:

```text
reg_constant
reg_duplication
reg_merging
retiming
multibit
inv_push
```

---

### Test transform

Transformação associada a test insertion/scan.

Exemplo:

```text
scan_input
```

---

## Comandos importantes

### Setup/read stage

```tcl
report_setup_status
report_hdlin_mismatches -summary
```

### Auto setup

```tcl
set synopsys_auto_setup true
```

### SVF operation detail

```tcl
report_svf_operation -status rejected -command reg_constant
```

### Comandos relacionados que aparecerão no fluxo

```tcl
report_unmatched_points
report_failing_points
analyze_points
```

---

## Figuras e diagramas importantes

### Gráfico de tipos de falha

Mostra que a maior parte dos runs passa; entre os que falham, a maior parte é false negative, não true negative.

---

### Linha do tempo do projeto

Mostra que Formality deve ser usado cedo. Depois de RTL freeze e netlist freeze, mudanças ficam caras.

---

### Fluxo Formality por estágios

Mostra que problemas podem ser depurados em:

```text
Check reading
Check Matching and SVF summary
Pass/Fail/Inconclusive
Debug
```

---

### Tabela de caracterização de rejeições

É a figura mais importante da parte A. Resume:

```text
Naming → problema de match
Combinational → verify pode demorar
Sequential → provável fail
Test → fail sem setup
```

---

### Exemplos combinational, sequential e test

Os três exemplos mostram por que o tipo da rejeição importa:

- combinacional rejeitada: pode não falhar;
- sequencial rejeitada: tende a falhar;
- scan/test rejeitado: falha se `test_se` não for deasserted.

---

## Pontos de prova e revisão

1. A maioria das falhas em Formality tende a ser false negative.
2. False negative significa implementação boa, mas Formality falha.
3. True negative significa implementação realmente ruim.
4. A maior causa de false negative é setup issue.
5. `set synopsys_auto_setup true` é chave para setup fácil.
6. Usar o SVF correto é essencial.
7. Debug deve começar cedo no projeto.
8. Debug deve começar cedo no fluxo Formality.
9. Não espere `verify` para depurar problemas visíveis no read ou match.
10. O melhor ponto de partida são summaries, não debug detalhado.
11. Read stage usa `report_setup_status`.
12. Read stage também pode usar `report_hdlin_mismatches -summary`.
13. Match stage deve olhar Guidance Summary e Match Summary.
14. Guidance Summary permite prever falhas futuras.
15. Nem toda rejected guidance é grave.
16. Rejeições de naming podem causar problema de match.
17. Rejeições combinacionais podem só aumentar tempo ou causar inconclusive.
18. Rejeições sequenciais tendem a causar falha.
19. Rejeições de test tendem a causar falha sem setup correto.
20. `guide_scan*` só é aceito quando `synopsys_auto_setup true`.
21. `guide_reg_constant` rejeitado é causa clássica de false negative.
22. `guide_reg_merging` rejeitado é perigoso porque muda fronteira sequencial.
23. Scan insertion muda a função se `test_se` não for deasserted.
24. Para detalhes de SVF rejeitado, use `report_svf_operation`.
25. Exemplo importante: `report_svf_operation -status rejected -command reg_constant`.

---

## Relação com projeto/laboratório

Fluxo recomendado para iniciar debug:

```tcl
set synopsys_auto_setup true
set_svf design.svf

# read reference and implementation
# set_top reference and implementation

report_setup_status
report_hdlin_mismatches -summary

match

report_setup_status
# olhar Guidance Summary no transcript
# olhar Match Summary no transcript
```

Se a Guidance Summary mostra rejeição perigosa:

```tcl
report_svf_operation -status rejected -command reg_constant
report_svf_operation -status rejected -command reg_merging
report_svf_operation -status rejected -command scan_input
```

Se o problema for scan:

```tcl
set_constant test_se 0
```

ou revisar:

```tcl
set synopsys_auto_setup true
```

---

## Checklist de qualidade

- [x] Parte A processada conforme roteiro.
- [x] Texto dos prints foi convertido em conteúdo de estudo.
- [x] Figuras e tabelas foram interpretadas.
- [x] Comandos importantes foram preservados.
- [x] Pegadinhas de prova foram destacadas.
- [x] A diferença entre false negative e true negative foi explicada.
- [x] A classificação de SVF rejection foi aprofundada.
- [x] O próximo bloco foi indicado.

---

## Próximo bloco

- **Bloco:** 068
- **Aula:** 07 Efficient Debugging in Formality — parte B
- **Arquivo:** mesmo anexo

```text
C:\Users\maiko\ci_expert\Aulas2Prints\09 Formality Foundation\07 Efficient Debugging in Formality.docx
```

- **Processar a partir de:** slide 20, começando por:

```text
Guidance Summary: What to look for
```

- **Salvar em:**

```text
C:\Users\maiko\ci_expert\mdCursoPt2\09 Formality Foundation\07 Efficient Debugging in Formality_parte_B.md
```
