import { AssemblyAI } from "assemblyai";

const client = new AssemblyAI({
  apiKey: process.env.REACT_APP_KEY,
});

const audioToText = async function (fileUrl, language = "en") {
  // Request parameters
  const params = {
    audio: fileUrl,
    language_code: language,
    auto_chapters: true,
  };

  const transcript = await client.transcripts.transcribe(params);
  console.log(transcript);
  return transcript.chapters;
};

export default audioToText;
