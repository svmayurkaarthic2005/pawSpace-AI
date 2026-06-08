export function decodePolyline(encoded: string): Array<{ latitude: number; longitude: number }> {
  let index = 0;
  let lat = 0;
  let lng = 0;
  const result: Array<{ latitude: number; longitude: number }> = [];

  while (index < encoded.length) {
    let b: number;
    let shift = 0;
    let result_val = 0;

    do {
      b = encoded.charCodeAt(index++) - 63;
      result_val |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 32);

    lat += (result_val & 1) !== 0 ? ~(result_val >> 1) : result_val >> 1;

    shift = 0;
    result_val = 0;

    do {
      b = encoded.charCodeAt(index++) - 63;
      result_val |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 32);

    lng += (result_val & 1) !== 0 ? ~(result_val >> 1) : result_val >> 1;

    result.push({ latitude: lat / 1e5, longitude: lng / 1e5 });
  }

  return result;
}
