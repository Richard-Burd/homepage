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

### Exporting 3D Models (from Blender) with Animations

Use these glTF/GLB settings when the model should play an intro (or other) animation in the app (Three.js / React Three Fiber). The browser does **not** auto-play GLB clips — the app still needs a mixer — but the right export keeps the file to **one clear clip** instead of many loose Actions.

These instructions are optimized for Blender 5.x, for situations where you have an introductory animation that you want to play once when the page loads, then, after that, you have other animations that you want to play continuously, along with user interaction.

#### Recommended export (Blender 5.x → glTF 2.0 / `.glb`)

1. **File → Export → glTF 2.0 (.glb/.gltf)**

2. Click **Remember Export Settings** for next time.

3. Include **Visible Objects** only.

4. Under **Mesh**, make sure you have these selected:
   - **Apply Modifiers** to ensure that the modifiers are applied to the mesh.
   - **UVs** to export texture coordinates.
   - **Normals** to export shade-smooth where applicable.

5. Check **Animation**:
   - **Active actions merged** to ensure that the actions are merged into one clip.

6. **Bake All Objects Animations:**
   - Turn **off** as the default.
     - Straight keyframed objects (an animation runs first, then it finishes, then the objects are locked in place, only to be manipulated by follow-on settings in `react-three-fiber` (or other libraries) within this app [as opposed to anumations in Blender]) → **Off**
     - Something moves in Blender but is dead/wrong in the GLB → in that case, set this to → **On**

### Workaround to Add Proper Metadata for 3D (`.glb`) Files

The `.glb` file may not display correctly in the browser if the metadata is not set correctly. This did not matter as of 8/13/2026, but with future browser or Blender updates, it may be required once again. Here is how to set the metadata correctly:

1. First, in the AWS S3 console, go to the S3 bucket and select the `.glb` file.
2. In the upper righthand corner, click on **Object actions** and then select **copy**
3. Here are the settings you need to set on the _copy_ page:

   - Destination type is the default **General purpose bucket**
   - Destination is the same exact place as your existing file (as you are overwriting it) so it will look something like: `s3://your-bucket-name/`
   - scroll down to **Additional copy settings** and select **Specify settings** (this is the workaround) - this opens up several options below. You will leave everything on the default selections except for on the **Metadata** section
   - In the **Metadata** section, select **replace all metadata** - then for **Type** select **System defined**
   - On the **Key** dropdown, select **Content-type** and the, on the **Value** dropdown, select **model/gltf-binary**
   - leave the additional selections below on their defaults, and click **Copy** in the lower righthand corner at the bottom of the screen.

4. Go back to the S3 bucket and click on the `.glf` file, then scroll down to the **System and user-defined** section; you should see a System defined value with a Key set to **Content-type** and a Value set to **model/gltf-binary**
