# Maskable Icon Placeholder

The maskable icon for the PWA manifest needs to be created at: `icons/maskable-icon.png`

Requirements:
- 192x192 pixels
- PNG format with transparency support
- Should work with maskable display mode (circular/square safe zone)
- Recommend: Simple gradient or geometric shape in ScriptForge brand colors

## Quick Creation Steps

You can create this icon using:

1. **Figma**: Create a 192x192 design with the ScriptForge logo/branding
2. **GIMP**: Open a new 192x192 image, design your icon, export as PNG
3. **Online Tools**: Use Pixlr or Canva to create a 192x192 icon
4. **ImageMagick**: 
   ```bash
   convert -size 192x192 xc:'#0D1117' \
     -fill '#2B7BFF' -draw 'circle 96,96 96,130' \
     icons/maskable-icon.png
   ```

For now, you can copy one of the existing icons and use it as a placeholder:
```bash
cp icons/icon-192x192.png icons/maskable-icon.png
```
