import * as firebase from 'firebase';
import React from 'react';
import * as THREE from 'three';
import ExpoTHREE from 'expo-three';
import Expo from 'expo';
import { Constants, Location, Permissions } from 'expo';
import { StyleSheet, Text, View, Button, PanResponder, TouchableOpacity, Picker } from 'react-native';

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
          latitude: 34.411514,
          longitude: -119.846795,
          altitude: 20
        },
        stage: {
          latitude: 34.411514,
          longitude: -119.846795,
          altitude: 20
        },
      },
      camera: null,
      multiplier: 0.5,
      scene: null
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
        if (this.state.interfacePosition > 30 && gestureState.dy < 0) {
          this.setState({interfacePosition: Math.max(100 + (gestureState.dy / 2), 30) });
        }
      },
      onShouldBlockNativeResponder: () => false,
    });
    this.loadSigns();
  }

  render() {
    return (
      <View style={{ flex: 1 }}>
        <Expo.GLView
        {...this.panResponder.panHandlers}
        ref={(ref) => this._glView = ref}
        style={{ flex: 1 }}
        onContextCreate={this._onGLContextCreate}/>
        <View style={{ position: 'absolute', left: 0, right: 0, justifyContent: 'center', alignItems: 'center', top: this.state.interfacePosition+'%' }}>
          <Text style={{ color: '#fff', fontSize: 30, fontWeight: 'bold', marginBottom: 10 }}>PathfindAR</Text>
          <Text style={styles.interfaceText}>Add waypoint</Text>
          <View style={{ display: 'flex', flexDirection: 'row', width: '100%', padding: 10 }}>
            <TouchableOpacity style={styles.button} onPress={() => {this.setSign('bathroom')}}>
              <Text style={styles.interfaceText}>Bathroom</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.button} onPress={() => {this.setSign('exit')}}>
              <Text style={styles.interfaceText}>Exit</Text>
            </TouchableOpacity>
          </View>
          <TouchableOpacity style={styles.closeButton} onPress={this.closeInterface}>
            <Text style={styles.interfaceText}>Close</Text>
          </TouchableOpacity>
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

    const animate = () => {
      requestAnimationFrame(animate);
      this.state.signs.forEach((sign) => {
        sign.rotation.y += 0.015;
      })
      renderer.render(scene, camera);
      gl.endFrameEXP();
    }
    animate();
  }

  toRadians = function(angle) {
    return angle * (Math.PI / 180);
  }


  orient = function(heading, lat, long, alt) {
    console.log("heading is " + heading);
    var current = this.state.locations.work;
    var distance = this.distance(current.latitude, current.longitude, lat, long);
    console.log("distance is " + distance);
    var angle = this.angle(current.longitude, current.latitude, long, lat);
    console.log("angle is " + angle);
    var absoluteAngle = heading - (-1 * angle + 90);
    if (absoluteAngle > 180) {
      absoluteAngle -= 360;
    }
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
    console.log("absolute angle is " + absoluteAngle);
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
    const bathroomGeometry = new THREE.BoxGeometry(1, 1, 1);
    var bathroomMaterial = new THREE.MeshBasicMaterial({
      map: await ExpoTHREE.createTextureAsync({
        asset: Expo.Asset.fromModule(require('./assets/restroom_signs_unisex.jpg')),
      })
    });
    tempTypes.bathroom = {geometry: bathroomGeometry, material: bathroomMaterial};

    //exit
    const exitGeometry = new THREE.BoxGeometry(1, 0.6, 0.3);
    const exitMaterial = new THREE.MeshBasicMaterial({
      map: await ExpoTHREE.createTextureAsync({
        asset: Expo.Asset.fromModule(require('./assets/exit.jpg'))
      })
    });
    tempTypes.exit = {geometry: exitGeometry, material: exitMaterial};

    //water fountain
    const waterFountainGeometry = new THREE.BoxGeometry(1, 1, 1);
    var waterFountainMaterial = new THREE.MeshBasicMaterial({
      map: await ExpoTHREE.createTextureAsync({
        asset: Expo.Asset.fromModule(require('./assets/water_fountain.png')),
      })
    });
    tempTypes.waterFountain = {geometry: waterFountainGeometry, material: waterFountainMaterial};

    this.setState({signTypes: tempTypes});
  }

  createMesh = (type) => {
    let template = this.state.signTypes[type];
    return new THREE.Mesh(template.geometry, template.material);
  }

  place = (heading, mesh, sign) => {
    let app = this;
    let position = app.orient(heading.trueHeading, sign.latitude, sign.longitude, sign.altitude);
    mesh.material.opacity = 0.5;
    mesh.position.x = position[0];
    mesh.position.y = position[1];
    mesh.position.z = position[2];
    return mesh;
  }

  loadSigns = async () => {
    await this.createSignTypes();
    let heading = await Location.getHeadingAsync();
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
    if (this.state.interfacePosition < 30) {
      this.setState({interfacePosition: 30});
    }
    if (this.state.interfacePosition > 100) {
      this.setState({interfacePosition: 100});
    }
  }

  closeInterface = () => {
    console.log("pressed close interface");
    this.setState({interfacePosition: 100});
  }
}


const styles = StyleSheet.create({
  button: {
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    backgroundColor: '#27ae60',
    padding: 10,
    margin: 10
  },
  closeButton: {
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#ecf0f1',
    padding: 10,
    margin: 10
  },
  interfaceText: {
    color: '#ecf0f1',
    fontSize: 20
  }
});
