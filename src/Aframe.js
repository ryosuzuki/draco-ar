import React, { Component } from 'react'
import Canvas from './Canvas'
import Event from './Event'

import AFRAME from 'aframe'


class Aframe extends Component {
  constructor(props) {
    super(props)
    window.Scene = this
    this.state = {}
  }

  componentDidMount() {

    AFRAME.registerComponent('startButton', {
     init: function () {
        var cube = document.querySelector("#boxId");
        cube.addEventListener("mousedown",function(evt){
          cube.setAttribute('material', 'color',"red");
        });
        cube.addEventListener("mouseup",function(evt){
          cube.setAttribute('material', 'color',"blue");
        });
     }
    });
    
    AFRAME.registerComponent('drawable', {
      init: function() {
        let mesh = this.el.object3D.children[0]
        console.log(mesh)

        this.event = new Event()

        let size = 1024
        let canvas = document.getElementById('konva-1')
        canvas.width = canvas.height = size
        let texture = new THREE.Texture(canvas)
        console.log(texture)
        let material = new THREE.MeshBasicMaterial({ map: texture, side: THREE.DoubleSide })
        mesh.material = material
        window.mesh = mesh
        mesh.material.transparent = true
        this.mesh = mesh

        this.camera = document.getElementById('camera')
        this.threeCamera = this.camera.getObject3D('camera')
        this.internalState = {
          dragging: false,
          initDrawing: true,
          distance: 0,
          raycaster: new THREE.Raycaster(),
        }
        this.fingerMove = this.fingerMove.bind(this)
        this.fingerUp = this.fingerUp.bind(this)
        this.el.sceneEl.addEventListener('onefingermove', this.fingerMove)
        this.el.sceneEl.addEventListener('onefingerend', this.fingerUp)
        this.el.classList.add('cantap')
      },

      fingerMove(event) {
        this.internalState.positionRaw = event.detail.positionRaw
        this.internalState.dragging = true
      },

      fingerUp(event) {
        this.internalState.dragging = false
        this.internalState.initDrawing = true
        this.event.mouseUp()
      },

      tick: function() {
        this.mesh.material.map.needsUpdate = true
        if (this.internalState.dragging) {
          const screenPositionX = this.internalState.positionRaw.x / document.body.clientWidth * 2 - 1
          const screenPositionY = this.internalState.positionRaw.y / document.body.clientHeight * 2 - 1
          const screenPosition = new THREE.Vector2(screenPositionX, -screenPositionY)

          this.threeCamera = this.threeCamera || this.camera.getObject3D('camera')
          this.internalState.raycaster.setFromCamera(screenPosition, this.threeCamera)
          const intersects = this.internalState.raycaster.intersectObject(this.el.object3D, true)

          if (intersects.length > 0) {
            const intersect = intersects[0]
            this.internalState.distance = intersect.distance
            let point = intersect.point
            let mouse = {
              x: 1024 * intersect.uv.x,
              y: 1024 * (1- intersect.uv.y)
            }
            console.log(mouse)
            if (this.internalState.initDrawing) {
              this.event.mouseDown(mouse)
              this.internalState.initDrawing = false
            } else {
              this.event.mouseMove(mouse)
            }

          }
        }
      }
    })

  }

  render() {
    return (
      
      <>
        <Canvas />
        <a-scene>
          <a-camera
            id="camera"
            position="0 8 0"
            raycaster="objects: .cantap"
            cursor="
              fuse: false;
              rayOrigin: mouse;"
          >
           </a-camera>

          <a-plane
            id="plane"
            drawable
            class="cantap"
            position="0 5 -10"
            rotation="0 0 0"
            width="10"
            height="10"
            color="#7BC8A4"
            shadow
          >
          </a-plane>

        </a-scene>

      </>
    )
  }
}

export default Aframe