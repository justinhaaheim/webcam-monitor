# Three.js Renderer Migration

Date: 2025-06-27

## Overview

We need to migrate rendering from Matter.js' built-in debug canvas renderer to Three.js while **keeping Matter.js for physics**. The scene remains strictly 2-D, so we will use an `OrthographicCamera`. The public API (`createPhysicsContainer → PhysicsContainer`) and existing React integration should remain unchanged.

Benefits:

- GPU-accelerated rendering and batching
- Freedom to add richer visuals (shaders, post-processing, lighting) later
- Decouple visual layer from Matter's debug renderer

## Success Criteria

1. Panda sprites are rendered via Three.js and track their Matter bodies in real-time.
2. Launch, grab/throw, bounce, and freeze behaviours all still work.
3. No regression in existing public API or React components.
4. (Stretch) Scene keeps resizing correctly with viewport changes.

## High-Level Plan

1. **Set-up Three.js**

   - Add `three` as a dependency.
   - Inside `createPhysicsContainer`, create a `THREE.WebGLRenderer`, `THREE.Scene`, and `THREE.OrthographicCamera` sized to the container.
   - Insert renderer.domElement into `containerElement` and remove Matter's debug canvas.

2. **Create Render Objects**

   - For each panda body we spawn, create a `THREE.Mesh` using `PlaneGeometry` sized to the panda's width/height with a `THREE.Texture` loaded from `pandaWithCape.png`.
   - Maintain a `Map<Body, THREE.Object3D>` (or reuse existing `pandas` Map by id) so we can sync physics → visuals.

3. **Sync Loop**

   - Hook into Matter's `afterUpdate` event to iterate through pandas and copy `body.position` and `body.angle` → corresponding mesh `position` and `rotation`.
   - Call `renderer.render(scene, camera)` inside a `requestAnimationFrame` loop (or tie to the Matter runner's update if preferred).

4. **Resize Handling**

   - Re-use existing `ResizeObserver` callback: update camera frustum & renderer size.

5. **Debug Walls / Bounds** (Optional for first pass)

   - Ignore for now or draw simple `LineSegments` if `showBounds` is true.

6. **Clean Up**
   - Dispose geometries, textures, and renderer on `unload()`.

## Tasks / TODOs

- [ ] Install `three`
- [ ] Create texture loader helper
- [ ] Scaffold Three.js renderer in `createPhysicsContainer`
- [ ] Spawn panda meshes when `launchPanda` is called
- [ ] Sync loop between Matter bodies ↔︎ Three meshes
- [ ] Replace Matter `Render.run` with RAF loop
- [ ] Handle resizing
- [ ] Dispose resources in `unload`
- [ ] Verify `showBounds` & debugWalls modes (nice-to-have)

## Open Questions

- Should we offload any heavy texture loading outside `createPhysicsContainer`?
- Performance: do we need sprite sheets / TextureAtlas later?
- Would it be useful to allow non-sprite Panda (e.g., using `SpriteMaterial`) for built-in size scaling?

---

Feel free to append further notes, exploration snippets, and meeting minutes below.

### Scratch Pad
