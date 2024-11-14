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

  // 캔버스 크기 조정 함수
  function adjustCanvas() {
    console.log("Adjusting canvas size");
    const canvas = document.getElementById("testCanvas");
    console.log(`Before - Width: ${canvas.width}, Height: ${canvas.height}`);
    canvas.width = canvas.offsetWidth; // 캔버스 너비를 DOM 요소 크기로 설정
    canvas.height = canvas.offsetHeight; // 캔버스 높이를 DOM 요소 크기로 설정
    console.log(`After - Width: ${canvas.width}, Height: ${canvas.height}`);
  }

  // 창 크기 변경 시 캔버스 크기 자동 조정
  window.addEventListener("resize", adjustCanvas);
  adjustCanvas(); // 초기 크기 조정

  const stage = new Stage(canvas); // CreateJS Stage 객체 생성

  let drawingCanvas, bitmap, blurBitmap, maskFilter;
  let isDrawing = false; // 마우스 드로잉 상태 플래그
  let oldPt, oldMidPt; // 이전 마우스 위치와 중간점
  let currentImage; // 현재 로드된 배경 이미지
  let clickCount = 0; // 클릭 횟수

  const maskCanvas = document.createElement("canvas"); // 마스크 캔버스 생성
  maskCanvas.width = canvas.width;
  maskCanvas.height = canvas.height;

  // 마스크 캔버스에 대한 willReadFrequently 최적화
  const maskCtx = maskCanvas.getContext("2d", { willReadFrequently: true }); // 2D 콘텍스트 사용

  // 원본 배경 이미지 로드
  const image = new Image();
  image.src = "/bg.png"; // 배경 이미지 소스 설정
  image.onload = () => handleComplete(image); // 이미지 로딩 완료 후 처리 함수 호출

  function handleComplete(image) {
    currentImage = image;

    // 드로잉 캔버스 설정 (Shape 객체로 마스크를 그릴 캔버스 생성)
    drawingCanvas = new Shape();
    drawingCanvas.cache(0, 0, image.width, image.height); // 캔버스를 캐시해 두어 성능 최적화

    // 블러 처리된 배경 이미지
    blurBitmap = new Bitmap(image); // 비트맵 객체 생성
    blurBitmap.filters = [
      new ColorMatrixFilter([
        60,
        0,
        0,
        0,
        0,
        0,
        60,
        0,
        0,
        0,
        0,
        0,
        60,
        0,
        0,
        0,
        0,
        0,
        1,
        0, // 색상 강화 필터 적용
      ]),
    ];
    blurBitmap.cache(0, 0, image.width, image.height); // 캐시로 최적화

    // 마스크를 적용할 원본 비트맵
    bitmap = new Bitmap(image);
    maskFilter = new AlphaMaskFilter(drawingCanvas.cacheCanvas); // 알파 마스크 필터 설정
    bitmap.filters = [maskFilter]; // 마스크 필터를 비트맵에 적용
    bitmap.cache(0, 0, image.width, image.height); // 비트맵 캐시

    stage.addChild(blurBitmap, bitmap); // 스테이지에 비트맵과 블러 비트맵 추가

    // Stage에 마우스 이벤트 추가 (드로잉을 위한 이벤트 리스너)
    stage.addEventListener("stagemousedown", handleMouseDown);
    stage.addEventListener("stagemouseup", handleMouseUp);
    stage.addEventListener("stagemousemove", handleMouseMove);

    stage.update(); // 스테이지 업데이트
  }

  // 마우스 클릭 시 드로잉 시작 및 배경 교체 처리
  function handleMouseDown() {
    if (clickCount > 0) {
      processAndReplaceBackground(); // 배경을 변경하는 함수 호출
    }
    oldPt = { x: stage.mouseX, y: stage.mouseY }; // 현재 마우스 위치 저장
    oldMidPt = oldPt; // 중간점 초기화
    isDrawing = true; // 드로잉 상태로 설정
    clickCount++; // 클릭 횟수 증가
  }

  // 마우스 이동 시 드로잉 처리
  function handleMouseMove() {
    if (!isDrawing) {
      stage.update(); // 드로잉 중이 아닐 경우 스테이지만 업데이트
      return;
    }

    const midPoint = {
      x: (oldPt.x + stage.mouseX) >> 1, // 중간 x 좌표 계산
      y: (oldPt.y + stage.mouseY) >> 1, // 중간 y 좌표 계산
    };

    // 드로잉 캔버스에 곡선을 그리기
    drawingCanvas.graphics
      .setStrokeStyle(40, "round", "round") // 선 굵기 및 스타일 설정
      .beginStroke("rgba(0,0,0,0.2)") // 선 색상 설정
      .moveTo(midPoint.x, midPoint.y) // 현재 중간점으로 이동
      .curveTo(oldPt.x, oldPt.y, oldMidPt.x, oldMidPt.y); // 이전 점과 중간점으로 곡선 그리기

    oldPt = { x: stage.mouseX, y: stage.mouseY }; // 현재 마우스 위치 업데이트
    oldMidPt = midPoint; // 중간점 업데이트

    drawingCanvas.updateCache("source-over"); // 캐시 업데이트
    maskFilter = new AlphaMaskFilter(drawingCanvas.cacheCanvas); // 새로운 마스크 필터 설정
    bitmap.filters = [maskFilter]; // 비트맵에 마스크 필터 적용
    bitmap.updateCache(); // 비트맵 캐시 업데이트

    // 마스크 캔버스에 현재 상태 그리기
    maskCtx.clearRect(0, 0, maskCanvas.width, maskCanvas.height); // 이전 마스크 지우기
    maskCtx.drawImage(canvas, 0, 0); // 현재 캔버스를 마스크 캔버스에 그리기

    stage.update(); // 스테이지 업데이트
  }

  // 마우스 업 시 드로잉 종료
  function handleMouseUp() {
    isDrawing = false; // 드로잉 상태 종료
  }

  // 마스크 색상 증폭 및 블러 후 배경 대체
  function processAndReplaceBackground() {
    // 1. 마스크 캔버스의 이미지 데이터를 가져옵니다.
    const maskCtx = maskCanvas.getContext("2d");
    const imageData = maskCtx.getImageData(0, 0, maskCanvas.width, maskCanvas.height);
    const data = imageData.data;
  
    // 변경된 이미지 데이터를 다시 캔버스에 그립니다.
    maskCtx.putImageData(imageData, 0, 0);
  
    // 3. 마스크 캔버스를 비트맵으로 변환합니다.
    const maskBitmap = new Bitmap(maskCanvas);
    
    // 4. 마스크 비트맵에 블러 필터를 적용합니다.
    maskBitmap.filters = [new BlurFilter(1, 1, 15)]; // 블러 필터 적용
    maskBitmap.cache(0, 0, maskCanvas.width, maskCanvas.height); // 캐시로 최적화
  
    // 5. 배경 비트맵을 새로 생성하고, 마스크 필터를 적용하여 새 배경을 만듭니다.
    const newBackground = new Image();
    newBackground.src = maskCanvas.toDataURL(); // 마스크 캔버스 데이터를 새로운 이미지로 변환
    
    // 6. 새로운 배경 이미지를 비트맵으로 설정하고, 블러를 적용합니다.
    newBackground.onload = () => {
      blurBitmap = new Bitmap(newBackground); // 새 배경 이미지를 비트맵으로 설정
      blurBitmap.filters = [new BlurFilter(1, 1, 15)]; // 블러 효과 적용
      blurBitmap.cache(0, 0, canvas.width, canvas.height); // 캐시로 최적화
  
      // 7. 스테이지의 기존 자식들을 제거하고, 새로운 배경을 추가합니다.
      stage.removeAllChildren(); // 기존 자식 제거
      stage.addChild(blurBitmap); // 새 배경을 스테이지에 추가
  
      // 8. 새로운 드로잉 레이어와 마스크 필터를 설정합니다.
      drawingCanvas = new Shape();
      drawingCanvas.cache(0, 0, canvas.width, canvas.height); // 드로잉 캔버스를 캐시
      bitmap = new Bitmap(currentImage); // 원본 이미지 비트맵
      maskFilter = new AlphaMaskFilter(drawingCanvas.cacheCanvas); // 새 마스크 필터 적용
      bitmap.filters = [maskFilter]; // 비트맵에 마스크 필터 적용
      bitmap.cache(0, 0, canvas.width, canvas.height); // 비트맵 캐시
  
      // 9. 최종적으로 새로운 비트맵을 스테이지에 추가합니다.
      stage.addChild(bitmap); // 새로운 비트맵을 스테이지에 추가
      stage.update(); // 최종적으로 스테이지 업데이트
    };
  }
  
  
  
}

App(); // App 실행
