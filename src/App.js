import { useState, useRef } from "react";
// import { useReactMediaRecorder } from "react-media-recorder";
import { useReactMediaRecorder } from "react-media-recorder-2";
import "./App.css";
import languages from "./languages";
import audioToText from "./api.js";

function App() {
  const [fileLink, setFileLink] = useState("");
  const [meetingTitle, setMeetingTitle] = useState("");
  const [sections, setSections] = useState([]);
  const fileInputRef = useRef(null);
  const [language, setLanguage] = useState("en");
  const [recording, setRecording] = useState(false);
  const { status, startRecording, stopRecording, mediaBlobUrl } =
    useReactMediaRecorder({ audio: true });

  const blobToAudio = async (mediaBlobUrl) => {
    const audioBlob = await fetch(mediaBlobUrl).then((r) => r.blob());
    const audioFile = new File([audioBlob], "voice.wav", { type: "audio/wav" });
    return audioFile;
  };
  const transcribeAudio = async function (audio, language) {
    const summaryChapters = await audioToText(audio);
    if (!summaryChapters) return;
    setMeetingTitle(summaryChapters[0]?.gist);
    const newSections = summaryChapters.map((chapter, index) => (
      <Section
        key={index}
        details={{
          title: index === 0 ? "Introduction" : chapter.headline,
          description: chapter.summary,
        }}
      />
    ));
    setSections(newSections);
  };

  const handleButtonClick = () => {
    fileInputRef.current.click();
  };

  const handleFileChange = async (event) => {
    const selectedFile = event.target.files[0];
    if (!selectedFile) {
      alert("Please select a file.");
      return;
    }
    console.log(selectedFile);
    transcribeAudio(selectedFile);
  };

  const handleSubmit = async function (e) {
    e.preventDefault();
    transcribeAudio(fileLink);
  };

  return (
    <div className="main-container">
      <div className="container">
        <div className="options">
          <div className="header">
            <img src="logo.png" alt="logo" className="header-logo" />
            <h2 className="heading">MidyAI Notetaker</h2>
          </div>
          <div className="language">
            <select
              name="input-language"
              id="language"
              value={language}
              onChange={(e) => {
                setLanguage(e.target.value);
              }}
            >
              {languages.map((language) => (
                <option value={language.code} key={language.no}>
                  {language.name}
                </option>
              ))}
            </select>
            <div>
              <button
                className={`btn record ${recording ? "recording" : ""}`}
                onClick={() => {
                  if (!recording) startRecording();
                  else stopRecording();
                  setRecording((rec) => !rec);
                }}
              >
                <div className="icon">
                  <ion-icon name="mic-outline"></ion-icon>
                  <img src="bars.svg" alt="" />
                </div>
                <p>{recording ? "Listening" : "Start Listening"}</p>
              </button>
            </div>
          </div>
          <audio
            src={mediaBlobUrl}
            onCanPlay={async () => {
              // console.log(mediaBlobUrl);
              const audioObj = await blobToAudio(mediaBlobUrl);
              // console.log(audioObj);
              transcribeAudio(audioObj, language);
            }}
          />
          <form className="link-to-text" onSubmit={handleSubmit}>
            <input
              type="url"
              name="audio"
              id="audio-link"
              placeholder="https://www.example.com/demo-file.mp4"
              value={fileLink}
              onChange={(e) => {
                setFileLink(e.target.value);
              }}
            />
            <button className="btn convert">
              <p>Convert</p>
            </button>
          </form>
          <input
            type="file"
            accept="audio/*,video/*"
            ref={fileInputRef}
            style={{ display: "none" }}
            onChange={handleFileChange}
          />
          <button
            className="btn audio-file-to-text"
            onClick={handleButtonClick}
          >
            <div className="icon">
              <ion-icon name="cloud-upload-outline"></ion-icon>
            </div>
            <p>Upload a MP3/MP4 File</p>
          </button>
        </div>
      </div>
      <div className="notes">
        <div className="buttons">
          <button className="btn download" disabled>
            <ion-icon name="cloud-download-outline"></ion-icon>
            <p>Download Note</p>
          </button>
          <img src="logo.png" alt="logo" className="logo" />
          <button
            className="btn clear"
            onClick={() => {
              setMeetingTitle("");
              setSections([]);
            }}
          >
            <ion-icon name="trash-outline"></ion-icon>
            <p>Clear Note</p>
          </button>
        </div>
        <h1 className="notes-header-title">What note will we take today?</h1>
        <div className="meeting-details">
          {meetingTitle ? <h2>Meeting Summary: {meetingTitle}</h2> : ""}
          {sections}
        </div>
      </div>
    </div>
  );
}

const Section = function ({ details }) {
  return (
    <div className="section-details">
      <h2>{details.title}:</h2>
      <p>{details.description}</p>
    </div>
  );
};

export default App;
