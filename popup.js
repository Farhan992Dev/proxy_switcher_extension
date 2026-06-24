const proxyAddrInput = document.getElementById('proxyAddr');
const proxyProtocolSelect = document.getElementById('proxyProtocol');
const rulePatternInput = document.getElementById('rulePattern');
const ruleTypeSelect = document.getElementById('ruleType');
const addRuleBtn = document.getElementById('addRule');
const ruleListEl = document.getElementById('ruleList');
const toggleEl = document.getElementById('toggleProxy');
const statusEl = document.getElementById('status');

let rules = [];
let enabled = true;

async function loadState() {
  const data = await chrome.storage.local.get(null);
  proxyAddrInput.value = data.proxyAddress || '';
  proxyProtocolSelect.value = data.proxyProtocol || 'http';
  rules = data.proxyRules || [];
  enabled = data.enabled !== false;
  renderRules();
  updateStatus();
  updateToggle();
}

function renderRules() {
  ruleListEl.innerHTML = '';
  rules.forEach((rule, i) => {
    const div = document.createElement('div');
    div.className = 'rule-item';
    div.innerHTML =
      '<span class="pattern">' + escapeHtml(rule.pattern) + '</span>' +
      '<span class="type-tag ' + (rule.type === 'proxy' ? 'type-proxy' : 'type-direct') + '">' + rule.type + '</span>' +
      '<button class="btn-remove" data-index="' + i + '">&times;</button>';
    ruleListEl.appendChild(div);
  });

  ruleListEl.querySelectorAll('.btn-remove').forEach(btn => {
    btn.addEventListener('click', async () => {
      rules.splice(parseInt(btn.dataset.index), 1);
      await chrome.storage.local.set({ proxyRules: rules });
      renderRules();
    });
  });
}

function updateStatus() {
  if (!enabled || !proxyAddrInput.value) {
    statusEl.textContent = 'Proxy disabled';
    statusEl.className = 'status off';
  } else {
    statusEl.textContent = 'Proxy ON \u2014 ' + proxyAddrInput.value;
    statusEl.className = 'status on';
  }
}

function updateToggle() {
  toggleEl.className = enabled ? 'toggle active' : 'toggle';
}

function escapeHtml(str) {
  var div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

proxyAddrInput.addEventListener('input', async () => {
  await chrome.storage.local.set({ proxyAddress: proxyAddrInput.value });
  updateStatus();
});

proxyProtocolSelect.addEventListener('change', async () => {
  await chrome.storage.local.set({ proxyProtocol: proxyProtocolSelect.value });
  updateStatus();
});

toggleEl.addEventListener('click', async () => {
  enabled = !enabled;
  await chrome.storage.local.set({ enabled: enabled });
  updateToggle();
  updateStatus();
});

addRuleBtn.addEventListener('click', async () => {
  var pattern = rulePatternInput.value.trim();
  if (!pattern) return;
  rules.push({ pattern: pattern, type: ruleTypeSelect.value });
  await chrome.storage.local.set({ proxyRules: rules });
  rulePatternInput.value = '';
  renderRules();
});

rulePatternInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') addRuleBtn.click();
});

loadState();
