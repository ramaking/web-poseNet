// posenet.js

const video = document.getElementById("video");
const canvas = document.getElementById("canvas");
const context = canvas.getContext("2d");

const btn_start = document.querySelector("#btn_start");
const btn_stop = document.querySelector("#btn_stop");
const video_recorded = document.querySelector("#video_recorded");

// MediaRecorder(녹화기) 변수 선언
let mediaRecorder = null;

// 스트림 데이터를 담아둘 배열 생성
const arrVideoData = [];

//webcam을 enable하는 코드
navigator.mediaDevices
  .getUserMedia({ video: true, audio: false })
  .then(function (stream) {
    video.srcObject = stream;
  });

let temp;

let cx, cy, x1, x2, y1, y2;

let angle;

//then 안쪽이 function(model){} 이렇게 쓰는거랑 같다 (인자가 하나라 중괄호가 없는 것)
posenet.load().then((model) => {
  // 이곳의 model과 아래 predict의 model은 같아야 한다.
  video.onloadeddata = (e) => {
    //비디오가 load된 다음에 predict하도록. (안하면 콘솔에 에러뜸)
    predict();
  };

  function predict() {
    //frame이 들어올 때마다 estimate를 해야하니 함수화 시킴
    model.estimateSinglePose(video, 0.5, false, 8).then((pose) => {
      canvas.width = video.width; //캔버스와 비디오의 크기를 일치시킴
      canvas.height = video.height;

      context.drawImage(video, 0, 0, video.width, video.height);

      temp = pose;

      cx = (pose.keypoints[5].position.x + pose.keypoints[6].position.x) / 2;
      cy = (pose.keypoints[5].position.y + pose.keypoints[6].position.y) / 2;

      x1 = pose.keypoints[5].position.x;
      y1 = pose.keypoints[5].position.y;

      x2 = pose.keypoints[0].position.x;
      y2 = pose.keypoints[0].position.y;

      angle =
        (Math.atan((y2 - cy) / (x2 - cx)) * 180) / Math.PI -
        (Math.atan((y1 - cy) / (x1 - cx)) * 180) / Math.PI;

      context.fillText(Math.ceil(angle), cx + 30, cy - 30);

      //   console.log(angle);

      drawKeypoints(pose.keypoints, 0.6, context); //정확도
      drawSkeleton(pose.keypoints, 0.6, context);
    });
    requestAnimationFrame(predict); //frame이 들어올 때마다 재귀호출
  }
});

// "녹화시작" 버튼 이벤트 처리
btn_start.onclick = (event) => {
  // 캔버스 영역 화면을 스트림으로 취득
  const mediaStream = canvas.captureStream();

  // MediaRecorder(녹화기) 객체 생성
  mediaRecorder = new MediaRecorder(mediaStream);

  // MediaRecorder.dataavailable 이벤트 처리
  mediaRecorder.ondataavailable = (event) => {
    // 스트림 데이터(Blob)가 들어올 때마다 배열에 담아둔다.
    arrVideoData.push(event.data);
  };

  // MediaRecorder.stop 이벤트 처리
  mediaRecorder.onstop = (event) => {
    // 들어온 스트림 데이터들(Blob)을 통합한 Blob객체를 생성
    const blob = new Blob(arrVideoData);

    // BlobURL 생성: 통합한 스트림 데이터를 가르키는 임시 주소를 생성
    const blobURL = window.URL.createObjectURL(blob);

    // // 재생 구현
    // video_recorded.src = blobURL;
    // video_recorded.play();

    // 다운로드 구현
    const $anchor = document.createElement("a"); // 앵커 태그 생성
    document.body.appendChild($anchor);
    $anchor.style.display = "none";
    $anchor.href = blobURL; // 다운로드 경로 설정
    $anchor.download = "test.webm"; // 파일명 설정
    $anchor.click(); // 앵커 클릭

    // 배열 초기화
    arrVideoData.splice(0);
  };

  // 녹화 시작
  mediaRecorder.start();
};

// "녹화종료" 버튼 이벤트 처리
btn_stop.onclick = (event) => {
  // 녹화 중단!
  mediaRecorder.stop();
};

/* PoseNet을 쓰면서 사용하는 함수들 코드 - 그냥 복사해서 쓰기*/

//tensorflow에서 제공하는 js 파트
const color = "aqua";
const boundingBoxColor = "red";
const lineWidth = 2;

function toTuple({ y, x }) {
  return [y, x];
}

function drawPoint(ctx, y, x, r, color) {
  ctx.beginPath();
  ctx.arc(x, y, r, 0, 2 * Math.PI);
  ctx.fillStyle = color;
  ctx.fill();
}

function drawSegment([ay, ax], [by, bx], color, scale, ctx) {
  ctx.beginPath();
  ctx.moveTo(ax * scale, ay * scale);
  ctx.lineTo(bx * scale, by * scale);
  ctx.lineWidth = lineWidth;
  ctx.strokeStyle = color;
  ctx.stroke();
}

function drawSkeleton(keypoints, minConfidence, ctx, scale = 1) {
  const adjacentKeyPoints = posenet.getAdjacentKeyPoints(
    keypoints,
    minConfidence
  );

  adjacentKeyPoints.forEach((keypoints) => {
    drawSegment(
      toTuple(keypoints[0].position),
      toTuple(keypoints[1].position),
      color,
      scale,
      ctx
    );
  });
}

function drawKeypoints(keypoints, minConfidence, ctx, scale = 1) {
  for (let i = 0; i < keypoints.length; i++) {
    const keypoint = keypoints[i];

    if (keypoint.score < minConfidence) {
      continue;
    }

    const { y, x } = keypoint.position;
    drawPoint(ctx, y * scale, x * scale, 3, color);
  }
}

function drawBoundingBox(keypoints, ctx) {
  const boundingBox = posenet.getBoundingBox(keypoints);

  ctx.rect(
    boundingBox.minX,
    boundingBox.minY,
    boundingBox.maxX - boundingBox.minX,
    boundingBox.maxY - boundingBox.minY
  );

  ctx.strokeStyle = boundingBoxColor;
  ctx.stroke();
}
