

export default /* glsl */ `
varying vec3 vColor;
varying float vBrightness;

void main() {
        float strength = length(gl_PointCoord-0.5);
        // strength = 0.5001-strength;
        strength = 1.0* (0.1/strength - 0.2); //pow(strength, 2.0);
        if (strength > 1.0) {
            strength = 1.0;
        }
        strength *= vBrightness;
        
        //
        // gl_FragColor = vec4(strength*vColor,strength);
        gl_FragColor = vec4(vColor,strength);


        #include <colorspace_fragment>
        }
        `;
