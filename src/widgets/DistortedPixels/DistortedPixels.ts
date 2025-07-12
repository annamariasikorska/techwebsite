/* eslint-disable @typescript-eslint/ban-ts-comment */
import * as THREE from 'three';

// @ts-ignore
import fragment from './shaders/fragment.glsl';
// @ts-ignore
import vertex from './shaders/vertex.glsl';
import type { ImageMetadata } from 'astro';

interface Options {
  dom: HTMLElement | null;
  image: ImageMetadata;
}

function clamp(number: number, min: number, max: number) {
  return Math.max(min, Math.min(number, max));
}

// function getAspectRatio(image: HTMLImageElement) {
//   const w = image.clientWidth;
//   const h = image.clientHeight;
//   return h / w;
// }

function getAspectRatio(image: ImageMetadata) {
  const w = image.width;
  const h = image.height;
  return h / w;
}

export default class Sketch {
  container: HTMLElement | null = null;
  // img: HTMLImageElement | null = null;
  image?: ImageMetadata;
  width = 0;
  height = 0;
  time = 0;
  mouse = {
    x: 0,
    y: 0,
    prevX: 0,
    prevY: 0,
    vX: 0,
    vY: 0,
  };
  settings = {
    grid: 0,
    mouse: 0,
    strength: 0,
    relaxation: 0,
  };
  imageSize = {
    width: 0,
    height: 0,
    ratio: 0,
  };
  size = 0;
  imageAspect = 0;
  isPlaying = true;
  animationFrame = 0;
  scene: THREE.Scene | null = new THREE.Scene();
  renderer: THREE.WebGLRenderer | null = new THREE.WebGLRenderer();
  camera: THREE.PerspectiveCamera | THREE.OrthographicCamera | null = null;
  material: THREE.ShaderMaterial | null = null;
  texture: THREE.DataTexture | null = null;
  geometry: THREE.PlaneGeometry | null = null;
  plane: THREE.Mesh | null = null;

  constructor(options: Options) {
    this.image = options?.image;
    this.container = options.dom;

    if (this.container) {
      // this.img = this.container.querySelector('img');
      this.width = this.container.offsetWidth;

      if (options?.image) {
        this.imageSize = {
          // width: this.img.clientWidth,
          // height: this.img.clientHeight,
          width: options.image.width,
          height: options.image.height,
          ratio: getAspectRatio(options.image),
        };

        const renderedImageRatio = this.container.offsetWidth / this.imageSize.width;
        const imageHeight = this.imageSize.height * renderedImageRatio;

        // this.img.style.visibility = 'hidden';

        if (imageHeight < this.container.offsetHeight) {
          this.height = this.container.offsetHeight;
        } else {
          this.height = this.container.offsetWidth * this.imageSize.ratio;
        }
      } else {
        this.height = this.container.offsetHeight;
      }
    }

    if (this.renderer) {
      this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      this.renderer.setSize(this.width, this.height);
      this.renderer.setClearColor(0xeeeeee, 1);
      this.renderer.outputColorSpace = THREE.SRGBColorSpace;

      if (this.container) {
        this.container.appendChild(this.renderer.domElement);
      }
    }

    this.camera = new THREE.OrthographicCamera(1 / -2, 1 / 2, 1 / 2, 1 / -2, -1000, 1000);
    this.camera.position.set(0, 0, 2);
  }

  init() {
    this.setSettings();
    this.addObjects();
    this.resize();
    this.render();
    this.setupResize();
    this.mouseEvents();
  }

  destroy() {
    if (this.animationFrame) {
      cancelAnimationFrame(this.animationFrame);
    }

    this.scene = null;
    this.camera = null;
    this.material = null;
    this.texture = null;
    this.geometry = null;
    this.plane = null;

    if (this.renderer) {
      this.renderer.dispose();
    }

    if (this.container) {
      this.empty(this.container);
    }
  }

  empty(element: HTMLElement) {
    while (element.lastChild) element.removeChild(element.lastChild);
  }

  getValue(val: string | number) {
    if (this.container) {
      const value = this.container.getAttribute(`data-${val}`);
      if (value) {
        return parseFloat(value);
      }
    }
    return 0;
  }

  mouseEvents() {
    window.addEventListener('mousemove', e => {
      this.mouse.x = e.clientX / this.width;
      this.mouse.y = e.clientY / this.height;
      this.mouse.vX = this.mouse.x - this.mouse.prevX;
      this.mouse.vY = this.mouse.y - this.mouse.prevY;
      this.mouse.prevX = this.mouse.x;
      this.mouse.prevY = this.mouse.y;
    });
  }

  setSettings() {
    this.settings = {
      grid: this.getValue('grid') || 34,
      mouse: this.getValue('mouse') || 0.25,
      strength: this.getValue('strength') || 1,
      relaxation: this.getValue('relaxation') || 0.9,
    };
  }

  setupResize() {
    window.addEventListener('resize', this.resize.bind(this));
  }

  resize() {
    if (this.container) {
      this.width = this.container.offsetWidth;

      if (this.image) {
        const renderedImageRatio = this.container.offsetWidth / this.imageSize.width;
        const imageHeight = this.imageSize.height * renderedImageRatio;

        if (imageHeight < this.container.offsetHeight) {
          this.height = this.container.offsetHeight;
        } else {
          this.height = this.container.offsetWidth * this.imageSize.ratio;
        }
      } else {
        this.height = this.container.offsetHeight;
      }

      this.renderer?.setSize(this.width, this.height);
      (this.camera as THREE.PerspectiveCamera).aspect = this.width / this.height;
    }

    if (this.image) {
      const ratio = getAspectRatio(this.image);
      this.imageAspect = ratio;
    } else {
      this.imageAspect = 1 / 1.5;
    }

    let a1;
    let a2;

    if (this.height / this.width > this.imageAspect) {
      a1 = (this.width / this.height) * this.imageAspect;
      a2 = 1;
    } else {
      a1 = 1;
      a2 = this.height / this.width / this.imageAspect;
    }

    if (this.material) {
      this.material.uniforms.resolution.value.x = this.width;
      this.material.uniforms.resolution.value.y = this.height;
      this.material.uniforms.resolution.value.z = a1;
      this.material.uniforms.resolution.value.w = a2;
    }

    if (this.camera) {
      this.camera.updateProjectionMatrix();
    }

    this.regenerateGrid();
  }

  regenerateGrid() {
    this.size = this.settings.grid;
    const width = this.size;
    const height = this.size;
    const size = width * height;
    const data = new Float32Array(4 * size); // RGBA has 4 components

    for (let i = 0; i < size; i++) {
      const r = Math.random() * 255 - 125;
      const g = Math.random() * 255 - 125;
      const b = Math.random() * 255 - 125;
      const alpha = 255; // Set alpha to full opacity

      const stride = i * 4;

      data[stride] = r;
      data[stride + 1] = g;
      data[stride + 2] = b;
      data[stride + 3] = alpha;
    }

    this.texture = new THREE.DataTexture(data, width, height, THREE.RGBAFormat, THREE.FloatType);
    this.texture.magFilter = this.texture.minFilter = THREE.NearestFilter;

    if (this.material) {
      this.material.uniforms.uDataTexture.value = this.texture;
      this.material.uniforms.uDataTexture.value.needsUpdate = true;
    }
  }

  addObjects() {
    this.regenerateGrid();

    if (this.image) {
      const texture = new THREE.TextureLoader().load(this.image.src, () => {
        texture.needsUpdate = true;
      });
      // const texture = new THREE.Texture(this.img);

      // const img = new Image();
      // img.onload = () => {
      //   console.log('loaded');
      //   texture.needsUpdate = true;
      // };
      // img.src = this.img.src;

      // texture.needsUpdate = true;

      this.material = new THREE.ShaderMaterial({
        // extensions: {
        //   derivatives: true,
        // },
        side: THREE.DoubleSide,
        uniforms: {
          time: {
            value: 0,
          },
          resolution: {
            value: new THREE.Vector4(),
          },
          uTexture: {
            value: texture,
          },
          uDataTexture: {
            value: this.texture,
          },
        },
        vertexShader: vertex,
        fragmentShader: fragment,
      });

      this.geometry = new THREE.PlaneGeometry(1, 1, 1, 1);
      this.plane = new THREE.Mesh(this.geometry, this.material);

      if (this.scene) {
        this.scene.add(this.plane);
      }
    }
  }

  updateDataTexture() {
    if (this.texture) {
      const data = this.texture.image.data;

      for (let i = 0; i < data.length; i += 4) {
        // Adjust loop for RGBA
        data[i] *= this.settings.relaxation; // Red channel
        data[i + 1] *= this.settings.relaxation; // Green channel
        data[i + 2] *= this.settings.relaxation; // Blue channel
        // Optional: Modify alpha if needed, e.g., data[i + 3] *= alphaFactor;
      }

      const gridMouseX = this.size * this.mouse.x;
      const gridMouseY = this.size * (1 - this.mouse.y);
      const maxDist = this.size * this.settings.mouse;
      const aspect = this.height / this.width;

      for (let i = 0; i < this.size; i++) {
        for (let j = 0; j < this.size; j++) {
          const distance = (gridMouseX - i) ** 2 / aspect + (gridMouseY - j) ** 2;
          const maxDistSq = maxDist ** 2;

          if (distance < maxDistSq) {
            const index = 4 * (i + this.size * j);

            let power = maxDist / Math.sqrt(distance);
            power = clamp(power, 0, 10);
            // if(distance <this.size/32) power = 1;
            // power = 1;

            data[index] += this.settings.strength * 100 * this.mouse.vX * power; // Red channel
            data[index + 1] -= this.settings.strength * 100 * this.mouse.vY * power; // Green channel
            data[index + 2] += 0;
          }
        }
      }

      this.mouse.vX *= 0.9;
      this.mouse.vY *= 0.9;
      this.texture.needsUpdate = true;
    }
  }

  render() {
    if (!this.isPlaying) {
      return;
    }

    this.time += 0.05;
    this.updateDataTexture();

    if (this.material) {
      this.material.uniforms.time.value = this.time;
    }

    this.animationFrame = requestAnimationFrame(this.render.bind(this));

    if (this.camera && this.renderer && this.scene) {
      this.renderer.render(this.scene, this.camera);
    }
  }
}
