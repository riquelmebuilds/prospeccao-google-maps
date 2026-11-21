/* ============================================================
   Fundo do topo — "mármore líquido" azul bem escuro desenhado
   em pontinhos (meio-tom), girando devagar. O mouse puxa de leve.

   Leve de rodar: o mármore é calculado uma vez por pontinho (numa
   textura pequena) e depois só os pontinhos são desenhados na tela
   cheia. Redesenha a 30 quadros por segundo — o movimento é lento,
   então fica igual ao olho.
   ============================================================ */
(() => {
  const canvas = document.querySelector('.hero__fundo');
  if (!canvas) return;
  const hero = canvas.parentElement;
  const gl = canvas.getContext('webgl', { antialias: false, premultipliedAlpha: false, powerPreference: 'low-power' });
  if (!gl) return; // sem WebGL fica só o preto
  // se o navegador perder o WebGL (celular fraco, GPU ocupada), o Chrome desenharia um ícone de "carinha triste":
  // esconde o canvas e fica só a cor lisa do fundo
  const esconder = () => canvas.classList.add('perdido');
  canvas.addEventListener('webglcontextlost', (e) => { e.preventDefault(); esconder(); });
  if (gl.isContextLost()) return esconder();
  const reduzir = matchMedia('(prefers-reduced-motion: reduce)').matches;

  const CELULA = 4; // tamanho de cada pontinho, em px de tela
  const FPS = 30;

  const vert = `attribute vec2 p; void main(){ gl_Position = vec4(p, 0., 1.); }`;

  // Passo 1: um pixel por pontinho → valor do mármore naquele pontinho
  const fragCampo = `
    precision highp float;
    uniform vec2 res;
    uniform float t, cel;
    uniform vec2 m;

    float hash(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
    float ruido(vec2 p){
      vec2 i = floor(p), f = fract(p);
      vec2 u = f * f * (3. - 2. * f);
      return mix(mix(hash(i), hash(i + vec2(1, 0)), u.x),
                 mix(hash(i + vec2(0, 1)), hash(i + vec2(1, 1)), u.x), u.y);
    }
    float fbm(vec2 p){
      float v = 0., a = .5;
      for (int i = 0; i < 4; i++){ v += a * ruido(p); p = p * 2.03 + vec2(1.7, 9.2); a *= .5; }
      return v;
    }
    // faixas compridas e retorcidas tipo mármore líquido (bem devagar)
    float campo(vec2 p){
      float tt = t * .45;
      p += (m - .5) * .2;
      // estica na diagonal pra as faixas ficarem longas
      p = mat2(.8, -.6, .6, .8) * p * vec2(.75, 1.25);
      vec2 q = vec2(fbm(p + vec2(0., tt * .035)), fbm(p + vec2(5.2, 1.3) - tt * .03));
      vec2 r = vec2(fbm(p + 2.2 * q + vec2(1.7, 9.2) + tt * .045), fbm(p + 2.2 * q + vec2(8.3, 2.8)));
      float f = fbm(p + 2. * r);
      // só as cristas viram faixa; o resto fica preto
      float crista = 1. - abs(sin(f * 15. + tt * .06));
      return smoothstep(.5, .97, crista);
    }

    void main(){
      vec2 centro = (floor(gl_FragCoord.xy) + .5) * cel;
      float v = campo(centro / res.y * 1.15);
      // escurece no meio pra o nome respirar
      vec2 c = (centro - res * .5) / res.y;
      v *= 1. - .3 * exp(-dot(c, c) * 5.);
      gl_FragColor = vec4(v, 0., 0., 1.);
    }`;

  // Passo 2: tela cheia, só desenha o pontinho com o raio pelo valor
  const fragPontos = `
    precision mediump float;
    uniform sampler2D campo;
    uniform vec2 grade;
    uniform float cel;
    uniform vec3 fundo, ponto;

    void main(){
      vec2 celula = floor(gl_FragCoord.xy / cel);
      vec2 centro = (celula + .5) * cel;
      float v = texture2D(campo, (celula + .5) / grade).r;
      float raio = (.14 + .64 * v) * cel;
      float d = length(gl_FragCoord.xy - centro);
      float forma = 1. - smoothstep(raio - .6, raio + .6, d);
      gl_FragColor = vec4(mix(fundo, ponto, forma * (.12 + .88 * v)), 1.);
    }`;

  function compilar(tipo, src) {
    const s = gl.createShader(tipo);
    gl.shaderSource(s, src);
    gl.compileShader(s);
    return s;
  }
  function programa(frag) {
    const p = gl.createProgram();
    gl.attachShader(p, compilar(gl.VERTEX_SHADER, vert));
    gl.attachShader(p, compilar(gl.FRAGMENT_SHADER, frag));
    gl.linkProgram(p);
    return gl.getProgramParameter(p, gl.LINK_STATUS) ? p : null;
  }
  const progCampo = programa(fragCampo);
  const progPontos = programa(fragPontos);
  if (!progCampo || !progPontos) return;

  gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  for (const p of [progCampo, progPontos]) {
    const a = gl.getAttribLocation(p, 'p');
    gl.enableVertexAttribArray(a);
    gl.vertexAttribPointer(a, 2, gl.FLOAT, false, 0, 0);
  }

  const u = {
    res: gl.getUniformLocation(progCampo, 'res'),
    t: gl.getUniformLocation(progCampo, 't'),
    celA: gl.getUniformLocation(progCampo, 'cel'),
    m: gl.getUniformLocation(progCampo, 'm'),
    grade: gl.getUniformLocation(progPontos, 'grade'),
    celB: gl.getUniformLocation(progPontos, 'cel'),
    campo: gl.getUniformLocation(progPontos, 'campo'),
    fundo: gl.getUniformLocation(progPontos, 'fundo'),
    ponto: gl.getUniformLocation(progPontos, 'ponto'),
  };

  // paleta: escuro (preto + azul bem escuro) e claro (branco-gelo + azul claro). Troca junto com o botão de tema.
  function paleta() {
    const claro = document.documentElement.getAttribute('data-tema') === 'claro';
    gl.useProgram(progPontos);
    gl.uniform3f(u.fundo, ...(claro ? [0.961, 0.961, 0.949] : [0, 0, 0]));
    gl.uniform3f(u.ponto, ...(claro ? [0.40, 0.55, 0.90] : [0.13, 0.20, 0.42]));
  }

  // textura pequena (um texel por pontinho) + framebuffer pra desenhar nela
  const tex = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, tex);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  const fb = gl.createFramebuffer();

  let cols = 1, rows = 1, cel = CELULA;
  function medir() {
    const r = hero.getBoundingClientRect();
    const dpr = Math.min(devicePixelRatio || 1, 1.5);
    canvas.width = Math.round(r.width * dpr);
    canvas.height = Math.round(r.height * dpr);
    cel = CELULA * dpr;
    cols = Math.ceil(canvas.width / cel);
    rows = Math.ceil(canvas.height / cel);

    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, cols, rows, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
    gl.bindFramebuffer(gl.FRAMEBUFFER, fb);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, tex, 0);
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);

    gl.useProgram(progCampo);
    gl.uniform2f(u.res, canvas.width, canvas.height);
    gl.uniform1f(u.celA, cel);
    gl.useProgram(progPontos);
    gl.uniform2f(u.grade, cols, rows);
    gl.uniform1f(u.celB, cel);
    gl.uniform1i(u.campo, 0);
    paleta();
  }

  const mouse = { x: 0.5, y: 0.5, ax: 0.5, ay: 0.5 };
  // o fundo não reage a mouse, toque nem rolagem: só flutua sozinho

  let visivel = true;
  new IntersectionObserver(([e]) => { visivel = e.isIntersecting; }).observe(hero);

  function desenhar(t, dt = 1 / 60) {
    // mesma suavidade do mouse independente da taxa de quadros
    const k = 1 - Math.pow(1 - 0.03, dt * 60);
    mouse.ax += (mouse.x - mouse.ax) * k;
    mouse.ay += (mouse.y - mouse.ay) * k;

    // passo 1: mármore na textura pequena
    gl.bindFramebuffer(gl.FRAMEBUFFER, fb);
    gl.viewport(0, 0, cols, rows);
    gl.useProgram(progCampo);
    gl.uniform1f(u.t, t);
    gl.uniform2f(u.m, mouse.ax, mouse.ay);
    gl.drawArrays(gl.TRIANGLES, 0, 3);

    // passo 2: pontinhos na tela
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.useProgram(progPontos);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
  }

  const inicio = performance.now();
  let ultimo = 0;
  function quadro(agora) {
    requestAnimationFrame(quadro);
    if (!visivel || agora - ultimo < 1000 / FPS - 2) return;
    const dt = ultimo ? (agora - ultimo) / 1000 : 1 / FPS;
    ultimo = agora;
    desenhar((agora - inicio) / 1000 + 20, dt);
  }

  medir();
  new MutationObserver(() => { paleta(); if (reduzir) desenhar(20); }).observe(document.documentElement, { attributes: true, attributeFilter: ['data-tema'] });
  // a barra do navegador do celular aparece e some ao rolar e dispara 'resize' só na altura: ignora, senão o fundo "pula"
  let larguraAtual = innerWidth;
  addEventListener('resize', () => {
    if (innerWidth === larguraAtual) return;
    larguraAtual = innerWidth;
    medir(); if (reduzir) desenhar(20);
  });
  if (reduzir) desenhar(20);
  else requestAnimationFrame(quadro);
})();
