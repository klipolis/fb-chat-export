export function createDetailsPanel(titleText) {
  const panel = document.createElement('details');
  panel.style.cssText =
    'position: fixed; top: 10px; left: 50%; transform: translateX(-50%); z-index: 99999; background: #fff; border: 1px solid #ddd; border-radius: 0 0 10px 10px; font-family: sans-serif; font-size: 13px; box-shadow: 0 2px 10px rgba(0,0,0,0.12); min-width: 420px; max-width: calc(100% - 40px);';
  panel.open = true;

  const summary = document.createElement('summary');
  summary.style.cssText =
    'cursor: pointer; padding: 6px 10px; font-size: 12px; color: #555; background: #fafafa; display: flex; align-items: center; gap: 6px; user-select: none;';

  const arrow = document.createElement('span');
  arrow.textContent = '▲';
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
  wrap.style.cssText = 'display: flex; align-items: center; gap: 6px;';

  const inputId = `lbl-${labelText.replace(/\s+/g, '-').toLowerCase()}-${Math.random().toString(36).slice(2, 7)}`;

  const label = document.createElement('label');
  label.textContent = labelText;
  label.htmlFor = inputId;
  label.style.cssText = 'color: #777; font-size: 12px; width: 32px;';

  const input = document.createElement('input');
  input.type = 'text';
  input.id = inputId;
  input.placeholder = placeholder;
  input.value = value;
  input.style.cssText =
    'border: 1px solid #ccc; border-radius: 4px; padding: 4px 8px; font-size: 12px; width: 100px; outline: none;';

  wrap.appendChild(label);
  wrap.appendChild(input);
  return { wrap, input };
}

export function createCheckboxToggle(labelText) {
  const wrap = document.createElement('label');
  wrap.style.cssText =
    'display: flex; align-items: center; gap: 6px; color: #555; font-size: 12px; cursor: pointer;';

  const input = document.createElement('input');
  input.type = 'checkbox';
  input.checked = false;
  input.style.cssText = 'cursor: pointer;';

  const text = document.createElement('span');
  text.textContent = labelText;

  wrap.appendChild(input);
  wrap.appendChild(text);
  return { wrap, input };
}

export function createCheckboxToggleWithInput(labelText, selfValue, otherValue) {
  const wrap = document.createElement('div');
  wrap.style.cssText =
    'display: flex; align-items: center; gap: 4px; color: #555; font-size: 12px;';

  const checkboxLabel = document.createElement('label');
  checkboxLabel.style.cssText =
    'display: flex; align-items: center; gap: 6px; cursor: pointer;';

  const input = document.createElement('input');
  input.type = 'checkbox';
  input.checked = false;
  input.style.cssText = 'cursor: pointer;';

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
    el.style.cssText =
      'border: 1px solid #ccc; border-radius: 4px; padding: 4px 6px; font-size: 12px; width: 72px; outline: none;';
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
  wrap.style.cssText = 'display: flex; flex-direction: column; gap: 6px;';

  const header = document.createElement('div');
  header.style.cssText = 'display: flex; align-items: center; gap: 6px; color: #555; font-size: 12px;';

  const checkbox = document.createElement('input');
  checkbox.type = 'checkbox';
  checkbox.checked = false;
  checkbox.style.cssText = 'cursor: pointer;';

  const label = document.createElement('span');
  label.textContent = 'Alias';

  header.appendChild(checkbox);
  header.appendChild(label);

  const rows = document.createElement('div');
  rows.style.cssText = 'display: flex; flex-direction: column; gap: 4px; padding-left: 22px;';

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
    input.style.cssText =
      'border: 1px solid #ccc; border-radius: 4px; padding: 4px 6px; font-size: 12px; width: 100px; outline: none;';
    return input;
  };

  const validateName = (name) => {
    const cleaned = String(name || '').trim();
    if (!cleaned) return false;
    const parts = cleaned.split(/\s+/);
    if (parts.length > 2) return false;
    return parts.every((part) => /^[A-Za-z][A-Za-z.'-]*$/.test(part));
  };

  const createRow = (orig, alias, fixed) => {
    const row = document.createElement('div');
    row.style.cssText = 'display: flex; align-items: center; gap: 4px;';
    row.className = 'alias-row';

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
        error.textContent = 'Names must be 1-2 words, letters only, dot/apostrophe/hyphen allowed.';
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

  wrap.appendChild(header);
  wrap.appendChild(rows);
  wrap.appendChild(addButton);

  return { wrap, input: checkbox, getAliasMap, validateAll };
}

export function createLinkAction(labelText, onClick) {
  const link = document.createElement('a');
  link.href = '#';
  link.textContent = labelText;
  link.style.cssText =
    'color: #0084ff; text-decoration: underline; font-size: 12px; cursor: pointer;';
  link.addEventListener('click', (event) => {
    event.preventDefault();
    onClick(event);
  });
  return link;
}

export function createButton(labelText, backgroundColor) {
  const button = document.createElement('button');
  button.textContent = labelText;
  button.style.cssText =
    `color: #fff; border: none; padding: 6px 12px; border-radius: 5px; font-size: 12px; cursor: pointer; background: ${backgroundColor};`;
  return button;
}
