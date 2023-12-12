import { AssemblyAI } from "assemblyai";

const client = new AssemblyAI({
  apiKey: process.env.REACT_APP_KEY,
});

const audioToText = async function (fileUrl, language = "en", type) {
  // Request parameters
  const params = {
    audio: fileUrl,
    language_code: language,
    auto_chapters: type === "summary" ? true : false,
  };

  const transcript = await client.transcripts.transcribe(params);
  // console.log(transcript);
  // console.log(transcript.text);

  if (params.auto_chapters) return transcript.chapters;
  else return transcript.text;
};

export default audioToText;
