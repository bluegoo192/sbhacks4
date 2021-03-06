import * as firebase from 'firebase';
import React from 'react';
import * as THREE from 'three';
import ExpoTHREE from 'expo-three';
import Expo from 'expo';
let Parse = require('./utils/parseSvg.js');
import { Constants, Location, Permissions } from 'expo';
import { StyleSheet, Text, View, Button, PanResponder, TouchableOpacity, Image } from 'react-native';

// Initialize Firebase
const firebaseConfig = {
  apiKey: "AIzaSyAOh85GjLfS7opOpKaCMWXb9oqS0XhNkeM",
  authDomain: "sbhacks4.firebaseapp.com",
  databaseURL: "https://sbhacks4.firebaseio.com",
  storageBucket: "sbhacks4.appspot.com",
  messagingSenderId: "729739022598"
};

firebase.initializeApp(firebaseConfig);

console.disableYellowBox = true;

export default class App extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      interfacePosition: 100,
      loaded: false,
      signTypes: {},
      signs: [],
      locations: {
        work: {
          latitude: 34.411514,
          longitude: -119.846795,
          altitude: 20
        },
        demo: {
          latitude: 34.411669,
          longitude: -119.847047,
          altitude: 14
        },
        test: {
          latitude: 34.411622,
          longitude: -119.846921,
          altitude: 14
        },
        stage: {
          latitude: 34.411622,
          longitude: -119.846921,
          altitude: 14
        }
      },
      camera: null,
      multiplier: 0.6,
      heading: 0,
      scene: null,
      overlayOpacity: 0,
      corwinFloor1: {
        latitude: 34.411614,
        longitude: -119.847977,
        altitude: 0
      },
      mccFloor1: {
        latitude: 34.411567,
        longitude: -119.8463,
        altitude: 0
      },
      floorPlans: [],
      floorPlanLoaded: false
    };
  }

  componentWillMount() {
    this._getLocationAsync();
    this.panResponder = PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderGrant: () => {
        this.touching = true;
        // this.setSign("oh yoyoyo");
        // var location = Location.getCurrentPositionAsync({
        //   enableHighAccuracy: true
        // }).then(function(location) {
        //   console.log("LOCATION: " + location.coords.latitude + ", " + location.coords.longitude);
        // });
        // this.setSign("bathroom");
      },
      onPanResponderRelease: () => {
        this.touching = false;
        this.validateInterfacePosition();
      },
      onPanResponderTerminate: () => {
        this.touching = false;
        this.validateInterfacePosition();
      },
      onPanResponderMove: (evt, gestureState) => {
        //console.log("swipe "+JSON.stringify(gestureState));
        if ((this.state.interfacePosition > uiOffset && gestureState.dy < 0) || this.touching) {
          this.setState({
            interfacePosition: Math.max(100 + (gestureState.dy / 3), uiOffset),
            overlayOpacity: (100 - this.state.interfacePosition) / 100
          });
        }
      },
      onShouldBlockNativeResponder: () => false,
    });
    this.loadSigns();
  }

  render() {
    return (
      <View style={{ flex: 1 }} {...this.panResponder.panHandlers}>
        <Expo.GLView
        ref={(ref) => this._glView = ref}
        style={{ flex: 1 }}
        onContextCreate={this._onGLContextCreate}/>
        <View style={{ position: 'absolute', left: 0, right: 0, top: 0, bottom: 0, backgroundColor: '#2c3e50', opacity: this.state.overlayOpacity }} />
        <View style={{ position: 'absolute', left: 0, right: 0, top: 0, bottom: 0, backgroundColor: '#2c3e50', alignItems: 'center', justifyContent: 'center', display: this.state.loaded ? 'none' : 'flex' }}>
          <Text style={{ fontFamily: 'Bodoni 72', margin: 10, alignItems: 'center', fontSize: 50, color: '#fff', fontStyle: 'italic' }}>Pathfind<Text style={{ fontWeight: 'bold', fontStyle: 'normal', fontFamily: 'Avenir' }}>AR</Text></Text>
        </View>
        <View style={{ position: 'absolute', left: 0, right: 0, justifyContent: 'center', alignItems: 'center', top: this.state.interfacePosition+'%' }}>
          <Text style={{ fontFamily: 'Bodoni 72', margin: 10, paddingBottom: 10, alignItems: 'center', fontSize: 50, color: '#fff', fontStyle: 'italic' }}>Pathfind<Text style={{ fontWeight: 'bold', fontStyle: 'normal', fontFamily: 'Avenir' }}>AR</Text></Text>
          <Text style={styles.interfaceText}>Add waypoint</Text>
          <View style={{ display: 'flex', flexDirection: 'row', width: '100%', padding: 10 }}>
            <TouchableOpacity style={styles.button} onPress={() => {this.setSign('bathroom')}}>
              <Image style={{width: 100, height: 100}} source={require('./assets/anim_restroom.gif')} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.button} onPress={() => {this.setSign('exit')}}>
              <Image style={{width: 100, height: 100}} source={require('./assets/anim_exit.gif')} />
            </TouchableOpacity>
          </View>
          <View style={{ display: 'flex', flexDirection: 'row', width: '100%', padding: 10 }}>
            <TouchableOpacity style={styles.button} onPress={() => {this.setSign('waterFountain')}}>
              <Image style={{width: 100, height: 100}} source={require('./assets/anim_water.gif')} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.button} onPress={() => {this.setSign('stairs')}}>
              <Image style={{width: 100, height: 100}} source={require('./assets/anim_stairs.gif')} />
            </TouchableOpacity>
          </View>
          <View style={{ display: 'flex', flexDirection: 'row', width: '100%', padding: 10, marginTop: 10 }}>
            <TouchableOpacity style={styles.closeButton} onPress={this.loadFloorPlan}>
              <Text style={styles.interfaceTextSmall}>Show floor plans</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.closeButton} onPress={this.closeInterface}>
              <Text style={styles.interfaceText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  }

  _getLocationAsync = async () => {
    // var app = this;
    // let { status } = await Permissions.askAsync(Permissions.LOCATION);
    // if (status !== 'granted') {
    //   this.setState({
    //     errorMessage: 'Permission to access location was denied',
    //   });
    // }
    //
    // app.setState({ location: location });
  };

  setSign = async (signType) => {
    Location.getCurrentPositionAsync({
      enableHighAccuracy: true
    }).then(function(location) {
      var id = location.coords.latitude.toString().replace(".", "-") + "&" + location.coords.longitude.toString().replace(".", "-") + "&" + location.coords.altitude.toString().replace(".", "-");
      console.log(id);
      firebase.database().ref('signs/' + id).set({
        type: signType,
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        altitude: location.coords.altitude,
        timestamp: location.timestamp
      });
    })
  }


  _onGLContextCreate = async (gl) => {
    // Do graphics stuff here!
    const arSession = await this._glView.startARSessionAsync();
    const scene = new THREE.Scene();
    const camera = ExpoTHREE.createARCamera(
      arSession,
      gl.drawingBufferWidth,
      gl.drawingBufferHeight,
      0.01,
      1000
    );
    const renderer = ExpoTHREE.createRenderer({ gl });
    renderer.setSize(gl.drawingBufferWidth, gl.drawingBufferHeight);

    scene.background = ExpoTHREE.createARBackgroundTexture(arSession, renderer);

    this.setState({
      camera: camera,
      scene: scene
    });
    var app = this;
    this.state.signs.forEach((sign) => {
      scene.add(sign);
      console.log("Added a sign");
    });
    // if (!this.state.floorPlanLoaded) {
    //   this.state.floorPlans.forEach((floorPlan => {
    //     scene.add(floorPlan);
    //   }));
    //   app.setState({floorPlanLoaded: true});
    // }

    const animate = () => {
      requestAnimationFrame(animate);
      this.state.signs.forEach((sign) => {
        sign.rotation.y += 0.015;
      });
      // this.state.floorPlans.forEach((floorPlan) => {
      //   floorPlan.rotation.z += 0.015;
      // })
      if (this.state.interfacePosition < 100 && this.state.interfacePosition > uiOffset && !this.touching) {
        this.setState({
          interfacePosition: this.state.interfacePosition - (this.state.interfacePosition / 13),
          overlayOpacity: (100 - this.state.interfacePosition) / 100
        });
      }
      renderer.render(scene, camera);
      gl.endFrameEXP();
    }
    animate();
  }

  toRadians = function(angle) {
    return angle * (Math.PI / 180);
  }


  orient = function(heading, lat, long, alt) {
    var current = this.state.locations.demo;
    var distance = this.distance(current.latitude, current.longitude, lat, long);
    var angle = this.angle(current.longitude, current.latitude, long, lat);
    var absoluteAngle = heading - (-1 * angle + 90);
    if (absoluteAngle > 180) {
      absoluteAngle -= 360;
    }
    console.log("absolute angle: " + absoluteAngle);
    var zMultiplier = -1;
    var xMultiplier = 1;
    if (absoluteAngle > 0) {
      if (absoluteAngle > 90) {
        zMultiplier = 1;
        absoluteAngle = 180 - absoluteAngle;
      }
      xMultiplier = -1;
    } else if (absoluteAngle < 0) {
      if (absoluteAngle < -90) {
        zMultiplier = 1;
        absoluteAngle += 180;
      } else {
        absoluteAngle *= -1;
      }
    }
    var z = zMultiplier * Math.cos(this.toRadians(absoluteAngle)) * distance * this.state.multiplier;
    var x = xMultiplier * Math.sin(this.toRadians(absoluteAngle)) * distance * this.state.multiplier;
    var y = (alt - current.altitude);
    return [x, y, z, distance];
  }

  distance = function(lat1, lon1, lat2, lon2) {
  	var radlat1 = Math.PI * lat1/180;
  	var radlat2 = Math.PI * lat2/180;
  	var theta = lon1-lon2;
  	var radtheta = Math.PI * theta/180;
  	var dist = Math.sin(radlat1) * Math.sin(radlat2) + Math.cos(radlat1) * Math.cos(radlat2) * Math.cos(radtheta);
  	dist = Math.acos(dist);
  	dist = dist * 180/Math.PI;
  	dist = dist * 60 * 1.1515;
    dist = dist * 5280;
  	return dist
  }

  angle = function(cx, cy, ex, ey) {
    var dy = ey - cy;
    var dx = ex - cx;
    var theta = Math.atan2(dy, dx); // range (-PI, PI]
    theta *= 180 / Math.PI; // rads to degs, range (-180, 180]
    if (theta < 0) theta = 360 + theta; // range [0, 360)
    return theta;
  }

  createSignTypes = async () => {// Create a mesh for each sign type
    let tempTypes = {};

    //bathroom
    const bathroomGeometry = new THREE.BoxGeometry(1.5, 1.5, 1.5);
    var bathroomMaterial = new THREE.MeshBasicMaterial({
      map: await ExpoTHREE.createTextureAsync({
        asset: Expo.Asset.fromModule(require('./assets/restroom_signs_unisex.jpg')),
      })
    });
    tempTypes.bathroom = {geometry: bathroomGeometry, material: bathroomMaterial};

    //exit
    const exitGeometry = new THREE.BoxGeometry(1.5, 0.8, 0.475);
    const exitMaterial = new THREE.MeshBasicMaterial({
      map: await ExpoTHREE.createTextureAsync({
        asset: Expo.Asset.fromModule(require('./assets/exit.jpg'))
      })
    });
    tempTypes.exit = {geometry: exitGeometry, material: exitMaterial};

    //water fountain
    const waterFountainGeometry = new THREE.BoxGeometry(1.5, 1.5, 1.5);
    var waterFountainMaterial = new THREE.MeshBasicMaterial({
      map: await ExpoTHREE.createTextureAsync({
        asset: Expo.Asset.fromModule(require('./assets/water_fountain.png')),
      })
    });
    tempTypes.waterFountain = {geometry: waterFountainGeometry, material: waterFountainMaterial};

    //stairs
    const stairsGeometry = new THREE.BoxGeometry(1.5, 1.5, 1.5);
    var stairsMaterial = new THREE.MeshBasicMaterial({
      map: await ExpoTHREE.createTextureAsync({
        asset: Expo.Asset.fromModule(require('./assets/stairs.png')),
      })
    });
    tempTypes.stairs = {geometry: stairsGeometry, material: stairsMaterial};

    //podium
    const podiumGeometry = new THREE.BoxGeometry(2, 2, 2);
    var podiumMaterial = new THREE.MeshBasicMaterial({
      map: await ExpoTHREE.createTextureAsync({
        asset: Expo.Asset.fromModule(require('./assets/podium.jpg')),
      })
    });
    tempTypes.podium = {geometry: podiumGeometry, material: podiumMaterial};

    //elevator
    const elevatorGeometry = new THREE.BoxGeometry(1.2, 2.1, 1.2);
    var elevatorMaterial = new THREE.MeshBasicMaterial({
      map: await ExpoTHREE.createTextureAsync({
        asset: Expo.Asset.fromModule(require('./assets/elevator.png')),
      })
    });
    tempTypes.elevator = {geometry: elevatorGeometry, material: elevatorMaterial};

    //food
    const foodGeometry = new THREE.BoxGeometry(1.2, 1.2, 1.2);
    var foodMaterial = new THREE.MeshBasicMaterial({
      map: await ExpoTHREE.createTextureAsync({
        asset: Expo.Asset.fromModule(require('./assets/food.png')),
      })
    });
    tempTypes.food = {geometry: foodGeometry, material: foodMaterial};

    //storke
    const storkeGeometry = new THREE.BoxGeometry(4, 16, 4);
    var storkeMaterial = new THREE.MeshBasicMaterial({
      map: await ExpoTHREE.createTextureAsync({
        asset: Expo.Asset.fromModule(require('./assets/storke.jpg')),
      })
    });
    tempTypes.storke = {geometry: storkeGeometry, material: storkeMaterial};

    //booth
    const boothGeometry = new THREE.BoxGeometry(1, 1, 0.3);
    var boothMaterial = new THREE.MeshBasicMaterial({
      map: await ExpoTHREE.createTextureAsync({
        asset: Expo.Asset.fromModule(require('./assets/booth.png')),
      })
    });
    tempTypes.booth = {geometry: boothGeometry, material: boothMaterial};

    this.setState({signTypes: tempTypes});
  }

  createMesh = (type) => {
    let template = this.state.signTypes[type];
    let meshTemp = new THREE.Mesh(template.geometry, template.material);
    return meshTemp;
  }

  place = (heading, mesh, sign) => {
    let app = this;
    console.log("TYPE: " + sign.type);
    let position = app.orient(heading.trueHeading, sign.latitude, sign.longitude, sign.altitude);
    var opacity = 1;

    var scale = 50 - position[3];
    if (scale < 0) {
      scale = 0;
    }
    opacity = 0.6 + 0.4 * (scale / 50);
    mesh.material.opacity = opacity;
    mesh.position.x = position[0];
    mesh.position.y = position[1];
    mesh.position.z = position[2];
    return mesh;
  }

  loadFloorPlan = async () => {
    let floorPlans = [];
    let app = this;
    let corwinFloor1geometry = new THREE.PlaneGeometry( 350, 175, 32 );
    let corwinFloor1material = new THREE.MeshLambertMaterial({
      map: await ExpoTHREE.createTextureAsync({
        asset: Expo.Asset.fromModule(require('./assets/floorplan.png')),
      }),
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.8
    });
    let corwinFloor1plane = new THREE.Mesh( corwinFloor1geometry, corwinFloor1material );
    corwinFloor1plane.rotateX(Math.PI / 2);
    corwinFloor1plane.position.y -= 4;
    let corwinFloor1position = app.orient(app.state.heading.trueHeading, app.state.corwinFloor1.latitude, app.state.corwinFloor1.longitude, app.state.corwinFloor1.altitude);
    corwinFloor1plane.position.x = corwinFloor1position[0];
    corwinFloor1plane.position.y = corwinFloor1position[1];
    corwinFloor1plane.position.z = corwinFloor1position[2];
    corwinFloor1plane.rotation.z = this.toRadians((-1 * app.state.heading.trueHeading));
    this.state.scene.add( corwinFloor1plane );
    floorPlans.push(corwinFloor1plane);

    let mccFloor1geometry = new THREE.PlaneGeometry( 150, 300, 32 );
    let mccFloor1material = new THREE.MeshLambertMaterial({
      map: await ExpoTHREE.createTextureAsync({
        asset: Expo.Asset.fromModule(require('./assets/floorplanb.png')),
      }),
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.8
    });
    let mccFloor1plane = new THREE.Mesh( mccFloor1geometry, mccFloor1material );
    mccFloor1plane.rotateX(Math.PI / 2);
    mccFloor1plane.position.y -= 4;
    let mccFloor1position = app.orient(app.state.heading.trueHeading, app.state.mccFloor1.latitude, app.state.mccFloor1.longitude, app.state.mccFloor1.altitude);
    mccFloor1plane.position.x = mccFloor1position[0];
    mccFloor1plane.position.y = mccFloor1position[1];
    mccFloor1plane.position.z = mccFloor1position[2];
    mccFloor1plane.rotation.z = this.toRadians((-1 * app.state.heading.trueHeading));
    this.state.scene.add( mccFloor1plane );
    floorPlans.push(mccFloor1plane);

    this.setState({floorPlans: floorPlans});
  }

  loadSigns = async () => {
    // if (this.state.scene) {
    //   while(this.state.scene.children.length > 0){
    //     this.state.scene.remove(this.state.scene.children[0]);
    //   }
    // }
    await this.createSignTypes();
    let heading = await Location.getHeadingAsync();
    this.setState({heading: heading});
    let signs = [];
    let app = this;
    firebase.database().ref('signs/').on('value', (snapshot) => {
      snapshot.forEach(function(childSnapshot) {
        let childData = childSnapshot.val();
        let mesh = app.createMesh(childData.type);
        signs.push(app.place(heading, mesh, childData));
        if (app.state.scene) {
          app.state.scene.add(mesh);
        }
      });
      console.log("signs: "+signs.length);
      app.setState({signs: signs, loaded: true});
    });
  }

  validateInterfacePosition = () => {
    if (this.state.interfacePosition < uiOffset) {
      this.setState({interfacePosition: uiOffset, overlayOpacity: 0.6});
    }
    if (this.state.interfacePosition > 100) {
      this.setState({interfacePosition: 100, overlayOpacity: 0});
    }
  }

  closeInterface = () => {
    console.log("pressed close interface");
    this.setState({interfacePosition: 100, overlayOpacity: 0});
  }

}

const uiOffset = 15;

const styles = StyleSheet.create({
  button: {
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    //backgroundColor: '#27ae60',
    // padding: 10,
    // margin: 10
  },
  closeButton: {
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#ecf0f1',
    justifyContent: 'center',
    padding: 10,
    margin: 10
  },
  interfaceText: {
    color: '#ecf0f1',
    fontSize: 20
  },
  interfaceTextSmall: {
    color: '#ecf0f1',
    fontSize: 16
  }
});
