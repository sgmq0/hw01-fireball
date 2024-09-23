#version 300 es

//This is a vertex shader. While it is called a "shader" due to outdated conventions, this file
//is used to apply matrix transformations to the arrays of vertex data passed to it.
//Since this code is run on your GPU, each vertex is transformed simultaneously.
//If it were run on your CPU, each vertex would have to be processed in a FOR loop, one at a time.
//This simultaneous transformation allows your program to run much faster, especially when rendering
//geometry with millions of vertices.

uniform mat4 u_Model;       // The matrix that defines the transformation of the
                            // object we're rendering. In this assignment,
                            // this will be the result of traversing your scene graph.

uniform mat4 u_ModelInvTr;  // The inverse transpose of the model matrix.
                            // This allows us to transform the object's normals properly
                            // if the object has been non-uniformly scaled.

uniform mat4 u_ViewProj;    // The matrix that defines the camera's transformation.
                            // We've written a static matrix for you to use for HW2,
                            // but in HW3 you'll have to generate one yourself

uniform float u_Time;            // just the time, used for animating stuff
uniform float u_GrassPercent;    // silly grass :3
uniform float u_LightIntensity;

in vec4 vs_Pos;             // The array of vertex positions passed to the shader
in vec4 vs_Nor;             // The array of vertex normals passed to the shader
in vec4 vs_Col;             // The array of vertex colors passed to the shader

out vec4 fs_Nor;            // The array of normals that has been transformed by u_ModelInvTr. This is implicitly passed to the fragment shader.
out vec4 fs_LightVec;       // The direction in which our virtual light lies, relative to each vertex. This is implicitly passed to the fragment shader.
out vec4 fs_Col;            // The color of each vertex. This is implicitly passed to the fragment shader.
out vec4 fs_Pos;
out float fs_Time;
out float fs_Grass;
out float fs_LightIntensity;

const vec4 lightPos = vec4(5, 5, 3, 1); //The position of our virtual light, which is used to compute the shading of
                                        //the geometry in the fragment shader.

// fbm noise code from https://thebookofshaders.com/13/
float random (in vec2 st) {
    return fract(sin(dot(st.xy,
                         vec2(12.9898,78.233)))*
        43758.5453123);
}

// Based on Morgan McGuire @morgan3d
// https://www.shadertoy.com/view/4dS3Wd
float noise (in vec2 st) {
    vec2 i = floor(st);
    vec2 f = fract(st);

    // Four corners in 2D of a tile
    float a = random(i);
    float b = random(i + vec2(1.0, 0.0));
    float c = random(i + vec2(0.0, 1.0));
    float d = random(i + vec2(1.0, 1.0));

    vec2 u = f * f * (3.0 - 2.0 * f);

    return mix(a, b, u.x) +
            (c - a)* u.y * (1.0 - u.x) +
            (d - b) * u.x * u.y;
}

#define OCTAVES 6
float fbm (in vec2 st) {
    // Initial values
    float value = 0.0;
    float amplitude = .5;
    float frequency = 0.;
    //
    // Loop of octaves
    for (int i = 0; i < OCTAVES; i++) {
        value += amplitude * noise(st);
        st *= 2.;
        amplitude *= .5;
    }
    return value;
}

float bias (float b, float t) {
    return pow(t, log(b) / log(0.5));
}

float cubicPulse (float c, float w, float x) {
    x = abs(x - c);
    if (x > w) return 0.0;
    x /= w;
    return 1.0 - x * x * (3.0 - 2.0 * x);
}

float gain(float g, float t) {
    if (t < 0.5) {
        return bias(1.0-g, 2.0*t) / 2.0;
    } else {
        return 1.0 - bias(1.0 - g, 2.0 - 2.0 * t) / 2.0;
    }
}

float sawtooth_wave(float x, float freq, float amplitude) {
    return (x * freq - floor(x * freq)) * amplitude;
}

float impulse(float k, float x) {
    float h = k*x;
    return h * exp(1.0 - h);
}

float ease_in_quadratic(float t) {
    return t * t;
}

float ease_in_out_quadratic(float t) {
    if (t < 0.5) {
        return ease_in_quadratic(t * 2.0) / 2.0;
    } else {
        return 1.0 - ease_in_quadratic((1.0 - t) * 2.0) / 2.0;
    }
}

void main()
{
    fs_Col = vs_Col;                         // Pass the vertex colors to the fragment shader for interpolation
    fs_Time = u_Time;
    fs_Grass = u_GrassPercent;
    fs_LightIntensity = u_LightIntensity;

    mat3 invTranspose = mat3(u_ModelInvTr);
    fs_Nor = vec4(invTranspose * vec3(vs_Nor), 0);          // Pass the vertex normals to the fragment shader for interpolation.
                                                            // Transform the geometry's normals by the inverse transpose of the
                                                            // model matrix. This is necessary to ensure the normals remain
                                                            // perpendicular to the surface after the surface is transformed by
                                                            // the model matrix.

    vec4 position = vs_Pos;

    // here's where i do all the fancy vertex shader stuff
    // formula: sin((position.x + speed * u_Time) * frequency) * amplitude + displacement;

    // displace along normals for the rest of body
    position += fs_Nor * (sin((position.x + 0.01 * u_Time) * 10.0) * 0.025 + .1);
    position += fs_Nor * (sin((-position.y + 0.01 * (u_Time + 2.0)) * 10.0) * 0.05 + .1);
    position += fs_Nor * (sin((-position.z + 0.01 * (u_Time + 2.0)) * 10.0) * 0.025 + .1);

    // displace along additional fbm
    vec2 fbm_coords = vec2(position.x + u_Time * 0.01, position.z + u_Time * 0.01);
    float displacement_amt = bias(0.2, (position.y + 2.0) / 2.0);
    position.y += (3.0*fbm(fbm_coords) - 0.5) * displacement_amt;

    // stretch to make a pointed tip
    position.xz *= sqrt(-(position.y - 7.0) / 2.0);
    position.y *= 1.5;

    // make the top bit wavy
    position.x += (sin(position.y + u_Time * 0.1) * 0.1) * displacement_amt;
    position.x += (sin(position.y + u_Time * 0.2) * 0.03) * displacement_amt;
    position.z += (sin(position.y + u_Time * 0.1) * 0.1) * displacement_amt;
    position.x += (sin(position.y + u_Time * 0.15) * 0.02) * displacement_amt;

    position.y += ease_in_out_quadratic(sin(u_Time * 0.02)) * 0.5;

    vec4 modelposition = u_Model * position;   // Temporarily store the transformed vertex positions for use below
    fs_Pos = modelposition;

    fs_LightVec = lightPos - modelposition;  // Compute the direction in which the light source lies

    gl_Position = u_ViewProj * modelposition;// gl_Position is a built-in variable of OpenGL which is
                                             // used to render the final positions of the geometry's vertices
}
