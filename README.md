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

# Blender → AWS S3 → React Three Fiber (Next.js) Workflow

This document describes the complete workflow for exporting a textured 3D model from Blender, uploading it to AWS S3, and loading it into a Next.js application using React Three Fiber.

---

# 1. Prepare the Blender Model

Before exporting, verify the following:

- [ ] The mesh has been UV unwrapped.
- [ ] The texture image is connected to the material.
- [ ] The texture image has been saved.
- [ ] The model has the correct scale and rotation.

## Save the Texture

In the Image Editor:

```
Image
    ↓
Save
```

or

```
Image
    ↓
Save As...
```

Blender does **not** automatically save painted textures.

---

## Verify the Material

In the **Shading** workspace, the node graph should look similar to:

```
Image Texture
      │
      ▼
Principled BSDF
      │
      ▼
Material Output
```

Specifically:

```
Image Texture Color
        │
        ▼
Principled BSDF Base Color
```

---

## Apply Transforms

In Object Mode:

```
Ctrl + A
```

Choose:

```
Rotation & Scale
```

(or **All Transforms**)

---

# 2. Export the Model

Choose:

```
File
    ↓
Export
    ↓
glTF 2.0
```

Use these settings.

## Format

```
glTF Binary (.glb)
```

---

## Include

```
✓ Selected Objects
```

---

## Mesh

```
✓ UVs
✓ Normals
```

Tangents are optional.

---

## Materials

```
Materials
    Export
```

---

## Images

```
Automatic
```

---

## Image Quality

```
100
```

(Recommended)

---

Export the file, for example:

```
pyramid.glb
```

---

# 3. Upload to AWS S3

Upload the `.glb` file into your S3 bucket.

Example folder structure:

```
website-assets/

    images/

    models/
        pyramid.glb
```

---

# 4. Fix the Content-Type

The AWS Console currently assigns the wrong MIME type to `.glb` files.

Instead of:

```
application/x-www-form-urlencoded
```

the object **must** have:

```
model/gltf-binary
```

---

## Using the AWS Console

1. Upload the file.

2. Open the object.

3. Choose:

```
Actions
    ↓
Copy
```

4. Copy the object onto itself.

5. Under:

```
Metadata
```

select

```
Replace all metadata
```

6. Add a new **System-defined** metadata entry.

Set:

```
Content-Type
```

to

```
model/gltf-binary
```

Finish the copy operation and overwrite the original object.

---

# 5. Configure Bucket Permissions

The browser must be allowed to download the model.

Depending on your architecture:

- Public bucket
- CloudFront
- Signed URLs

the object must be readable.

---

# 6. Configure CORS

Open

```
S3
    ↓
Bucket
    ↓
Permissions
    ↓
Cross-Origin Resource Sharing (CORS)
```

Example:

```json
[
  {
    "AllowedHeaders": ["*"],
    "AllowedMethods": ["GET", "HEAD"],
    "AllowedOrigins": [
      "http://localhost:3000",
      "https://richardburd.dev",
      "https://www.richardburd.dev"
    ],
    "ExposeHeaders": ["ETag"],
    "MaxAgeSeconds": 3600
  }
]
```

---

# 7. Verify the URL

Confirm the model can be downloaded directly.

Example:

```
https://your-bucket.s3.us-east-1.amazonaws.com/models/pyramid.glb
```

If the browser downloads the file successfully, continue.

---

# 8. Create the Model Component

```tsx
'use client'

import { useGLTF } from '@react-three/drei'

const MODEL_URL =
  'https://your-bucket.s3.us-east-1.amazonaws.com/models/pyramid.glb'

export function Pyramid() {
  const { scene } = useGLTF(MODEL_URL)

  return <primitive object={scene} />
}

useGLTF.preload(MODEL_URL)
```

---

# 10. Render the Model

```tsx
'use client'

import { Canvas } from '@react-three/fiber'
import {
  OrbitControls,
  Environment
} from '@react-three/drei'

import { Pyramid } from './Pyramid'

export default function Viewer() {
  return (
    <div style={{ width: '100%', height: '600px' }}>
      <Canvas camera={{ position: [5, 4, 5], fov: 45 }}>

        <ambientLight intensity={1.5} />

        <directionalLight
          position={[5, 5, 5]}
          intensity={2}
        />

        <Pyramid />

        <Environment preset="studio" />

        <OrbitControls />

      </Canvas>
    </div>
  )
}
```

---

# 11. Recommended Project Structure

```
public/
```

Leave empty for models stored in S3.

```
AWS S3

images/
models/
```

---

# 12. Troubleshooting

## Model is gray

Usually means:

- Texture wasn't saved.
- Texture wasn't connected to the material.
- UV map missing.

---

## 403 AccessDenied

Bucket permissions are incorrect.

---

## CORS Error

Bucket CORS configuration is incorrect.

---

## Model loads but textures do not

Verify:

- UV unwrap exists.
- Texture image was saved.
- Material uses Principled BSDF.
- Export format was `.glb`.

---

# 13. Final Checklist

Before exporting:

- [ ] UV unwrap complete
- [ ] Texture painted
- [ ] Texture saved
- [ ] Image Texture connected to Base Color
- [ ] Transforms applied
- [ ] Exported as `.glb`

Before deploying:

- [ ] Uploaded to S3
- [ ] Content-Type = `model/gltf-binary`
- [ ] Bucket permissions verified
- [ ] CORS configured
- [ ] URL accessible
- [ ] React Three Fiber loads successfully
