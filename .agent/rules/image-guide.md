---
trigger: always_on
---

# Nano Banana Image Generation Prompt Rules

When generating images using Nano Banana, the prompt must strictly follow the JSON format defined below.

## Prompt Schema

```json
{
  "image_type": "Specify the medium: 'Cel-shaded anime', 'Digital painting style', '90s OVA style', or 'Modern high-end theatrical animation'.",
  "art_style_era": "Specify the aesthetic era (e.g., 'Late 2010s digital era', '80s hand-drawn cel look') and specific artist/studio influence if applicable.",
  "mood_and_vibe": "Describe the atmosphere: 'Melancholic and nostalgic', 'High-energy Shonen vibe', or 'Soft Slice-of-Life warmth'.",
  "subject": "Character demographics, body type, and 'character design' traits (e.g., 'Slender build', 'Typical magical girl silhouette').",
  "clothing": "Detailed outfit description including specific anime tropes (e.g., 'Seifuku with red ribbon', 'Mecha-pilot suit with glowing accents').",
  "hair": "Anime-specific hair: 'Spiky gravity-defying hair', 'Smooth cel-shaded gradients', 'Twin tails with silk physics'.",
  "face_and_eyes": "Crucial for anime: Describe 'Eye shape' (e.g., large and expressive, sharp and almond-shaped), iris details, and facial expression.",
  "accessories": "Headpieces, weapons, or magical items, specifying if they have glowing effects or intricate line work.",
  "action_pose": "The dynamic nature of the pose: 'Perspective-warped foreshortening', 'Mid-air floating', or 'Classic battle stance'.",
  "location_and_background": "Describe the 'Background Art' (Bijutsu): 'Hand-painted watercolor clouds', 'Cyberpunk cityscape with neon bloom', or 'Detailed classroom interior'.",
  "lighting_and_post_processing": "Anime 'Satsuei' (Compositing) effects: 'Rim light', 'Lens flare', 'Chromatic aberration', 'Diffusion filter', or 'Soft glow (Kira-Kira)'.",
  "camera_angle_and_framing": "Cinematic framing: 'Dutch angle', 'Extreme close-up on eyes', 'Low-angle heroic shot', or 'Flat 2D lateral view'.",
  "line_art_style": "Describe the line work: 'Thick bold outlines', 'Thin delicate digital lines', or 'Colored line art/No-outline style'.",
  "color_palette": "Define the color scheme: 'Vibrant saturated colors', 'Desaturated pastel tones', or 'Monochromatic with a single accent color'.",
  "negative_prompt": "Exclude: 'Low resolution', 'Blurry hands', 'Deformed anatomy', 'Western comic style', 'Realistic 3D render', 'Messy line work'."
}
```

## Instructions

1. **Output Format**: The output must be a single valid JSON object.
2. **Completeness**: All fields are required. If a field is not applicable, provide a reasonable default or describe it as "neutral" or "standard".
3. **Detail**: Be descriptive and specific in each field to ensure high-quality image generation.
4. **Language**: The values in the JSON should be in English (as most image generation models are optimized for English prompts), unless otherwise specified.
