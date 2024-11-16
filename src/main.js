import App from "./app.js";
import { makeItRain } from "./rainBg.js";

document.addEventListener("DOMContentLoaded", () => {
  const startButton = document.getElementById("start-button");
  const initialContainer = document.getElementById("initial-container");
  const mainContent = document.getElementById("mainCanvas");
  let rainRow1 = document.querySelector(".start-row1");
  let rainRow2 = document.querySelector(".start-row2");
  let rainRow3 = document.querySelector(".start-row3");
  const backgroundMusic = document.getElementById("background-music");
  const speakerButton = document.getElementById("speaker-button");
  const speakerIcon = document.getElementById("speaker-icon");

  makeItRain();

  let isMusicPlaying = false;
  startButton.addEventListener("click", () => {
    initialContainer.remove();

    mainContent.style.display = "block";

    if (rainRow1) rainRow1.remove();
    if (rainRow2) rainRow2.remove();
    if (rainRow3) rainRow3.remove();

    App();

    isMusicPlaying = true;
    if (isMusicPlaying) {
      backgroundMusic
        .play()
        .then(() => {
          updateSpeakerIcon();
        })
        .catch((error) => {
          console.log("music playing error:", error);
        });
    } else {
      backgroundMusic.pause();
      updateSpeakerIcon();
    }
  });

  speakerButton.addEventListener("click", () => {
    if (isMusicPlaying) {
      backgroundMusic.pause();
      isMusicPlaying = false;
    } else {
      backgroundMusic.play().catch((error) => {
        console.log("music playing error:", error);
      });
      isMusicPlaying = true;
    }
    localStorage.setItem("isMusicPlaying", isMusicPlaying);
    updateSpeakerIcon();
  });

  function updateSpeakerIcon() {
    if (isMusicPlaying) {
      speakerIcon.src = "/speaker-2-svgrepo-com.svg";
      speakerIcon.alt = "Playing";
      speakerButton.setAttribute("aria-pressed", "true");
    } else {
      speakerIcon.src = "/speaker-disabled-svgrepo-com.svg";
      speakerIcon.alt = "Paused";
      speakerButton.setAttribute("aria-pressed", "false");
    }
  }

  backgroundMusic.addEventListener("play", () => {
    isMusicPlaying = true;
    localStorage.setItem("isMusicPlaying", isMusicPlaying);
    updateSpeakerIcon();
  });

  backgroundMusic.addEventListener("pause", () => {
    isMusicPlaying = false;
    localStorage.setItem("isMusicPlaying", isMusicPlaying);
    updateSpeakerIcon();
  });

  updateSpeakerIcon();
});
