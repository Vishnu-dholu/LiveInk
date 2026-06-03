import protobuf from "protobufjs";
import fs from "fs";

const root = new protobuf.Root();
root.loadSync("src/proto/drawing.proto");

const json = JSON.stringify(root.toJSON(), null, 2);
fs.writeFileSync("src/proto/drawing.json", json);
console.log("Successfully compiled drawing.proto to drawing.json");
