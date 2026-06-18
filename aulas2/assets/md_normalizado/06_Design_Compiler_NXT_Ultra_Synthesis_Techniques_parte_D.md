# 06 Design Compiler NXT Ultra Synthesis Techniques — parte D

## Controle do bloco
- Bloco: 042
- Arquivo de origem: `C:\Users\maiko\ci_expert\Aulas2Prints\07 Design Compiler NXT - RTL Synthesis\06 Design Compiler NXT Ultra Synthesis Techniques.docx`
- Faixa de slides: 76-77
- Caminho sugerido para salvar: `C:\Users\maiko\ci_expert\mdCursoPt2\07 Design Compiler NXT - RTL Synthesis\06 Design Compiler NXT Ultra Synthesis Techniques_parte_D.md`
- Próximo bloco recomendado: 043 — `07 Timing Analysis`

## Resumo executivo

Esta parte final da unidade fecha o tema de **resource sharing** em síntese RTL.

A mensagem principal é: o Design Compiler NXT consegue escolher entre compartilhar ou não compartilhar recursos aritméticos quando o RTL é escrito de uma forma que deixa essa decisão aberta para a ferramenta. Porém, se o RTL já “força” uma arquitetura específica, a ferramenta pode ficar presa a ela.

Os slides mostram dois erros opostos:

1. **Impedir resource sharing sem querer**, escrevendo os recursos aritméticos fora do `if`.
2. **Forçar resource sharing demais**, escrevendo o código de modo que o somador compartilhado fique fora do `if`.

A recomendação final é escrever o RTL de modo que o DC NXT possa decidir se o compartilhamento de recurso vale a pena para timing e área.

---

## Texto extraído e organizado por slide

### Slide 76 — Example: Preventing Resource Sharing

Código mostrado:

```verilog
Op1 = A + B;
Op2 = C + D;

if (SEL)
  SUM = Op1;
else
  SUM = Op2;
```

A arquitetura mostrada no slide possui:

- um somador para `A + B`;
- um somador para `C + D`;
- um multiplexador depois dos dois somadores;
- `SEL` selecionando qual resultado vai para `SUM`.

Mensagem do slide:

> Since the arithmetic resources are outside the if statement, no resource sharing occurs. The design might be much larger than necessary.

Tradução:

> Como os recursos aritméticos estão fora do comando `if`, nenhum compartilhamento de recurso ocorre. O design pode ficar muito maior do que o necessário.

---

### Slide 77 — Example: Forced Resource Sharing

Código mostrado:

```verilog
if (SEL)
  begin
    Op1 = A;
    Op2 = B;
  end
else
  begin
    Op1 = C;
    Op2 = D;
  end

SUM = Op1 + Op2;
```

A arquitetura mostrada no slide possui:

- multiplexador escolhendo entre `A` e `C`;
- multiplexador escolhendo entre `B` e `D`;
- um único somador compartilhado;
- saída `SUM`.

Mensagem principal do slide:

> Since the arithmetic resource is being shared outside the if statement, Design Compiler NXT can not un-share — Poor architecture if SEL→SUM is timing critical.

Tradução:

> Como o recurso aritmético está sendo compartilhado fora do comando `if`, o Design Compiler NXT não consegue desfazer esse compartilhamento — arquitetura ruim se o caminho `SEL → SUM` for crítico em timing.

Recomendação do slide:

> Write code that lets Design Compiler NXT decide if resource-sharing is warranted.

Tradução:

> Escreva código que permita ao Design Compiler NXT decidir se o compartilhamento de recurso é justificado.

---

## Aula didática desenvolvida

### 1. O que é resource sharing

**Resource sharing** significa usar o mesmo hardware para executar operações que nunca precisam acontecer ao mesmo tempo.

Exemplo conceitual:

```verilog
if (SEL)
  SUM = A + B;
else
  SUM = C + D;
```

Como `SEL` escolhe apenas um dos caminhos, existem duas possibilidades arquiteturais:

### Arquitetura sem compartilhamento

```text
A + B ─┐
       ├─ mux ─ SUM
C + D ─┘
```

Essa arquitetura usa:

- dois somadores;
- um mux na saída.

Vantagem:

- pode ser mais rápida em alguns casos, porque os somadores trabalham em paralelo.

Desvantagem:

- usa mais área.

### Arquitetura com compartilhamento

```text
A ─┐
   ├─ mux ─┐
C ─┘       │
           ├─ somador ─ SUM
B ─┐       │
   ├─ mux ─┘
D ─┘
```

Essa arquitetura usa:

- dois muxes antes;
- um único somador.

Vantagem:

- economiza área.

Desvantagem:

- pode piorar timing, especialmente se `SEL → SUM` for crítico, porque `SEL` precisa passar pelos muxes antes do somador.

---

### 2. O erro do slide 76: impedir o compartilhamento sem querer

No slide 76, o código calcula `Op1` e `Op2` antes do `if`:

```verilog
Op1 = A + B;
Op2 = C + D;

if (SEL)
  SUM = Op1;
else
  SUM = Op2;
```

Ao escrever assim, você praticamente diz à ferramenta:

```text
calcule as duas somas sempre,
depois escolha uma delas.
```

Isso favorece uma arquitetura com dois somadores.

Se a meta for alto desempenho, talvez essa arquitetura seja boa. Mas se a meta for área, ela pode ser ruim, porque dois somadores ocupam mais área que um.

O problema é que o RTL já direcionou a arquitetura. A ferramenta tem menos liberdade para decidir.

---

### 3. O erro do slide 77: forçar compartilhamento demais

No slide 77, o código faz o oposto:

```verilog
if (SEL)
  begin
    Op1 = A;
    Op2 = B;
  end
else
  begin
    Op1 = C;
    Op2 = D;
  end

SUM = Op1 + Op2;
```

Aqui você diz à ferramenta:

```text
primeiro escolha os operandos,
depois faça uma soma.
```

Isso força uma arquitetura com muxes antes e um único somador.

Pode ser excelente para área. Mas se o caminho `SEL → SUM` for crítico, isso pode ser ruim.

Por quê?

Porque `SEL` controla os muxes. Então o atraso do caminho pode ser:

```text
SEL → mux → somador → SUM
```

Se a arquitetura tivesse dois somadores e mux depois, o caminho poderia ser:

```text
SEL → mux → SUM
```

Nesse caso, o caminho de `SEL` não passaria pelo somador. Portanto, forçar resource sharing pode prejudicar timing.

---

### 4. O melhor estilo: deixar a ferramenta decidir

O código mais equilibrado é o estilo apresentado no slide anterior da parte C:

```verilog
if (SEL)
  SUM = A + B;
else
  SUM = C + D;
```

Esse estilo deixa claro o comportamento funcional, mas não força demais a arquitetura.

Com esse RTL, o DC NXT pode decidir:

- se compartilha o somador para economizar área;
- ou se usa dois somadores para cumprir timing.

A decisão depende das constraints:

- clock period;
- input/output delays;
- timing crítico;
- área;
- potência;
- biblioteca alvo.

Essa é a essência do bom RTL para síntese: ele descreve o comportamento de forma clara e permite que a ferramenta escolha a melhor implementação física.

---

## Comparação direta dos três estilos

### Estilo 1 — Bom equilíbrio

```verilog
if (SEL)
  SUM = A + B;
else
  SUM = C + D;
```

Interpretação:

```text
A operação depende de SEL.
A ferramenta pode escolher a arquitetura.
```

Resultado possível:

- com sharing, se timing permitir;
- sem sharing, se timing exigir.

---

### Estilo 2 — Impede sharing

```verilog
Op1 = A + B;
Op2 = C + D;

if (SEL)
  SUM = Op1;
else
  SUM = Op2;
```

Interpretação:

```text
Calcule as duas somas sempre.
Depois selecione.
```

Resultado provável:

- dois somadores;
- mux na saída;
- mais área;
- potencialmente melhor caminho `SEL → SUM`.

---

### Estilo 3 — Força sharing

```verilog
if (SEL)
  begin
    Op1 = A;
    Op2 = B;
  end
else
  begin
    Op1 = C;
    Op2 = D;
  end

SUM = Op1 + Op2;
```

Interpretação:

```text
Selecione operandos primeiro.
Depois use um único somador.
```

Resultado provável:

- muxes antes do somador;
- um somador;
- menor área;
- possível pior timing em `SEL → SUM`.

---

## Conceitos difíceis explicados em profundidade

### Por que a posição do operador no RTL muda a arquitetura

Em síntese, a ferramenta não vê apenas “matemática”. Ela vê dependências de dados.

Quando você escreve:

```verilog
Op1 = A + B;
Op2 = C + D;
```

você cria duas operações independentes. Mesmo que depois só uma seja escolhida, a descrição sugere que ambas existem como resultados disponíveis.

Quando você escreve:

```verilog
SUM = Op1 + Op2;
```

fora do `if`, você cria uma única operação de soma depois da seleção dos operandos.

Então, embora os dois códigos possam ser funcionalmente parecidos, eles induzem arquiteturas diferentes.

---

### Por que o caminho `SEL → SUM` fica crítico no sharing forçado

No sharing forçado:

```text
SEL controla muxes de entrada
muxes alimentam o somador
somador gera SUM
```

Logo, uma mudança em `SEL` precisa atravessar:

```text
mux + somador
```

No estilo com dois somadores:

```text
A+B e C+D são calculados em paralelo
SEL controla apenas o mux final
```

Logo, uma mudança em `SEL` atravessa principalmente:

```text
mux final
```

Se `SEL` chega tarde no ciclo, o sharing forçado pode causar violação de setup.

---

### Por que o DC NXT não consegue “un-share” facilmente

No slide 77, o RTL já criou uma variável intermediária:

```verilog
Op1
Op2
```

e depois uma única soma:

```verilog
SUM = Op1 + Op2;
```

Para “un-share”, a ferramenta teria que transformar essa estrutura de volta em duas somas condicionais. Essa transformação nem sempre é segura, óbvia ou suportada, especialmente dependendo de tipos, larguras, signed/unsigned, condições e contexto de timing.

Por isso o slide diz que o DC NXT **can not un-share** nesse caso.

---

## Pontos de prova e revisão

1. Resource sharing economiza área ao reutilizar o mesmo hardware para operações mutuamente exclusivas.
2. O DC NXT pode decidir aplicar resource sharing quando o RTL permite.
3. Código com operações aritméticas fora do `if` pode impedir resource sharing.
4. Código que seleciona operandos antes e soma depois pode forçar resource sharing.
5. Forçar resource sharing pode ser ruim se o caminho `SEL → SUM` for crítico.
6. A recomendação é escrever RTL que permita ao DC NXT decidir se resource sharing é vantajoso.
7. O estilo recomendado é:
   ```verilog
   if (SEL)
     SUM = A + B;
   else
     SUM = C + D;
   ```
8. RTL funcionalmente equivalente pode gerar arquitetura diferente.
9. O objetivo não é apenas escrever código correto, mas código bom para síntese.
10. O DC NXT otimiza melhor quando o código expressa intenção funcional sem bloquear arquitetura desnecessariamente.

---

## Relação com projeto/laboratório

Em projetos RTL reais, esse detalhe aparece muito em datapaths. Por exemplo:

```verilog
always_comb begin
  case (mode)
    2'b00: result = a + b;
    2'b01: result = c + d;
    2'b10: result = e + f;
    default: result = '0;
  endcase
end
```

Esse estilo deixa a ferramenta decidir se usa:

- vários somadores em paralelo;
- menos somadores compartilhados;
- muxes antes ou depois;
- arquiteturas diferentes conforme timing.

Já um estilo com variáveis pré-calculadas pode aumentar área sem necessidade:

```verilog
sum_ab = a + b;
sum_cd = c + d;
sum_ef = e + f;

case (mode)
  2'b00: result = sum_ab;
  2'b01: result = sum_cd;
  2'b10: result = sum_ef;
endcase
```

E um estilo que força operandos antes pode economizar área, mas criar caminhos críticos em sinais de controle:

```verilog
case (mode)
  2'b00: begin op1 = a; op2 = b; end
  2'b01: begin op1 = c; op2 = d; end
  2'b10: begin op1 = e; op2 = f; end
endcase

result = op1 + op2;
```

O projetista deve escolher conscientemente. Quando não houver motivo forte para forçar uma arquitetura, a melhor prática é deixar a ferramenta decidir.

---

## Fechamento da unidade 06

A unidade 06 mostrou que `compile_ultra` é muito mais do que um comando de mapeamento para gates. Ele envolve:

- DesignWare;
- otimização aritmética;
- transformação CSA;
- duplicação de lógica;
- ALIB;
- auto-ungrouping;
- boundary optimization;
- particionamento;
- scan-aware synthesis;
- targeted QoR;
- enhanced TNS;
- prioridade entre DRC e timing;
- path groups;
- critical range;
- weight;
- placement físico com ICC II;
- multi-core;
- incremental compile;
- recuperação de área;
- estilo de RTL.

O fechamento com resource sharing reforça a ideia mais importante da unidade:

> A ferramenta é poderosa, mas a qualidade do RTL e das constraints define quanto dessa potência pode ser usada.

---

## Checklist de qualidade

- [x] Texto dos slides foi convertido para texto real.
- [x] Conceitos difíceis foram explicados, não apenas citados.
- [x] Código/comandos foram preservados e explicados.
- [x] Figuras relevantes foram interpretadas.
- [x] O Markdown ficou útil para estudar sem abrir o DOCX.
- [x] O próximo bloco foi indicado ao final.
