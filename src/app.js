import {
  Stage,
  Bitmap,
  Shape,
  AlphaMaskFilter,
  BlurFilter,
  ColorMatrixFilter,
} from "createjs-module";

export default function App() {
  const canvas = document.getElementById("testCanvas");
  const stage = new Stage(canvas);

  let drawingCanvas, bitmap, blurBitmap, maskFilter;
  let isDrawing = false;
  let oldPt, oldMidPt;
  let currentImage;
  let clickCount = 0;

  const maskCanvas = document.createElement("canvas");
  maskCanvas.width = canvas.width;
  maskCanvas.height = canvas.height;
  const maskCtx = maskCanvas.getContext("2d");

  // 원본 배경 이미지 로드
  const image = new Image();
  image.src = "/bg.png";
  image.onload = () => handleComplete(image);

  function handleComplete(image) {
    currentImage = image;

    // 드로잉 캔버스 설정
    drawingCanvas = new Shape();
    drawingCanvas.cache(0, 0, image.width, image.height);

    blurBitmap = new Bitmap(image);
    blurBitmap.filters = [
      new BlurFilter(24, 24, 5),
      new ColorMatrixFilter([
        60, 0, 0, 0, 0,
        0, 60, 0, 0, 0,
        0, 0, 60, 0, 0,
        0, 0, 0, 1, 0,
      ]),
    ];
    blurBitmap.cache(0, 0, image.width, image.height);

    bitmap = new Bitmap(image);
    maskFilter = new AlphaMaskFilter(drawingCanvas.cacheCanvas);
    bitmap.filters = [maskFilter];
    bitmap.cache(0, 0, image.width, image.height);

    stage.addChild(blurBitmap, bitmap);

    // Stage 이벤트 추가
    stage.addEventListener("stagemousedown", handleMouseDown);
    stage.addEventListener("stagemouseup", handleMouseUp);
    stage.addEventListener("stagemousemove", handleMouseMove);

    stage.update();
  }

  function handleMouseDown() {
    if (clickCount > 0) {
      processAndReplaceBackground();
    }
    oldPt = { x: stage.mouseX, y: stage.mouseY };
    oldMidPt = oldPt;
    isDrawing = true;
    clickCount++;
  }

  function handleMouseMove() {
    if (!isDrawing) {
      stage.update();
      return;
    }

    const midPoint = {
      x: (oldPt.x + stage.mouseX) >> 1,
      y: (oldPt.y + stage.mouseY) >> 1,
    };

    drawingCanvas.graphics
      .setStrokeStyle(40, "round", "round")
      .beginStroke("rgba(0,0,0,0.2)")
      .moveTo(midPoint.x, midPoint.y)
      .curveTo(oldPt.x, oldPt.y, oldMidPt.x, oldMidPt.y);

    oldPt = { x: stage.mouseX, y: stage.mouseY };
    oldMidPt = midPoint;

    drawingCanvas.updateCache("source-over");
    maskFilter = new AlphaMaskFilter(drawingCanvas.cacheCanvas);
    bitmap.filters = [maskFilter];
    bitmap.updateCache();

    maskCtx.clearRect(0, 0, maskCanvas.width, maskCanvas.height);
    maskCtx.drawImage(canvas, 0, 0);

    stage.update();
  }

  function handleMouseUp() {
    isDrawing = false;
  }

  // 이전 마스크에 색 증폭 및 블러 처리 후 배경 대체
  function processAndReplaceBackground() {
    const maskCtx = maskCanvas.getContext("2d");

    // 현재 마스킹된 영역 추출
    const imageData = maskCtx.getImageData(0, 0, maskCanvas.width, maskCanvas.height);
    const data = imageData.data;

    // 마스킹된 부분에만 색상 증폭 및 블러 처리

    maskCtx.putImageData(imageData, 0, 0);

    // 새로운 배경으로 대체
    const newBackground = new Image();
    newBackground.src = maskCanvas.toDataURL();

    newBackground.onload = () => {
      blurBitmap = new Bitmap(newBackground);
      blurBitmap.filters = [new BlurFilter(5, 5, 3)]; // 약한 블러 적용
      blurBitmap.cache(0, 0, canvas.width, canvas.height);

      stage.removeAllChildren();
      stage.addChild(blurBitmap);

      // 새로운 드로잉 레이어 생성
      drawingCanvas = new Shape();
      drawingCanvas.cache(0, 0, canvas.width, canvas.height);
      bitmap = new Bitmap(currentImage);
      maskFilter = new AlphaMaskFilter(drawingCanvas.cacheCanvas);
      bitmap.filters = [maskFilter];
      bitmap.cache(0, 0, canvas.width, canvas.height);

      stage.addChild(bitmap);
      stage.update();
    };
  }
}

App();
