# 웹 캠으로 모션인식

- 웹 캠을 받아오고 순간순간 캡쳐를 진행하고 poseNet 을 호출
- postNet은 점 데이터를 반환
- 점 데이터에 맞춰 실제 점을 찍고 일부 선들을 이음
- 이 과정을 canvas 단위로 녹화

- 추후에 canvas에 동영상 플레이어를 탑재하고 같이 녹화 예정
  https://lts0606.tistory.com/588
  https://developer.mozilla.org/ko/docs/Web/API/Canvas_API/Manipulating_video_using_canvas


스테레오 믹스 활성화 필요

![image](https://github.com/ramaking/web-poseNet/assets/58355046/aca8edbb-ae3f-44a1-8d48-369ddda21cbf)

연결된 디바이스 인가 요청
```
await navigator.mediaDevices.getUserMedia({ audio: true, video: true })
```
![image](https://github.com/ramaking/web-poseNet/assets/58355046/f1841a5a-a82e-4ed7-8602-264648445a52)


연결된 디바이스 출력
```
navigator.mediaDevices.enumerateDevices();
```
![image](https://github.com/ramaking/web-poseNet/assets/58355046/a3a1604c-7e4a-4d6b-972a-1ab11e86985f)

.
