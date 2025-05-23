// Function to load environment variables from .env file
async function loadEnv() {
  try {
    const response = await fetch(".env");
    const text = await response.text();

    // Parse .env content
    const env = {};
    text.split("\n").forEach((line) => {
      const [key, value] = line.split("=");
      if (key && value) {
        env[key.trim()] = value.trim();
      }
    });

    return env;
  } catch (error) {
    console.error("Error loading .env file:", error);
    return {};
  }
}

// Function to generate code using Claude API via our server
async function generateCode(userRequest, context = {}) {
  const prompt = `
You are generating JavaScript modules for a 3D canvas. You have access to:
- scene: THREE.Scene object
- events: EventTarget for communication
- THREE: Three.js library
- modules: Map of existing modules

Current scene has: ${context.existingModules?.join(", ") || "No modules yet"}
Number of objects in scene: ${context.sceneObjects || 0}

Create a self-contained module that fulfills: "${userRequest}"

IMPORTANT GUIDELINES:
- Write direct, immediate code that creates and adds objects to the scene
- Do NOT wrap object creation in event listeners unless specifically needed for later triggering
- Use the 'animate' event for animations: events.addEventListener('animate', function() {...})
- Do not rely on specific object names to find objects in the scene
- Add userData to created objects for identification (e.g., object.userData.type = 'cube')
- Do not use ES modules syntax (no import statements)

Return raw JavaScript code only, no explanation.
  `;

  try {
    const response = await fetch("http://localhost:3000/generate", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "claude-3-opus-20240229",
        max_tokens: 4000,
        messages: [{ role: "user", content: prompt }],
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`API Error: ${error.error || response.statusText}`);
    }

    const data = await response.json();
    let code = data.content[0].text;

    // Clean up the code - enhanced version

    // Remove code fences
    code = code.replace(/```javascript|```js|```/g, "");

    // Remove return statements and backticks
    code = code.replace(/return `|`/g, "");

    // Remove import statements
    code = code.replace(/import.*?from.*?;/g, "");

    // Remove explanatory text at the beginning
    if (
      code.toLowerCase().includes("here is") ||
      code.toLowerCase().includes("this code")
    ) {
      // Find the first actual line of code by looking for common starter tokens
      const codeStarters = [
        "const",
        "let",
        "var",
        "function",
        "class",
        "/",
        "events",
        "scene",
        "THREE",
      ];
      let startLine = 0;

      const lines = code.split("\n");
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        if (line === "") continue;

        const startsWithCodeToken = codeStarters.some((token) =>
          line.startsWith(token)
        );
        if (startsWithCodeToken) {
          startLine = i;
          break;
        }
      }

      // Keep only the actual code
      code = lines.slice(startLine).join("\n");
    }

    return code.trim();
  } catch (error) {
    console.error("Error calling API:", error);
    throw new Error("Failed to generate code: " + error.message);
  }
}
