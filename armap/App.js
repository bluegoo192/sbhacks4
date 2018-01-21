import React from 'react';
import * as THREE from 'three';
import ExpoTHREE from 'expo-three';
import Expo from 'expo';
import { StyleSheet, Text, View, PanResponder, TouchableOpacity } from 'react-native';

console.disableYellowBox = true;

export default class App extends React.Component {
  constructor(props) {
    super(props);
    this.state = {interfacePosition: 100};
  }

  componentWillMount() {
    this.panResponder = PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderGrant: () => {
        this.touching = true;
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

    const geometry = new THREE.BoxGeometry(0.07, 0.07, 0.07);
    const material = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
    const cube = new THREE.Mesh(geometry, material);
    cube.position.x = 0;
    cube.position.y = 0;
    cube.position.z = -0.4;
    scene.add(cube);

    const animate = () => {
      requestAnimationFrame(animate);
      cube.rotation.x += 0.02;
      cube.rotation.y += 0.01;
      renderer.render(scene, camera);
      gl.endFrameEXP();
    }
    animate();
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
