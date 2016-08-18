/// <reference types="argon" />
/// <reference types="three" />

// set up Argon
const app = Argon.init();

// set up THREE.  Create a scene, a perspective camera and an object
// for the user's location
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera();
const userLocation = new THREE.Object3D();
scene.add(camera);
scene.add(userLocation);

// We use the standard WebGLRenderer when we only need WebGL-based content
const renderer = new THREE.WebGLRenderer({ 
    alpha: true, 
    logarithmicDepthBuffer: true
});
// account for the pixel density of the device
renderer.setPixelRatio(window.devicePixelRatio);
app.view.element.appendChild(renderer.domElement);

// to easily control stuff on the display
const hud = new (<any>THREE).CSS3DArgonHUD();

// We put some elements in the index.html, for convenience. 
// Here, we retrieve the description box and move it to the 
// the CSS3DArgonHUD hudElements[0].  We only put it in the left
// hud since we'll be hiding it in stereo
var description = document.getElementById( 'description' );
hud.hudElements[0].appendChild(description);
app.view.element.appendChild(hud.domElement);

// let's show the rendering stats
var stats = new Stats();
hud.hudElements[0].appendChild( stats.dom );

// Tell argon what local coordinate system you want.  The default coordinate
// frame used by Argon is Cesium's FIXED frame, which is centered at the center
// of the earth and oriented with the earth's axes.  
// The FIXED frame is inconvenient for a number of reasons: the numbers used are
// large and cause issues with rendering, and the orientation of the user's "local
// view of the world" is different that the FIXED orientation (my perception of "up"
// does not correspond to one of the FIXED axes).  
// Therefore, Argon uses a local coordinate frame that sits on a plane tangent to 
// the earth near the user's current location.  This frame automatically changes if the
// user moves more than a few kilometers.
// The EUS frame cooresponds to the typical 3D computer graphics coordinate frame, so we use
// that here.  The other option Argon supports is localOriginEastNorthUp, which is
// more similar to what is used in the geospatial industry
app.context.setDefaultReferenceFrame(app.context.localOriginEastUpSouth);


// create a bit of animated 3D text that says "argon.js" to display 
var uniforms = {
    amplitude: { type: "f", value: 0.0 }
}

var argonTextObject = new THREE.Object3D();
argonTextObject.position.z = -250;
userLocation.add(argonTextObject);

var loader = new THREE.FontLoader();
loader.load( '../resources/fonts/helvetiker_bold.typeface.js', function ( font:THREE.Font ) {
    var textGeometry = new THREE.TextGeometry( "argon.js", {
        font: font,
        size: 40,
        height: 5,
        curveSegments: 3,
        bevelThickness: 2,
        bevelSize: 1,
        bevelEnabled: true
    });
    textGeometry.center();
    var tessellateModifier = new THREE.TessellateModifier( 8 );
    for ( var i = 0; i < 6; i ++ ) {
        tessellateModifier.modify( textGeometry );
    }
    var explodeModifier = new THREE.ExplodeModifier();
    explodeModifier.modify( textGeometry );
    var numFaces = textGeometry.faces.length;
    
    var bufferGeometry = new THREE.BufferGeometry().fromGeometry( textGeometry );
    var colors = new Float32Array( numFaces * 3 * 3 );
    var displacement = new Float32Array( numFaces * 3 * 3 );
    var color = new THREE.Color();
    for ( var f = 0; f < numFaces; f ++ ) {
        var index = 9 * f;
        var h = 0.07 + 0.1 * Math.random();
        var s = 0.5 + 0.5 * Math.random();
        var l = 0.6 + 0.4 * Math.random();
        color.setHSL( h, s, l );
        var d = 5 + 20 * ( 0.5 - Math.random() );
        for ( var i = 0; i < 3; i ++ ) {
            colors[ index + ( 3 * i )     ] = color.r;
            colors[ index + ( 3 * i ) + 1 ] = color.g;
            colors[ index + ( 3 * i ) + 2 ] = color.b;
            displacement[ index + ( 3 * i )     ] = d;
            displacement[ index + ( 3 * i ) + 1 ] = d;
            displacement[ index + ( 3 * i ) + 2 ] = d;
        }
    }
    bufferGeometry.addAttribute( 'customColor', new THREE.BufferAttribute( colors, 3 ) );
    bufferGeometry.addAttribute( 'displacement', new THREE.BufferAttribute( displacement, 3 ) );
    
    var shaderMaterial = new THREE.ShaderMaterial({
        uniforms: uniforms,
        vertexShader: `
            uniform float amplitude;
            attribute vec3 customColor;
            attribute vec3 displacement;
            varying vec3 vNormal;
            varying vec3 vColor;
            void main() {
                vNormal = normal;
                vColor = customColor;
                vec3 newPosition = position + normal * amplitude * displacement;
                gl_Position = projectionMatrix * modelViewMatrix * vec4( newPosition, 1.0 );
            }
        `,
        fragmentShader: `
            varying vec3 vNormal;
            varying vec3 vColor;
            void main() {
                const float ambient = 0.4;
                vec3 light = vec3( 1.0 );
                light = normalize( light );
                float directional = max( dot( vNormal, light ), 0.0 );
                gl_FragColor = vec4( ( directional + ambient ) * vColor, 1.0 );
            }
        `
    });
    
    var textMesh = new THREE.Mesh( bufferGeometry, shaderMaterial );
    argonTextObject.add( textMesh );
    
    // add an argon updateEvent listener to slowly change the text over time.
    // we don't have to pack all our logic into one listener.
    app.context.updateEvent.addEventListener(() => {
        uniforms.amplitude.value = 1.0 + Math.sin( Date.now() * 0.001 * 0.5 );
    });
});

// tell argon to initialize vuforia for our app, using our license information.
app.vuforia.init({
	licenseKey: "AXRIsu7/////AAAAAaYn+sFgpkAomH+Z+tK/Wsc8D+x60P90Nz8Oh0J8onzjVUIP5RbYjdDfyatmpnNgib3xGo1v8iWhkU1swiCaOM9V2jmpC4RZommwQzlgFbBRfZjV8DY3ggx9qAq8mijhN7nMzFDMgUhOlRWeN04VOcJGVUxnKn+R+oot1XTF5OlJZk3oXK2UfGkZo5DzSYafIVA0QS3Qgcx6j2qYAa/SZcPqiReiDM9FpaiObwxV3/xYJhXPUGVxI4wMcDI0XBWtiPR2yO9jAnv+x8+p88xqlMH8GHDSUecG97NbcTlPB0RayGGg1F6Y7v0/nQyk1OIp7J8VQ2YrTK25kKHST0Ny2s3M234SgvNCvnUHfAKFQ5KV",
    encryptedLicenseData: 
`-----BEGIN PGP MESSAGE-----
Version: OpenPGP.js v2.3.2
Comment: http://openpgpjs.org

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
0ccTFA==
=AUSQ
-----END PGP MESSAGE-----
`
}).then((api)=>{
    // the vuforia API is ready, so we can start using it.

    // tell argon to download a vuforia dataset.  The .xml and .dat file must be together
    // in the web directory, even though we just provide the .xml file url here 
    api.objectTracker.createDataSet('../resources/datasets/StonesAndChips.xml').then( (dataSet)=>{
        // the data set has been succesfully downloaded

        // tell vuforia to load the dataset.  
        dataSet.load().then(()=>{
            // when it is loaded, we retrieve a list of trackables defined in the
            // dataset and set up the content for the target
            const trackables = dataSet.getTrackables();

            // tell argon we want to track a specific trackable.  Each trackable
            // has a Cesium entity associated with it, and is expressed in a 
            // coordinate frame relative to the camera.  Because they are Cesium
            // entities, we can ask for their pose in any coordinate frame we know
            // about.
            const stonesEntity = app.context.subscribeToEntityById(trackables['stones'].id)

            // create a THREE object to put on the trackable
            const stonesObject = new THREE.Object3D;
            scene.add(stonesObject);

            // the updateEvent is called each time the 3D world should be
            // rendered, before the renderEvent.  The state of your application
            // should be updated here.
            app.context.updateEvent.addEventListener(() => {
                // get the pose (in local coordinates) of the stones target
                const stonesPose = app.context.getEntityPose(stonesEntity);

                // if the pose is known the target is visible, so set the
                // THREE object to it's location and orientation
                if (stonesPose.poseStatus & Argon.PoseStatus.KNOWN) {
                    stonesObject.position.copy(<any>stonesPose.position);
                    stonesObject.quaternion.copy(<any>stonesPose.orientation);
                }

                // when the target is first seen after not being seen, the 
                // status is FOUND.  Here, we move the 3D text object from the
                // world to the target.
                // when the target is first lost after being seen, the status 
                // is LOST.  Here, we move the 3D text object back to the world
                if (stonesPose.poseStatus & Argon.PoseStatus.FOUND) {
                    stonesObject.add(argonTextObject);
                    argonTextObject.position.z = 0;
                } else if (stonesPose.poseStatus & Argon.PoseStatus.LOST) {
                    argonTextObject.position.z = -250;
                    userLocation.add(argonTextObject);
                }
            })
        });
        
        // activate the dataset.
        api.objectTracker.activateDataSet(dataSet);
    });
})

// the updateEvent is called each time the 3D world should be
// rendered, before the renderEvent.  The state of your application
// should be updated here.
app.context.updateEvent.addEventListener(() => {
    // get the position and orientation (the "pose") of the user
    // in the local coordinate frame.
    const userPose = app.context.getEntityPose(app.context.user);

    // assuming we know the user's pose, set the position of our 
    // THREE user object to match it
    if (userPose.poseStatus & Argon.PoseStatus.KNOWN) {
        userLocation.position.copy(<any>userPose.position);
    }
});
    
// renderEvent is fired whenever argon wants the app to update its display
app.renderEvent.addEventListener(() => {
    // update the rendering stats
    stats.update();
    
    // if we have 1 subView, we're in mono mode.  If more, stereo.
    var monoMode = (app.view.getSubviews()).length == 1;

    // set the renderer to know the current size of the viewport.
    // This is the full size of the viewport, which would include
    // both views if we are in stereo viewing mode
    const viewport = app.view.getViewport();
    renderer.setSize(viewport.width, viewport.height);
    hud.setSize(viewport.width, viewport.height);
    
    // there is 1 subview in monocular mode, 2 in stereo mode    
    for (let subview of app.view.getSubviews()) {
        // set the position and orientation of the camera for 
        // this subview
        camera.position.copy(<any>subview.pose.position);
        camera.quaternion.copy(<any>subview.pose.orientation);
        // the underlying system provide a full projection matrix
        // for the camera. 
        camera.projectionMatrix.fromArray(<any>subview.projectionMatrix);

        // set the viewport for this view
        let {x,y,width,height} = subview.viewport;
        renderer.setViewport(x,y,width,height);

        // set the webGL rendering parameters and render this view
        renderer.setScissor(x,y,width,height);
        renderer.setScissorTest(true);
        renderer.render(scene, camera);

        // adjust the hud, but only in mono
        if (monoMode) {
            hud.setViewport(x,y,width,height, subview.index);
            hud.render(subview.index);
        }
    }
})