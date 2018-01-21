import * as firebase from 'firebase';
import React from 'react';
import * as THREE from 'three';
import ExpoTHREE from 'expo-three';
import Expo from 'expo';
import { Constants, Location, Permissions } from 'expo';
import { StyleSheet, Text, View, Button, PanResponder, TouchableOpacity } from 'react-native';

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
      multiplier: 0.5
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
          this.setState({interfacePosition: Math.max(100 + gestureState.dy, 30) });
        }
      },
      onShouldBlockNativeResponder: () => false,
    });
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
          <Text style={styles.interfaceText}>Test text please ignore</Text>
          <TouchableOpacity style={styles.button} onPress={this.closeInterface}>
            <Text>Close</Text>
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

  setSign = async (text) => {
    Location.getCurrentPositionAsync({
      enableHighAccuracy: true
    }).then(function(location) {
      var id = location.coords.latitude.toString().replace(".", "-") + "&" + location.coords.longitude.toString().replace(".", "-") + "&" + location.coords.altitude.toString().replace(".", "-");
      console.log(id);
      firebase.database().ref('signs/' + id).set({
        text: text,
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

    // const geometry = new THREE.BoxGeometry(0.07, 0.07, 0.07);
    // var material = new THREE.MeshBasicMaterial({
    //   map: await ExpoTHREE.createTextureAsync({
    //     asset: Expo.Asset.fromModule(require('./assets/restroom_signs_unisex.jpg')),
    //   })
    // });
    // const cube = new THREE.Mesh(geometry, material);
    // cube.position.z = -0.5;
    // scene.add(cube);
    this.setState({
      camera: camera
    });
    var app = this;
    this.loadSigns(function() {
      app.state.signs.forEach((sign) => {
        scene.add(sign);
        console.log("Added a sign");
      });

      const animate = () => {
        requestAnimationFrame(animate);
        app.state.signs.forEach((sign) => {
          sign.rotation.y += 0.04;
        })
        renderer.render(scene, camera);
        gl.endFrameEXP();
      }
      animate();
    });
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
    var y = (alt - current.altitude) / 10;
    return [x, y, z];
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

  loadSigns = function(callback) {
    var app = this;
    Location.getHeadingAsync().then(function(heading) {
      var signList = [];
      firebase.database().ref('signs/').on('value', function(snapshot) {
          snapshot.forEach(function(childSnapshot) {
            var sign = childSnapshot.val();
            const geometry = new THREE.BoxGeometry(1, 1, 1);
            const material = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
            const cube = new THREE.Mesh(geometry, material);
            var position = app.orient(heading.trueHeading, sign.latitude, sign.longitude, sign.altitude);
            console.log(position);
            cube.position.x = position[0];
            cube.position.y = position[1];
            cube.position.z = position[2];
            signList.push(cube);
          });
          app.setState({
            signs: signList
          }, function() {
            callback();
          });
      });
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
    this.setState({interfacePosition: 100});
  }
}


const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  create: {
    width: '100%',
    height: '100%',
    backgroundColor: 'red',
    zIndex: 100,
  },
  button: {
    alignItems: 'center',
    backgroundColor: '#DDDDDD',
    padding: 10
  },
  interfaceText: {
    color: '#fff',
    fontSize: 20
  }
});
