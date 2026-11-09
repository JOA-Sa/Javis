# 🤖 Jarvis Local — Documentação Completa & Arquitetura do Sistema

> **Central autônoma de automação e assistente pessoal integrada ao ecossistema:**
> - 💻 **Dell G15 5525** (AMD Ryzen + NVIDIA RTX 3050/3060, Windows 11)
> - 📺 **Samsung Crystal UHD 55"** (Tizen OS / SmartThings)
> - 📱 **Samsung Galaxy S23** (One UI / Rotinas Bixby & PWA)
> - 💬 **WhatsApp Web Client** (Comandos, Voz, PTT & Resumo Neural)

---

## 📑 Sumário Executivo
1. [Visão Geral e Arquitetura](#1-visão-geral-e-arquitetura)
2. [Fluxo de Dados e Interações](#2-fluxo-de-dados-e-interações)
3. [Módulos e Serviços do Sistema](#3-módulos-e-serviços-do-sistema)
4. [Referência Completa da API REST & Webhooks](#4-referência-completa-da-api-rest--webhooks)
5. [Guia de Comandos do WhatsApp Bot](#5-guia-de-comandos-do-whatsapp-bot)
6. [Processamento de Linguagem Natural & IA](#6-processamento-de-linguagem-natural--ia)
7. [Variáveis de Ambiente & Configuração (.env)](#7-variáveis-de-ambiente--configuração-env)
8. [Procedimentos de Inicialização e Deploy Local](#8-procedimentos-de-inicialização-e-deploy-local)
9. [Segurança e Resiliência](#9-segurança-e-resiliência)

---

## 1. Visão Geral e Arquitetura

O **Jarvis Local** opera como um daemon híbrido unificado baseado em **Node.js**, integrando:
- **Servidor Web Express:** Disponibiliza a interface PWA para dispositivos locais e remotos, além de rotas de automação REST.
- **Bot WhatsApp (whatsapp-web.js via Puppeteer):** Interface primária conversacional capaz de processar mensagens de texto, comandos estritos, áudios PTT nativos e transcrição de mídias encaminhadas.
- **Cloudflare Tunnel (`cloudflared`):** Exposição criptografada (HTTPS/TLS) da porta local 3000 para acesso via dados móveis (4G/5G) com notificação automática da URL temporária no chat do proprietário.
- **Motor de Orquestração do SO (PowerShell & C# Launcher):** Scripts dedicados para controle de baixo nível de energia (powercfg), áudio, monitores (`displayswitch`), foco e telemetria WMI.

```
┌────────────────────────────────────────────────────────────────────────┐
│                        INTERFACES EXTERNAS                             │
├───────────────────────────────┬────────────────────────────────────────┤
│ 📱 Samsung Galaxy S23         │ 💬 WhatsApp (Proprietário)             │
│   - Rotinas Bixby (Webhooks)  │   - Áudios de voz (PTT Opus)           │
│   - Painel PWA (Cloudflare)   │   - Comandos prefixados (!)            │
│   - Browser Local (Wi-Fi)     │   - Linguagem Natural (NLP)            │
└───────────────┬───────────────┴──────────────────┬─────────────────────┘
                │                                  │
                ▼                                  ▼
┌────────────────────────────────────────────────────────────────────────┐
│                        NÚCLEO DO JARVIS (Node.js)                      │
│                                                                        │
│  [Express Server :3000] ◄─── Auth Middleware ◄─── Cloudflare Tunnel   │
│         │                                                              │
│         ├── /status (Health-check público)                             │
│         ├── /api/sistema (Telemetria, SSE, Mídia, Processos, Limpeza)  │
│         ├── /api/tv (SmartThings Client)                               │
│         ├── /api/dell (Gerenciamento de Energia PowerCFG)              │
│         ├── /api/webhook (Gatilhos Chegar / Sair / Dormir)             │
│         └── /api/modos (Cenários Gaming, Pirata, Noturno, Trabalho)    │
│                                                                        │
│  [WhatsApp Bot Engine]                                                 │
│         │                                                              │
│         ├── Anti-Loop & Rate Limiting                                  │
│         ├── IA Engine (Google Gemini 2.5 Flash via HTTPS nativo)       │
│         ├── Audio Speech-to-Text / Intent Recognition                 │
│         └── Síntese Neural de Resposta (TTS)                           │
│                                                                        │
│  [Serviços Autônomos de Segundo Plano]                                 │
│         ├── gamer.service: Detecção de jogos em execução (RTX)         │
│         └── monitor.service: Polling de Bateria & Temperatura GPU      │
└─────────────────────────────────┬──────────────────────────────────────┘
                                  │
                                  ▼
┌────────────────────────────────────────────────────────────────────────┐
│                        CAMADA DE INTEGRAÇÃO FÍSICA                     │
├───────────────────────┬────────────────────────┬───────────────────────┤
│ 💻 Dell G15 5525      │ 📺 Samsung Crystal 55" │ 🌐 Serviços Web       │
│  - powercfg (Planos)  │  - SmartThings REST API│  - Gemini Flash API   │
│  - scripts PowerShell │  - Controle Remoto V.  │  - Spotify Desktop/TV │
│  - Limpeza RAM Física │  - HDMI 1/2/3          │  - yt-dlp Extrator    │
│  - Wake-on-LAN (UDP)  │  - Apps Tizen          │  - wttr.in (Clima)    │
└───────────────────────┴────────────────────────┴───────────────────────┘
```

---

## 2. Fluxo de Dados e Interações

### 2.1 Mensagens de Texto & Comandos
1. O proprietário envia uma mensagem no chat pessoal do WhatsApp.
2. O bot valida a remessa (`msg.fromMe === true`) e verifica o filtro anti-loop de IDs e assinaturas de resposta.
3. Se a mensagem iniciar com `!`:
   - Roteia para o mapa de execução direta correspondente (`CENAS`, `TV_CMDS`, ou subrotinas de sistema).
4. Se a mensagem estiver em linguagem natural:
   - Verifica palavras-chave e contexto do Dell G15/Jarvis.
   - Submete à IA Gemini para interpretação de intenções e sanitização segura.

### 2.2 Mensagens de Áudio (Notas de Voz / PTT)
1. O bot detecta pacote de mídia (`type === 'ptt' || type === 'audio'`).
2. Se a mensagem for encaminhada (`msg.isForwarded === true`):
   - Invoca `ia.transcreverESumarizarAudio()` para fornecer a transcrição fiel acompanhada de resumo executivo em tópicos.
3. Se for áudio nativo de instrução:
   - Extrai o buffer Base64 (Opus/OGG) e envia multimodalmente ao Gemini Flash.
   - A IA categoriza a intenção, despacha a rotina no hardware e formula a resposta.
   - O Jarvis sintetiza a resposta em áudio via `tts.service.js` e responde como nota de voz no WhatsApp.

---

## 3. Módulos e Serviços do Sistema

### 3.1 `src/services/ia.service.js`
- **Responsabilidade:** Cliente HTTPS puro (sem pacotes pesados de terceiros) para a API Gemini da Google.
- **Funções Chave:**
  - `chamarGemini(payload)`: Faz requisições POST para `/v1beta/models/{modelo}:generateContent`.
  - `interpretarTexto(texto)`: Roteia intenções com base no histórico recente de memória (curto prazo de 6 turnos) ou motor de fallback por regex.
  - `interpretarAudio(base64Audio, mimetype)`: Analisa áudio multimodal e sanitiza os parâmetros de retorno.
  - `transcreverESumarizarAudio(base64Audio, mimetype)`: Transcreve reuniões ou recados de voz.

### 3.2 `src/services/streaming.service.js`
- **Responsabilidade:** Catálogo em tempo real de streaming no território brasileiro.
- **Comportamento:**
  - Consulta o modelo sobre a disponibilidade de determinado filme ou série.
  - Compara a disponibilidade com a lista definida no `.env` (`MEUS_STREAMINGS`).
  - Caso disponível: liga automaticamente a TV Samsung Crystal 55" via SmartThings e inicia o aplicativo correspondente (`netflix`, `prime`, `disney`, etc.).
  - Caso seja aluguel/compra avulsa: informa as plataformas e o custo médio.

### 3.3 `src/services/gamer.service.js`
- **Responsabilidade:** Detecção passiva e instantânea de jogos de PC.
- **Funcionamento:** Varre o `tasklist` a cada 20 segundos comparando com a base de binários conhecidos (`cs2`, `valorant`, `cyberpunk2077`, `gta5`, `r5apex`, etc.).
- **Gatilhos Automáticos:**
  - Ao iniciar: Ativa o plano de **Alto Desempenho**, executa a rotina `sistema.limparSistema()` para liberar cache da RAM física e notifica no WhatsApp.
  - Ao encerrar: Retorna automaticamente o perfil para **Equilibrado**.

### 3.4 `src/services/monitor.service.js`
- **Responsabilidade:** Proteção térmica e energética do Dell G15.
- **Funcionamento:** Ciclo a cada 2 minutos consultando `sistema.pcStats()`.
- **Alertas Proativos:**
  - Bateria $\le 20\%$ desconectada da tomada (cooldown padrão: 30 minutos).
  - Temperatura da GPU NVIDIA $\ge 85^\circ\text{C}$ (cooldown padrão: 15 minutos).

### 3.5 `src/services/sistema.service.js`
- **Responsabilidade:** Ações diretas no Sistema Operacional Windows.
- **Operações:**
  - `screenshot()`: Captura dos monitores em PNG.
  - `pcStats()`: Coleta de uso de CPU (WMI), RAM disponível/utilizada, bateria e temperatura de GPU.
  - `definirClipboard(texto)`: Gravação atômica segura via arquivo temporário para o `Set-Clipboard`.
  - `organizarDownloads()`: Organização da pasta `Downloads` categorizando extensões em diretórios próprios (`Instaladores`, `Documentos`, `Imagens`, `Videos`, `Compactados`, `Musicas`).
  - `acordarPC()`: Envio de Magic Packet UDP via broadcast para inicialização remota.
  - `limparSistema()`: Execução de batch de limpeza de `%TEMP%`, esvaziamento de lixeira e chamada nativa da API Win32 `EmptyWorkingSet`.

### 3.6 `src/services/smartthings.service.js`
- **Responsabilidade:** Integração com o ecossistema Samsung SmartThings Cloud.
- **Operações:** Ligar/Desligar, ajuste de volume (0-100), mute/unmute, comutação de HDMI (HDMI1, HDMI2, HDMI3), disparo de teclas virtuais D-Pad (Up, Down, Left, Right, OK, Return, Home) e consulta de estado atual (`statusTV`).

### 3.7 `src/services/tunnel.service.js`
- **Responsabilidade:** Abertura transparente do túnel Cloudflare sem exposição de portas do roteador.
- **Comportamento:** Inicializa o binário `bin/cloudflared.exe` apontando para `http://localhost:3000`, captura a URL pública segura `https://*.trycloudflare.com` e grava em `public/tunnel_url.txt`.

---

## 4. Referência Completa da API REST & Webhooks

### Autenticação
Endpoints sob `/api/*` exigem o header HTTP:
```http
x-api-key: <SUA_API_KEY_DO_ENV>
```

---

### 4.1 Status e Monitoramento
- **`GET /status`** *(Público — sem token)*
  - Retorna o status de saúde do processo:
  ```json
  {
    "jarvis": "online",
    "versao": "1.0.0",
    "uptime_s": 1420,
    "memoria_mb": 94,
    "plataforma": "win32",
    "node": "v24.14.0",
    "tunnel_url": "https://random-alias.trycloudflare.com",
    "timestamp": "2026-11-09T14:10:00.000Z"
  }
  ```
- **`GET /api/sistema/stats`**
  - Retorna a telemetria detalhada de CPU, RAM, Bateria, Temperatura e Plano de Energia.
- **`GET /api/sistema/stream`**
  - Conexão Server-Sent Events (SSE) emitindo telemetria contínua a cada 3 segundos para dashboards em tempo real.
- **`GET /api/sistema/screenshot`**
  - Retorna a imagem binária (`image/png`) da tela do notebook.

---

### 4.2 Controle do Sistema e Energia
- **`GET /api/sistema/bloquear`**: Trava a estação de trabalho (`LockWorkStation`).
- **`GET /api/sistema/suspender`**: Coloca o Dell G15 no modo de suspensão profunda.
- **`GET /api/sistema/limpar`**: Aciona limpeza de lixeira, temporários e memória física.
- **`GET /api/sistema/brilho/:nivel`**: Define brilho da tela (0 a 100%).
- **`GET /api/sistema/midia/:acao`**: Dispara eventos multimídia (`playpause`, `play`, `pause`, `next`, `prev`, `stop`).
- **`GET /api/sistema/fechar/:app`**: Finaliza processos específicos por nome (ex: `chrome`).
- **`GET /api/dell/performance`**: Altera energia para Alto Desempenho.
- **`GET /api/dell/balanceado`**: Altera energia para Equilibrado.
- **`GET /api/dell/silencioso`**: Altera energia para Economia de Energia.

---

### 4.3 Samsung Crystal 55" (SmartThings)
- **`GET /api/tv/status`**: Consulta status de energia, volume, mute e canal de entrada.
- **`GET /api/tv/ligar`** & **`GET /api/tv/desligar`**
- **`GET /api/tv/volume/:nivel`**: Ajuste direto do volume (0 a 100).
- **`GET /api/tv/input/:input`**: Seleção de porta HDMI (ex: `HDMI1`).
- **`GET /api/tv/app/:app`**: Abre app no Tizen (`netflix`, `youtube`, `prime`, `disney`, `spotify`, `max`, `apple`, `globoplay`).
- **`GET /api/tv/tecla/:tecla`**: Envia botão do controle remoto virtual (`ok`, `voltar`, `home`, `cima`, `baixo`, etc.).

---

### 4.4 Webhooks para Samsung Galaxy S23 (Rotinas do Bixby / Tasker)
Configure requisições POST para as seguintes rotinas:
- **`POST /api/webhook/chegar`**: Gatilho ao conectar no Wi-Fi residencial.
- **`POST /api/webhook/sair`**: Gatilho ao desconectar do Wi-Fi ou sair de casa (desliga telas, bloqueia o sistema).
- **`POST /api/webhook/dormir`**: Gatilho ao iniciar o modo sono no Galaxy S23 (aplica volume mínimo, modo silencioso no Dell G15 e desliga TV).

---

## 5. Guia de Comandos do WhatsApp Bot

Envie no seu chat pessoal do WhatsApp:

| Comando | Parâmetros | Descrição do Comportamento |
|---|---|---|
| `!ajuda` | - | Exibe o menu interativo com todas as instruções de uso. |
| `!pc` | - | Relatório instantâneo de CPU, RAM, Bateria, Temperatura RTX e Plano ativo. |
| `!screenshot` | - | Tira print em tempo real de todas as telas e envia a foto no chat. |
| `!assistir <título>` | Nome do título | Consulta disponibilidade em streaming no Brasil e abre o app na TV Samsung. |
| `!tocar <música>` | Nome/Artista | Abre e reproduz a faixa no Spotify do Dell G15 ou TV. |
| `!mp3 <link>` | URL YouTube/Reels | Extrai a faixa de áudio em formato MP3 de alta fidelidade e envia no chat. |
| `!baixar <link>` | URL/Magnet Link | Baixa vídeos para a pasta `Downloads` ou dispara o cliente de torrent. |
| `!clip <texto>` | Texto a copiar | Injeta o texto diretamente na área de transferência (`Ctrl + V`) do Windows. |
| `!organizar` | - | Triagem automática de arquivos soltos na pasta `Downloads`. |
| `!bomdia` | - | Briefing matinal com previsão do tempo, bateria, hardware e nota de voz. |
| `!falar <texto>` | Frase desejada | Converte a mensagem em áudio com voz neural e devolve em nota de voz. |
| `!link` ou `!painel` | - | Envia a URL pública ativa do Cloudflare Tunnel com token pronto para uso. |
| `!gaming` | - | Liga TV no HDMI, som na TV, silencia notificações, Steam Big Picture e RTX Alto Desempenho. |
| `!pirata` | - | TV no HDMI, navegador em tela cheia na URL configurada e volume ajustado. |
| `!trabalho` | - | Desliga TV, comuta áudio para alto-falantes/fones, reativa notificações e modo equilibrado. |
| `!espelho` | - | Clona a tela do notebook diretamente na Samsung Crystal 55". |
| `!noturno` | - | Ajusta PC e TV para volumes discretos e modo de baixo ruído das ventoinhas. |
| `!silencio` | - | Muta simultaneamente o áudio do notebook e da TV. |
| `!bloquear` | - | Trava a tela do Windows (`Win + L`). |
| `!suspender` | - | Coloca o computador em suspensão profunda. |
| `!limpar` | - | Libera working sets de memória, limpa lixeira e esvazia cache de temporários. |
| `!brilho [0-100]` | Número | Regula o brilho da tela integrada do Dell G15. |
| `!volume [0-100]` | Número | Ajusta o volume global do sistema operacional. |
| `!fechar <app>` | Nome (ex: chrome) | Força o encerramento de um processo ativo. |
| `!play` / `!pause` | - | Alterna reprodução de mídia em navegadores ou players compatíveis. |
| `!proxima` / `!anterior` | - | Avança ou retorna faixas de música/vídeo. |
| `!tv <subcomando>` | `ligar`, `desligar`, `mute`, `volume X`, `status`, `hdmi1`, `netflix`... | Controle da Samsung Crystal 55" via SmartThings. |
| `!acordar` | - | Dispara Magic Packet Wake-on-LAN para ligar o computador remotamente. |
| `!desligar` | - | Agenda o desligamento seguro do computador em 30 segundos. |
| `!reiniciar` | - | Agenda a reinicialização do sistema operacional em 30 segundos. |
| `!cancelar` | - | Cancela desligamento ou reinicialização agendados. |

---

## 6. Processamento de Linguagem Natural & IA

O processamento semântico utiliza o modelo **Gemini 2.5 Flash**:

1. **Memória de Curto Prazo:** O serviço mantém em buffer volátil as últimas 6 interações entre `Usuário` e `Jarvis` para responder a comandos encadeados.
2. **Sanitização de Saída:** Todo retorno estruturado do modelo passa pelo validador `sanitizarIntencao()`, impedindo que respostas arbitrárias ou alucinações executem comandos no sistema sem parâmetros estritamente validados.
3. **Fallback Resiliente:** Caso a conexão com a API Gemini esteja indisponível, o sistema ativa automaticamente o interpretador léxico baseado em Expressões Regulares (`RegExp`), mantendo funcionais comandos cotidianos como "ligar tv", "modo cinema", "como tá o pc" e controle de volume.

---

## 7. Variáveis de Ambiente & Configuração (.env)

O arquivo `.env` na raiz do projeto concentra todas as credenciais e parâmetros:

```env
# ─── Configurações Básicas do Servidor ────────────────────────────────────────
PORT=3000
API_KEY=sua-chave-forte-aqui
PIRATA_URL=https://yts.mx

# ─── Streamings Assinados (separados por vírgula) ─────────────────────────────
# Opções: netflix, prime, max, disney, apple, globoplay, paramount
MEUS_STREAMINGS=netflix,prime,max,disney

# ─── Google Gemini (Gratuito no Google AI Studio) ────────────────────────────
GEMINI_API_KEY=sua-api-key-do-google-gemini
GEMINI_MODEL=gemini-2.5-flash

# ─── Samsung Crystal 55" (SmartThings API) ──────────────────────────────────
# Obtenha em: https://account.smartthings.com/tokens
SMARTTHINGS_TOKEN=seu-token-smartthings
SMARTTHINGS_TV_DEVICE_ID=id-do-dispositivo-da-tv
SMARTTHINGS_TV_HDMI_INPUT=HDMI1

# ─── Configuração de Volumes por Modo ─────────────────────────────────────────
TV_VOLUME_GAMING=40
TV_VOLUME_PIRATA=30
TV_VOLUME_NOTURNO=12
PC_VOLUME_NOTURNO=20

# ─── Wake-on-LAN (Opcional - para o comando !acordar) ────────────────────────
WOL_MAC_ADDRESS=AA:BB:CC:DD:EE:FF
WOL_BROADCAST=255.255.255.255

# ─── Caminho Personalizado do Chrome (Opcional) ──────────────────────────────
# CHROME_BIN=C:\Program Files\Google\Chrome\Application\chrome.exe

# ─── Limiares de Alerta do Monitor Proativo ───────────────────────────────────
ALERTA_BATERIA_PCT=20
ALERTA_GPU_TEMP=85
COOLDOWN_BATERIA_MIN=30
COOLDOWN_GPU_MIN=15
```

---

## 8. Procedimentos de Inicialização e Deploy Local

### Pré-requisitos
- **Node.js**: v18.0.0 ou superior (Recomendado v20+ ou v24 LTS).
- **Google Chrome** instalado para uso com o Puppeteer.
- **PowerShell 5.1+** com política de execução permitindo scripts locais (`RemoteSigned` ou `Bypass`).

### Scripts Utilitários na Raiz
- `iniciar_jarvis.bat`: Inicialização padrão com janela de console visível.
- `iniciar_jarvis_silencioso.vbs` / `iniciar_silencioso.ps1`: Inicializa o serviço e o túnel sem abrir janelas de console na área de trabalho.
- `parar_jarvis.bat`: Encerra graciosamente os processos `node.exe` e `cloudflared.exe`.
- `status_jarvis.bat`: Verifica a saúde dos processos em execução.
- `instalar_inicializacao_windows.bat`: Registra o inicializador silencioso na pasta `Startup` do usuário para boot automático junto com o Windows.
- `Jarvis.exe`: Executável nativo compilado em C# para início facilitado.

---

## 9. Segurança e Resiliência

1. **Túnel Seguro sem Port Forwarding:** Não é necessário abrir portas no roteador residencial (NAT traversal feito via Cloudflare Edge Network).
2. **Isolamento de Áudio e Mídia:** Extrações via `yt-dlp` e gravações temporárias de síntese de voz utilizam a pasta temporária do sistema (`os.tmpdir()`) com rotinas automáticas de exclusão logo após o envio (`fs.unlink`).
3. **Proteção Anti-Loop no WhatsApp:** Todo ID gerado pelo bot é armazenado num cache LRU em memória (`botMsgIds`), garantindo que o bot nunca responda às próprias mensagens ou crie loops com mensagens automatizadas.
4. **Proteção de Shell Injection:** Operações como cópia de texto (`!clip`) transmitem dados através de buffers em disco e piping de streams, evitando injeções de comandos maliciosos via terminal.
