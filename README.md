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
Dell G15       Samsung TV     Monitoramento   Síntese Voz    Downloader
(RTX, Bateria, (SmartThings   Proativo        (TTS Neural)   (Torrents,
Planos, RAM)   Crystal 55")   (Alertas Zap)   (Responde Voz) Vídeos)
```

---

## 🚀 Todos os Recursos Implementados

### 1. 🗣️ Jarvis Falante — Respostas em Áudio (TTS Neural)
* **Respostas com Voz no WhatsApp**: Quando você envia um áudio, o Jarvis não só responde em texto como também manda uma **nota de voz com voz natural brasileira** no WhatsApp!
* **Comando `!falar <texto>`**: Peça para o Jarvis falar qualquer mensagem via áudio.

### 2. 🛡️ Monitoramento Proativo Autônomo (Ele te avisa no WhatsApp)
O Jarvis monitora o Dell G15 silenciosamente a cada 2 minutos em segundo plano:
* **Alerta de Bateria Crítica**: Se o notebook estiver fora da tomada e a bateria cair para **<= 20%**, você recebe um aviso no WhatsApp no S23 para ligar na tomada antes que desligue.
* **Alerta Térmico da RTX**: Se a placa de vídeo atingir **>= 85°C**, ele te avisa para ventilar o notebook.

### 3. 📥 Downloader de Mídias e Torrents (`!baixar`)
* `!baixar <link>`:
  * **Links Magnet de Torrent**: Inicia o download automaticamente no seu cliente de torrent (qBittorrent/uTorrent) no PC.
  * **Links de Vídeo**: Envie links do YouTube, Reels ou mídias para salvar direto na sua pasta de Downloads.

### 4. 🌐 Acesso Externo Seguro (Cloudflare Tunnel com 1 Clique)
* Dê dois cliques em **`iniciar_cloudflare_tunnel.bat`**.
* O Jarvis gera um link seguro HTTPS gratuito (ex: `https://seu-link.trycloudflare.com`) para você abrir o Painel Web no seu Galaxy S23 de qualquer lugar do mundo (na academia, no 4G/5G, no trabalho).

### 5. 📍 Webhooks para Modos e Rotinas do Samsung S23
Rotas prontas para acionamento por geolocalização ou horário:
* `/api/webhook/cheguei` ➔ Chegando em casa (liga TV, abre Spotify).
* `/api/webhook/sair` ➔ Saindo de casa (desliga TV, bloqueia a tela do Windows).
* `/api/webhook/dormir` ➔ Ao plugar no carregador à noite (Modo Noturno).
* `/api/webhook/acordar` ➔ De manhã (Modo Trabalho).

---

## 📋 Lista de Comandos do WhatsApp

| Comando | Descrição |
|---|---|
| `!ajuda` | Mostra todos os comandos |
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
