# 🤖 Jarvis Local — Central de Controle Pessoal

Bot de WhatsApp, API REST e Painel Web para controle total do seu ecossistema: **Dell G15 5525**, **Samsung Crystal 55"** e **Samsung Galaxy S23**.

---

## 🏗️ Arquitetura do Sistema

```
[ Galaxy S23 ]                      [ Áudios / Mensagens WhatsApp ]
      │                                             │
      ├───────────────────────┬─────────────────────┤
      ▼                       ▼                     ▼
Dashboard Web (PWA)     WhatsApp Bot        Modos & Rotinas / API
 (http://PC:3000)      (Voz & Texto)         (x-api-key protegida)
      │                       │                     │
      └───────────────────────┴─────────────────────┘
                              │
                              ▼
            [ Camada de Serviços do Jarvis ]
    ┌─────────────────┬─────────────────┬─────────────────┐
    ▼                 ▼                 ▼                 ▼
Dell G15 (Power,   Samsung Crystal 55"  Windows Native    IA & Áudio
CPU, GPU RTX, RAM) (SmartThings API)   (Mídia, Telas)    (Google Gemini)
```

---

## 🚀 Novidades Implementadas

### 1. 🎙️ Comandos por Voz e Linguagem Natural
- **Áudios no WhatsApp**: Envie uma mensagem de voz pelo WhatsApp e o Jarvis transcreve e executa a ação.
- **Sem sintaxe rígida**: Você pode falar naturalmente:
  - *"Jarvis, vou jogar um pouco"* ➔ Liga a TV, põe o G15 em performance e abre a Steam.
  - *"Abaixa a TV"* ou *"volume 50"* ➔ Ajusta os decibéis da Crystal 55".
  - *"Como tá a temperatura da placa de vídeo?"* ➔ Reporta a RTX do G15.
  - *"Pausa o filme"* ➔ Pausa a reprodução global no Windows.
- *(Opcional)* Adicione sua `GEMINI_API_KEY` gratuita no `.env` para compreensão de áudio e conversação avançada. Caso não configure, o Jarvis possui um analisador semântico local nativo.

### 2. 📱 Painel Web PWA (Otimizado para o Galaxy S23)
Abra no navegador do S23 ou PC: `http://<IP-DO-NOTEBOOK>:3000`
- **Dark Mode Futurista** com feedback tátil.
- **Sliders de Volume** separados para o Dell G15 e TV Samsung Crystal.
- **Botões Rápidos de Cena**: Gaming, Pirata, Foco/Trabalho, Espelho, Noturno e Silêncio.
- **Telemetria ao Vivo**: CPU, RAM, Bateria e Temperatura da GPU RTX.
- **Visualizador de Captura de Tela**: Veja o que está passando na tela do PC direto no celular.

### 3. ⏯️ Mídia, Segurança e Otimização do Windows
| Comando | Descrição |
|---|---|
| `!play` / `!pause` | Alterna reprodução de mídia global (YouTube, Spotify, filmes) |
| `!proxima` / `!anterior` | Passa ou volta faixas de áudio/vídeo |
| `!bloquear` | Tranca a tela do Windows imediatamente (`Win + L`) |
| `!limpar` | Esvazia arquivos temporários, lixeira e limpa memória RAM em cache |
| `!fechar <app>` | Mata um processo travado (ex: `!fechar chrome`) |

### 4. ⚡ Inicialização Silenciosa em Segundo Plano
- **`iniciar_jarvis_oculto.vbs`**: Inicia o Jarvis sem abrir janela de terminal CMD.
- **`instalar_inicializacao_windows.bat`**: Registra o Jarvis para iniciar sozinho toda vez que o Dell G15 for ligado.
- **`parar_jarvis.bat`**: Encerra o Jarvis em segundo plano com um clique.

---

## 📋 Lista Completa de Comandos do WhatsApp

### 🎬 Cenários Rápidos
- `!gaming`: Liga TV Samsung, entrada HDMI, G15 em Alto Desempenho e Steam Big Picture.
- `!pirata`: TV no HDMI, volume equilibrado e navegador em tela cheia.
- `!trabalho`: Desliga a TV, volta pro display do Dell G15 e perfil equilibrado.
- `!espelho`: Clona a imagem do notebook na TV de 55".
- `!noturno`: Volume baixo (PC e TV) e perfil silencioso.
- `!silencio`: Mute instantâneo no PC e na TV.

### 💻 Dell G15 5525
- `!pc`: Relatório de CPU, RAM, Bateria, Temperatura da RTX e Plano ativo.
- `!screenshot`: Tira um print e manda a imagem no chat.
- `!volume [0-100]`: Volume do sistema.
- `!modo performance | balanceado | silencioso`: Troca perfil de energia.
- `!bloquear`: Trava a máquina.
- `!limpar`: Limpeza de memória e temporários.
- `!desligar` / `!reiniciar` / `!cancelar`: Controle de energia do Windows.

### 📺 TV Samsung Crystal 55" (SmartThings)
- `!tv ligar` / `!tv desligar`
- `!tv volume [0-100]`
- `!tv mute` / `!tv unmute`
- `!tv hdmi1` / `!tv hdmi2` / `!tv hdmi3`
- `!tv netflix` / `!tv youtube` / `!tv prime` / `!tv disney` / `!tv spotify`

---

## ⚙️ Configuração do `.env`

```env
PORT=3000
API_KEY=sua-chave-secreta-aqui
PIRATA_URL=https://yts.mx

# Inteligência Artificial / Comandos por Áudio (Opcional, gratuito)
GEMINI_API_KEY=sua-chave-aistudio-aqui

# Samsung SmartThings (para TV Crystal 55")
SMARTTHINGS_TOKEN=seu-token-smartthings
SMARTTHINGS_TV_DEVICE_ID=id-da-tv
SMARTTHINGS_TV_HDMI_INPUT=HDMI1

# Volumes Automáticos
TV_VOLUME_GAMING=40
TV_VOLUME_PIRATA=30
TV_VOLUME_NOTURNO=12
PC_VOLUME_NOTURNO=20
```

Para rodar manualmente em modo desenvolvimento:
```bash
npm run dev
```
