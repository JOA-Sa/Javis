param(
    [ValidateSet("listar", "definir")]
    [string]$Acao = "listar",
    [string]$Nome = ""
)

Add-Type -TypeDefinition @'
using System;
using System.Runtime.InteropServices;
using System.Collections.Generic;

[Guid("D666063F-1587-4E43-81F1-B948E807363F"), InterfaceType(ComInterfaceType.InterfaceIsIUnknown)]
internal interface IMMDevice {
    int Activate(ref Guid id, int clsCtx, IntPtr activationParams, [MarshalAs(UnmanagedType.IUnknown)] out object interfacePointer);
    int OpenPropertyStore(int stgmAccess, out IPropertyStore properties);
    int GetId([MarshalAs(UnmanagedType.LPWStr)] out string id);
    int GetState(out int state);
}

[Guid("0BD7A1BE-7A1A-44DB-8397-CC5392387B5E"), InterfaceType(ComInterfaceType.InterfaceIsIUnknown)]
internal interface IMMDeviceCollection {
    int GetCount(out int count);
    int Item(int deviceNumber, out IMMDevice device);
}

[Guid("A95664D2-9614-4F35-A746-DE8DB63617E6"), InterfaceType(ComInterfaceType.InterfaceIsIUnknown)]
internal interface IMMDeviceEnumerator {
    int EnumAudioEndpoints(int dataFlow, int stateMask, out IMMDeviceCollection devices);
    int GetDefaultAudioEndpoint(int dataFlow, int role, out IMMDevice endpoint);
    int GetDevice(string id, out IMMDevice endpoint);
    int RegisterEndpointNotificationCallback(IntPtr client);
    int UnregisterEndpointNotificationCallback(IntPtr client);
}

[Guid("886d8eeb-8cf2-4446-8d02-cdba1dbdcf99"), InterfaceType(ComInterfaceType.InterfaceIsIUnknown)]
internal interface IPropertyStore {
    int GetCount(out int count);
    int GetAt(int propertyIndex, out PropertyKey key);
    int GetValue(ref PropertyKey key, out PropVariant value);
    int SetValue(ref PropertyKey key, ref PropVariant value);
    int Commit();
}

[StructLayout(LayoutKind.Sequential)]
internal struct PropertyKey {
    public Guid fmtid;
    public int pid;
}

[StructLayout(LayoutKind.Explicit)]
internal struct PropVariant {
    [FieldOffset(0)] public short vt;
    [FieldOffset(8)] public IntPtr pwszVal;
}

[ComImport, Guid("BCDE0395-E52F-467C-8E3D-C4579291692E")]
internal class MMDeviceEnumeratorComObject { }

[Guid("f8679f50-850a-4129-9076-d60f8709638d"), InterfaceType(ComInterfaceType.InterfaceIsIUnknown)]
internal interface IPolicyConfig {
    int GetMixFormat(string pszDeviceName, IntPtr ppFormat);
    int GetDeviceFormat(string pszDeviceName, int bDefault, IntPtr ppFormat);
    int ResetDeviceFormat(string pszDeviceName);
    int SetDeviceFormat(string pszDeviceName, IntPtr pEndpointFormat, IntPtr pMixFormat);
    int GetProcessingPeriod(string pszDeviceName, int bDefault, IntPtr pmftDefaultPeriod, IntPtr pmftMinimumPeriod);
    int SetProcessingPeriod(string pszDeviceName, IntPtr pmftPeriod);
    int GetShareMode(string pszDeviceName, IntPtr pModeConfig);
    int SetShareMode(string pszDeviceName, IntPtr pModeConfig);
    int GetPropertyValue(string pszDeviceName, ref PropertyKey pKey, out PropVariant pv);
    int SetPropertyValue(string pszDeviceName, ref PropertyKey pKey, ref PropVariant pv);
    int SetDefaultEndpoint(string pszDeviceName, int role);
    int SetEndpointVisibility(string pszDeviceName, int bVisible);
}

[ComImport, Guid("870af99c-171d-4f9e-af0d-e63df40c2bc9")]
internal class PolicyConfigComObject { }

public class AudioDeviceHelper {
    private static readonly PropertyKey PKEY_Device_FriendlyName = new PropertyKey {
        fmtid = new Guid("a45c254e-df1c-4efd-8020-67d146a850e0"),
        pid = 14
    };

    public class DeviceInfo {
        public string Id { get; set; }
        public string Name { get; set; }
        public bool IsDefault { get; set; }
    }

    public static List<DeviceInfo> ListDevices() {
        List<DeviceInfo> list = new List<DeviceInfo>();
        IMMDeviceEnumerator enumerator = (IMMDeviceEnumerator)(new MMDeviceEnumeratorComObject());

        string defaultId = "";
        try {
            IMMDevice defDev = null;
            enumerator.GetDefaultAudioEndpoint(0, 0, out defDev);
            if (defDev != null) {
                defDev.GetId(out defaultId);
            }
        } catch {}

        IMMDeviceCollection col = null;
        enumerator.EnumAudioEndpoints(0, 1, out col);
        int count = 0;
        col.GetCount(out count);

        for (int i = 0; i < count; i++) {
            IMMDevice dev = null;
            col.Item(i, out dev);
            string id = "";
            dev.GetId(out id);
            IPropertyStore store = null;
            dev.OpenPropertyStore(0, out store);
            PropertyKey key = PKEY_Device_FriendlyName;
            PropVariant val;
            store.GetValue(ref key, out val);
            string name = Marshal.PtrToStringUni(val.pwszVal);
            if (string.IsNullOrEmpty(name)) name = "Desconhecido";

            DeviceInfo item = new DeviceInfo();
            item.Id = id;
            item.Name = name;
            item.IsDefault = (id == defaultId);
            list.Add(item);
        }
        return list;
    }

    public static bool SetDefault(string match) {
        List<DeviceInfo> devices = ListDevices();
        string targetId = null;
        foreach (DeviceInfo d in devices) {
            if (d.Name.IndexOf(match, StringComparison.OrdinalIgnoreCase) >= 0) {
                targetId = d.Id;
                break;
            }
        }
        if (targetId == null) return false;

        IPolicyConfig policy = (IPolicyConfig)(new PolicyConfigComObject());
        policy.SetDefaultEndpoint(targetId, 0);
        policy.SetDefaultEndpoint(targetId, 1);
        policy.SetDefaultEndpoint(targetId, 2);
        return true;
    }
}
'@

if ($Acao -eq "listar") {
    $devs = [AudioDeviceHelper]::ListDevices()
    $devs | ConvertTo-Json -Compress
} elseif ($Acao -eq "definir") {
    if (-not $Nome) {
        Write-Error "Informe o nome ou parte do nome do dispositivo de audio."
        exit 1
    }
    $ok = [AudioDeviceHelper]::SetDefault($Nome)
    if ($ok) {
        Write-Output "Dispositivo de audio alterado para '$Nome' com sucesso."
    } else {
        Write-Error "Nenhum dispositivo de audio encontrado contendo '$Nome'."
        exit 1
    }
}
