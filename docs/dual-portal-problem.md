# Blender 5.1.1 — Ray Portal Self-Visibility Problem

## Objective

I need help solving a specific Ray Portal shader problem in **Blender 5.1.1**.

Please read this entire description before proposing a solution.

**Do not immediately start changing `Portal Depth`, adding arbitrary ray offsets, or changing the geometry. Several approaches have already been tested and failed.**

The Blender file will be restored to the **original starting state** described below before attempting a new solution.

---

# 1. Environment

- Blender **5.1.1**
- Using **Ray Portal BSDF**
- Two separate portal objects:
  - `Portal-1`
  - `Portal-2`
- Two separate materials:
  - `Portal-1 Color`
  - `Portal-2 Color`

Both portals have essentially the same geometry and shader-node configuration.

The portals lead visually into a separate "secret world."

---

# 2. Portal Geometry

Each portal is a **5-sided open rectangular box**.

Imagine a rectangular cube/prism with one face removed:

```text
      ┌───────────────┐
     /               /|
    /               / |
   ┌───────────────┐  |
   │               │  |
   │               │  |
   │               │ /
   │               │/
   └───────────────┘
        OPEN SIDE
```

There are:

- 8 vertices
- 12 edges
- 5 faces

There are NOT duplicate/coincident front/back polygons.

There is NOT a Solidify modifier creating two layers of faces.

Each individual polygon is a zero-thickness surface.

However, the five faces together form a **concave 3D rectangular box**.

A Python diagnostic produced approximately:

```text
Portal-1:

Vertices: 8
Edges: 12
Faces: 5

Dimensions:
X = 3.227035
Y = 0.954295
Z = 4.539313
```

The five face normals were approximately:

```text
Face 0: ( 1,  0,  0)
Face 1: (-1,  0,  0)
Face 2: ( 0,  1,  0)
Face 3: ( 0,  0,  1)
Face 4: ( 0,  0, -1)
```

Portal-2 has the same general geometry.

All five faces of Portal-1 use:

```text
Portal-1 Color
```

All five faces of Portal-2 use:

```text
Portal-2 Color
```

---

# 3. Intended Portal Behavior

Each polygon has two visually different sides.

## Convex/outside side

The convex side should act as a portal into the secret world:

```text
Ray Portal BSDF
```

## Concave/inside side

The concave side should be transparent:

```text
Transparent BSDF
```

Conceptually:

```text
       CONCAVE SIDE
            ↓
       TRANSPARENT

       ───────────
          FACE
       ───────────

        RAY PORTAL
            ↑
        CONVEX SIDE
```

---

# 4. ORIGINAL Shader Node Graph

This is important.

Both portal materials begin with approximately this node graph:

```text
Geometry
  │
  └── Backfacing ───────────────┐
                                │
Light Path                      │
  │                             │
  └── Transparent Depth ────────┤
                                ↓
                              ADD
                                │
                                ↓
                         Mix Shader Factor
                         /               \
                        /                 \
               Ray Portal BSDF       Transparent BSDF
                        \                 /
                         \               /
                          Material Output
```

More specifically:

```text
Geometry.Backfacing
        ↓
      Add.Value

Light Path.Transparent Depth
        ↓
      Add.Value

Add.Value
        ↓
Mix Shader.Factor
```

The Mix Shader contains:

```text
Shader 1 = Ray Portal BSDF
Shader 2 = Transparent BSDF
```

Therefore the intended logic appears to be approximately:

```text
Factor = Backfacing + Transparent Depth
```

with:

```text
Factor = 0
    → Ray Portal

Factor >= 1
    → Transparent
```

---

# 5. Ray Portal Coordinate Setup

The Ray Portal BSDF is also connected approximately like this:

```text
Texture Coordinate
      │
      └── Object
            ↓
         Mapping
            ↓
      Ray Portal BSDF
```

The Mapping node currently has values approximately like:

```text
Location:
X = 0
Y = 0
Z = 150

Rotation:
X = 0
Y = 0
Z = 0

Scale:
X = 10
Y = 10
Z = 10
```

The Mapping output is connected to the Ray Portal BSDF.

Do not assume this coordinate setup is irrelevant to the problem.

---

# 6. The Actual Problem

The problem is specifically about looking through the **transparent backside** of one of the five portal faces.

## Case A — SAME portal

Relative to my viewpoint in Blender:

```text
MY EYE
   ↓

backside of Portal-1 Face A
   ↓
Transparent

   ↓

normal scene space

   ↓

frontside of Portal-1 Face B
   ↓
Ray Portal becomes visible
```

This is WRONG.

Because Face A and Face B are both part of **Portal-1**, I want Face B to remain transparent when viewed through the transparent backside of Face A.

Desired behavior:

```text
MY EYE
   ↓
Portal-1 Face A backside
   ↓
transparent
   ↓
ordinary scene
   ↓
Portal-1 Face B frontside
   ↓
ALSO TRANSPARENT
```

In other words:

> Once I am looking through the transparent backside of Portal-1, other sister faces belonging to Portal-1 should not suddenly become visible as portal surfaces.

---

# 7. DIFFERENT Portal Behavior Already Works

This is extremely important.

If I look through the transparent backside of Portal-1 and Portal-2 is behind it:

```text
MY EYE
   ↓
Portal-1 backside
   ↓
transparent
   ↓
ordinary scene
   ↓
Portal-2 frontside
   ↓
PORTAL-2 WORKS
```

That is CORRECT.

Likewise:

```text
MY EYE
   ↓
Portal-2 backside
   ↓
transparent
   ↓
Portal-1 frontside
   ↓
PORTAL-1 WORKS
```

Therefore the desired distinction is:

```text
Portal-1 backside
        ↓
Portal-1 sister face
        ↓
TRANSPARENT
```

but:

```text
Portal-1 backside
        ↓
Portal-2 face
        ↓
NORMAL PORTAL
```

And vice versa.

---

# 8. Ordinary Geometry Must Remain Visible

This is another critical requirement.

There can be ordinary Blender geometry physically located between two faces of the same portal.

For example:

```text
MY EYE
   ↓
Portal-1 backside
   ↓
ordinary object
   ↓
Portal-1 sister face
```

The desired result is:

```text
Portal-1 backside
    → transparent

ordinary object
    → VISIBLE NORMALLY

Portal-1 sister face
    → transparent
```

Therefore a solution CANNOT simply teleport the ray from the first portal face to the far side of Portal-1.

It must not skip ordinary geometry.

---

# 9. What the Shader Seems Intended to Do

The original shader contains:

```text
Backfacing + Transparent Depth
```

This appears intended to solve exactly this problem.

Example:

Camera hits the backside of Portal-1 Face A:

```text
Backfacing = 1
Transparent Depth = 0

1 + 0 = 1
```

Therefore:

```text
Transparent BSDF
```

The ray then continues and hits the front of Portal-1 Face B.

One might expect:

```text
Backfacing = 0
Transparent Depth = 1

0 + 1 = 1
```

Therefore Face B should ALSO use:

```text
Transparent BSDF
```

But in practice, I still see the Ray Portal on that sister face.

This discrepancy is potentially the key to the entire bug.

Before redesigning the portal system, determine what Blender 5.1.1/Cycles is **actually reporting for `Transparent Depth` at the second surface hit**.

Do not merely assume it is `1`.

---

# 10. Important Diagnostic Question

One of the first things that should probably be tested is:

> When a camera ray passes through the Transparent BSDF on the backside of Portal-1 Face A and then reaches Portal-1 Face B, what value does `Light Path → Transparent Depth` actually have while shading Face B?

A useful diagnostic may be to temporarily visualize:

```text
Transparent Depth
```

directly as a grayscale/emission value instead of using it to control the portal.

This would establish whether the problem is:

1. `Transparent Depth` unexpectedly becomes/stays `0`, OR
2. `Transparent Depth` is correctly `1`, but the Mix Shader logic behaves differently than expected, OR
3. the Ray Portal traversal/coordinate setup changes the relevant ray state, OR
4. something else is occurring.

Please diagnose this before replacing the entire architecture.

---

# 11. Approaches Already Tried

Several experimental solutions have already been attempted.

They should NOT be blindly repeated.

## Attempt 1 — Replace Transparent Depth with Portal Depth

We changed:

```text
Light Path.Transparent Depth
```

to:

```text
Light Path.Portal Depth
```

This did not solve the fundamental problem.

`Portal Depth` counts portal traversal but does not appear to encode:

```text
Portal-1 vs Portal-2
```

It therefore cannot directly express:

```text
came through Portal-1
        +
hit Portal-1
        =
ignore
```

versus:

```text
came through Portal-1
        +
hit Portal-2
        =
render
```

---

## Attempt 2 — Portal Recursion Threshold

We tried logic approximately:

```text
MAX(
    Backfacing,
    Portal Depth > 6
)
```

This was intended to prevent infinite portal recursion.

It did NOT solve the same-portal identity problem.

Do not treat recursion depth and portal identity as the same problem.

---

## Attempt 3 — Fixed Ray Origin Offset

The backside Transparent BSDF was experimentally replaced with a straight-through Ray Portal BSDF.

The new ray position was moved forward by a fixed distance.

Conceptually:

```text
backside hit
    ↓
restart ray some distance ahead
```

Small distances did not reliably solve the problem.

Large distances skipped unrelated scene geometry.

This is not acceptable.

---

## Attempt 4 — Jump to Portal Bounding-Box Exit

A Python script calculated where the current viewing ray would leave Portal-1's bounding box.

It then restarted the ray immediately outside Portal-1.

This DID successfully solve:

```text
Portal-1 backside
    ↓
Portal-1 sister face
```

while preserving:

```text
Portal-1 backside
    ↓
Portal-2
```

So Portal-1 and Portal-2 interacted correctly.

HOWEVER, it introduced a fatal problem.

Anything physically inside Portal-1's bounding-box volume was skipped by the ray.

The portal became a **cross-section cutter**.

Example:

```text
MY EYE
   ↓
Portal-1 backside
   ↓

[ray teleports across Portal-1]

   ↓
ordinary geometry inside that space disappears
```

This violates the requirement that ordinary objects remain visible.

DO NOT solve this by jumping to the portal's bounding-box exit.

---

## Attempt 5 — Give Portals Different Ray-Type "Identities"

Another experiment attempted to use different passthrough shaders for Portal-1 and Portal-2.

For example:

```text
Portal-1 backside
    → Transparent BSDF
    → detect Is Transparent Ray
```

and:

```text
Portal-2 backside
    → Refraction/Transmission with IOR 1
    → detect Is Transmission Ray
```

The theory was that this would create a crude portal identity system.

This did not successfully solve the problem.

Do not assume this technique works without independently verifying Blender/Cycles behavior.

---

# 12. Core Technical Problem

The logical behavior I want is essentially:

```python
if ray_enters_backside_of_portal:

    source_portal = identity_of_that_portal

    continue_ray_normally()

    if ray_hits_ordinary_geometry:
        render_geometry_normally()

    if ray_hits_another_portal_face:

        if hit_portal == source_portal:
            ignore_that_portal_surface()
            continue_ray_normally()

        else:
            render_other_portal_normally()
```

Therefore the difficult part is maintaining something equivalent to:

```text
SOURCE PORTAL IDENTITY
```

along the ray.

I need to distinguish:

```text
ray came through Portal-1
        ↓
hits Portal-1
        ↓
IGNORE
```

from:

```text
ray came through Portal-1
        ↓
hits Portal-2
        ↓
RENDER PORTAL-2
```

while also allowing:

```text
ray came through Portal-1
        ↓
hits ordinary mesh
        ↓
RENDER ORDINARY MESH
```

---

# 13. Requirements for a Successful Solution

A solution must satisfy ALL of these:

1. Portal-1 convex/front-facing surfaces work as Ray Portals.
2. Portal-2 convex/front-facing surfaces work as Ray Portals.
3. Portal-1 concave/back-facing surfaces are transparent.
4. Portal-2 concave/back-facing surfaces are transparent.
5. Looking through a Portal-1 backside causes Portal-1 sister faces to remain transparent.
6. Looking through a Portal-2 backside causes Portal-2 sister faces to remain transparent.
7. Looking through Portal-1 does NOT disable Portal-2.
8. Looking through Portal-2 does NOT disable Portal-1.
9. Ordinary geometry remains visible between portal surfaces.
10. No bounding-box ray teleport that skips ordinary geometry.
11. Do not remove the five portal faces. They are intentional.
12. Do not assume the portal should be a single flat plane.
13. Do not assume there are duplicate/coincident faces.
14. Do not confuse individual polygon thickness with the spatial depth of the five-sided portal box.
15. Prefer a solution that can ultimately be configured automatically using Blender Python.

---

# 14. Starting State

I will restore the `.blend` file to the original state BEFORE experimental scripts were applied.

Assume the starting material graph is the one shown here:

```text
Geometry.Backfacing ───────────┐
                               │
                               ↓
                              ADD
                               ↑
                               │
Light Path.Transparent Depth ──┘
                               │
                               ↓
                        Mix Shader Factor
                        /               \
                       /                 \
              Ray Portal BSDF       Transparent BSDF
                       \                 /
                        \               /
                         Material Output
```

Do NOT assume any of the experimental Python modifications are still present.

---

# 15. Recommended Investigation Order

Before writing a large destructive Python script, investigate the problem in this order:

### Step 1 — Verify `Transparent Depth`

Determine the actual value of:

```text
Light Path → Transparent Depth
```

when:

```text
camera
 ↓
Portal-1 backside
 ↓
Transparent BSDF
 ↓
Portal-1 sister face
```

The existing node graph appears specifically designed to make that sister face transparent, so determine why it does not.

### Step 2 — Verify Mix Shader behavior

If `Transparent Depth` is greater than zero at the sister face, verify what value actually reaches:

```text
Mix Shader → Factor
```

and which shader input Blender selects.

### Step 3 — Compare SAME vs DIFFERENT portal

Determine what shader/ray state differs between:

```text
Portal-1 backside
    ↓
Portal-1 frontside
```

and:

```text
Portal-1 backside
    ↓
Portal-2 frontside
```

This comparison is critical because the second case already works.

### Step 4 — Inspect Ray Portal effects on path state

Determine whether Ray Portal BSDF changes/resets any relevant:

- Transparent Depth
- Portal Depth
- ray type
- path state
- coordinate behavior

in Blender 5.1.1/Cycles.

### Step 5 — Only then design a replacement

If Blender shader nodes fundamentally cannot preserve enough information to identify the source portal, explicitly establish that limitation.

Then investigate a different architecture, potentially involving:

- portal-specific proxy geometry
- object/collection ray visibility
- duplicated rendering geometry
- view layers
- compositing
- portal-specific scene copies
- Cycles-specific mechanisms
- another Blender-supported way to distinguish the two portal objects

But any alternative must preserve ordinary geometry between portal faces.

---

# 16. What NOT to Do

Please do NOT immediately suggest:

```text
increase Portal Depth
```

or:

```text
use Portal Depth > N
```

or:

```text
move the ray origin 0.01 units
```

or:

```text
jump to the other side of the bounding box
```

or:

```text
delete four of the five faces
```

or:

```text
make the portal a single flat plane
```

Those either have already failed or change the intended geometry.

The most interesting unresolved fact is this:

> The ORIGINAL material already uses `Backfacing + Transparent Depth`, which appears logically intended to make sister faces transparent after the ray passes through a transparent backside. Yet the observed Blender 5.1.1 result does not match that expected logic.
