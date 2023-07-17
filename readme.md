# 웹 캠으로 모션인식

- 웹 캠을 받아오고 순간순간 캡쳐를 진행하고 poseNet 을 호출
- postNet은 점 데이터를 반환
- 점 데이터에 맞춰 실제 점을 찍고 일부 선들을 이음
- 이 과정을 canvas 단위로 녹화

- 추후에 canvas에 동영상 플레이어를 탑재하고 같이 녹화 예정
  https://lts0606.tistory.com/588
  https://developer.mozilla.org/ko/docs/Web/API/Canvas_API/Manipulating_video_using_canvas
