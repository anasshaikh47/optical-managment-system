import zlib
import struct
import binascii
import math
import os

def create_png(width, height, get_pixel_func):
    raw_data = bytearray()
    for y in range(height):
        raw_data.append(0)  # Filter type 0 (None)
        for x in range(width):
            r, g, b, a = get_pixel_func(x, y, width, height)
            raw_data.extend([r, g, b, a])
    
    compressed = zlib.compress(bytes(raw_data), level=9)
    
    def chunk(chunk_type, data):
        length = struct.pack(">I", len(data))
        crc = struct.pack(">I", binascii.crc32(chunk_type + data) & 0xffffffff)
        return length + chunk_type + data + crc
    
    header = b"\x89PNG\r\n\x1a\n"
    ihdr = chunk(b"IHDR", struct.pack(">IIBBBBB", width, height, 8, 6, 0, 0, 0))
    idat = chunk(b"IDAT", compressed)
    iend = chunk(b"IEND", b"")
    
    return header + ihdr + idat + iend

def draw_optical_icon(x, y, width, height):
    # Normalized coords from -1 to 1
    nx = (x - width / 2) / (width / 2)
    ny = (y - height / 2) / (height / 2)
    
    # Background: #0f172a with subtle radial gradient
    dist_center = math.sqrt(nx * nx + ny * ny)
    bg_r = int(15 + max(0, 15 * (1 - dist_center)))
    bg_g = int(23 + max(0, 25 * (1 - dist_center)))
    bg_b = int(42 + max(0, 45 * (1 - dist_center)))
    
    # Rounded badge container for standalone icon
    # Left eye rim center: (-0.38, 0.0), Right eye rim center: (+0.38, 0.0)
    rim_radius = 0.28
    rim_thickness = 0.055
    
    # Distances to lens centers
    d_left = math.sqrt((nx + 0.38) ** 2 + (ny + 0.02) ** 2)
    d_right = math.sqrt((nx - 0.38) ** 2 + (ny + 0.02) ** 2)
    
    # Check if inside left rim ring
    is_left_rim = abs(d_left - rim_radius) <= rim_thickness
    is_right_rim = abs(d_right - rim_radius) <= rim_thickness
    
    # Inside left / right lens (semi-transparent tint)
    is_left_lens = d_left < rim_radius - rim_thickness
    is_right_lens = d_right < rim_radius - rim_thickness
    
    # Bridge connecting lenses: between -0.10 and +0.10, near y = -0.05 to +0.02
    is_bridge = (
        -0.12 <= nx <= 0.12
        and abs(ny - (-0.04 + 0.25 * (nx * 2) ** 2)) <= 0.04
    )
    
    # Left temple / ear hinge
    is_left_temple = (
        nx <= -0.66
        and nx >= -0.85
        and abs(ny - (-0.06 - 0.15 * (nx + 0.66))) <= 0.035
    )
    
    # Right temple / ear hinge
    is_right_temple = (
        nx >= 0.66
        and nx <= 0.85
        and abs(ny - (-0.06 + 0.15 * (nx - 0.66))) <= 0.035
    )
    
    # Lens reflection glint (stylish diagonal slash in top-left of each lens)
    is_left_glint = (
        is_left_lens
        and abs((nx + 0.38) + (ny + 0.02) + 0.08) <= 0.03
        and -0.52 <= nx <= -0.32
    )
    is_right_glint = (
        is_right_lens
        and abs((nx - 0.38) + (ny + 0.02) + 0.08) <= 0.03
        and 0.24 <= nx <= 0.44
    )

    if is_left_rim or is_right_rim or is_bridge or is_left_temple or is_right_temple:
        # Cyan to bright sky-blue gradient #06b6d4 to #38bdf8
        blend = (nx + 1) / 2
        r = int(6 + blend * 50)
        g = int(182 + blend * 7)
        b = int(212 + blend * 36)
        return (r, g, b, 255)
    
    if is_left_glint or is_right_glint:
        return (224, 242, 254, 220)  # Light cyan glow
        
    if is_left_lens or is_right_lens:
        # Subtle lens tint
        return (int(bg_r * 0.8 + 14), int(bg_g * 0.8 + 80), int(bg_b * 0.8 + 110), 255)
        
    return (bg_r, bg_g, bg_b, 255)

os.makedirs("public", exist_ok=True)

for size, filename in [
    (192, "public/icon-192.png"),
    (512, "public/icon-512.png"),
    (180, "public/apple-touch-icon.png"),
]:
    png_bytes = create_png(size, size, draw_optical_icon)
    with open(filename, "wb") as f:
        f.write(png_bytes)
    print(f"Generated {filename} ({size}x{size}, {len(png_bytes)} bytes)")
