export default /* glsl */ `

uniform float uSize; // same for all points = uniform
uniform float uTime; // same for all points = uniform
// attribute float aScale; // different for each point = attribute
// attribute vec3 aRandomness; // different for each point = attribute
uniform vec3 uColor;
uniform float uResolution;
varying float vBrightness;
varying vec3 vColor;
attribute float index; // index of the point

void main() {
        vec4 modelPosition = modelMatrix * vec4(position, 1.0);
 
       
        vec4 viewPosition = viewMatrix * modelPosition;
        vec4 projectedPosition = projectionMatrix * viewPosition;
        gl_Position = projectedPosition;

        // attenuation, formula copied from points.glsl.js of three.js
        gl_PointSize = uSize*(1.0/ -viewPosition.z)*uResolution/600.0;
        // gl_PointSize *= 1.2;

        float brightness = (sin((0.5+cos(index))*5.*uTime + 10.0*index) + 1.0);
         gl_PointSize *= brightness;
        // pass color & brightnessto fragment shader
        vColor = uColor; // uniform passed to frag as varying
        vBrightness = brightness;
        }
`;
