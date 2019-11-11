import * as THREE from 'libs/three.js'

var Colors = {
  red: 0xf25346,
  white: 0xd8d0d1,
  brown: 0x59332e,
  pink: 0xF5986E,
  brownDark: 0x23190f,
  blue: 0x68c3c0,
  bg: 0xe5e0ba
};

var WIDTH = window.innerWidth;
var HEIGHT = window.innerHeight;;

var Sea = function () {

  // 创建一个圆柱几何体
  // 参数为：顶面半径，底面半径，高度，半径分段，高度分段
  var geom = new THREE.CylinderGeometry(600, 600, 800, 40, 10);

  // 在 x 轴旋转几何体
  geom.applyMatrix(new THREE.Matrix4().makeRotationX(-Math.PI / 2));

  // 重点：通过合并顶点，确保海浪的连续性
  geom.mergeVertices();

  // 获得顶点
  var l = geom.vertices.length;

  // 创建一个新的数组存储与每个顶点关联的值：
  this.waves = [];

  for (var i = 0; i < l; i++) {
    // 获取每个顶点
    var v = geom.vertices[i];

    // 存储一些关联的数值
    this.waves.push({
      y: v.y,
      x: v.x,
      z: v.z,
      // 随机角度
      ang: Math.random() * Math.PI * 2,
      // 随机距离
      amp: 5 + Math.random() * 15,
      // 在0.016至0.048度/帧之间的随机速度
      speed: 0.016 + Math.random() * 0.032
    });
  };

  // 创建材质
  var mat = new THREE.MeshPhongMaterial({
    color: Colors.blue,
    transparent: true,
    opacity: .8,
    shading: THREE.FlatShading,
  });

  this.mesh = new THREE.Mesh(geom, mat);

  // 允许大海对象接收阴影
  this.mesh.receiveShadow = true;
}
Sea.prototype.moveWaves = function () {

  // 获取顶点
  var verts = this.mesh.geometry.vertices;
  var l = verts.length;

  for (var i = 0; i < l; i++) {
    var v = verts[i];

    // 获取关联的值
    var vprops = this.waves[i];

    // 更新顶点的位置
    v.x = vprops.x + Math.cos(vprops.ang) * vprops.amp;
    v.y = vprops.y + Math.sin(vprops.ang) * vprops.amp;

    // 下一帧自增一个角度
    vprops.ang += vprops.speed;
  }

  // 告诉渲染器代表大海的几何体发生改变
  // 事实上，为了维持最好的性能
  // Three.js 会缓存几何体和忽略一些修改
  // 除非加上这句
  this.mesh.geometry.verticesNeedUpdate = true;

  this.mesh.rotation.z += .005;
}
var Cloud = function () {
  // 创建一个空的容器放置不同形状的云
  this.mesh = new THREE.Object3D();

  // 创建一个正方体
  // 这个形状会被复制创建云
  var geom = new THREE.BoxGeometry(20, 20, 20);

  // 创建材质；一个简单的白色材质就可以达到效果
  var mat = new THREE.MeshPhongMaterial({
    color: Colors.white,
  });

  // 随机多次复制几何体
  var nBlocs = 3 + Math.floor(Math.random() * 3);
  for (var i = 0; i < nBlocs; i++) {

    // 通过复制几何体创建网格
    var m = new THREE.Mesh(geom, mat);

    // 随机设置每个正方体的位置和旋转角度
    m.position.x = i * 15;
    m.position.y = Math.random() * 10;
    m.position.z = Math.random() * 10;
    m.rotation.z = Math.random() * Math.PI * 2;
    m.rotation.y = Math.random() * Math.PI * 2;

    // 随机设置正方体的大小
    var s = .1 + Math.random() * .9;
    m.scale.set(s, s, s);

    // 允许每个正方体生成投影和接收阴影
    m.castShadow = true;
    m.receiveShadow = true;

    // 将正方体添加至开始时创建的容器中
    this.mesh.add(m);
  }
}
var Sky = function () {
  // 创建一个空的容器
  this.mesh = new THREE.Object3D();

  // 选取若干朵云散布在天空中
  this.nClouds = 20;

  // 把云均匀地散布
  // 需要根据统一的角度放置它们
  var stepAngle = Math.PI * 2 / this.nClouds;

  // 创建云对象
  for (var i = 0; i < this.nClouds; i++) {
    var c = new Cloud();

    // 设置每朵云的旋转角度和位置
    // 因此使用了一点三角函数
    var a = stepAngle * i; //这是云的最终角度
    var h = 750 + Math.random() * 200; // 这是轴的中心和云本身之间的距离

    // 三角函数！！！希望你还记得数学学过的东西 :)
    // 假如你不记得: 
    // 简单地把极坐标转换成笛卡坐标
    c.mesh.position.y = Math.sin(a) * h;
    c.mesh.position.x = Math.cos(a) * h;

    // 根据云的位置旋转它
    c.mesh.rotation.z = a + Math.PI / 2;

    // 为了有更好的效果，把云放置在场景中的随机深度位置
    c.mesh.position.z = -400 - Math.random() * 400;

    // 为每朵云设置一个随机大小
    var s = 1 + Math.random() * 2;
    c.mesh.scale.set(s, s, s);

    // 不要忘记将每朵云的网格添加到场景中
    this.mesh.add(c.mesh);
  }
}
var AirPlane = function () {

  this.mesh = new THREE.Object3D();

  // 创建机舱
  var geomCockpit = new THREE.BoxGeometry(80, 50, 50, 1, 1, 1);
  var matCockpit = new THREE.MeshPhongMaterial({
    color: Colors.red,
    shading: THREE.FlatShading
  });
  // 可以通过访问形状中顶点数组中一组特定的顶点
  // 然后移动它的 x, y, z 属性:
  geomCockpit.vertices[4].y -= 10;
  geomCockpit.vertices[4].z += 20;
  geomCockpit.vertices[5].y -= 10;
  geomCockpit.vertices[5].z -= 20;
  geomCockpit.vertices[6].y += 30;
  geomCockpit.vertices[6].z += 20;
  geomCockpit.vertices[7].y += 30;
  geomCockpit.vertices[7].z -= 20;

  var cockpit = new THREE.Mesh(geomCockpit, matCockpit);
  cockpit.castShadow = true;
  cockpit.receiveShadow = true;
  this.mesh.add(cockpit);

  // 创建引擎
  var geomEngine = new THREE.BoxGeometry(20, 50, 50, 1, 1, 1);
  var matEngine = new THREE.MeshPhongMaterial({
    color: Colors.white,
    shading: THREE.FlatShading
  });
  var engine = new THREE.Mesh(geomEngine, matEngine);
  engine.position.x = 40;
  engine.castShadow = true;
  engine.receiveShadow = true;
  this.mesh.add(engine);

  // 创建机尾
  var geomTailPlane = new THREE.BoxGeometry(15, 20, 5, 1, 1, 1);
  var matTailPlane = new THREE.MeshPhongMaterial({
    color: Colors.red,
    shading: THREE.FlatShading
  });
  var tailPlane = new THREE.Mesh(geomTailPlane, matTailPlane);
  tailPlane.position.set(-35, 25, 0);
  tailPlane.castShadow = true;
  tailPlane.receiveShadow = true;
  this.mesh.add(tailPlane);

  // 创建机翼
  var geomSideWing = new THREE.BoxGeometry(40, 8, 150, 1, 1, 1);
  var matSideWing = new THREE.MeshPhongMaterial({
    color: Colors.red,
    shading: THREE.FlatShading
  });
  var sideWing = new THREE.Mesh(geomSideWing, matSideWing);
  sideWing.castShadow = true;
  sideWing.receiveShadow = true;
  this.mesh.add(sideWing);

  // 创建螺旋桨
  var geomPropeller = new THREE.BoxGeometry(20, 10, 10, 1, 1, 1);
  var matPropeller = new THREE.MeshPhongMaterial({
    color: Colors.brown,
    shading: THREE.FlatShading
  });
  this.propeller = new THREE.Mesh(geomPropeller, matPropeller);
  this.propeller.castShadow = true;
  this.propeller.receiveShadow = true;

  // 创建螺旋桨的桨叶
  var geomBlade = new THREE.BoxGeometry(1, 100, 20, 1, 1, 1);
  var matBlade = new THREE.MeshPhongMaterial({
    color: Colors.brownDark,
    shading: THREE.FlatShading
  });

  var blade = new THREE.Mesh(geomBlade, matBlade);
  blade.position.set(8, 0, 0);
  blade.castShadow = true;
  blade.receiveShadow = true;
  this.propeller.add(blade);
  this.propeller.position.set(50, 0, 0);
  this.mesh.add(this.propeller);

  this.pilot = new Pilot();
  this.pilot.mesh.position.set(-10, 27, 0);
  this.mesh.add(this.pilot.mesh);
};
var Pilot = function () {
  this.mesh = new THREE.Object3D();
  this.mesh.name = "pilot";

  // angleHairs是用于后面头发的动画的属性 
  this.angleHairs = 0;

  // 飞行员的身体
  var bodyGeom = new THREE.BoxGeometry(15, 15, 15);
  var bodyMat = new THREE.MeshPhongMaterial({ color: Colors.brown, shading: THREE.FlatShading });
  var body = new THREE.Mesh(bodyGeom, bodyMat);
  body.position.set(2, -12, 0);
  this.mesh.add(body);

  // 飞行员的脸部
  var faceGeom = new THREE.BoxGeometry(10, 10, 10);
  var faceMat = new THREE.MeshLambertMaterial({ color: Colors.pink });
  var face = new THREE.Mesh(faceGeom, faceMat);
  this.mesh.add(face);

  // 飞行员的头发
  var hairGeom = new THREE.BoxGeometry(4, 4, 4);
  var hairMat = new THREE.MeshLambertMaterial({ color: Colors.brown });
  var hair = new THREE.Mesh(hairGeom, hairMat);
  // 调整头发的形状至底部的边界，这将使它更容易扩展。
  hair.geometry.applyMatrix(new THREE.Matrix4().makeTranslation(0, 2, 0));

  // 创建一个头发的容器
  var hairs = new THREE.Object3D();

  // 创建一个头发顶部的容器（这会有动画效果）
  this.hairsTop = new THREE.Object3D();

  // 创建头顶的头发并放置他们在一个3*4的网格中
  for (var i = 0; i < 12; i++) {
    var h = hair.clone();
    var col = i % 3;
    var row = Math.floor(i / 3);
    var startPosZ = -4;
    var startPosX = -4;
    h.position.set(startPosX + row * 4, 0, startPosZ + col * 4);
    this.hairsTop.add(h);
  }
  hairs.add(this.hairsTop);

  // 创建脸庞的头发
  var hairSideGeom = new THREE.BoxGeometry(12, 4, 2);
  hairSideGeom.applyMatrix(new THREE.Matrix4().makeTranslation(-6, 0, 0));
  var hairSideR = new THREE.Mesh(hairSideGeom, hairMat);
  var hairSideL = hairSideR.clone();
  hairSideR.position.set(8, -2, 6);
  hairSideL.position.set(8, -2, -6);
  hairs.add(hairSideR);
  hairs.add(hairSideL);

  // 创建后脑勺的头发
  var hairBackGeom = new THREE.BoxGeometry(2, 8, 10);
  var hairBack = new THREE.Mesh(hairBackGeom, hairMat);
  hairBack.position.set(-1, -4, 0)
  hairs.add(hairBack);
  hairs.position.set(-5, 5, 0);

  this.mesh.add(hairs);

  var glassGeom = new THREE.BoxGeometry(5, 5, 5);
  var glassMat = new THREE.MeshLambertMaterial({ color: Colors.brown });
  var glassR = new THREE.Mesh(glassGeom, glassMat);
  glassR.position.set(6, 0, 3);
  var glassL = glassR.clone();
  glassL.position.z = -glassR.position.z;

  var glassAGeom = new THREE.BoxGeometry(11, 1, 11);
  var glassA = new THREE.Mesh(glassAGeom, glassMat);
  this.mesh.add(glassR);
  this.mesh.add(glassL);
  this.mesh.add(glassA);

  var earGeom = new THREE.BoxGeometry(2, 3, 2);
  var earL = new THREE.Mesh(earGeom, faceMat);
  earL.position.set(0, 0, -6);
  var earR = earL.clone();
  earR.position.set(0, 0, 6);
  this.mesh.add(earL);
  this.mesh.add(earR);
}
Pilot.prototype.updateHairs = function () {

  // 获得头发
  var hairs = this.hairsTop.children;

  // 根据 angleHairs 的角度更新头发
  var l = hairs.length;
  for (var i = 0; i < l; i++) {
    var h = hairs[i];
    // 每根头发将周期性的基础上原始大小的75%至100%之间作调整。
    h.scale.y = .75 + Math.cos(this.angleHairs + i / 3) * .25;
  }
  // 在下一帧增加角度
  this.angleHairs += 0.16;
}

// ... 其它变量／常量 ...

/**
 * 游戏主函数
 */
export default class Main {
  constructor() {
    // 创建场景，相机和渲染器
    this.createScene();
    // 添加光源
    this.createLights();
    this.start()
  }
  createScene() {
    var scene, camera, fieldOfView, aspectRatio, nearPlane, farPlane, renderer;

    // 创建场景
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0xe5e0ba);
    scene.fog = new THREE.Fog(0xf7d9aa, 100, 950);

    this.scene = scene;

    // 创建相机
    aspectRatio = WIDTH / HEIGHT;
    fieldOfView = 60;
    nearPlane = 1;
    farPlane = 10000;
    camera = new THREE.PerspectiveCamera(
      fieldOfView,
      aspectRatio,
      nearPlane,
      farPlane
    );
    // 设置相机的位置
    camera.position.x = 0;
    camera.position.z = 200;
    camera.position.y = 100;
    this.camera = camera;

    // 创建渲染器
    renderer = new THREE.WebGLRenderer({
      alpha: true, // 在 css 中设置背景色透明显示渐变色
      antialias: true, // 开启抗锯齿
      canvas: canvas
    });
    renderer.setSize(WIDTH, HEIGHT);
    // 打开渲染器的阴影地图
    renderer.shadowMap.enabled = true;
    renderer.autoClear = false;
    this.renderer = renderer;
  }
  createLights() {
    var hemisphereLight, shadowLight, ambientLight;

    // 半球光就是渐变的光；
    // 第一个参数是天空的颜色，第二个参数是地上的颜色，第三个参数是光源的强度
    hemisphereLight = new THREE.HemisphereLight(0xaaaaaa, 0x000000, .9);

    // 方向光是从一个特定的方向的照射
    // 类似太阳，即所有光源是平行的
    // 第一个参数是关系颜色，第二个参数是光源强度
    shadowLight = new THREE.DirectionalLight(0xffffff, .9);

    // 设置光源的方向。  
    // 位置不同，方向光作用于物体的面也不同，看到的颜色也不同
    shadowLight.position.set(150, 350, 350);

    // 开启光源投影 
    shadowLight.castShadow = true;

    // 定义可见域的投射阴影
    shadowLight.shadow.camera.left = -400;
    shadowLight.shadow.camera.right = 400;
    shadowLight.shadow.camera.top = 400;
    shadowLight.shadow.camera.bottom = -400;
    shadowLight.shadow.camera.near = 1;
    shadowLight.shadow.camera.far = 1000;

    // 定义阴影的分辨率；虽然分辨率越高越好，但是需要付出更加昂贵的代价维持高性能的表现。
    shadowLight.shadow.mapSize.width = 2048;
    shadowLight.shadow.mapSize.height = 2048;

    this.hemisphereLight = hemisphereLight
    this.shadowLight = shadowLight;

    // 环境光源修改场景中的全局颜色和使阴影更加柔和
    ambientLight = new THREE.AmbientLight(0xdc8874, .3);
    this.ambientLight = ambientLight;

    // 为了使这些光源呈现效果，只需要将它们添加到场景中
    this.scene.add(this.hemisphereLight);
    this.scene.add(this.shadowLight);
    this.scene.add(this.ambientLight);

  }
  createPlane() {
    var airplane;
    airplane = new AirPlane();
    airplane.mesh.scale.set(.25, .25, .25);
    airplane.mesh.position.y = 100;
    //console.log(airplane);
    this.airplane = airplane;
    this.scene.add(this.airplane.mesh);
  }
  createSea() {
    var sea;
    sea = new Sea();
    sea.mesh.position.y = -600;
    //console.log(sea);
    this.sea = sea;
    // 添加大海的网格至场景
    this.scene.add(this.sea.mesh);
  }
  createSky() {
    var sky;
    sky = new Sky();
    sky.mesh.position.y = -600;
    this.sky = sky.mesh;
    this.scene.add(this.sky);
  }

  updatePlane() {
    this.airplane.propeller.rotation.x += 0.3;
    this.airplane.pilot.updateHairs();
  }

  start() {
    // 添加对象 
    this.createPlane();
    this.createSea();
    this.createSky();

    window.requestAnimationFrame(this.loop.bind(this), canvas);
  }
  update() {
    // 转动大海和云
    this.sea.mesh.rotation.z += .005;
    this.sky.rotation.z += .01;

    // 更新每帧的飞机
    this.updatePlane();

    // 更新每帧的海浪
    this.sea.moveWaves();
  }
  loop() {
    this.update()
    this.renderer.render(this.scene, this.camera);
    window.requestAnimationFrame(this.loop.bind(this), canvas);
  }
}
