# 🤖 Jarvis Local — Central de Automação & Assistente Pessoal

Assistente autônomo e centro de comando para o ecossistema: **Dell G15 5525**, **Samsung Crystal 55"** e **Samsung Galaxy S23**.

---

## 🏗️ Arquitetura Completa

```
[ Samsung Galaxy S23 ]                [ WhatsApp ]
 (Modos e Rotinas / Webhooks)       (Áudios, Voz e Texto)
           │                                 │
           ├─────────────────┬───────────────┤
           ▼                 ▼               ▼
     Painel Web (PWA)   WhatsApp Bot     Cloudflare Tunnel
    (http://PC:3000)   (IA & Mensagens) (Acesso Externo)
           │                 │               │
           └─────────────────┴───────────────┘
                             │
                             ▼
              [ Camada de Serviços do Jarvis ]
 ┌──────────────┬──────────────┬──────────────┬──────────────┐
 ▼              ▼              ▼              ▼              ▼
Dell G15       Samsung TV     Monitoramento   Síntese Voz    Streaming & IA
(RTX, Bateria, (SmartThings   Gamer & PC      (TTS Neural)   (Catálogo TV,
Planos, RAM)   Crystal 55")   (Alertas Zap)   (Responde Voz) Spotify, Zap)
```

---

## 🚀 Recursos Implementados

### 1. 🎬 Catálogo de Streaming & Abertura Automática na TV
* **Comando ou Linguagem Natural**: Envie `!assistir Friends` ou áudio/texto como *"Gostaria de assistir Friends"*.
* O Jarvis pesquisa onde o título está disponível no Brasil.
* Compara com os seus streamings configurados em `MEUS_STREAMINGS` (Netflix, Max, Prime, Disney+, etc.).
* **Abertura Inteligente**: Se estiver incluso na sua assinatura, liga a TV Samsung Crystal 55" e abre o aplicativo na hora! Se exigir compra/aluguel, te informa os valores exatos.

### 2. 🎮 Detecção Gamer Automática (Dell G15 RTX)
* O Jarvis monitora em segundo plano jogos em execução (CS2, Valorant, GTA V, Cyberpunk, Apex, etc.).
* Ao abrir um jogo: ativa o plano de **Alto Desempenho**, limpa o cache de RAM para a RTX e te avisa no WhatsApp.
* Ao fechar o jogo: retorna automaticamente para o modo **Balanceado**.

### 3. 🎵 Spotify & Extração de MP3
* `!tocar <música/artista>`: Abre e busca instantaneamente no Spotify do PC ou TV.
* `!mp3 <link>`: Baixa vídeos do YouTube/Reels, extrai o áudio em MP3 de alta qualidade e te envia o arquivo diretamente no WhatsApp.

### 4. 🧠 Produtividade & IA Pessoal
* `!bomdia`: Envia um relatório matinal completo em texto e uma **nota de voz com voz neural** (previsão do tempo, saúde da bateria do Dell G15 e mensagem do dia).
* `!clip <texto>`: Copia o texto do seu WhatsApp diretamente para a Área de Transferência (`Ctrl + V`) do notebook.
* `!organizar`: Faz a triagem automática de arquivos soltos na pasta Downloads do Windows (move instaladores, fotos, documentos, vídeos para pastas próprias).

### 5. 🖥️ Executável Nativo do Windows (`Jarvis.exe`)
* Ativação com 1 clique na sua Área de Trabalho (`JARVIS.lnk`).
* Inicia o servidor e o túnel seguro de acesso remoto simultaneamente.

### 6. 🌐 Acesso no Celular Independente da Distância
* Envio automático do link seguro do Cloudflare Tunnel no seu WhatsApp pessoal ao iniciar.
* Autenticação com 1 clique via token embutido (`?key=...`).
* Comandos `!link` e `!painel` para recuperar o endereço do PWA em qualquer lugar (4G/5G).

---

## 📋 Lista de Comandos do WhatsApp

| Comando | Descrição |
|---|---|
| `!ajuda` | Mostra todos os comandos |
| `!assistir <título>` | Busca onde passa (Netflix, Max, Prime, Disney+) e abre na TV Samsung |
| `!tocar <música>` | Toca no Spotify do Dell G15 ou TV |
| `!mp3 <link>` | Extrai áudio MP3 de vídeo e envia direto no WhatsApp |
| `!bomdia` | Resumo matinal falado por voz neural com clima e status |
| `!clip <texto>` | Copia texto do celular para o `Ctrl + V` do Windows |
| `!organizar` | Organiza arquivos da pasta Downloads do Dell G15 |
| `!link` / `!painel` | Envia o link de acesso remoto seguro no Galaxy S23 (4G/5G) |
| `!gaming` | TV no HDMI, G15 em Alto Desempenho e Steam na tela grande |
| `!pirata` | TV no HDMI, volume equilibrado e navegador em tela cheia |
| `!trabalho` | Desliga a TV e foca no notebook |
| `!espelho` | Clona o display do notebook na Samsung Crystal 55" |
| `!noturno` | Reduz áudio (PC e TV) e ativa modo silencioso do G15 |
| `!silencio` | Mute geral instantâneo |
| `!pc` | Telemetria (CPU, RAM, Bateria, Temperatura GPU RTX e Plano) |
| `!screenshot` | Envia print da tela em tempo real no chat |
| `!bloquear` | Trava o Windows (`Win + L`) |
| `!limpar` | Esvazia arquivos temporários, lixeira e libera memória RAM |
| `!fechar <app>` | Mata um programa (ex: `!fechar chrome`) |
| `!play` / `!pause` | Play/Pause da mídia global do Windows |
| `!proxima` / `!anterior` | Passa ou retrocede faixas de áudio/vídeo |
| `!volume [0-100]` | Volume do PC |
| `!tv ligar` / `!tv desligar` | Ligar e desligar a Samsung Crystal 55" |
| `!tv volume [0-100]` | Volume da TV |
| `!tv hdmi1` / `!tv hdmi2` | Troca de porta HDMI |
| `!tv netflix` / `!tv youtube` | Abre apps diretamente na TV |
| `!baixar <link>` | Baixa vídeos ou inicia download de torrent |
| `!falar <texto>` | Jarvis fala a mensagem em áudio no WhatsApp |
