// -STATE-
let current ='0';  // what's currently on the screen
let prev = '';    // previous operand
let operator = null; // pending operator (op)
let fresh = false;   // next digit starts fresh.
let hasResult = false;

const mainEl  = document.getElementById('main');
const exprEl  = document.getElementById('expr');
const dots    = [document.getElementById('dot1'), document.getElementById('dot2'), document.getElementById('dot3')];
 
// ── DISPLAY ──
function updateDisplay(animate = false) {
  exprEl.textContent = prev && operator ? `${prev} ${operator}` : '';
  mainEl.textContent = formatNum(current);
  mainEl.classList.toggle('result', hasResult);
  mainEl.classList.toggle('error', current === 'Error');
 
  // Size the font based on length
  const len = current.replace(/[^0-9.]/g,'').length;
  mainEl.style.fontSize = len > 12 ? '24px' : len > 9 ? '32px' : len > 7 ? '38px' : '44px';
 
  if (animate) {
    mainEl.classList.remove('pop');
    void mainEl.offsetWidth; // reflow
    mainEl.classList.add('pop');
  }
 
  // Animate mode dots based on operator
  const opIdx = {'+':0, '−':1, '×':2, '÷':3};
  dots.forEach((d,i) => d.classList.toggle('active', !operator ? i === 0 : (opIdx[operator]??0) === i));
}
 
function formatNum(val) {
  if (val === 'Error') return 'Error';
  const n = parseFloat(val);
  if (isNaN(n)) return val;
  // Handle large/small numbers
  if (Math.abs(n) >= 1e12 || (Math.abs(n) < 1e-7 && n !== 0)) {
    return n.toExponential(4);
  }
  // Format with commas on integer part
  const parts = val.split('.');
  parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  return parts.join('.');
}
 
// ── LOGIC ──
function inputDigit(d) {
  if (current === 'Error') { clear(); return; }
  if (fresh || current === '0') {
    current = d; fresh = false;
  } else {
    if (current.replace('-','').length >= 14) return;
    current += d;
  }
  hasResult = false;
  updateDisplay(true);
}
 
function inputDecimal() {
  if (current === 'Error') { clear(); return; }
  if (fresh) { current = '0.'; fresh = false; return updateDisplay(); }
  if (!current.includes('.')) current += '.';
  updateDisplay();
}
 
function inputOp(op) {
  if (current === 'Error') return;
  if (prev && operator && !fresh) calculate(true);
  prev = current;
  operator = op;
  fresh = true;
  hasResult = false;
  updateDisplay();
}
 
function calculate(chain = false) {
  if (!operator || prev === '') return;
  const a = parseFloat(prev.replace(/,/g,''));
  const b = parseFloat(current.replace(/,/g,''));
  let result;
  switch (operator) {
    case '+': result = a + b; break;
    case '−': result = a - b; break;
    case '×': result = a * b; break;
    case '÷': result = b === 0 ? 'Error' : a / b; break;
  }
  if (result === 'Error') {
    current = 'Error'; prev = ''; operator = null; fresh = false;
  } else {
    // Clean floating point: trim to 10 sig figs
    const str = parseFloat(result.toPrecision(10)).toString();
    current = str;
    if (!chain) { prev = ''; operator = null; hasResult = true; }
    fresh = true;
  }
  updateDisplay(true);
}
 
function clear() {
  current = '0'; prev = ''; operator = null; fresh = false; hasResult = false;
  updateDisplay();
}
 
function backspace() {
  if (fresh || hasResult || current === 'Error') { clear(); return; }
  current = current.length > 1 ? current.slice(0,-1) : '0';
  updateDisplay();
}
 
function toggleSign() {
  if (current === '0' || current === 'Error') return;
  current = current.startsWith('-') ? current.slice(1) : '-' + current;
  updateDisplay();
}
 
function percent() {
  const n = parseFloat(current);
  if (isNaN(n)) return;
  current = (n / 100).toString();
  updateDisplay();
}
 
// ── BUTTON EVENTS ──
document.getElementById('keypad').addEventListener('click', e => {
  const btn = e.target.closest('.btn');
  if (!btn) return;
 
  // Ripple position
  const rect = btn.getBoundingClientRect();
  btn.style.setProperty('--rx', ((e.clientX - rect.left) / rect.width * 100) + '%');
  btn.style.setProperty('--ry', ((e.clientY - rect.top)  / rect.height * 100) + '%');
 
  // Flash pressed
  btn.classList.add('pressed');
  setTimeout(() => btn.classList.remove('pressed'), 120);
 
  const { action, value, op } = btn.dataset;
  if (action === 'digit')   inputDigit(value);
  if (action === 'decimal') inputDecimal();
  if (action === 'op')      inputOp(op);
  if (action === 'equals')  calculate();
  if (action === 'clear')   clear();
  if (action === 'sign')    toggleSign();
  if (action === 'percent') percent();
});
 
// ── KEYBOARD ──
const keyMap = {
  '0':'digit:0','1':'digit:1','2':'digit:2','3':'digit:3','4':'digit:4',
  '5':'digit:5','6':'digit:6','7':'digit:7','8':'digit:8','9':'digit:9',
  '.':'decimal',',':'decimal',
  '+':'op:+','-':'op:−','*':'op:×','/':'op:÷','x':'op:×',
  'Enter':'equals','=':'equals',
  'Backspace':'backspace','Delete':'clear','Escape':'clear',
  '%':'percent'
};
 
document.addEventListener('keydown', e => {
  const mapped = keyMap[e.key];
  if (!mapped) return;
  e.preventDefault();
 
  const [action, val] = mapped.split(':');
  if (action === 'digit')    inputDigit(val);
  else if (action === 'decimal') inputDecimal();
  else if (action === 'op')  inputOp(val);
  else if (action === 'equals')   calculate();
  else if (action === 'clear')    clear();
  else if (action === 'backspace') backspace();
  else if (action === 'percent')  percent();
 
  // Visually flash the matching button
  const selector = {
    digit: `[data-value="${val}"]`,
    decimal: '[data-action="decimal"]',
    op: `[data-op="${val}"]`,
    equals: '[data-action="equals"]',
    clear: '[data-action="clear"]',
    backspace: '[data-action="clear"]',
    percent: '[data-action="percent"]',
  }[action];
  if (selector) {
    const btn = document.querySelector(selector);
    if (btn) {
      btn.classList.add('pressed');
      setTimeout(() => btn.classList.remove('pressed'), 120);
    }
  }
});
 
// ── INIT ──
updateDisplay();