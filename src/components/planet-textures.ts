import { clamp, mulberry32 } from '../lib/utils';

interface CraterPalette {
  floor0: string;
  floor1: string;
  rim: string;
}

type Random = () => number;

function createSurface(width: number, height: number): { canvas: HTMLCanvasElement; context: CanvasRenderingContext2D } {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext('2d');
  if (!context) throw new Error('A 2D canvas context is required to build the planetary relief map.');
  return { canvas, context };
}

function blob(context: CanvasRenderingContext2D, x: number, y: number, radius: number, color: string, alpha: number): void {
  const gradient = context.createRadialGradient(x, y, 0, x, y, radius);
  gradient.addColorStop(0, color.replace('ALPHA', String(alpha)));
  gradient.addColorStop(.55, color.replace('ALPHA', String(alpha * .55)));
  gradient.addColorStop(1, color.replace('ALPHA', '0'));
  context.fillStyle = gradient;
  context.beginPath();
  context.arc(x, y, radius, 0, Math.PI * 2);
  context.fill();
}

function drawCrater(context: CanvasRenderingContext2D, width: number, height: number, longitude: number, latitude: number, angularRadius: number, palette: CraterPalette): void {
  const latitudeCompression = Math.max(.14, Math.cos(latitude * Math.PI / 180));
  const centerX = ((longitude + 180) / 360) * width;
  const centerY = ((90 - latitude) / 180) * height;
  const radiusX = (angularRadius / latitudeCompression / 360) * width;
  const radiusY = (angularRadius / 180) * height;
  if (radiusX < .6 || radiusY < .6) return;
  [0, -width, width].forEach((offsetX) => {
    const x = centerX + offsetX;
    if (x + radiusX < -40 || x - radiusX > width + 40) return;
    context.save();
    context.translate(x, centerY);
    context.scale(1, radiusY / radiusX);
    let gradient = context.createRadialGradient(0, 0, radiusX * .05, 0, 0, radiusX);
    gradient.addColorStop(0, palette.floor0);
    gradient.addColorStop(.62, palette.floor1);
    gradient.addColorStop(1, 'rgba(0,0,0,0)');
    context.fillStyle = gradient;
    context.beginPath();
    context.arc(0, 0, radiusX, 0, Math.PI * 2);
    context.fill();
    context.rotate(-.7);
    gradient = context.createRadialGradient(radiusX * .12, 0, radiusX * .55, radiusX * .12, 0, radiusX * 1.06);
    gradient.addColorStop(0, 'rgba(0,0,0,0)');
    gradient.addColorStop(.72, palette.rim);
    gradient.addColorStop(1, 'rgba(0,0,0,0)');
    context.fillStyle = gradient;
    context.beginPath();
    context.arc(0, 0, radiusX * 1.06, 0, Math.PI * 2);
    context.fill();
    context.restore();
  });
}

function makeRays(context: CanvasRenderingContext2D, width: number, height: number, longitude: number, latitude: number, angularRadius: number, color: string, random: Random): void {
  const centerX = ((longitude + 180) / 360) * width;
  const centerY = ((90 - latitude) / 180) * height;
  context.save();
  context.strokeStyle = color;
  context.lineWidth = Math.max(1, width / 900);
  for (let index = 0; index < 26; index += 1) {
    const angle = random() * Math.PI * 2;
    const length = (1.6 + random() * 5.2) * angularRadius;
    const x1 = centerX + Math.cos(angle) * angularRadius * .55 * width / 360 * 3;
    const y1 = centerY + Math.sin(angle) * angularRadius * .55 * height / 180 * 3;
    const x2 = centerX + Math.cos(angle) * length * width / 360;
    const y2 = centerY + Math.sin(angle) * length * height / 180;
    context.globalAlpha = .08 + random() * .34;
    context.beginPath();
    context.moveTo(x1, y1);
    context.lineTo(x2, y2);
    context.stroke();
  }
  context.restore();
}

function grainPass(context: CanvasRenderingContext2D, width: number, height: number, amount: number, random: Random): void {
  const image = context.getImageData(0, 0, width, height);
  const data = image.data;
  for (let index = 0; index < data.length; index += 4) {
    const noise = (random() * 2 - 1) * amount;
    data[index] = clamp(data[index] + noise, 0, 255);
    data[index + 1] = clamp(data[index + 1] + noise, 0, 255);
    data[index + 2] = clamp(data[index + 2] + noise, 0, 255);
  }
  context.putImageData(image, 0, 0);
}

export function toBump(source: HTMLCanvasElement): HTMLCanvasElement {
  const { canvas, context } = createSurface(source.width, source.height);
  context.drawImage(source, 0, 0);
  const image = context.getImageData(0, 0, canvas.width, canvas.height);
  const data = image.data;
  for (let index = 0; index < data.length; index += 4) {
    const luminance = data[index] * .299 + data[index + 1] * .587 + data[index + 2] * .114;
    const value = clamp(128 + (luminance - 128) * 1.5, 0, 255);
    data[index] = value;
    data[index + 1] = value;
    data[index + 2] = value;
  }
  context.putImageData(image, 0, 0);
  return canvas;
}

export function generateMoon(width: number, height: number): HTMLCanvasElement {
  const { canvas, context } = createSurface(width, height);
  const random = mulberry32(20260419);
  context.fillStyle = '#9a968d';
  context.fillRect(0, 0, width, height);
  for (let index = 0; index < 220; index += 1) {
    const longitude = (random() * 2 - 1) * 180;
    const latitude = (random() * 2 - 1) * 80;
    blob(context, ((longitude + 180) / 360) * width, ((90 - latitude) / 180) * height, (8 + random() * 70) * width / 1600, random() > .5 ? 'rgba(190,186,178,ALPHA)' : 'rgba(96,93,88,ALPHA)', .10 + random() * .14);
  }
  const maria: ReadonlyArray<readonly [number, number, number]> = [[-57, 18, 52], [-15, 35, 26], [-19, 22, 20], [18, 28, 17], [31, 10, 15], [58, -6, 15], [35, -16, 10], [62, 17, 9], [-17, -21, 12], [38, -25, 10], [-3, 56, 26], [-45, -3, 20], [25, 20, 10], [50, 32, 10], [-70, -40, 16], [-25, -8, 14]];
  maria.forEach(([longitude, latitude, radius]) => {
    const x = ((longitude + 180) / 360) * width;
    const y = ((90 - latitude) / 180) * height;
    const scaledRadius = radius * width / 360 * 1.15;
    blob(context, x, y, scaledRadius, 'rgba(56,57,64,ALPHA)', .72);
    blob(context, x + scaledRadius * .2, y - scaledRadius * .15, scaledRadius * .6, 'rgba(44,45,52,ALPHA)', .5);
  });
  context.save();
  context.globalAlpha = .16;
  context.strokeStyle = '#2b2c33';
  context.lineWidth = Math.max(1, width / 1200);
  for (let index = 0; index < 120; index += 1) {
    const mare = maria[Math.floor(random() * maria.length)];
    if (!mare) continue;
    const baseX = ((mare[0] + 180) / 360) * width;
    const baseY = ((90 - mare[1]) / 180) * height;
    context.beginPath();
    let pointX = baseX + (random() - .5) * mare[2] * width / 360 * 2;
    let pointY = baseY + (random() - .5) * mare[2] * height / 180 * 2;
    context.moveTo(pointX, pointY);
    for (let segment = 0; segment < 4; segment += 1) { pointX += (random() - .5) * 40; pointY += (random() - .5) * 14; context.lineTo(pointX, pointY); }
    context.stroke();
  }
  context.restore();
  context.save();
  context.globalAlpha = .1;
  context.fillStyle = '#cfcac0';
  context.fillRect(0, 0, width * .16, height);
  context.fillRect(width * .84, 0, width * .16, height);
  context.restore();
  const palette: CraterPalette = { floor0: 'rgba(72,70,66,.42)', floor1: 'rgba(120,116,109,.16)', rim: 'rgba(226,221,210,.55)' };
  for (let index = 0; index < 1150; index += 1) {
    const latitude = Math.asin(random() * 2 - 1) * 180 / Math.PI;
    const longitude = (random() * 2 - 1) * 180;
    let radius = .35 + Math.pow(random(), 3.1) * 9.5;
    if (random() < .006) radius = 9 + Math.pow(random(), 1.4) * 16;
    drawCrater(context, width, height, longitude, latitude, radius, palette);
  }
  const bright: ReadonlyArray<readonly [number, number, number]> = [[-11.2, -21.6, 10], [-19.7, 7, 9], [-20.3, -15.4, 6], [26.1, 18.2, 5]];
  bright.forEach(([longitude, latitude, radius]) => {
    makeRays(context, width, height, longitude, latitude, radius, '#f0ece2', random);
    drawCrater(context, width, height, longitude, latitude, radius, { floor0: 'rgba(210,205,196,.5)', floor1: 'rgba(150,146,138,.2)', rim: 'rgba(246,242,233,.85)' });
  });
  blob(context, width * .5, height * .94, width * .34, 'rgba(70,68,72,ALPHA)', .3);
  grainPass(context, width, height, 7, random);
  return canvas;
}

export function generateMars(width: number, height: number): HTMLCanvasElement {
  const { canvas, context } = createSurface(width, height);
  const random = mulberry32(77123);
  const gradient = context.createLinearGradient(0, 0, 0, height);
  gradient.addColorStop(0, '#c07a52');
  gradient.addColorStop(.34, '#b06a45');
  gradient.addColorStop(.52, '#96502f');
  gradient.addColorStop(1, '#7d3f26');
  context.fillStyle = gradient;
  context.fillRect(0, 0, width, height);
  const features: ReadonlyArray<readonly [number, number, number, string, number]> = [[69, 8, 26, 'rgba(58,36,26,ALPHA)', .55], [-58, -6, 20, 'rgba(66,40,28,ALPHA)', .45], [30, -24, 22, 'rgba(72,44,30,ALPHA)', .4], [-110, 2, 34, 'rgba(206,150,112,ALPHA)', .42], [-104, -6, 26, 'rgba(198,142,104,ALPHA)', .34], [70, -42, 26, 'rgba(214,178,148,ALPHA)', .45], [-30, -30, 20, 'rgba(60,38,26,ALPHA)', .35], [160, -46, 22, 'rgba(64,40,28,ALPHA)', .35], [-45, 45, 26, 'rgba(200,150,118,ALPHA)', .3], [-150, -30, 18, 'rgba(70,42,28,ALPHA)', .3], [20, -8, 20, 'rgba(58,36,24,ALPHA)', .3], [140, 20, 24, 'rgba(190,138,100,ALPHA)', .28]];
  features.forEach(([longitude, latitude, radius, color, alpha]) => blob(context, ((longitude + 180) / 360) * width, ((90 - latitude) / 180) * height, radius * width / 360 * 1.2, color, alpha));
  context.save();
  context.globalAlpha = .55;
  context.strokeStyle = '#5a3220';
  context.lineWidth = Math.max(3, width / 340);
  context.lineCap = 'round';
  context.beginPath();
  context.moveTo((90 / 360) * width, (102 / 180) * height);
  context.bezierCurveTo((110 / 360) * width, (104 / 180) * height, (130 / 360) * width, (103 / 180) * height, (150 / 360) * width, (99 / 180) * height);
  context.stroke();
  context.restore();
  const largeCraters: ReadonlyArray<readonly [number, number, number]> = [[-133.8, 18.7, 7], [-112, 1.5, 10], [-113.5, -2.8, 9], [-104.5, -8.4, 8], [-110, -1, 4]];
  largeCraters.forEach(([longitude, latitude, radius]) => {
    blob(context, ((longitude + 180) / 360) * width, ((90 - latitude) / 180) * height, radius * width / 360 * 2.4, 'rgba(200,150,116,ALPHA)', .4);
    drawCrater(context, width, height, longitude, latitude, radius, { floor0: 'rgba(60,34,22,.55)', floor1: 'rgba(120,74,50,.2)', rim: 'rgba(226,186,150,.6)' });
  });
  drawCrater(context, width, height, 70, -42, 20, { floor0: 'rgba(214,186,160,.5)', floor1: 'rgba(180,140,112,.2)', rim: 'rgba(226,200,178,.5)' });
  const palette: CraterPalette = { floor0: 'rgba(70,40,26,.45)', floor1: 'rgba(140,90,62,.18)', rim: 'rgba(224,186,152,.55)' };
  for (let index = 0; index < 1000; index += 1) {
    const latitude = Math.asin(random() * 2 - 1) * 180 / Math.PI;
    const longitude = (random() * 2 - 1) * 180;
    if (random() > (latitude < 0 ? 1 : .34)) continue;
    let radius = .4 + Math.pow(random(), 3) * 7;
    if (random() < .005) radius = 7 + Math.pow(random(), 1.3) * 13;
    drawCrater(context, width, height, longitude, latitude, radius, palette);
  }
  const rays: ReadonlyArray<readonly [number, number, number]> = [[-207, 10, 5], [-126, 16, 4.5], [-58, -42, 4]];
  rays.forEach(([longitude, latitude, radius]) => makeRays(context, width, height, longitude, latitude, radius, '#f2dcc4', random));
  const polarCap = (y: number, capHeight: number, alpha: number): void => {
    context.save();
    const capGradient = context.createLinearGradient(0, y, 0, y + capHeight);
    capGradient.addColorStop(0, `rgba(246,246,250,${alpha})`);
    capGradient.addColorStop(1, 'rgba(246,246,250,0)');
    context.fillStyle = capGradient;
    context.fillRect(0, y, width, capHeight);
    context.restore();
  };
  polarCap(0, height * .075, .92);
  polarCap(height * .925, height * .075, .92);
  context.save();
  context.fillStyle = 'rgba(240,242,248,.65)';
  for (let index = 0; index < 220; index += 1) {
    const top = random() > .5;
    const x = random() * width;
    const y = top ? height * .07 + random() * height * .05 : height * .90 - random() * height * .05;
    context.beginPath();
    context.arc(x, y, 2 + random() * 9, 0, Math.PI * 2);
    context.fill();
  }
  context.restore();
  context.save();
  context.globalAlpha = .13;
  context.strokeStyle = '#d8a878';
  for (let index = 0; index < 90; index += 1) {
    const x = random() * width;
    const y = random() * height;
    context.lineWidth = 1 + random() * 4;
    context.beginPath();
    context.moveTo(x, y);
    context.lineTo(x + 30 + random() * 90, y + (random() - .5) * 12);
    context.stroke();
  }
  context.restore();
  grainPass(context, width, height, 8, random);
  return canvas;
}
