# vision_service.py
# -*- coding: utf-8 -*-
"""
图像识别服务：使用 CLIP 做零样本分类，返回中文标签
供 Next.js 后端调用
"""

import os
import tempfile
import time
import logging

from flask import Flask, request, jsonify
from flask_cors import CORS

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# 支持 iPhone HEIC 格式（Pillow 默认不支持）
try:
    import pillow_heif
    pillow_heif.register_heif_opener()
    logger.info("已注册 HEIC 支持")
except ImportError:
    pass

app = Flask(__name__)
CORS(app)

model = None
processor = None
device = None

# Hugging Face 上可用的 CLIP 模型（英文推理，结果映射为中文）
MODEL_NAME = os.environ.get("VISION_MODEL", "openai/clip-vit-base-patch32")

# 中文标签与英文一一对应，供 CLIP 用英文计算相似度后返回中文
LABELS_ZH = [
    "人", "儿童", "动物", "猫", "狗", "鸟", "植物", "花", "树",
    "室内", "户外", "公园", "家庭", "玩具", "书籍", "食物",
    "天空", "水", "建筑", "交通工具", "汽车", "自行车",
    "电子产品", "手机", "电脑", "电视", "家具", "沙发", "床",
]
LABELS_EN = [
    "person", "child", "animal", "cat", "dog", "bird", "plant", "flower", "tree",
    "indoor", "outdoor", "park", "family", "toy", "book", "food",
    "sky", "water", "building", "vehicle", "car", "bicycle",
    "electronics", "phone", "computer", "TV", "furniture", "sofa", "bed",
]

# 角色头像场景：侧重人物/肖像，避免被背景物体（电脑、电视等）抢掉
AVATAR_LABELS_ZH = [
    "人", "儿童", "成人", "面部", "肖像", "正面", "侧面", "微笑",
    "室内", "户外", "家庭", "单人", "人物特写",
]
AVATAR_LABELS_EN = [
    "person", "child", "adult", "face", "portrait", "front view", "profile", "smile",
    "indoor", "outdoor", "family", "single person", "close-up portrait",
]


def load_label_mapping(avatar_mode=False):
    if avatar_mode:
        return AVATAR_LABELS_ZH, AVATAR_LABELS_EN
    label_path = os.path.join(os.path.dirname(__file__), "labels.txt")
    if os.path.exists(label_path):
        with open(label_path, "r", encoding="utf-8") as f:
            lines = [line.strip() for line in f.readlines() if line.strip()]
            if lines:
                return lines, lines  # 若自定义则中英同表
    return LABELS_ZH, LABELS_EN


def init_model():
    global model, processor, device
    if model is not None:
        return

    try:
        import torch
        from transformers import CLIPProcessor, CLIPModel
    except ImportError as e:
        logger.error("请安装: pip install torch transformers - %s", e)
        raise

    logger.info("正在加载 CLIP 模型: %s ...", MODEL_NAME)
    start = time.time()
    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    logger.info("使用设备: %s", device)

    try:
        processor = CLIPProcessor.from_pretrained(MODEL_NAME)
        model = CLIPModel.from_pretrained(MODEL_NAME)
        model = model.to(device)
        model.eval()
        logger.info("模型加载成功，耗时 %.2f 秒", time.time() - start)
    except Exception as e:
        logger.error("模型加载失败: %s", e)
        raise


def preprocess_image(image_path):
    from PIL import Image
    return Image.open(image_path).convert("RGB")


def predict(image, top_k=5, avatar_mode=False):
    import torch
    global model, processor, device
    labels_zh, labels_en = load_label_mapping(avatar_mode=avatar_mode)

    with torch.no_grad():
        # 图像特征
        img_inputs = processor(images=image, return_tensors="pt")
        img_inputs = {k: v.to(device) for k, v in img_inputs.items()}
        image_features = model.get_image_features(**img_inputs)
        image_features = image_features / image_features.norm(dim=-1, keepdim=True)

        # 文本特征（用英文给 CLIP 算）
        text_inputs = processor(
            text=labels_en,
            return_tensors="pt",
            padding=True,
            truncation=True,
        )
        text_inputs = {k: v.to(device) for k, v in text_inputs.items()}
        text_features = model.get_text_features(
            input_ids=text_inputs["input_ids"],
            attention_mask=text_inputs.get("attention_mask"),
        )
        text_features = text_features / text_features.norm(dim=-1, keepdim=True)

        # 温度缩放：CLIP 常用 0.01~0.1，数值越小分布越尖锐
        temperature = 0.07
        similarity = (image_features @ text_features.T).squeeze(0).cpu()
        logits = similarity / temperature
        probs = torch.softmax(logits, dim=-1).numpy()
        top_indices = probs.argsort()[-top_k:][::-1]

        return [
            {"label": labels_zh[i], "score": float(probs[i])}
            for i in top_indices
        ]


@app.route("/health", methods=["GET"])
def health_check():
    return jsonify({"status": "ok", "model_loaded": model is not None})


@app.route("/debug", methods=["GET"])
def debug_info():
    """返回当前配置与模型状态，便于排查「识别结果不对」"""
    labels_zh, _ = load_label_mapping(avatar_mode=False)
    avatar_zh, _ = load_label_mapping(avatar_mode=True)
    return jsonify({
        "status": "ok",
        "model_loaded": model is not None,
        "model_name": MODEL_NAME,
        "device": str(device) if device is not None else None,
        "default_labels_count": len(labels_zh),
        "avatar_labels_count": len(avatar_zh),
        "default_labels_sample": labels_zh[:5],
        "avatar_labels_sample": avatar_zh[:5],
        "note": "CLIP 仅在上述预定义标签中做相似度排序，不是自由描述图片；结果受标签列表和英文表述影响。",
    })


@app.route("/debug_scores", methods=["POST"])
def debug_scores():
    """上传一张图，返回「默认标签」和「头像标签」下的全部得分，用于确认模型是否在算、排序是否合理"""
    file = request.files.get("image")
    if not file or file.filename == "":
        files = request.files.getlist("images[]") or request.files.getlist("images")
        file = files[0] if files else None
    if not file or file.filename == "":
        return jsonify({"error": "请上传一张图片（字段 image 或 images[]）"}), 400
    if model is None:
        init_model()
    with tempfile.NamedTemporaryFile(delete=False, suffix=".jpg") as tmp:
        file.save(tmp.name)
        tmp_path = tmp.name
    try:
        image = preprocess_image(tmp_path)
        labels_default = predict(image, top_k=min(15, len(LABELS_ZH)), avatar_mode=False)
        labels_avatar = predict(image, top_k=min(15, len(AVATAR_LABELS_ZH)), avatar_mode=True)
        return jsonify({
            "success": True,
            "filename": file.filename,
            "default_top": labels_default,
            "avatar_top": labels_avatar,
            "note": "若 default_top 与 avatar_top 的排序不同属正常（标签集不同）；若所有 score 几乎一样则可能异常。",
        })
    except Exception as e:
        logger.exception("debug_scores 失败")
        return jsonify({"error": str(e)}), 500
    finally:
        if os.path.exists(tmp_path):
            os.unlink(tmp_path)


@app.route("/analyze", methods=["POST"])
def analyze_image():
    if "image" not in request.files:
        return jsonify({"error": "未找到图片文件"}), 400

    file = request.files["image"]
    if file.filename == "":
        return jsonify({"error": "文件名为空"}), 400

    top_k = request.form.get("top_k", 5, type=int)

    with tempfile.NamedTemporaryFile(delete=False, suffix=".jpg") as tmp:
        file.save(tmp.name)
        tmp_path = tmp.name

    try:
        if model is None:
            init_model()
        image = preprocess_image(tmp_path)
        start = time.time()
        labels = predict(image, top_k=top_k)
        elapsed = int((time.time() - start) * 1000)
        top_labels = [x["label"] for x in labels[:3]]
        summary = f"识别到：{'、'.join(top_labels)}等元素"
        return jsonify({
            "success": True,
            "data": {
                "type": "labels",
                "labels": labels,
                "summary": summary,
                "time_ms": elapsed,
            },
        })
    except Exception as e:
        logger.exception("推理失败")
        return jsonify({"error": str(e)}), 500
    finally:
        if os.path.exists(tmp_path):
            os.unlink(tmp_path)


@app.route("/analyze_batch", methods=["POST"])
def analyze_batch():
    files_key = "images[]"
    if files_key not in request.files and "images" in request.files:
        files = request.files.getlist("images")
    else:
        files = request.files.getlist(files_key)

    if not files:
        return jsonify({"error": "未找到图片文件"}), 400

    max_files = 5
    if len(files) > max_files:
        return jsonify({"error": f"最多支持 {max_files} 张图片"}), 400

    if model is None:
        init_model()

    raw_context = request.form.get("context")
    avatar_mode = raw_context == "avatar"
    logger.info("analyze_batch: context=%s, avatar_mode=%s, files=%d", raw_context, avatar_mode, len(files))
    all_labels = set()
    all_results = []
    per_image_summaries = []

    for file in files:
        if file.filename == "":
            continue
        with tempfile.NamedTemporaryFile(delete=False, suffix=".jpg") as tmp:
            file.save(tmp.name)
            tmp_path = tmp.name

        try:
            image = preprocess_image(tmp_path)
            labels = predict(image, top_k=5, avatar_mode=avatar_mode)
            for item in labels:
                all_labels.add(item["label"])
            top = [x["label"] for x in labels[:5]]
            if avatar_mode and top:
                img_summary = f"人物头像：包含{'、'.join(top)}等特征。"
            else:
                img_summary = f"包含{'、'.join(top)}等元素。" if top else "暂无识别结果。"
            all_results.append({"filename": file.filename, "labels": labels, "summary": img_summary})
            per_image_summaries.append(img_summary)
        except Exception as e:
            logger.error("处理 %s 失败: %s", file.filename, e)
            fallback = "本图识别失败（可能模型未就绪或图片无法解析）。"
            all_results.append({"filename": file.filename, "error": str(e), "summary": fallback})
            per_image_summaries.append(fallback)
        finally:
            if os.path.exists(tmp_path):
                os.unlink(tmp_path)

    top_labels = list(all_labels)[:8]
    summary = f"照片分析结果：包含{'、'.join(top_labels)}等元素。" if top_labels else "暂无识别结果（请确认视觉服务已启动且模型已加载）。"

    return jsonify({
        "success": True,
        "data": {
            "summary": summary,
            "all_labels": list(all_labels),
            "details": all_results,
            "summaries": per_image_summaries,
        },
    })


if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5001))
    try:
        init_model()
    except Exception:
        logger.warning("启动时未加载模型，首次请求时将加载")
    app.run(host="0.0.0.0", port=port, debug=False)
