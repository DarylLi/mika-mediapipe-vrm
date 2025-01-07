import React, { useCallback, useEffect, useRef, useState } from "react";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { Pose } from "@mediapipe/pose";
import * as THREE from "three";
import { VRMLoaderPlugin } from "@pixiv/three-vrm";

function MediaPipeCmpt() {
  // video dom
  const videoRef = useRef(null);
  const videoSrc = require("./doctor.mp4");
  // handle @media/pipe result
  const onResults = (results) => {
    if (!results.poseLandmarks) {
      return;
    }
    renderBalls(results.poseWorldLandmarks);
    renderVrm(results);
    curRenderer.current.render(curScene.current, curCamera.current);
  };
  // pose instance
  const [pose, setPose] = useState(
    new Pose({
      locateFile: (file) => {
        return `https://cdn.jsdelivr.net/npm/@mediapipe/pose/${file}`;
      },
    })
  );
  // three ball list
  const objList = useRef([]);
  // three renderer
  const curRenderer = useRef(null);
  // three scene
  const curScene = useRef(null);
  // three camera
  const curCamera = useRef(null);
  // vrm
  const curVrm = useRef(null);
  // initHip
  const _initHip = useRef(null);
  // parse video per frame image by pose instance
  const sendImage = async () => {
    const video = videoRef.current;
    if (video.duration == video.currentTime) {
      return;
    }
    await pose.send({ image: video });
    requestAnimationFrame(sendImage);
  };
  // three.js initiation
  const renderThree = async () => {
    //three scene
    const scene = new THREE.Scene();
    //three ball objects
    const list = [];
    for (let i = 0; i < 34; i++) {
      const geometry = new THREE.SphereGeometry(0.01, 32, 16);
      const material = new THREE.MeshBasicMaterial({ color: 0xff0000 });
      const sphere = new THREE.Mesh(geometry, material);
      list.push(sphere);
      scene.add(sphere);
    }
    objList.current = list;
    const loader = new GLTFLoader();
    // Install a GLTFLoader plugin that enables VRM support
    loader.register((parser) => {
      return new VRMLoaderPlugin(parser);
    });
    loader.load(
      // URL of the VRM you want to load
      "sample.vrm",
      // called when the resource is loaded
      (gltf) => {
        // retrieve a VRM instance from gltf
        const vrm = gltf.userData.vrm;

        // add the loaded vrm to the scene
        scene.add(vrm.scene);

        // deal with vrm features
        curVrm.current = vrm;
        console.log(vrm);
      },

      // called while loading is progressing
      (progress) =>
        console.log(
          "Loading model...",
          100.0 * (progress.loaded / progress.total),
          "%"
        ),

      // called when loading has errors
      (error) => console.error(error)
    );
    const light = new THREE.DirectionalLight(0xffffff, Math.PI);
    light.position.set(1.0, 1.0, 1.0).normalize();
    scene.add(light);
    // three renderer
    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: "high-performance",
      preserveDrawingBuffer: true,
      premultipliedAlpha: false,
    });
    // three container
    const threeHandler = document.getElementById("threePanel");
    const { clientHeight, clientWidth } = threeHandler;
    renderer.setSize(clientWidth, clientHeight);
    renderer.setClearColor(0xffffff, 1.0);
    threeHandler.appendChild(renderer.domElement);
    // three camera
    const camera = new THREE.PerspectiveCamera(45, 800 / 600, 0.1, 1000);
    camera.position.set(-0.5, 1, 2.5);
    renderer.render(scene, camera);
    curRenderer.current = renderer;
    curScene.current = scene;
    curCamera.current = camera;
  };
  // reset balls position
  const renderBalls = useCallback((poseWorldLandmarks) => {
    for (let i = 0; i < 33; i++) {
      let sphere = objList.current[i];
      let coord = convMP2WLDCoord(poseWorldLandmarks[i]);
      sphere.position.set(coord.x - 1, coord.y + 1, coord.z);
    }
  }, objList.current);
  // mediapipe位置点map
  const MP_POSE = {
    nose: 0,
    left_eye_inner: 1,
    left_eye: 2,
    left_eye_outer: 3,
    right_eye_inner: 4,
    right_eye: 5,
    right_eye_outer: 6,
    left_ear: 7,
    right_ear: 8,
    mouth_left: 9,
    mouth_right: 10,
    left_shoulder: 11,
    right_shoulder: 12,
    left_elbow: 13,
    right_elbow: 14,
    left_wrist: 15,
    right_wrist: 16,
    left_pinky: 17,
    right_pinky: 18,
    left_index: 19,
    right_index: 20,
    left_thumb: 21,
    right_thumb: 22,
    left_hip: 23,
    right_hip: 24,
    left_knee: 25,
    right_knee: 26,
    left_ankle: 27,
    right_ankle: 28,
    left_heel: 29,
    right_heel: 30,
    left_foot_index: 31,
    right_foot_index: 32,
  };

  // 位置坐标系使用vrm坐标系
  const convMP2VRMCoord = (coord) => {
    return new THREE.Vector3(-1 * coord.x, -1 * coord.y, coord.z);
  };

  // mediapipe坐标转换为threejs坐标
  const convMP2WLDCoord = (coord) => {
    return new THREE.Vector3(coord.x, -1 * coord.y, -1 * coord.z);
  };

  // mediapipe坐标转化为three-vrm模型坐标系坐标
  const convToVRMPose = (hipPose, mp_coord) => {
    let vecUp = new THREE.Vector3(0, 1, 0);
    let vecDown = new THREE.Vector3(0, -1, 0);
    let vecRight = new THREE.Vector3(1, 0, 0);
    let vecLeft = new THREE.Vector3(-1, 0, 0);
    let vecFront = new THREE.Vector3(0, 0, -1);
    let vecBack = new THREE.Vector3(0, 0, 1);

    // 起点
    let posHip = new THREE.Vector3(0, 0, 0);
    let posLHip = convMP2VRMCoord(mp_coord[MP_POSE.left_hip]);
    let posRHip = convMP2VRMCoord(mp_coord[MP_POSE.right_hip]);
    // 下半身
    let posLKnee = convMP2VRMCoord(mp_coord[25]);
    let posRKnee = convMP2VRMCoord(mp_coord[MP_POSE.right_knee]);
    let posLAnkle = convMP2VRMCoord(mp_coord[MP_POSE.left_ankle]);
    let posRAnkle = convMP2VRMCoord(mp_coord[MP_POSE.right_ankle]);
    let posLHeel = convMP2VRMCoord(mp_coord[MP_POSE.left_heel]);
    let posRHeel = convMP2VRMCoord(mp_coord[MP_POSE.right_heel]);
    let posLToes = convMP2VRMCoord(mp_coord[MP_POSE.left_foot_index]);
    let posRToes = convMP2VRMCoord(mp_coord[MP_POSE.right_foot_index]);
    // 上半身
    let posSpine = posHip.clone(); // MPにないため、代用
    let posLShoulder = convMP2VRMCoord(mp_coord[MP_POSE.left_shoulder]);
    let posRShoulder = convMP2VRMCoord(mp_coord[MP_POSE.right_shoulder]);
    let posNeck = posLShoulder.clone().add(posRShoulder).divideScalar(2);
    // 面部
    let posLInnerEye = convMP2VRMCoord(mp_coord[MP_POSE.left_eye_inner]);
    let posRInnerEye = convMP2VRMCoord(mp_coord[MP_POSE.right_eye_inner]);
    let posCenterEye = posLInnerEye.clone().add(posRInnerEye).divideScalar(2);
    // 嘴部
    let posLMouth = convMP2VRMCoord(mp_coord[MP_POSE.mouth_left]);
    let posRMouth = convMP2VRMCoord(mp_coord[MP_POSE.mouth_right]);
    let posCenterMouth = posLMouth.clone().add(posRMouth).divideScalar(2);
    // 手臂及腕部以及辅助点位
    let posLElbow = convMP2VRMCoord(mp_coord[MP_POSE.left_elbow]);
    let posRElbow = convMP2VRMCoord(mp_coord[MP_POSE.right_elbow]);
    let posLWrist = convMP2VRMCoord(mp_coord[MP_POSE.left_wrist]);
    let posRWrist = convMP2VRMCoord(mp_coord[MP_POSE.right_wrist]);
    let posLIndex = convMP2VRMCoord(mp_coord[MP_POSE.left_index]);
    let posLPinky = convMP2VRMCoord(mp_coord[MP_POSE.left_pinky]);
    let posLMiddle = posLIndex.clone().add(posLPinky).divideScalar(2);
    let posRIndex = convMP2VRMCoord(mp_coord[MP_POSE.right_index]);
    let posRPinky = convMP2VRMCoord(mp_coord[MP_POSE.right_pinky]);
    let posRMiddle = posRIndex.clone().add(posRPinky).divideScalar(2);
    let vrmPose = {};

    // 基本点转动
    let rotHip = new THREE.Quaternion()
      .setFromAxisAngle(new THREE.Vector3(0, 1, 0), Math.PI)
      .multiply(getQuaternion(vecRight, posRHip.clone().sub(posLHip)));
    vrmPose.hips = { position: hipPose.toArray(), rotation: rotHip.toArray() };

    // 各个关节旋转角度计算
    // 大腿
    vrmPose.leftUpperLeg = {
      rotation: getQuaternion(vecDown, posLKnee.clone().sub(posLHip)).toArray(),
    };
    vrmPose.rightUpperLeg = {
      rotation: getQuaternion(vecDown, posRKnee.clone().sub(posRHip)).toArray(),
    };
    // 膝关节
    vrmPose.leftLowerLeg = {
      rotation: getQuaternion(
        posLKnee.clone().sub(posLHip),
        posLAnkle.clone().sub(posLKnee)
      ).toArray(),
    };
    vrmPose.rightLowerLeg = {
      rotation: getQuaternion(
        posRKnee.clone().sub(posRHip),
        posRAnkle.clone().sub(posRKnee)
      ).toArray(),
    };
    // 足
    vrmPose.leftFoot = {
      rotation: getQuaternion(
        vecFront,
        posLToes.clone().sub(posLHeel)
      ).toArray(),
    };
    vrmPose.rightFoot = {
      rotation: getQuaternion(
        vecFront,
        posRToes.clone().sub(posRHeel)
      ).toArray(),
    };
    // 脊椎
    vrmPose.spine = {
      rotation: getQuaternion(vecUp, posNeck.clone().sub(posSpine)).toArray(),
    };
    // 颈部
    vrmPose.neck = {
      rotation: getQuaternion(
        posNeck.clone().sub(posSpine),
        posCenterEye.clone().sub(posCenterMouth)
      ).toArray(),
    };
    // 胸
    vrmPose.chest = {
      rotation: getQuaternion(
        posLHip.clone().sub(posRHip),
        posLShoulder.clone().sub(posRShoulder)
      ).toArray(),
    };
    // 肩
    vrmPose.leftUpperArm = {
      rotation: getQuaternion(
        vecLeft,
        posLElbow.clone().sub(posLShoulder)
      ).toArray(),
    };
    vrmPose.rightUpperArm = {
      rotation: getQuaternion(
        vecRight,
        posRElbow.clone().sub(posRShoulder)
      ).toArray(),
    };
    // 肘
    vrmPose.leftLowerArm = {
      rotation: getQuaternion(
        posLElbow.clone().sub(posLShoulder),
        posLWrist.clone().sub(posLElbow)
      ).toArray(),
    };
    vrmPose.rightLowerArm = {
      rotation: getQuaternion(
        posRElbow.clone().sub(posRShoulder),
        posRWrist.clone().sub(posRElbow)
      ).toArray(),
    };
    // 手
    vrmPose.leftHand = {
      rotation: getQuaternion(
        posLWrist.clone().sub(posLElbow),
        posLMiddle.clone().sub(posLWrist)
      ).toArray(),
    };
    vrmPose.rightHand = {
      rotation: getQuaternion(
        posRWrist.clone().sub(posRElbow),
        posRMiddle.clone().sub(posRWrist)
      ).toArray(),
    };

    return vrmPose;
  };

  // 根据前后点位计算Quaternion四元数转换
  function getQuaternion(vecA, vecB) {
    //from point A ==> point B
    let vecUnitA = vecA.clone().normalize();
    let vecUnitB = vecB.clone().normalize();

    // 旋转轴计算
    let vecNormal = new THREE.Vector3();
    vecNormal.crossVectors(vecUnitA, vecUnitB).normalize();

    // 旋转角度
    let rad = vecUnitA.angleTo(vecUnitB);

    // get Quaternion
    let q = new THREE.Quaternion();
    q.setFromAxisAngle(vecNormal, rad);

    // 旋转角度象限确定（坐标系4个象限）
    let dot = vecUnitA.dot(vecUnitB);
    if (dot > 0) {
      //1，4象限
      rad = rad; // 初始为第1象限

      //  旋转轴反转检测
      let vec = vecUnitA.clone().applyQuaternion(q);
      if (vec.angleTo(vecUnitB) > rad) {
        //反转
        rad = 2 * Math.PI - rad;
        //console.log("第4象限",rad,rad * 180 / Math.PI);
      } else {
        //console.log("第１象限",rad,rad * 180 / Math.PI , vec.angleTo( vecUnitB )*180/Math.PI);
      }
    } else {
      // 2，3象限
      rad = rad; // 初始第2象限

      // 旋转轴反转检测
      let vec = vecUnitA.clone().applyQuaternion(q);
      if (vec.angleTo(vecUnitB) > rad) {
        //反转
        rad = 2 * Math.PI - rad;
        //console.log("第3象限",rad,rad * 180 / Math.PI);
      } else {
        //console.log("第2象限",rad,rad * 180 / Math.PI , vec.angleTo( vecUnitB )*180/Math.PI);
      }
    }

    // 根据上述旋转结果重计算Quaternion
    q = new THREE.Quaternion().setFromAxisAngle(vecNormal, rad);

    return q;
  }
  // 获取实时原点位置
  const getHipPos = (results) => {
    let hipPos = null;
    let landmarks = results.poseLandmarks;
    let posLHip = landmarks[MP_POSE.left_hip];
    let posRHip = landmarks[MP_POSE.right_hip];
    let x = (posLHip.x + posRHip.x) / 2;
    let y = (posLHip.y + posRHip.y) / 2;
    let z = (posLHip.z + posRHip.z) / 2;
    let initHip = _initHip.current;
    if (initHip == null) {
      initHip = new THREE.Vector3(x, y, z);
      hipPos = new THREE.Vector3(0, 0, 0);
    } else {
      let relateX = initHip.x - x;
      let relateY = initHip.y - y;
      let relateZ = initHip.z - z;
      hipPos = new THREE.Vector3(relateX, relateY, relateZ);
    }

    // 原点位置变更
    hipPos.set(-hipPos.x, hipPos.y, hipPos.z);

    return hipPos;
  };
  // vrm rerender
  const renderVrm = (results) => {
    if (curVrm.current != null) {
      let hipPos = getHipPos(results);
      curVrm.current.humanoid.setPose(
        convToVRMPose(hipPos, results.poseWorldLandmarks)
      );
    }
  };
  useEffect(() => {
    renderThree();
    // mediapipe/pose initiation
    pose.setOptions({
      modelComplexity: 1,
      smoothLandmarks: true,
      enableSegmentation: true,
      smoothSegmentation: true,
      minDetectionConfidence: 0.5,
      minTrackingConfidence: 0.5,
    });
    pose.onResults(onResults);
    sendImage();
  }, []);
  return (
    <div className="App" style={{ background: "#fff" }}>
      <div
        style={{
          display: "flex",
          width: "80%",
          flexDirection: "column",
          margin: "0 auto",
        }}
      >
        <video
          id="video"
          ref={videoRef}
          style={{
            position: "absolute",
            top: "154px",
            left: "80px",
            background: "#fff",
            width: "400px",
            height: "400px",
            marginRight: "40px",
          }}
          playsInline
          controls
          disablePictureInPicture
          controlsList="nofullscreen noremoteplayback"
          src={videoSrc.default}
        ></video>
        <div
          id="threePanel"
          style={{ marginLeft: "250px", width: "1142px", height: "750px" }}
        ></div>
      </div>
    </div>
  );
}

export default MediaPipeCmpt;
