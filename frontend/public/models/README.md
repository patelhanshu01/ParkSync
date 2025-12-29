Place glTF (.glb/.gltf) and USDZ assets here for the Parking 3D/AR demo.

Recommendations:
- Put `parking.glb` and `parking.usdz` at the root of this folder (the demo expects `/models/parking.glb` and `/models/parking.usdz`).
- Optimize GLB: use Draco compression, reduce texture sizes, and combine materials to keep mobile performance good.
- Generate USDZ for iOS Quick Look (Blender + USDZ Exporter, or online converters).
- Test assets on Android (Scene Viewer), iOS (Quick Look), and desktop (model-viewer fallback).

Useful tools:
- gltfpack (facebookresearch)
- gltf-transform
- Blender for exports and USDZ conversion

If you want, I can add a small script to verify file presence and run glTF optimizations (draco/gltf-transform) automatically.
