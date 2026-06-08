export function createDetailsPanel(titleText) {
  const panel = document.createElement('details');
  panel.style.cssText =
    'position: fixed; top: 10px; left: 50%; transform: translateX(-50%); z-index: 99999; background: #fff; border: 1px solid #ddd; border-radius: 0 0 10px 10px; font-family: sans-serif; font-size: 13px; box-shadow: 0 2px 10px rgba(0,0,0,0.12); min-width: 420px; max-width: calc(100% - 40px); max-height: calc(100vh - 20px); overflow-y: auto;';
  panel.open = true;

  const summary = document.createElement('summary');
  summary.className = 'pe-hdr';
  summary.style.cssText = 'cursor:pointer;display:flex;align-items:center;gap:6px;user-select:none;';

  const arrow = document.createElement('span');
  arrow.textContent = '▲';
  arrow.setAttribute('aria-hidden', 'true');
  arrow.style.cssText = 'font-size: 10px; color: #aaa;';

  const title = document.createElement('span');
  title.textContent = titleText;

  summary.appendChild(arrow);
  summary.appendChild(title);
  panel.appendChild(summary);

  panel.addEventListener('toggle', () => {
    arrow.textContent = panel.open ? '▲' : '▼';
  });

  return { panel, summary, arrow, title };
}

export function createLabelInput(labelText, placeholder, value) {
  const wrap = document.createElement('div');
  wrap.className = 'pe-flex-row';

  const inputId = `lbl-${labelText.replace(/\s+/g, '-').toLowerCase()}-${Math.random().toString(36).slice(2, 7)}`;

  const label = document.createElement('label');
  label.textContent = labelText;
  label.htmlFor = inputId;
  label.className = 'pe-label-dull';
  label.style.width = '32px';

  const input = document.createElement('input');
  input.type = 'text';
  input.id = inputId;
  input.placeholder = placeholder;
  input.value = value;
  input.className = 'pe-input pe-input-sm';

  wrap.appendChild(label);
  wrap.appendChild(input);
  return { wrap, input };
}

export function createCheckboxToggle(labelText) {
  const wrap = document.createElement('label');
  wrap.className = 'pe-chk-label';

  const input = document.createElement('input');
  input.type = 'checkbox';
  input.checked = false;
  input.className = 'pe-chk';

  const text = document.createElement('span');
  text.textContent = labelText;

  wrap.appendChild(input);
  wrap.appendChild(text);
  return { wrap, input };
}

export function createCheckboxToggleWithInput(labelText, selfValue, otherValue) {
  const wrap = document.createElement('div');
  wrap.className = 'pe-flex-row-4 pe-label';

  const checkboxLabel = document.createElement('label');
  checkboxLabel.className = 'pe-chk-label';

  const input = document.createElement('input');
  input.type = 'checkbox';
  input.checked = false;
  input.className = 'pe-chk';

  const text = document.createElement('span');
  text.textContent = labelText;

  checkboxLabel.appendChild(input);
  checkboxLabel.appendChild(text);

  const makeNameInput = (value, ariaLabel) => {
    const el = document.createElement('input');
    el.type = 'text';
    el.value = value;
    el.placeholder = value;
    el.setAttribute('aria-label', ariaLabel);
    el.className = 'pe-input';
    el.style.cssText = 'padding:4px 6px;width:72px;';
    return el;
  };

  const textInput = makeNameInput(selfValue, 'Your replacement name');
  const textInput2 = makeNameInput(otherValue, 'Other person replacement name');

  wrap.appendChild(checkboxLabel);
  wrap.appendChild(textInput);
  wrap.appendChild(textInput2);
  return { wrap, input, textInput, textInput2 };
}

export function createAliasRows(initialRows = { You: 'Youghurt', any: 'Alpha' }) {
  const wrap = document.createElement('div');
  wrap.className = 'pe-flex-col';

  const collisionWarning = document.createElement('div');
  collisionWarning.style.cssText = 'display: none; padding: 4px 8px; font-size: 11px; color: #b8860b; background: #fffbe6; border: 1px solid #e6d88a; border-radius: 4px;';
  collisionWarning.setAttribute('role', 'alert');
  wrap.appendChild(collisionWarning);

  const header = document.createElement('div');
  header.className = 'pe-flex-row pe-label';

  const checkbox = document.createElement('input');
  checkbox.type = 'checkbox';
  checkbox.checked = false;
  checkbox.className = 'pe-chk';

  const label = document.createElement('span');
  label.textContent = 'Alias';

  header.appendChild(checkbox);
  header.appendChild(label);

  const rows = document.createElement('div');
  rows.className = 'pe-flex-col';
  rows.style.cssText += 'gap:4px;padding-left:22px;';

  const addButton = document.createElement('button');
  addButton.type = 'button';
  addButton.textContent = 'Add';
  addButton.style.cssText =
    'border: 1px solid #ccc; border-radius: 4px; padding: 4px 8px; font-size: 12px; cursor: pointer; background: #f7f7f7;';

  const makeTextInput = (value, ariaLabel, disabled) => {
    const input = document.createElement('input');
    input.type = 'text';
    input.value = value;
    input.placeholder = value;
    input.setAttribute('aria-label', ariaLabel);
    input.disabled = Boolean(disabled);
    input.className = 'pe-input pe-input-sm';
    return input;
  };

  const validateName = (name) => {
    const cleaned = String(name || '').trim();
    if (!cleaned) return false;
    if (cleaned.length > 25) return false;
    if (/\d/.test(cleaned)) return false;
    const parts = cleaned.split(/\s+/);
    if (parts.length > 3) return false;
    return /^\p{L}[\p{L} .'\-_]{0,24}$/u.test(cleaned);
  };

  const createRow = (orig, alias, fixed) => {
    const row = document.createElement('div');
    row.className = 'pe-flex-row-4 alias-row';

    const originalInput = makeTextInput(orig, 'Original sender name', fixed);
    const aliasInput = makeTextInput(alias, 'Alias name', false);
    const error = document.createElement('span');
    error.style.cssText = 'color: red; font-size: 11px; display: none;';

    const removeBtn = document.createElement('button');
    removeBtn.type = 'button';
    removeBtn.textContent = '×';
    removeBtn.title = 'Remove alias row';
    removeBtn.style.cssText =
      'border: none; background: transparent; color: #888; font-size: 14px; cursor: pointer; padding: 0;';
    if (fixed) removeBtn.style.display = 'none';

    const validateRow = () => {
      const originalValue = originalInput.value.trim();
      const aliasValue = aliasInput.value.trim();
      const validOriginal = Boolean(originalValue && validateName(originalValue));
      const validAlias = Boolean(aliasValue && validateName(aliasValue));
      const valid = validOriginal && validAlias;
      originalInput.style.borderColor = validOriginal ? '#ccc' : 'red';
      aliasInput.style.borderColor = validAlias ? '#ccc' : 'red';
      if (!valid) {
        error.textContent = 'Names must be 1-3 words, max 25 chars, no numbers.';
        error.style.display = 'block';
      } else {
        error.style.display = 'none';
      }
      return valid;
    };

    originalInput.addEventListener('blur', validateRow);
    aliasInput.addEventListener('blur', validateRow);

    removeBtn.addEventListener('click', () => {
      row.remove();
    });

    row.appendChild(originalInput);
    row.appendChild(aliasInput);
    row.appendChild(removeBtn);
    row.appendChild(error);

    rows.appendChild(row);
    return row;
  };

  const addRow = (orig, alias, fixed) => createRow(orig, alias, fixed);

  Object.entries(initialRows).forEach(([orig, alias]) => addRow(orig, alias, true));

  addButton.addEventListener('click', () => {
    addRow('', '', false);
  });

  checkbox.addEventListener('change', () => {
    rows.style.opacity = checkbox.checked ? '1' : '0.6';
  });

  const getAliasMap = () => {
    const map = {};
    Array.from(rows.querySelectorAll('.alias-row')).forEach((row) => {
      const inputs = row.querySelectorAll('input[type="text"]');
      if (inputs.length < 2) return;
      const original = inputs[0].value.trim();
      const aliasValue = inputs[1].value.trim();
      if (!original || !aliasValue) return;
      map[original] = aliasValue;
    });
    return map;
  };

  const validateAll = () => {
    let valid = true;
    Array.from(rows.querySelectorAll('.alias-row')).forEach((row) => {
      const inputs = row.querySelectorAll('input[type="text"]');
      if (inputs.length < 2) return;
      const originalValue = inputs[0].value.trim();
      const aliasValue = inputs[1].value.trim();
      const rowValid = Boolean(originalValue && aliasValue && validateName(originalValue) && validateName(aliasValue));
      if (!rowValid) {
        valid = false;
        inputs[0].style.borderColor = originalValue && validateName(originalValue) ? '#ccc' : 'red';
        inputs[1].style.borderColor = aliasValue && validateName(aliasValue) ? '#ccc' : 'red';
      }
    });
    return valid;
  };

  const setDetectedNames = (names) => {
    const nameSet = new Set(Array.from(names).map((n) => String(n).trim()).filter(Boolean));
    const existingRows = Array.from(rows.querySelectorAll('.alias-row'));

    existingRows.forEach((row) => {
      const inputs = row.querySelectorAll('input[type="text"]');
      if (inputs.length < 2) return;
      const rowName = inputs[0].value.trim();
      const isFixed = inputs[0].disabled;
      if (!isFixed && rowName && !nameSet.has(rowName)) {
        row.remove();
      }
    });

    nameSet.forEach((name) => {
      const found = Array.from(rows.querySelectorAll('.alias-row')).some((row) => {
        const inputs = row.querySelectorAll('input[type="text"]');
        return inputs.length >= 2 && inputs[0].value.trim() === name;
      });
      if (!found) {
        addRow(name, '', false);
      }
    });
  };

  const groupChatWrap = document.createElement('label');
  groupChatWrap.className = 'pe-flex-row pe-group-label';
  groupChatWrap.style.marginTop = '4px';
  groupChatWrap.title = 'When checked, new names detected during scan are added as alias rows';
  const groupChatChk = document.createElement('input');
  groupChatChk.type = 'checkbox';
  groupChatChk.checked = false;
  groupChatChk.className = 'pe-chk';
  const groupChatLabel = document.createElement('span');
  groupChatLabel.textContent = 'Group chat';
  groupChatWrap.appendChild(groupChatChk);
  groupChatWrap.appendChild(groupChatLabel);

  const caseInsensitiveWrap = document.createElement('label');
  caseInsensitiveWrap.className = 'pe-flex-row pe-group-label';
  caseInsensitiveWrap.style.marginTop = '4px';
  caseInsensitiveWrap.title = 'Case-insensitive alias matching';
  const caseInsensitiveChk = document.createElement('input');
  caseInsensitiveChk.type = 'checkbox';
  caseInsensitiveChk.checked = false;
  caseInsensitiveChk.className = 'pe-chk';
  const ciLabel = document.createElement('span');
  ciLabel.textContent = 'A-i';
  caseInsensitiveWrap.appendChild(caseInsensitiveChk);
  caseInsensitiveWrap.appendChild(ciLabel);

  wrap.appendChild(header);
  wrap.appendChild(rows);
  wrap.appendChild(addButton);
  wrap.appendChild(groupChatWrap);
  wrap.appendChild(caseInsensitiveWrap);

  const updateYouAlias = (detectedName) => {
    const youRow = Array.from(rows.querySelectorAll('.alias-row')).find((row) => {
      const inputs = row.querySelectorAll('input[type="text"]');
      return inputs.length >= 2 && inputs[0].value.trim() === 'You';
    });
    if (youRow) {
      const inputs = youRow.querySelectorAll('input[type="text"]');
      if (inputs.length >= 2) {
        inputs[1].value = detectedName;
      }
    }
  };

  const showCollisions = (collisions) => {
    if (!collisions || collisions.length === 0) {
      collisionWarning.style.display = 'none';
      return;
    }
    collisionWarning.textContent = '⚠ Alias collision: ' + collisions.map((c) => `"${c.alias}" maps to ${c.originals}`).join('; ');
    collisionWarning.style.display = 'block';
  };

  return { wrap, input: checkbox, getAliasMap, validateAll, setDetectedNames, groupChatChk, addRow, showCollisions, caseInsensitiveChk, updateYouAlias };
}

export function createLinkAction(labelText, onClick) {
  const link = document.createElement('a');
  link.href = '#';
  link.textContent = labelText;
  link.className = 'pe-link';
  link.addEventListener('click', (event) => {
    event.preventDefault();
    onClick(event);
  });
  return link;
}

export function createButton(labelText, backgroundColor) {
  const button = document.createElement('button');
  button.textContent = labelText;
  button.className = 'pe-btn';
  button.style.background = backgroundColor;
  return button;
}
