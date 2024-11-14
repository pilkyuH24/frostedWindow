// 필요한 모듈을 import
import {
  Stage,
  Bitmap,
  Shape,
  AlphaMaskFilter,
  BlurFilter,
  ColorMatrixFilter,
} from "createjs-module";

// App 함수를 기본 내보내기로 설정
export default function App() {
  // HTML에서 <canvas> 요소 가져오기
  const canvas = document.getElementById("testCanvas");
  // Stage 생성 - 캔버스를 관리하는 객체
  const stage = new Stage(canvas);

  // 필요한 변수들 선언
  let drawingCanvas, bitmap, blurBitmap, maskFilter, cursor;
  let isDrawing = false; // 현재 드로잉 중인지 확인하는 플래그
  let oldPt, oldMidPt; // 이전 마우스 위치를 저장

  // 새로운 이미지 객체 생성
  const image = new Image();
  image.src = "/bg.png"; // 이미지 소스 설정

  // 이미지가 로드되면 handleComplete 함수 호출
  image.onload = () => handleComplete(image);

  // 이미지가 로드된 후 초기화 함수
  function handleComplete(image) {
    // 드로잉 캔버스 설정 (Shape 객체 사용)
    drawingCanvas = new Shape();
    drawingCanvas.cache(0, 0, image.width, image.height);

    // 블러 처리된 배경 설정
    blurBitmap = new Bitmap(image);
    blurBitmap.filters = [
      new BlurFilter(24, 24, 5), // 블러 필터 적용 (가로, 세로, 품질)
      new ColorMatrixFilter([    // 색상 필터 적용 (색상 조정)
        60, 0, 0, 0, 0,
        0, 60, 0, 0, 0,
        0, 0, 60, 0, 0,
        0, 0, 0, 1, 0,
      ]),
    ];
    blurBitmap.cache(0, 0, image.width, image.height); // 블러 및 색상 필터 캐시

    // 마스크를 적용할 원본 이미지 설정
    bitmap = new Bitmap(image);
    maskFilter = new AlphaMaskFilter(drawingCanvas.cacheCanvas); // 드로잉 캔버스를 마스크로 사용
    bitmap.filters = [maskFilter]; // 마스크 필터 적용
    bitmap.cache(0, 0, image.width, image.height); // 캐시하여 성능 최적화

    // Stage에 블러 이미지와 마스크된 이미지를 추가
    stage.addChild(blurBitmap, bitmap);

    // 커서 모양 설정 (원형으로 표시)
    cursor = new Shape();
    cursor.graphics.beginFill("#E9E9E9").drawCircle(0, 0, 25);
    cursor.alpha = 0.99; // 약간 투명하게 설정
    stage.addChild(cursor);

    // Stage에 이벤트 리스너 추가 (마우스 동작 처리)
    stage.addEventListener("stagemousedown", handleMouseDown);
    stage.addEventListener("stagemouseup", handleMouseUp);
    stage.addEventListener("stagemousemove", handleMouseMove);

    // Stage 업데이트하여 초기 상태 렌더링
    stage.update();
  }

  // 마우스가 눌렸을 때 실행되는 함수
  function handleMouseDown() {
    // 현재 마우스 좌표를 저장
    oldPt = { x: stage.mouseX, y: stage.mouseY };
    oldMidPt = oldPt;
    isDrawing = true; // 드로잉 모드 활성화
  }

  // 마우스가 움직일 때 실행되는 함수
  function handleMouseMove() {
    // 커서 위치를 마우스 좌표에 맞춰 이동
    cursor.x = stage.mouseX;
    cursor.y = stage.mouseY;

    // 드로잉 상태가 아닐 경우 Stage 업데이트만 수행
    if (!isDrawing) {
      stage.update();
      return;
    }

    // 현재 마우스 좌표와 이전 좌표의 중간점을 계산
    const midPoint = {
      x: (oldPt.x + stage.mouseX) >> 1, // x 좌표 중간값
      y: (oldPt.y + stage.mouseY) >> 1, // y 좌표 중간값
    };

    // 드로잉 캔버스에 곡선 그리기 (부드럽게)
    drawingCanvas.graphics
      .setStrokeStyle(40, "round", "round") // 선 두께와 끝 모양 설정
      .beginStroke("rgba(0,0,0,0.2)") // 선 색상 설정 (약간 투명)
      .moveTo(midPoint.x, midPoint.y) // 시작점
      .curveTo(oldPt.x, oldPt.y, oldMidPt.x, oldMidPt.y); // 곡선 그리기

    // 이전 좌표 갱신
    oldPt = { x: stage.mouseX, y: stage.mouseY };
    oldMidPt = midPoint;

    // 드로잉 캔버스와 마스크를 다시 캐시하여 업데이트
    drawingCanvas.updateCache("source-over");
    maskFilter = new AlphaMaskFilter(drawingCanvas.cacheCanvas); // 업데이트된 마스크 적용
    bitmap.filters = [maskFilter]; // 필터 다시 적용
    bitmap.updateCache(); // 캐시 업데이트

    // Stage 업데이트하여 화면 갱신
    stage.update();
  }

  // 마우스를 뗐을 때 실행되는 함수
  function handleMouseUp() {
    isDrawing = false; // 드로잉 모드 비활성화
  }
}