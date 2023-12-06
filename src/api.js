import { AssemblyAI } from "assemblyai";
const client = new AssemblyAI({
  apiKey: process.env.REACT_APP_KEY,
});

const audioToText = async function (fileUrl) {
  // Request parameters
  const data = {
    audio_url: fileUrl,
    auto_chapters: true,
  };

  const transcript = await client.transcripts.create(data);
  return transcript.chapters;
};
export default audioToText;
