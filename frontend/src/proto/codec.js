import protobuf from 'protobufjs/light';
import drawingDescriptor from './drawing.json';

const root = protobuf.Root.fromJSON(drawingDescriptor);

export function encode(messageType, payload) {
  try {
    const Type = root.lookupType(`drawing.${messageType}`);
    const message = Type.create(payload);
    return Type.encode(message).finish(); // Returns Uint8Array
  } catch (err) {
    console.error(`Protobuf encode error for ${messageType}:`, err);
    return null;
  }
}

export function decode(messageType, buffer) {
  try {
    const Type = root.lookupType(`drawing.${messageType}`);
    // Socket.io sends binary as ArrayBuffer in browser, Uint8Array wrapper might be needed
    const data = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);
    const message = Type.decode(data);
    return Type.toObject(message, {
      defaults: true,
      arrays: true,
      objects: true,
    });
  } catch (err) {
    console.error(`Protobuf decode error for ${messageType}:`, err);
    return null;
  }
}
