const startButton = document.getElementById('start-button');
const gameArea = document.getElementById('game-area');
const timerElement = document.getElementById('timer');
const resultElement = document.getElementById('result');
const photoModal = document.getElementById('photo-modal');
const video = document.getElementById('video');
const canvas = document.getElementById('canvas');
const captureButton = document.getElementById('capture-button');

let currentNumber = 30;
let startTime;
let timerInterval;
let activeCircles = [];
let pausedTime = 0; // Час паузи в мілісекундах
let photoStartTime;
let photoEndTime;
let photoTime;
let photoData;
let videoStream;
let randomPhotoNumber;

function startGame() {
  startButton.style.display = 'none';
  gameArea.style.display = 'block';
  currentNumber = 30;
  randomPhotoNumber = getRandomNumber(10, 20);
  startTime = new Date().getTime(); // Початковий час в мілісекундах
  timerInterval = setInterval(updateTimer, 100);
  createInitialCircles();
}

function getRandomNumber(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function updateTimer() {
  const now = new Date().getTime(); // Поточний час в мілісекундах
  const elapsedTime = now - startTime - pausedTime;
  const minutes = String(Math.floor(elapsedTime / 60000)).padStart(2, '0');
  const seconds = String(Math.floor((elapsedTime % 60000) / 1000)).padStart(
    2,
    '0'
  );
  const milliseconds = String(elapsedTime % 1000).padStart(3, '0');
  timerElement.textContent = `${minutes}:${seconds}:${milliseconds}`;
}

function createInitialCircles() {
  for (let i = 0; i < 5; i++) {
    createCircle(currentNumber - i);
  }
}

function createCircle(number) {
  const circle = document.createElement('div');
  circle.className = 'circle';
  circle.textContent = number;
  circle.style.top = `${Math.random() * 70}vh`;
  circle.style.left = `${Math.random() * 75}vw`;
  circle.style.zIndex = number; // Set z-index to the circle's number
  circle.addEventListener('click', () => handleCircleClick(circle, number));
  gameArea.appendChild(circle);
  activeCircles.push(circle);
}

function handleCircleClick(circle, number) {
  if (number === currentNumber) {
    if (number === randomPhotoNumber) {
      pauseGameForPhoto();
    } else {
      continueGameAfterPhoto(circle, number);
    }
  }
}

function continueGameAfterPhoto(circle, number) {
  gameArea.removeChild(circle);
  activeCircles = activeCircles.filter((c) => c !== circle);
  currentNumber--;
  if (currentNumber > 0) {
    if (currentNumber >= 5) {
      createCircle(currentNumber - 4);
    }
  } else {
    endGame();
  }
}

function pauseGameForPhoto() {
  clearInterval(timerInterval);
  photoStartTime = new Date().getTime(); // Початковий час фотографування в мілісекундах
  photoModal.style.display = 'flex';
  navigator.mediaDevices
    .getUserMedia({ video: true })
    .then((stream) => {
      video.srcObject = stream;
      videoStream = stream;
      video.play();
    })
    .catch((error) => {
      console.error('Error accessing media devices.', error);
      alert(
        'Не вдалося отримати доступ до камери. Перевірте дозволи та спробуйте ще раз.'
      );
    });
}

captureButton.addEventListener('click', () => {
  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;
  canvas.getContext('2d').drawImage(video, 0, 0);
  photoEndTime = new Date().getTime(); // Час завершення фотографування в мілісекундах
  photoTime = photoEndTime - photoStartTime; // Час на фото в мілісекундах
  photoData = canvas.toDataURL('image/png');
  photoModal.style.display = 'none';
  if (videoStream) {
    videoStream.getTracks().forEach((track) => track.stop());
  }
  pausedTime += photoTime; // Додаємо час фото до часу паузи
  timerInterval = setInterval(updateTimer, 100);
  const remainingCircle = activeCircles.find(
    (c) => c.textContent == currentNumber
  );
  continueGameAfterPhoto(remainingCircle, currentNumber);
});

function endGame() {
  clearInterval(timerInterval);
  gameArea.style.display = 'none';
  timerElement.style.display = 'none';
  resultElement.style.display = 'flex';

  const testTimeSeconds = calculateTimeInSeconds(timerElement.textContent);
  const photoTimeSeconds = Math.floor(photoTime / 1000);

  let resultText;
  if (testTimeSeconds < 30 && photoTimeSeconds < 6) {
    resultText =
      '<span style="color: green; font-weight: bold;">успішно</span>';
  } else {
    resultText =
      '<span style="color: red; font-weight: bold;">не пройдено</span>';
  }

  resultElement.innerHTML = `<p>Результат тесту: ${timerElement.textContent}</p> <p>Час на фото: ${photoTimeSeconds} сек</p> <p>${resultText}</p> <img src="${photoData}" alt="Фото"  style ="max-height:30vh; max-width: 90vw;">`;
}

function calculateTimeInSeconds(timerText) {
  const [minutes, seconds, miliseconds] = timerText.split(':').map(Number);
  return minutes * 60 + seconds;
}

startButton.addEventListener('click', startGame);
