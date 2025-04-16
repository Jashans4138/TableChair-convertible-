let gl;
let a_Position, a_Normal, u_MvpMatrix, u_NormalMatrix, u_Color, u_AmbientLight;
let viewProjMatrix = new Matrix4();
let backrestAngle = 10;
let armAngle = 10;

function main() {
    const canvas = document.getElementById('webgl');
    gl = canvas.getContext('webgl');
    if (!gl) {
        console.log('Failed to get WebGL context');
        return;
    }

    // Vertex shader now includes lighting calculations
    const VSHADER_SOURCE = `
    attribute vec4 a_Position;
    attribute vec4 a_Normal;
    uniform mat4 u_MvpMatrix;
    uniform mat4 u_NormalMatrix;
    varying vec4 v_Color;
    void main() {
        gl_Position = u_MvpMatrix * a_Position;
        // Lighting calculations (from old code)
        vec3 lightDirection = normalize(vec3(0.0, 1, 0.7));
        vec3 normal = normalize((u_NormalMatrix * a_Normal).xyz);
        float nDotL = max(dot(normal, lightDirection), 0.0);
        v_Color = vec4(0,0 , 0, 1.0) * nDotL;
    }`;

    // Fragment shader adds ambient light
    const FSHADER_SOURCE = `
    precision mediump float;
    varying vec4 v_Color;
    uniform vec3 u_AmbientLight;
    void main() {
        gl_FragColor = vec4(v_Color.rgb + u_AmbientLight, v_Color.a);
    }`;

    if (!initShaders(gl, VSHADER_SOURCE, FSHADER_SOURCE)) {
        console.log('Failed to initialize shaders.');
        return;
    }

    // Get attribute and uniform locations
    a_Position = gl.getAttribLocation(gl.program, 'a_Position');
    a_Normal = gl.getAttribLocation(gl.program, 'a_Normal');
    u_MvpMatrix = gl.getUniformLocation(gl.program, 'u_MvpMatrix');
    u_NormalMatrix = gl.getUniformLocation(gl.program, 'u_NormalMatrix');
    u_AmbientLight = gl.getUniformLocation(gl.program, 'u_AmbientLight');

    gl.enable(gl.DEPTH_TEST);
    gl.clearColor(0.4, 0.4, 0.4, 1);

    viewProjMatrix.setPerspective(45, canvas.width / canvas.height, 1, 100);
    viewProjMatrix.lookAt(8, 8, 15, 0, 2, 0, 0, 1, 0);

    // Set ambient light (blue-ish like in old code)
    gl.uniform3f(u_AmbientLight, 1, 0, 0);

    document.onkeydown = function (ev) {
        switch (ev.key) {
            case 'ArrowLeft':
                backrestAngle -= 5;
                break;
            case 'ArrowRight':
                backrestAngle += 5;
                break;
            case 'ArrowUp':
                armAngle += 5;
                break;
            case 'ArrowDown':
                armAngle -= 5;
                break;
        }
        backrestAngle = Math.max(-90, Math.min(60, backrestAngle));
        armAngle = Math.max(-90, Math.min(90, armAngle));
        drawScene();
    };

    drawScene();
}

function drawScene() {
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    // === Seat ===
    let seat = new Matrix4();
    seat.translate(0, 2.5, 0);
    seat.scale(2, 0.2, 2);
    drawTransformedBox(viewProjMatrix, seat);

    // === Legs ===
    drawBox(-1.6, 1.2, -1.6, 0.4, 2.4, 0.4);
    drawBox(1.6, 1.2, -1.6, 0.4, 2.4, 0.4);
    drawBox(-1.6, 1.2, 1.6, 0.4, 2.4, 0.4);
    drawBox(1.6, 1.2, 1.6, 0.4, 2.4, 0.4);

    // === Backrest ===
    // === Backrest ===
    let backrest = new Matrix4();
    backrest.translate(0, 2.5, -2);
    backrest.rotate(backrestAngle, 1, 0, 0);
    backrest.translate(0, 2, 0.0);
    let backrestScale = new Matrix4();
    backrestScale.scale(2, 2, 0.2);
    drawTransformedBox(viewProjMatrix, backrest.multiply(backrestScale));

    // === Armrests ===
    // Left Arm
    let leftArm = new Matrix4();
    leftArm.translate(-1., 2.5, -2);  // Start from chair base
    leftArm.rotate(backrestAngle, 1, 0, 0); // Same rotation as backrest
    leftArm.translate(-1.1, 2, 0); // Armrest position relative to backrest
    leftArm.rotate(armAngle, 1, 0, 0); // Individual arm rotation
    leftArm.translate(0, -1, 0); // Pivot adjustment
    leftArm.scale(0.2, 1.2, 0.3); // Armrest's own scale
    drawTransformedBox(viewProjMatrix, leftArm);

    // Right Arm
    let rightArm = new Matrix4();
    rightArm.translate(1, 2.5, -2);
    rightArm.rotate(backrestAngle, 1, 0, 0);
    rightArm.translate(1.1, 2, 0);
    rightArm.rotate(armAngle, 1, 0, 0);
    rightArm.translate(0, -1, 0);
    rightArm.scale(0.2, 1.2, 0.3);
    drawTransformedBox(viewProjMatrix, rightArm);
}

function drawBox(x, y, z, w, h, d) {
    const model = new Matrix4();
    model.translate(x, y, z);
    model.scale(w / 2, h / 2, d / 2);
    drawTransformedBox(viewProjMatrix, model);
}

function drawTransformedBox(vpMatrix, modelMatrix) {
    // Vertex positions
    const vertices = new Float32Array([
        -1, -1, 1, 1, -1, 1, 1, 1, 1, -1, -1, 1, 1, 1, 1, -1, 1, 1,   // Front
        -1, -1, -1, -1, 1, -1, 1, 1, -1, -1, -1, -1, 1, 1, -1, 1, -1, -1, // Back
        -1, 1, -1, -1, 1, 1, 1, 1, 1, -1, 1, -1, 1, 1, 1, 1, 1, -1,    // Top
        -1, -1, -1, 1, -1, -1, 1, -1, 1, -1, -1, -1, 1, -1, 1, -1, -1, 1, // Bottom
        1, -1, -1, 1, 1, -1, 1, 1, 1, 1, -1, -1, 1, 1, 1, 1, -1, 1,    // Right
        -1, -1, -1, -1, -1, 1, -1, 1, 1, -1, -1, -1, -1, 1, 1, -1, 1, -1  // Left
    ]);

    // Normals for each face (same as in your old code)
    const normals = new Float32Array([
        0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1,   // Front
        0, 0, -1, 0, 0, -1, 0, 0, -1, 0, 0, -1, 0, 0, -1, 0, 0, -1, // Back
        0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0,    // Top
        0, -1, 0, 0, -1, 0, 0, -1, 0, 0, -1, 0, 0, -1, 0, 0, -1, 0, // Bottom
        1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0,    // Right
        -1, 0, 0, -1, 0, 0, -1, 0, 0, -1, 0, 0, -1, 0, 0, -1, 0, 0  // Left
    ]);

    // Create and bind vertex buffer
    const vertexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);
    gl.vertexAttribPointer(a_Position, 3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(a_Position);

    // Create and bind normal buffer
    const normalBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, normalBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, normals, gl.STATIC_DRAW);
    gl.vertexAttribPointer(a_Normal, 3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(a_Normal);

    // Calculate model-view-projection matrix
    const mvpMatrix = new Matrix4();
    mvpMatrix.set(vpMatrix);
    mvpMatrix.multiply(modelMatrix);
    gl.uniformMatrix4fv(u_MvpMatrix, false, mvpMatrix.elements);

    // Calculate normal matrix (for lighting)
    const normalMatrix = new Matrix4();
    normalMatrix.setInverseOf(modelMatrix);
    normalMatrix.transpose();
    gl.uniformMatrix4fv(u_NormalMatrix, false, normalMatrix.elements);

    // Draw the box
    gl.drawArrays(gl.TRIANGLES, 0, 36);
}
