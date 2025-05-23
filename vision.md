# 3D Canvas with LLM - MVP Implementation Plan

## Core Vision

A 3D canvas where the LLM can write and execute arbitrary JavaScript modules that create, animate, and interact with any 3D content. No rigid API constraints - pure creative freedom with emergent complexity through module interactions.

Think: "Create a flock of birds that avoid the red cubes" → LLM writes boid algorithm + collision detection + spawns birds + creates cubes, all as interconnected modules.

## Principle Architecture

### Modular Everything Philosophy

- **No Central API**: LLM generates complete, self-contained modules
- **Event-Driven Communication**: Modules communicate through events or direct references
- **Emergent Behavior**: Complex simulations emerge from simple module interactions
- **Complete Freedom**: LLM can implement any algorithm, pattern, or simulation technique

### Core Components

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│  LLM Generator  │───▶│  Code Executor  │───▶│   3D Canvas     │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         │              ┌─────────────────┐              │
         └─────────────▶│ Module Manager  │◀─────────────┘
                        └─────────────────┘
```

### Module System

Each LLM-generated module is completely autonomous:

```javascript
// Example module: BouncingBall
const BouncingBallModule = {
  init(scene, events) {
    this.ball = new THREE.Mesh(/*...*/);
    this.velocity = new THREE.Vector3(1, 1, 1);
    scene.add(this.ball);
    this.startLoop();
  },

  update() {
    this.ball.position.add(this.velocity);
    if (this.ball.position.x > 10) this.velocity.x *= -1;
    // Complete physics, rendering, everything
  },

  // Can expose any interface for other modules
  getBallPosition() {
    return this.ball.position;
  },
  destroy() {
    /* cleanup */
  },
};
```

## MVP Implementation (2-3 Days)

### Day 1: Basic Infrastructure

#### Minimal Tech Stack

- **HTML**: Single file with canvas
- **Three.js**: CDN import for 3D rendering
- **JavaScript**: Vanilla JS, no frameworks
- **LLM**: OpenAI API (fetch requests)

#### Core System (< 100 lines)

```javascript
class Canvas3D {
  constructor() {
    this.scene = new THREE.Scene();
    this.renderer = new THREE.WebGLRenderer();
    this.camera = new THREE.PerspectiveCamera();
    this.modules = new Map();
    this.events = new EventTarget();
    this.init();
  }

  async executeUserCommand(text) {
    const code = await this.generateCode(text);
    this.executeModule(code);
  }

  executeModule(code) {
    // Create isolated function scope with access to scene, events, THREE, etc.
    const moduleFunction = new Function(
      "scene",
      "events",
      "THREE",
      "modules",
      code
    );
    const module = moduleFunction(this.scene, this.events, THREE, this.modules);
    if (module) {
      this.modules.set(Date.now(), module);
    }
  }
}
```

#### LLM Prompt Template

```
You are generating JavaScript modules for a 3D canvas. You have access to:
- scene: THREE.Scene object
- events: EventTarget for communication
- THREE: Three.js library
- modules: Map of existing modules

Create a self-contained module that fulfills: "${userRequest}"

Return JavaScript code that creates objects, animations, interactions, etc.
The code will be executed with access to the above variables.
```

### Day 2: Module Interaction & Persistence

#### Event Communication

```javascript
// Module A: Creates a ball
events.dispatchEvent(
  new CustomEvent("ballCreated", {
    detail: { position: ball.position, mesh: ball },
  })
);

// Module B: Reacts to balls
events.addEventListener("ballCreated", (e) => {
  this.attractTo(e.detail.position);
});
```

#### Module Registry

```javascript
// Modules can register themselves for discovery
this.modules.set("gravityField", {
  type: "physics",
  influence: (position) => {
    /* calculate gravity */
  },
  mesh: gravityMesh,
});

// Other modules can find and use them
const gravity = modules.get("gravityField");
if (gravity) {
  const force = gravity.influence(this.position);
}
```

#### LLM Context Enhancement

```javascript
async generateCode(userRequest) {
  const context = {
    existingModules: Array.from(this.modules.keys()),
    sceneObjects: this.scene.children.length,
    recentEvents: this.getRecentEvents()
  };

  const prompt = `
Current scene has: ${context.existingModules.join(', ')}
User request: ${userRequest}
Generate module code that works with existing elements.
  `;

  return await this.callLLM(prompt);
}
```

### Day 3: Polish & Testing

#### Error Recovery

```javascript
executeModule(code) {
  try {
    const moduleFunction = new Function('scene', 'events', 'THREE', 'modules', `
      try {
        ${code}
      } catch (error) {
        console.error('Module error:', error);
        return { error: error.message };
      }
    `);

    const result = moduleFunction(this.scene, this.events, THREE, this.modules);
    if (result?.error) {
      this.handleModuleError(result.error, code);
    }
  } catch (error) {
    console.error('Execution error:', error);
  }
}
```

#### Basic UI Polish

- Simple text input box
- 3D viewport that fills screen
- Basic camera controls (orbit)
- Clear button to reset scene
- Module list display

## Example Usage Scenarios

### Simple Start

**User**: "Create a spinning red cube"
**LLM Generates**:

```javascript
const cube = new THREE.Mesh(
  new THREE.BoxGeometry(),
  new THREE.MeshBasicMaterial({ color: "red" })
);
scene.add(cube);

function animate() {
  cube.rotation.y += 0.01;
  requestAnimationFrame(animate);
}
animate();
```

### Emergent Complexity

**User**: "Add some balls that are attracted to the cube"
**LLM Generates**:

```javascript
const balls = [];
for (let i = 0; i < 5; i++) {
  const ball = new THREE.Mesh(
    new THREE.SphereGeometry(0.1),
    new THREE.MeshBasicMaterial({ color: "blue" })
  );
  ball.position.set(
    Math.random() * 10 - 5,
    Math.random() * 10 - 5,
    Math.random() * 10 - 5
  );
  scene.add(ball);
  balls.push(ball);
}

function updateBalls() {
  const cube =
    scene.getObjectByName("redCube") ||
    scene.children.find((c) => c.material?.color?.getHex() === 0xff0000);
  if (cube) {
    balls.forEach((ball) => {
      const direction = new THREE.Vector3()
        .subVectors(cube.position, ball.position)
        .normalize();
      ball.position.add(direction.multiplyScalar(0.02));
    });
  }
  requestAnimationFrame(updateBalls);
}
updateBalls();
```

### Advanced Interaction

**User**: "Make the balls avoid each other while being attracted to the cube"
**LLM Generates**: Full boid flocking algorithm with separation, alignment, and attraction behaviors.

## Key Design Principles

### 1. Zero Constraints

- LLM can use any Three.js feature
- Can implement any algorithm or pattern
- No forced API structure
- Complete creative freedom

### 2. Organic Growth

- Each module adds new capabilities
- Modules can build on or interact with existing ones
- Emergent behaviors from simple rules
- Natural complexity evolution

### 3. Discoverability

- Modules can expose their capabilities
- Event system enables loose coupling
- LLM learns from existing scene context
- Users can build on previous experiments

### 4. Immediate Feedback

- Every command produces visible results
- Errors are handled gracefully
- Fast iteration cycle
- Real-time experimentation

## Technical Considerations

### Security (MVP Level)

- Function constructor provides basic isolation
- No access to DOM outside canvas
- No network requests from modules
- Basic error containment

### Performance (Later Enhancement)

- Module cleanup and lifecycle management
- Animation frame coordination
- Memory leak prevention
- Performance monitoring

### LLM Optimization

- Context-aware code generation
- Pattern recognition from successful modules
- Error-driven code improvement
- Progressive capability building

## Success Metrics for MVP

### Day 1 Success

- User can create basic 3D objects through text
- LLM generates valid Three.js code 70%+ of the time
- Objects render correctly in scene

### Day 2 Success

- Multiple modules can coexist and interact
- Event communication works between modules
- LLM can reference and build on existing scene elements

### Day 3 Success

- Error handling prevents crashes
- UI is clean and functional
- System feels responsive and fun to use
- Ready for user testing and feedback

## Next Steps After MVP

Based on MVP learnings:

- Enhanced LLM prompting strategies
- Performance optimization
- Richer module interaction patterns
- Visual module management
- Collaboration features
- Physics integration
- Advanced rendering features

The MVP validates the core concept: can an LLM create compelling 3D experiences through free-form code generation? If yes, then we know the approach works and can invest in scaling it up.
