using System;
using System.Diagnostics;
using System.IO;
using System.Net.Sockets;
using System.Text;
using System.Text.RegularExpressions;
using System.Threading;
using System.Windows.Forms;

namespace JarvisLauncher
{
    class Program
    {
        private static Process nodeProcess = null;
        private static string appDir = "";
        private static string tunnelUrl = "";
        private static string apiKey = "";

        [STAThread]
        static void Main(string[] args)
        {
            try
            {
                Console.OutputEncoding = Encoding.UTF8;
            }
            catch { }

            Console.Title = "JARVIS - Central de Comando & Acesso Remoto";
            appDir = AppDomain.CurrentDomain.BaseDirectory;

            // Se for executado de dentro de outra pasta, garante o diretório correto
            if (!File.Exists(Path.Combine(appDir, "package.json")))
            {
                string candidate = Directory.GetCurrentDirectory();
                if (File.Exists(Path.Combine(candidate, "package.json")))
                {
                    appDir = candidate;
                }
            }

            CarregarConfig();

            // Tratar argumentos de linha de comando
            if (args.Length > 0)
            {
                string arg = args[0].ToLowerInvariant();
                if (arg == "--stop" || arg == "-stop" || arg == "/stop")
                {
                    PararJarvis();
                    Console.WriteLine("[✅] Jarvis e túneis encerrados com sucesso.");
                    return;
                }
                if (arg == "--shortcut" || arg == "-s")
                {
                    CriarAtalhoDesktop();
                    return;
                }
            }

            DesenharCabecalho();

            // 1. Verificar se Node.js está instalado
            if (!VerificarNode())
            {
                Console.ForegroundColor = ConsoleColor.Red;
                Console.WriteLine("\n[❌] Node.js não foi encontrado no PATH do sistema!");
                Console.WriteLine("    Por favor, instale o Node.js em: https://nodejs.org/");
                Console.ResetColor();
                Console.WriteLine("\nPressione qualquer tecla para sair...");
                Console.ReadKey();
                return;
            }

            // 2. Iniciar o Jarvis se ainda não estiver rodando
            bool jaEstavaRodando = IsPortaEmUso(3000);
            if (!jaEstavaRodando)
            {
                Console.ForegroundColor = ConsoleColor.Cyan;
                Console.WriteLine("[🚀] Iniciando o servidor Jarvis Local (Porta 3000)...");
                Console.ResetColor();
                IniciarProcessoJarvis();
            }
            else
            {
                Console.ForegroundColor = ConsoleColor.Green;
                Console.WriteLine("[⚡] Jarvis já está em execução na porta 3000!");
                Console.ResetColor();
            }

            // 3. Aguardar / Obter o link do túnel Cloudflare
            AguardarTunnelUrl(jaEstavaRodando ? 3 : 15);

            // 4. Menu interativo
            LoopMenu();
        }

        static void CarregarConfig()
        {
            try
            {
                string envPath = Path.Combine(appDir, ".env");
                if (File.Exists(envPath))
                {
                    string[] lines = File.ReadAllLines(envPath);
                    foreach (string line in lines)
                    {
                        string trimmed = line.Trim();
                        if (trimmed.StartsWith("API_KEY="))
                        {
                            apiKey = trimmed.Substring("API_KEY=".Length).Trim();
                        }
                    }
                }
            }
            catch { }
        }

        static bool VerificarNode()
        {
            try
            {
                ProcessStartInfo psi = new ProcessStartInfo("node", "-v")
                {
                    UseShellExecute = false,
                    RedirectStandardOutput = true,
                    CreateNoWindow = true
                };
                using (Process p = Process.Start(psi))
                {
                    p.WaitForExit(3000);
                    return p.ExitCode == 0;
                }
            }
            catch
            {
                return false;
            }
        }

        static bool IsPortaEmUso(int porta)
        {
            try
            {
                using (TcpClient client = new TcpClient())
                {
                    IAsyncResult result = client.BeginConnect("127.0.0.1", porta, null, null);
                    bool sucesso = result.AsyncWaitHandle.WaitOne(800);
                    if (sucesso)
                    {
                        client.EndConnect(result);
                        return true;
                    }
                    return false;
                }
            }
            catch
            {
                return false;
            }
        }

        static void IniciarProcessoJarvis()
        {
            try
            {
                ProcessStartInfo psi = new ProcessStartInfo("node", "src/index.js")
                {
                    WorkingDirectory = appDir,
                    UseShellExecute = false,
                    RedirectStandardOutput = true,
                    RedirectStandardError = true,
                    CreateNoWindow = true
                };

                nodeProcess = new Process { StartInfo = psi };
                nodeProcess.OutputDataReceived += (s, e) =>
                {
                    if (!string.IsNullOrEmpty(e.Data))
                    {
                        // Detectar URL do túnel na saída do console do Node
                        Match match = Regex.Match(e.Data, @"https://[a-zA-Z0-9-]+\.trycloudflare\.com");
                        if (match.Success)
                        {
                            tunnelUrl = match.Value;
                        }
                    }
                };
                nodeProcess.ErrorDataReceived += (s, e) =>
                {
                    if (!string.IsNullOrEmpty(e.Data))
                    {
                        Match match = Regex.Match(e.Data, @"https://[a-zA-Z0-9-]+\.trycloudflare\.com");
                        if (match.Success)
                        {
                            tunnelUrl = match.Value;
                        }
                    }
                };

                nodeProcess.Start();
                nodeProcess.BeginOutputReadLine();
                nodeProcess.BeginErrorReadLine();

                // Gravar PID
                try
                {
                    File.WriteAllText(Path.Combine(appDir, "jarvis.pid"), nodeProcess.Id.ToString());
                }
                catch { }
            }
            catch (Exception ex)
            {
                Console.ForegroundColor = ConsoleColor.Red;
                Console.WriteLine("[❌] Erro ao iniciar processo Node: " + ex.Message);
                Console.ResetColor();
            }
        }

        static void AguardarTunnelUrl(int segundosMax)
        {
            Console.ForegroundColor = ConsoleColor.Yellow;
            Console.Write("[🌐] Conectando ao túnel seguro para o Galaxy S23");
            Console.ResetColor();

            string arquivoUrl = Path.Combine(appDir, "public", "tunnel_url.txt");

            for (int i = 0; i < segundosMax * 2; i++)
            {
                if (!string.IsNullOrEmpty(tunnelUrl)) break;

                if (File.Exists(arquivoUrl))
                {
                    try
                    {
                        string lida = File.ReadAllText(arquivoUrl).Trim();
                        if (lida.StartsWith("https://") && lida.Contains("trycloudflare.com"))
                        {
                            tunnelUrl = lida;
                            break;
                        }
                    }
                    catch { }
                }

                Console.Write(".");
                Thread.Sleep(500);
            }
            Console.WriteLine();
        }

        static string ObterLinkCelular()
        {
            if (string.IsNullOrEmpty(tunnelUrl)) return "";
            if (!string.IsNullOrEmpty(apiKey))
            {
                return tunnelUrl + "?key=" + apiKey;
            }
            return tunnelUrl;
        }

        static void DesenharCabecalho()
        {
            Console.Clear();
            Console.ForegroundColor = ConsoleColor.Cyan;
            Console.WriteLine("=======================================================================");
            Console.WriteLine("       🤖 JARVIS LOCAL — CENTRAL DE COMANDO & ACESSO REMOTO");
            Console.WriteLine("=======================================================================");
            Console.ResetColor();
        }

        static void ExibirStatus()
        {
            DesenharCabecalho();

            bool online = IsPortaEmUso(3000);
            Console.Write("  [SISTEMA]     ");
            if (online)
            {
                Console.ForegroundColor = ConsoleColor.Green;
                Console.WriteLine("ONLINE 🟢 (Porta 3000 ativa)");
            }
            else
            {
                Console.ForegroundColor = ConsoleColor.Red;
                Console.WriteLine("OFFLINE 🔴");
            }
            Console.ResetColor();

            Console.ForegroundColor = ConsoleColor.White;
            Console.WriteLine("  [LOCAL PC]    http://localhost:3000");
            Console.ResetColor();

            string linkRemoto = ObterLinkCelular();
            Console.Write("  [GALAXY S23]  ");
            if (!string.IsNullOrEmpty(linkRemoto))
            {
                Console.ForegroundColor = ConsoleColor.Cyan;
                Console.WriteLine(linkRemoto);
                Console.ResetColor();
                Console.ForegroundColor = ConsoleColor.DarkGray;
                Console.WriteLine("                ↳ Acesso seguro de qualquer distância (4G/5G/Wi-Fi)");
                Console.ResetColor();
            }
            else
            {
                Console.ForegroundColor = ConsoleColor.Yellow;
                Console.WriteLine("Iniciando túnel remoto...");
                Console.ResetColor();
            }

            Console.ForegroundColor = ConsoleColor.DarkCyan;
            Console.WriteLine("  [ECOSSISTEMA] Dell G15 5525 • Samsung Crystal 55\" • Galaxy S23 • WhatsApp");
            Console.ResetColor();

            Console.ForegroundColor = ConsoleColor.Cyan;
            Console.WriteLine("=======================================================================");
            Console.ResetColor();
            Console.WriteLine("  [1] Abrir Painel no Navegador do PC");
            Console.WriteLine("  [2] Copiar Link Remoto do Celular para a Área de Transferência");
            Console.WriteLine("  [3] Criar Atalho Oficial na Área de Trabalho");
            Console.WriteLine("  [4] Minimizar para Segundo Plano (Silencioso)");
            Console.WriteLine("  [5] Encerrar o Jarvis e Desligar Tudo");
            Console.WriteLine("  [R] Atualizar Status na Tela");
            Console.ForegroundColor = ConsoleColor.Cyan;
            Console.WriteLine("=======================================================================");
            Console.ResetColor();
            Console.Write("  Escolha uma opção: ");
        }

        static void LoopMenu()
        {
            while (true)
            {
                ExibirStatus();
                ConsoleKeyInfo tecla = Console.ReadKey();
                Console.WriteLine();

                switch (tecla.KeyChar)
                {
                    case '1':
                        try
                        {
                            Process.Start(new ProcessStartInfo("http://localhost:3000") { UseShellExecute = true });
                        }
                        catch { }
                        break;

                    case '2':
                        string link = ObterLinkCelular();
                        if (!string.IsNullOrEmpty(link))
                        {
                            try
                            {
                                Clipboard.SetText(link);
                                Console.ForegroundColor = ConsoleColor.Green;
                                Console.WriteLine("\n[✅] Link copiado para a Área de Transferência!");
                                Console.ResetColor();
                                Thread.Sleep(1200);
                            }
                            catch
                            {
                                Console.WriteLine("\n[!] Link: " + link);
                                Thread.Sleep(2000);
                            }
                        }
                        else
                        {
                            Console.ForegroundColor = ConsoleColor.Yellow;
                            Console.WriteLine("\n[⚠️] Túnel remoto ainda não gerou o link.");
                            Console.ResetColor();
                            Thread.Sleep(1500);
                        }
                        break;

                    case '3':
                        CriarAtalhoDesktop();
                        Thread.Sleep(1500);
                        break;

                    case '4':
                        Console.ForegroundColor = ConsoleColor.Green;
                        Console.WriteLine("\n[ℹ️] Jarvis continuará rodando em segundo plano!");
                        Console.WriteLine("    Para reabrir o controle, execute o Jarvis.exe novamente.");
                        Console.ResetColor();
                        Thread.Sleep(2000);
                        return;

                    case '5':
                        Console.ForegroundColor = ConsoleColor.Yellow;
                        Console.WriteLine("\n[🛑] Encerrando Jarvis e túneis...");
                        Console.ResetColor();
                        PararJarvis();
                        Thread.Sleep(1000);
                        return;

                    case 'r':
                    case 'R':
                        // Apenas repete o loop para atualizar a tela
                        break;

                    default:
                        break;
                }
            }
        }

        static void CriarAtalhoDesktop()
        {
            try
            {
                string desktop = Environment.GetFolderPath(Environment.SpecialFolder.Desktop);
                string shortcutPath = Path.Combine(desktop, "JARVIS.lnk");
                string exePath = Path.Combine(appDir, "Jarvis.exe");
                string iconPath = Path.Combine(appDir, "jarvis.ico");

                Type shellType = Type.GetTypeFromProgID("WScript.Shell");
                dynamic shell = Activator.CreateInstance(shellType);
                dynamic shortcut = shell.CreateShortcut(shortcutPath);

                shortcut.TargetPath = exePath;
                shortcut.WorkingDirectory = appDir;
                shortcut.Description = "Central de Automação & Acesso Remoto JARVIS";
                if (File.Exists(iconPath))
                {
                    shortcut.IconLocation = iconPath + ",0";
                }
                shortcut.Save();

                Console.ForegroundColor = ConsoleColor.Green;
                Console.WriteLine("\n[✅] Atalho criado na Área de Trabalho com sucesso!");
                Console.WriteLine("    Local: " + shortcutPath);
                Console.ResetColor();
            }
            catch (Exception ex)
            {
                Console.ForegroundColor = ConsoleColor.Red;
                Console.WriteLine("\n[❌] Falha ao criar atalho na Área de Trabalho: " + ex.Message);
                Console.ResetColor();
            }
        }

        static void PararJarvis()
        {
            try
            {
                // Matar processo gravado em jarvis.pid
                string pidFile = Path.Combine(appDir, "jarvis.pid");
                if (File.Exists(pidFile))
                {
                    string pidStr = File.ReadAllText(pidFile).Trim();
                    int pid;
                    if (int.TryParse(pidStr, out pid))
                    {
                        try
                        {
                            Process p = Process.GetProcessById(pid);
                            if (p != null) p.Kill();
                        }
                        catch { }
                    }
                    try { File.Delete(pidFile); } catch { }
                }

                if (nodeProcess != null && !nodeProcess.HasExited)
                {
                    try { nodeProcess.Kill(); } catch { }
                }

                // Matar cloudflared se houver
                foreach (Process p in Process.GetProcessesByName("cloudflared"))
                {
                    try { p.Kill(); } catch { }
                }

                // Limpar tunnel_url.txt
                try
                {
                    string arq = Path.Combine(appDir, "public", "tunnel_url.txt");
                    if (File.Exists(arq)) File.Delete(arq);
                }
                catch { }
            }
            catch { }
        }
    }
}
