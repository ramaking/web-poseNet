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
let rec; // 스트림을 기반으로 동작하는 mediarecorder 객체
let blobs;
let blob; // 데이터
let angle;
let stream; // 통합
let voiceStream; // 오디오스트림
let desktopStream; // 비디오스트림

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

const mergeAudioStreams = (desktopStream, voiceStream) => {
  // 비디오, 오디오스트림 연결
  const context = new AudioContext();
  const destination = context.createMediaStreamDestination();
  let hasDesktop = false;
  let hasVoice = false;
  if (desktopStream && desktopStream.getAudioTracks().length > 0) {
    const source1 = context.createMediaStreamSource(desktopStream);
    const desktopGain = context.createGain();
    desktopGain.gain.value = 0.7;
    source1.connect(desktopGain).connect(destination);
    hasDesktop = true;
  }

  if (voiceStream && voiceStream.getAudioTracks().length > 0) {
    const source2 = context.createMediaStreamSource(voiceStream);
    const voiceGain = context.createGain();
    voiceGain.gain.value = 0.7;
    source2.connect(voiceGain).connect(destination);
    hasVoice = true;
  }

  return hasDesktop || hasVoice ? destination.stream.getAudioTracks() : [];
};

// "녹화시작" 버튼 이벤트 처리
btn_start.onclick = async (event) => {
  console.log(123);
  // 캔버스 영역 화면을 스트림으로 취득
  desktopStream = canvas.captureStream();
  voiceStream = await navigator.mediaDevices.getUserMedia({
    video: false,
    audio: true,
  }); // 오디오스트림 생성

  console.log(1231);

  const tracks = [
    ...desktopStream.getVideoTracks(),
    ...mergeAudioStreams(desktopStream, voiceStream),
  ];

  stream = new MediaStream(tracks);

  blobs = [];

  console.log(123123);

  rec = new MediaRecorder(stream, { mimeType: "video/webm; codecs=vp9,opus" }); // mediaRecorder객체 생성
  rec.ondataavailable = (e) => blobs.push(e.data);

  rec.onstop = async () => {
    blob = new Blob(blobs, { type: "video/webm" });
    let url = window.URL.createObjectURL(blob);

    // 다운로드 구현
    const $anchor = document.createElement("a"); // 앵커 태그 생성
    document.body.appendChild($anchor);
    $anchor.style.display = "none";
    $anchor.href = url; // 다운로드 경로 설정
    $anchor.download = "test.webm"; // 파일명 설정
    $anchor.click(); // 앵커 클릭

    // download.href = url;
    // download.download = "test.webm";
    // download.style.display = "block";
  };

  rec.start(); // 녹화 시작
};

btn_stop.onclick = () => {
  // 종료 버튼을 누른 경우

  rec.stop(); // 화면녹화 종료 및 녹화된 영상 다운로드

  // desktopStream.getTracks().forEach((s) => s.stop());
  // voiceStream.getTracks().forEach((s) => s.stop());
  // desktopStream = null;
  // voiceStream = null;
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
