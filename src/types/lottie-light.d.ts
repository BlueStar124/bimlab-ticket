// lottie-web ships the light ESM build without its own typings; it has the same API as the full player.
declare module 'lottie-web/build/player/esm/lottie_light.min.js' {
  import lottie from 'lottie-web';
  export default lottie;
}
