'use strict';

const one = (selector) => document.querySelector(selector);
const icon = (name) => '<svg class="ico" viewBox="0 0 24 24" aria-hidden="true"><use href="#i-' + name + '"/></svg>';
const backLink = (hash, label) => '<a class="back" href="#' + hash + '">' + icon('back') + label + '</a>';
const levelLabels = {urgent:'Get help before driving', soon:'Call the shop promptly', home:'Check while parked', plan:'Plan a shop visit'};
let activeResult = null;
let pumpTarget = 31;
let readyToMeasure = false;

function progress(step) {
  return '<div class="toolsteps" aria-label="Step ' + step + ' of 3">' +
    [1, 2, 3].map(n => '<i class="' + (n <= step ? 'on' : '') + '"></i>').join('') +
    '<span>Step ' + step + ' of 3</span></div>';
}

function choice(url, title, symbol, color) {
  const mark = symbol ? '<span class="iconbox ' + color + '">' + icon(symbol) + '</span>' : '';
  return '<a class="rowchoice" href="#' + url + '">' + mark + title + '<span class="right">' + icon('right') + '</span></a>';
}

function showChecker(category, option) {
  const container = one('#checker');
  const c = Object.hasOwn(concerns, category) ? concerns[category] : null;
  activeResult = null;
  document.body.classList.remove('checkprint');
  if (!c) {
    const choices = Object.entries(concerns).map(([id, item]) => choice('check/' + id, item.title, item.icon, item.color));
    container.innerHTML = '<div class="toolbox">' + progress(1) + '<h2>What did you notice?</h2><p class="choosehint">Pick the most serious sign first. A flat, fast leak, visible damage, or hard wobble needs help before you drive.</p><div class="choicegrid">' + choices.join('') + '</div></div>';
    return;
  }
  const selected = c.options.find(([id]) => id === option);
  if (!selected) {
    const choices = c.options.map(([id, label]) => choice('check/' + category + '/' + id, label));
    container.innerHTML = '<div class="toolbox">' + backLink('check','All concerns') + progress(2) + '<h2>' + c.question + '</h2><div class="rowlist">' + choices.join('') + '</div></div>';
    return;
  }
  activeResult = results[selected[2]];
  const r = activeResult;
  const [sourceName, sourceURL] = tireSources[r.source];
  const next = r.level === 'urgent' ? ['roadside','Roadside help'] :
    category === 'buy' ? ['buying','Open the buying guide'] : category === 'wear' ? ['tread','See the tread check'] : ['pressure','See the pressure check'];
  const cornerOptions = ['Not sure','Front left','Front right','Rear left','Rear right','More than one tire'];
  container.innerHTML = '<article class="decision ' + r.level + '">' + backLink('check/' + category,'Change my answer') + progress(3) +
    '<div class="actionlabel">' + levelLabels[r.level] + '</div><h2>' + r.title + '</h2><p>' + r.action + '</p><p>' + r.follow +
    '</p><h3>What to say on the call</h3><blockquote class="script" id="shopscript"></blockquote>' +
    '<details class="noteform"><summary>Add details to my note</summary><div><div class="formgrid"><label>Which tire?<select id="corner">' +
    cornerOptions.map(s => '<option>' + s + '</option>').join('') +
    '</select></label><label>When or where I noticed it<input id="timing" placeholder="e.g., on the way home yesterday" maxlength="160"></label></div></div></details>' +
    '<div class="actions"><button type="button" class="btn primary" data-action="copy">' + icon('copy') + ' Copy call note</button><button type="button" class="btn outline" data-action="print">' +
    icon('print') + ' Print note</button></div><p id="copystatus" role="status" class="copy-status"></p>' +
    '<p class="toolfooter"><a href="#' + next[0] + '">' + next[1] + '</a> &nbsp;·&nbsp; <a href="#check">Check another concern</a></p><a class="notesource" href="' + sourceURL + '">' + sourceName + '</a></article>';
  document.body.classList.add('checkprint');
  updateCallNote();
}

function updateCallNote() {
  if (!activeResult || !one('#shopscript')) return;
  const corner = one('#corner').value;
  const timing = one('#timing').value.trim();
  const location = corner === 'Not sure' ? '' : ' Tire location: ' + corner + '.';
  one('#shopscript').textContent = activeResult.script + location + (timing ? ' I noticed it ' + timing + '.' : '');
  one('#copystatus').textContent = '';
}

async function copyNote() {
  const box = one('#shopscript');
  if (!box) return;
  const note = box.textContent;
  const noteStatus = one('#copystatus');
  try {
    if (!navigator.clipboard) throw new Error('Clipboard unavailable');
    await navigator.clipboard.writeText(note);
    noteStatus.textContent = 'Call note copied.';
  } catch {
    const selection = window.getSelection();
    const range = document.createRange();
    range.selectNodeContents(box);
    selection.removeAllRanges();
    selection.addRange(range);
    noteStatus.textContent = 'The note is selected. Use your device’s Copy command.';
  }
}

const pumpSteps = [
  {label:'Practice car A · parked overnight', front:33, rear:35, max:51, question:'You’re filling the rear tire. Which target do you use?', choices:['33 psi','35 psi','51 psi'], answer:1, good:'Yes. The Rear row on the door label gives 35 psi for this example car.', misses:['33 psi is the front target. Look at the Rear row.','','51 psi is the tire’s maximum. Look at the Rear row on the door label.']},
  {label:'Practice car A · cold rear tire', front:33, rear:35, max:51, question:'The gauge reads 31 psi. The tire is sound. What will you do at the pump?', choices:['Add 35 psi','Set the target to 35 psi, fill, then recheck','Release 4 psi'], answer:1, good:'Right. The target is the final reading. A second gauge reading confirms it. Put the cap back on.', misses:['35 psi is the final target. This tire already has air in it.','','31 is below 35. Releasing air would lower it further.']},
  {label:'Practice car A · after highway driving', front:33, rear:35, max:51, question:'It was correct when cold. After the drive it reads 38 psi at the rear. What now?', choices:['Bleed air to 35 psi','Leave it and recheck cold'], answer:1, good:'Correct. Driving warmed the tire. Take the next reading after the car has sat for at least three hours.', misses:['Let the tire cool before using the cold target. Bleeding it now can leave it low later.','']},
  {label:'Practice car B · different door label', front:35, rear:32, max:44, question:'You borrow a different car. It sat overnight. What goes into the pump for its rear tire?', choices:['44 psi','35 psi','32 psi'], answer:2, good:'You found this car’s rear target. Now open your own driver’s door and write down both cold targets.', misses:['44 psi is the tire’s maximum. Check the vehicle label.','35 psi belongs to the front tires on this car.','']}
];
const wearSteps = [
  {label:'One tire · three main grooves', readings:['Inner · 6/32','Center · 5/32','Outer · 2/32'], question:'What should you do about this tire?', choices:['Use the average','Arrange replacement'], answer:1, good:'Yes. The outer groove is down to 2/32 inch. The deeper grooves cannot make up for it.', misses:['An average hides the worn spot. Check the shallowest groove.','']},
  {label:'Another tire · an outward sidewall bubble', readings:['Inner · 7/32','Center · 7/32','Outer · 7/32'], question:'The tread is deep, but you see a bubble sticking out. What now?', choices:['Drive to the shop','Keep it parked and arrange help'], answer:1, good:'Yes. The outward bulge is a separate danger. Arrange help before moving the vehicle.', misses:['Driving on a tire with a bulge risks a sudden failure. Arrange help where the car is.','']}
];
const lessonState = {pump:{index:0, done:false}, wear:{index:0, done:false}};
function renderPractice(kind, focus = false) {
  const isPump = kind === 'pump';
  const state = lessonState[kind];
  const steps = isPump ? pumpSteps : wearSteps;
  const s = steps[state.index];
  const box = one(isPump ? '#pump' : '#wearquiz');
  let readings;
  if (isPump) {
    const labels = state.index === 3 ? [['Rear',s.rear],['Front',s.front]] : [['Front',s.front],['Rear',s.rear]];
    readings = labels.map(([a,b])=>'<div><small>' + a + ' · door label</small><b>' + b + ' psi</b></div>').join('') +
      '<div class="sideval"><small>Tire maximum</small><b>' + s.max + ' psi</b></div>';
  } else {
    readings = s.readings.map(v=>{const [where,value]=v.split(' · ');return '<div><small>' + where + '</small><b>' + value + ' in</b></div>';}).join('');
  }
  box.innerHTML = '<div class="progress">Case ' + (state.index+1) + ' of ' + steps.length + '</div><div class="examplelabel"><span class="labeltitle">' + s.label +
    '</span>' + readings + '</div><p class="practice-question" tabindex="-1">' + s.question + '</p><div>' +
    s.choices.map((v,i)=>'<button type="button" data-practice="' + kind + '" data-index="' + i + '" aria-pressed="false">' + v + '</button>').join('') +
    '</div><div class="feedback" role="status"></div><div class="nextstep"></div>';
  if (isPump && state.index === 1) {
    pumpTarget = 31;
    readyToMeasure = false;
    const question = box.querySelector('.practice-question');
    question.textContent = 'Your gauge reads 31 psi on the cold rear tire. Set this practice pump to the door-label target.';
    question.nextElementSibling.innerHTML =
      '<div class="pump-console"><div class="pump-setting"><button class="adjust" data-action="less" aria-label="Lower pump target by 1 psi">−</button>' +
      '<div><small>PUMP TARGET</small><output id="target-display" aria-live="polite">31 psi</output></div>' +
      '<button class="adjust" data-action="more" aria-label="Raise pump target by 1 psi">+</button></div>' +
      '<button class="btn primary" data-action="fill">Fill to this target</button></div>';
  }
  if (focus) box.querySelector('.practice-question').focus();
}

function chooseAnswer(btn) {
  const kind = btn.dataset.practice;
  const state = lessonState[kind];
  const steps = kind === 'pump' ? pumpSteps : wearSteps;
  const s = steps[state.index];
  const i = Number(btn.dataset.index);
  const box = one(kind === 'pump' ? '#pump' : '#wearquiz');
  box.querySelectorAll('[data-practice]').forEach(b=>b.setAttribute('aria-pressed',String(b===btn)));
  state.done = i === s.answer;
  box.querySelector('.feedback').textContent = state.done ? s.good : s.misses[i];
  const last = state.index === steps.length-1;
  box.querySelector('.nextstep').innerHTML = state.done ? '<button class="btn outline" data-next="' + kind + '">' + (last ? 'Practice again' : 'Next case') + ' ' + icon('arrow') + '</button>' + (last && kind==='pump'?' <a class="btn outline" href="#car-card">Make my car card</a>':'') : '';
}

// Common passenger-tire ratings in pounds per tire. Source: Pirelli load-index table.
const loadLbs = [992,1019,1047,1074,1102,1135,1168,1201,1235,1279,1323,1356,1389,1433,1477,1521,1565,1609,1653,1709,1764,1819,1874,1929,1984,2039,2094,2149,2205,2271,2337,2403,2469,2535,2601,2679,2756,2833,2910,2998,3086];
const speeds = {Q:99,R:106,S:112,T:118,U:124,H:130,V:149,W:168,Y:186};
function decodeSize(raw) {
  const v = raw.trim().toUpperCase().replace(/\s+/g,'');
  if (!v) return '';
  if (/^(LT|ST|T\d|HL)|\d{2,3}\/\d{2,3}[A-Z]$/.test(v) && !/^P?\d{3}\/\d{2}Z?R\d{2}(\d{2,3}[A-Z])?(XL)?$/.test(v)) return 'This marking needs the vehicle or tire maker’s guide. Share the full marking with your shop, especially for LT, HL, trailer, spare, or dual-load tires.';
  const m = /^P?([1-4]\d[05])\/([2-9]\d)(Z?R)([1-3]\d)(?:(\d{2,3})([A-Z]))?(XL)?$/.exec(v);
  if (!m) return 'Try the full size, like 225/65R17. You can add the load number and speed letter, as in 102H. For another format, ask the shop to read the complete marking.';
  const [,width,ratio,construction,rim,load,speed,xl] = m;
  const rows = [['Width',width + ' millimeters across the tire.'],['Sidewall height',ratio + '% of the tire’s width.'],['Construction',construction === 'ZR' ? 'ZR is a high-speed radial marking. Check the full speed symbol.' : 'R means radial.'],['Wheel size',rim + ' inches across the rim.']];
  if(load) {
    const lbs = loadLbs[Number(load)-80];
    rows.push(['Load index',load + (lbs ? ' · rated for ' + lbs.toLocaleString('en-US') + ' lb per tire under specified conditions.' : ' · ask the tire maker for the load rating.')]);
    rows.push(['Speed symbol',speed + (speeds[speed] ? ' · a test rating of ' + speeds[speed] + ' mph under specified conditions.' : ' · check this symbol with the tire maker.')]);
  }
  if(xl) rows.push(['XL','Extra load. Use the pressure specified for your vehicle and tire setup.']);
  return '<dl>' + rows.map(([k,val])=>'<div><dt>' + k + '</dt><dd>' + val + '</dd></div>').join('') + '</dl><p>Use the door label for vehicle load and cold pressure. A speed rating is a test value. Follow posted speed limits and road conditions.</p>';
}
function firstSunday(year) {
  const jan1 = new Date(Date.UTC(year,0,1));
  return Date.UTC(year,0,1 + (7 - jan1.getUTCDay()) % 7);
}
function decodeDate(raw, today = new Date()) {
  const value = raw.trim();
  if (!value) return '';
  if (/^\d{3}$/.test(value)) return 'Three digits may be an old date code or part of a longer marking. Ask a shop to read the full DOT number and check the tire before using it.';
  if (!/^\d{4}$/.test(value)) return 'Use only the last four digits of the full DOT code, such as 3422. If the date faces inward, ask a shop to read it.';
  const week = Number(value.slice(0,2));
  const year = 2000 + Number(value.slice(2));
  const start = firstSunday(year) + (week-1)*7*86400000;
  if (week < 1 || week > 53 || start >= firstSunday(year+1)) return 'That week does not occur in this tire-code year. Recheck the four digits at the end of the DOT number.';
  if (start > today.getTime()) return 'That week is in the future. Recheck the date at the end of the DOT tire ID.';
  return 'Made in week ' + week + ' of ' + year + '. Check the vehicle and tire makers’ age guidance, including for your spare. This date alone cannot tell you how much use is left.';
}

const titles = {'home':'Field guide','check':'Check a tire concern','roadside':'Roadside help','pressure':'Find the right pressure','tread':'Check your tread','decoder':'Read your sidewall','buying':'Buy tires with confidence','car-card':'My glove box card','sources':'Sources & scope'};
function route(focus = false) {
  const [raw,category,option] = location.hash.slice(1).split('/');

  const anchor = raw === 'essentials';
  const id = Object.hasOwn(titles, raw) ? raw : 'home';
  document.querySelectorAll('[data-page]').forEach(p=>p.hidden=p.dataset.page!==id);
  const active = one('#' + id);
  if(id === 'check') showChecker(category,option);
  else document.body.classList.remove('checkprint');
  const selectedNav = anchor || ['pressure','tread','decoder'].includes(id) ? 'essentials' : id;
  document.querySelectorAll('[data-nav],.side a,.helpbtn').forEach(a=>{
    if ((a.dataset.nav || a.getAttribute('href').slice(1)) === selectedNav || (!a.dataset.nav && a.getAttribute('href') === '#' + id)) a.setAttribute('aria-current','page');
    else a.removeAttribute('aria-current');
  });
  document.title = titles[id] + ' · Tread Notes';
  if (anchor) {
    one('#essentials').scrollIntoView();
    if(focus){const h = one('#essentials h2'); h.tabIndex=-1; h.focus({preventScroll:true});}
  } else {
    window.scrollTo(0,0);
    if(focus) {
      const h = id === 'check' ? (one('#checker h2') || active.querySelector('h1')) : active.querySelector('h1');
      h.tabIndex=-1; h.focus({preventScroll:true});
    }
  }
}

document.addEventListener('click',e=>{
  const btn = e.target.closest('button');
  if(!btn) return;
  if(btn.dataset.practice) { chooseAnswer(btn); return; }
  if(btn.dataset.next){
    const kind=btn.dataset.next, state=lessonState[kind];
    const length=kind==='pump'?pumpSteps.length:wearSteps.length;
    if(state.done){ state.index=(state.index+1)%length; state.done=false; renderPractice(kind,true); }
    return;
  }
  switch(btn.dataset.action){
    case 'less':
    case 'more': {
      const delta = btn.dataset.action === 'more' ? 1 : -1;
      pumpTarget = Math.min(55, Math.max(20, pumpTarget + delta));
      one('#target-display').textContent = pumpTarget + ' psi';
      readyToMeasure = false;
      lessonState.pump.done = false;
      one('#pump .feedback').textContent = '';
      one('#pump .nextstep').innerHTML = '';
      break;
    }
    case 'fill': {
      const correct = pumpTarget === pumpSteps[1].rear;
      readyToMeasure = correct;
      lessonState.pump.done = false;
      one('#pump .feedback').textContent = correct
        ? 'The practice pump has stopped. Take a fresh gauge reading to check the fill.'
        : 'Pause here. Look at the Rear row on the example car’s door label. Adjust the target and try again.';
      one('#pump .nextstep').innerHTML = correct ? '<button class="btn outline" data-action="measure-air">Check with the gauge</button>' : '';
      break;
    }
    case 'measure-air': {
      if (!readyToMeasure || pumpTarget !== pumpSteps[1].rear) break;
      lessonState.pump.done = true;
      one('#pump .feedback').textContent = 'Gauge reading: ' + pumpTarget + ' psi. It matches the rear target. Replace the cap.';
      one('#pump .nextstep').innerHTML = '<button class="btn outline" data-next="pump">Next case ' + icon('arrow') + '</button>';
      one('#pump .nextstep button').focus();
      break;
    }
    case 'copy': copyNote(); break;
    case 'print': window.print(); break;
    case 'size-example': one('#sizecode').value='225/65R17 102H'; one('#sizeout').innerHTML=decodeSize(one('#sizecode').value); break;
    case 'date-example': one('#datecode').value='3422'; one('#dateout').textContent=decodeDate(one('#datecode').value); break;
  }
});
document.addEventListener('input',e=>{
  if(e.target.id==='sizecode') one('#sizeout').innerHTML=decodeSize(e.target.value);
  if(e.target.id==='datecode') one('#dateout').textContent=decodeDate(e.target.value);
  if(e.target.id==='timing' || e.target.id==='corner') updateCallNote();
});
one('.skip').addEventListener('click',event=>{
  event.preventDefault();
  one('#main').focus();
});
one('#vehiclecard').addEventListener('submit',e=>e.preventDefault());
window.addEventListener('beforeprint',()=>{
  one('#vehiclecard').querySelectorAll('input').forEach(input=>{
    let field = input.nextElementSibling;
    if(!field){
      field = document.createElement('span');
      field.className = 'onlyprint printfield';
      input.after(field);
    }
    field.textContent = input.value || ' ';
  });
});
window.addEventListener('hashchange',()=>route(true));
one('.fallback').open = false;
renderPractice('pump');
renderPractice('wear');
route();

