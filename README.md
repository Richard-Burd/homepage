# Richard Burd's Homepage

## Getting Started

First, run the development server:

```bash
pnpm run dev
```

Or do a build:

```bash
pnpm build
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

---

---

## Blender → AWS S3 → React Three Fiber (Next.js) Workflow

This section describes the complete workflow for exporting a textured 3D model from Blender, uploading it to AWS S3, and loading it into a Next.js application using React Three Fiber.

You cannot modify the System defined metadata of a file on an AWS S3 Bucket as of 8/10/2026. This is a known bug. The 3D `.glb` files should have the correct system defined metadata in order to ensure they work with `react-three-fiber` and all its dependencies.

### Workaround to Add Proper Metadata for 3D (`.glb`) Files

1. First, go to the S3 bucket and select the `.glb` file.
2. In the upper righthand corner, click on **Object actions** and then select **copy**
3. Here are the settings you need to set on the _copy_ page:

   - Destination type is the default **General purpose bucket**
   - Destination is the same exact place as your existing file (as you are overwriting it) so it will look something like: `s3://your-bucket-name/`
   - scroll down to **Additional copy settings** and select **Specify settings** (this is the workaround) - this opens up several options below. You will leave everything on the default selections except for on the **Metadata** section
   - In the **Metadata** section, select **replace all metadata** - then for **Type** select **System defined**
   - On the **Key** dropdown, select **Content-type** and the, on the **Value** dropdown, select **model/gltf-binary**
   - leave the additional selections below on their defaults, and click **Copy** in the lower righthand corner at the bottom of the screen.

4. Go back to the S3 bucket and click on the `.glf` file, then scroll down to the **System and user-defined** section; you should see a System defined value with a Key set to **Content-type** and a Value set to **model/gltf-binary**

### Exporting 3D Models (from Blender) with Animations

Use these glTF/GLB settings when the model should play an intro (or other) animation in the app (Three.js / React Three Fiber). The browser does **not** auto-play GLB clips — the app still needs a mixer — but the right export keeps the file to **one clear clip** instead of many loose Actions.

#### Recommended export (Blender 5.x → glTF 2.0 / `.glb`)

1. **File → Export → glTF 2.0 (.glb/.gltf)**
2. Under **Animation**:
   - **Animation Mode:** `NLA Tracks`  
     (Prefer this over `Actions`. `Actions` + no merge tends to export one clip per object Action, e.g. Ceiling / Roof / Floor / Abacus separately.)
   - **Merge Animation:** `NLA Track Names`  
     (Not `No Merge`. Strips that share an NLA track name become **one** glTF animation.)
3. In Blender’s **Nonlinear Animation (NLA)** editor:
   - Put the full intro (all moving objects) on tracks you intend to merge.
   - Give the track a clear name (e.g. `Intro`) so the app can play `actions['Intro']` by name.
4. **Bake All Objects Animations:**
   - Turn **on** if motion uses constraints, parents, drivers, or anything that doesn’t look right in a glTF viewer.
   - Optional for simple location/rotation keyframes on each object.
5. Confirm **Animations** / animation export is enabled (default when animation options are set).

#### After export — quick check

- Open the `.glb` in a viewer, or inspect `gltf.animations` in the app.
- Prefer **one** animation for the intro, with a stable name (e.g. `Intro`).
- Duration should match the timeline length you authored.

#### What this does _not_ remove from the app

You still need code to:

- create an `AnimationMixer` (or drei `useAnimations`)
- play the clip once (`LoopOnce` + clamp at end, if that’s the behavior you want)
- call `mixer.update(delta)` each frame
- optionally notify the scene when playback finishes (e.g. start idle spin)

Export settings only control **how many clips** and **how they’re named**, not whether Three.js plays them.

#### Avoid (for a single intro)

- **Animation Mode:** `Actions` + **Merge Animation:** `No Merge` → many `*Action` clips that the app must play all at once.
