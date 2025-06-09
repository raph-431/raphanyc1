export default /* glsl */ `
#define NUM_GALAXIES 100
#define PI 3.141592
uniform sampler2D uTexture;
uniform float uThreshold;
uniform float uIntensity;
uniform float uNebulaIntensity;
uniform float uBlurSize;
uniform float uSeed;
varying vec2 vUv;
uniform vec2 uGalaxyPositions[NUM_GALAXIES];
uniform vec2 uGalaxySizes[NUM_GALAXIES];      // width, height
uniform float uGalaxyRotations[NUM_GALAXIES]; // radians
uniform int uTextureType;
uniform float uTime;

// float hash(vec2 p) {
//   p += uSeed; // simple but effective offset
//   return fract(sin(dot(p, vec2(127.1 + uSeed, 311.7 - uSeed))) * (43758.5453 + uSeed));
// }

float hash(vec2 p) {
vec2 p2 = p*13.37 + uSeed*0.31;
  vec3 p3 = fract(vec3(p2.xyx) * 0.1031);
  p3 += dot(p3, p3.yzx + 33.33);
  return fract((p3.x + p3.y) * p3.z);
}

float noise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);

  float a = hash(i);
  float b = hash(i + vec2(1.0, 0.0));
  float c = hash(i + vec2(0.0, 1.0));
  float d = hash(i + vec2(1.0, 1.0));

  return mix(mix(a, b, u.x), mix(c, d, u.x), u.y);
}

float fbm(vec2 p) {
  float value = 0.0;
  float amplitude = 0.5;
  for (int i = 0; i < 5; i++) {
    value += amplitude * noise(p);
    p *= 2.0;
    amplitude *= 0.5;
  }
  return value;
}

// float fbm(vec2 p) {
// vec2 jitter = vec2(
//   sin(p.y * 1000.0 + uSeed),
//   cos(p.x * 1000.0 - uSeed)
// ) * 0.001;

// vec2 rp = p + jitter;
//   float value = 0.0;
//   float amplitude = 0.5;
//   mat2 rot = mat2(0.8, 0.6, -0.6, 0.8);
//   for (int i = 0; i < 5; i++) {
//     value += amplitude * noise(rp);
//     p = rot * p * 2.0 + uSeed * 0.1; // seed-based decorrelation
//     amplitude *= 0.5;
//   }
//   return value / 0.96875;
// }

vec2 uvToLonLat(vec2 uv) {
  float lon = (uv.x - 0.5) * 2.0 * PI; // -PI to +PI
  float lat = (uv.y - 0.5) * PI;       // -PI/2 to +PI/2
  return vec2(lon, lat);
}

float sphericalDistance(vec2 lonLatA, vec2 lonLatB) {
  float sinLat1 = sin(lonLatA.y);
  float cosLat1 = cos(lonLatA.y);
  float sinLat2 = sin(lonLatB.y);
  float cosLat2 = cos(lonLatB.y);
  float deltaLon = lonLatA.x - lonLatB.x;

  float cosDeltaLon = cos(deltaLon);

  float angle = acos(
    sinLat1 * sinLat2 + cosLat1 * cosLat2 * cosDeltaLon
  );

  return angle; // in radians
}

vec3 gradientA(float t) {
  // Emission: red to purple
  return mix(vec3(0.3, 0.0, 0.1), vec3(0.8, 0.2, 1.0), t);
}

vec3 gradientB(float t) {
  // Reflection: teal to cyan
  return mix(vec3(0.0, 0.1, 0.2), vec3(0.2, 0.9, 1.0), t);
}

vec3 gradientC(float t) {
  // Planetary: golden to pink
  return mix(vec3(1.0, 0.8, 0.2), vec3(1.0, 0.4, 0.6), t);
}
vec3 getNebulaColor(float n, int type) {
  if (type == 0) return gradientA(n);
  if (type == 1) return gradientB(n);
  return gradientC(n);
}
vec3 nebulaColor(vec2 uv, vec2 center, float time, int type) {
  vec2 p = uv * 6.0 - center;
  float n = fbm(p + time * 0.02);
  float d = distance(uv, center);
  if (uTextureType == 1) {
  p = uv*6.0-center;
  n = fbm(p + time * 0.02);
  vec2 fragLonLat = uvToLonLat(uv);
  vec2 centerLonLat = uvToLonLat(center);
  d = 0.5*sphericalDistance(fragLonLat, centerLonLat);
  }
  float falloff = smoothstep(0.4, 0.002, d);

  vec3 color = getNebulaColor(n, type);
  return color * falloff * n;
}

// galaxies
float ellipticalFalloff(vec2 uv, vec2 center, vec2 radius, float rotation) {
  vec2 offset = uv - center;

  // rotate the offset
  float s = sin(rotation);
  float c = cos(rotation);
  offset = vec2(
    c * offset.x - s * offset.y,
    s * offset.x + c * offset.y
  );

  vec2 scaled = offset / radius;
  float d = dot(scaled, scaled); // elliptical distance
  return exp(-d * 8.0); // tweak falloff strength
}

vec3 galaxyColor(float falloff, float twist) {
  // simulate spiral hints with sin modulation
  float ring = sin(twist * 30.0) * 0.2 + 0.8;
  vec3 base = mix(vec3(0.6, 0.7, 1.0), vec3(1.0, 0.8, 0.9), falloff);
  return base * falloff * ring;
}

// dark nebulae
float darkNebulaMask(vec2 uv, vec2 center, float seed) {
  vec2 p = (uv - center) * 2.; // zoom in
  p += vec2(cos(seed), sin(seed)) * 20.0; // offset by seed
  // p += vec2(cos( seed), sin( seed)); // slight drift

  float n = fbm(p);
  float edge = smoothstep(0.70, 0.80, n); // sharp threshold

  // optional soft rim:
  // float softness = smoothstep(0.72, 0.75, n) - edge;

  return edge ;//+ softness * 0.1; // mostly dark with a soft outline
}

// main

void main() {
vec2 uv = vUv;
if (uTextureType >0) {
uv.x = mod(uv.x + 0.25, 1.0);
 }
// shift in case of VR texture

  vec4 original = texture2D(uTexture, uv);
  vec4 sum = vec4(0.0);
//  float resolution = 1024.0;
  // sample in a small blur radius
  for (int x = -2; x <= 2; x++) {
    for (int y = -2; y <= 2; y++) {
      vec2 offset = vec2(float(x), float(y)) * uBlurSize;
        vec4 tex = texture2D(uTexture, uv + offset);
      // float brightness = max(max(tex.r, tex.g), 0.0); // ignore tex.b
      float brightness = (tex.r + tex.g + tex.b) / 3.0;
      if (brightness > uThreshold) {
        sum += tex;
      }
    }
  }

  vec4 bloom = sum * uIntensity / 25.0; // average the 5x5 samples
  gl_FragColor = original+ bloom;
  // vec2 p = vec2(hash(vec2(0.5)), hash(vec2(0.2)));
  // vec3 nebula = nebulaColor(uv, p, 0.15);
  float intensity = 0.1+0.3*hash(vec2(0.5));
  for (int i = 0; i < 10; i++) {
    vec2 p = vec2(hash(vec2(float(i))), hash(vec2(float(i+1))));
    int types = int(3.0*hash(vec2(float(i+20))));
    vec3 nebula = nebulaColor(uv, p, hash(vec2(float(i+10))), types);
    gl_FragColor += uNebulaIntensity*vec4(nebula, 1.0); // additive blend
  }

  vec3 galaxy = vec3(0.0);

for (int i = 0; i < NUM_GALAXIES; i++) {
    vec2 center = uGalaxyPositions[i];
    vec2 radius = uGalaxySizes[i];
    float angle = uGalaxyRotations[i];
    if (center.x>-1.0) {
    float f = ellipticalFalloff(uv, center, radius, angle);
      galaxy += galaxyColor(f, distance(uv, center));
    }
  }


gl_FragColor += vec4(galaxy, 1.0);

float mask = darkNebulaMask(uv, vec2(0.5, 0.6), uSeed);

gl_FragColor *= 1.0 - mask * .7;
if (uTextureType == 0) {
  gl_FragColor *= 2.0*(1.0-uv.x)*uv.x;
  } else
   {
  gl_FragColor *= 1.0*pow(uv.y*(1.0-uv.y),0.5);
  gl_FragColor *= 2.0*(1.0-uv.x)*uv.x;
}

if (uTime>0.01) {
float ripple = sin(10.*distance(uv, vec2(0.5))-uTime*100.)*uTime;
gl_FragColor += ripple*vec4(0.2,0.4,1.0,1.0);
}
// gl_FragColor = original; // isolate one noise layer
}
`;