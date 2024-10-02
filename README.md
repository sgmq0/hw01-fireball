# HW 1: Fireball 
who up deading they cells

[Live demo 🚀](https://sgmq0.github.io/hw01-fireball/)

**UI Elements**
- Primary/Secondary/Tertiary/Star Color: What it says on the tin.
- Noise scale: Scales the noise used to color the tip.
- Noise amount: Changes how much of the head is colored with the tertiary (tip) color.
- Rim amount: Changes the brightness of the glow on the rim.
- Time scale: Changes the speed of animation. I added this in because the speed was drastically different on my desktop and my laptop...
- Star mesh / star glow / body mesh: Enables and disables these respectively.

<p align="center">
  <img src="https://i.imgur.com/use9F1O.gif" width=400/>
  <img src="https://i.imgur.com/5sWIurK.png" width=470/>
</p>

## Description
For this project, I created the player character (the Beheaded) from Dead Cells, which is a game I've been playing a lot recently. It's not really a fireball, but the smoke effect of his head is close enough.

**Vertex Shader**
- I applied a series of low frequency, low amplitude sinusoidal displacement functions on the vertices, animated with regard to time, to get a less uniform sphere. To achieve a somewhat "bouncy" effect, I made sure the displacement along the y-axis was positive.
- Additionally, I applied high amplitude FBM noise to the vertices' y-position, and biased it in the y-direction so that only the top of the Beheaded's head would be stretched by the FBM noise.
- To achieve a pointed tip, I scaled down the x and z coordinates of the top of the head.
- I also wanted to make the tip wave around instead of sticking straight up, so I further displaced the tip of the head in the x and z directions using layered trigonomic functions.
- Finally, to make the Beheaded's head bob up and down, I applied a quadratic ease in/out function to the y position of the vertices.
    - As a side note, I also created an additional geometry class for the star, and had it bob up and down using a separate vertex shader.

**Fragment Shader**
- To start with, I added 3D FBM noise onto the head, and interpolated between a primary color and tertiary color using the noise as a value. I also biased the color towards the tip of the head.
- For an edge glow and a nice transparency effect, I implemented a fresnel effect by passing in the camera's view direction, and colored it with a secondary color. 
- To fake a 'glow' effect for the star, I created a variable called `star_pos` for the center of the star, animated it with the same quadratic ease in/out function as the fragment shader, and calculated the distance from the center, `dist`. Then I interpolated the rest of the fragment's color with the star's color (represented as a uniform variable) using `dist`. I also animated the falloff distance with a triangle wave to have it 'glow' brighter/dimmer.
- The star also has a (very faint so that it doesn't hurt your eyes) color-changing effect, implemented using a square wave.

**Extra Spice - Custom Mesh**
- I modeled the character's body in blender, imported the objs as `const string`s into my project, and read the per-vertex data into a custom geometry class.
- Then I rendered each of them in separate render passes so that I could change the base color of the lambert shader.

**Toolbox Functions**
1. Bias - Used to create the tip of the head, and to tint it with the secondary color.
2. Triangle wave - Used to fake a 'glow' for the star.
3. Ease in/out - Used to make the head bobble up and down.
4. Square wave - Used to quickly change the color of the star.

**Sources**
- [FBM Noise - Book of Shaders](https://thebookofshaders.com/13/)
- [Reference for Perlin Noise](https://github.com/stegu/webgl-noise)
- [Reference for OBJ loading](https://webgl2fundamentals.org/webgl/lessons/webgl-load-obj.html)
- [OBJ loader package](https://www.npmjs.com/package/obj-file-parser)
