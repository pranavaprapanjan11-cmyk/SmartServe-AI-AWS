import os
import sys
import io
import json
import cv2
import numpy as np
import pytesseract

# Force stdout/stderr to UTF-8 to prevent CP1252 charmap encoding errors on Windows
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8')

# Handle health check command line argument
if len(sys.argv) > 1 and sys.argv[1] == '--health':
    health = {
        "easyocr": False,
        "tesseract": False,
        "torch": False,
        "easyocrVersion": "Unknown",
        "tesseractVersion": "Unknown",
        "torchVersion": "Unknown",
        "pythonVersion": sys.version,
        "error": None
    }
    
    try:
        import torch
        health["torch"] = True
        health["torchVersion"] = torch.__version__
    except Exception as e:
        health["error"] = f"Torch load failed: {e}"
        
    try:
        import easyocr
        health["easyocr"] = True
        health["easyocrVersion"] = easyocr.__version__
        # Try a dummy loading of Reader to confirm torch is working and models are fine
        script_dir = os.path.dirname(os.path.abspath(__file__))
        model_dir = os.path.join(script_dir, 'easyocr_models')
        easyocr.Reader(['en'], gpu=False, model_storage_directory=model_dir, download_enabled=False)
    except Exception as e:
        health["easyocr"] = False
        if health["error"]:
            health["error"] += f" | EasyOCR init failed: {e}"
        else:
            health["error"] = f"EasyOCR init failed: {e}"
            
    try:
        v = pytesseract.get_tesseract_version()
        health["tesseract"] = True
        health["tesseractVersion"] = str(v)
    except Exception as e:
        if health["error"]:
            health["error"] += f" | Tesseract load failed: {e}"
        else:
            health["error"] = f"Tesseract load failed: {e}"
            
    print(json.dumps(health))
    sys.exit(0)

# Import easyocr here so it is not imported if running Tesseract only, but since we run both, importing here is clean
try:
    import easyocr
except Exception as e:
    pass

INPUT = sys.argv[1] if len(sys.argv) > 1 else None
OUTPUT = sys.argv[2] if len(sys.argv) > 2 else None
LANGUAGES = os.environ.get('OCR_LANGS', 'en').split(',')

if not INPUT or not OUTPUT:
    print(json.dumps({'error': 'input and output paths required'}))
    sys.exit(1)

if not os.path.exists(INPUT):
    print(json.dumps({'error': 'input not found'}))
    sys.exit(1)

script_dir = os.path.dirname(os.path.abspath(__file__))
model_dir = os.path.join(script_dir, 'easyocr_models')
user_network_dir = os.path.join(script_dir, 'easyocr_user_network')
os.makedirs(model_dir, exist_ok=True)
os.makedirs(user_network_dir, exist_ok=True)

img = cv2.imread(INPUT)
if img is None:
    print(json.dumps({'error': 'unable to read image'}))
    sys.exit(1)

def get_skew_angle(cv_image):
    if len(cv_image.shape) == 3:
        gray = cv2.cvtColor(cv_image, cv2.COLOR_BGR2GRAY)
    else:
        gray = cv_image
    _, thresh = cv2.threshold(gray, 0, 255, cv2.THRESH_BINARY | cv2.THRESH_OTSU)
    if np.mean(thresh) > 127:
        thresh = 255 - thresh
    kernel = cv2.getStructuringElement(cv2.MORPH_RECT, (30, 5))
    dilate = cv2.dilate(thresh, kernel, iterations=5)
    contours, _ = cv2.findContours(dilate, cv2.RETR_LIST, cv2.CHAIN_APPROX_SIMPLE)
    angles = []
    for c in contours:
        if cv2.contourArea(c) < 500:
            continue
        rect = cv2.minAreaRect(c)
        angle = rect[-1]
        if angle < -45:
            angle = -(90 + angle)
        else:
            angle = -angle
        if abs(angle) > 0.5 and abs(angle) < 45.0:
            angles.append(angle)
    return float(np.median(angles)) if angles else 0.0

def rotate_image(image, angle):
    if abs(angle) < 0.5:
        return image
    (h, w) = image.shape[:2]
    center = (w // 2, h // 2)
    M = cv2.getRotationMatrix2D(center, angle, 1.0)
    return cv2.warpAffine(image, M, (w, h), flags=cv2.INTER_CUBIC, borderMode=cv2.BORDER_REPLICATE)

# Pipeline Step Functions
def to_grayscale(image):
    if len(image.shape) == 3:
        return cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
    return image

def enhance_contrast(image):
    clahe = cv2.createCLAHE(clipLimit=3.0, tileGridSize=(8, 8))
    return clahe.apply(image)

def adaptive_threshold(image):
    thresh = cv2.adaptiveThreshold(
        image, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C, cv2.THRESH_BINARY, 31, 10
    )
    if np.mean(thresh) < 127:
        thresh = 255 - thresh
    return thresh

def denoise(image):
    return cv2.medianBlur(image, 3)

def sharpen(image):
    sharpen_kernel = np.array([[0, -1, 0], [-1, 5, -1], [0, -1, 0]], dtype=np.float32)
    return cv2.filter2D(image, -1, sharpen_kernel)

def deskew(image):
    angle = get_skew_angle(image)
    return rotate_image(image, angle)

def upscale_3x(image):
    return cv2.resize(image, None, fx=3.0, fy=3.0, interpolation=cv2.INTER_CUBIC)

# Generate processed versions according to pipeline requirements
original = img

gray = to_grayscale(img)
enhanced = enhance_contrast(gray)

# processed_a: Grayscale + Contrast Enhancement + Deskew + 3x Upscale
deskewed_a = deskew(enhanced)
processed_a = upscale_3x(deskewed_a)

# processed_b: Grayscale + Contrast Enhancement + Adaptive Threshold + Denoising + Deskew + 3x Upscale
thresh_b = adaptive_threshold(enhanced)
denoised_b = denoise(thresh_b)
deskewed_b = deskew(denoised_b)
processed_b = upscale_3x(deskewed_b)

# processed_c: Grayscale + Contrast Enhancement + Sharpening + Deskew + 3x Upscale
sharpened_c = sharpen(enhanced)
deskewed_c = deskew(sharpened_c)
processed_c = upscale_3x(deskewed_c)

# Save debug output images
filename = os.path.basename(INPUT)
file_id_no_ext = os.path.splitext(filename)[0]
uploads_dir = os.path.dirname(INPUT)
debug_dir = os.path.join(uploads_dir, 'debug', file_id_no_ext)
os.makedirs(debug_dir, exist_ok=True)

original_path = os.path.join(debug_dir, 'original.jpg')
processed_a_path = os.path.join(debug_dir, 'processed_a.jpg')
processed_b_path = os.path.join(debug_dir, 'processed_b.jpg')
processed_c_path = os.path.join(debug_dir, 'processed_c.jpg')

cv2.imwrite(original_path, original)
cv2.imwrite(processed_a_path, processed_a)
cv2.imwrite(processed_b_path, processed_b)
cv2.imwrite(processed_c_path, processed_c)

versions = {
    'original': original,
    'processed_a': processed_a,
    'processed_b': processed_b,
    'processed_c': processed_c
}

# Line grouping helper
def group_boxes_into_lines(detections, y_threshold_ratio=0.4):
    processed = []
    for bbox, text, conf in detections:
        x_min = min(pt[0] for pt in bbox)
        x_max = max(pt[0] for pt in bbox)
        y_min = min(pt[1] for pt in bbox)
        y_max = max(pt[1] for pt in bbox)
        processed.append({
            'bbox': bbox,
            'text': text,
            'conf': conf,
            'x_min': x_min,
            'x_max': x_max,
            'y_min': y_min,
            'y_max': y_max,
            'height': y_max - y_min
        })
        
    lines = []
    processed = sorted(processed, key=lambda item: item['y_min'])
    
    for item in processed:
        placed = False
        for line in lines:
            line_y_min = min(x['y_min'] for x in line)
            line_y_max = max(x['y_max'] for x in line)
            line_height = line_y_max - line_y_min
            
            overlap_min = max(item['y_min'], line_y_min)
            overlap_max = min(item['y_max'], line_y_max)
            overlap_height = overlap_max - overlap_min
            
            if overlap_height > 0:
                min_h = min(item['height'], line_height)
                if overlap_height / min_h >= y_threshold_ratio:
                    line.append(item)
                    placed = True
                    break
        if not placed:
            lines.append([item])
            
    assembled_lines = []
    for line in lines:
        line = sorted(line, key=lambda x: x['x_min'])
        joined_text = " ".join(x['text'] for x in line)
        avg_conf = sum(x['conf'] for x in line) / len(line)
        min_x = min(x['x_min'] for x in line)
        max_x = max(x['x_max'] for x in line)
        min_y = min(x['y_min'] for x in line)
        max_y = max(x['y_max'] for x in line)
        
        bbox = [
            [float(min_x), float(min_y)],
            [float(max_x), float(min_y)],
            [float(max_x), float(max_y)],
            [float(min_x), float(max_y)]
        ]
        assembled_lines.append({
            'text': joined_text,
            'confidence': avg_conf,
            'bbox': bbox
        })
        
    assembled_lines = sorted(assembled_lines, key=lambda l: l['bbox'][0][1])
    return assembled_lines

# Initialize EasyOCR reader once, capture error if initialization fails
reader = None
easyocr_error = None
try:
    reader = easyocr.Reader(
        LANGUAGES,
        gpu=False,
        model_storage_directory=model_dir,
        user_network_directory=user_network_dir,
        download_enabled=True,
        verbose=False
    )
except Exception as exc:
    import traceback
    easyocr_error = f"EasyOCR initialization failed: {exc}\n{traceback.format_exc()}"

# Track the best runs for both EasyOCR and Tesseract separately across all versions
best_easyocr = {
    'confidence': -1.0,
    'text': "",
    'lines': [],
    'version': None,
    'processed_img': None
}

best_tesseract = {
    'confidence': -1.0,
    'text': "",
    'lines': [],
    'version': None,
    'processed_img': None
}

# Run OCR for each version
for version_name, v_img in versions.items():
    # 1. EasyOCR run
    if reader is not None:
        try:
            res = reader.readtext(v_img)
            lines = group_boxes_into_lines(res)
            avg_conf = sum(l['confidence'] for l in lines) / len(lines) if lines else 0.0
            if avg_conf > best_easyocr['confidence']:
                best_easyocr = {
                    'confidence': avg_conf,
                    'text': "\n".join(l['text'] for l in lines),
                    'lines': lines,
                    'version': version_name,
                    'processed_img': v_img
                }
        except Exception as e:
            import traceback
            easyocr_error = f"EasyOCR execution failed: {e}\n{traceback.format_exc()}"
    else:
        if easyocr_error is None:
            easyocr_error = "EasyOCR reader was not initialized."

    # 2. Tesseract run
    try:
        data = pytesseract.image_to_data(v_img, output_type=pytesseract.Output.DICT, config='--psm 6')
        n_boxes = len(data['text'])
        lines_dict = {}
        for i in range(n_boxes):
            text = data['text'][i].strip()
            conf = float(data['conf'][i])
            if not text or conf < 0:
                continue
            key = (data['block_num'][i], data['par_num'][i], data['line_num'][i])
            if key not in lines_dict:
                lines_dict[key] = []
            lines_dict[key].append({
                'text': text,
                'conf': conf / 100.0,
                'left': data['left'][i],
                'top': data['top'][i],
                'width': data['width'][i],
                'height': data['height'][i]
            })
        
        lines = []
        for key, words in lines_dict.items():
            line_text = " ".join(w['text'] for w in words)
            avg_line_conf = sum(w['conf'] for w in words) / len(words)
            min_left = min(w['left'] for w in words)
            min_top = min(w['top'] for w in words)
            max_right = max(w['left'] + w['width'] for w in words)
            max_bottom = max(w['top'] + w['height'] for w in words)
            lines.append({
                'text': line_text,
                'confidence': avg_line_conf,
                'bbox': [
                    [float(min_left), float(min_top)],
                    [float(max_right), float(min_top)],
                    [float(max_right), float(max_bottom)],
                    [float(min_left), float(max_bottom)]
                ]
            })
        lines = sorted(lines, key=lambda l: l['bbox'][0][1])
        avg_conf = sum(l['confidence'] for l in lines) / len(lines) if lines else 0.0
        if avg_conf > best_tesseract['confidence']:
            best_tesseract = {
                'confidence': avg_conf,
                'text': "\n".join(l['text'] for l in lines),
                'lines': lines,
                'version': version_name,
                'processed_img': v_img
            }
    except Exception as e:
        pass

# Prioritize EasyOCR, fallback to Tesseract only if EasyOCR failed or returned empty text
if reader is not None and best_easyocr['processed_img'] is not None and len(best_easyocr['lines']) > 0:
    best_run = {
        'confidence': best_easyocr['confidence'],
        'engine': 'EasyOCR',
        'version': best_easyocr['version'],
        'lines': best_easyocr['lines'],
        'text': best_easyocr['text'],
        'processed_img': best_easyocr['processed_img']
    }
else:
    engine_name = 'Tesseract (Fallback)' if easyocr_error is not None else 'Tesseract'
    best_run = {
        'confidence': best_tesseract['confidence'] if best_tesseract['processed_img'] is not None else 0.0,
        'engine': engine_name,
        'version': best_tesseract['version'] or 'original',
        'lines': best_tesseract['lines'],
        'text': best_tesseract['text'],
        'processed_img': best_tesseract['processed_img'] or original
    }

# Draw boxes on chosen image for "OCR Output"
if len(best_run['processed_img'].shape) == 2:
    out_img = cv2.cvtColor(best_run['processed_img'], cv2.COLOR_GRAY2BGR)
else:
    out_img = best_run['processed_img'].copy()

for line in best_run['lines']:
    bbox = line['bbox']
    pts = np.array(bbox, dtype=np.int32)
    cv2.polylines(out_img, [pts], isClosed=True, color=(0, 255, 0), thickness=2)
    x_min = int(min(pt[0] for pt in bbox))
    y_min = int(min(pt[1] for pt in bbox))
    cv2.putText(out_img, line['text'], (x_min, max(y_min - 5, 15)), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 0, 255), 1, cv2.LINE_AA)

out_path = os.path.join(debug_dir, 'out.jpg')
cv2.imwrite(out_path, out_img)

best_version = best_run['version'] or 'original'
proc_path = os.path.join(debug_dir, f"{best_version}.jpg")

report = {
    'status': 'ok',
    'count': len(best_run['lines']),
    'text': best_run['text'],
    'lines': best_run['lines'],
    'confidence': float(best_run['confidence']),
    'engine': best_run['engine'] or 'Unknown',
    'version': best_version,
    'origPath': original_path,
    'procPath': proc_path,
    'outPath': out_path,
    'easyocrText': best_easyocr['text'],
    'easyocrConfidence': float(best_easyocr['confidence']) if best_easyocr['confidence'] >= 0 else 0.0,
    'easyocrError': easyocr_error,
    'tesseractText': best_tesseract['text'],
    'tesseractConfidence': float(best_tesseract['confidence']) if best_tesseract['confidence'] >= 0 else 0.0
}

with open(OUTPUT, 'w', encoding='utf-8') as f:
    json.dump(report, f, ensure_ascii=False)

print(json.dumps({'status': 'ok', 'count': len(best_run['lines']), 'engine': best_run['engine'], 'confidence': best_run['confidence']}))
