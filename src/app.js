import {
  Stage,
  Bitmap,
  Shape,
  AlphaMaskFilter,
  ColorMatrixFilter,
  Tween,
  Ease,
} from "createjs-module";

// Main App function
export default function App() {
  const canvas = document.getElementById("mainCanvas");
  const context = canvas.getContext("2d", { willReadFrequently: true });
  const stage = new Stage(canvas);

  // Declare variables for various elements and states
  let drawingCanvas, bitmap, blurBitmap, maskFilter, cursor;
  let isDrawing = false;
  let oldPt, oldMidPt;
  let canvasWidth, canvasHeight;
  let cropWidth, cropHeight, cropX, cropY;
  let intervalId;
  let raindrops = [];
  let savedPoints = [];

  // Load background image
  const image = new Image();
  image.src = "/bg.png";

  // Event handler when the background image has loaded
  image.onload = () => {
    // Calculate the maximum width and height based on the window size
    const maxCanvasWidth = window.innerWidth * 0.99;
    const maxCanvasHeight = window.innerHeight * 0.85;

    // Calculate aspect ratios for the image and the canvas
    const imageAspectRatio = image.width / image.height;
    const canvasAspectRatio = maxCanvasWidth / maxCanvasHeight;

    // Determine how to scale and crop the image based on aspect ratios
    if (imageAspectRatio > canvasAspectRatio) {
      // Image is wider than canvas
      canvasHeight = maxCanvasHeight;
      canvasWidth = canvasHeight * canvasAspectRatio;
      cropHeight = image.height;
      cropWidth = cropHeight * canvasAspectRatio;
      cropX = (image.width - cropWidth) / 2;
      cropY = 0;
    } else {
      // Image is taller than or equal to canvas
      canvasWidth = maxCanvasWidth;
      canvasHeight = canvasWidth / canvasAspectRatio;
      cropWidth = image.width;
      cropHeight = cropWidth / canvasAspectRatio;
      cropX = 0;
      cropY = (image.height - cropHeight) / 2;
    }

    // Set the canvas dimensions
    canvas.width = canvasWidth;
    canvas.height = canvasHeight;

    // Call the handleComplete function with the calculated cropping parameters
    handleComplete(image, cropX, cropY, cropWidth, cropHeight);
  };

  function handleComplete(image, cropX, cropY, cropWidth, cropHeight) {
    // Create a blurred bitmap from the background image
    blurBitmap = new Bitmap(image);
    blurBitmap.sourceRect = new createjs.Rectangle(
      cropX,
      cropY,
      cropWidth,
      cropHeight
    );
    blurBitmap.scaleX = canvas.width / cropWidth;
    blurBitmap.scaleY = canvas.height / cropHeight;
    // Apply a color matrix filter to create a blur effect
    var filters = [
      new createjs.BlurFilter(15, 15, 5), // BlurFilter(blurX, blurY, quality)
      new createjs.ColorMatrixFilter([
        0.18, 0, 0, 0, 0, 0, 0.18, 0, 0, 0, 0, 0, 0.21, 0, 0, 0, 0, 0, 0.9, 0,
        0, 0, 0, 0, 0.1,
      ]),
    ];
    blurBitmap.filters = filters;

    // Cache the blurred bitmap for performance
    blurBitmap.cache(0, 0, cropWidth, cropHeight);

    stage.addChild(blurBitmap, bitmap);
    stage.update();

    // Create the main bitmap from the background image
    bitmap = new Bitmap(image);
    // Set the source rectangle to crop the image
    bitmap.sourceRect = new createjs.Rectangle(
      cropX,
      cropY,
      cropWidth,
      cropHeight
    );
    // Scale the bitmap to fit the canvas
    bitmap.scaleX = canvas.width / cropWidth;
    bitmap.scaleY = canvas.height / cropHeight;

    drawingCanvas = new Shape();
    // Cache the drawing canvas for performance
    drawingCanvas.cache(0, 0, cropWidth, cropHeight);

    // Create an alpha mask filter using the drawing canvas
    maskFilter = new AlphaMaskFilter(drawingCanvas.cacheCanvas);
    // Apply the mask filter to the bitmap to enable drawing effects
    bitmap.filters = [maskFilter];
    // Cache the bitmap with the applied filter
    bitmap.cache(0, 0, cropWidth, cropHeight);

    // Add both the blurred bitmap and the main bitmap to the stage
    stage.addChild(blurBitmap, bitmap);

    // Set up the cursor appearance as a semi-transparent circle
    cursor = new Shape();
    cursor.graphics.beginFill("rgba(155, 155, 155, 0.4)").drawCircle(0, 0, 25);
    cursor.alpha = 0.5;
    cursor.x = 0;
    cursor.y = 0;
    stage.addChild(cursor);

    // Add event listeners to update the cursor position based on mouse movement
    stage.addEventListener("stagemousemove", handleCursorFollow);
    // Add event listeners for mouse interactions (down, up, move)
    stage.addEventListener("stagemousedown", handleMouseDown);
    stage.addEventListener("stagemouseup", handleMouseUp);
    stage.addEventListener("stagemousemove", handleMouseMove);

    // Set the ticker to run at 60 frames per second
    createjs.Ticker.framerate = 60;
    createjs.Ticker.addEventListener("tick", stage);
  }

  /**
   * Event handler to update the cursor position based on mouse movement
   * @param {Object} event - The mouse move event
   */
  function handleCursorFollow(event) {
    cursor.x = event.stageX;
    cursor.y = event.stageY;
    stage.update();
  }

  /**
   * Function to get the adjusted mouse position based on canvas scaling
   * @returns {Object} An object containing the adjusted x and y coordinates
   */
  function getAdjustedMousePosition() {
    // Calculate the scaling factors between the crop area and the canvas
    const scaleX = cropWidth / canvas.width;
    const scaleY = cropHeight / canvas.height;
    // Return the scaled mouse coordinates
    return { x: stage.mouseX * scaleX, y: stage.mouseY * scaleY };
  }

  /**
   * Event handler for when the mouse button is pressed down
   */
  function handleMouseDown() {
    const adjustedPos = getAdjustedMousePosition();
    // Store the current position as the old point
    oldPt = { x: adjustedPos.x, y: adjustedPos.y };
    oldMidPt = oldPt;
    isDrawing = true;

    // Start saving points at random intervals
    intervalId = setInterval(() => {
      if (isDrawing) {
        const pos = getAdjustedMousePosition();
        savedPoints.push({ x: pos.x, y: pos.y }); // Save the current point
      }
    }, 100 + Math.random() * 200);
  }

  /**
   * Event handler for mouse movement while drawing
   */
  function handleMouseMove() {
    // If not currently drawing, exit the function
    if (!isDrawing) return;

    const adjustedPos = getAdjustedMousePosition();
    // Calculate the midpoint between the old point and the current position
    const midPoint = {
      x: (oldPt.x + adjustedPos.x) / 2,
      y: (oldPt.y + adjustedPos.y) / 2,
    };

    // Calculate the speed based on the change in x-coordinate
    let speed = Math.abs(stage.mouseX - oldPt.x); // Speed calculation on the x-axis
    // Determine the density of lines based on speed, capped at 10
    let density = Math.min(10, speed / 2); // Adjust line density based on speed

    // Draw multiple lines to create a smoother effect based on density
    for (let i = 0; i < density; i++) {
      drawingCanvas.graphics
        .setStrokeStyle(60, "round", "round") // Set line thickness and end caps
        .beginStroke("rgba(0,0,0,0.2)")
        .moveTo(midPoint.x, midPoint.y)
        .curveTo(oldPt.x, oldPt.y, oldMidPt.x, oldMidPt.y);
    }

    oldPt = { x: adjustedPos.x, y: adjustedPos.y };
    oldMidPt = midPoint;

    // Update the cache of the drawing canvas with the new graphics
    drawingCanvas.updateCache("source-over");

    maskFilter = new AlphaMaskFilter(drawingCanvas.cacheCanvas);
    bitmap.filters = [maskFilter];
    bitmap.updateCache();

    // Update the stage to render the new drawings
    stage.update();
  }

  /**
   * Event handler for when the mouse button is released
   */
  function handleMouseUp() {
    // Set the drawing flag to false
    isDrawing = false;

    const adjustedPos = getAdjustedMousePosition();

    // Create a raindrop at the current mouse position
    createRaindrop(adjustedPos.x, adjustedPos.y);

    // Iterate through all saved points and create raindrops at each position
    savedPoints.forEach((point) => {
      createRaindrop(point.x, point.y);
    });

    // Clear the saved points array as they have been processed
    savedPoints = [];

    // If an interval was set for saving points, clear it to stop saving
    if (intervalId) {
      clearInterval(intervalId);
      intervalId = null;
    }
  }

  /**
   * Function to create a raindrop shape at a specified position
   * @param {number} x - The x-coordinate for the raindrop
   * @param {number} y - The y-coordinate for the raindrop
   */
  function createRaindrop(x, y) {
    let rad = 25; // Initial radius of the raindrop

    let raindrop = new Shape();
    raindrop.graphics.drawCircle(0, 0, rad);
    raindrop.x = x;
    raindrop.y = y;
    stage.addChild(raindrop);

    // Add the raindrop to the raindrops array for tracking
    raindrops.push(raindrop);
    raindrop.radius = rad;

    // Create a tween animation for the raindrop's movement and scaling
    Tween.get(raindrop)
      .to({ y: y + 30, radius: rad * 0.7 }, 500, Ease.cubicOut) // Move down and shrink
      .to(
        {
          y: y + (20 + Math.random() * 50),
          radius: rad * (0.5 + Math.random() * 0.1),
        },
        1000,
        Ease.quadOut
      )
      .to(
        {
          y: canvas.height * (0.1 + Math.random() * 0.5) + y,
          radius: rad * (0.35 + Math.random() * 0.15),
        },
        6000,
        Ease.linear
      )
      .call(() => {
        const currentY = raindrop.y;
        Tween.get(raindrop).to(
          { y: currentY + 30, radius: rad * 0.5 },
          1000,
          Ease.linear
        );
      });

    // Add an event listener to update the raindrop mask on each tick
    createjs.Ticker.addEventListener("tick", updateRaindropMask);
  }

  /**
   * Function to update the mask for all raindrops, creating a ripple effect
   */
  function updateRaindropMask() {
    // Iterate through each raindrop in the array
    raindrops.forEach((raindrop) => {
      drawingCanvas.graphics
        .beginFill("rgba(0,0,0,1)")
        .drawCircle(raindrop.x, raindrop.y, raindrop.radius);
      // Clear any previous drawings on the drawing canvas
      drawingCanvas.graphics.clear();
      // Begin a new fill with solid black
      drawingCanvas.graphics
        .beginFill("rgba(0,0,0,1)")
        .drawCircle(raindrop.x, raindrop.y, raindrop.radius);

      // Update the cache of the drawing canvas with the new raindrop shape
      drawingCanvas.updateCache("source-over");
      maskFilter = new AlphaMaskFilter(drawingCanvas.cacheCanvas);
      bitmap.filters = [maskFilter];
      bitmap.updateCache();
    });

    // Update the stage to render the changes
    stage.update();
  }
}
