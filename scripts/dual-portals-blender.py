# Blender 5.1.1 — Two-Portal Identity Fix
#
# Purpose
# -------
# Solve the "same portal sees its own sister face through its transparent backside"
# problem WITHOUT teleporting the ray across the portal volume and WITHOUT skipping
# ordinary scene geometry.
#
# This script uses Cycles' Portal Depth as a 1-bit identity state:
#   odd  Portal Depth  -> the most recently crossed backside is Portal-1
#   even Portal Depth  -> the most recently crossed backside is Portal-2
#
# Each portal gets a microscopic proxy shell just OUTSIDE its five faces.
# The shell is transparent in normal viewing. When a ray has just crossed a
# portal backside, the proxy may add one extra zero-displacement Ray Portal bounce
# to normalize the parity.
#
# IMPORTANT:
# - This is for CYCLES / Ray Portal BSDF.
# - It does NOT save the .blend file.
# - Original source materials are left intact.
# - The portal objects are switched to copied "[IDENTITY FIX]" materials.
# - Re-running the script replaces the generated fix materials/proxies.
#
# Expected source names:
#   Objects:   Portal-1, Portal-2
#   Materials: Portal-1 Color, Portal-2 Color
#
# Tested design target: Blender 5.1.x node API.

import bpy
from mathutils import Matrix

# ---------------------------------------------------------------------------
# CONFIG
# ---------------------------------------------------------------------------

PORTALS = {
    "Portal-1": {
        "material": "Portal-1 Color",
        "identity": 1,   # odd Portal Depth
    },
    "Portal-2": {
        "material": "Portal-2 Color",
        "identity": 2,   # even, non-zero Portal Depth
    },
}

FIX_COLLECTION = "__PORTAL_IDENTITY_FIX__"
FIX_SUFFIX = " [IDENTITY FIX]"
PROXY_PREFIX = "__PID_PROXY__"
PROXY_MAT_PREFIX = "__PID_PROXY_MAT__"

# Proxy offset as a fraction of the largest evaluated portal dimension.
# This is tiny and does NOT jump over the space between portal faces.
PROXY_OFFSET_FACTOR = 0.0005

# Cycles counts Ray Portal BSDFs against transparent bounces.
MIN_TRANSPARENT_BOUNCES = 32

# ---------------------------------------------------------------------------
# HELPERS
# ---------------------------------------------------------------------------

def socket_by_name(sockets, name):
    s = sockets.get(name)
    if s is None:
        raise RuntimeError(f"Required socket '{name}' was not found.")
    return s


def new_math(nodes, operation, name, x, y):
    n = nodes.new("ShaderNodeMath")
    n.name = name
    n.label = name
    n.operation = operation
    n.location = (x, y)
    return n


def new_mix(nodes, name, x, y):
    n = nodes.new("ShaderNodeMixShader")
    n.name = name
    n.label = name
    n.location = (x, y)
    return n


def find_real_ray_portal(nodes):
    candidates = [
        n for n in nodes
        if n.bl_idname == "ShaderNodeBsdfRayPortal"
        and not n.name.startswith("__PID_")
    ]

    if not candidates:
        raise RuntimeError("No existing Ray Portal BSDF node was found.")

    # Prefer the existing portal node with Position/Direction wiring,
    # i.e. the portal that already points to the secret world.
    def score(n):
        score = 0
        pos = n.inputs.get("Position")
        direction = n.inputs.get("Direction")
        if pos and pos.is_linked:
            score += 10
        if direction and direction.is_linked:
            score += 5
        return score

    return max(candidates, key=score)


def restore_portal_to_base_material(obj, base_mat):
    """
    Normalize the portal object back to its ORIGINAL source material BEFORE
    deleting any generated materials.

    This makes this single script safe whether the .blend is:
      - completely clean/original, OR
      - left in a partially modified state by an earlier attempt.

    The supplied portal geometry uses one portal material on all five faces.
    """
    base_name = base_mat.name
    fixed_prefix = base_name + FIX_SUFFIX

    # 1) Replace any surviving generated fix material with the original.
    replaced = 0
    for slot in obj.material_slots:
        mat = slot.material
        if mat and (mat.name == base_name or mat.name.startswith(fixed_prefix)):
            slot.material = base_mat
            replaced += 1

    # 2) Recovery for the earlier failure mode where deleting the generated
    # material left the material slot empty.
    used_indices = {poly.material_index for poly in obj.data.polygons}

    if len(obj.material_slots) == 0:
        obj.data.materials.append(base_mat)
        for poly in obj.data.polygons:
            poly.material_index = 0
        print(f"[Portal Identity] {obj.name}: restored missing slot -> {base_name}")
        return

    if len(used_indices) == 1:
        idx = next(iter(used_indices))
        if idx < len(obj.material_slots):
            slot = obj.material_slots[idx]
            if slot.material is None or slot.material.name.startswith(fixed_prefix):
                slot.material = base_mat
                print(
                    f"[Portal Identity] {obj.name}: restored material slot "
                    f"{idx} -> {base_name}"
                )
                return

    # 3) Extra-safe fallback for the actual project structure: one material slot.
    if len(obj.material_slots) == 1:
        obj.material_slots[0].material = base_mat
        print(f"[Portal Identity] {obj.name}: normalized sole slot -> {base_name}")
        return

    if replaced:
        print(f"[Portal Identity] {obj.name}: normalized generated material -> {base_name}")
        return

    # If the object has changed to a multi-material structure we do not guess.
    if not any(slot.material == base_mat for slot in obj.material_slots):
        raise RuntimeError(
            f"{obj.name}: could not safely restore '{base_name}'. "
            f"The portal no longer matches the expected one-material structure."
        )


def remove_old_fix_for_portal(obj_name, base_material_name):
    """
    Remove ALL generated artifacts from earlier versions of this fix.

    IMPORTANT: call restore_portal_to_base_material() first.
    """
    # Remove proxy/helper objects for this portal, including Blender .001 suffixes.
    for obj in list(bpy.data.objects):
        if (
            obj.name.startswith(PROXY_PREFIX + obj_name)
            or (
                obj.get("portal_identity_proxy", False)
                and obj.get("source_portal") == obj_name
            )
        ):
            mesh = obj.data if obj.type == 'MESH' else None
            bpy.data.objects.remove(obj, do_unlink=True)
            if mesh and mesh.users == 0:
                bpy.data.meshes.remove(mesh)

    # Remove all generated fixed materials for this source material.
    fixed_prefix = base_material_name + FIX_SUFFIX
    for mat in list(bpy.data.materials):
        if mat.name.startswith(fixed_prefix):
            bpy.data.materials.remove(mat, do_unlink=True)

    # Remove all generated proxy materials for this portal.
    proxy_prefix = PROXY_MAT_PREFIX + obj_name
    for mat in list(bpy.data.materials):
        if mat.name.startswith(proxy_prefix):
            bpy.data.materials.remove(mat, do_unlink=True)


def ensure_fix_collection():
    coll = bpy.data.collections.get(FIX_COLLECTION)
    if coll is None:
        coll = bpy.data.collections.new(FIX_COLLECTION)

    scene_root = bpy.context.scene.collection
    if coll.name not in {c.name for c in scene_root.children}:
        scene_root.children.link(coll)

    coll.hide_render = False
    coll.hide_viewport = False
    return coll


def build_depth_logic(nt, x=650, y=420):
    """
    Returns sockets:
      depth
      odd              : 1 when Portal Depth is odd
      even_nonzero     : 1 when Portal Depth is even and > 0
    """
    nodes = nt.nodes
    links = nt.links

    lp = nodes.new("ShaderNodeLightPath")
    lp.name = "__PID_LightPath"
    lp.label = "PID: Light Path"
    lp.location = (x, y)

    depth = socket_by_name(lp.outputs, "Portal Depth")

    mod = new_math(nodes, "MODULO", "__PID_Depth_Mod_2", x + 210, y + 20)
    mod.inputs[1].default_value = 2.0
    links.new(depth, mod.inputs[0])

    odd = new_math(nodes, "GREATER_THAN", "__PID_Is_Odd", x + 420, y + 80)
    odd.inputs[1].default_value = 0.5
    links.new(mod.outputs[0], odd.inputs[0])

    positive = new_math(nodes, "GREATER_THAN", "__PID_Depth_Positive", x + 420, y - 80)
    positive.inputs[1].default_value = 0.5
    links.new(depth, positive.inputs[0])

    even = new_math(nodes, "LESS_THAN", "__PID_Is_Even", x + 420, y - 220)
    even.inputs[1].default_value = 0.5
    links.new(mod.outputs[0], even.inputs[0])

    even_nonzero = new_math(nodes, "MULTIPLY", "__PID_Even_And_Nonzero", x + 630, y - 150)
    links.new(positive.outputs[0], even_nonzero.inputs[0])
    links.new(even.outputs[0], even_nonzero.inputs[1])

    return depth, odd.outputs[0], even_nonzero.outputs[0]


def build_fixed_portal_material(base_mat, identity):
    """
    Build a non-destructive copied material.

    Front side:
      - same identity -> Transparent
      - other identity / camera -> existing real Ray Portal

    Back side:
      - zero-displacement Ray Portal tagger
        (increments Portal Depth while keeping the ray traveling normally)
    """
    fixed = base_mat.copy()
    fixed.name = base_mat.name + FIX_SUFFIX
    fixed.use_nodes = True

    nt = fixed.node_tree
    nodes = nt.nodes
    links = nt.links

    real_portal = find_real_ray_portal(nodes)
    real_portal.label = "REAL PORTAL → SECRET WORLD"

    output = next(
        (n for n in nodes if n.bl_idname == "ShaderNodeOutputMaterial" and n.is_active_output),
        None
    )
    if output is None:
        output = next((n for n in nodes if n.bl_idname == "ShaderNodeOutputMaterial"), None)
    if output is None:
        output = nodes.new("ShaderNodeOutputMaterial")
        output.location = (1550, 120)

    # Disconnect only Surface; keep Volume / Displacement / Thickness untouched.
    surface = socket_by_name(output.inputs, "Surface")
    for link in list(surface.links):
        links.remove(link)

    geom = nodes.new("ShaderNodeNewGeometry")
    geom.name = "__PID_Geometry"
    geom.label = "PID: Geometry"
    geom.location = (620, 760)
    backfacing = socket_by_name(geom.outputs, "Backfacing")

    _, is_odd, is_even_nonzero = build_depth_logic(nt, 620, 380)

    transparent = nodes.new("ShaderNodeBsdfTransparent")
    transparent.name = "__PID_Transparent"
    transparent.label = "PID: Ignore This Portal Surface"
    transparent.location = (1040, 20)

    tagger = nodes.new("ShaderNodeBsdfRayPortal")
    tagger.name = "__PID_Backside_Tagger"
    tagger.label = "PID: Straight-Through Backside Tag"
    tagger.location = (1040, 700)
    # Position and Direction intentionally left UNCONNECTED.
    # In Cycles Ray Portal this means current hit position/current view direction.

    same_identity = is_odd if identity == 1 else is_even_nonzero

    # Front-facing behavior:
    # factor 0 -> REAL PORTAL
    # factor 1 -> TRANSPARENT
    front_mix = new_mix(nodes, "__PID_Front_SamePortal_Filter", 1280, 260)
    links.new(same_identity, front_mix.inputs[0])
    links.new(real_portal.outputs[0], front_mix.inputs[1])
    links.new(transparent.outputs[0], front_mix.inputs[2])

    # Final behavior:
    # frontface -> filtered front shader
    # backface  -> straight-through tagger
    final_mix = new_mix(nodes, "__PID_Front_Back_Switch", 1500, 420)
    links.new(backfacing, final_mix.inputs[0])
    links.new(front_mix.outputs[0], final_mix.inputs[1])
    links.new(tagger.outputs[0], final_mix.inputs[2])

    links.new(final_mix.outputs[0], surface)

    return fixed


def build_proxy_material(obj_name, identity):
    """
    Proxy correction shell.

    Portal-1 wants odd depth.
      If original backside made the depth even/nonzero, add one portal bounce.

    Portal-2 wants even/nonzero depth.
      If original backside made the depth odd, add one portal bounce.

    The correction is ONLY allowed on the proxy BACKFACE.
    A normal camera ray hitting the proxy from the convex/front side sees only
    Transparent BSDF and Portal Depth is not changed.
    """
    mat = bpy.data.materials.new(PROXY_MAT_PREFIX + obj_name)
    mat.use_nodes = True

    nt = mat.node_tree
    nodes = nt.nodes
    links = nt.links
    nodes.clear()

    output = nodes.new("ShaderNodeOutputMaterial")
    output.location = (1000, 120)

    geom = nodes.new("ShaderNodeNewGeometry")
    geom.location = (-800, 360)
    geom.name = "__PID_PROXY_Geometry"
    backfacing = socket_by_name(geom.outputs, "Backfacing")

    _, is_odd, is_even_nonzero = build_depth_logic(nt, -800, 40)

    transparent = nodes.new("ShaderNodeBsdfTransparent")
    transparent.name = "__PID_PROXY_Transparent"
    transparent.label = "Proxy Transparent"
    transparent.location = (330, 0)

    tagger = nodes.new("ShaderNodeBsdfRayPortal")
    tagger.name = "__PID_PROXY_Tagger"
    tagger.label = "Proxy: Add One Portal-Depth Bit"
    tagger.location = (330, 260)
    # Position / Direction intentionally unconnected -> straight-through.

    parity_needs_fix = is_even_nonzero if identity == 1 else is_odd

    # Only correct on the backside of the OUTWARD proxy shell.
    correction = new_math(nodes, "MULTIPLY", "__PID_PROXY_Do_Correction", 100, 330)
    links.new(backfacing, correction.inputs[0])
    links.new(parity_needs_fix, correction.inputs[1])

    mix = new_mix(nodes, "__PID_PROXY_Mix", 650, 150)
    links.new(correction.outputs[0], mix.inputs[0])
    links.new(transparent.outputs[0], mix.inputs[1])
    links.new(tagger.outputs[0], mix.inputs[2])

    links.new(mix.outputs[0], socket_by_name(output.inputs, "Surface"))
    return mat


def build_proxy_object(source_obj, proxy_mat, collection):
    """
    Make one independent proxy polygon for each evaluated source polygon,
    offset slightly along that polygon's outward world-space normal.

    The proxy is NOT a bounding box and does NOT skip the space inside the portal.
    """
    depsgraph = bpy.context.evaluated_depsgraph_get()
    eval_obj = source_obj.evaluated_get(depsgraph)

    mesh_eval = eval_obj.to_mesh()
    if mesh_eval is None:
        raise RuntimeError(f"Could not evaluate mesh for {source_obj.name}")

    try:
        max_dim = max(abs(d) for d in source_obj.dimensions)
        if max_dim <= 1e-9:
            max_dim = 1.0
        eps = max_dim * PROXY_OFFSET_FACTOR

        mw = eval_obj.matrix_world
        normal_matrix = mw.to_3x3().inverted().transposed()

        verts = []
        faces = []

        # Separate vertices per polygon so every proxy face is a clean,
        # parallel copy of the corresponding source face.
        for poly in mesh_eval.polygons:
            world_n = (normal_matrix @ poly.normal).normalized()
            face = []

            for vi in poly.vertices:
                world_p = mw @ mesh_eval.vertices[vi].co
                proxy_p = world_p + world_n * eps
                face.append(len(verts))
                verts.append(proxy_p)

            faces.append(face)

        proxy_mesh = bpy.data.meshes.new(PROXY_PREFIX + source_obj.name + "_Mesh")
        proxy_mesh.from_pydata(verts, [], faces)
        proxy_mesh.update()

        proxy_obj = bpy.data.objects.new(PROXY_PREFIX + source_obj.name, proxy_mesh)
        proxy_obj.matrix_world = Matrix.Identity(4)
        proxy_obj.data.materials.append(proxy_mat)

        # IMPORTANT: do NOT use Display As = WIRE here.
        # These proxy shells sit directly around the portal faces, so WIRE
        # display makes their edges appear as black outlines in the viewport.
        # TEXTURED keeps the helper geometry visually governed by its shader
        # (which is transparent except when it performs the ray-state correction).
        proxy_obj.display_type = 'TEXTURED'
        proxy_obj.show_wire = False
        proxy_obj.show_all_edges = False
        proxy_obj.hide_select = True
        proxy_obj.show_name = False
        proxy_obj["portal_identity_proxy"] = True
        proxy_obj["source_portal"] = source_obj.name
        proxy_obj["proxy_offset"] = eps

        collection.objects.link(proxy_obj)

        print(
            f"[Portal Identity] Created {proxy_obj.name}: "
            f"{len(faces)} faces, outward offset {eps:.8f}"
        )

        return proxy_obj

    finally:
        eval_obj.to_mesh_clear()


def assign_fixed_material(obj, original_name, fixed_mat):
    """
    Assign the generated fixed material safely, including recovery from a
    previous failed/re-run version of this script.

    Normal cases:
      - slot contains original material
      - slot contains an older [IDENTITY FIX] material

    Recovery case:
      - older script deleted the generated material with do_unlink=True,
        leaving the portal's material slot empty (None)

    The source project specification says all five polygons of each portal use
    the same portal material, so if no named material survives we recover the
    single material index actually used by the portal mesh.
    """
    replaced = 0

    # Normal replacement by material name.
    for slot in obj.material_slots:
        mat = slot.material
        if mat is None:
            continue

        if (
            mat.name == original_name
            or mat.name == original_name + FIX_SUFFIX
            or mat.name.startswith(original_name + FIX_SUFFIX + ".")
        ):
            slot.material = fixed_mat
            replaced += 1

    if replaced:
        print(
            f"[Portal Identity] {obj.name}: assigned "
            f"{fixed_mat.name} to {replaced} material slot(s)."
        )
        return

    # ------------------------------------------------------------------
    # RECOVERY PATH
    # ------------------------------------------------------------------
    # A previous version could remove the old generated material before
    # assigning the new one. Blender then leaves the material slot empty.
    #
    # Determine which material index the portal polygons actually use.
    mesh = obj.data
    used_indices = {poly.material_index for poly in mesh.polygons}

    # No material slots at all: create slot 0.
    if len(obj.material_slots) == 0:
        mesh.materials.append(fixed_mat)
        for poly in mesh.polygons:
            poly.material_index = 0

        print(
            f"[Portal Identity] {obj.name}: RECOVERED missing material slot; "
            f"created slot 0 with {fixed_mat.name}."
        )
        return

    # All portal polygons use one material index, which matches the project
    # description (all five faces use the same portal material).
    if len(used_indices) == 1:
        idx = next(iter(used_indices))

        if idx < len(obj.material_slots):
            obj.material_slots[idx].material = fixed_mat

            print(
                f"[Portal Identity] {obj.name}: RECOVERED empty/unnamed "
                f"portal material slot {idx}; assigned {fixed_mat.name}."
            )
            return

    # Extra-safe fallback for the common one-slot portal object.
    if len(obj.material_slots) == 1:
        obj.material_slots[0].material = fixed_mat

        print(
            f"[Portal Identity] {obj.name}: RECOVERED sole material slot; "
            f"assigned {fixed_mat.name}."
        )
        return

    # If the geometry no longer matches the supplied portal specification,
    # stop rather than overwriting unrelated materials.
    raise RuntimeError(
        f"{obj.name}: could not determine which material slot belongs to "
        f"'{original_name}'. Portal has {len(obj.material_slots)} slots and "
        f"polygon material indices {sorted(used_indices)}."
    )


def validate_source():
    errors = []

    for obj_name, cfg in PORTALS.items():
        obj = bpy.data.objects.get(obj_name)
        if obj is None:
            errors.append(f"Missing object: {obj_name}")
        elif obj.type != 'MESH':
            errors.append(f"{obj_name} is type {obj.type}, expected MESH")

        mat = bpy.data.materials.get(cfg["material"])
        if mat is None:
            errors.append(f"Missing material: {cfg['material']}")
        elif not mat.use_nodes:
            errors.append(f"Material does not use nodes: {cfg['material']}")
        else:
            rp = [
                n for n in mat.node_tree.nodes
                if n.bl_idname == "ShaderNodeBsdfRayPortal"
            ]
            if not rp:
                errors.append(f"No Ray Portal BSDF in: {cfg['material']}")

            lp = [
                n for n in mat.node_tree.nodes
                if n.bl_idname == "ShaderNodeLightPath"
            ]
            if lp and lp[0].outputs.get("Portal Depth") is None:
                errors.append(
                    "This Blender build has no Light Path → Portal Depth output."
                )

    if errors:
        raise RuntimeError(
            "\n".join(["Portal Identity preflight FAILED:"] + [f"  - {e}" for e in errors])
        )


def warn_about_other_ray_portals():
    expected = {cfg["material"] for cfg in PORTALS.values()}
    others = []

    for mat in bpy.data.materials:
        if not mat.use_nodes or mat.name in expected:
            continue

        if any(
            n.bl_idname == "ShaderNodeBsdfRayPortal"
            for n in mat.node_tree.nodes
        ):
            # Ignore our generated materials.
            if FIX_SUFFIX not in mat.name and not mat.name.startswith(PROXY_MAT_PREFIX):
                others.append(mat.name)

    if others:
        print()
        print("[Portal Identity] WARNING:")
        print("  Other materials in this file also contain Ray Portal BSDF nodes:")
        for name in others:
            print("   -", name)
        print(
            "  Portal Depth is being used as a 1-bit identity state. "
            "Unrelated Ray Portal BSDFs can change that state."
        )
        print()


def main():
    print("\n" + "=" * 72)
    print("BLENDER FINAL ONE-RUN TWO-PORTAL IDENTITY FIX")
    print("=" * 72)

    validate_source()

    if bpy.context.scene.render.engine != 'CYCLES':
        print(
            f"[Portal Identity] WARNING: render engine is "
            f"{bpy.context.scene.render.engine}; Ray Portal BSDF requires Cycles."
        )

    # Ray Portal is counted against Cycles transparent bounces.
    cycles = getattr(bpy.context.scene, "cycles", None)
    if cycles and hasattr(cycles, "transparent_max_bounces"):
        old = cycles.transparent_max_bounces
        if old < MIN_TRANSPARENT_BOUNCES:
            cycles.transparent_max_bounces = MIN_TRANSPARENT_BOUNCES
            print(
                f"[Portal Identity] Transparent Max Bounces: "
                f"{old} -> {MIN_TRANSPARENT_BOUNCES}"
            )

    warn_about_other_ray_portals()

    fix_collection = ensure_fix_collection()

    # SELF-CONTAINED CLEAN START:
    # First restore each portal to its original material, THEN remove any helper
    # data left by an earlier attempt. This avoids empty material slots.
    for obj_name, cfg in PORTALS.items():
        obj = bpy.data.objects[obj_name]
        base_mat = bpy.data.materials[cfg["material"]]
        restore_portal_to_base_material(obj, base_mat)

    bpy.context.view_layer.update()

    for obj_name, cfg in PORTALS.items():
        remove_old_fix_for_portal(obj_name, cfg["material"])

    bpy.context.view_layer.update()

    for obj_name, cfg in PORTALS.items():
        obj = bpy.data.objects[obj_name]
        base_mat = bpy.data.materials[cfg["material"]]
        identity = cfg["identity"]

        fixed_mat = build_fixed_portal_material(base_mat, identity)
        assign_fixed_material(obj, cfg["material"], fixed_mat)

        proxy_mat = build_proxy_material(obj_name, identity)
        build_proxy_object(obj, proxy_mat, fix_collection)

    bpy.context.view_layer.update()

    print()
    print("[Portal Identity] DONE.")
    print()
    print("Expected result:")
    print("  Portal-1 backside -> Portal-1 sister fronts are ignored")
    print("  Portal-1 backside -> Portal-2 front still works")
    print("  Portal-2 backside -> Portal-2 sister fronts are ignored")
    print("  Portal-2 backside -> Portal-1 front still works")
    print("  Ordinary geometry between portal faces is still intersected normally")
    print()
    print("Nothing was auto-saved. Test in Cycles Rendered view before saving.")
    print("=" * 72 + "\n")


main()
