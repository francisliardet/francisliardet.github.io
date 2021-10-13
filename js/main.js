import * as THREE from './three.module.js';
import { GLTFLoader } from './GLTFLoader.js';

import { EffectComposer } from './postprocessing/EffectComposer.js';
import { RenderPass } from './postprocessing/RenderPass.js';
import { ShaderPass } from './postprocessing/ShaderPass.js';

import { AnaglyphEffect } from './effects/AnaglyphEffect.js';
import { AsciiEffect } from './effects/AsciiEffect.js';

import { RGBShiftShader } from './shaders/RGBShiftShader.js';
import { DotScreenShader } from './shaders/DotScreenShader.js';

import { LuminosityShader } from './shaders/LuminosityShader.js';
import { SobelOperatorShader } from './shaders/SobelOperatorShader.js';

var camera, scene, renderer, effect, light, composer, controls;

var effectSobel, effectRGB;

var minRGBShift = 0.0; //0.002
var maxRGBShift = 0.01;

var sound;
var analyser;

// Pairs of subdirectory names to desired scale
var objects = [['arduino', 1], ['bread', 5], ['coffee', 1], ['plant', 0.065], ['keyboard', 0.5]];

var meshes = [];
var rotationSpeed = 0.5;
var amount = 2;
var spread = 20;
var minCameraDist = 0;
var cameraDistFromOrigin = 10;
var count = Math.pow( amount, 3 );
var dummy = new THREE.Object3D();

var minXDistance = -20;
var maxXDistance = 20;

var mouseX = 0, mouseY = 0;
var windowHalfX = window.innerWidth / 2;
var windowHalfY = window.innerHeight / 2;

function newMesh( chosenObject, instanceIndex ) {
	var loader = new GLTFLoader();
	loader.load('obj/' + objects[chosenObject][0] + '/scene.gltf', function ( gltf ) {

		gltf.scene.traverse( function ( child ) {

			if ( child.isMesh ) {
				var bAddMesh = false;

				// Might need to scale based on total screen size ratio too?
				child.geometry.scale( objects[chosenObject][1], objects[chosenObject][1], objects[chosenObject][1] );

				//var mesh = gltf.scene.children[ 0 ];

				//var material = new THREE.MeshNormalMaterial();
				var material = child.material;

				if (!meshes[chosenObject]){
					meshes[chosenObject] = new THREE.InstancedMesh(child.geometry, material, count);
					meshes[chosenObject].instanceMatrix.setUsage( THREE.DynamicDrawUsage );
					bAddMesh = true;
				}

				var a = getRandomWorldPosition();
				dummy.position.x = a.x;
				dummy.position.y = a.y;
				dummy.position.z = a.z;

				dummy.rotation.x = Math.random() * 2 * Math.PI;
				dummy.rotation.y = Math.random() * 2 * Math.PI;
				dummy.rotation.z = Math.random() * 2 * Math.PI;

				dummy.scale.x, dummy.scale.y, dummy.scale.z = Math.random() + 0.5;

				dummy.updateMatrix();
				meshes[chosenObject].setMatrixAt( instanceIndex, dummy.matrix );
				
				if ( bAddMesh ){
					scene.add(meshes[chosenObject]);
				}
			}

		} );
	});
}

export function init() {
	
	// camera init

	camera = new THREE.PerspectiveCamera( 60, window.innerWidth / window.innerHeight, 0.1, 100 );
	camera.lookAt( 0, 0, 0 );
	camera.focalLength = 3;

	scene = new THREE.Scene();

	scene.fog = new THREE.Fog( 0x000000, 1, 1000 );

	// lighting

	scene.add( new THREE.AmbientLight( 0x222222 , 10) );
	light = new THREE.DirectionalLight( 0xffffff, 1 );
	light.position.set( 1, 1, 1 ).normalize();
	scene.add( light );

	// sound
	// create an AudioListener and add it to the camera
	const listener = new THREE.AudioListener();
	camera.add( listener );

	// create a global audio source
	sound = new THREE.Audio( listener );

	// load a sound and set it as the Audio object's buffer
	const audioLoader = new THREE.AudioLoader();
	audioLoader.load( 'audio/track-5.mp3', function( buffer ) {
		sound.setBuffer( buffer );
		sound.setLoop( true );
		sound.setVolume( 0.5 );
	});

	analyser = new THREE.AudioAnalyser( sound, 32 );

	// meshes

	for (let chosenObject = 0; chosenObject < objects.length; chosenObject++)
	{
		for ( var i = 0; i < count; i ++ ) {
			newMesh(chosenObject, i);
		}
	}

	//

	renderer = new THREE.WebGLRenderer( { antialias: true } );
	renderer.setPixelRatio( window.devicePixelRatio );
	renderer.setSize( window.innerWidth, window.innerHeight );
	// Remove below line for ASCII effect
	document.body.appendChild( renderer.domElement );

	//

	composer = new EffectComposer( renderer );
	composer.addPass( new RenderPass( scene, camera ) );

	// color to grayscale conversion

	const effectGrayScale = new ShaderPass( LuminosityShader );
	composer.addPass( effectGrayScale );

	// you might want to use a gaussian blur filter before
	// the next pass to improve the result of the Sobel operator

	// Sobel operator

	effectSobel = new ShaderPass( SobelOperatorShader );
	effectSobel.uniforms[ 'resolution' ].value.x = window.innerWidth * window.devicePixelRatio;
	effectSobel.uniforms[ 'resolution' ].value.y = window.innerHeight * window.devicePixelRatio;
	composer.addPass( effectSobel );

	// var effect = new ShaderPass( DotScreenShader );
	// effect.uniforms[ 'scale' ].value = 5;
	// composer.addPass( effect );

	effectRGB = new ShaderPass( RGBShiftShader );
	effectRGB.uniforms[ 'amount' ].value = minRGBShift;
	composer.addPass( effectRGB );

	//

	// Anaglyph effect

	// var width = window.innerWidth || 2;
	// var height = window.innerHeight || 2;

	// effect = new AnaglyphEffect( renderer );
	// effect.setSize( width, height );

	// ASCII effect

	/*effect = new AsciiEffect( renderer, ' .:-+*=%@#', { invert: true } );
	effect.setSize( window.innerWidth, window.innerHeight );
	effect.domElement.style.color = 'white';
	effect.domElement.style.backgroundColor = 'black';

	document.body.appendChild( effect.domElement );*/

	window.addEventListener( 'resize', onWindowResize, false );

	document.addEventListener('mousemove', onDocumentMouseMove, false);
}

export function toggleAudioPlayback() {
	if (sound.isPlaying)
	{
		sound.pause();
	}
	else
	{
		sound.play();
	}
}

function getRandomWorldPosition() {

	//Create random unit vector
	var out = new THREE.Vector3(Math.random() - 0.5, Math.random() - 0.5, Math.random() - 0.5);
	out = out.normalize();

	//Give random distance 
	out = out.multiplyScalar(Math.random() * (Math.max(spread, minCameraDist) - minCameraDist) + minCameraDist);
	// Spread from min X to max X (kinda overrides previous line but w/e)
	out.x = (Math.random() * (maxXDistance - minXDistance) - Math.abs(minXDistance))

	return out;
}

function onWindowResize() {

	camera.aspect = window.innerWidth / window.innerHeight;
	camera.updateProjectionMatrix();

	renderer.setSize( window.innerWidth, window.innerHeight );
	//effect.setSize( window.innerWidth, window.innerHeight );
	composer.setSize( window.innerWidth, window.innerHeight );

}

function onDocumentMouseMove( event ) {

	mouseX = ( event.clientX - windowHalfX ) * 1;
	mouseY = ( event.clientY - windowHalfY ) * 1;
	//console.log(event.clientX + ', ' + windowHalfX);
}

//

export function animate() {

	requestAnimationFrame( animate );

	render();

}

function render() {
	var time = Date.now() * 0.001;

	camera.position.x = cameraDistFromOrigin;
	camera.lookAt(0,0,0);

	// audio visualiser stuff
	let minFreq = 35;
	let maxFreq = 200;
	let frequencyAlpha = Math.max(analyser.getAverageFrequency() - minFreq, 0) / (maxFreq - minFreq);

	let newShiftValue = THREE.MathUtils.lerp(minRGBShift, maxRGBShift, frequencyAlpha);
	effectRGB.uniforms[ 'amount' ].value = newShiftValue;

	let newTranslateOffset = THREE.MathUtils.lerp(0.01, 0.1, frequencyAlpha);

	if (meshes.length > 0){
		for ( let i = 0; i < meshes.length; i++ ) {

			if ( meshes[i] )
			{
				var bNeedsUpdate = false;
				var time = Date.now() * 0.001;
	
				for (let j = meshes[i].count - 1; j >= 0; j--){
					var m = new THREE.Matrix4;
					meshes[i].getMatrixAt(j, m);

					var instancePosition = new THREE.Vector3;
					var instanceRotation = new THREE.Quaternion;
					var instanceScale = new THREE.Vector3;

					m.decompose(instancePosition, instanceRotation, instanceScale);

					instancePosition.x -= newTranslateOffset;

					if  (instancePosition.x <= minXDistance)
					{
						instancePosition.x = Math.random() * maxXDistance + cameraDistFromOrigin + 5;
						console.log(m.position);
					}

					instanceScale.lerpVectors (new THREE.Vector3(1,1,1), new THREE.Vector3(0,0,0), Math.min(Math.max(instancePosition.x / minXDistance , 0), 1));
					m.compose(instancePosition, instanceRotation, instanceScale);
					//console.log(instanceScale);

					//getRandomWorldPosition();
					meshes[i].setMatrixAt( j, m );
					//needs update
					meshes[i].instanceMatrix.needsUpdate = true;
				}

				if (meshes[i].scale.length < 0.1){
					
					bNeedsUpdate = true;
					//meshes
				}

				if (bNeedsUpdate)
				{
					//meshes[i].
				}
				//console.log(mesh.position.x );
				//if (mesh.position.x)
			}
		}
	}

	//renderer.render( scene, camera );
	//effect.render( scene, camera );
	composer.render();
}