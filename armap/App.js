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
      signTypes: {},
      signs: [],
      location: null,
      camera: null,
      latitude: 0,
      longitude: 0,
      altitude: 0,
      scene: null
    };
  }

  componentWillMount() {
    this.panResponder = PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderGrant: () => {
        this.touching = true;
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
          this.setState({interfacePosition: Math.max(100 + gestureState.dy, 30) });
        }
      },
      onShouldBlockNativeResponder: () => false,
    });
    this.loadSigns();
    this._getLocationAsync();
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
          <TouchableOpacity style={styles.button} onPress={() => {this.setSign('bathroom')}}>
            <Text>Add bathroom sign</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.button} onPress={this.closeInterface}>
            <Text>Close</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  _getLocationAsync = async () => {
    var app = this;
    let { status } = await Permissions.askAsync(Permissions.LOCATION);
    if (status !== 'granted') {
      this.setState({
        errorMessage: 'Permission to access location was denied',
      });
    }

    var location = await Location.getCurrentPositionAsync({
      enableHighAccuracy: true
    });
    app.setState({ location: location });
    console.log(location);
  };

  setSign = async (signType) => {
    Location.getCurrentPositionAsync({
      enableHighAccuracy: true
    }).then(function(location) {
      // Location.getHeadingAsync().then(function(heading)) {
      //
      // }
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
    this.state.signs.forEach((sign) => {
      scene.add(sign);
    });

    const animate = () => {
      requestAnimationFrame(animate);
      this.state.signs.forEach((sign) => {
        sign.rotation.y += 0.015;
      });
      renderer.render(scene, camera);
      gl.endFrameEXP();
    }
    animate();
  }

  createSignTypes = async () => {// Create a mesh for each sign type
    let tempTypes = {};
    const _geometry = new THREE.BoxGeometry(0.07, 0.07, 0.07);
    var _material = new THREE.MeshBasicMaterial({
      map: await ExpoTHREE.createTextureAsync({
        asset: Expo.Asset.fromModule(require('./assets/restroom_signs_unisex.jpg')),
      })
    });
    // const bathroomCube = new THREE.Mesh(_geometry, _material);
    tempTypes.bathroom = {geometry: _geometry, material: _material};
    this.setState({signTypes: tempTypes});
  }

  createMesh = (type) => {
    let template = this.state.signTypes[type];
    return new THREE.Mesh(template.geometry, template.material);
  }

  place = (mesh) => {
    mesh.position.x = Math.random() / 3;
    mesh.position.y = Math.random() / 3;
    mesh.position.z = Math.random() / 3;
    return mesh;
  }

  loadSigns = async () => {
    await this.createSignTypes();
    let signs = [];
    let app = this;
    firebase.database().ref('signs/').on('value', (snapshot) => {
        snapshot.forEach(function(childSnapshot) {
          let childData = childSnapshot.val();
          let mesh = app.createMesh(childData.type);
          signs.push(app.place(mesh));
          if (app.state.scene) {
            app.state.scene.add(mesh);
          }
        });
        app.setState({signs: app.state.signs.concat(signs), loaded: true});
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
