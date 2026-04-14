const $ = (s) => document.querySelector(s);
const $$ = (s) => [...document.querySelectorAll(s)];

const state = {
  running: { projectile: false, gravity: false, pendulum: false, atom: false, reaction: false, heart: false, lungs: false, cell: false },
  score: 0,
  soundOn: true
};

const quizAnswers = {
  projectile: '45', gravity: 'escape', pendulum: 'increase', atom: 'orbitals', periodic: '18', reaction: 'faster', heart: 'left', lungs: 'down', cell: 'mitochondria'
};

window.addEventListener('load', () => {
  setTimeout(() => $('#loader').style.display = 'none', 650);
});

// Theme + sound
$('#themeToggle').addEventListener('click', () => {
  document.body.classList.toggle('light');
  $('#themeToggle').textContent = document.body.classList.contains('light') ? '☀️' : '🌙';
});
$('#soundToggle').addEventListener('click', () => {
  state.soundOn = !state.soundOn;
  $('#soundToggle').textContent = state.soundOn ? '🔊' : '🔈';
});

// smooth scroll
$$('a[href^="#"]').forEach(a => a.addEventListener('click', (e) => {
  const id = a.getAttribute('href');
  if (id.length > 1) {
    e.preventDefault();
    document.querySelector(id).scrollIntoView({ behavior: 'smooth' });
  }
}));

// reveal animation
const io = new IntersectionObserver(entries => {
  entries.forEach(e => e.isIntersecting && e.target.classList.add('active'));
}, { threshold: 0.15 });
$$('.reveal').forEach(el => io.observe(el));

function beep(freq = 420, dur = 80) {
  if (!state.soundOn) return;
  const ctx = new (window.AudioContext || window.webkitAudioContext)();
  const o = ctx.createOscillator();
  const g = ctx.createGain();
  o.frequency.value = freq;
  o.connect(g); g.connect(ctx.destination);
  g.gain.value = 0.07;
  o.start();
  setTimeout(() => { o.stop(); ctx.close(); }, dur);
}

// Particle background
(() => {
  const c = $('#particles-canvas');
  const x = c.getContext('2d');
  const particles = Array.from({ length: 80 }, () => ({ x: Math.random() * innerWidth, y: Math.random() * innerHeight, r: Math.random() * 2 + 0.8, dx: Math.random() * .7 - .35, dy: Math.random() * .7 - .35 }));
  const resize = () => { c.width = innerWidth; c.height = innerHeight; };
  window.addEventListener('resize', resize); resize();
  const tick = () => {
    x.clearRect(0, 0, c.width, c.height);
    for (const p of particles) {
      p.x += p.dx; p.y += p.dy;
      if (p.x < 0 || p.x > c.width) p.dx *= -1;
      if (p.y < 0 || p.y > c.height) p.dy *= -1;
      x.fillStyle = 'rgba(109, 203, 255, 0.7)';
      x.beginPath(); x.arc(p.x, p.y, p.r, 0, Math.PI * 2); x.fill();
    }
    requestAnimationFrame(tick);
  };
  tick();
})();

// Generic handlers
$$('[data-run]').forEach(b => b.addEventListener('click', () => { state.running[b.dataset.run] = true; beep(); }));
$$('[data-reset]').forEach(b => b.addEventListener('click', () => { state.running[b.dataset.reset] = false; resetSim(b.dataset.reset); beep(300); }));

$$('.quiz').forEach(q => {
  q.querySelectorAll('button').forEach(btn => btn.addEventListener('click', () => {
    const key = q.dataset.quiz;
    const result = q.querySelector('.quiz-result');
    if (btn.dataset.answer === quizAnswers[key]) {
      result.textContent = 'Correct! +1';
      result.style.color = '#5dffbd';
      state.score += 1;
      $('#score').textContent = state.score;
      beep(620, 100);
    } else {
      result.textContent = 'Try again';
      result.style.color = '#ff9da7';
    }
  }));
});

// Physics simulations
const projectile = (() => {
  const c = $('#projectileCanvas'), ctx = c.getContext('2d');
  let t = 0;
  const draw = () => {
    ctx.clearRect(0, 0, c.width, c.height);
    ctx.strokeStyle = '#9ab8ff'; ctx.beginPath(); ctx.moveTo(0, 160); ctx.lineTo(c.width, 160); ctx.stroke();
    if (state.running.projectile) {
      const v = +$('#velocity').value;
      const ang = +$('#angle').value * Math.PI / 180;
      const g = 9.8;
      t += 0.06;
      let x = v * Math.cos(ang) * t * 3;
      let y = 160 - (v * Math.sin(ang) * t - 0.5 * g * t * t) * 3;
      if (y >= 160 || x > c.width) { t = 0; }
      ctx.fillStyle = '#57e2ff'; ctx.beginPath(); ctx.arc(x, Math.min(y, 160), 6, 0, Math.PI * 2); ctx.fill();

      const pred = +$('#projectilePrediction').value || 0;
      const range = (v * v * Math.sin(2 * ang)) / g;
      c.title = pred ? `Predicted ${pred.toFixed(1)}m | Actual ${range.toFixed(1)}m` : `Actual range ~${range.toFixed(1)}m`;
    }
    requestAnimationFrame(draw);
  }; draw();
})();

const orbit = (() => {
  const c = $('#gravityCanvas'), ctx = c.getContext('2d');
  let a = 0;
  const draw = () => {
    ctx.clearRect(0, 0, c.width, c.height);
    const cx = c.width / 2, cy = c.height / 2;
    ctx.fillStyle = '#ffcb5b'; ctx.beginPath(); ctx.arc(cx, cy, 16, 0, Math.PI * 2); ctx.fill();
    if (state.running.gravity) a += +$('#orbitSpeed').value * 0.005;
    const px = cx + Math.cos(a) * 58, py = cy + Math.sin(a) * 58;
    ctx.strokeStyle = 'rgba(175,175,255,.4)'; ctx.beginPath(); ctx.arc(cx, cy, 58, 0, Math.PI * 2); ctx.stroke();
    ctx.fillStyle = '#58b7ff'; ctx.beginPath(); ctx.arc(px, py, 7, 0, Math.PI * 2); ctx.fill();
    requestAnimationFrame(draw);
  }; draw();
})();

const pendulum = (() => {
  const c = $('#pendulumCanvas'), ctx = c.getContext('2d');
  let t = 0;
  const draw = () => {
    ctx.clearRect(0, 0, c.width, c.height);
    const ox = c.width / 2, oy = 24;
    const L = +$('#pendulumLength').value;
    if (state.running.pendulum) t += 0.05;
    const theta = Math.sin(t) * 0.6;
    const bx = ox + Math.sin(theta) * L;
    const by = oy + Math.cos(theta) * L;
    ctx.strokeStyle = '#dbecff'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(ox, oy); ctx.lineTo(bx, by); ctx.stroke();
    ctx.fillStyle = '#9c7bff'; ctx.beginPath(); ctx.arc(bx, by, 12, 0, Math.PI * 2); ctx.fill();
    requestAnimationFrame(draw);
  }; draw();
})();

// Chemistry simulations
(() => {
  const c = $('#atomCanvas'), ctx = c.getContext('2d');
  let a = 0;
  const draw = () => {
    ctx.clearRect(0, 0, c.width, c.height);
    const cx = c.width / 2, cy = c.height / 2;
    ctx.fillStyle = '#ff729f'; ctx.beginPath(); ctx.arc(cx, cy, 13, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = 'rgba(114,206,255,.45)';
    [36, 62].forEach(r => { ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.stroke(); });
    if (state.running.atom) a += 0.03;
    [[36, 0], [36, Math.PI], [62, Math.PI / 2], [62, -Math.PI / 2]].forEach(([r, off]) => {
      ctx.fillStyle = '#5ad4ff'; ctx.beginPath(); ctx.arc(cx + Math.cos(a + off) * r, cy + Math.sin(a + off) * r, 5, 0, Math.PI * 2); ctx.fill();
    });
    requestAnimationFrame(draw);
  }; draw();
})();

(() => {
  const elements = [
    ['H', 'Hydrogen'], ['He', 'Helium'], ['Li', 'Lithium'], ['Be', 'Beryllium'], ['B', 'Boron'], ['C', 'Carbon'], ['N', 'Nitrogen'], ['O', 'Oxygen'], ['F', 'Fluorine'], ['Ne', 'Neon'],
    ['Na', 'Sodium'], ['Mg', 'Magnesium'], ['Al', 'Aluminum'], ['Si', 'Silicon'], ['P', 'Phosphorus'], ['S', 'Sulfur'], ['Cl', 'Chlorine'], ['Ar', 'Argon']
  ];
  const container = $('#periodicTable');
  elements.forEach(([sym, name], i) => {
    const d = document.createElement('button');
    d.className = 'el';
    d.textContent = sym;
    d.title = name;
    d.addEventListener('click', () => {
      $('#elementInfo').textContent = `${name} (${sym}) — Atomic number ${i + 1}.`; beep(500);
    });
    container.appendChild(d);
  });
})();

(() => {
  const c = $('#reactionCanvas'), ctx = c.getContext('2d');
  const particles = Array.from({ length: 28 }, () => ({ x: Math.random() * 330, y: Math.random() * 170, vx: Math.random() * 2, vy: Math.random() * 2 }));
  const draw = () => {
    ctx.clearRect(0, 0, c.width, c.height);
    const temp = +$('#tempControl').value * 0.2;
    for (const p of particles) {
      if (state.running.reaction) { p.x += (p.vx - 1) * temp * 1.4; p.y += (p.vy - 1) * temp * 1.4; }
      if (p.x < 4 || p.x > 336) p.vx *= -1;
      if (p.y < 4 || p.y > 176) p.vy *= -1;
      ctx.fillStyle = '#8dffd2'; ctx.beginPath(); ctx.arc(p.x, p.y, 4, 0, Math.PI * 2); ctx.fill();
    }
    requestAnimationFrame(draw);
  }; draw();
})();

// Biology
(() => {
  const c = $('#heartCanvas'), ctx = c.getContext('2d');
  let t = 0;
  const draw = () => {
    ctx.clearRect(0,0,c.width,c.height);
    if (state.running.heart) t += +$('#heartRate').value / 300;
    const pulse = 1 + Math.sin(t) * 0.08;
    ctx.save();
    ctx.translate(c.width/2, c.height/2 + 8);
    ctx.scale(58 * pulse, 58 * pulse);
    ctx.fillStyle = '#ff5c8f';
    ctx.beginPath();
    for (let i=0;i<Math.PI*2;i+=0.05){
      const x = 0.28 * 16 * Math.pow(Math.sin(i),3);
      const y = -0.28 * (13*Math.cos(i)-5*Math.cos(2*i)-2*Math.cos(3*i)-Math.cos(4*i));
      i===0 ? ctx.moveTo(x,y) : ctx.lineTo(x,y);
    }
    ctx.fill();
    ctx.restore();
    requestAnimationFrame(draw);
  }; draw();
})();

(() => {
  const c = $('#lungsCanvas'), ctx = c.getContext('2d');
  let t = 0;
  const draw = () => {
    ctx.clearRect(0,0,c.width,c.height);
    if (state.running.lungs) t += +$('#breathRate').value * 0.02;
    const scale = 1 + Math.sin(t) * 0.12;
    ctx.fillStyle = '#85c5ff';
    ctx.fillRect(c.width/2 - 4, 20, 8, 45);
    ctx.beginPath(); ctx.ellipse(c.width/2 - 40, 108, 40*scale, 54*scale, 0, 0, Math.PI*2); ctx.fill();
    ctx.beginPath(); ctx.ellipse(c.width/2 + 40, 108, 40*scale, 54*scale, 0, 0, Math.PI*2); ctx.fill();
    requestAnimationFrame(draw);
  }; draw();
})();

(() => {
  const c = $('#cellCanvas'), ctx = c.getContext('2d');
  const draw = () => {
    ctx.clearRect(0,0,c.width,c.height);
    const z = +$('#cellZoom').value / 2;
    if (state.running.cell) {
      ctx.save();
      ctx.translate(c.width/2, c.height/2);
      ctx.scale(z, z);
      ctx.fillStyle = 'rgba(130,232,255,.35)';
      ctx.beginPath(); ctx.arc(0,0,55,0,Math.PI*2); ctx.fill();
      ctx.fillStyle = '#6d72ff'; ctx.beginPath(); ctx.arc(-12,-4,15,0,Math.PI*2); ctx.fill(); // nucleus
      ctx.fillStyle = '#ffd06d';
      [[18,12], [26,-16], [-30,18]].forEach(([x,y]) => { ctx.beginPath(); ctx.ellipse(x,y,10,6,0,0,Math.PI*2); ctx.fill(); });
      ctx.restore();
    }
    requestAnimationFrame(draw);
  }; draw();
})();

function resetSim(name) {
  if (name === 'projectile') $('#projectilePrediction').value = '';
  if (name === 'gravity') $('#gravityPrediction').value = '';
  if (name === 'pendulum') $('#pendulumPrediction').value = '';
}

// Chatbot placeholder
const aiHints = {
  projectile: 'Range depends on velocity squared and sin(2θ), so 45° is optimal in ideal conditions.',
  gravity: 'Orbits balance gravity (inward) with velocity (sideways).',
  atom: 'Electrons exist in quantized energy levels, not random paths.',
  heart: 'The SA node triggers electrical impulses that coordinate contraction.'
};
$('#sendChat').addEventListener('click', () => {
  const input = $('#chatInput');
  if (!input.value.trim()) return;
  const log = $('#chatLog');
  const user = document.createElement('p');
  user.innerHTML = `<strong>You:</strong> ${input.value}`;
  log.appendChild(user);

  const key = Object.keys(aiHints).find(k => input.value.toLowerCase().includes(k));
  const reply = document.createElement('p');
  reply.innerHTML = `<strong>AI:</strong> ${key ? aiHints[key] : 'Great question! In full mode, this assistant would call an AI backend to explain the concept step-by-step.'}`;
  log.appendChild(reply);
  log.scrollTop = log.scrollHeight;
  input.value = '';
});
