import React, { useCallback, useEffect, useRef,useState } from 'react'
import { Pose } from '@mediapipe/pose';
import * as THREE from "three";


function MediaPipeCmpt() {
  // video dom
  const videoRef = useRef(null);
  const videoSrc = require("./daisuke.mp4");
  // handle @media/pipe result
  const onResults = (results)=> {
    if (!results.poseLandmarks) { return }
    renderBalls(results.poseWorldLandmarks);
    curRenderer.current.render(curScene.current, curCamera.current);
  }
  // pose instance
  const [pose,setPose] = useState(new Pose({locateFile: (file) => { return `https://cdn.jsdelivr.net/npm/@mediapipe/pose/${file}` }}))
  // three ball list
  const objList = useRef([]);
  // three renderer
  const curRenderer = useRef(null);
  // three scene
  const curScene = useRef(null);
  // three camera
  const curCamera = useRef(null);
  // parse video per frame image by pose instance
  const sendImage = async()=>{
    const video = videoRef.current;
     if( video.duration == video.currentTime ){ return; }
      await pose.send({image: video});
      requestAnimationFrame(sendImage)
  }
  // using three vector
  const convMP2WLDCoord = ( coord )=>{
    return new THREE.Vector3( coord.x , -1 * coord.y , -1 * coord.z );
}
  // three.js initiation
  const renderThree =async()=>{
    //three scene
    const scene = new THREE.Scene();
    //three ball objects
    const list = [];
    for( let i=0 ; i<34 ; i++ ){
        const geometry  = new THREE.SphereGeometry( 0.01, 32, 16 );
        const material  = new THREE.MeshBasicMaterial( { color: 0xff0000 } );
        const sphere    = new THREE.Mesh( geometry, material );
        list.push( sphere );
        scene.add( sphere );
    }
    objList.current = list;
    // three renderer
    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: "high-performance",
      preserveDrawingBuffer: true,
      premultipliedAlpha: false,
    });
    // three container
    const threeHandler = document.getElementById('threePanel');
    const {clientHeight,clientWidth}= threeHandler;
    renderer.setSize(clientWidth, clientHeight);
    renderer.setClearColor(0xffffff, 1.0);
    threeHandler.appendChild(renderer.domElement);
    // three camera
    const camera = new THREE.PerspectiveCamera( 45, 800/600,0.1,1000 );
    camera.position.set(-0.5, 1 , 2.5 );
    renderer.render(scene, camera);
    curRenderer.current = renderer;
    curScene.current = scene;
    curCamera.current = camera;
  }
  // reset balls position
  const renderBalls = useCallback((poseWorldLandmarks)=>{
    for( let i=0 ; i<33 ; i++ ){
      let sphere = objList.current[i];
      let coord  = convMP2WLDCoord( poseWorldLandmarks[i] );
      sphere.position.set( coord.x - 1  , coord.y + 1 , coord.z );
  }
  },objList.current)
  useEffect(()=>{
    renderThree();
    // mediapipe/pose initiation
    pose.setOptions({
      modelComplexity: 1,
      smoothLandmarks: true,
      enableSegmentation: true,
      smoothSegmentation: true,
      minDetectionConfidence: 0.5,
      minTrackingConfidence: 0.5
    });
    pose.onResults(onResults)
    sendImage();
  },[])
  return (
    <div className="App" style={{"background":"#fbe2f0"}}>
        <div style={{display:'flex','width':'80%','justifyContent':'space-between','margin':'0 auto'}}>
          <video id="video"
            ref={videoRef}
            style={{'background':'#fff','width':'400px','height':'400px','marginRight':'40px'}}
            playsInline
            controls
            disablePictureInPicture
            controlsList="nofullscreen noremoteplayback"
            src={videoSrc.default}>
          </video>
          <div id='threePanel' style={{'width':'400px','height':'400px'}}></div>  
        </div>
    </div>
  );
}

export default MediaPipeCmpt;
