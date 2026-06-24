let proxyRules = [];
let proxyAddress = '';
let proxyProtocol = 'http';
let enabled = true;

async function loadState() {
  const data = await chrome.storage.local.get(null);
  proxyAddress = data.proxyAddress || '';
  proxyRules = data.proxyRules || [];
  proxyProtocol = data.proxyProtocol || 'http';
  enabled = data.enabled !== false;
}

async function applyProxy() {
  await loadState();

  if (!enabled || !proxyAddress) {
    chrome.proxy.settings.clear({ scope: 'regular' });
    return;
  }

  const host = proxyAddress.split(':')[0];
  const port = parseInt(proxyAddress.split(':')[1]) || 8080;

  if (proxyRules.length === 0) {
    chrome.proxy.settings.set(
      {
        value: {
          mode: 'fixed_servers',
          rules: { singleProxy: { scheme: proxyProtocol, host: host, port: port } }
        },
        scope: 'regular'
      },
      () => { if (chrome.runtime.lastError) console.error(chrome.runtime.lastError.message); }
    );
    return;
  }

  const proxyValue = proxyProtocol.toUpperCase() + ' ' + host + ':' + port;
  let pac = 'function FindProxyForURL(url, host) {\n';
  pac += '  var d = "DIRECT";\n';
  pac += '  var p = "' + proxyValue + '";\n';
  pac += '  if (isPlainHostName(host)) return d;\n';
  pac += '  if (isInNet(host, "127.0.0.0", "255.0.0.0")) return d;\n';
  pac += '  if (isInNet(host, "10.0.0.0", "255.0.0.0")) return d;\n';
  pac += '  if (isInNet(host, "172.16.0.0", "255.240.0.0")) return d;\n';
  pac += '  if (isInNet(host, "192.168.0.0", "255.255.0.0")) return d;\n';
  proxyRules.forEach(rule => {
    if (rule.pattern) {
      pac += '  if (' + matchExpr(rule.pattern) + ') return ' + (rule.type === 'proxy' ? 'p' : 'd') + ';\n';
    }
  });
  pac += '  return p;\n}\n';

  chrome.proxy.settings.set(
    {
      value: { mode: 'pac_script', rules: { pacScript: { data: pac } } },
      scope: 'regular'
    },
    () => { if (chrome.runtime.lastError) console.error(chrome.runtime.lastError.message); }
  );
}

function matchExpr(pattern) {
  if (pattern.startsWith('*.')) return 'dnsDomainIs(host, "' + pattern.slice(2) + '")';
  if (pattern.includes('*')) return 'shExpMatch(host, "' + pattern + '")';
  return 'dnsDomainIs(host, "' + pattern + '")';
}

chrome.runtime.onInstalled.addListener(() => applyProxy());
chrome.runtime.onStartup.addListener(() => applyProxy());
chrome.storage.onChanged.addListener((changes, area) => {
  if (area === 'local') applyProxy();
});
