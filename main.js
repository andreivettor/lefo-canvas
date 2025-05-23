class Canvas3D {
  constructor() {
    // Initialize Three.js components
    this.scene = new THREE.Scene();
    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );

    // Set up module management
    this.modules = new Map();
    this.moduleCounter = 0;
    this.events = new EventTarget();

    // Initialize the 3D environment
    this.init();

    // Set up UI event listeners
    this.setupListeners();
  }

  init() {
    // Configure renderer
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    document.getElementById("canvas").appendChild(this.renderer.domElement);

    // Configure camera
    this.camera.position.z = 5;

    // Initialize OrbitControls
    this.controls = new THREE.OrbitControls(
      this.camera,
      this.renderer.domElement
    );
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.05;

    // Add ambient light
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    this.scene.add(ambientLight);

    // Add directional light
    const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
    directionalLight.position.set(1, 1, 1);
    this.scene.add(directionalLight);

    // Start the animation loop
    this.animate();

    // Handle window resize
    window.addEventListener("resize", () => {
      this.camera.aspect = window.innerWidth / window.innerHeight;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(window.innerWidth, window.innerHeight);
    });
  }

  animate() {
    requestAnimationFrame(() => this.animate());

    // Update controls
    if (this.controls) {
      this.controls.update();
    }

    // Dispatch animation event for all modules
    this.events.dispatchEvent(new CustomEvent("animate"));

    this.renderer.render(this.scene, this.camera);
  }

  setupListeners() {
    const submitBtn = document.getElementById("submit-btn");
    const userInput = document.getElementById("user-input");

    submitBtn.addEventListener("click", () => {
      this.executeUserCommand(userInput.value);
      userInput.value = "";
    });

    userInput.addEventListener("keypress", (e) => {
      if (e.key === "Enter") {
        this.executeUserCommand(userInput.value);
        userInput.value = "";
      }
    });
  }

  async executeUserCommand(text) {
    try {
      const code = await generateCode(text, {
        existingModules: Array.from(this.modules.keys()),
        sceneObjects: this.scene.children.length,
      });

      this.executeModule(code, text);
    } catch (error) {
      console.error("Error executing command:", error);
      alert("Error: " + error.message);
    }
  }

  executeModule(code, description) {
    try {
      console.log("Executing code:", code);

      // Create isolated function scope with access to scene, events, THREE, etc.
      const moduleFunction = new Function(
        "scene",
        "events",
        "THREE",
        "modules",
        `
        try {
          // Add name generation utility function for objects created in this module
          const generateName = (prefix) => prefix + '_' + Date.now() + '_' + Math.floor(Math.random() * 1000);
          
          ${code}
          return true;
        } catch (error) {
          console.error('Module execution error:', error);
          return { error: error.message };
        }
        `
      );

      const result = moduleFunction(
        this.scene,
        this.events,
        THREE,
        this.modules
      );

      if (result === true) {
        const moduleId = `module_${this.moduleCounter++}`;
        this.modules.set(moduleId, {
          id: moduleId,
          description,
          code,
          timestamp: Date.now(),
        });
        this.updateModulesList();
      } else if (result?.error) {
        console.error("Module error:", result.error);
        alert("Module error: " + result.error);
      }
    } catch (error) {
      console.error("Execution error:", error);
      alert("Execution error: " + error.message);
    }
  }

  updateModulesList() {
    const modulesList = document.getElementById("modules");
    modulesList.innerHTML = "";

    // Convert modules to array and sort by ID to maintain order
    const sortedModules = Array.from(this.modules.entries()).sort((a, b) =>
      a[1].id.localeCompare(b[1].id)
    );

    sortedModules.forEach(([id, module]) => {
      const li = document.createElement("li");
      li.textContent = module.description;

      // Add option to view code
      const viewBtn = document.createElement("button");
      viewBtn.textContent = "📝";
      viewBtn.style.marginLeft = "5px";
      viewBtn.style.background = "none";
      viewBtn.style.border = "none";
      viewBtn.style.cursor = "pointer";
      viewBtn.title = "View Code";
      viewBtn.onclick = () => alert(module.code);

      li.appendChild(viewBtn);
      modulesList.appendChild(li);
    });
  }
}

// Initialize the canvas when the page loads
window.addEventListener("DOMContentLoaded", () => {
  window.canvas3D = new Canvas3D();
});
