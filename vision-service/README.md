# 万物识别视觉服务（Python）

为 Next.js 提供本地图像分析：中文标签 / 场景描述，供漫画脚本生成使用。

## 环境

- Python 3.10+（系统自带的 `python3` 或 Homebrew 安装的均可）

**方式一：本机虚拟环境（推荐，无需 conda）**

```bash
cd vision-service
python3 -m venv venv
source venv/bin/activate   # Windows: venv\Scripts\activate
pip install -r requirements.txt
```

**方式二：Conda（若已安装）**

```bash
conda create -n vision python=3.11 -y && conda activate vision
pip install -r requirements.txt
```

若使用 GPU（需先装 CUDA）：

```bash
pip install torch torchvision --index-url https://download.pytorch.org/whl/cu118
```

## 模型说明

- 默认使用 **CLIP**（`openai/clip-vit-base-patch32`）：做的是「在预定义英文标签里算与图的相似度，再映射成中文返回」，**不是**自由描述图片内容。
- 环境变量可改模型：`export VISION_MODEL=你的模型ID`
- 标签：`vision-service/labels.txt` 不存在时用内置列表；**角色头像**请求会带 `context=avatar`，使用另一套人物/肖像向标签（人、面部、微笑等），避免被背景物体（电脑、电视）抢掉。

**为什么有时「结果不对」？**  
CLIP 只能在给定的标签里选最像的几条。若标签列表里没有你期望的概念，或英文表述与 CLIP 训练分布不一致，排序就会不符合预期。头像场景已用专用标签集；线索图用通用场景标签。

## 启动

```bash
# 若用了 venv，先：source venv/bin/activate
python3 vision_service.py
```

服务地址：`http://0.0.0.0:5001`。Next.js 通过 `VISION_SERVICE_URL=http://localhost:5001` 调用。

## 接口

- `GET /health`：健康检查
- `GET /debug`：返回模型是否加载、当前标签数量与样例，用于确认服务与配置
- `POST /debug_scores`：上传一张图（字段 `image`），返回「默认标签」和「头像标签」下的 top 得分列表，用于确认模型是否在算、排序是否合理
- `POST /analyze`：单图分析，表单字段 `image`，返回 `data.summary`、`data.labels`
- `POST /analyze_batch`：多图分析，表单字段 `images[]`（或 `images`）；可选表单单字段 `context=avatar` 使用头像专用标签。返回 `data.summary`、`data.all_labels`、`data.details`

本地若在 `vision-service` 下创建了 `venv`，Next.js 构建可能因解析到 venv 内符号链接而报错；构建前可暂时删除 `vision-service/venv`，需要时再按上述步骤重建。使用 Docker 部署时无需本地 venv。
