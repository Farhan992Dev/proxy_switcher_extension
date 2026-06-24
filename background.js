let proxyRules = [];
let proxyAddress = '';
let proxyProtocol = 'http';

const LOCAL_BYPASS = [
  'localhost', '127.*', '10.*', '172.16.*', '172.17.*', '172.18.*',
  '172.19.*', '172.20.*', '172.21.*', '172.22.*', '172.23.*', '172.24.*',
  '172.25.*', '172.26.*', '172.27.*', '172.28.*', '172.29.*', '172.30.*',
  '172.31.*', '192.168.*', '<local>'
];

chrome.storage.onChanged.addListener((changes) => {
  if (changes.proxyAddress) {
    proxyAddress = changes.proxyAddress.newValue;
  }
  if (changes.proxyRules) {
    proxyRules = changes.proxyRules.newValue || [];
  }
  if (changes.proxyProtocol) {
    proxyProtocol = changes.proxyProtocol.newValue || 'http';
  }
  applyProxy();
});

chrome.runtime.onInstalled.addListener(async () => {
  const data = await chrome.storage.local.get(['proxyAddress', 'proxyRules', 'proxyProtocol']);
  proxyAddress = data.proxyAddress || '';
  proxyRules = data.proxyRules || [];
  proxyProtocol = data.proxyProtocol || 'http';
  applyProxy();
});

function applyProxy() {
  if (!proxyAddress) {
    chrome.proxy.settings.clear({ scope: 'regular' });
    return;
  }

  const host = proxyAddress.split(':')[0];
  const port = parseInt(proxyAddress.split(':')[1]) || 8080;

  const bypassList = [...LOCAL_BYPASS];
  proxyRules.forEach(r => {
    if (r.type === 'direct' && r.pattern) bypassList.push(r.pattern);
  });

  const config = {
    mode: proxyRules.length > 0 ? 'pac_script' : 'fixed_servers',
    rules: {
      singleProxy: { scheme: proxyProtocol, host, port },
      bypassList
    }
  };

  if (proxyRules.length > 0) {
    const pacScript = generatePAC(host, port, proxyProtocol, proxyRules);
    config.mode = 'pac_script';
    config.rules = { pacScript: { data: pacScript } };
  }

  chrome.proxy.settings.set(
    { value: config, scope: 'regular' },
    () => {
      if (chrome.runtime.lastError) {
        console.error('Proxy error:', chrome.runtime.lastError.message);
      }
    }
  );
}

function generatePAC(host, port, protocol, rules) {
  const scheme = protocol.toUpperCase();
  const proxyStr = scheme + ' ' + host + ':' + port;

  let lines = [
    'function FindProxyForURL(url, host) {',
    '  var direct = "DIRECT";',
    '  var proxy = "' + proxyStr + '";'
  ];

  LOCAL_BYPASS.forEach(pattern => {
    if (pattern === '<local>') {
      lines.push('  if (isInNet(host, "127.0.0.0", "255.0.0.0")) return direct;');
    } else if (pattern.endsWith('.*')) {
      const prefix = pattern.slice(0, -2);
      lines.push('  if (isInNet(host, "' + prefix + '.0", "255.255.0.0")) return direct;');
    } else {
      lines.push('  if (dnsDomainIs(host, "' + pattern + '")) return direct;');
    }
  });

  const proxyRules = rules.filter(r => r.type === 'proxy' && r.pattern);
  const directRules = rules.filter(r => r.type === 'direct' && r.pattern);

  proxyRules.forEach(rule => {
    if (rule.pattern.startsWith('*.')) {
      const domain = rule.pattern.slice(2);
      lines.push('  if (dnsDomainIs(host, "' + domain + '")) return proxy;');
    } else if (rule.pattern.includes('*')) {
      lines.push('  if (shExpMatch(host, "' + rule.pattern + '")) return proxy;');
    } else {
      lines.push('  if (dnsDomainIs(host, "' + rule.pattern + '")) return proxy;');
    }
  });

  directRules.forEach(rule => {
    if (rule.pattern.startsWith('*.')) {
      const domain = rule.pattern.slice(2);
      lines.push('  if (dnsDomainIs(host, "' + domain + '")) return direct;');
    } else if (rule.pattern.includes('*')) {
      lines.push('  if (shExpMatch(host, "' + rule.pattern + '")) return direct;');
    } else {
      lines.push('  if (dnsDomainIs(host, "' + rule.pattern + '")) return direct;');
    }
  });

  lines.push('  return proxy;');
  lines.push('}');
  return lines.join('\n');
}
