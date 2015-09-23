Shader "Mobile/Background" {
Properties {
 _MainTex ("Base (RGB)", 2D) = "white" {}
}
SubShader { 
 Pass {
  Tags { "QUEUE"="Background" }
  ZWrite Off
  Fog { Mode Off }
  SetTexture [_MainTex] { combine texture }
 }
}
}