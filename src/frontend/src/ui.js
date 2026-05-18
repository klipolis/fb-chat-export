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

  const label = document.createElement('span');
  label.textContent = labelText;
  label.style.cssText = 'color: #777; font-size: 12px; width: 32px;';

  const input = document.createElement('input');
  input.type = 'text';
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

export function createCheckboxToggleWithInput(labelText, inputValue) {
  const wrap = document.createElement('div');
  wrap.style.cssText =
    'display: flex; align-items: center; gap: 6px; color: #555; font-size: 12px;';

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

  const textInput = document.createElement('input');
  textInput.type = 'text';
  textInput.value = inputValue;
  textInput.placeholder = inputValue;
  textInput.setAttribute('aria-label', `${labelText} replacement name`);
  textInput.style.cssText =
    'border: 1px solid #ccc; border-radius: 4px; padding: 4px 8px; font-size: 12px; width: 110px; outline: none;';

  wrap.appendChild(checkboxLabel);
  wrap.appendChild(textInput);
  return { wrap, input, textInput };
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
