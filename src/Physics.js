import Matter from 'matter-js'
import polyDecomp from 'poly-decomp'
import pathseg from 'pathseg'

class Physics {
  constructor(canvas) {
    window.Matter = Matter
    Matter.Common.setDecomp(polyDecomp)

    this.canvas = canvas
    this.stage = this.canvas.stage
    this.layer = this.canvas.layer
    this.bodyIds = []

    this.init()
  }

  init() {
    this.engine = Matter.Engine.create()
    this.runner = Matter.Runner.create()
    this.render = Matter.Render.create({
      element: document.getElementById('workarea'),
      engine: this.engine,
      canvas: document.querySelector('#konva-1'),
      options: {
        showPositions: true,
        showAngleIndicator: true,
        width: 2000,
        height: 2000,
        background: 'none',
        wireframeBackground: 'none'
      }
    })

    this.showRender()
    // matterInit()
    Matter.Runner.run(this.runner, this.engine)
    Matter.Events.on(this.engine, 'afterUpdate', this.afterUpdate.bind(this))

    setTimeout(() => {
      this.showBox()
    }, 1000)
  }

  showBox() {
    // let boxA = Matter.Bodies.rectangle(400, 200, 80, 80)
    // let boxB = Matter.Bodies.rectangle(450, 50, 80, 80)
    let ground = Matter.Bodies.rectangle(400, 610, 810, 60, { isStatic: true })
    ground.restitution = 0
    Matter.Composite.add(this.engine.world, [ground])

    let rect = new Konva.Rect({
      x: 400,
      y: 610,
      width: 810,
      height: 60,
      fill: 'green',
      stroke: 'black',
      strokeWidth: 4,
    })
    this.canvas.layer.add(rect)
  }

  showRender() {
    Matter.Render.run(this.render)
  }

  addBodyApprox(node, options={}) {
    let x = node.getAttr('x')
    let y = node.getAttr('y')
    let radius = 100 // TODO: change with bounding box
    let body = Matter.Bodies.circle(x, y, radius)
    body.restitution = 0
    Matter.Composite.add(this.engine.world, body)
    this.bodyIds.push(node.id())
  }

  addBody(node, options={}) {
    let d = node.getAttr('data')
    let x = node.getAttr('x')
    let y = node.getAttr('y')
    let test = document.createElementNS('http://www.w3.org/2000/svg', 'path')
    test.setAttribute('d', d)
    let vertexSets = Matter.Svg.pathToVertices(test)
    let body = Matter.Bodies.fromVertices(x, y, vertexSets, {
      render: {
        fillStyle: 'red',
        strokeStyle: 'red',
        lineWidth: 1
      }
    }, true)
    window.body = body
    if (options.isStatic) {
      Matter.Body.setStatic(body, true)
      body.restitution = 1 // make it bouncy
    }
    Matter.Composite.add(this.engine.world, body)
    if (options.constraint) {
      let constraint = Matter.Constraint.create({ pointA: options.constraint, bodyB: body })
      let mouseConstraint = Matter.Constraint.create({
        pointA: { x: 0, y: 0 },
        pointB: { x: 0, y: 0 }
      })
      mouseConstraint.body = body
      window.mouseConstraint = mouseConstraint
      Matter.Composite.addConstraint(this.engine.world, constraint)
      Matter.Composite.addConstraint(this.engine.world, mouseConstraint)
    }
    this.bodyIds.push(node.id())
  }

  addConstraint(line, ball) {
    let point = pathParse(line.getData()).result[0]
    let x = point[1] + line.x()
    let y = point[2] + line.y()
    this.addBody(ball, { isStatic: false, constraint: { x: x, y: y } })
  }

 getBoundingBox(node) {
    let d = node.getData()
    let bb = svgPathBbox(d)
    let cx = (bb[0] + bb[2])/2
    let cy = (bb[1] + bb[3])/2
    let width = bb[2] - bb[0]
    let height = bb[3] - bb[1]
    let ratio = width / height
    let res = {
      cx: cx, cy: cy, width: width, height: height
    }
    return res
  }

  afterUpdate() {
    for (let i = 0; i < this.bodyIds.length; i++) {
      let id = this.bodyIds[i]
      let path = this.canvas.layer.find(`#${id}`)[0]
      if (!path) return
      let body = this.engine.world.bodies[i+1] // TODO debug
      let x = body.position.x
      let y = body.position.y
      let degree = body.angle * 180 / Math.PI
      path.setAttrs({ x: x, y: y })
      // this.canvas.path.setAttrs({ x: x, y: y })
      path.rotation(degree)
    }

    // Canvas.parameterize.updateAll()
    // Canvas.graph.update()

    if (this.canvas.event.line) {
      let point0 = pathParse(this.canvas.event.line.getData()).result[0]
      let x0 = point0[1]
      let y0 = point0[2]
      let x1 = mouseConstraint.body.position.x - this.canvas.event.line.x()
      let y1 = mouseConstraint.body.position.y - this.canvas.event.line.y()
      let d = `M${x0},${y0}L${x1},${y1}`
      this.canvas.event.line.setData(d)
    }
  }

  mouse() {
    const mouse = Matter.Mouse.create(this.render.canvas)
    const mouseConstraint = Matter.MouseConstraint.create(this.engine, {
      mouse: mouse,
      constraint: {
        stiffness: 0.2,
        render: {
          visible: false
        }
      }
    })
    Matter.Composite.add(this.engine.world, mouseConstraint)
  }

  renderConstraint() {
    let x = ball.x()
    let y = ball.y()
    let point = pathParse(line.getData()).result[1]
    // ['L', x, y]
    // let x = point[1] + child.x()
    // let y = point[2] + child.y()
    // let d = `M${},${}L$${x},${y}`
  }

}

export default Physics